#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

OPENSEARCH_URL="${OPENSEARCH_URL:-http://192.168.189.161:9200}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Matching Engine - Development Mode Setup             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

# Check OpenSearch connectivity
echo -e "${YELLOW}Checking OpenSearch connectivity at ${OPENSEARCH_URL}...${NC}"
if curl -s --connect-timeout 5 "${OPENSEARCH_URL}/_cluster/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OpenSearch is accessible${NC}\n"
else
    echo -e "${RED}✗ Cannot connect to OpenSearch at ${OPENSEARCH_URL}${NC}"
    echo -e "${YELLOW}  Make sure the school VM is running and accessible${NC}"
    echo -e "${YELLOW}  You may need to be on the school network or VPN${NC}\n"
fi

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '#' | xargs)
fi

# Display development instructions
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Development Environment Ready               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}OpenSearch Configuration:${NC}"
echo -e "  ${CYAN}URL:${NC} ${OPENSEARCH_URL}"
echo -e "  ${CYAN}Index:${NC} company-profiles"
echo ""

echo -e "${YELLOW}To initialize the OpenSearch index:${NC}"
echo -e "  ${BLUE}node scripts/init-elasticsearch.js${NC}"
echo ""

echo -e "${YELLOW}To start Backend (in a new terminal):${NC}"
echo -e "  ${BLUE}cd backend && npm install && npm run dev${NC}"
echo ""

echo -e "${YELLOW}To start Frontend (in another new terminal):${NC}"
echo -e "  ${BLUE}cd frontend && npm install && npm run dev${NC}"
echo ""

echo -e "${GREEN}Frontend will be available at:${NC}"
echo -e "  ${BLUE}http://localhost:3000${NC}"
echo ""

echo -e "${YELLOW}Backend API will be available at:${NC}"
echo -e "  ${BLUE}http://localhost:3001${NC}"
echo ""

echo -e "${GREEN}✓ Development environment ready!${NC}"
