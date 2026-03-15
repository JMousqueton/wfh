# WFH Planner

A beautiful Progressive Web App (PWA) for tracking Work From Home days for two users.

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![Flask](https://img.shields.io/badge/Flask-3.0+-green) ![PWA](https://img.shields.io/badge/PWA-ready-purple)

## Features

- **Week calendar** — Mon–Fri view, navigate week by week
- **Three statuses** per day: At office · At home · Travelling ✈️
- **Two users** — man (blue) and woman (pink), each with their own color theme
- **Multi-device sync** — SQLite backend via Flask REST API
- **1-year sessions** — stay logged in across devices
- **Profile page** — change language and password
- **French / English** — per-user language preference
- **PWA** — installable on iOS and Android, works offline
- **iOS safe area** — supports Dynamic Island and home bar

## Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Python / Flask / SQLite |
| Frontend | Vanilla JS / Bootstrap 5 / Font Awesome 6 |
| Auth     | Bearer token (secrets.token_hex, 1-year expiry) |
| PWA      | Service Worker, Web App Manifest |

## Quick start

```bash
# 1. Clone and enter the project
cd WFH

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure
cp .env.example .env
# Edit .env to set user names, port, etc.

# 5. Run
python server.py
```

On first run the database is seeded and **randomly generated passwords are printed to the console** — save them.

Open `http://localhost:<PORT>` in your browser (default: [http://localhost:8001](http://localhost:8001)).

## Configuration

All settings live in `.env`:

| Variable        | Default     | Description               |
|-----------------|-------------|---------------------------|
| `HOST`          | `0.0.0.0`   | Bind address              |
| `PORT`          | `8001`      | HTTP port                 |
| `DEBUG`         | `false`     | Flask debug mode          |
| `USER1_ID`      | `julien`    | Login username for user 1 |
| `USER1_USERNAME`| `julien`    | Same as ID (can differ)   |
| `USER1_NAME`    | `Julien`    | Display name              |
| `USER2_ID`      | `mallorie`  | Login username for user 2 |
| `USER2_USERNAME`| `mallorie`  | Same as ID (can differ)   |
| `USER2_NAME`    | `Mallorie`  | Display name              |

Passwords are **never stored in `.env`** — they are randomly generated (12 chars) on first startup.

## Project structure

```
WFH/
├── server.py          # Flask backend (API + static serving)
├── app.js             # Frontend logic (i18n, calendar, auth)
├── index.html         # Single-page app shell
├── styles.css         # Glassmorphism dark theme
├── sw.js              # Service worker (offline cache)
├── manifest.json      # PWA manifest
├── icons/             # PWA icons (192px, 512px)
├── requirements.txt   # Python dependencies
├── .env.example       # Configuration template
├── wfh.example.com.conf  # nginx virtual host template
└── INSTALL.md         # Production deployment guide
```

## Production deployment

See [INSTALL.md](INSTALL.md) for full instructions including systemd service setup and nginx with Let's Encrypt SSL.

## Resetting the database

To change user names or force new passwords, stop the server, delete `wfh.db`, and restart:

```bash
rm wfh.db
python server.py
```
