#!/bin/bash

# Setup Script for Ubuntu 20.04/22.04 LTS
# Run this on your Hetzner server as root (or with sudo)

# 1. Update & Upgrade
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v20 LTS)
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# 4. Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# 5. Install Certbot (for SSL)
echo "Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 6. Create Directory Structure
echo "Creating application directory..."
sudo mkdir -p /var/www/sribalajiagency/backend
sudo mkdir -p /var/www/sribalajiagency/frontend
sudo chown -R $USER:$USER /var/www/sribalajiagency

# 7. Setup Firewall (UFW)
echo "Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "-----------------------------------"
echo "Server Setup Complete!"
echo "-----------------------------------"
echo "Next Steps:"
echo "1. Configure Nginx sites-available (see nginx/sribalajiagency.conf template)"
echo "2. Add your GitHub Secrets (SSH_PRIVATE_KEY, SERVER_IP, SSH_USER)"
echo "3. Push the code to deploy!"
