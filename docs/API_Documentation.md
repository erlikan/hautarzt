# API Documentation - Hautarzt-Verzeichnis

This document describes the available API endpoints for the Hautarzt-Verzeichnis frontend.

---

## 1. Get Service List

*   **Endpoint:** `GET /rest/v1/service`
*   **Method:** `GET`
*   **Description:** Retrieves a list of all available medical/cosmetic services offered by practices. Intended for use in frontend filter UIs. This endpoint is provided directly by Supabase PostgREST.
*   **Authentication:** Requires Supabase `anon` key. Row Level Security (RLS) on the `service` table should allow read access for the `anon` role.
*   **Query Parameters:**
    *   `select=id,name` (Required): Specifies the columns to return.
*   **Successful Response (200 OK):**
    *   **Content-Type:** `application/json`
    *   **Body:** An array of service objects.
    ```json
    [
      {
        "id": 1,
        "name": "Hautkrebsvorsorge"
      },
      {
        "id": 2,
        "name": "Laserbehandlung"
      },
      // ... more services
    ]
    ```
*   **Error Responses:** Standard PostgREST errors (e.g., 401 Unauthorized, 403 Forbidden based on RLS).

---

## 2. Get Praxis Details

*   **Endpoint:** `GET /api/praxis-details/{stadtSlug}/{praxisSlug}`
*   **Method:** `GET`
*   **Description:** Retrieves comprehensive details for a single practice, including base information, KI analysis results, and associated services. Implemented via the `praxis-details` Supabase Edge Function.
*   **Authentication:** Requires Supabase `anon` key. (Currently no specific authorization logic beyond RLS on underlying tables, if applied).
*   **URL Parameters:**
    *   `{stadtSlug}` (string, required): The URL-friendly slug for the city (e.g., `berlin`).
    *   `{praxisSlug}` (string, required): The URL-friendly slug for the practice (e.g., `hautarztpraxis-dr-muster`).
*   **Successful Response (200 OK):**
    *   **Content-Type:** `application/json`
    *   **Body:** A JSON object representing the `PraxisDetail`. The exact structure needs to combine data from `praxis`, `praxis_analysis`, and joined `service` tables. *(Note: The precise structure should be defined based on the Edge Function's implementation. Assuming it joins/fetches necessary data)*.
    ```json
    {
      // Fields from 'praxis' table
      "google_place_id": "ChIJ...",
      "slug": "hautarztpraxis-dr-muster",
      "name": "Hautarztpraxis Dr. Muster",
      "full_address": "Musterstraße 1, 10117 Berlin",
      "city": "Berlin",
      "postal_code": "10117",
      "latitude": 52.51,
      "longitude": 13.38,
      "phone": "+49301234567",
      "site": "https://www.dr-muster.de",
      "location": { "type": "Point", "coordinates": [13.38, 52.51] }, // GeoJSON Point
      "rating": 4.5,
      "reviews": 150,
      "reviews_per_score_1": 5,
      // ... reviews_per_score_2-5
      "working_hours": { /* JSON structure */ },
      "about": { /* JSON structure */ },
      "photo": "https://maps.google.com/...", // URL to photo if available
      "analysis_status": "completed",
      "created_at": "...",
      "updated_at": "...",

      // Fields from 'praxis_analysis' table (nested or flattened)
      "analysis": {
          "termin_wartezeit_positiv": 70,
          "termin_wartezeit_neutral": 20,
          "termin_wartezeit_negativ": 10,
          // ... other aspect scores (freundlichkeit, aufklaerung, etc.)
          "tags": ["Freundliches Team", "Kurze Wartezeit", "Kompetent"],
          "staerken": ["Gute Aufklärung", "Nimmt sich Zeit"],
          "schwaechen": ["Telefonische Erreichbarkeit", "Terminvergabe online"],
          "mentioned_doctors": ["Dr. Erika Musterfrau"],
          "emotionale_tags": ["Zufrieden", "Gut aufgehoben"],
          "haeufig_genannte_begriffe": ["Hautkrebsvorsorge", "Termin", "Wartezimmer"],
          "trend": "positiv",
          "trend_begruendung": "Verbesserte Wartezeiten in den letzten Monaten erwähnt.",
          "vergleich_kasse_privat": "Keine signifikanten Unterschiede erwähnt.",
          "zusammenfassung": "Die Praxis wird oft für das freundliche Team und die kurze Wartezeit gelobt. Die Aufklärung durch die Ärzte wird positiv hervorgehoben.",
          "overall_score": 82.50,
          "analyzed_at": "...",
          "last_error_message": null
          // ... created_at, updated_at for analysis
      },

      // List of associated 'service' names
      "services": [
          "Hautkrebsvorsorge",
          "Allergietests",
          "Laserbehandlung"
      ]
    }
    ```
*   **Error Responses:**
    *   `404 Not Found`: If no practice matches the provided `stadtSlug` and `praxisSlug`.
    *   `500 Internal Server Error`: If the Edge Function encounters an unexpected error (e.g., database connection issue).

---

## 3. Praxis Search (Planned / In Development)

*   **Endpoint:** `GET /api/praxis-search`
*   **Method:** `GET`
*   **Description:** Performs a search for practices based on various criteria, including location, filters, sorting, and pagination. Implemented via the `praxis-search` Supabase Edge Function. **Status: Implementation complex, potentially delayed or simplified for V1.**
*   **Authentication:** Requires Supabase `anon` key.
*   **Query Parameters (Planned):**
    *   `query` (string): City name or ZIP code.
    *   `lat` (number): Latitude for nearby search.
    *   `lon` (number): Longitude for nearby search.
    *   `radius` (number): Search radius in meters for nearby search.
    *   `services` (string[]): Array of service IDs to filter by.
    *   `scoreMin` (number): Minimum overall score (0-100).
    *   `sortBy` (string): Field to sort by (`score`, `distance`, `name`). Default: `score`.
    *   `order` (string): Sort order (`asc`, `desc`). Default: `desc`.
    *   `page` (number): Page number for pagination (starts at 1). Default: 1.
    *   `pageSize` (number): Number of results per page. Default: 10.
*   **Successful Response (200 OK):**
    *   **Content-Type:** `application/json`
    *   **Body:** An object containing the search results and pagination metadata.
    ```json
    {
      "data": [
        // Array of PraxisListItem objects (subset of PraxisDetail)
        {
          "google_place_id": "ChIJ...",
          "slug": "hautarztpraxis-dr-muster",
          "name": "Hautarztpraxis Dr. Muster",
          "full_address": "Musterstraße 1, 10117 Berlin",
          "city": "Berlin",
          "postal_code": "10117",
          "latitude": 52.51,
          "longitude": 13.38,
          "photo": "https://maps.google.com/...",
          "analysis": {
            "overall_score": 82.50,
            // Include aspect scores needed for indicator icons
            "termin_wartezeit_positiv": 70,
            "termin_wartezeit_negativ": 10,
             // ... other aspects ...
            "zusammenfassung": "Die Praxis wird oft für das freundliche Team...", // Snippet
            "tags": ["Freundliches Team", "Kurze Wartezeit"] // Few tags
          },
          "services": ["Hautkrebsvorsorge", "Laserbehandlung"] // For icons
        },
        // ... other practices
      ],
      "meta": {
        "totalItems": 153,
        "itemCount": 10,
        "itemsPerPage": 10,
        "totalPages": 16,
        "currentPage": 1
      }
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: If required parameters are missing or invalid.
    *   `500 Internal Server Error`: If the Edge Function encounters an error. 