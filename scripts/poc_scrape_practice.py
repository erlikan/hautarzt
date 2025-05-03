import asyncio
import os
import json
import re
from dotenv import load_dotenv
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
# +++ Adjust deep crawl imports based on documentation examples +++
from crawl4ai.deep_crawling.bfs_strategy import BFSDeepCrawlStrategy
from crawl4ai.deep_crawling.filters import DomainFilter
# Remove DeepCrawlConfig import
# from crawl4ai.deep_crawling import DeepCrawlConfig

# --- Removed crawl4ai LLM strategy imports ---
# from crawl4ai.extraction_strategy import LLMExtractionStrategy
# from crawl4ai.types import create_llm_config

# +++ Added OpenAI library import +++
from openai import OpenAI, OpenAIError

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
TARGET_URLS = [
    # {
    #     "url": "http://www.dermakunze.de/",
    #     "google_place_id": "ChIJ00C5CFARWw8RnwWCtFDNCns"
    # },
    {
        "url": "https://www.hautpraxis-nuernberg.de/",
        "google_place_id": "ChIJc_QFDIx3n0cR4x6HwYiN3t0" # Example ID, replace if known
    }
]
OUTPUT_DIR = "poc_scrape_results"

# Attempt to get the API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- Restore Full Schema ---
EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "practice_name": {"type": "string", "description": "Der Name der Praxis"},
        "services": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name der Dienstleistung (z.B. Hautkrebsvorsorge)"},
                    "description": {"type": "string", "description": "Detaillierte Beschreibung der Dienstleistung, falls im extrahierten Text verfügbar."}
                },
                "required": ["name"]
            },
            "description": "Liste der verschiedenen medizinischen Dienstleistungen, die basierend auf dem Website-Inhalt angeboten werden."
        },
        "contact_details": {
            "type": "object",
            "properties": {
                "address": {"type": "string", "description": "Vollständige Adresse der Praxis"},
                "phone_numbers": {"type": "array", "items": {"type": "string"}, "description": "Liste der gefundenen Telefonnummern"},
                "email": {"type": "string", "description": "Kontakt-E-Mail-Adresse, falls gefunden"}
            },
             "description": "Kontaktinformationen."
        },
        "patient_types": {
            "type": "array",
             "items": {"type": "string"},
             "description": "Akzeptierte Patiententypen (z.B., Privatpatient, Kassenpatient, Selbstzahler), basierend auf expliziten Erwähnungen."
        },
        "doctor_names": {
             "type": "array",
             "items": {"type": "string"},
             "description": "Namen der auf der Seite genannten Ärzte oder Hauptbehandler."
        },
        "online_booking_link": {"type": "string", "description": "URL für die Online-Terminbuchung, falls explizit gefunden.", "format": "uri"},
        "summary": {"type": "string", "description": "Eine kurze Zusammenfassung (1-2 Sätze) des Praxisschwerpunkts oder der Philosophie, basierend *nur* auf dem Website-Inhalt."}
    },
    "required": ["practice_name", "services", "contact_details"] # Core information we definitely want
}

# --- Updated Prompts (Full JSON Extraction, HTML Input) ---
SYSTEM_PROMPT = "Du bist ein Experte für Datenextraktion. Extrahiere Informationen aus dem bereitgestellten HTML-Text gemäß den Anweisungen des Benutzers und formatiere die Ausgabe strikt als JSON-Objekt, das dem angegebenen Schema entspricht. Gib KEINEN erläuternden Text vor oder nach dem JSON-Objekt aus. Die Ausgabe muss ausschließlich auf Deutsch erfolgen."
# Define template as a regular string with placeholders
USER_PROMPT_TEMPLATE_BASE = """
Bitte analysiere den folgenden BEREINIGTEN HTML-Textinhalt einer medizinischen Praxis-Website (wahrscheinlich ein Dermatologe). Extrahiere die angeforderten Informationen präzise und *nur* basierend auf dem bereitgestellten Textinhalt. Erfinde KEINE Informationen oder Platzhalter (wie '123 Beispielstraße', 'Dr. Schmidt', generische Beschreibungen). Wenn eine bestimmte Information (wie E-Mail, Buchungslink, detaillierte Servicebeschreibungen) im Text nicht gefunden wird, lasse das entsprechende Feld im JSON weg oder gib null/leeres Array zurück, wie es das Schema vorsieht. Liste alle explizit genannten medizinischen Dienstleistungen auf. Die gesamte Ausgabe MUSS auf Deutsch sein.

Einzuhaltendes JSON-Schema:
{schema_json}

Inhalt der Website (Bereinigtes HTML):
---
{html_content}
---

Gib das extrahierte JSON-Objekt zurück:
"""

def sanitize_filename(url: str) -> str:
    """Sanitizes a URL to create a valid filename."""
    sanitized = re.sub(r'^https?://', '', url)
    sanitized = re.sub(r'[<>:"/\|?*]', '_', sanitized)
    max_len = 100
    if len(sanitized) > max_len:
        sanitized = sanitized[:max_len]
    return sanitized

# Initialize OpenAI client
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

async def run_crawl_and_extract(url: str, crawler: AsyncWebCrawler):
    """
    Crawls SINGLE URL using crawl4ai, gets cleaned HTML, then uses OpenAI API for JSON extraction.
    Writes output to files.
    """
    print(f"\n--- Starting SINGLE PAGE Crawl & FULL JSON Extraction from HTML for: {url} ---")
    output_filename_base = os.path.join(OUTPUT_DIR, sanitize_filename(url))
    json_output_file = f"{output_filename_base}_extracted_full_html.json"
    error_output_file = f"{output_filename_base}_error.txt"
    raw_html_file = f"{output_filename_base}_cleaned.html"

    if not openai_client:
        print(f"--> ERROR: OpenAI client not initialized for {url}. Skipping extraction.")
        return

    try:
        # Step 1: Crawl SINGLE page using crawl4ai
        print(f"  Crawling single page {url}...")
        result = await crawler.arun(url=url)

        # --- Get cleaned_html --- 
        if not result or not getattr(result, 'cleaned_html', None):
            print(f"--> ERROR: Crawling failed or no cleaned_html content found for {url}.")
            with open(error_output_file, 'w', encoding='utf-8') as f:
                f.write(f"Crawling failed or no cleaned_html content found for {url}.\n")
                f.write(f"CrawlResult object (if available): {result}")
            return

        html_content = result.cleaned_html
        with open(raw_html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"  Crawling finished. Cleaned HTML saved to: {raw_html_file}")

        # Step 2: Extract JSON data using OpenAI API (GPT-4 Turbo)
        print(f"  Extracting full JSON using OpenAI model gpt-4-turbo...")
        # --- Use .format() with named placeholders for schema and html --- 
        schema_json_string = json.dumps(EXTRACTION_SCHEMA, indent=2)
        user_prompt = USER_PROMPT_TEMPLATE_BASE.format(schema_json=schema_json_string, html_content=html_content)
        # user_prompt = USER_PROMPT_TEMPLATE_BASE.format(html_content=html_content) # Original failing method

        # --- DEBUG: Print the prompt being sent to OpenAI (first 1000 chars) ---
        # print("\n--- Sending Prompt to OpenAI (first 1000 chars): ---")
        # print(user_prompt[:1000] + ("..." if len(user_prompt) > 1000 else ""))
        # print("--- End of Prompt Snippet ---\n")
        # --- End DEBUG ---

        try:
            response = openai_client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={ "type": "json_object" }, # Re-enabled JSON mode
                temperature=0.1
            )

            extracted_json_string = response.choices[0].message.content

            if not extracted_json_string:
                 print(f"--> ERROR: OpenAI returned an empty response for {url}.")
                 with open(error_output_file, 'w', encoding='utf-8') as f:
                    f.write(f"OpenAI returned an empty response for {url}.\nResponse object: {response}")
                 return

            # Step 3: Parse and Save JSON
            try:
                parsed_data = json.loads(extracted_json_string)
                with open(json_output_file, 'w', encoding='utf-8') as f:
                    json.dump(parsed_data, f, indent=2, ensure_ascii=False)
                print(f"--> SUCCESS: Extracted JSON data saved to: {json_output_file}")

            except json.JSONDecodeError as json_e:
                print(f"--> ERROR: Failed to parse OpenAI JSON response for {url}. Error: {json_e}")
                with open(error_output_file, 'w', encoding='utf-8') as f:
                    f.write(f"Failed to parse OpenAI JSON response for {url}:\n{json_e}\n\n")
                    f.write("--- Raw OpenAI Response String ---\n")
                    f.write(extracted_json_string)

        except OpenAIError as openai_e:
            print(f"--> ERROR: OpenAI API error during extraction for {url}: {openai_e}")
            with open(error_output_file, 'w', encoding='utf-8') as f:
                f.write(f"OpenAI API error during extraction for {url}:\n{openai_e}\n")

    except Exception as e:
        print(f"--> ERROR: An exception occurred during processing {url}: {e}")
        try:
            import traceback
            with open(error_output_file, 'w', encoding='utf-8') as f:
                 f.write(f"Exception during processing {url}:\n{e}\n\n")
                 f.write(traceback.format_exc())
            print(f"--> Full error details saved to: {error_output_file}")
        except Exception as write_e:
            print(f"--> CRITICAL ERROR: Could not write error details to file: {write_e}")

async def main():
    """
    Main function to orchestrate the crawling and extraction.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please ensure it is set in your .env file and the file is loaded.")
        return
    if not openai_client:
         print("Error: OpenAI client could not be initialized. Check API Key.")
         return

    print("Initializing crawler...")
    async with AsyncWebCrawler() as crawler:
        tasks = [run_crawl_and_extract(target["url"], crawler) for target in TARGET_URLS]
        await asyncio.gather(*tasks)

    print("\nPOC Script finished.")

if __name__ == "__main__":
    print("Checking Playwright browsers...")
    asyncio.run(main()) 