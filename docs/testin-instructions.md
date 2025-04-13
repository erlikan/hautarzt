## Testing Instructions for Cursor AI Agent: Hautarzt Vergleich Backend

**Overall Goal:** Ensure the reliability, correctness, and security of the Hautarzt Vergleich backend components, including database interactions, API endpoints (Edge Functions), the AI analysis pipeline, and utility scripts.

**Prerequisites for Cursor AI:**

1.  **Code Access:** Full read access to the project repository, including `supabase/functions/`, `scripts/`, and potentially SQL schema definitions.
2.  **Environment Understanding:** Knowledge of the tech stack: Supabase, PostgreSQL (PL/pgSQL), Deno/TypeScript, Google Gemini API, Python.
3.  **Testing Frameworks:** Ability to generate tests using:
    *   **Deno:** Deno's built-in testing tools (`Deno.test`, `asserts`).
    *   **Python:** `pytest`.
    *   **(Optional) SQL:** Ability to generate SQL queries to verify data and constraints directly in the database.
4.  **Configuration Access (Read-Only):** Access to non-sensitive configuration details and `.env.example` files. **Do not modify or require write access to actual `.env` files or Supabase secrets.**
5.  **Mocking:** Ability to generate mock objects/functions for external dependencies (Supabase client, Gemini API, `pg_net`).

**General Testing Guidelines:**

*   **Test File Structure:** Create test files alongside the code they are testing (e.g., `index.test.ts` within the function's folder, `test_generate_slugs.py` in `scripts/`).
*   **Test Naming:** Use clear and descriptive names for test suites (`describe`/`context`) and individual tests (`it`/`test`).
*   **Arrange-Act-Assert (AAA):** Structure tests using the AAA pattern.
*   **Isolation:** Unit tests should isolate the component under test by mocking dependencies. Integration tests verify interactions between components.
*   **Mocking:** Mock external services (Gemini API, `pg_net`) and database interactions (Supabase client, DB Pool connections) for unit tests. Use libraries like `sinon` or built-in mocking capabilities if applicable in the Deno/TS environment. For Python, use `unittest.mock` or `pytest-mock`.
*   **Test Data:** Use clearly defined, simple mock data for inputs and expected outputs in unit tests. For integration tests, assume a separate test database or specific test data records are available (coordinate with the project lead for setup).
*   **Code Coverage:** Aim for reasonable test coverage, focusing on critical paths, edge cases, and error handling.
*   **Adhere to Coding Standards:** Generated test code should follow the project's established coding standards.

---

**Specific Testing Tasks:**

**1. Database Schema (`supabase/migrations/` or Schema Definition):**

*   **Task:** Review the SQL schema definitions.
*   **Instructions:**
    *   Verify that Primary Keys (PK), Foreign Keys (FK) with `ON DELETE CASCADE`, and `UNIQUE` constraints are correctly defined according to the documentation (e.g., `praxis.google_place_id` as PK, FKs referencing it, `service.name` unique, `slug` unique per location).
    *   Check `CHECK` constraints (e.g., `analysis_status` values, percentage sums in `praxis_analysis`).
    *   Verify data types are appropriate (e.g., `TIMESTAMPTZ`, `DECIMAL`, `TEXT[]`, `GEOMETRY`).
    *   Confirm indexes (`BTREE`, `GIST`, `GIN`) exist on frequently queried/filtered/sorted columns (`city`, `slug`, `overall_score`, `location`, `tags`).
    *   Review permissions granted on tables and functions (e.g., `GRANT EXECUTE` on Stored Procedures, RLS policies if defined).

**2. Stored Procedure: `save_analysis_data` (PL/pgSQL):**

*   **Task:** Generate SQL scripts to perform integration tests directly on the database.
*   **Instructions:**
    *   Generate `INSERT` statements for mock `praxis` and `service` data if needed for testing.
    *   Generate multiple `CALL save_analysis_data('<test_place_id>', '<mock_analysis_json>');` statements with different `mock_analysis_json` inputs representing various scenarios:
        *   Scenario 1: Basic valid analysis data.
        *   Scenario 2: Analysis data including `genannte_leistungen` (some new, some existing).
        *   Scenario 3: Analysis data with `trend: 'positiv'` and `trend: 'negativ'`.
        *   Scenario 4: Analysis data simulating low Google review count (`praxis.reviews` < threshold).
        *   Scenario 5: Analysis data with missing optional fields (e.g., no `tags`, no `mentioned_doctors`).
        *   Scenario 6 (Error): Malformed `mock_analysis_json` (to test error handling within the SP, though it might just fail).
    *   For each `CALL`, generate subsequent `SELECT` statements to verify:
        *   Correct data insertion/update in `praxis_analysis` (check all columns, especially `overall_score`).
        *   Correct insertion/existence of services in the `service` table.
        *   Correct associations in `praxis_service` table for the given `test_place_id`.
        *   `praxis.analysis_status` is updated to `completed`.
    *   Include `ROLLBACK;` after each test scenario block if running against a live test DB to keep it clean, or structure tests assuming a fresh DB state.

**3. Stored Procedure: `trigger_pending_practice_analyses` (PL/pgSQL):**

*   **Task:** Review the SQL code for logical correctness. Direct automated testing is difficult.
*   **Instructions:**
    *   Analyze the query that selects pending/failed practices: Does `FOR UPDATE SKIP LOCKED` correctly prevent race conditions? Is the `ORDER BY` clause logical?
    *   Verify the `UPDATE` statement correctly sets the status to `processing`.
    *   Check the logic for reading configuration (`app_config`) and handling missing keys.
    *   Analyze the loop calling `pg_net.http_post`: Are parameters (`url`, `payload`, `headers`) correctly constructed? Is the error handling (`EXCEPTION WHEN OTHERS`) robust enough (e.g., does it correctly set status back to 'failed')?

**4. Edge Function: `analyze-practice` (TypeScript - `supabase/functions/analyze-practice/index.ts`):**

*   **Task:** Generate unit and integration tests.
*   **Instructions (Unit Tests - `index.test.ts`):**
    *   Use Deno's testing tools.
    *   **Mock Dependencies:** Mock `createClient` (Supabase client) and its methods (`.from().select()`, `.from().update()`, `.rpc()`). Mock `GoogleGenerativeAI` and its methods (`.getGenerativeModel()`, `.generateContent()`).
    *   **Test `buildGeminiPrompt`:** Create a separate test suite for this helper function. Provide mock `praxisData` and `reviewsData` and assert that the generated prompt string contains the expected structure and content.
    *   **Test Main Handler (Success Path):**
        *   Simulate a valid POST request with a `praxis_google_place_id`.
        *   Configure mocks to return valid praxis and review data.
        *   Configure the Gemini mock to return a valid JSON response (including scenarios with/without Markdown fences).
        *   Assert that `buildGeminiPrompt` is called correctly.
        *   Assert that the JSON extraction logic works.
        *   Assert that the response JSON is validated (if validation logic exists).
        *   Assert that `supabaseClient.rpc('save_analysis_data', ...)` is called with the correct parameters (the parsed analysis result).
        *   Assert that the function returns a 200 OK response.
    *   **Test Main Handler (Error Paths):**
        *   Test invalid request method (e.g., GET). Expect 405.
        *   Test missing `praxis_google_place_id`. Expect 400.
        *   Test database error when fetching praxis data. Expect 500.
        *   Test database error when fetching reviews. Expect 500.
        *   Test scenario with no reviews found. Expect 200 (or appropriate status) with skip message.
        *   Test Gemini API error. Expect 500.
        *   Test Gemini response blocked/empty. Expect 500.
        *   Test invalid JSON response from Gemini. Expect 500.
        *   Test error during `save_analysis_data` RPC call. Expect 500.
        *   For error cases, assert that `supabaseClient.from('praxis').update(...)` is called to set status to 'failed'.
*   **Instructions (Integration Tests - Optional, requires setup):**
    *   Requires a *test* Supabase project (or local Supabase) and potentially hitting the *real* Gemini API (beware of costs/limits).
    *   Set up specific test data (1-2 practices with reviews) in the test database.
    *   Invoke the *deployed* test function (or run locally against test DB) with the test `praxis_google_place_id`.
    *   Use SQL queries (via Supabase client) to assert that the data in `praxis_analysis`, `praxis_service`, and `praxis.analysis_status` was correctly created/updated after the function call.

**5. Edge Function: `praxis-details` (TypeScript - `supabase/functions/praxis-details/index.ts`):**

*   **Task:** Generate unit and integration tests.
*   **Instructions (Unit Tests - `index.test.ts`):**
    *   Mock `createClient` and its methods (`.from().select().eq().maybeSingle()`).
    *   Test slug extraction from various URL path formats.
    *   **Test Main Handler (Success Path):**
        *   Simulate a valid GET request with valid slugs.
        *   Configure the mock to return valid, joined data (praxis, analysis, services).
        *   Assert that the Supabase client's `select` method is called with the correct query structure (including joins like `analysis:praxis_analysis(*)`).
        *   Assert that the response data structure matches the `PraxisDetail` interface.
        *   Assert that the function returns a 200 OK response.
    *   **Test Main Handler (Not Found):**
        *   Configure the mock to return `null` or an empty array.
        *   Assert that the function returns a 404 Not Found response.
    *   **Test Main Handler (DB Error):**
        *   Configure the mock to simulate a database error.
        *   Assert that the function returns a 500 Internal Server Error response.
*   **Instructions (Integration Tests - Optional):**
    *   Use a test Supabase instance with existing test data (praxis, analysis, services).
    *   Invoke the deployed test function (or run locally) with known slugs.
    *   Assert that the returned JSON matches the expected structure and data from the test database.

**6. Edge Function: `praxis-search` (TypeScript - `supabase/functions/praxis-search/index.ts`):**

*   **Task:** Generate unit and integration tests (focus on parameter handling and query building logic, *not* the raw SQL execution if it's still using the placeholder).
*   **Instructions (Unit Tests - `index.test.ts`):**
    *   Mock the database execution part (`executeRawQuery` placeholder or the eventual `.rpc('search_praxen_v2', ...)` call).
    *   Test parameter extraction and default value assignment.
    *   Test the dynamic building of SQL query strings (`selectFields`, `fromClause`, `whereConditions`, `orderByClause`) for various combinations of input parameters (city, zip, score, services, geo, sort). Assert that the generated SQL parts and the `queryArgs` array are correct.
    *   Test the calculation of `meta` data (pagination).
    *   Test the final mapping/formatting of the `responseData` array, including the `getAspectStatus` logic.
*   **Instructions (Integration Tests - Requires working implementation):**
    *   Requires a robust implementation (ideally calling a working Stored Procedure).
    *   Use a test Supabase instance with sufficient diverse data.
    *   Invoke the deployed/local function with various parameter combinations (different cities, filters, sorting, pagination).
    *   Assert:
        *   The structure of the response (`data`, `meta`).
        *   The number of items in `data` matches `pageSize` (or less on the last page).
        *   The `meta` data (`currentPage`, `totalItems`, `totalPages`) is correct.
        *   The filtering works (e.g., only results for the specified city/zip/score range/service are returned).
        *   The sorting works (results are ordered according to `sortBy`/`sortOrder`).
        *   Geo-search returns results within the radius and sorted by distance (if applicable).

**7. Script: `generate_slugs.py`