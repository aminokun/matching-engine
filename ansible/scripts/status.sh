#!/bin/bash
# Matching Engine Status Check Script
# Checks the status of all deployed services

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Matching Engine Status${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check Docker containers
echo -e "${YELLOW}Docker Containers${NC}"
echo "--------------------"

containers=("opensearch" "matching-engine-backend" "matching-engine-frontend")

for container in "${containers[@]}"; do
    if docker ps --format '{{{{.Names}}}}' | grep -q "^${container}$"; then
        status=$(docker inspect --format '{{{{.State.Status}}}}' "$container")
        echo -e "${GREEN}✓${NC} $container: $status"
    else
        echo -e "${RED}✗${NC} $container: not running"
    fi
done

echo ""

# Check ports
echo -e "${YELLOW}Port Status${NC}"
echo "--------------------"

ports=("3001:Backend API" "3002:Frontend" "9200:OpenSearch")

for port_info in "${ports[@]}"; do
    port="${port_info%%:*}"
    name="${port_info##*:}"

    if nc -z localhost "$port" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Port $port ($name): listening"
    else
        echo -e "${RED}✗${NC} Port $port ($name): not accessible"
    fi
done

echo ""

# Health checks
echo -e "${YELLOW}Health Checks${NC}"
echo "--------------------"

# Backend health
if curl -s http://localhost:3001/api/search/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend API: healthy"
else
    echo -e "${RED}✗${NC} Backend API: unhealthy"
fi

# Frontend
if curl -s http://localhost:3002 > /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend: accessible"
else
    echo -e "${RED}✗${NC} Frontend: not accessible"
fi

# OpenSearch
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    cluster_health=$(curl -s http://localhost:9200/_cluster/health | jq -r '.status')
    echo -e "${GREEN}✓${NC} OpenSearch: $cluster_health"
else
    echo -e "${RED}✗${NC} OpenSearch: not accessible"
fi

echo ""

# Display logs command
echo -e "${YELLOW}View Logs${NC}"
echo "--------------------"
echo "  Backend:  docker logs -f matching-engine-backend"
echo "  Frontend: docker logs -f matching-engine-frontend"
echo "  OpenSearch: docker logs -f opensearch"

echo ""
echo -e "${BLUE}============================================${NC}"
