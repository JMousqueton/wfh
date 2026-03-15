# WFH Planner – Installation Guide

## Requirements

- Python 3.10+
- nginx
- A Linux server (systemd-based, e.g. Debian/Ubuntu)

---

## 1. Clone / copy the project

```bash
sudo mkdir -p /opt/wfh
sudo cp -r . /opt/wfh
sudo chown -R www-data:www-data /opt/wfh
```

---

## 2. Python virtual environment & dependencies

```bash
cd /opt/wfh
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

---

## 3. Configuration

Edit `/opt/wfh/.env` to set your port and disable debug in production:

```ini
PORT=8001
DEBUG=false
```

---

## 4. systemd service

Create the service unit file:

```bash
sudo nano /etc/systemd/system/wfh.service
```

Paste the following:

```ini
[Unit]
Description=WFH Planner
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/wfh
EnvironmentFile=/opt/wfh/.env
ExecStart=/opt/wfh/venv/bin/python server.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable wfh
sudo systemctl start wfh
sudo systemctl status wfh
```

---

## 5. nginx virtual host

Copy the provided config and obtain a TLS certificate:

```bash
sudo cp wfh.example.com.conf /etc/nginx/sites-available/wfh.example.com
sudo ln -s /etc/nginx/sites-available/wfh.example.com /etc/nginx/sites-enabled/
sudo nginx -t

# Install certbot if needed
sudo apt install certbot python3-certbot-nginx

# Obtain Let's Encrypt certificate
sudo certbot --nginx -d wfh.example.com

sudo systemctl reload nginx
```

---

## 6. Verify

```bash
curl -I https://wfh.example.com
sudo journalctl -u wfh -f    # live logs
```

---

## Useful commands

| Action | Command |
|--------|---------|
| Start  | `sudo systemctl start wfh` |
| Stop   | `sudo systemctl stop wfh` |
| Restart | `sudo systemctl restart wfh` |
| Logs   | `sudo journalctl -u wfh -f` |
| Status | `sudo systemctl status wfh` |
