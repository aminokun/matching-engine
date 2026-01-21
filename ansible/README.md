# Matching Engine - Ansible Deployment

Complete Ansible-based deployment automation for the Matching Engine application. Deploys OpenSearch, backend API, and frontend on a single VPS with a single command.

## Features

- **One-command deployment** - Deploy everything with a single script
- **OpenSearch included** - No manual setup required
- **Automated setup** - Docker, networks, firewall, all configured automatically
- **Health checks** - Verifies all services are running correctly
- **Rollback support** - Easy uninstall if needed

## Quick Start

### Prerequisites

On your **jump server** (where you run Ansible from):
```bash
# Install Ansible
sudo apt install ansible  # Ubuntu/Debian
sudo yum install ansible  # RHEL/CentOS
brew install ansible      # macOS
```

### Deployment

```bash
cd ansible

# Option 1: Interactive deployment (recommended)
./scripts/deploy.sh

# Option 2: Direct Ansible command
ansible-playbook -i inventory/hosts.yml playbook.yml \
  --extra-vars "anthropic_api_key=sk-ant-xxx \
                gemini_api_key=xxx \
                notion_api_key=xxx"
```

### Access the Application

After deployment:
- **Frontend:** http://YOUR_SERVER_IP:3002
- **Backend API:** http://YOUR_SERVER_IP:3001
- **OpenSearch:** http://YOUR_SERVER_IP:9200

## Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `anthropic_api_key` | Claude API key | `sk-ant-xxx` |
| `gemini_api_key` | Google Gemini API key | `AIzaSyxxx` |
| `notion_api_key` | Notion integration key | `secret_xxx` |

### Optional Variables

Edit `inventory/group_vars/all.yml` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `app_domain` | Auto-detected IP | Application domain |
| `opensearch_version` | `2.15.0` | OpenSearch version |
| `opensearch_heap_size` | Auto-detected | JVM heap size |
| `git_repo` | Empty | Git repository to clone |
| `git_branch` | `main` | Git branch to deploy |
| `deploy_path` | `/opt/matching-engine` | Installation directory |

### Server Requirements

- **OS:** Ubuntu 20.04+, Debian 11+, RHEL 8+, Rocky Linux 8+
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 20GB minimum
- **CPU:** 2 cores minimum

## Directory Structure

```
ansible/
├── playbook.yml              # Main playbook
├── inventory/
│   ├── hosts.yml            # Server inventory
│   └── group_vars/
│       └── all.yml          # Global variables
├── roles/
│   ├── system-setup/        # Docker, Java, firewall
│   ├── opensearch-deploy/   # OpenSearch deployment
│   ├── network-config/      # Docker networks
│   ├── app-deploy/          # Application deployment
│   ├── opensearch-init/     # Index setup, data loading
│   └── health-check/        # Post-deployment verification
├── templates/               # Jinja2 templates
├── scripts/
│   ├── deploy.sh            # Interactive deployment
│   ├── status.sh            # Check service status
│   └── uninstall.sh         # Complete removal
└── README.md               # This file
```

## Deployment Modes

### 1. Git Repository Mode

Deploy from a Git repository:

```bash
ansible-playbook -i inventory/hosts.yml playbook.yml \
  --extra-vars "git_repo=https://github.com/user/matching-engine.git \
                git_branch=main \
                anthropic_api_key=sk-ant-xxx \
                gemini_api_key=xxx \
                notion_api_key=xxx"
```

### 2. Local Files Mode

Deploy using local files (for development):

```bash
# Run from matching-engine directory
ansible-playbook -i inventory/hosts.yml playbook.yml \
  --extra-vars "anthropic_api_key=sk-ant-xxx \
                gemini_api_key=xxx \
                notion_api_key=xxx"
```

### 3. Local Development Mode

Deploy to localhost for testing:

```bash
# Edit inventory/hosts.yml to use localhost
ansible-playbook -i inventory/hosts.yml playbook.yml \
  --connection=local \
  --extra-vars "anthropic_api_key=sk-ant-xxx \
                gemini_api_key=xxx \
                notion_api_key=xxx"
```

## Managing Services

### Check Status

```bash
./scripts/status.sh
```

Output:
```
============================================
  Matching Engine Status
============================================

Docker Containers
--------------------
✓ opensearch: running
✓ matching-engine-backend: running
✓ matching-engine-frontend: running

Port Status
--------------------
✓ Port 3001 (Backend API): listening
✓ Port 3002 (Frontend): listening
✓ Port 9200 (OpenSearch): listening

Health Checks
--------------------
✓ Backend API: healthy
✓ Frontend: accessible
✓ OpenSearch: green
```

### View Logs

```bash
# Backend logs
docker logs -f matching-engine-backend

# Frontend logs
docker logs -f matching-engine-frontend

# OpenSearch logs
docker logs -f opensearch
```

### Restart Services

```bash
# Restart backend
docker restart matching-engine-backend

# Restart frontend
docker restart matching-engine-frontend

# Restart OpenSearch
docker restart opensearch
```

### Update Deployment

```bash
# Re-run the playbook to update
ansible-playbook -i inventory/hosts.yml playbook.yml \
  --extra-vars "anthropic_api_key=sk-ant-xxx \
                gemini_api_key=xxx \
                notion_api_key=xxx"
```

## Uninstall

To completely remove the application:

```bash
./scripts/uninstall.sh
```

Or manually:

```bash
# Stop containers
docker stop matching-engine-backend matching-engine-frontend opensearch

# Remove containers
docker rm matching-engine-backend matching-engine-frontend opensearch

# Remove images
docker rmi matching-engine-backend:latest matching-engine-frontend:latest

# Remove data
rm -rf /opt/matching-engine
rm -rf /opt/opensearch
```

## Troubleshooting

### Port Already in Use

If a port is already in use:

```bash
# Check what's using the port
sudo lsof -i :3001

# Stop the conflicting service
sudo systemctl stop nginx  # Example if nginx is using port 3001
```

### Out of Memory

If OpenSearch crashes due to memory:

1. Edit `inventory/group_vars/all.yml`:
   ```yaml
   opensearch_heap_size: "1g"  # Reduce from 2g
   ```

2. Re-run the playbook

### Containers Not Starting

Check Docker logs:

```bash
# View container logs
docker logs matching-engine-backend
docker logs matching-engine-frontend
docker logs opensearch

# Check Docker status
sudo systemctl status docker
```

### OpenSearch Connection Failed

Verify OpenSearch is running:

```bash
# Check container
docker ps | grep opensearch

# Test connection
curl http://localhost:9200/_cluster/health
```

### Firewall Issues

If services are not accessible:

```bash
# Check firewall status
sudo ufw status

# Allow ports
sudo ufw allow 3001
sudo ufw allow 3002
sudo ufw allow 9200
```

## Security Considerations

### API Keys

- Store API keys using Ansible Vault for production
- Never commit API keys to version control

### Encrypting Variables with Ansible Vault

```bash
# Create encrypted variable
ansible-vault encrypt_string 'sk-ant-xxx' --name 'anthropic_api_key'

# Add to inventory/group_vars/all.yml:
# anthropic_api_key: !vault |
#   $ANSIBLE_VAULT;1.1;...

# Run playbook with vault password
ansible-playbook -i inventory/hosts.yml playbook.yml --ask-vault-pass
```

### Firewall

By default, these ports are opened:
- `22` - SSH
- `80` - HTTP
- `443` - HTTPS
- `3001` - Backend API
- `3002` - Frontend
- `9200` - OpenSearch

**Recommendation:** Close port 9200 for external access if not needed.

### SSL/TLS

For production, configure reverse proxy with SSL:

```nginx
# /etc/nginx/sites-available/matching-engine
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3002;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

## Advanced Usage

### Custom Deployment Path

```bash
--extra-vars "deploy_path=/custom/path"
```

### Custom Git Branch

```bash
--extra-vars "git_branch=develop"
```

### Skip Health Checks

```bash
--extra-vars "skip_health_check=true"
```

### Verbose Output

```bash
ansible-playbook -i inventory/hosts.yml playbook.yml -vvv
```

### Tag-Specific Deployment

Deploy only specific components:

```bash
# Only setup system
ansible-playbook -i inventory/hosts.yml playbook.yml --tags setup

# Only deploy application
ansible-playbook -i inventory/hosts.yml playbook.yml --tags deploy

# Only run health checks
ansible-playbook -i inventory/hosts.yml playbook.yml --tags check
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs: `docker logs <container-name>`
3. Check service status: `./scripts/status.sh`
4. Review the main HANDOVER.md for architecture details

## License

Same as the main Matching Engine project.
