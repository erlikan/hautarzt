\# Gesamt-Implementierungsplan: Hautarzt-Verzeichnis

\*\*Projektübersicht:\*\* Erstellung einer modernen Webanwendung, die Hautarztpraxen in Deutschland listet und detaillierte Patienteneinblicke basierend auf KI-analysierten Google Reviews und einem eigenen Bewertungsscore bietet.

\*\*Zielgruppe:\*\* Patienten auf der Suche nach einem passenden Hautarzt.

\*\*Kerntechnologien:\*\*

\*   \*\*Backend:\*\* Supabase (PostgreSQL, Edge Functions \- Deno/TypeScript, pg\_cron, PostgREST), Google Gemini API, Python (für Skripte).  
\*   \*\*Frontend:\*\* Modernes JavaScript-Framework (z.B. Next.js, Nuxt.js, SvelteKit), Supabase Client Library (\`@supabase/supabase-js\`), Kartenbibliothek (Leaflet/Mapbox), Chart-Bibliothek.

\*\*Verantwortlichkeiten (Annahme):\*\*

\*   \*\*Backend-Lead (Du):\*\* Implementierung/Wartung der Edge Functions, Stored Procedures, DB-Schema, KI-Pipeline-Logik.  
\*   \*\*Frontend-Lead (Du):\*\* Implementierung der Benutzeroberfläche und Interaktion mit der bereitgestellten Backend-API.

\---

\#\# Phase 1: Vorbereitung & Setup (Teilweise erledigt)

\*   \*\*\[✓\] Backend:\*\* Supabase-Projekt eingerichtet.  
\*   \*\*\[✓\] Backend:\*\* Datenbankschema erstellt und angepasst (Tabellen: \`praxis\`, \`review\`, \`praxis\_analysis\`, \`service\`, \`praxis\_service\`, \`app\_config\`). PostGIS aktiviert.  
\*   \*\*\[✓\] Backend:\*\* Rohdaten (Praxen, Reviews) in die Datenbank importiert.  
\*   \*\*\[✓\] Backend:\*\* KI-Analyse-Pipeline (\`analyze-practice\` EF, \`save\_analysis\_data\` SP, \`trigger\_pending\_practice\_analyses\` SP, \`pg\_cron\` Job) implementiert und läuft. \`overall\_score\` wird berechnet.  
\*   \*\*\[✓\] Backend:\*\* API-Endpunkt für Praxis-Details (\`praxis-details\` EF) implementiert und funktionsfähig.  
\*   \*\*\[✓\] Backend:\*\* API-Endpunkt für Serviceliste (PostgREST \`/rest/v1/service\`) verfügbar.  
\*   \*\*\[✓\] Backend:\*\* Slug-Generierungs-Skript (\`generate\_slugs.py\`) erstellt und Slugs in \`praxis.slug\` generiert.  
\*   \*\*\[ \] Frontend:\*\* Projekt initialisieren (siehe Frontend Konzept Dokumentation, Phase 1). Wahl des Frameworks treffen.  
\*   \*\*\[ \] Frontend:\*\* Basis-Layout (Header, Footer, Inhaltsbereich), Routing-Grundgerüst und Styling-System einrichten.  
\*   \*\*\[ \] Frontend:\*\* Supabase Client (\`supabase-js\`) im Frontend konfigurieren (mit Anon Key).

\---

\#\# Phase 2: Kernfunktionalität \- Praxisdetails & SEO-Grundlagen

\*   \*\*Ziel:\*\* Die Detailseite, das Herzstück der Anwendung, funktionsfähig machen und die SEO-Basis legen.  
\*   \*\*Aufgaben:\*\*  
    1\.  \*\*Backend/API-Dokumentation:\*\*  
        \*   \*\*\[ \] Doku:\*\* Erstelle eine klare Dokumentation für die \*\*funktionierenden\*\* API-Endpunkte:  
            \*   \`GET /api/praxis-details/{stadtSlug}/{praxisSlug}\`: Beschreibe URL-Parameter, erwartete Antwortstruktur (\`PraxisDetail\` Interface), Beispiel-Antwort.  
            \*   \`GET /rest/v1/service?select=id,name\`: Beschreibe Zweck und Antwortstruktur (\`Service\[\]\` Interface).  
        \*   Stelle diese Dokumentation dem Frontend-Team zur Verfügung.  
    2\.  \*\*SEO-Strategie (\`Schema.org\`):\*\*  
        \*   \*\*\[ \] Definition:\*\* Definiere die exakte JSON-LD-Struktur für \`Schema.org\` auf der \*\*Praxis-Detailseite\*\*.  
            \*   Haupttyp: \`MedicalClinic\` oder \`Physician\` (je nachdem, was besser passt).  
            \*   Properties: \`name\`, \`address\` (als \`PostalAddress\`), \`telephone\`, \`url\`, \`geo\` (als \`GeoCoordinates\`), \`image\` (Praxisfoto), \`openingHoursSpecification\`.  
            \*   \*\*\`aggregateRating\`:\*\*  
                \*   \`@type\`: \`AggregateRating\`  
                \*   \`ratingValue\`: Der Wert unseres \`overall\_score\` (skaliert auf 1-5 oder direkt 0-100? Normale Skala ist 1-5, wir müssen unseren Score umrechnen, z.B. \`round(overall\_score / 20, 1)\`).  
                \*   \`bestRating\`: "5" (oder "100").  
                \*   \`worstRating\`: "1" (oder "0").  
                \*   \`ratingCount\`: Die Anzahl der Google Reviews (\`praxis.reviews\`).  
            \*   \*\*(Optional) \`review\`:\*\*  
                \*   \`@type\`: \`Review\`  
                \*   \`author\`: \`@type\`: \`Person\`, \`name\`: "Zusammengefasste Patientenerfahrungen" (oder ähnlich anonym).  
                \*   \`reviewBody\`: Die KI-generierte \`zusammenfassung\` aus \`praxis\_analysis\`.  
                \*   \`reviewRating\`: \`@type\`: \`Rating\`, \`ratingValue\`: (Der umgerechnete \`overall\_score\`), \`bestRating\`: "5", \`worstRating\`: "1".  
                \*   \*\*Hinweis:\*\* Prüfen, ob die Verwendung der KI-Zusammenfassung als \`reviewBody\` den Google-Richtlinien entspricht. Eventuell weglassen.  
        \*   Dokumentiere diese Struktur für das Frontend-Team.  
    3\.  \*\*Frontend \- Praxis-Detailseite (\`/hautarzt/\[stadtSlug\]/\[praxisSlug\]\`):\*\*  
        \*   \*\*\[ \] Implementierung:\*\* Baue die Detailseiten-Komponente.  
        \*   \*\*\[ \] Daten-Fetching:\*\* Implementiere das Laden der Daten über die \`GET /api/praxis-details/...\` API (z.B. in \`getServerSideProps\`/\`getStaticProps\`/\`load\`). Handle Loading/Error States.  
        \*   \*\*\[ \] UI-Darstellung:\*\*  
            \*   Zeige alle Basis-Praxisinfos (Header, Karte, Kontakte).  
            \*   Implementiere das \*\*KI-Analyse-Dashboard\*\*:  
                \*   Zeige den \`overall\_score\` als Zahl mit dynamischer Farbe.  
                \*   Implementiere die 5 \`AspectAnalysisCard\`-Komponenten mit den Balkendiagrammen für Positiv/Neutral/Negativ (nutze Chart-Bibliothek).  
                \*   Zeige Trend-Indikator, Stärken/Schwächen-Listen, Kasse/Privat-Info, Tag Clouds etc. an (basierend auf den API-Daten).  
            \*   Zeige die Sektion "Angebotene Leistungen" (basierend auf \`services\` aus API).  
            \*   Zeige Praxisinformationen (Öffnungszeiten, Fotos, Barrierefreiheit).  
        \*   \*\*\[ \] SEO-Implementierung:\*\*  
            \*   Setze dynamisch \`\<title\>\` und \`\<meta name="description"\>\` (z.B. "{Praxisname} \- Hautarzt in {Stadt} | Patienteneinblicke").  
            \*   Implementiere das definierte \*\*JSON-LD (\`Schema.org\`)\*\* Script basierend auf den geladenen Daten.  
        \*   \*\*\[ \] Responsiveness:\*\* Stelle sicher, dass die Seite auf allen Geräten gut aussieht und funktioniert.

\---

\#\# Phase 3: Kernfunktionalität \- Suche & Übersicht

\*   \*\*Ziel:\*\* Dem Nutzer ermöglichen, Praxen zu finden und die Ergebnisse zu filtern/sortieren.  
\*   \*\*Abhängigkeit:\*\* Erfordert einen funktionierenden \`/api/praxis-search\` Endpunkt.  
\*   \*\*Aufgaben:\*\*  
    1\.  \*\*Backend \- \`praxis-search\` API:\*\*  
        \*   \*\*\[ \] Implementierung/Finalisierung:\*\* Implementiere die \`praxis-search\` Edge Function robust (idealerweise durch Aufruf einer finalen, funktionierenden \`search\_praxen\` Stored Procedure oder durch sicheres Query Building in der Function selbst, wie zuletzt besprochen). Stelle sicher, dass alle Filter (insbesondere Geo & Services) und Sortierungen korrekt und sicher funktionieren.  
        \*   \*\*\[ \] API-Dokumentation:\*\* Dokumentiere den finalen \`/api/praxis-search\` Endpunkt detailliert (alle Query-Parameter, Antwortstruktur \`SearchApiResponse\`).  
    2\.  \*\*Frontend \- Übersichtsseite (\`/hautarzt/\[stadtSlug\]\`):\*\*  
        \*   \*\*\[ \] Implementierung:\*\* Baue die Übersichtsseiten-Komponente.  
        \*   \*\*\[ \] Daten-Fetching:\*\* Implementiere das Laden der Daten über die \`/api/praxis-search\` API. Übergebe initiale Filter/Sortierparameter (z.B. Stadt aus URL, Standard-Sortierung).  
        \*   \*\*\[ \] Filter-UI:\*\* Implementiere die \`FilterSidebar\` mit allen Filteroptionen (Score, Aspekte, Leistungen etc.). Bei Änderung: Aktualisiere den API-Call und die Ergebnisliste.  
        \*   \*\*\[ \] Sortier-UI:\*\* Implementiere das \`SortDropdown\`. Bei Änderung: Aktualisiere den API-Call.  
        \*   \*\*\[ \] Praxis-Liste:\*\* Implementiere die \`PraxisList\` und die \`PraxisCard\`-Komponente (wie im Frontend Konzept beschrieben, mit Score, Aspekt-Icons, Snippet, Tags etc.).  
        \*   \*\*\[ \] Kartenansicht:\*\* Implementiere die \`MapView\`-Komponente (Marker, Popups, Marker-Styling nach Score). Synchronisiere sie mit der gefilterten/sortierten Liste.  
        \*   \*\*\[ \] Pagination:\*\* Implementiere die Paginierungs-Logik basierend auf den \`meta\`-Daten aus der API.  
        \*   \*\*\[ \] SEO-Implementierung:\*\* Setze dynamisch \`\<title\>\` und \`\<meta name="description"\>\` (z.B. "Hautärzte in {Stadt} | Beste Praxen finden"). Implementiere JSON-LD (\`ItemList\`).  
        \*   \*\*\[ \] Responsiveness:\*\* Optimiere Filter, Karte und Liste für mobile Geräte.

\---

\#\# Phase 4: Abschluss & Optimierung

\*   \*\*Ziel:\*\* Feinschliff, Testing, Performance-Optimierung und Vorbereitung für den Launch.  
\*   \*\*Aufgaben:\*\*  
    1\.  \*\*Frontend/Backend:\*\*  
        \*   \*\*\[ \] Award/Badge-System:\*\*  
            \*   Backend: Logik zur Award-Berechnung implementieren (z.B. nächtlicher Job). API erweitern, um Badges zu liefern.  
            \*   Frontend: Award-Badges auf Übersichts- und Detailseiten anzeigen.  
        \*   \*\*\[ \] Fehlerbehandlung:\*\* Überprüfe und verbessere die Fehlerbehandlung im Frontend (Nutzerfeedback) und Backend (Logging).  
        \*   \*\*\[ \] Performance:\*\* Analysiere Ladezeiten (insbesondere der Übersichtsseite mit Karte/Filtern). Optimiere API-Antworten, Frontend-Code (Code Splitting, Lazy Loading), Bildgrößen.  
        \*   \*\*\[ \] Sicherheit:\*\*  
            \*   Implementiere Rate Limiting für die öffentlichen API-Endpunkte (\`praxis-search\`, \`praxis-details\`).  
            \*   Überprüfe RLS-Policies in Supabase.  
            \*   Stelle sicher, dass alle Benutzereingaben (Suchfeld, Filter) validiert werden.  
        \*   \*\*\[ \] Testing:\*\* Führe umfassende Tests durch (Komponenten, Integration, E2E, Cross-Browser).  
    2\.  \*\*SEO:\*\*  
        \*   \*\*\[ \] Sitemap:\*\* Generiere und übermittle eine \`sitemap.xml\`.  
        \*   \*\*\[ \] \`robots.txt\`:\*\* Konfiguriere die Indexierungsregeln.  
        \*   \*\*\[ \] Monitoring:\*\* Richte Google Search Console und ggf. andere SEO-Tools ein.  
    3\.  \*\*Inhalt/Daten:\*\*  
        \*   \*\*\[ \] Datenqualität:\*\* Überprüfe die Ergebnisse der KI-Analyse stichprobenartig. Passe ggf. den Gemini-Prompt weiter an.  
        \*   \*\*\[ \] Umgang mit fehlenden Daten:\*\* Stelle sicher, dass Praxen ohne Analyse oder ohne bestimmte Infos (z.B. Öffnungszeiten) im Frontend sinnvoll dargestellt werden.  
        \*   \*\*\[ \] Impressum/Datenschutz:\*\* Erstelle die notwendigen rechtlichen Texte.  
    4\.  \*\*Deployment:\*\* Finale Deployment-Konfiguration, Domain-Setup.

\---

\*\*Nächste konkrete Schritte (basierend auf unserem Gespräch):\*\*

1\.  \*\*Du (Backend-Lead):\*\*  
    \*   Dokumentiere die API-Endpunkte \`GET /api/praxis-details/{stadtSlug}/{praxisSlug}\` und \`GET /rest/v1/service?select=id,name\`.  
    \*   Definiere die \`Schema.org\`-Struktur für die Detailseite.  
2\.  \*\*Frontend-Team:\*\*  
    \*   Beginnt mit Phase 1 (Projekt-Setup, Basis-Layout, Routing, Styling).  
    \*   Beginnt mit Phase 2 (API Service Layer, Implementierung der \*\*Praxis-Detailseite\*\* basierend auf deiner API-Doku und den Schema.org-Vorgaben).

Parallel dazu kannst du (oder wir gemeinsam) zu einem späteren Zeitpunkt die robuste Implementierung der \`praxis-search\`-Funktion wieder aufnehmen.  
