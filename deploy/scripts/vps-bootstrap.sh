#!/usr/bin/env bash
# One-time VPS hardening + dependency install (Ubuntu 22.04/24.04)
# Run as root on a fresh VPS: bash deploy/scripts/vps-bootstrap.sh
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating system..."
apt-get update -y
apt-get upgrade -y

echo "==> Installing base packages..."
apt-get install -y \
  ca-certificates curl gnupg git ufw fail2ban nginx certbot python3-certbot-nginx \
  build-essential

echo "==> Installing Node.js 20 LTS..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

echo "==> Installing PM2..."
npm install -g pm2

echo "==> Creating app directories..."
mkdir -p /var/www/hrms
mkdir -p /var/log/hrms
mkdir -p /var/www/certbot

echo "==> Configuring firewall (SSH + HTTP + HTTPS)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Hardening SSH — skipped automatically."
echo "    After adding your SSH public key, manually set PasswordAuthentication no in /etc/ssh/sshd_config"

echo "==> Enabling fail2ban..."
systemctl enable fail2ban
systemctl restart fail2ban

echo "==> Bootstrap complete."
echo "IMPORTANT: Add your SSH public key before closing this session if password login was your only access."
echo "Next: clone the repo to /var/www/hrms and run deploy/scripts/deploy-app.sh"
