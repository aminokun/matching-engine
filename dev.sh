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

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Matching Engine - Development Mode Setup             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}\n"

# Start only infrastructure containers (Elasticsearch)
echo -e "${YELLOW}Starting infrastructure container (Elasticsearch)...${NC}"
cd "$PROJECT_ROOT" || exit 1

# Create a custom docker-compose command that only starts Elasticsearch
docker-compose up -d elasticsearch

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Infrastructure containers started${NC}\n"

# Wait for Elasticsearch
echo -e "${YELLOW}Waiting for Elasticsearch to be healthy...${NC}"
MAX_ATTEMPTS=60
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker exec matching-engine-elasticsearch curl -s -u elastic:changeme http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Elasticsearch is healthy${NC}"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ $((ATTEMPT % 10)) -eq 0 ]; then
        echo -e "${BLUE}  Waiting... ($ATTEMPT/$MAX_ATTEMPTS)${NC}"
    fi
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠ Elasticsearch health check timed out${NC}"
fi
echo ""

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '#' | xargs)
fi

# Display development instructions
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Development Environment Ready               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}Infrastructure Services:${NC}"
docker-compose ps elasticsearch ollama 2>/dev/null | tail -n +2 | while read line; do
    [ -z "$line" ] && return
    echo -e "  ${CYAN}$line${NC}"
done
echo ""

echo -e "${GREEN}Available Ports:${NC}"
echo -e "  ${BLUE}Elasticsearch${NC}  → http://localhost:9200 (elastic/changeme)"
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

echo -e "${YELLOW}To stop infrastructure containers:${NC}"
echo -e "  ${BLUE}./stop.sh${NC}"
echo ""

echo -e "${GREEN}✓ Development environment ready!${NC}"
