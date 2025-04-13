# Best Practices & Style Guide - Hautarzt Vergleich

This document outlines project-specific best practices and coding style guidelines, complementing the general rules provided.

## General

*   Refer to the `<custom_instructions>` provided initially regarding simplicity, DRY, environment considerations, clean code, avoiding scripts, file size limits, no hardcoded values, etc.
*   Refer to `docs/project-specific-coding-pattern-preferences-guidelines.mdc` for established patterns regarding API communication, AI interaction, DB interaction, configuration, async code, logging, and documentation.
*   Maintain comprehensive documentation in the `/docs` folder, including `techdesign.md` for decisions and this file for evolving practices.

## Frontend (Next.js / React / Tailwind)

*   **Component Structure:** Organize components logically within `frontend/src/components`. Consider subfolders for feature-specific components (e.g., `frontend/src/components/search`, `frontend/src/components/praxis`).
*   **Styling:** Utilize Tailwind CSS utility classes primarily. Create custom CSS or components only for complex or highly reusable styles not easily achievable with utilities. Use the color palette defined in `frontend/tailwind.config.ts` (e.g., `text-score-high`, `bg-aspect-positive`).
*   **State Management:** Prefer local component state (`useState`). Use `Zustand` for global state shared across unrelated components where prop drilling becomes excessive.
*   **Data Fetching:** Leverage Next.js Server Components and Route Handlers for server-side data fetching where possible (especially for initial page loads and SEO). Use SWR for client-side fetching that requires caching, revalidation, or mutation.
*   **API Layer:** Abstract all backend API calls into the service layer (`frontend/src/services/api.ts` or similar). Use defined TypeScript interfaces for requests and responses (interfaces to be defined based on `docs/API_Documentation.md`).
*   **Environment Variables:** Use `.env.local` for sensitive keys (like Supabase keys). Prefix public variables with `NEXT_PUBLIC_`. Access them via `process.env`.
*   **Accessibility (a11y):** Follow WCAG 2.1 AA guidelines. Use semantic HTML, provide `alt` text for images, ensure keyboard navigability, and check color contrasts.
*   **Performance:** Be mindful of bundle size. Use dynamic imports (`next/dynamic`) for large components/libraries not needed immediately (e.g., Map, Chart libraries). Optimize images (`next/image`).

## Backend (Supabase / Edge Functions / PostgreSQL)

*   Adhere strictly to the patterns outlined in `docs/project-specific-coding-pattern-preferences-guidelines.mdc`.
*   **Stored Procedures:** Prefer PL/pgSQL stored procedures for complex database logic and transactions, called via `.rpc()` from Edge Functions.
*   **Edge Functions:** Keep Edge Functions focused on request handling, data fetching/aggregation, calling external APIs (like Gemini), and calling Stored Procedures. Avoid complex SQL query building directly in TypeScript; use the Supabase client or a dedicated driver with parameterization, or delegate to SPs.
*   **Security:** Prioritize secure coding: Parameterized queries everywhere, careful use of `SECURITY DEFINER`, input validation in Edge Functions, proper RLS policies.
*   **Configuration:** Use Supabase Secrets for Edge Function environment variables and the `app_config` table for Stored Procedure configurations.

---

*(Add more specific practices as they emerge)* 