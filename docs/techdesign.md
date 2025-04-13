# Technical Design Decisions - Hautarzt-Verzeichnis

This document records key technical decisions made during the development of the Hautarzt-Verzeichnis project.

## Frontend Stack Selection (2025-03-29)

*   **Framework:** Next.js (with App Router)
*   **Styling:** Tailwind CSS
*   **State Management:** Zustand (for global state if needed)
*   **Data Fetching:** Next.js features (Server Components, Route Handlers) + SWR
*   **Maps:** Leaflet.js + react-leaflet
*   **Charts:** Chart.js + react-chartjs-2 (or Recharts)
*   **Package Manager:** npm

**Rationale:**
*   Next.js provides excellent support for SSR/SSG/ISR, crucial for SEO goals outlined in `docs/SEO-Strategie & Technische Vorgaben für Frontend.md`. The App Router is the current standard.
*   Tailwind CSS allows for rapid UI development and fits well with component-based architectures.
*   Zustand offers a simple and unopinionated approach to global state, used only if necessary.
*   SWR complements Next.js's fetching for client-side caching and revalidation.
*   Leaflet and Chart.js were suggested in `docs/Frontend Implementierungsplan_ Hautarzt-Verzeichnis.md` and are solid choices.
*   npm was chosen during the `create-next-app` initialization.

---

*(Add future decisions here)* 