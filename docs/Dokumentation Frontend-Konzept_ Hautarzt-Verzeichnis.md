## Dokumentation Frontend-Konzept: Hautarzt Vergleich

\*\*Ziel:\*\* Entwicklung einer benutzerfreundlichen, mobil-optimierten Verzeichnisseite für Hautärzte in Deutschland mit detaillierten, auf KI-Analysen basierenden Patienteneinblicken. Die Begriffe "KI", "Bewertung" oder "Rezension" sollen gegenüber dem Endnutzer vermieden werden; stattdessen wird von "Patienteneinblicken", "Praxis-Analyse" oder "Erfahrungen" gesprochen.

\---

\#\#\# 1\. Seitentyp: Startseite / Suchseite

\*   \*\*Zweck:\*\* Schneller Einstieg zur Suche nach Hautärzten nach Ort oder über den eigenen Standort. Kommunikation des Mehrwerts der Plattform.  
\*   \*\*URL-Struktur:\*\* \`/\`  
\*   \*\*Layout-Skizze (Wireframe):\*\*  
    \`\`\`  
    \+-----------------------------------------+  
    | Logo      \[Slogan (optional)\]           |  
    \+-----------------------------------------+  
    |                                         |  
    |   \[Große Überschrift \- Value Prop\]      |  
    |   \+-----------------------------------+ |  
    |   | PLZ oder Stadt eingeben        | | |  
    |   \+-----------------------------------+ |  
    |   \[ Button: Hautärzte finden \]          |  
    |   \[ Button: Meinen Standort nutzen (GPS)\] |  
    |                                         |  
    \+-----------------------------------------+  
    | \[Optional: 3 Icons mit Kurztext:      \] |  
    | \[Icon Uhr: Wartezeit-Einblicke        \] |  
    | \[Icon Herz: Details zur Freundlichkeit\] |  
    | \[Icon Lupe: Infos zur Kompetenz       \] |  
    \+-----------------------------------------+  
    | \[Optional: Links zu Top-Städten\]        |  
    \+-----------------------------------------+  
    | Footer (Impressum, Datenschutz etc.)    |  
    \+-----------------------------------------+  
    \`\`\`  
\*   \*\*UI-Komponenten:\*\*  
    \*   Logo  
    \*   Überschrift (H1): Klarer Mehrwert (z.B. "Finden Sie den passenden Hautarzt – mit echten Patienteneinblicken.")  
    \*   Texteingabefeld (Suche)  
    \*   Primärer Button (Suche starten)  
    \*   Sekundärer Button (Standort nutzen)  
    \*   (Optional) Icon-basierte Feature-Vorstellung  
    \*   (Optional) Liste mit Links zu Städteseiten  
    \*   Standard-Footer  
\*   \*\*Datenquellen:\*\* Keine direkten Daten aus der Praxis-DB nötig, außer ggf. für die Top-Städte-Links.  
\*   \*\*Funktionale Anforderungen:\*\*  
    \*   Eingabe im Suchfeld \+ Klick auf "Finden" leitet zur Übersichtsseite weiter (z.B. \`/hautarzt/{stadt-slug}\` oder \`/suche?query={eingabe}\`). Die API muss die Eingabe verarbeiten können (PLZ oder Stadtname).  
    \*   Klick auf "Standort nutzen" fragt nach Browser-Geolocation. Bei Erfolg: Leitet zur Übersichtsseite mit Ergebnissen in der Nähe weiter (API-Call mit Lat/Lon). Bei Fehler: Zeigt Fehlermeldung.  
\*   \*\*Besondere Hinweise:\*\* Mobil optimiert, sehr schneller Ladevorgang.

\---

\#\#\# 2\. Seitentyp: Übersichts-/Ergebnisseite

\*   \*\*Zweck:\*\* Anzeige einer Liste von Hautarztpraxen basierend auf einer Suche (Ort, Nähe) mit Filter- und Sortiermöglichkeiten. Präsentation erster Vergleichsdaten und der "Visitenkarte" jeder Praxis.  
\*   \*\*URL-Struktur:\*\* \`/hautarzt/{stadt-slug}\` (Bevorzugt für SEO)  
\*   \*\*Layout-Skizze (Wireframe \- Desktop Beispiel, mobil untereinander):\*\*  
    \`\`\`  
    \+-------------------------------------------------------------+  
    | Logo                                       \[Sucheingabe\]    |  
    \+-------------------------------------------------------------+  
    | \[H1: Hautärzte in {Stadt}\]  \[XX Praxen gefunden\]            |  
    \+--------------------------+----------------------------------+  
    | Filter (Sidebar/Oben)    | Ergebnisliste                    |  
    |--------------------------|----------------------------------|  
    | \[Overall Score Filter\]   | \[Sortieren nach: Beste Bewertung v\] |  
    | \[KI Aspekte Filter\]      | \+--------------------------------+ |  
    | \[Leistungen Filter\]      | | \[Foto\] \[Praxisname (Link)\]     | |  
    | \[Öffnungszeiten Filter\]  | |        \[Adresse\]               | |  
    | \[Kasse/Privat Filter\]    | |        \[Score: 82\] (Farbe)     | |  
    |                          | | Icons: \[Aspekt1\]\[A2\]\[A3\]\[A4\]\[A5\]| |  
    | \[Kartenansicht Toggle\]   | | Snippet: \[Kurze Zusammenf...\]  | |  
    | \+----------------------+ | | Tags: \[Tag1\]\[Tag2\] \[LeistIcon\] | |  
    | | Karte (Leaflet/...)  | | \[Award Badge?\] \[Details Button\] | |  
    | | mit Markern        | | \+--------------------------------+ |  
    | \+----------------------+ | \+--------------------------------+ |  
    |                          | | \[Weitere Praxis-Einträge...\]   | |  
    |                          | \+--------------------------------+ |  
    |                          | \[Pagination 1 | 2 | 3 ...\]      | |  
    \+--------------------------+----------------------------------+  
    | Footer                                                      |  
    \+-------------------------------------------------------------+  
    \`\`\`  
\*   \*\*UI-Komponenten:\*\*  
    \*   Filter-Panel (Slider, Checkboxen, etc.)  
    \*   Karten-Komponente (z.B. Leaflet) mit Markern & Popups.  
    \*   Sortier-Dropdown.  
    \*   \*\*Praxis-Listen-Eintrag ("Visitenkarte"):\*\*  
        \*   Bild (aus \`praxis.photo\`).  
        \*   Praxisname (Link zur Detailseite).  
        \*   Adresse.  
        \*   \*\*Overall Score:\*\* Zahl (0-100) mit dynamischer Farbe (z.B. Klasse \`score-high\`, \`score-medium\`, \`score-low\`).  
        \*   \*\*KI-Aspekt-Indikatoren:\*\* 5 Icons nebeneinander. Icon-Vorschläge:  
            \*   Termin/Wartezeit: \`\<Icon name="clock"\>\`  
            \*   Freundlichkeit/Empathie: \`\<Icon name="heart"\>\`  
            \*   Aufklärung/Vertrauen: \`\<Icon name="message-circle"\>\` (oder \`shield-check\`)  
            \*   Kompetenz/Behandlung: \`\<Icon name="check-circle"\>\` (oder \`award\`)  
            \*   Praxis/Ausstattung: \`\<Icon name="home"\>\` (oder \`building\`)  
            \*   Farbe/Füllung der Icons basiert auf \`positiv\` vs. \`negativ\` Prozenten (z.B. \>60% pos \= grün, \>40% neg \= rot, sonst gelb/grau). Tooltip zeigt Details.  
        \*   \*\*KI-Snippet:\*\* Erster Satz oder max. X Zeichen von \`praxis\_analysis.zusammenfassung\`.  
        \*   \*\*Tags:\*\* 2-3 Tags aus \`praxis\_analysis.tags\` als kleine Text-Badges/Pills.  
        \*   \*\*Leistungs-Icons (optional):\*\* Kleine Icons für 1-3 global definierte Top-Leistungen (z.B. Hautkrebsvorsorge, Laser, Allergie), wenn in \`praxis\_service\` für die Praxis vorhanden.  
        \*   \*\*Award-Badges (optional):\*\* Platzhalter für zukünftige Gamification-Icons (z.B. "Top Kompetenz '25", "Beste Wartezeit Berlin").  
        \*   Button zur Detailseite.  
    \*   Pagination-Komponente.  
\*   \*\*Datenquellen (pro Praxis):\*\* \`praxis\` (Name, Adresse, photo, slug, google\_place\_id), \`praxis\_analysis\` (overall\_score, Aspekt-%, zusammenfassung, tags), \`praxis\_service\` (für Leistungs-Icons). Filter brauchen Zugriff auf \`service.name\`, \`praxis.working\_hours\`, \`praxis\_analysis.vergleich\_kasse\_privat\` etc.  
\*   \*\*Funktionale Anforderungen:\*\*  
    \*   Filtern und Sortieren aktualisiert die Liste und die Kartenmarker dynamisch (idealerweise ohne Neuladen der Seite).  
    \*   Klick auf Praxisname oder Detail-Button führt zur Detailseite.  
    \*   Kartenmarker zeigen beim Klick ein Popup mit Praxisname, Score und Detail-Link.  
    \*   Karte zoomt/verschiebt sich passend zu den angezeigten Ergebnissen.  
    \*   Sicherheitsmaßnahmen (Rate Limiting, Input Validierung) auf API-Ebene implementieren, um Scraping zu erschweren.  
\*   \*\*Besondere Hinweise:\*\* Mobile First Design ist entscheidend. Performance beim Filtern/Sortieren und Laden der Karte beachten. Visuelle Hierarchie muss klar sein (Score und Aspekt-Indikatoren hervorheben).

\---

\#\#\# 3\. Seitentyp: Praxis-Detailseite

\*   \*\*Zweck:\*\* Umfassende Darstellung aller Informationen zu einer Praxis, mit klarem Fokus auf die verständliche Präsentation der detaillierten Patienteneinblicke (KI-Analyse).  
\*   \*\*URL-Struktur:\*\* \`/hautarzt/{stadt-slug}/{praxis-slug}\`  
\*   \*\*Layout-Skizze (Wireframe \- Grobe Sektionen):\*\*  
    \`\`\`  
    \+-------------------------------------------------------------+  
    | Logo                                       \[Zurück Button\]  |  
    \+-------------------------------------------------------------+  
    | \[Header Bereich\]                                            |  
    |   \[Praxisname (H1)\] \[Overall Score: 82 (Farbe)\] \[Award Badge?\]|  
    |   \[Adresse\] \[Telefon\] \[Website\] \[Online Termin Button\]      |  
    |   \[Kleine Karte\]                                            |  
    \+-------------------------------------------------------------+  
    | \[KI-Analyse Dashboard\]                                      |  
    |   \[Überschrift: Patienteneinblicke...\]                      |  
    |   \+----------------------+ \+----------------------+         |  
    |   | \[Aspekt 1: Termin\]   | | \[Aspekt 2: Freundl.\] | ...     |  
    |   | Chart \[|||||\] (Farben)| | Chart \[|||||\]        |         |  
    |   | (Text Kurzfazit?)    | | (Text Kurzfazit?)    |         |  
    |   \+----------------------+ \+----------------------+         |  
    |   ... (Weitere 3 Aspekte) ...                               |  
    |                                                             |  
    |   \[Trend: Pfeil (Farbe)\] \[Trend Begründung Text\]            |  
    |                                                             |  
    |   \+----------------------+ \+----------------------+         |  
    |   | \[Stärken (Liste)\]    | | \[Schwächen (Liste)\]  |         |  
    |   | \- Punkt 1 (Haken)    | | \- Punkt 1 (Kreuz)    |         |  
    |   | \- ...                | | \- ...                |         |  
    |   \+----------------------+ \+----------------------+         |  
    |                                                             |  
    |   \[Weitere Einblicke:\]                                      |  
    |   Kasse/Privat: \[Text\]                                      |  
    |   Häufige Themen: \[Tag Cloud / Liste\]                       |  
    |   Typische Emotionen: \[Pills / Badges\]                      |  
    |   Erwähnte Ärzte: \[Liste\]                                   |  
    \+-------------------------------------------------------------+  
    | \[Abschnitt: Angebotene Leistungen\]                          |  
    |   \[Überschrift\]                                             |  
    |   \[Liste der Leistungen mit Icons/Text\]                     |  
    \+-------------------------------------------------------------+  
    | \[Abschnitt: Praxisinformationen\]                            |  
    |   \[Öffnungszeiten\] \[Fotos\] \[Barrierefreiheit\] \[Anfahrt\]     |  
    \+-------------------------------------------------------------+  
    | Footer                                                      |  
    \+-------------------------------------------------------------+  
    \`\`\`  
\*   \*\*UI-Komponenten:\*\*  
    \*   Detail-Header mit Kontaktdaten, Karte, Score, Badges.  
    \*   \*\*KI-Dashboard-Komponenten:\*\*  
        \*   5 separate Aspekt-Kacheln mit Titel, Balken-Chart (z.B. mit \`Chart.js\`, \`Recharts\` oder einer einfachen CSS-Lösung) und Prozentzahlen.  
        \*   Trend-Anzeige mit Icon und Text.  
        \*   Zwei Listen für Stärken/Schwächen mit Icons.  
        \*   Textblöcke für Kasse/Privat, Zusammenfassung (die nicht mehr explizit als solche benannt wird, sondern als Teil der Einblicke dient).  
        \*   Tag Cloud / Badge-Listen für Begriffe, Emotionen, Ärzte.  
    \*   Leistungsliste (ggf. mit Icons).  
    \*   Info-Blöcke für Öffnungszeiten, Fotos (Galerie-Viewer?), Barrierefreiheit.  
\*   \*\*Datenquellen:\*\* \`praxis\` (alle Felder), \`praxis\_analysis\` (alle Felder), \`service\` (Namen via \`praxis\_service\`).  
\*   \*\*Funktionale Anforderungen:\*\* Interaktive Karte, klickbare Telefonnummer/Website/Terminlink, ggf. Foto-Galerie.  
\*   \*\*Besondere Hinweise:\*\* Die größte Herausforderung ist die übersichtliche und verständliche Darstellung der vielen Analyse-Daten. Gute Typografie, ausreichend Weißraum und klare visuelle Trennung der Sektionen sind entscheidend. Barrierefreiheit (WCAG) beachten. \*\*Strukturierte Daten (\`Schema.org\`) hier besonders detailliert implementieren\!\*\*  
