#!/bin/bash
# tests/run_tests.sh - Script to run all tests for the Hautarzt-Verzeichnis backend

set -e  # Exit immediately if a command exits with a non-zero status

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Banner
echo -e "${YELLOW}"
echo "======================================================"
echo "         Hautarzt-Verzeichnis Backend Tests           "
echo "======================================================"
echo -e "${NC}"

# Create a temporary directory for test reports
mkdir -p test_reports

# Function to execute a test and report results
run_test() {
  local test_type=$1
  local test_name=$2
  local test_command=$3
  
  echo -e "\n${YELLOW}Running $test_type test: $test_name${NC}"
  
  if eval "$test_command"; then
    echo -e "${GREEN}✓ $test_name passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_name failed${NC}"
    return 1
  fi
}

# Determine absolute path to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Project root: $PROJECT_ROOT"

echo -e "\n${YELLOW}Setting up environment...${NC}"

# Database Tests
if command -v psql &> /dev/null; then
  # Get database connection from environment or .env file
  DB_CONNECTION=${HAUTARZT_DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/hautarztverzeichnis"}
  
  echo -e "\n${YELLOW}Running Database Schema Validation Tests...${NC}"
  
  # Run schema validation
  run_test "SQL" "Schema Validation" "psql $DB_CONNECTION -f $PROJECT_ROOT/tests/database/schema_validation.test.sql"
  
  # Run stored procedure tests
  echo -e "\n${YELLOW}Running Stored Procedure Tests...${NC}"
  run_test "SQL" "search_praxen_v2" "psql $DB_CONNECTION -f $PROJECT_ROOT/tests/stored-procedures/search_praxen_v2.test.sql"
  run_test "SQL" "save_analysis_data" "psql $DB_CONNECTION -f $PROJECT_ROOT/tests/stored-procedures/save_analysis_data.test.sql"
else
  echo -e "${RED}psql not found. Skipping database tests.${NC}"
fi

# Deno/TypeScript Edge Function Tests
if command -v deno &> /dev/null; then
  echo -e "\n${YELLOW}Running Edge Function Tests...${NC}"
  
  # Loop through all edge function test files
  for test_file in "$PROJECT_ROOT"/tests/edge-functions/*.test.ts; do
    if [ -f "$test_file" ]; then
      test_name=$(basename "$test_file" .test.ts)
      run_test "Edge Function" "$test_name" "deno test --no-check --allow-net --allow-env --allow-read $test_file"
    fi
  done
else
  echo -e "${RED}deno not found. Skipping edge function tests.${NC}"
fi

# Python Script Tests
if command -v python3 &> /dev/null; then
  echo -e "\n${YELLOW}Running Python Script Tests...${NC}"
  
  # Test generate_slugs.py
  run_test "Python" "generate_slugs" "python3 -m unittest $PROJECT_ROOT/tests/scripts/test_generate_slugs.py"
else
  echo -e "${RED}python3 not found. Skipping Python script tests.${NC}"
fi

echo -e "\n${YELLOW}======================================================"
echo "                  Test Summary                       "
echo "======================================================${NC}"

echo -e "${GREEN}Tests completed. Check output for any failures.${NC}" 