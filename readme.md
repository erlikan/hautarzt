# Hautarzt Vergleich

Das führende Verzeichnis für Hautärzte in Deutschland mit echten Patienteneinblicken.

## Übersicht

Dieses Projekt enthält das Frontend (Next.js), Backend (Supabase Edge Functions & PostgreSQL) und unterstützende Skripte für die Webanwendung Hautarzt Vergleich.

## Hauptfunktionen

*   Umfassendes Verzeichnis von Hautarztpraxen in Deutschland.
*   Detaillierte Praxis-Seiten mit Kontaktdaten, Öffnungszeiten, angebotenen Leistungen (Subtypen & Services).
*   KI-basierte Analyse von Patientenbewertungen zu Aspekten wie Wartezeit, Freundlichkeit, Kompetenz etc.
*   Einzigartiger "Praxis-Score" basierend auf Google-Bewertungen und KI-Einblicken.
*   Suche nach Stadt, PLZ und **in der Nähe** (Standortbasiert).
*   Dynamische Sitemap (`/sitemap.xml`) für verbesserte SEO.
*   Automatisches Abrufen von Google Maps Rezensionen via Apify.
*   Dynamische FAQ-Sektion und Leistungsbeschreibungen aus Markdown-Dateien.
*   Verbessertes UI/UX für Homepage, Suchergebnisse und Detailseiten (Airbnb-inspiriert).
*   Kontaktformular (Backend-Implementierung ausstehend).

## Technologien

*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI, Leaflet (Karte), `react-markdown`
*   **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, pg_cron, PostGIS)
*   **KI:** Google Generative AI (Gemini API)
*   **Datenbeschaffung:** Apify (Google Maps Reviews Scraper)
*   **Content:** Markdown (`gray-matter` für Parsing)
*   **Hosting:** Supabase für Backend, Frontend-Hosting auf Hetzner (via Docker/Node.js)

## Projektstruktur

*   `/frontend`: Next.js Frontend-Anwendung
    *   `/app`: Routen (Pages, Layouts, API Routes)
    *   `/components`: Wiederverwendbare React-Komponenten (UI, Layout, spezifische Features)
    *   `/lib`: Hilfsfunktionen, Konstanten, Typen
    *   `/public`: Statische Assets (Logo, Favicon)
    *   `/content`: Markdown-Dateien für statische Inhalte
        *   `/faq`: Fragen & Antworten
        *   `/services`: Leistungsbeschreibungen
*   `/supabase`: Supabase Konfiguration
    *   `/functions`: Edge Functions
        *   `praxis-search`: Suchlogik
        *   `praxis-details`: Abrufen von Praxisdetails
        *   `search-redirect`: Initialen Such-Request verarbeiten
        *   `analyze-practice`: Startet die KI-Analyse
        *   `trigger-apify-review-scrape`: Startet Apify Job für Praxis
        *   `process-apify-webhook`: Verarbeitet Apify Ergebnisse (Webhook)
        *   `batch-fetch-reviews`: Geplanter Job zum Triggern von Apify Läufen
        *   `_shared`: Gemeinsam genutzter Code
    *   `/migrations`: SQL-Datenbankmigrationen

## Environment Variables & Secrets

*Siehe `frontend/.env.example` und die Secrets-Konfiguration im Supabase Dashboard.*

**Zusätzlich benötigt für Apify & Co.:**

*   `APIFY_API_TOKEN`: Dein Apify API Token.
*   `APIFY_ACTOR_ID`: ID oder Name des Apify Google Maps Reviews Scrapers.
*   `APIFY_FETCH_BATCH_SIZE` (Optional): Anzahl Praxen pro Batch-Lauf (Default: 5).
*   `CLOUDFLARE_TURNSTILE_SECRET_KEY` (Optional, für Kontaktformular): Dein Turnstile Secret Key.
*   `RESEND_API_KEY` (Optional, für Kontaktformular): Dein Resend API Key.
*   `CONTACT_RECIPIENT_EMAIL` (Optional, für Kontaktformular): E-Mail-Adresse für Kontaktanfragen.

## Setup & Entwicklung

*Siehe spezifische READMEs in `frontend/` und `supabase/`.* 

## Content Management

*   **FAQs:** Bearbeiten/Hinzufügen von `.md` Dateien in `frontend/content/faq/`. Frontmatter steuert Anzeige (`is_active`, `display_order`).
*   **Leistungsbeschreibungen:** Bearbeiten/Hinzufügen von `.md` Dateien in `frontend/content/services/`. Frontmatter steuert Anzeige (`is_active`, `display_on_homepage`).

## Deployment

*   **Supabase:** Backend (DB, Functions) wird via Supabase CLI (`supabase db push`, `supabase functions deploy`) deployed.
*   **Frontend:** Deployment auf Hetzner Server (Details zum Setup folgen).

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

