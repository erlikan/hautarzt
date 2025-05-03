# Filename: generate_city_suggestions.py

import os
import json
import sys
import collections

import psycopg2 # pip install psycopg2-binary
from dotenv import load_dotenv # pip install python-dotenv

# --- Load Configuration ---
load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_DB_URL")
OUTPUT_FILE = "frontend/public/data/city-suggestions.json"

if not DATABASE_URL:
    print("Error: SUPABASE_DB_URL environment variable not set.")
    print("Please set it, e.g., in a .env file:")
    print("SUPABASE_DB_URL=postgresql://postgres:YourPassword@db.yourproject.supabase.co:5432/postgres")
    sys.exit(1)

# --- SQL Query ---
# Fetches distinct combinations of city, slug, and postal code for active practices
# Assumes city_slug is reliably populated (e.g., by generate_slugs.py)
QUERY = """
SELECT DISTINCT
    city_slug,
    city,
    postal_code
FROM
    praxis
WHERE
    business_status = 'OPERATIONAL' AND -- Use business_status instead of is_active
    city_slug IS NOT NULL AND TRIM(city_slug) <> '' AND
    city IS NOT NULL AND TRIM(city) <> '' AND
    postal_code IS NOT NULL AND TRIM(postal_code) <> ''
ORDER BY
    city, postal_code;
"""

# --- Main Logic ---
def generate_suggestions():
    conn = None
    suggestions = []
    # Use a set to efficiently track unique city suggestions
    unique_city_suggestions = set()

    try:
        print("Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Connection successful.")

        print("Fetching practice location data...")
        cur.execute(QUERY)
        results = cur.fetchall()
        print(f"Found {len(results)} distinct PLZ/City combinations for active practices.")

        print("Processing data and generating suggestions...")
        for city_slug, city_name, postal_code in results:
            # Ensure data is clean
            if not all([city_slug, city_name, postal_code]):
                print(f"Warning: Skipping row with missing data (Slug: {city_slug}, City: {city_name}, PLZ: {postal_code})")
                continue

            city_slug = city_slug.strip()
            city_name = city_name.strip()
            postal_code = postal_code.strip()

            # 1. Add unique City suggestion (if not already added)
            city_tuple = (city_slug, city_name)
            if city_tuple not in unique_city_suggestions:
                suggestions.append({"value": city_name, "slug": city_slug})
                unique_city_suggestions.add(city_tuple)

            # 2. Add PLZ + City suggestion
            plz_value = f"{postal_code} {city_name}"
            suggestions.append({"value": plz_value, "slug": city_slug})

        print(f"Generated {len(suggestions)} total suggestions (including cities and PLZs)." )

        # Sort alphabetically by the displayed value
        print("Sorting suggestions...")
        suggestions.sort(key=lambda x: x['value'])

        # Ensure output directory exists
        output_dir = os.path.dirname(OUTPUT_FILE)
        os.makedirs(output_dir, exist_ok=True)

        # Write to JSON file
        print(f"Writing suggestions to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(suggestions, f, ensure_ascii=False, indent=2)

        print("Successfully generated city suggestions JSON file.")

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"An error occurred: {error}")
    finally:
        if conn:
            cur.close()
            conn.close()
            print("Database connection closed.")

# --- Run Script ---
if __name__ == "__main__":
    print(f"This script will query the database and overwrite:")
    print(f"  {OUTPUT_FILE}")
    confirm = input("Do you want to proceed? (yes/no): ")
    if confirm.lower() == 'yes':
        generate_suggestions()
    else:
        print("Operation cancelled by user.") 