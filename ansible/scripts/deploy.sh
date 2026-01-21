#!/bin/bash
# Matching Engine Deployment Script
# Interactive deployment wrapper for the Ansible playbook

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Print banner
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Matching Engine Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Ansible is installed
if ! command -v ansible-playbook &> /dev/null; then
    echo -e "${RED}Error: ansible-playbook is not installed${NC}"
    echo "Please install Ansible first:"
    echo "  Ubuntu/Debian: sudo apt install ansible"
    echo "  RHEL/CentOS: sudo yum install ansible"
    echo "  macOS: brew install ansible"
    exit 1
fi

# Check inventory file
if [ ! -f "inventory/hosts.yml" ]; then
    echo -e "${RED}Error: inventory/hosts.yml not found${NC}"
    exit 1
fi

# Prompt for target host
echo -e "${YELLOW}Target Configuration${NC}"
echo "------------------------"
read -p "Enter target server IP (default: localhost): " SERVER_IP
SERVER_IP=${SERVER_IP:-localhost}

read -p "Enter SSH user (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

# Prompt for API keys
echo ""
echo -e "${YELLOW}API Keys (Required)${NC}"
echo "------------------------"

read -p "Enter Anthropic API key: " ANTHROPIC_KEY
if [ -z "$ANTHROPIC_KEY" ]; then
    echo -e "${RED}Error: Anthropic API key is required${NC}"
    exit 1
fi

read -p "Enter Gemini API key: " GEMINI_KEY
if [ -z "$GEMINI_KEY" ]; then
    echo -e "${RED}Error: Gemini API key is required${NC}"
    exit 1
fi

read -p "Enter Notion API key: " NOTION_KEY
if [ -z "$NOTION_KEY" ]; then
    echo -e "${RED}Error: Notion API key is required${NC}"
    exit 1
fi

# Optional: Git repository
echo ""
read -p "Enter Git repository URL (leave empty to skip git clone): " GIT_REPO

# Confirm deployment
echo ""
echo -e "${YELLOW}Deployment Summary${NC}"
echo "--------------------"
echo "Target: $SSH_USER@$SERVER_IP"
echo "Git repo: ${GIT_REPO:-'(local files)'}"
echo ""
read -p "Proceed with deployment? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Build inventory file
INVENTORY_FILE="inventory/hosts.tmp.yml"
cat > "$INVENTORY_FILE" << EOF
---
all:
  children:
    matching_engine:
      hosts:
        target-server:
          ansible_host: $SERVER_IP
          ansible_user: $SSH_USER
EOF

# Build extra vars
EXTRA_VARS="anthropic_api_key='$ANTHROPIC_KEY' gemini_api_key='$GEMINI_KEY' notion_api_key='$NOTION_KEY'"

if [ -n "$GIT_REPO" ]; then
    EXTRA_VARS="$EXTRA_VARS git_repo='$GIT_REPO'"
fi

# Run the playbook
echo ""
echo -e "${BLUE}Starting deployment...${NC}"
echo ""

ansible-playbook -i "$INVENTORY_FILE" playbook.yml \
    --extra-vars "$EXTRA_VARS" \
    "$@"

# Cleanup
rm -f "$INVENTORY_FILE"

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  Deployment completed successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Access the application at:"
    echo "  Frontend: http://$SERVER_IP:3002"
    echo "  Backend:  http://$SERVER_IP:3001"
    echo ""
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}  Deployment failed!${NC}"
    echo -e "${RED}============================================${NC}"
    exit 1
fi
