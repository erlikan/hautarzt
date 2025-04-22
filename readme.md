# Hautarzt Vergleich

Das führende Verzeichnis für Hautärzte in Deutschland mit echten Patienteneinblicken.

## Übersicht

Dieses Projekt enthält das Frontend (Next.js), Backend (Supabase Edge Functions & PostgreSQL) und unterstützende Skripte für die Webanwendung Hautarzt Vergleich.

## Hauptfunktionen

*   Umfassendes Verzeichnis von Hautarztpraxen in Deutschland (gefiltert, bereinigt).
*   Detaillierte Praxis-Seiten mit Kontaktdaten, Öffnungszeiten (parsed), Fotos, Subtypen und angebotenen Leistungen.
*   KI-basierte Analyse von Patientenbewertungen zu Aspekten wie Wartezeit, Freundlichkeit, Kompetenz etc., generiert Scores, Zusammenfassungen, Tags, Stärken/Schwächen.
*   Einzigartiger "Praxis-Score" basierend auf Google-Bewertungen (Fallback-Berechnung) und KI-Einblicken.
*   Suche nach Stadt (mit Autocomplete/Vorschlägen), PLZ und **in der Nähe** (Standortbasiert mit Radius).
*   Intelligente Such-Weiterleitung mit Disambiguierungsfunktion für mehrdeutige Städtenamen.
*   Verfeinertes Suchergebnis-Ranking (Relevanz-Tier > Score-Verfügbarkeit > Score-Wert).
*   Automatisches, geplantes Abrufen von Google Maps Rezensionen via Apify (Webhook-Integration).
*   Dynamische FAQ-Sektion und Leistungsbeschreibungen aus lokalen Markdown-Dateien.
*   Verbessertes UI/UX für Homepage, Suchergebnisse und Detailseiten (inspiriert von Airbnb).
*   Dynamische Sitemap (`/sitemap.xml`) für verbesserte SEO.
*   Kontaktseite mit Formular-UI (Backend ausstehend).
*   Impressum & Datenschutzseiten (Basisstruktur).

## Technologien

*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI, Leaflet (Karte), `react-markdown`, `gray-matter`, `use-debounce`
*   **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, pg_cron, PostGIS)
*   **KI:** Google Generative AI (Gemini API)
*   **Datenbeschaffung:** Apify (Google Maps Reviews Scraper)
*   **Content:** Markdown (`gray-matter` für Parsing)
*   **Hosting:** Supabase für Backend, Frontend auf Hetzner (via Node.js/PM2/Nginx)
*   **Prozessmanagement (Prod):** PM2
*   **Reverse Proxy (Prod):** Nginx

## Projektstruktur

*   `/frontend`: Next.js Frontend-Anwendung
    *   `/app`: Routen (Pages, Layouts, API Routes like `/api/search-redirect`, `/api/city-suggestions`)
    *   `/components`: Wiederverwendbare React-Komponenten
    *   `/lib`: Hilfsfunktionen, Konstanten, Typen
    *   `/public`: Statische Assets (Logo, Favicon, `/data/city-suggestions.json`)
    *   `/content`: Markdown-Dateien für statische Inhalte
        *   `/faq`: Fragen & Antworten (`*.md`)
        *   `/services`: Leistungsbeschreibungen (`*.md`)
*   `/supabase`: Supabase Konfiguration
    *   `/functions`: Edge Functions
        *   `praxis-search`: Suchlogik (ruft SP `search_praxen`)
        *   `praxis-details`: Abrufen von Praxisdetails
        *   `analyze-practice`: Startet die KI-Analyse
        *   `trigger-apify-review-scrape`: Startet Apify Job für Praxis
        *   `process-apify-webhook`: Verarbeitet Apify Ergebnisse (Webhook)
        *   `batch-fetch-reviews`: Geplanter Job zum Triggern von Apify Läufen
        *   `_shared`: Gemeinsam genutzter Code
    *   `/migrations`: SQL-Datenbankmigrationen (inkl. `search_praxen` SP, `search_distinct_cities_by_prefix` SP, Tabellen)

## Environment Variables & Secrets

*Siehe `frontend/.env.example` und die Secrets-Konfiguration im Supabase Dashboard.*

**Wichtige Variablen:**

*   **Frontend (`.env.local` / Prod Env):**
    *   `NEXT_PUBLIC_SUPABASE_URL`: Supabase Projekt-URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key.
    *   `NEXT_PUBLIC_BASE_URL`: Absolute Basis-URL des Frontends (z.B. `http://localhost:3000`, `https://www.hautarzt-vergleich.de`).
*   **Supabase Secrets:**
    *   `HAUTARZT_SUPABASE_SERVICE_KEY`: Supabase Service Role Key (für Functions mit Admin-Rechten).
    *   `GEMINI_API_KEY`: Google Generative AI API Key.
    *   `APIFY_API_TOKEN`: Apify API Token.
    *   `APIFY_ACTOR_ID`: Apify Scraper ID/Name.
    *   `APIFY_FETCH_BATCH_SIZE` (Optional): Default 5.
    *   `CLOUDFLARE_TURNSTILE_SECRET_KEY` (Für zukünftiges Kontaktformular).
    *   `RESEND_API_KEY` (Für zukünftiges Kontaktformular).
    *   `CONTACT_RECIPIENT_EMAIL` (Für zukünftiges Kontaktformular).
    *   *(Ggf. weitere wie `UPSTASH_REDIS_*` falls Rate Limiting genutzt wird)*

## Setup & Entwicklung

*Siehe spezifische READMEs in `frontend/` und `supabase/`.* 

## Content Management

*   **FAQs:** Bearbeiten/Hinzufügen von `.md` Dateien in `frontend/content/faq/`. Frontmatter steuert Anzeige (`question`, `is_active`, `display_order`). Inhalt ist die Antwort.
*   **Leistungsbeschreibungen:** Bearbeiten/Hinzufügen von `.md` Dateien in `frontend/content/services/`. Frontmatter steuert Anzeige (`title`, `slug`, `summary`, `icon_name`, `is_active`, `display_on_homepage`). Inhalt ist die Detailbeschreibung.
*   **Städte-Vorschläge:** Generiert aus der DB in `frontend/public/data/city-suggestions.json`. Muss manuell oder per Skript aktualisiert werden.

## Deployment (Hetzner)

1.  **Server Setup:** Nginx, Node.js (passende Version), PM2 (`sudo npm install pm2 -g`).
2.  **Code:** Klonen/Kopieren des `frontend` Verzeichnisses.
3.  **Dependencies:** `npm install` im `frontend` Verzeichnis.
4.  **Environment Variables:** Setzen der `NEXT_PUBLIC_*` Variablen in der Server-Umgebung.
5.  **Build:** `npm run build`.
6.  **Start with PM2:** `pm2 start npm --name "hautarzt-frontend" -- start -p 3000`.
7.  **PM2 Persistenz:** `pm2 save`, `pm2 startup`.
8.  **Nginx Config:** Reverse Proxy für Port 3000 aufsetzen (siehe Beispielkonfigurationen online).
9.  **DNS & SSL:** Domain auf Server-IP zeigen lassen, SSL mit Certbot einrichten.
10. **Supabase Backend:** Mit `supabase db push` und `supabase functions deploy` deployen (oder SPs manuell im Editor ausführen).

## Beitragende

*(Hier Beitragende auflisten)*

## Lizenz

*(Lizenz angeben, z.B. MIT)*


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

