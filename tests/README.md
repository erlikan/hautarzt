# Hautarzt-Verzeichnis Backend Tests

This directory contains tests for the Hautarzt-Verzeichnis backend components, including database interactions, API endpoints (Edge Functions), and utility scripts.

## Test Structure

The tests are organized by component type:

```
tests/
├── database/                      # Database schema validation tests
├── edge-functions/                # Tests for Supabase Edge Functions
├── scripts/                       # Tests for utility scripts
├── stored-procedures/             # Tests for PostgreSQL stored procedures
├── test-utils/                    # Shared test utilities
├── run_tests.sh                   # Test runner script
└── README.md                      # This file
```

## Prerequisites

To run all tests, you'll need:

1. **PostgreSQL Client**: `psql` command line tool for database tests
2. **Deno**: For Edge Function tests
3. **Python 3**: For script tests
4. **Database Connection**: A connection to a test database (local or remote)

## Running Tests

### Running All Tests

To run all tests:

```bash
./run_tests.sh
```

The script will automatically detect which tools are available and skip tests that can't be run.

### Running Specific Tests

#### Database Schema Tests

```bash
psql <connection-string> -f tests/database/schema_validation.test.sql
```

#### Stored Procedure Tests

```bash
psql <connection-string> -f tests/stored-procedures/search_praxen_v2.test.sql
psql <connection-string> -f tests/stored-procedures/save_analysis_data.test.sql
```

#### Edge Function Tests

```bash
deno test --allow-net --allow-env --allow-read tests/edge-functions/praxis-search.test.ts
deno test --allow-net --allow-env --allow-read tests/edge-functions/praxis-details.test.ts
deno test --allow-net --allow-env --allow-read tests/edge-functions/analyze-practice.test.ts
```

#### Python Script Tests

```bash
python3 -m unittest tests/scripts/test_generate_slugs.py
```

## Test Database Setup

For database tests, you need a test database with the schema already set up. The tests use real SQL queries but with temporary test data that is created and then cleaned up within each test.

You can configure the database connection in the following ways:

1. Set the `HAUTARZT_DATABASE_URL` environment variable
2. The test script will fall back to `postgresql://postgres:postgres@localhost:5432/hautarztverzeichnis` if no connection string is provided

## Adding New Tests

When adding new tests:

1. Place them in the appropriate directory based on component type
2. Follow the existing naming conventions
3. Use the shared test utilities when applicable
4. Ensure all tests clean up after themselves
5. Update this README if you add new test categories 