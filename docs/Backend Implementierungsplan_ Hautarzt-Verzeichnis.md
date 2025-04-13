\# Backend Implementierungsplan: Hautarzt-Verzeichnis

\*\*Ziel:\*\* Implementierung und Wartung der serverseitigen Infrastruktur für das Hautarzt-Verzeichnis unter Verwendung von Supabase (PostgreSQL, Edge Functions, Cron), Google Gemini API und unterstützenden Skripten.

\*\*Verantwortlichkeit:\*\* Backend-Lead (Du)

\---

\#\#\# Phase 1: Datenbank Setup & Initialisierung (Größtenteils abgeschlossen)

\*   \*\*1.1. \[✓\] Supabase Projekt erstellen:\*\* Ein Supabase-Projekt wurde eingerichtet.  
\*   \*\*1.2. \[✓\] Datenbank Schema definieren & erstellen:\*\*  
    \*   Erstellung der Tabellen: \`praxis\`, \`review\`, \`praxis\_analysis\`, \`service\`, \`praxis\_service\`, \`app\_config\`.  
    \*   Definition der Spalten, Datentypen, Primär- und Fremdschlüssel (mit \`google\_place\_id\` als Hauptschlüssel für \`praxis\`).  
    \*   Hinzufügen spezifischer Spalten: \`praxis.slug\`, \`praxis.analysis\_status\`, \`praxis.location\` (GEOMETRY), \`praxis\_analysis.overall\_score\`, \`praxis\_analysis.last\_error\_message\`, \`praxis\_analysis.mentioned\_doctors\` etc.  
    \*   SQL \`CREATE TABLE\`-Skripte wurden ausgeführt.  
\*   \*\*1.3. \[✓\] PostgreSQL Extensions aktivieren:\*\*  
    \*   \`postgis\` für Geo-Funktionen wurde aktiviert.  
    \*   \`moddatetime\` für automatische \`updated\_at\`-Zeitstempel wurde aktiviert.  
    \*   \`pg\_cron\` für geplante Aufgaben wurde aktiviert.  
    \*   \`pg\_net\` für HTTP-Requests aus Stored Procedures wurde aktiviert.  
    \*   Entsprechende \`GRANT\`-Berechtigungen für \`postgres\`/\`service\_role\` wurden gesetzt.  
\*   \*\*1.4. \[✓\] Indizes erstellen:\*\* Notwendige Indizes wurden erstellt für:  
    \*   Fremdschlüssel (\`praxis\_google\_place\_id\` in \`review\` etc.).  
    \*   Häufige Filter-/Sortierfelder (\`city\`, \`postal\_code\`, \`slug\`, \`overall\_score\`).  
    \*   Geo-Suche (\`GIST index\` auf \`praxis.location\`).  
    \*   Array-Suchen (\`GIN index\` auf \`tags\`, \`mentioned\_doctors\` etc. in \`praxis\_analysis\`).  
\*   \*\*1.5. \[✓\] Trigger einrichten:\*\* Automatische \`updated\_at\`-Trigger wurden für alle relevanten Tabellen mittels \`moddatetime\` eingerichtet.  
\*   \*\*1.6. \[✓\] Konfigurationstabelle befüllen (\`app\_config\`):\*\*  
    \*   Sicheres Speichern des \`SUPABASE\_SERVICE\_KEY\` und der \`ANALYZE\_PRACTICE\_FUNCTION\_URL\` in der \`app\_config\`-Tabelle.  
    \*   Zugriffsrechte wurden auf den \`postgres\`-User beschränkt.  
\*   \*\*1.7. \[✓\] Rohdaten importieren:\*\* Beispiel- oder vollständige Daten für \`praxis\` und \`review\` wurden aus CSV-Dateien in die Datenbank importiert.  
\*   \*\*1.8. \[✓\] Geo-Daten generieren:\*\* Sicherstellen, dass die \`praxis.location\`-Spalte korrekt aus \`latitude\`/\`longitude\` befüllt wurde (z.B. per \`UPDATE praxis SET location \= ST\_SetSRID(ST\_MakePoint(longitude, latitude), 4326\) WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;\`).  
\*   \*\*1.9. \[✓\] Slugs generieren:\*\* Das Python-Skript \`generate\_slugs.py\` wurde ausgeführt, um die \`praxis.slug\`-Spalte zu befüllen.  
    \*   \*\*\[ \] TODO (Optional):\*\* Prozess zur automatischen Slug-Generierung für \*neue\* Praxen oder bei Namensänderungen definieren (z.B. DB-Trigger oder regelmäßiges Skript).

\---

\#\#\# Phase 2: KI-Analyse-Pipeline Implementierung (Größtenteils abgeschlossen)

\*   \*\*2.1. \[✓\] \`save\_analysis\_data\` Stored Procedure:\*\*  
    \*   Implementierung der Logik zum Speichern/Aktualisieren der Analyse-Ergebnisse in \`praxis\_analysis\`.  
    \*   Implementierung der Verarbeitung von \`genannte\_leistungen\` (Upsert in \`service\`, Aktualisierung von \`praxis\_service\`).  
    \*   Implementierung der Berechnung des gewichteten \`overall\_score\`.  
    \*   Implementierung des Updates für \`praxis.analysis\_status\` auf \`completed\`.  
    \*   Sicherstellung der Atomarität (läuft als einzelne Transaktion).  
    \*   Berechtigungen für \`service\_role\` gesetzt.  
\*   \*\*2.2. \[✓\] \`analyze-practice\` Edge Function:\*\*  
    \*   Erstellung der Funktion in \`supabase/functions/analyze-practice\`.  
    \*   Implementierung der Logik:  
        \*   Input: \`praxis\_google\_place\_id\`.  
        \*   Datenabruf aus \`praxis\` und \`review\`.  
        \*   Dynamisches Bauen des Prompts für Gemini (optimierte Version).  
        \*   Aufruf der Gemini API (inkl. Fehlerbehandlung, JSON-Extraktion).  
        \*   Validierung der Gemini-Antwort (Basis-Validierung implementiert).  
        \*   Aufruf der \`save\_analysis\_data\` Stored Procedure.  
        \*   Umfassendes Logging und Fehlerbehandlung (setzt \`praxis.analysis\_status\` auf \`failed\` bei Fehlern).  
    \*   Konfiguration der Secrets (\`HAUTARZT\_SUPABASE\_URL\`, \`HAUTARZT\_SUPABASE\_SERVICE\_KEY\`, \`GEMINI\_API\_KEY\`) im Supabase Dashboard.  
    \*   Deployment und Test der Funktion.  
\*   \*\*2.3. \[✓\] \`trigger\_pending\_practice\_analyses\` Stored Procedure:\*\*  
    \*   Implementierung der Logik zum Finden pendenter/fehlgeschlagener Praxen (\`FOR UPDATE SKIP LOCKED\`).  
    \*   Implementierung des Setzens des Status auf \`processing\`.  
    \*   Sicheres Lesen von API Key und Function URL aus \`app\_config\`.  
    \*   Implementierung des asynchronen Aufrufs der \`analyze-practice\` Function via \`pg\_net.http\_post\` für jede Praxis im Batch.  
    \*   Fehlerbehandlung beim Triggering.  
    \*   Berechtigungen gesetzt.  
\*   \*\*2.4. \[✓\] \`pg\_cron\` Job:\*\*  
    \*   Einrichtung des Cronjobs (\`trigger-practice-analysis\`), der \`trigger\_pending\_practice\_analyses\` alle 5 Minuten mit \`SELECT\` aufruft.  
    \*   Monitoring der Job-Ausführung (\`cron.job\_run\_details\`).

\---

\#\#\# Phase 3: Backend-API für Frontend (Teilweise implementiert)

\*   \*\*3.1. \[✓\] Serviceliste API (PostgREST):\*\*  
    \*   Endpunkt \`GET /rest/v1/service?select=id,name\` ist automatisch verfügbar.  
    \*   \*\*\[ \] TODO:\*\* RLS-Policy für \`service\`-Tabelle definieren, um Leserechte für \`anon\` oder \`authenticated\` zu gewähren.  
\*   \*\*3.2. \[✓\] Praxis-Details API (\`praxis-details\` Edge Function):\*\*  
    \*   Erstellung der Funktion in \`supabase/functions/praxis-details\`.  
    \*   Implementierung der Logik:  
        \*   Input: \`stadtSlug\`, \`praxisSlug\` aus URL-Pfad.  
        \*   Abruf der Praxisdaten inklusive \`praxis\_analysis\` und \`service\`-Namen mittels Supabase Client und relationaler Abfrage (\`select\`).  
        \*   Formatierung der Antwort als \`PraxisDetail\` JSON-Objekt.  
        \*   Fehlerbehandlung (404 bei nicht gefundener Praxis, 500 bei DB-Fehlern).  
    \*   Secrets konfiguriert.  
    \*   Deployment und Test der Funktion.  
    \*   \*\*\[ \] TODO:\*\* RLS/Berechtigungen prüfen (aktuell mit Service Key, ggf. auf Anon Key umstellen, wenn RLS sicher ist).  
\*   \*\*3.3. \[ \] Praxis-Suche API (\`praxis-search\` Edge Function):\*\*  
    \*   \*\*Status:\*\* \*\*Zurückgestellt.\*\* Die Implementierung der komplexen, dynamischen und parametrisierten SQL-Abfrage direkt in der Edge Function ist fehlgeschlagen bzw. erfordert tiefergehende Kenntnisse spezifischer DB-Treiber oder eine robustere Query-Building-Strategie.  
    \*   \*\*Geplante nächste Schritte (später):\*\*  
        \*   \*\*Option A:\*\* Implementierung mit direktem DB-Treiber (\`deno-postgres\` oder \`postgres.js\`) und sorgfältigem Aufbau der parametrisierten Query in TypeScript.  
        \*   \*\*Option B (Bevorzugt):\*\* Entwicklung einer \*\*neuen Stored Procedure\*\* \`search\_praxen\_v2(...)\`, die die \*gesamte\* Such-, Filter-, Sortier- und Paginierungslogik kapselt und nur die finalen Daten \+ Count zurückgibt. Die \`praxis-search\` Edge Function wird dann sehr einfach und ruft nur noch diese Prozedur via \`.rpc()\` auf. Dies ist der sauberste Ansatz.  
    \*   \*\*\[ \] TODO (Wenn Option B gewählt):\*\* Stored Procedure \`search\_praxen\_v2\` entwerfen und implementieren.  
    \*   \*\*\[ \] TODO:\*\* Edge Function \`praxis-search\` finalisieren (entweder mit DB-Treiber oder RPC-Aufruf).  
    \*   \*\*\[ \] TODO:\*\* Umfassendes Testen mit allen Parameterkombinationen.  
    \*   \*\*\[ \] TODO:\*\* Deployment.  
    \*   \*\*\[ \] TODO:\*\* RLS/Berechtigungen prüfen.  
\*   \*\*3.4. \[ \] API-Dokumentation:\*\*  
    \*   Dokumentiere die \*\*funktionierenden\*\* Endpunkte (\`/rest/v1/service\`, \`/api/praxis-details\`) für das Frontend-Team (Struktur, Parameter, Beispiel).  
    \*   Dokumentiere den \*\*geplanten\*\* \`/api/praxis-search\` Endpunkt (Parameter, erwartete Antwort), auch wenn er noch nicht implementiert ist.

\---

\#\#\# Phase 4: Sicherheit, Optimierung & Wartung (Laufend / Zukunft)

\*   \*\*4.1. \[ \] Sicherheit \- RLS:\*\* Implementiere Row Level Security Policies für alle Tabellen, auf die über die API (insbesondere mit Anon Key) zugegriffen wird (\`praxis\`, \`praxis\_analysis\`, \`service\`, \`praxis\_service\`). Beginne mit Leserechten.  
\*   \*\*4.2. \[ \] Sicherheit \- Rate Limiting:\*\* Implementiere Rate Limiting für die öffentlichen API-Endpunkte (\`praxis-details\`, \`praxis-search\`), sobald die Anwendung live geht oder unter Last steht.  
\*   \*\*4.3. \[ \] Sicherheit \- Input Validierung:\*\* Stelle sicher, dass alle Eingaben von außen (Query-Parameter in Edge Functions) serverseitig validiert werden.  
\*   \*\*4.4. \[ \] Optimierung \- Indizes:\*\* Überwache die Performance von API-Abfragen und füge bei Bedarf weitere oder spezifischere Datenbank-Indizes hinzu. Nutze \`EXPLAIN ANALYZE\`.  
\*   \*\*4.5. \[ \] Optimierung \- KI-Pipeline:\*\*  
    \*   Überwache die Laufzeit und Kosten der \`analyze-practice\`-Funktion und der Gemini API Calls.  
    \*   Optimiere ggf. die Batch-Size im Cronjob, um Rate Limits einzuhalten und Kosten zu kontrollieren.  
    \*   Passe den Gemini-Prompt iterativ an, basierend auf der Qualität der Analyse-Ergebnisse.  
\*   \*\*4.6. \[ \] Wartung \- Fehler-Monitoring:\*\*  
    \*   Richte ein besseres Logging/Monitoring für die KI-Pipeline und API-Endpunkte ein (z.B. externe Dienste).  
    \*   Überwache Praxen mit Status \`failed\` und analysiere die Ursachen (\`last\_error\_message\`, Function Logs).  
\*   \*\*4.7. \[ \] Wartung \- Slug-Automatisierung:\*\* Implementiere einen Mechanismus (Trigger/Skript) zur automatischen Generierung/Aktualisierung von Slugs für neue/geänderte Praxen.  
\*   \*\*4.8. \[ \] Wartung \- Datenaktualisierung:\*\* Definiere einen Prozess, wie neue Reviews oder aktualisierte Praxisdaten von Google regelmäßig in die Datenbank gelangen (aktuell nur initialer Import).

\---

\*\*Nächste konkrete Backend-Schritte:\*\*

1\.  \*\*Dokumentation:\*\* Erstelle die API-Dokumentation für \`/api/praxis-details\` und \`/rest/v1/service\`.  
2\.  \*\*RLS:\*\* Beginne mit der Implementierung einfacher Lese-Policies für die relevanten Tabellen.  
3\.  \*\*(Zurückgestellt):\*\* Implementierung der \`praxis-search\`-API (idealerweise mit neuer Stored Procedure).

Dieser Plan sollte eine klare Übersicht geben, was im Backend bereits erreicht wurde und welche Schritte als nächstes anstehen oder für die Zukunft geplant sind.  
