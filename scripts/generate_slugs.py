# Filename: generate_slugs.py

import os
import re
import sys
from collections import defaultdict

import psycopg2 # pip install psycopg2-binary
from psycopg2.extras import execute_batch
from slugify import slugify # pip install python-slugify
from dotenv import load_dotenv # pip install python-dotenv

# --- Load Configuration ---
# Load environment variables from a .env file if it exists
load_dotenv()

# Get the database connection URL from environment variables
# FORMAT: postgresql://postgres:[YOUR-PASSWORD]@[YOUR-DB-HOST]:[PORT]/postgres
DATABASE_URL = os.getenv("SUPABASE_DB_URL")

if not DATABASE_URL:
    print("Error: SUPABASE_DB_URL environment variable not set.")
    print("Please set it, e.g., in a .env file:")
    print("SUPABASE_DB_URL=postgresql://postgres:YourPassword@db.yourproject.supabase.co:5432/postgres")
    sys.exit(1)

# --- Slug Generation Function ---
def generate_unique_slug(name, zone_key, existing_slugs_in_zone):
    """
    Generates a unique slug for a given name within a zone (e.g., postal code).

    Args:
        name (str): The name to slugify.
        zone_key (str): The key representing the uniqueness zone (e.g., postal_code).
        existing_slugs_in_zone (set): A set of slugs already used in this zone.

    Returns:
        str: A unique slug.
    """
    if not name:
        # Handle cases with no name - maybe use a placeholder or skip
        # For now, let's generate a placeholder based on a prefix
        # If you have google_place_id available here, you could use part of it
        base_slug = "unbekannte-praxis"
        print(f"Warning: Praxis name is missing. Using fallback base '{base_slug}'.")
    else:
        # Generate base slug using python-slugify
        # Replacements handle German characters specifically
        base_slug = slugify(
            name,
            replacements=[['ä', 'ae'], ['ö', 'oe'], ['ü', 'ue'], ['ß', 'ss']],
            word_boundary=True, # Helps separate words like "Dr.Müller" -> "dr-mueller"
            separator='-'
            )

    # Further clean-up (slugify usually handles this, but belt-and-suspenders)
    base_slug = re.sub(r'-+', '-', base_slug) # Replace multiple hyphens with one
    base_slug = base_slug.strip('-') # Remove leading/trailing hyphens

    if not base_slug:
        # If the name consisted only of removable characters
        base_slug = "praxis" # Basic fallback
        print(f"Warning: Could not generate meaningful slug for '{name}'. Using fallback base '{base_slug}'.")


    # Ensure uniqueness within the zone
    final_slug = base_slug
    counter = 2
    while final_slug in existing_slugs_in_zone:
        final_slug = f"{base_slug}-{counter}"
        counter += 1

    return final_slug

# --- Main Logic ---
def generate_and_update_slugs():
    conn = None
    updated_count = 0
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Connection successful.")

        # Dictionary to hold existing slugs, keyed by zone
        # Key: zone_key (e.g., postal_code or city), Value: Set of slugs
        slugs_in_zone = defaultdict(set)

        # --- Pre-load existing slugs to ensure uniqueness across runs ---
        print("Pre-loading existing slugs...")
        cur.execute("SELECT COALESCE(postal_code, city, 'global'), slug FROM praxis WHERE slug IS NOT NULL")
        existing_count = 0
        for row in cur.fetchall():
            zone, existing_slug = row
            # Use postal_code if available, otherwise city, otherwise a global zone
            zone_key = zone if zone else 'global'
            slugs_in_zone[zone_key].add(existing_slug)
            existing_count += 1
        print(f"Pre-loaded {existing_count} existing slugs across {len(slugs_in_zone)} zones.")

        # --- Fetch practices that need a slug ---
        print("Fetching practices without slugs (or with potentially conflicting names)...")
        # Fetch all practices to ensure uniqueness checks work correctly,
        # but we only update those where slug IS NULL initially.
        # Alternatively, fetch only those with slug IS NULL if you are sure no existing slugs need changing.
        cur.execute("""
            SELECT google_place_id, name, city, postal_code, slug
            FROM praxis
            ORDER BY postal_code, city, name -- Process in a predictable order
        """)
        practices = cur.fetchall()
        print(f"Fetched {len(practices)} total practices.")

        update_data = [] # List to store (slug, google_place_id) for batch update

        print("Generating slugs...")
        processed_count = 0
        needs_update_count = 0
        for google_place_id, name, city, postal_code, current_slug in practices:
            processed_count += 1
            if processed_count % 100 == 0:
                print(f"  Processed {processed_count}/{len(practices)}...")

            # Define the uniqueness zone - prefer postal code, fallback to city
            zone_key = postal_code if postal_code else (city if city else 'global')

            # Generate the intended slug based on current name and zone
            generated_slug = generate_unique_slug(name, zone_key, slugs_in_zone[zone_key])

            # Add the newly generated slug to the set for this zone *immediately*
            # to prevent duplicates within this run for the same name/zone combo.
            slugs_in_zone[zone_key].add(generated_slug)

            # Only add to update list if the slug is currently NULL or needs changing
            # (e.g., if you wanted to regenerate all slugs, you'd remove `and current_slug is None`)
            if current_slug is None:
                 update_data.append((generated_slug, google_place_id))
                 needs_update_count += 1
            # Optional: Add logic here if you want to update existing slugs under certain conditions

        print(f"Generated slugs. {needs_update_count} practices require updates.")

        if not update_data:
            print("No practices need slug updates.")
            return

        # --- Batch Update ---
        print("Updating database...")
        update_query = "UPDATE praxis SET slug = %s, updated_at = NOW() WHERE google_place_id = %s"
        try:
            execute_batch(cur, update_query, update_data, page_size=500) # page_size can be tuned
            updated_count = cur.rowcount # execute_batch might not update rowcount correctly per call, commit and check later if needed.
            conn.commit() # Commit the transaction
             # Fetch the actual count of updated rows matching the criteria
            cur.execute("SELECT COUNT(*) FROM praxis WHERE google_place_id = ANY(%s)", ([item[1] for item in update_data],))
            actual_updated_count = cur.fetchone()[0]
            print(f"Successfully committed updates for {actual_updated_count} practices (target was {len(update_data)}).")
            if actual_updated_count != len(update_data):
                 print("Warning: The number of updated rows differs from the number of generated slugs. Check for potential issues.")

        except (Exception, psycopg2.DatabaseError) as batch_error:
            print(f"Error during batch update: {batch_error}")
            print("Rolling back transaction.")
            conn.rollback()
            raise # Re-raise the exception after rollback


    except (Exception, psycopg2.DatabaseError) as error:
        print(f"An error occurred: {error}")
        if conn:
            conn.rollback() # Rollback any changes if error occurred before commit
    finally:
        if conn:
            cur.close()
            conn.close()
            print("Database connection closed.")

# --- Run Script ---
if __name__ == "__main__":
    generate_and_update_slugs()