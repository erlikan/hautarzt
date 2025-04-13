\# Frontend Implementierungsplan: Hautarzt-Verzeichnis

\*\*Projektziel:\*\* Entwicklung einer benutzerfreundlichen, mobil-optimierten Verzeichnisseite für Hautärzte in Deutschland mit detaillierten, auf Analysen basierenden Patienteneinblicken.

\*\*Technischer Stack (Vorschläge):\*\*

\*   \*\*Framework:\*\* React (Next.js), Vue (Nuxt.js), Svelte (SvelteKit) oder ein anderes modernes JavaScript-Framework. Die Wahl sollte auf serverseitigem Rendering (SSR) oder Static Site Generation (SSG) mit Incremental Static Regeneration (ISR) für SEO und Performance abzielen.  
\*   \*\*Styling:\*\* Tailwind CSS, CSS Modules, Styled Components oder ähnliches.  
\*   \*\*State Management:\*\* Context API, Zustand, Redux, Pinia etc. (je nach Framework und Komplexität).  
\*   \*\*Daten-Fetching:\*\* Framework-integrierte Lösungen (z.B. Next.js API Routes / Server Components), \`fetch\` API, \`axios\`, SWR, React Query.  
\*   \*\*Karten:\*\* Leaflet.js oder Mapbox GL JS.  
\*   \*\*Charts:\*\* Chart.js, Recharts, Nivo oder eine andere geeignete Bibliothek für Balkendiagramme.  
\*   \*\*Routing:\*\* Framework-integriertes Routing.  
\*   \*\*Supabase Client:\*\* \`@supabase/supabase-js\`.

\*\*Voraussetzungen:\*\*

\*   Zugang zum Supabase-Projekt (Datenbank-Schema ist bekannt).  
\*   Kenntnis des definierten Datenbankschemas (Tabellen \`praxis\`, \`praxis\_analysis\`, \`service\`, \`praxis\_service\`, \`review\`).  
\*   Ein definiertes Backend-API (siehe separaten Plan \- "Schritt B"), das die benötigten Daten aus Supabase bereitstellt. Dieses Frontend-Dokument geht davon aus, dass API-Endpunkte existieren, um Praxislisten, Details etc. abzurufen.

\---

\#\# Implementierungsphasen & Aufgaben

\#\#\# Phase 1: Projekt-Setup & Basisstruktur

1\.  \*\*Projekt initialisieren:\*\* Richte das Frontend-Projekt mit dem gewählten Framework ein (z.B. \`create-next-app\`, \`create-vue\`, \`npm create svelte\`).  
2\.  \*\*Abhängigkeiten installieren:\*\* Füge notwendige Bibliotheken hinzu (\`@supabase/supabase-js\`, Styling-Bibliothek, Karten-Bibliothek, Chart-Bibliothek, Router etc.).  
3\.  \*\*Supabase Client einrichten:\*\* Konfiguriere den Supabase Client (\`supabase.ts\` oder ähnlich) mit den Projekt-URL und Anon Key (aus Supabase Settings \-\> API).  
4\.  \*\*Basis-Layout erstellen:\*\* Implementiere die Haupt-Layout-Komponente (\`Layout.tsx\`, \`App.vue\` etc.) mit Header (Logo), Footer (Impressum etc.) und einem Hauptinhaltsbereich (\`\<slot\>\`, \`\<Outlet\>\`, \`\<NuxtPage\>\`).  
5\.  \*\*Routing einrichten:\*\* Definiere die Basis-Routen im Router des Frameworks:  
    \*   \`/\`: Startseite  
    \*   \`/hautarzt/\[stadtSlug\]\`: Übersichtsseite (dynamische Route für Stadt)  
    \*   \`/hautarzt/\[stadtSlug\]/\[praxisSlug\]\`: Detailseite (dynamische Route für Stadt und Praxis)  
    \*   Ggf. \`/suche\`: Alternative Suchergebnisseite (optional).  
6\.  \*\*Styling-System konfigurieren:\*\* Richte das gewählte Styling-System ein (z.B. Tailwind-Konfiguration, Theme-Provider). Definiere grundlegende Farbpaletten, insbesondere die Farben für Score-Bewertungen (Rot, Gelb, Grün) und Aspekt-Indikatoren.  
7\.  \*\*Linting/Formatting:\*\* Richte ESLint, Prettier etc. für konsistenten Code ein.

\#\#\# Phase 2: API-Integration & Daten-Fetching

1\.  \*\*API Service Layer:\*\* Erstelle eine Abstraktionsschicht (z.B. \`services/api.ts\`) für die Kommunikation mit dem Backend-API. Diese Schicht enthält Funktionen wie:  
    \*   \`searchPraxenByLocation(cityOrZip: string): Promise\<PraxisListItem\[\]\>\`  
    \*   \`searchPraxenNearby(lat: number, lon: number, radius: number): Promise\<PraxisListItem\[\]\>\`  
    \*   \`getPraxisDetails(stadtSlug: string, praxisSlug: string): Promise\<PraxisDetail\>\`  
    \*   \`getServices(): Promise\<Service\[\]\>\` (Für Filter)  
    \*   Definiere TypeScript-Interfaces (\`PraxisListItem\`, \`PraxisDetail\`, \`Service\` etc.), die die erwartete Struktur der API-Antworten abbilden (basierend auf dem API-Design).  
2\.  \*\*Daten-Fetching Hooks/Logik:\*\* Implementiere die Logik zum Laden der Daten auf den entsprechenden Seiten (z.B. mit \`getServerSideProps\`/\`getStaticProps\` in Next.js, \`asyncData\` in Nuxt, \`load\` in SvelteKit oder Client-seitigen Hooks wie SWR/React Query).  
3\.  \*\*Loading & Error States:\*\* Implementiere durchgängig UI-Zustände für Ladezeiten (Skeletons, Spinner) und Fehler (Fehlermeldungen, Retry-Optionen).

\#\#\# Phase 3: Implementierung der Seitentypen & Komponenten

\*\*3.1 Startseite (\`/\`)\*\*

\*   \*\*Komponenten:\*\*  
    \*   \`SearchForm\`: Enthält das Eingabefeld (PLZ/Stadt) und den Such-Button.  
    \*   \`LocationButton\`: Button, der Browser-Geolocation anfordert.  
    \*   \`(Optional) ValueProposition\`: Bereich mit Icons/Text zur Erklärung des Mehrwerts.  
    \*   \`(Optional) TopCityLinks\`: Liste von Links zu Städteseiten.  
\*   \*\*Logik:\*\*  
    \*   \`SearchForm\`: Bei Submit wird die Eingabe validiert und die Navigation zur Übersichtsseite ausgelöst (z.B. \`router.push(\\\`/hautarzt/${stadtSlug}\\\`)\`). Ein API-Call ist hier \*nicht\* nötig, die Suche wird auf der Ergebnisseite ausgeführt.  
    \*   \`LocationButton\`: Bei Klick \`navigator.geolocation.getCurrentPosition\` aufrufen. Bei Erfolg: Navigation zur Übersichtsseite mit Lat/Lon-Parametern (oder direkter API-Call und Navigation mit Ergebnissen). Bei Fehler: Nutzerfeedback geben.

\*\*3.2 Übersichts-/Ergebnisseite (\`/hautarzt/\[stadtSlug\]\`)\*\*

\*   \*\*Daten laden:\*\* Ruft die API auf (z.B. \`searchPraxenByLocation\` oder \`searchPraxenNearby\`) basierend auf dem \`stadtSlug\` oder den Lat/Lon-Parametern. Lädt initial auch verfügbare Leistungen für Filter.  
\*   \*\*State Management:\*\* Zustand für Suchergebnisse, Filterwerte, Sortierung, Paginierungsseite, Karten-/Listenansicht.  
\*   \*\*Komponenten:\*\*  
    \*   \`PageHeader\`: Zeigt "Hautärzte in {Stadt}" und Anzahl Ergebnisse.  
    \*   \`FilterSidebar\`:  
        \*   Enthält Filterkomponenten (Slider für Score, Checkboxen für Aspekte/Leistungen/Öffnungszeiten etc.).  
        \*   Aktualisiert den Filter-State bei Änderung.  
        \*   Löst bei Änderung (ggf. mit Debounce) einen erneuten API-Call mit Filterparametern aus.  
    \*   \`SortDropdown\`: Wählt Sortierkriterium aus und löst Neuladen/Sortieren der Daten aus.  
    \*   \`PraxisList\`: Rendert die Liste der \`PraxisCard\`-Komponenten basierend auf den gefilterten/sortierten Daten.  
    \*   \`PraxisCard\` (\*\*Wichtige Komponente\!\*\*):  
        \*   Props: \`praxis: PraxisListItem\` (enthält alle nötigen Daten).  
        \*   Zeigt Bild, Name (als Link), Adresse.  
        \*   Zeigt \*\*Overall Score\*\* als Zahl mit dynamischer CSS-Klasse für Farbe (\`score-value score-high/medium/low\`).  
        \*   Rendert 5 \*\*Aspekt-Indikator-Icons\*\*. Die Farbe/Füllung jedes Icons wird basierend auf den \`positiv\`/\`negativ\`-Prozenten für diesen Aspekt im \`praxis\`-Objekt bestimmt (Logik kapseln, z.B. in einer Hilfsfunktion \`getAspectStatus(positiv, negativ)\`). Tooltips implementieren.  
        \*   Zeigt \*\*KI-Snippet\*\* (erster Satz von \`zusammenfassung\`).  
        \*   Zeigt 2-3 \*\*Tags\*\* als Pills/Badges.  
        \*   Zeigt \*\*Leistungs-Icons\*\* (wenn Leistung vorhanden).  
        \*   Zeigt \*\*Award-Badge\*\*-Platzhalter.  
        \*   Enthält den "Details"-Button (Link).  
    \*   \`MapView\`:  
        \*   Initialisiert die Karte (Leaflet/Mapbox).  
        \*   Empfängt die Liste der Praxen als Props.  
        \*   Rendert Marker auf der Karte. Markerfarbe/-Icon basiert auf \`overall\_score\`.  
        \*   Öffnet Popup bei Klick auf Marker (zeigt Name, Score, Detail-Link).  
        \*   Reagiert auf Änderungen in der Ergebnisliste (Filter/Sortierung).  
    \*   \`Pagination\`: Zeigt Seiten an und löst bei Klick das Laden der entsprechenden Datenseite aus.  
\*   \*\*Logik:\*\* Hauptlogik liegt im Laden, Filtern, Sortieren und Paginieren der Praxisdaten und der Aktualisierung der Liste und Karte.

\*\*3.3 Praxis-Detailseite (\`/hautarzt/\[stadtSlug\]/\[praxisSlug\]\`)\*\*

\*   \*\*Daten laden:\*\* Ruft die API auf (\`getPraxisDetails\`) basierend auf \`stadtSlug\` und \`praxisSlug\`.  
\*   \*\*Komponenten:\*\*  
    \*   \`PraxisHeader\`: Zeigt Name, Score, Adresse, Kontakte, Buttons, kleine Karte. Wendet Farbklasse auf Score an. Zeigt Award-Badges.  
    \*   \`KiDashboard\`: Container für die Analyse-Elemente.  
        \*   \`AspectAnalysisCard\` (5x instanziiert):  
            \*   Props: \`title\`, \`positivePercent\`, \`neutralPercent\`, \`negativePercent\`.  
            \*   Rendert Titel und das \*\*Balkendiagramm\*\* (mit Chart-Bibliothek oder CSS).  
        \*   \`TrendIndicator\`: Zeigt Pfeil-Icon (Farbe basierend auf \`trend\`) und \`trend\_begruendung\`.  
        \*   \`StrengthsList\`: Rendert Liste der \`staerken\` mit Haken-Icons.  
        \*   \`WeaknessesList\`: Rendert Liste der \`schwaechen\` mit Kreuz-Icons.  
        \*   \`InsightsSection\`: Zeigt Kasse/Privat-Text, häufige Begriffe (Tag Cloud?), Emotionen (Pills), erwähnte Ärzte (Liste).  
    \*   \`LeistungenSection\`: Listet die angebotenen Leistungen (aus API-Daten) mit Icons auf.  
    \*   \`PraxisInfoSection\`: Zeigt formatierte Öffnungszeiten, Foto-Galerie (falls Fotos vorhanden), Barrierefreiheits-Icons/-Text.  
\*   \*\*Logik:\*\* Hauptsächlich Darstellung der detaillierten Daten aus der API-Antwort. Interaktivität bei Karte und ggf. Foto-Galerie.

\#\#\# Phase 4: Zusätzliche Implementierungen

1\.  \*\*Karten-Implementierung:\*\* Detaillierte Implementierung der Kartenlogik in der \`MapView\`-Komponente (Marker, Popups, Styling, Zoom/Panning).  
2\.  \*\*Chart-Implementierung:\*\* Implementierung der Balkendiagramme in \`AspectAnalysisCard\`.  
3\.  \*\*Slug-Handling:\*\* Sicherstellen, dass die Slug-Generierung im Backend funktioniert und das Frontend die URLs korrekt aufbaut und auflöst.  
4\.  \*\*SEO-Implementierung (Frontend):\*\*  
    \*   Verwendung einer Meta-Tag-Bibliothek (z.B. \`next/head\`, \`vue-meta\`, \`svelte:head\`).  
    \*   Dynamisches Setzen von \`\<title\>\` und \`\<meta name="description"\>\` auf allen Seitentypen (insbesondere Übersichts- und Detailseiten, mit relevanten Keywords wie Stadt, Praxisname).  
    \*   Implementierung von \*\*JSON-LD Structured Data (\`Schema.org\`)\*\* in einem \`\<script type="application/ld+json"\>\`-Tag:  
        \*   Übersichtsseite (\`ItemList\` mit \`MedicalBusiness\` oder \`Physician\` Einträgen).  
        \*   Detailseite (\`Physician\` oder \`MedicalClinic\`, \`address\`, \`telephone\`, \`url\`, \*\*\`aggregateRating\`\*\* (basierend auf \`overall\_score\`), ggf. \`review\` (könnte man die KI-Zusammenfassung als \`reviewBody\` nutzen? Vorsicht bei Richtlinien\!).  
    \*   Korrekte HTML-Semantik (H1 nur einmal pro Seite etc.).  
5\.  \*\*Responsiveness & Mobile Optimierung:\*\* Durchgehend testen und anpassen für verschiedene Bildschirmgrößen. Filter und Karte müssen mobil gut bedienbar sein.  
6\.  \*\*Accessibility (a11y):\*\* Auf semantisches HTML, Tastaturnavigation, ARIA-Attribute achten. Farbkontraste prüfen.  
7\.  \*\*Performance:\*\* Code Splitting (sollte Framework übernehmen), Bildoptimierung, Lazy Loading für nicht sofort sichtbare Inhalte (Karte? Fotos?).

\#\#\# Phase 5: Testing & Deployment

1\.  \*\*Testing:\*\*  
    \*   Unit Tests für Hilfsfunktionen (z.B. Score-Farbe, Aspekt-Status).  
    \*   Komponententests für UI-Komponenten (insbesondere die \`PraxisCard\` und Analyse-Komponenten).  
    \*   (Optional) Integrationstests für User Flows (Suche \-\> Liste \-\> Detail).  
    \*   End-to-End-Tests (z.B. mit Cypress, Playwright).  
2\.  \*\*Deployment:\*\* Konfiguration für Deployment auf einer Plattform wie Vercel, Netlify oder Supabase Hosting. Umgebungsvariablen für Supabase URL/Anon Key setzen. Build-Prozess optimieren.

\---

\*\*Wichtige Hinweise für Entwickler:\*\*

\*   \*\*API-Abhängigkeit:\*\* Die Frontend-Entwicklung hängt stark von der Verfügbarkeit und Struktur der Backend-API ab. Enge Abstimmung mit dem Backend-Team (oder dem API-Design-Plan) ist notwendig. Mock-API oder Mock-Daten können initial helfen.  
\*   \*\*Datenstruktur:\*\* Vertrautheit mit den Feldern der Tabellen \`praxis\`, \`praxis\_analysis\`, \`service\` ist wichtig, um die Daten korrekt im Frontend zu mappen.  
\*   \*\*Authentizität:\*\* Bei der Formulierung von UI-Texten darauf achten, die Begriffe "KI", "Bewertung", "Rezension" zu vermeiden und stattdessen nutzerzentrierte Sprache ("Patienteneinblicke", "Erfahrungen") zu verwenden.  
\*   \*\*Performance:\*\* Die Übersichtsseite mit Filtern, Sortierung und Karte kann performance-intensiv werden. Optimierungen (Debouncing, Virtual Scrolling, serverseitige Filterung/Sortierung über API) frühzeitig einplanen.

