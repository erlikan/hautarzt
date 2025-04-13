## Backend Konzept Dokumentation: Hautarzt Vergleich

**Projektziel:** Aufbau der serverseitigen Infrastruktur für ein Hautarzt Vergleich. Das Backend ist verantwortlich für die Datenspeicherung, die automatisierte Analyse von Patientenerfahrungen mittels KI, die Berechnung eines individuellen Praxis-Scores und die Bereitstellung einer API für das Frontend.

**Technologie-Stack:**

*   **Datenbank:** Supabase (PostgreSQL)  
*   **KI-Analyse:** Google Generative AI (Gemini 1.5 Flash API)  
*   **Backend-Logik & API:** Supabase Edge Functions (Deno/TypeScript)  
*   **Automatisierung:** Supabase \`pg\_cron\`, PL/pgSQL Stored Procedures  
*   **Datenbank-Zugriff (intern):** \`postgres\` JS/TS Client (\`deno-postgres\`), Supabase Client (\`@supabase/supabase-js\`)

---

### 1. Architekturübersicht

Das Backend besteht aus mehreren Kernkomponenten, die interagieren:

1.  **Supabase Datenbank:** Speichert alle Rohdaten (Praxen, Reviews), Konfigurationen und die Ergebnisse der KI-Analyse.  
2.  **KI-Analyse-Pipeline (Automatisiert):**  
    *   Ein \`pg\_cron\`-Job stößt regelmäßig eine Trigger-Stored-Procedure (\`trigger\_pending\_practice\_analyses\`) an.  
    *   Diese identifiziert Praxen, die analysiert werden müssen (\`analysis\_status \= 'pending'/'failed'\`).  
    *   Sie ruft für jede identifizierte Praxis eine Supabase Edge Function (\`analyze-practice\`) via \`pg\_net\` auf.  
    *   Die \`analyze-practice\` Function holt Praxis- & Review-Daten, baut einen Prompt, ruft die Gemini API auf, parst die JSON-Antwort.  
    *   Die \`analyze-practice\` Function ruft eine Speicher-Stored-Procedure (\`save\_analysis\_data\`) auf.  
    *   Die \`save\_analysis\_data\` Procedure speichert die Analyse-Details, verarbeitet genannte Leistungen, berechnet den gewichteten \`overall\_score\` und aktualisiert den \`analysis\_status\` der Praxis atomar.  
3.  **Slug-Generierung:** Ein separates Python-Skript (\`scripts/generate\_slugs.py\`) wird (aktuell manuell) ausgeführt, um URL-freundliche Slugs für die Praxen zu erstellen und in der Datenbank zu speichern.  
4.  **Backend-API (für Frontend):**  
    *   Supabase Edge Functions (\`praxis-details\`, \`praxis-search\`) stellen definierte HTTP-Endpunkte bereit.  
    *   Diese Funktionen greifen auf die Datenbank zu (ggf. über Stored Procedures oder direkt), um aufbereitete Daten für das Frontend zu liefern.  
    *   PostgREST wird minimal für sehr einfache, öffentliche Daten genutzt (z.B. Serviceliste).

---

### 2. Datenbank Schema (Supabase/PostgreSQL)

*   **\`praxis\`:** Speichert Stammdaten der Praxen.  
    *   \`google\_place\_id\` (TEXT, PK): Eindeutiger Schlüssel.  
    *   \`slug\` (TEXT, Indexed, Unique per Stadt/PLZ empfohlen): Für SEO-freundliche URLs.  
    *   \`name\`, \`full\_address\`, \`city\`, \`postal\_code\`, \`state\`, \`latitude\`, \`longitude\`, \`phone\`, \`site\`, etc.: Basisinformationen.  
    *   \`location\` (GEOMETRY(Point, 4326), GIST Indexed): Für Geo-Suchen (PostGIS).  
    *   \`rating\`, \`reviews\`, \`reviews\_per\_score\_1\`-\`5\`: Google-Bewertungsdaten.  
    *   \`working\_hours\`, \`about\` (JSONB): Flexible Speicherung von Zusatzinfos.  
    *   \`analysis\_status\` (TEXT): Tracking des Analyse-Status ('pending', 'processing', 'completed', 'failed').  
    *   \`created\_at\`, \`updated\_at\` (TIMESTAMPTZ): Zeitstempel.  
*   **\`review\`:** Speichert Rohdaten der Google Reviews.  
    *   \`id\` (SERIAL, PK): Eigene ID pro Review-Eintrag.  
    *   \`praxis\_google\_place\_id\` (TEXT, FK zu \`praxis\`): Verknüpfung zur Praxis.  
    *   \`google\_review\_id\` (TEXT, UNIQUE): Zur Vermeidung von Duplikaten (falls verfügbar).  
    *   \`review\_text\`, \`review\_rating\`, \`review\_datetime\_utc\`: Kerninhalte der Bewertung.  
    *   \`created\_at\`, \`updated\_at\`.  
*   **\`praxis\_analysis\`:** Speichert die Ergebnisse der KI-Analyse.  
    *   \`praxis\_google\_place\_id\` (TEXT, PK, FK zu \`praxis\`): 1:1-Beziehung zur Praxis.  
    *   \`termin\_wartezeit\_positiv\`/\`\_neutral\`/\`\_negativ\` (SMALLINT): Prozentwerte für Aspekte. (Analog für \`freundlichkeit\_empathie\`, \`aufklaerung\_vertrauen\`, \`kompetenz\_behandlung\`, \`praxis\_ausstattung\`). Constraints stellen Summe=100 sicher.  
    *   \`tags\`, \`staerken\`, \`schwaechen\`, \`mentioned\_doctors\`, \`emotionale\_tags\`, \`haeufig\_genannte\_begriffe\` (TEXT\[\]): Listen aus der Analyse.  
    *   \`trend\` (TEXT), \`trend\_begruendung\` (TEXT), \`vergleich\_kasse\_privat\` (TEXT), \`zusammenfassung\` (TEXT): Weitere Analyseergebnisse.  
    *   \`overall\_score\` (DECIMAL(5, 2), Indexed): Der berechnete Gesamtscore (0-100).  
    *   \`analyzed\_at\`, \`last\_error\_message\`, \`created\_at\`, \`updated\_at\`.  
*   **\`service\`:** Definiert mögliche medizinische/kosmetische Leistungen.  
    *   \`id\` (SERIAL, PK).  
    *   \`name\` (TEXT, UNIQUE).  
    *   \`created\_at\`, \`updated\_at\`.  
*   **\`praxis\_service\`:** Verknüpfungstabelle (M:N) zwischen \`praxis\` und \`service\`.  
    *   \`praxis\_google\_place\_id\` (TEXT, FK).  
    *   \`service\_id\` (INTEGER, FK).  
    *   \`(praxis\_google\_place\_id, service\_id)\` (PK).  
*   **\`app\_config\`:** Speichert Konfigurationswerte sicher für Stored Procedures.  
    *   \`key\` (TEXT, PK).  
    *   \`value\` (TEXT).  
    *   Zugriffsrechte sind stark eingeschränkt (nur Admin/\`postgres\`-User).

---

### 3. KI-Analyse-Pipeline

*   **Status:** **Implementiert und funktionsfähig.**  
*   **Trigger:** \`pg\_cron\` Job (\`trigger-practice-analysis\`) läuft alle 5 Minuten.  
*   **Steuerung:** Ruft Stored Procedure \`trigger\_pending\_practice\_analyses(batch\_size)\` auf.  
    *   Diese wählt Praxen mit Status \`pending\` oder \`failed\` aus (\`FOR UPDATE SKIP LOCKED\`).  
    *   Setzt deren Status auf \`processing\`.  
    *   Liest API Key und Function URL sicher aus \`app\_config\`.  
    *   Ruft für jede Praxis die \`analyze-practice\` Edge Function via \`pg\_net.http\_post\` (asynchron mit Timeout) auf.  
*   **Analyse (\`analyze-practice\` Edge Function):**  
    *   Nimmt \`praxis\_google\_place\_id\` entgegen.  
    *   Holt Praxis- & Review-Daten aus der DB.  
    *   Baut den optimierten Prompt für Gemini (fokussiert auf authentische Patientensicht, filtert generische Begriffe).  
    *   Ruft Gemini 1.5 Flash API auf (\`responseMimeType: "application/json"\`).  
    *   Extrahiert und validiert die JSON-Antwort (behandelt Markdown-Codeblöcke).  
    *   Ruft die \`save\_analysis\_data\` Stored Procedure auf.  
    *   Umfangreiches Error-Handling und Logging. Setzt Status auf \`failed\` bei Fehlern.  
*   **Speicherung (\`save\_analysis\_data\` Stored Procedure):**  
    *   Nimmt \`praxis\_google\_place\_id\` und Analyse-JSON entgegen.  
    *   Speichert/Aktualisiert (\`UPSERT\`) die Analyse-Daten in \`praxis\_analysis\`.  
    *   Verarbeitet \`genannte\_leistungen\`: Legt neue Services in \`service\` an (falls nötig) und aktualisiert die Verknüpfungen in \`praxis\_service\` (löscht alte, fügt neue hinzu).  
    *   **Berechnet \`overall\_score\`:** Verwendet eine **gewichtete Formel** basierend auf:  
        *   Gewichteter Durchschnitt der 5 KI-Aspekt-Scores (\`pos% \- neg%\`), wobei Kompetenz & Aufklärung stärker gewichtet werden (je 30%).  
        *   Normalisiertes Google Rating (Gewicht 30%).  
        *   KI-Trend (Gewicht 10%, als Bonus/Malus).  
        *   Optionaler Malus bei sehr wenigen Google Reviews (\<10).  
    *   Speichert den \`overall\_score\`.  
    *   Setzt \`praxis.analysis\_status\` auf \`completed\`.  
    *   Läuft **atomar** (alle Änderungen innerhalb der Prozedur sind eine Transaktion).

---

### 4. Backend API (für Frontend)

*   **Strategie:** Kombination aus PostgREST für sehr einfache Daten und Edge Functions für komplexe Abfragen/Logik. Frontend-Entwickler sollen **nur** die definierten Endpunkte nutzen.  
*   **Implementierte Endpunkte:**  
    *   **\`GET /rest/v1/service?select=id,name\` (PostgREST)\**  
        *   **Zweck:** Abruf der Liste aller Leistungen für Filter-UI.  
        *   **Status:** **Funktionsfähig** (auto-generiert durch Supabase).  
        *   **Sicherheit:** Benötigt \`anon\` Key; RLS auf \`service\`-Tabelle empfohlen (mindestens Leserechte für \`anon\` oder \`authenticated\`).  
    *   **\`GET /api/praxis-details/{stadtSlug}/{praxisSlug}\` (Edge Function \`praxis-details\`)\**  
        *   **Zweck:** Liefert alle Detailinformationen für eine einzelne Praxis.  
        *   **Status:** **Implementiert und funktionsfähig.**  
        *   **Logik:** Findet Praxis via \`slug\`, holt Daten aus \`praxis\`, \`praxis\_analysis\` und \`service\` (via Join oder separaten Abfragen) und kombiniert sie.  
        *   **Sicherheit:** Benötigt \`anon\` Key; keine spezielle Autorisierung implementiert.  
*   **Ausstehende/Problematische Endpunkte:**  
    *   **\`GET /api/praxis-search\` (Edge Function \`praxis-search\`)\**  
        *   **Zweck:** Haupt-Suchfunktion mit Filterung (Stadt, PLZ, Geo, Score, Services), Sortierung (Score, Distanz, Name) und Paginierung.  
        *   **Status:** **Implementierung angefangen, aber wegen Komplexität des dynamischen SQL-Buildings in der Edge Function zurückgestellt.** Die aktuelle Implementierung (ohne Stored Procedure) ist unvollständig und nicht robust getestet.  
        *   **Geplante Logik (in Edge Function):**  
            *   Parameter parsen und validieren.  
            *   Dynamisch eine **sichere, parametrisierte SQL-Abfrage** bauen (inkl. Joins, WHERE, ORDER BY, LIMIT, OFFSET).  
            *   Zwei Abfragen ausführen: Eine für die Daten der aktuellen Seite, eine für die Gesamtzahl der Treffer (\`COUNT\`).  
            *   Ergebnisse formatieren (inkl. Paginierungs-Metadaten) und als JSON zurückgeben.  
            *   **Offene Punkte:** Sichere und korrekte Ausführung der dynamisch gebauten, parametrisierten Query aus TypeScript (z.B. mit \`pg\`-Treiber oder angepasster Supabase Client Nutzung).  
        *   **Sicherheit:** Benötigt \`anon\` Key; Input-Validierung der Query-Parameter ist essentiell.

---

### 5. Slug Generierung

*   **Status:** **Implementiert** (als Python-Skript \`scripts/generate\_slugs.py\`).  
*   **Prozess:**  
    *   Liest Praxen aus der DB.  
    *   Generiert URL-freundlichen Slug aus Praxisnamen.  
    *   Stellt Eindeutigkeit pro PLZ sicher (fügt Zähler an bei Konflikt).  
    *   Schreibt Slugs zurück in die \`praxis.slug\`-Spalte.  
*   **Ausführung:** Aktuell manuell. Muss bei neuen Praxen oder Namensänderungen erneut ausgeführt werden (oder in einen automatisierten Prozess integriert werden).

---

### 6. Sicherheitsaspekte

*   **API Keys:**  
    *   **\`HAUTARZT\_SUPABASE\_SERVICE\_KEY\`:** Wird sicher als Secret für Edge Functions gespeichert und sicher aus \`app\_config\` von Stored Procedures gelesen. Wird für alle Backend-internen DB-Operationen mit Admin-Rechten verwendet. **Darf niemals im Frontend landen\!\***  
    *   **\`HAUTARZT\_SUPABASE\_ANON\_KEY\`:** Wird im Frontend verwendet, um die API-Endpunkte aufzurufen. Benötigt entsprechende RLS-Policies und \`GRANT\`-Berechtigungen auf die API-Funktionen (\`search\_praxen\` SP, \`praxis-details\` EF, PostgREST für \`service\`).  
*   **Rate Limiting:**  
    *   **Supabase Built-in:** Supabase hat Standard-Limits für API-Aufrufe und Function Invocations. Diese sollten überwacht werden.  
    *   **Gemini API:** Die Google AI API hat eigene Rate Limits. Die Analyse-Pipeline (insbesondere die Batch-Size im \`trigger\_pending\_practice\_analyses\`-Job) muss ggf. angepasst werden, um diese nicht zu überschreiten.  
    *   **Benutzer-API (\`praxis-search\`, \`praxis-details\`):** Aktuell kein spezifisches Rate Limiting implementiert. Für Produktionsbetrieb sollte dies erwogen werden (z.B. über Supabase Add-ons, API Gateway oder Middleware im Frontend-Server), um Missbrauch und Scraping zu verhindern.  
*   **Row Level Security (RLS):**  
    *   **Empfohlen:** RLS sollte auf den Tabellen aktiviert werden, auf die potenziell über den \`anon\` Key zugegriffen wird (\`praxis\`, \`praxis\_analysis\`, \`service\`, \`praxis\_service\`).  
    *   Policies sollten mindestens Leserechte für \`anon\` oder \`authenticated\` gewähren, wo nötig.  
    *   Die Backend-Prozesse, die den \`service\_role\` Key nutzen, umgehen RLS standardmäßig.  
*   **Input Validierung:**  
    *   **Edge Functions:** Alle Query-Parameter und Request-Bodies **müssen** serverseitig validiert werden (Datentyp, Wertebereich, Länge etc.), bevor sie in SQL-Abfragen verwendet werden. Dies ist entscheidend, um Fehler und potenzielle Sicherheitslücken zu vermeiden.  
*   **SQL Injection:** Durch die geplante Verwendung von **parametrisierten Abfragen** (entweder über den DB-Treiber in der \`praxis-search\`-Function oder \`EXECUTE ... USING ...\` in Stored Procedures) wird SQL-Injection verhindert. Manuelle String-Konkatenation mit Benutzereingaben ist **strikt zu vermeiden**.

---

### 7. Aktueller Status & Nächste Schritte

*   **Funktionsfähig:**  
    *   Datenbankschema  
    *   KI-Analyse-Pipeline (automatisiert via Cron)  
    *   Berechnung des gewichteten Overall Scores  
    *   API-Endpunkt für Praxis-Details (\`praxis-details\`)  
    *   API-Endpunkt für Leistungsliste (PostgREST)  
    *   Slug-Generierung (manuell)  
*   **Ausstehend / Benötigt Arbeit:**  
    *   **Robuste Implementierung der \`praxis-search\` Edge Function:** Sicheres und korrektes Bauen und Ausführen der dynamischen, parametrisierten SQL-Abfrage für Filterung, Sortierung, Geo-Suche und Paginierung.  
    *   Implementierung der Frontend-Anwendung.  
    *   Detaillierte SEO-Strategie und technische Umsetzung (Schema.org etc.).  
    *   (Optional/Zukunft) Award-Berechnung, Nutzungsstatistiken, Authentifizierung, erweitertes Monitoring, Rate Limiting.  
*   **Empfohlene nächste Schritte:**  
    1.  SEO-Strategie detaillieren (insbesondere \`Schema.org\`).  
    2.  Frontend-Entwicklung starten (fokussiert auf \`praxis-details\`).  
    3.  API-Dokumentation für das Frontend-Team erstellen (für die funktionierenden Teile).  
    4.  Implementierung der \`praxis-search\`-Function zu einem späteren Zeitpunkt wieder aufnehmen und abschließen.

