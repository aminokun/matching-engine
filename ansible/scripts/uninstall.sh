#!/bin/bash
# Matching Engine Uninstall Script
# Removes all deployed services and data

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}============================================${NC}"
echo -e "${RED}  Uninstall Matching Engine${NC}"
echo -e "${RED}============================================${NC}"
echo ""
echo -e "${YELLOW}WARNING: This will completely remove the application and all data!${NC}"
echo ""

# Prompt for target
read -p "Enter target server IP (default: localhost): " SERVER_IP
SERVER_IP=${SERVER_IP:-localhost}

read -p "Enter SSH user (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

# Confirmation
echo ""
echo -e "${RED}This will:${NC}"
echo "  - Stop and remove all Docker containers"
echo "  - Remove Docker images"
echo "  - Delete application files"
echo "  - Remove OpenSearch data"
echo ""
read -p "Are you sure you want to continue? (yes/NO): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Uninstall cancelled."
    exit 0
fi

# Create uninstall playbook
cat > /tmp/uninstall-matching-engine.yml << EOF
---
- name: Uninstall Matching Engine
  hosts: all
  become: yes
  gather_facts: no

  tasks:
    - name: Stop and remove containers
      shell: |
        docker stop matching-engine-backend matching-engine-frontend opensearch 2>/dev/null || true
        docker rm matching-engine-backend matching-engine-frontend opensearch 2>/dev/null || true

    - name: Remove Docker images
      shell: |
        docker rmi matching-engine-backend:latest matching-engine-frontend:latest 2>/dev/null || true

    - name: Remove application directory
      file:
        path: /opt/matching-engine
        state: absent

    - name: Remove OpenSearch data directory
      file:
        path: /opt/opensearch
        state: absent

    - name: Remove log rotation config
      file:
        path: /etc/logrotate.d/matching-engine
        state: absent

    - name: Display completion message
      debug:
        msg: "Matching Engine has been uninstalled."
EOF

# Build inventory
INVENTORY_FILE="/tmp/hosts.tmp.yml"
cat > "$INVENTORY_FILE" << EOF
---
all:
  children:
    matching_engine:
      hosts:
        target:
          ansible_host: $SERVER_IP
          ansible_user: $SSH_USER
EOF

# Run uninstall
echo ""
echo -e "${BLUE}Uninstalling...${NC}"
echo ""

ansible-playbook -i "$INVENTORY_FILE" /tmp/uninstall-matching-engine.yml

# Cleanup
rm -f /tmp/uninstall-matching-engine.yml "$INVENTORY_FILE"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Uninstall Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
