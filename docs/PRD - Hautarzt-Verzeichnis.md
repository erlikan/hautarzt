\#\# Product Requirements Document: Hautarzt-Verzeichnis (Dermatologist Directory)

\*\*Version:\*\* 1.0  
\*\*Date:\*\* 2025-03-29  
\*\*Author/Owner:\*\* Cagatay / Cvelop

\#\#\# 1\. Introduction

\*\*1.1. Overview:\*\*  
Hautarzt-Verzeichnis is a web application designed to be the leading online directory for dermatologists (Hautärzte) in Germany. It aims to provide patients with significantly more value than standard directory listings by leveraging publicly available Google Maps/Places data (specifically reviews) and applying AI-driven analysis to offer deep insights into the typical patient experience at each practice.

\*\*1.2. Problem Statement:\*\*  
Patients searching for dermatologists often rely on simple star ratings and a handful of subjective reviews, making it difficult to gauge crucial aspects like actual waiting times, staff friendliness, physician competence, or communication quality. Existing platforms often lack structured, comparative insights derived from the wealth of information hidden within patient reviews.

\*\*1.3. Vision & Goal:\*\*  
To become the most trusted and informative resource for finding suitable dermatologists in Germany by providing transparent, data-driven insights into patient experiences, focusing on key factors beyond simple ratings. The primary goal is to achieve high organic search rankings for relevant keywords (e.g., "Hautarzt in meiner Nähe") and offer a superior user experience.

\*\*1.4. Unique Selling Proposition (USP):\*\*  
\*   \*\*AI-Powered Patient Insights:\*\* Automated analysis of Google Reviews to provide structured data on key aspects like wait times, empathy, competence, etc.  
\*   \*\*Proprietary Overall Score:\*\* A nuanced practice score calculated using a weighted formula based on KI analysis, Google data, and review trends, offering a more reliable indicator than Google stars alone.  
\*   \*\*Enhanced User Experience:\*\* Intuitive search, filtering, sorting, and clear visualization of complex data (charts, icons) optimized for mobile users.  
\*   \*\*SEO Focus:\*\* Targeted content and technical optimization to dominate relevant search queries.

\#\#\# 2\. Goals

\*   \*\*User Goals:\*\*  
    \*   Easily find relevant dermatologists based on location (city/ZIP/nearby).  
    \*   Quickly understand the typical patient experience regarding crucial aspects (wait time, friendliness, competence, communication, practice environment).  
    \*   Compare practices based on nuanced, data-driven insights, not just star ratings.  
    \*   Make informed decisions when choosing a dermatologist.  
\*   \*\*Business Goals:\*\*  
    \*   Achieve top search engine rankings for high-intent keywords (e.g., "Hautarzt {Stadt}", "Hautarzt in meiner Nähe").  
    \*   Build a large, engaged user base.  
    \*   Establish the platform as a trusted authority in the niche.  
    \*   Create potential for future monetization (e.g., premium listings, advertising \- \*Out of scope for V1\*).  
\*   \*\*Technical Goals:\*\*  
    \*   Implement a robust, automated backend pipeline for data ingestion, AI analysis, and scoring.  
    \*   Develop a performant, scalable, and maintainable backend API using Supabase.  
    \*   Build a fast, responsive, SEO-friendly frontend application.  
    \*   Ensure data integrity and security.

\#\#\# 3\. Target Audience

\*   Patients in Germany actively searching for a dermatologist for general consultations, specific treatments (e.g., skin cancer screening, acne, allergies), or aesthetic procedures.  
\*   Users prioritizing factors like short wait times, doctor's empathy, communication style, or specific practice characteristics in addition to medical competence.

\#\#\# 4\. Scope

\*\*4.1. In Scope (V1):\*\*

\*   \*\*Backend:\*\*  
    \*   Database setup on Supabase (PostgreSQL) with the defined schema.  
    \*   Automated KI Analysis Pipeline using Supabase Cron, Edge Functions, Stored Procedures, and Google Gemini API to analyze Google Reviews for all listed practices.  
    \*   Calculation and storage of a weighted "Overall Score" (0-100) per practice.  
    \*   Automated processing of identified "Services Mentioned" and storage in relational tables.  
    \*   Storage of "Doctors Mentioned" (extracted from reviews) per practice analysis.  
    \*   Python script for generating SEO-friendly slugs.  
    \*   Secure configuration management (\`app\_config\` table, Supabase Secrets).  
    \*   Functioning API endpoint for retrieving detailed practice data (\`/api/praxis-details\`).  
    \*   Functioning API endpoint (PostgREST) for retrieving the list of services (\`/rest/v1/service\`).  
    \*   Basic logging and error handling for the pipeline.  
\*   \*\*Frontend:\*\*  
    \*   Homepage with search (City/ZIP) and "Nearby" functionality.  
    \*   City/Search Results page displaying a list of practices.  
    \*   Practice Detail page displaying comprehensive information and the "Patient Insights Dashboard".  
    \*   Display of the calculated "Overall Score" (colored number).  
    \*   Display of KI-derived insights: aspect status icons, summary snippet, tags, strengths/weaknesses, trend, Kasse/Privat comparison, mentioned doctors/services (without using "AI" or "Review" terminology).  
    \*   Basic filtering and sorting on the results page (by Score, Name).  
    \*   Interactive map view on the results page (markers based on location).  
    \*   SEO-friendly URL structure (\`/hautarzt/{stadt-slug}/{praxis-slug}\`).  
    \*   Dynamic Meta Tags (\`title\`, \`description\`).  
    \*   \`Schema.org\` implementation (\`MedicalClinic\`, \`AggregateRating\`) on detail and list pages.  
    \*   Responsive, mobile-first design.  
\*   \*\*General:\*\*  
    \*   Adherence to defined Coding Standards.  
    \*   Basic security measures (RLS setup, parameterized queries).

\*\*4.2. Out of Scope (V1):\*\*

\*   User accounts and related features (favorites, saved searches, user reviews).  
\*   Direct appointment booking integration.  
\*   Manual data correction or moderation interface.  
\*   Advanced "Award" / Badge system (Gamification).  
\*   Detailed usage statistics tracking.  
\*   Advanced filtering/sorting options in the \`/api/praxis-search\` endpoint (requires robust implementation first).  
\*   Monetization features (premium listings, ads).  
\*   Automated process for updating slugs on name change.  
\*   Advanced error monitoring/alerting systems.  
\*   Advanced rate limiting for APIs.  
\*   Displaying raw Google Review texts.

\#\#\# 5\. Functional Requirements

\*\*5.1. Backend: AI Analysis Pipeline (Implemented)\*\*

\*   \*\*Automation:\*\* Runs automatically via \`pg\_cron\` every 5 minutes.  
\*   \*\*Processing:\*\* Identifies 'pending'/'failed' practices, triggers \`analyze-practice\` EF.  
\*   \*\*AI Call:\*\* \`analyze-practice\` EF fetches data, builds prompt, calls Gemini API, parses/validates JSON response (handling Markdown).  
\*   \*\*Data Storage:\*\* \`analyze-practice\` EF calls \`save\_analysis\_data\` SP.  
\*   \*\*Scoring & Saving:\*\* \`save\_analysis\_data\` SP saves analysis details, processes services, calculates weighted \`overall\_score\`, updates \`praxis.analysis\_status\`. Operates atomically.

\*\*5.2. Backend: Overall Score Calculation (Implemented)\*\*

\*   Calculated within \`save\_analysis\_data\` SP.  
\*   \*\*Formula:\*\* Weighted sum of:  
    \*   Weighted average of 5 KI aspect scores (Pos% \- Neg%, with higher weight on Competence & Communication/Trust \- e.g., 30% each).  
    \*   Normalized Google Rating (e.g., 30% weight).  
    \*   Trend score (e.g., \+/-10 points, 10% weight).  
\*   Applies a penalty factor if Google review count is below a threshold (e.g., \< 10).  
\*   Result clamped between 0-100 and stored in \`praxis\_analysis.overall\_score\`.

\*\*5.3. Backend: Slug Generation (Implemented \- Manual Script)\*\*

\*   Python script \`generate\_slugs.py\` generates unique, URL-friendly slugs based on practice name and location (e.g., PLZ for uniqueness).  
\*   Stores result in \`praxis.slug\`. Currently requires manual execution.

\*\*5.4. Backend: API Endpoints\*\*

\*   \*\*\`GET /rest/v1/service?select=id,name\` (Implemented via PostgREST):\*\* Returns a list of all defined services for frontend filters. Requires RLS allowing read access.  
\*   \*\*\`GET /api/praxis-details/{stadtSlug}/{praxisSlug}\` (Implemented via \`praxis-details\` EF):\*\* Returns detailed information for a single practice, including \`praxis\` fields, \`praxis\_analysis\` fields, and associated \`service\` names. Handles 404 if not found.  
\*   \*\*\`GET /api/praxis-search\` (Partially Implemented / Needs Robust Solution via \`praxis-search\` EF):\*\*  
    \*   \*\*Goal:\*\* Accept query parameters for location (city, zip, lat/lon/radius), filters (scoreMin, services\[\], aspect-status?), sorting (score, distance, name), and pagination.  
    \*   \*\*Current Status:\*\* Implementation logic is complex and currently \*\*on hold\*\*. Requires a robust method for dynamically building and securely executing parameterized SQL with optional Joins/Filters/Geo-functions within the Edge Function (ideally via a dedicated, well-tested Stored Procedure called by the EF).  
    \*   \*\*V1 Fallback (if full implementation delayed):\*\* Provide a simplified version supporting only basic search (e.g., by city/zip) and sorting (by score/name), deferring complex filters/geo-search.

\*\*5.5. Frontend: Search & Discovery\*\*

\*   \*\*Homepage:\*\* Provide input for City/ZIP search and a "Use My Location" button.  
\*   \*\*Results Page:\*\*  
    \*   Display list of practices matching criteria.  
    \*   Show key info per practice: Photo, Name, Address, \*\*Overall Score (colored number)\*\*, \*\*5 Aspect Icons (colored)\*\*, Summary Snippet, Tags.  
    \*   Implement basic filters (e.g., by Service ID via checkboxes) and sorting (by Score, Name).  
    \*   Implement map view with location markers styled by \`overall\_score\`.  
    \*   Implement pagination.

\*\*5.6. Frontend: Practice Details\*\*

\*   \*\*Detail Page:\*\* Display all fetched practice information.  
    \*   \*\*Header:\*\* Name, Score, Address, Contact Info, Map.  
    \*   \*\*Patient Insights Dashboard:\*\*  
        \*   Visualize 5 KI aspects using bar charts (Pos/Neu/Neg %).  
        \*   Display Trend indicator (icon \+ text).  
        \*   List Strengths & Weaknesses (with icons).  
        \*   Show Kasse/Privat comparison text.  
        \*   Display Tag Clouds/Lists for frequent terms, emotions, mentioned doctors.  
    \*   Display list of mentioned/offered services.  
    \*   Display opening hours, photos, accessibility info.  
    \*   \*\*No raw Google reviews.\*\*  
    \*   \*\*No explicit mention of "AI".\*\* Use terms like "Patient Insights", "Analysis", "Typical Experiences".

\---

\#\#\# 6\. Non-Functional Requirements

\*   \*\*Performance:\*\* Target fast initial page loads (LCP \< 2.5s) via SSR/SSG. API responses should be fast (\<500ms for typical searches). Database queries must be optimized with indexes.  
\*   \*\*Scalability:\*\* Architecture (Supabase, Edge Functions) should handle a growing number of practices and users. The analysis pipeline must cope with Rate Limits.  
\*   \*\*Security:\*\* Protect API Keys, use parameterized queries (prevent SQLi), implement RLS, validate all user inputs server-side, consider Rate Limiting for public APIs.  
\*   \*\*Usability:\*\* Intuitive navigation, clear information hierarchy, mobile-first design. Easy understanding of scores and analysis data.  
\*   \*\*Maintainability:\*\* Adhere to coding standards, modular code structure (Frontend components, Backend functions), API documentation, code documentation.  
\*   \*\*Accessibility:\*\* Strive for WCAG 2.1 AA compliance (color contrast, keyboard navigation, ARIA attributes, semantic HTML).

\---

\#\#\# 7\. Design / UX Requirements

\*   Clean, modern, trustworthy design.  
\*   Mobile-first approach is paramount.  
\*   Clear visualization of data:  
    \*   \`overall\_score\` as a number, colored based on value range (e.g., Red \<40, Yellow 40-70, Green \>70).  
    \*   5 KI aspects represented by clear, universally understood icons, colored by status (Positive/Neutral/Negative).  
    \*   Bar charts for aspect percentages must be easy to read.  
    \*   Tag clouds or lists for qualitative data (strengths, weaknesses, tags).  
\*   Intuitive filter and sort controls.  
\*   Interactive map integration.

\---

\#\#\# 8\. Data Requirements

\*   \*\*Input:\*\* Publicly available Google Maps/Places data (Praxis info, Reviews).  
\*   \*\*Processing:\*\* KI analysis via Google Gemini API. Score calculation via weighted formula. Slug generation.  
\*   \*\*Output:\*\* Structured analysis data, overall score, slugs stored in Supabase DB.  
\*   \*\*Data Integrity:\*\* Mechanisms to avoid duplicate reviews/praxen. \`analysis\_status\` tracking.

\---

\#\#\# 9\. API Requirements (Summary)

\*   \*\*\`GET /rest/v1/service?select=id,name\`:\*\* Fetch list of services.  
\*   \*\*\`GET /api/praxis-details/{stadtSlug}/{praxisSlug}\`:\*\* Fetch detailed data for one practice. (Implemented)  
\*   \*\*\`GET /api/praxis-search\`:\*\* Fetch filtered, sorted, paginated list of practices. (Implementation Pending/Needs Robust Solution)  
\*   Clear JSON response structures with appropriate HTTP status codes.  
\*   Authentication via Supabase Anon Key (initially).

\---

\#\#\# 10\. SEO Requirements (Technical)

\*   \*\*URL Structure:\*\* \`/hautarzt/{stadt-slug}/{praxis-slug}\`. Slugs generated and stored.  
\*   \*\*Meta Tags:\*\* Dynamically generated \`\<title\>\` and \`\<meta name="description"\>\` for list and detail pages.  
\*   \*\*\`Schema.org\` (JSON-LD):\*\*  
    \*   Detail Page: \`MedicalClinic\` with \`address\`, \`geo\`, \`telephone\`, \`url\`, \`image\`, \`openingHoursSpecification\`, \`aggregateRating\` (based on \`overall\_score\` mapped to 1-5 scale, using \`praxis.reviews\` as \`ratingCount\`).  
    \*   List Page: \`BreadcrumbList\` and \`ItemList\` containing \`ListItem\`s for each practice on the current page (with nested \`MedicalClinic\` stub including \`name\`, \`url\`, optional \`address\`, \`aggregateRating\`).  
\*   \*\*SSR/SSG:\*\* Frontend framework must support server-rendering or static generation for optimal crawling.  
\*   \*\*Sitemap:\*\* \`sitemap.xml\` to be generated including all city and practice detail pages.  
\*   \*\*\`robots.txt\`:\*\* Configure appropriately.

\---

\#\#\# 11\. Future Considerations

\*   Robust implementation of \`/api/praxis-search\` with all filters.  
\*   User accounts & features (favorites).  
\*   Award/Badge system implementation.  
\*   Usage statistics tracking.  
\*   Automated slug updates.  
\*   Advanced error monitoring/alerting.  
\*   Potential monetization features.

\---

\#\#\# 12\. Open Issues / Risks

\*   \*\*\`/api/praxis-search\` Implementation:\*\* The complexity of dynamically building secure and performant SQL for all filter/sort/geo combinations in the Edge Function requires careful implementation (ideally via a dedicated Stored Procedure). \*\*This is the main technical risk/blocker for full search functionality.\*\*  
\*   \*\*Gemini API Costs & Rate Limits:\*\* Need monitoring and potential optimization of the analysis pipeline frequency/batch size. Output quality might also vary.  
\*   \*\*Data Quality/Freshness:\*\* Dependence on Google Maps data; need a strategy for keeping data updated (reviews, praxis info). Initial data import is done, but ongoing updates are not yet planned.  
\*   \*\*\`Schema.org\` Interpretation:\*\* Google's interpretation of structured data (especially custom ratings derived from our \`overall\_score\` and the mapping to the 1-5 scale) can vary and might not always result in the desired Rich Snippets. Continuous monitoring and adherence to Google's guidelines are necessary. Using the KI-generated summary as a \`review\` might be against guidelines and needs careful consideration or omission.  
\*   \*\*Scalability of Analysis Pipeline:\*\* While designed to be automated, processing 50,000+ practices initially and handling updates requires monitoring Supabase function execution limits, timeouts, and costs.  
\*   \*\*Slug Uniqueness & Management:\*\* Ensuring slug uniqueness (especially across different cities if not included in the constraint) and handling updates upon practice name changes requires a robust process (currently manual).  
\*   \*\*Geo-Coding Accuracy:\*\* Relies on the accuracy of Lat/Lon data from the initial scraping source. Inconsistencies could affect "nearby" searches.  
\*   \*\*Performance of Complex Queries:\*\* The \`praxis-search\` query, once fully implemented, might become slow with many filters active. Database optimization (indexes, query tuning) will be crucial.  
\*   \*\*Legal Compliance (Impressum/Datenschutz):\*\* Standard requirement, but needs correct implementation. Usage of Google's data needs to comply with their Terms of Service.

\---

\#\#\# 13\. Release Criteria (V1)

\*   All features listed as "In Scope (V1)" are implemented and tested.  
\*   Automated KI Analysis Pipeline is running reliably.  
\*   Core API endpoints (\`/api/praxis-details\`, \`/rest/v1/service\`, and at least a \*basic\* version of \`/api/praxis-search\` \- e.g., city search \+ score sort) are functional and documented.  
\*   Frontend is responsive, mobile-first, and displays practice details and analysis insights clearly.  
\*   Core SEO requirements (URLs, Meta Tags, \`Schema.org\` for \`MedicalClinic\` & \`AggregateRating\`) are implemented.  
\*   Application passes basic usability and performance tests.  
\*   Legal requirements (Impressum, Privacy Policy) are met.  
\*   Critical bugs identified during testing are fixed.

