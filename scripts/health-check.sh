#!/bin/bash

# Chasing Chapters - Production Health Check Script
# Usage: ./health-check.sh [base_url]

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Counter for tests
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    info "Testing: $description"
    info "URL: $url"
    
    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null); then
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$http_code" -eq "$expected_status" ]; then
            log "$description - HTTP $http_code"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            error "$description - Expected HTTP $expected_status, got HTTP $http_code"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        error "$description - Connection failed or timeout"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test JSON response
test_json_endpoint() {
    local url="$1"
    local description="$2"
    local json_key="$3"
    
    info "Testing: $description"
    info "URL: $url"
    
    if response=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null); then
        if echo "$response" | jq -r ".$json_key" >/dev/null 2>&1; then
            value=$(echo "$response" | jq -r ".$json_key")
            log "$description - $json_key: $value"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            error "$description - Invalid JSON or missing key: $json_key"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        error "$description - Connection failed or timeout"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo "Chasing Chapters - Health Check"
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo "=========================================="
echo ""

# 1. Health Check Endpoint
echo "1. Health Check Endpoint"
echo "----------------------------------------"
test_json_endpoint "$BASE_URL/api/health" "Health endpoint" "status"
if [ $? -eq 0 ]; then
    # Get additional health info
    health_response=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "   Environment: $(echo "$health_response" | jq -r '.environment')"
        echo "   Database: $(echo "$health_response" | jq -r '.database')"
        echo "   Uptime: $(echo "$health_response" | jq -r '.uptime')s"
    fi
fi
echo ""

# 2. Frontend Pages
echo "2. Frontend Pages"
echo "----------------------------------------"
test_endpoint "$BASE_URL/" "Homepage" 200
test_endpoint "$BASE_URL/about" "About page" 200  
test_endpoint "$BASE_URL/contact" "Contact page" 200
test_endpoint "$BASE_URL/reviews" "Reviews page" 200
test_endpoint "$BASE_URL/search" "Search page" 200
echo ""

# 3. Admin Panel
echo "3. Admin Panel"
echo "----------------------------------------"
test_endpoint "$BASE_URL/admin" "Admin panel" 200
test_endpoint "$BASE_URL/admin/login" "Admin login" 200
echo ""

# 4. API Endpoints
echo "4. API Endpoints"
echo "----------------------------------------"
test_endpoint "$BASE_URL/api/search" "Search API (no query)" 400
test_endpoint "$BASE_URL/api/search?q=test" "Search API (with query)" 200
test_endpoint "$BASE_URL/api/reviews" "Reviews API" 200
test_endpoint "$BASE_URL/api/tags" "Tags API" 200
echo ""

# 5. GraphQL Endpoint
echo "5. GraphQL Endpoint"
echo "----------------------------------------"
test_endpoint "$BASE_URL/api/graphql" "GraphQL endpoint" 200
test_endpoint "$BASE_URL/api/graphql-playground" "GraphQL playground" 200
echo ""

# 6. Static Assets
echo "6. Static Assets & SEO"
echo "----------------------------------------"
test_endpoint "$BASE_URL/favicon.ico" "Favicon" 200
test_endpoint "$BASE_URL/robots.txt" "Robots.txt" 200
test_endpoint "$BASE_URL/sitemap.xml" "Sitemap" 200
echo ""

# 7. Google Books API (if configured)
echo "7. External API Integration"
echo "----------------------------------------"
if test_endpoint "$BASE_URL/api/books/search?q=javascript" "Google Books API" 200; then
    log "Google Books API integration working"
else
    warning "Google Books API may not be configured or accessible"
fi
echo ""

# Summary
echo "=========================================="
echo "Health Check Summary"
echo "=========================================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log "All health checks passed! ✨"
    echo ""
    echo "Application appears to be running correctly."
    echo "✅ Frontend pages accessible"
    echo "✅ Admin panel accessible"
    echo "✅ API endpoints responding"
    echo "✅ Health monitoring working"
    exit 0
else
    error "Some health checks failed!"
    echo ""
    echo "Issues detected:"
    if [ $TESTS_FAILED -gt 5 ]; then
        echo "❌ Multiple critical failures - check application logs"
    elif [ $TESTS_FAILED -gt 2 ]; then
        echo "⚠️  Several failures - investigate specific endpoints"
    else
        echo "⚠️  Minor issues detected - may be configuration related"
    fi
    echo ""
    echo "Troubleshooting:"
    echo "1. Check application logs"
    echo "2. Verify environment variables"
    echo "3. Test database connectivity"
    echo "4. Check external service availability"
    exit 1
fi