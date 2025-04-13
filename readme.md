# Hautarzt Vergleich


Verzeichnis von Hautarztpraxen in Deutschland mit KI-generierten Einblicken basierend auf öffentlich verfügbaren Patientenbewertungen.


## Key Features


*   Suche nach Hautarztpraxen via Stadt oder Postleitzahl.
*   Detailseiten für Praxen mit Kontaktdaten, Standort (Karte), Öffnungszeiten.
*   KI-basierte Analyse von Patientenbewertungen zu Aspekten wie Wartezeit, Freundlichkeit, Kompetenz.
*   Visualisierung der Analyse-Ergebnisse (Score, Stärken/Schwächen, Trend).
*   "In der Nähe" Suche basierend auf dem Standort des Nutzers.
*   Optimiert für SEO mit dynamischen Metadaten und Schema.org Markup.


## Technologie Stack


*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn/UI, Leaflet (Karte)
*   **Backend:** Supabase (PostgreSQL DB, Auth, Edge Functions)
*   **KI-Analyse:** Google Generative AI (Gemini)
*   **Infrastruktur:**
   *   Supabase für Backend & DB Hosting
   *   (TODO: Specify Frontend Hosting - e.g., Vercel, Self-hosted)


## Projektstruktur


*   `/frontend`: Next.js Frontend-Anwendung (UI, Komponenten, API-Service)
*   `/supabase`: Supabase Konfiguration (Migrations, Function Code)
   *   `/functions`: Edge Functions (API Endpunkte, KI-Logik)
       *   `praxis-search`: Suchlogik (aufruft Stored Procedure)
       *   `praxis-details`: Abrufen von Praxisdetails
       *   `search-redirect`: Initialen Such-Request verarbeiten und weiterleiten
       *   `analyze-practice`: Startet die KI-Analyse für eine Praxis
       *   `_shared`: Gemeinsam genutzter Code (CORS, Slugify, Rate Limiter)
   *   `/migrations`: SQL-Datenbankmigrationen
*   `/docs`: Dokumentation und Planung


## Environment Variables


Folgende Umgebungsvariablen müssen gesetzt werden:


**Frontend (`frontend/.env.local`):**


*   `NEXT_PUBLIC_SUPABASE_URL`: Deine Supabase Projekt-URL.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Dein Supabase Projekt Anon Key.
*   `NEXT_PUBLIC_SUPABASE_PROJECT_REF`: Deine Supabase Projekt-Referenz-ID.
*   `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`: Die Basis-URL für deine Supabase Functions (z.B. `https://<ref>.supabase.co/functions/v1`).


**Supabase Secrets/Environment (im Supabase Dashboard):**


*   `HAUTARZT_SUPABASE_URL`: Deine Supabase Projekt-URL.
*   `HAUTARZT_SUPABASE_ANON_KEY`: Dein Supabase Projekt Anon Key.
*   `HAUTARZT_SUPABASE_SERVICE_KEY`: Dein Supabase Service Role Key (nur für Functions, die Admin-Rechte brauchen, z.B. `analyze-practice`).
*   `HAUTARZT_FRONTEND_BASE_URL`: Die Basis-URL deines Frontends (für Redirects, z.B. `http://localhost:3000` lokal, `https://deine-domain.de` in Prod).
*   `GEMINI_API_KEY`: Dein API Key für Google Generative AI.
*   `UPSTASH_REDIS_REST_URL`: URL für deine Upstash Redis DB (für Rate Limiting).
*   `UPSTASH_REDIS_REST_TOKEN`: Token für deine Upstash Redis DB.
*   `RATE_LIMIT_WINDOW_SECONDS` (Optional): Zeitfenster für Rate Limit (Default: 60).
*   `RATE_LIMIT_MAX_REQUESTS`


## Setup & Installation


## Running Locally


## Deployment

