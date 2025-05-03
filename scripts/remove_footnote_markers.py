import os
import glob
import re

# --- Configuration ---
SERVICE_DIR = "frontend/content/services"
FILE_PATTERN = "*.md"
FOOTNOTE_REGEX = r'\[\^\d+\]' # Matches patterns like [^1], [^2], [^10], etc.

# --- Main Script Logic ---
def remove_footnotes_from_file(filepath):
    """Reads a file, removes footnote markers, and writes it back."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Use re.sub to replace all occurrences of the pattern with an empty string
        cleaned_content, num_replacements = re.subn(FOOTNOTE_REGEX, '', content)

        if num_replacements > 0:
            print(f"Processing {filepath}... Found and removed {num_replacements} markers.")
            # Write the cleaned content back to the file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)
        # else:
            # Optional: print a message if no markers were found
            # print(f"Skipping {filepath}... No markers found.")

    except Exception as e:
        print(f"Error processing file {filepath}: {e}")

def main():
    """Finds all markdown files in the service directory and processes them."""
    target_path = os.path.join(SERVICE_DIR, FILE_PATTERN)
    markdown_files = glob.glob(target_path)

    if not markdown_files:
        print(f"No markdown files found in {SERVICE_DIR}")
        return

    print(f"Found {len(markdown_files)} markdown files in {SERVICE_DIR}.")
    print("Starting footnote marker removal...")

    for md_file in markdown_files:
        remove_footnotes_from_file(md_file)

    print("\nFinished processing files.")
    print("IMPORTANT: Please review the changes made to the files.")

if __name__ == "__main__":
    # Add a small safety confirmation
    confirm = input(f"This script will modify files in '{SERVICE_DIR}' in-place.\nDo you want to proceed? (yes/no): ")
    if confirm.lower() == 'yes':
        main()
    else:
        print("Operation cancelled by user.") 