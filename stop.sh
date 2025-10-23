#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping Matching Engine containers...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

if docker-compose down; then
    echo -e "${GREEN}✓ All containers stopped and removed${NC}"
else
    echo -e "${RED}✗ Failed to stop containers${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}To remove volumes (data):${NC}"
echo -e "  ${BLUE}docker-compose down -v${NC}"
echo ""
