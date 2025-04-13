\#\# SEO-Strategie & Technische Vorgaben für Frontend

\*\*Ziel:\*\* Maximale Sichtbarkeit in Suchmaschinen (insbesondere Google) für Suchanfragen wie "Hautarzt {Stadt}", "Hautarzt in meiner Nähe", "{Praxis Name} Erfahrungen" etc. durch On-Page-Optimierung und strukturierte Daten.

\---

\#\#\# 1\. Keyword-Strategie & Mapping (Konzept)

\*   \*\*Startseite (\`/\`):\*\* Fokus auf allgemeine Keywords ("Hautarzt finden", "Hautarzt Verzeichnis Deutschland", "Patientenerfahrungen Hautarzt").  
\*   \*\*Übersichtsseite (\`/hautarzt/{stadt-slug}\`):\*\* Fokus auf lokale Keywords ("Hautarzt {Stadt}", "Hautärzte {Stadt}", "Hautarztpraxis {Stadt}", "guter Hautarzt {Stadt}").  
\*   \*\*Detailseite (\`/hautarzt/{stadt-slug}/{praxis-slug}\`):\*\* Fokus auf Long-Tail-Keywords zur Praxis ("{Praxis Name} {Stadt}", "{Praxis Name} Erfahrungen", "{Praxis Name} Adresse", "{Praxis Name} {Leistung}", "Bewertung Hautarzt {Name} {Stadt}").

\---

\#\#\# 2\. Meta-Tags (Dynamisch)

Das Frontend \*\*muss\*\* für die Übersichts- und Detailseiten dynamisch \`\<title\>\` und \`\<meta name="description"\>\` generieren.

\*   \*\*Detailseite (\`/hautarzt/{stadt-slug}/{praxis-slug}\`):\*\*  
    \*   \*\*\`\<title\>\` Vorlage:\*\* \`{Praxis Name} \- Hautarzt in {Stadt} | Einblicke & Score\` (Max. 55-60 Zeichen anstreben).  
    \*   \*\*\`\<meta name="description"\>\` Vorlage:\*\* \`Finden Sie detaillierte Patienteneinblicke für {Praxis Name} in {Stadt}. Unser Score: {Overall Score}/100. Erfahren Sie mehr über Kompetenz, Wartezeit und Freundlichkeit.\` (Max. 150-160 Zeichen).  
        \*   \*Daten benötigt:\* \`praxis.name\`, \`praxis.city\`, \`praxis\_analysis.overall\_score\`.  
\*   \*\*Übersichtsseite (\`/hautarzt/{stadt-slug}\`):\*\*  
    \*   \*\*\`\<title\>\` Vorlage:\*\* \`Hautärzte in {Stadt}: Praxen finden & vergleichen | Patienteneinblicke\` (Max. 55-60 Zeichen).  
    \*   \*\*\`\<meta name="description"\>\` Vorlage:\*\* \`Liste der Hautärzte in {Stadt}. Vergleichen Sie Praxen basierend auf analysierten Patientenerfahrungen zu Wartezeit, Kompetenz und Freundlichkeit. Finden Sie den passenden Arzt.\` (Max. 150-160 Zeichen).  
        \*   \*Daten benötigt:\* \`stadtName\` (aus URL oder API).

\---

\#\#\# 3\. \`Schema.org\` Strukturierte Daten (JSON-LD)

Das Frontend \*\*muss\*\* auf den relevanten Seiten ein \`\<script type="application/ld+json"\>\`-Tag im \`\<head\>\` oder \`\<body\>\` rendern, das die strukturierte Daten enthält.

\*\*3.1. Detailseite (\`/hautarzt/{stadt-slug}/{praxis-slug}\`):\*\*

\*   \*\*Haupttyp:\*\* Wir verwenden \*\*\`MedicalClinic\`\*\*. Dies repräsentiert die Praxis als Organisation besser als \`Physician\`, was eher einen einzelnen Arzt beschreibt. Wenn eine Praxis nur einen Arzt hat, \*könnte\* man zusätzlich \`Physician\` als \`member\` oder \`employee\` hinzufügen, aber starten wir mit \`MedicalClinic\`.  
\*   \*\*JSON-LD Struktur:\*\*

\`\`\`json  
{  
  "@context": "https://schema.org",  
  "@type": "MedicalClinic", // Oder "Physician", falls passender pro Praxis entschieden wird  
  "name": "{praxis.name}", // Dynamisch  
  "description": "{Meta Description Text}", // Dynamisch, aus Meta Tag  
  "address": {  
    "@type": "PostalAddress",  
    "streetAddress": "{praxis.street}", // Dynamisch  
    "addressLocality": "{praxis.city}", // Dynamisch  
    "postalCode": "{praxis.postal\_code}", // Dynamisch  
    "addressCountry": "{praxis.country\_code}" // Dynamisch (z.B. "DE")  
  },  
  // Geo-Koordinaten (WICHTIG für lokale Suche)  
  "geo": {  
    "@type": "GeoCoordinates",  
    "latitude": "{praxis.latitude}", // Dynamisch (als Zahl)  
    "longitude": "{praxis.longitude}" // Dynamisch (als Zahl)  
  },  
  // Telefonnummer (falls vorhanden)  
  "telephone": "{praxis.phone}", // Dynamisch (im internationalen Format \+49...)  
  // Webseite (falls vorhanden)  
  "url": "{praxis.site}", // Dynamisch  
  // Hauptbild der Praxis (falls vorhanden)  
  "image": "{praxis.photo}", // Dynamisch (URL zum Bild)

  // Öffnungszeiten (falls vorhanden und strukturiert in praxis.working\_hours)  
  // Dies erfordert Parsing des JSONB-Feldes im Frontend oder API liefert es formatiert.  
  // Beispiel für einen Tag (muss für jeden Tag generiert werden):  
  "openingHoursSpecification": \[  
    {  
      "@type": "OpeningHoursSpecification",  
      "dayOfWeek": \[ "Monday", "Tuesday", "Wednesday", "Thursday" \], // Dynamisch  
      "opens": "08:00", // Dynamisch  
      "closes": "13:00" // Dynamisch  
    },  
    {  
      "@type": "OpeningHoursSpecification",  
      "dayOfWeek": \[ "Monday", "Tuesday", "Thursday" \], // Beispiel für Nachmittag  
      "opens": "14:00",  
      "closes": "18:00"  
    }  
    // ... weitere Einträge für andere Zeiten/Tage ...  
  \],

  // Aggregate Rating (Basierend auf unserem Score)  
  "aggregateRating": {  
    "@type": "AggregateRating",  
    // Umrechnung unseres 0-100 Scores auf die übliche 1-5 Skala  
    "ratingValue": "{round(praxis\_analysis.overall\_score / 20, 1)}", // Dynamisch berechnet (z.B. 82 \-\> 4.1)  
    "bestRating": "5",  
    "worstRating": "1",  
    "ratingCount": "{praxis.reviews}" // Anzahl der Google Reviews als Basis  
  }

  // KEINE 'review'-Property für die KI-Zusammenfassung, um Richtlinienkonflikte zu vermeiden.  
}  
\`\`\`

\*   \*\*Frontend-Aufgabe:\*\* Generiere dieses JSON-LD dynamisch mit den Daten, die von der \`/api/praxis-details/...\` API geliefert werden. Achte auf korrekte Datentypen (Zahlen für Lat/Lon/RatingValue, Strings für URLs/Text). Das Parsen und Formatieren der \`openingHoursSpecification\` kann komplex sein.

\*\*3.2. Übersichtsseite (\`/hautarzt/{stadt-slug}\`):\*\*

\*   \*\*Typ:\*\* \`ItemList\` (Liste von Elementen) in Kombination mit \`BreadcrumbList\` (für Navigation).  
\*   \*\*JSON-LD Struktur:\*\*

\`\`\`json  
\[ // Array mit zwei Objekten: Breadcrumb und ItemList  
  {  
    "@context": "https://schema.org",  
    "@type": "BreadcrumbList",  
    "itemListElement": \[  
      {  
        "@type": "ListItem",  
        "position": 1,  
        "name": "Startseite", // Oder Name der Website  
        "item": "{URL der Startseite}" // Dynamisch  
      },  
      {  
        "@type": "ListItem",  
        "position": 2,  
        "name": "Hautärzte in {Stadt}", // Dynamisch  
        "item": "{Aktuelle URL der Übersichtsseite}" // Dynamisch  
      }  
    \]  
  },  
  {  
    "@context": "https://schema.org",  
    "@type": "ItemList",  
    "name": "Hautärzte in {Stadt}", // Dynamisch  
    "description": "{Meta Description der Übersichtsseite}", // Dynamisch  
    "numberOfItems": "{meta.totalItems}", // Dynamisch aus API-Antwort  
    "itemListElement": \[  
      // Für jede Praxis auf der AKTUELLEN Seite ein ListItem generieren  
      {  
        "@type": "ListItem",  
        "position": 1, // Startet bei 1 für die erste Praxis auf der Seite  
        "item": {  
          "@type": "MedicalClinic", // Oder Physician  
          "name": "{praxis.name}", // Dynamisch  
          "url": "{URL zur Detailseite dieser Praxis}", // Dynamisch  
          // Optional: Weitere kurze Infos hinzufügen (Adresse, aggregateRating)  
           "address": { "@type": "PostalAddress", "addressLocality": "{praxis.city}", "postalCode": "{praxis.postal\_code}" },  
           "aggregateRating": { "@type": "AggregateRating", "ratingValue": "{umgerechneter Score}", "ratingCount": "{Anzahl Reviews}" }  
        }  
      },  
      {  
        "@type": "ListItem",  
        "position": 2,  
        "item": {  
          // ... Daten für die zweite Praxis ...  
        }  
      }  
      // ... bis zu pageSize Elemente ...  
    \]  
  }  
\]  
\`\`\`

\*   \*\*Frontend-Aufgabe:\*\* Generiere dieses JSON-LD-Array dynamisch. Die \`ItemList\` soll nur die Praxen der \*aktuell angezeigten Seite\* enthalten. Die \`position\` zählt von 1 bis \`pageSize\`. Die \`numberOfItems\` in der \`ItemList\` sollte die \*Gesamtzahl\* aller gefundenen Praxen (\`meta.totalItems\`) sein.

\---

\#\#\# 4\. Technische Umsetzung (Frontend)

\*   \*\*Framework-Wahl:\*\* Nutze ein Framework mit SSR oder SSG/ISR (Next.js, Nuxt.js, SvelteKit), um sicherzustellen, dass die Meta-Tags und JSON-LDs im initialen HTML-Source enthalten sind und von Suchmaschinen gecrawlt werden können. Client-seitiges Rendering allein ist für SEO unzureichend.  
\*   \*\*JSON-LD Einbettung:\*\* Bette das generierte JSON-LD als \`\<script type="application/ld+json"\>\` in den \`\<head\>\` oder (besser für spätere Hydration) am Ende des \`\<body\>\` der jeweiligen Seite ein.  
\*   \*\*Dynamische Generierung:\*\* Die Inhalte der Meta-Tags und des JSON-LD müssen serverseitig oder zur Build-Zeit basierend auf den API-Daten generiert werden.  
\*   \*\*Validierung:\*\* Verwende Googles Rich Results Test oder den Schema Markup Validator, um die Korrektheit des generierten JSON-LD zu überprüfen.

\---

\*\*Zusammenfassung für das Frontend-Team:\*\*

1\.  Implementiert dynamische Meta-Tags (\`\<title\>\`, \`\<meta name="description"\>\`) gemäß den Vorlagen für Übersichts- und Detailseiten.  
2\.  Implementiert die Generierung und Einbettung von JSON-LD (\`Schema.org\`) für \`MedicalClinic\` (inkl. \`aggregateRating\`, \`address\`, \`geo\` etc.) auf der Detailseite. Achtet auf die korrekte Umrechnung des Scores und das Formatieren der Öffnungszeiten.  
3\.  Implementiert die Generierung und Einbettung von JSON-LD für \`BreadcrumbList\` und \`ItemList\` auf der Übersichtsseite (nur Praxen der aktuellen Seite im \`itemListElement\`).  
4\.  Nutzt SSR oder SSG/ISR für optimale SEO-Crawlbarkeit.  
5\.  Validiert das generierte Schema.org Markup.  
