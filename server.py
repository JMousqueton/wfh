#!/usr/bin/env python3
"""
WFH Planner – Flask / SQLite backend
─────────────────────────────────────
Run:   python server.py
Or:    PORT=8080 python server.py
"""

import os
import sqlite3
import secrets
import threading
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone, date as date_type
from functools import wraps

from flask import Flask, g, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DB_PATH      = os.path.join(BASE_DIR, 'wfh.db')
SESSION_DAYS = 365
HOST         = os.environ.get('HOST', '0.0.0.0')
PORT         = int(os.environ.get('PORT', 5000))
DEBUG        = os.environ.get('DEBUG', 'false').lower() == 'true'
APP_URL      = os.environ.get('APP_URL', f'http://localhost:{os.environ.get("PORT", 5000)}')
SMTP_HOST    = os.environ.get('SMTP_HOST', '')
SMTP_PORT    = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER    = os.environ.get('SMTP_USER', '')
SMTP_PASS    = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM    = os.environ.get('SMTP_FROM', os.environ.get('SMTP_USER', ''))

_MONTHS_FR = ['janvier','février','mars','avril','mai','juin',
              'juillet','août','septembre','octobre','novembre','décembre']
_DAYS_FR   = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche']

def _format_date(iso_date, lang):
    d = date_type.fromisoformat(iso_date)
    if lang == 'fr':
        return f"{_DAYS_FR[d.weekday()]} {d.day} {_MONTHS_FR[d.month - 1]} {d.year}"
    return d.strftime('%A, %B %d, %Y')

def _send_conflict_email(recipient_email, recipient_lang, other_name, cal_date):
    """Send a WFH conflict notification — runs in a background thread."""
    if not SMTP_HOST or not recipient_email:
        return
    formatted = _format_date(cal_date, recipient_lang)
    if recipient_lang == 'fr':
        subject = '[Télétravail] Attention Conflit !'
        body    = (f"{other_name} sera également en télétravail le {formatted}.\n\n"
                   f"Lien vers le site : {APP_URL}")
    else:
        subject = '[WFH] Attention Conflict!'
        body    = (f"{other_name} will also work from home on {formatted}.\n\n"
                   f"Link to the site: {APP_URL}")
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From']    = SMTP_FROM
    msg['To']      = recipient_email
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            if SMTP_USER and SMTP_PASS:
                smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
        print(f'  Conflict email sent to {recipient_email}')
    except Exception as e:
        print(f'  Email error: {e}')


def _rand_password():
    """Generate a random 12-character alphanumeric password."""
    alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#&?!'
    return ''.join(secrets.choice(alphabet) for _ in range(12))

def _seed_users():
    """Build the two seed users from env vars with randomly generated passwords."""
    return [
        dict(id=os.environ.get('USER1_ID',       'julien'),
             username=os.environ.get('USER1_USERNAME', 'julien'),
             name=os.environ.get('USER1_NAME',    'Julien'),
             password=_rand_password(),
             lang='en', icon='fa-person',
             color='#60a5fa', color_rgb='96, 165, 250'),
        dict(id=os.environ.get('USER2_ID',       'mallorie'),
             username=os.environ.get('USER2_USERNAME', 'mallorie'),
             name=os.environ.get('USER2_NAME',    'Mallorie'),
             password=_rand_password(),
             lang='en', icon='fa-person-dress',
             color='#f472b6', color_rgb='244, 114, 182'),
    ]

app = Flask(__name__, static_folder=None)

# ── Database ──────────────────────────────────────────────────────────────────
def get_db():
    """Return a per-request SQLite connection (stored in Flask's g)."""
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA foreign_keys = ON')
        g.db.execute('PRAGMA journal_mode = WAL')
    return g.db

@app.teardown_appcontext
def close_db(_):
    db = g.pop('db', None)
    if db:
        db.close()

def init_db():
    """Create schema and seed users – safe to call on every startup."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name          TEXT NOT NULL,
            icon          TEXT NOT NULL,
            color         TEXT NOT NULL,
            color_rgb     TEXT NOT NULL,
            lang          TEXT NOT NULL DEFAULT 'en',
            email         TEXT
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS calendar (
            date    TEXT NOT NULL,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status  TEXT,
            PRIMARY KEY (date, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar(date);
    """)

    # Live migrations
    for migration in [
        "ALTER TABLE users ADD COLUMN lang  TEXT NOT NULL DEFAULT 'en'",
        "ALTER TABLE users ADD COLUMN email TEXT",
    ]:
        try:
            conn.execute(migration)
            conn.commit()
        except sqlite3.OperationalError:
            pass  # column already exists

    # Seed once if the users table is empty
    if not conn.execute('SELECT 1 FROM users LIMIT 1').fetchone():
        seed = _seed_users()
        for u in seed:
            conn.execute(
                'INSERT INTO users VALUES (?,?,?,?,?,?,?,?)',
                (u['id'], u['username'], generate_password_hash(u['password']),
                 u['name'], u['icon'], u['color'], u['color_rgb'], u['lang'])
            )
        conn.commit()
        print('  Database seeded — save these passwords:')
        for u in seed:
            print(f"    {u['username']:12s}  {u['password']}")

    conn.close()
    purge_old_calendar()


def purge_old_calendar():
    """Delete calendar entries older than 30 days."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat()
    conn = sqlite3.connect(DB_PATH)
    deleted = conn.execute('DELETE FROM calendar WHERE date < ?', (cutoff,)).rowcount
    conn.commit()
    conn.close()
    if deleted:
        print(f'  Purged {deleted} calendar row(s) older than {cutoff}.')


def _purge_scheduler():
    """Background thread: purge every 24 hours."""
    while True:
        threading.Event().wait(timeout=86400)  # sleep 24 h
        purge_old_calendar()


# ── Auth helpers ──────────────────────────────────────────────────────────────
def user_to_dict(row):
    return {
        'id':       row['id'],
        'name':     row['name'],
        'icon':     row['icon'],
        'color':    row['color'],
        'colorRgb': row['color_rgb'],
        'lang':     row['lang'],
        'email':    row['email'] or '',
    }

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        token = auth[7:]
        db    = get_db()
        row   = db.execute(
            'SELECT user_id, expires_at FROM sessions WHERE token = ?', (token,)
        ).fetchone()
        if not row:
            return jsonify({'error': 'Invalid token'}), 401
        if datetime.fromisoformat(row['expires_at']) < datetime.now(timezone.utc).replace(tzinfo=None):
            db.execute('DELETE FROM sessions WHERE token = ?', (token,))
            db.commit()
            return jsonify({'error': 'Session expired'}), 401
        g.user_id = row['user_id']
        g.token   = token
        return f(*args, **kwargs)
    return wrapper


# ── API – authentication ──────────────────────────────────────────────────────
@app.post('/api/auth/login')
def auth_login():
    body     = request.get_json(silent=True) or {}
    username = (body.get('username') or '').strip().lower()
    password =  body.get('password') or ''

    db  = get_db()
    row = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if not row or not check_password_hash(row['password_hash'], password):
        return jsonify({'error': 'Invalid username or password'}), 401

    token      = secrets.token_hex(32)
    expires_at = (datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=SESSION_DAYS)).isoformat()
    db.execute(
        'INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)',
        (token, row['id'], expires_at)
    )
    db.commit()
    return jsonify({'token': token, 'user': user_to_dict(row)})


@app.post('/api/auth/logout')
@require_auth
def auth_logout():
    db = get_db()
    db.execute('DELETE FROM sessions WHERE token = ?', (g.token,))
    db.commit()
    return jsonify({'ok': True})


@app.get('/api/auth/me')
@require_auth
def auth_me():
    row = get_db().execute('SELECT * FROM users WHERE id = ?', (g.user_id,)).fetchone()
    return jsonify(user_to_dict(row)) if row else ('', 404)


# ── API – users ───────────────────────────────────────────────────────────────
@app.get('/api/users/public')
def list_users_public():
    """Return only display names for the login screen — no usernames, IDs, or icons."""
    rows = get_db().execute('SELECT name FROM users ORDER BY rowid LIMIT 2').fetchall()
    return jsonify([r['name'] for r in rows])


@app.get('/api/users')
@require_auth
def list_users():
    rows = get_db().execute('SELECT * FROM users ORDER BY rowid').fetchall()
    return jsonify([user_to_dict(r) for r in rows])


@app.patch('/api/users/me')
@require_auth
def update_profile():
    body = request.get_json(silent=True) or {}
    db   = get_db()
    row  = db.execute('SELECT * FROM users WHERE id = ?', (g.user_id,)).fetchone()
    if not row:
        return jsonify({'error': 'User not found'}), 404

    updates = {}

    # ── Email ────────────────────────────────────────────────────────────────
    new_email = body.get('email')
    if new_email is not None:
        new_email = new_email.strip()
        if new_email and '@' not in new_email:
            return jsonify({'error': 'Invalid email address'}), 400
        updates['email'] = new_email or None

    # ── Language ─────────────────────────────────────────────────────────────
    new_lang = body.get('lang')
    if new_lang is not None:
        if new_lang not in ('en', 'fr'):
            return jsonify({'error': "lang must be 'en' or 'fr'"}), 400
        updates['lang'] = new_lang

    # ── Password ──────────────────────────────────────────────────────────────
    new_pwd     = body.get('newPassword')
    current_pwd = body.get('currentPassword')
    if new_pwd is not None:
        if not current_pwd:
            return jsonify({'error': 'currentPassword is required'}), 400
        if not check_password_hash(row['password_hash'], current_pwd):
            return jsonify({'error': 'Current password is incorrect'}), 403
        if len(new_pwd) < 4:
            return jsonify({'error': 'New password must be at least 4 characters'}), 400
        updates['password_hash'] = generate_password_hash(new_pwd)

    if not updates:
        return jsonify({'error': 'Nothing to update'}), 400

    set_clause = ', '.join(f'{k} = ?' for k in updates)
    db.execute(f'UPDATE users SET {set_clause} WHERE id = ?', [*updates.values(), g.user_id])
    db.commit()

    updated = db.execute('SELECT * FROM users WHERE id = ?', (g.user_id,)).fetchone()
    return jsonify(user_to_dict(updated))


# ── API – calendar ────────────────────────────────────────────────────────────
@app.get('/api/calendar')
@require_auth
def get_calendar():
    try:
        monday = date_type.fromisoformat(request.args.get('monday', ''))
    except ValueError:
        return jsonify({'error': 'monday parameter must be YYYY-MM-DD'}), 400

    dates = [(monday + timedelta(days=i)).isoformat() for i in range(5)]
    rows  = get_db().execute(
        f"SELECT date, user_id, status FROM calendar "
        f"WHERE date IN ({','.join('?'*5)})",
        dates
    ).fetchall()

    result = {d: {} for d in dates}
    for row in rows:
        result[row['date']][row['user_id']] = row['status']

    return jsonify(result)


@app.put('/api/calendar/<string:cal_date>/<string:user_id>')
@require_auth
def set_status(cal_date, user_id):
    if user_id != g.user_id:
        return jsonify({'error': 'Forbidden'}), 403

    body   = request.get_json(silent=True) or {}
    status = body.get('status')

    if status not in ('home', 'travelling', None):
        return jsonify({'error': "status must be 'home', 'travelling', or null"}), 400

    db = get_db()
    if status is None:
        db.execute(
            'DELETE FROM calendar WHERE date = ? AND user_id = ?',
            (cal_date, user_id)
        )
    else:
        db.execute(
            'INSERT INTO calendar (date, user_id, status) VALUES (?,?,?) '
            'ON CONFLICT(date, user_id) DO UPDATE SET status = excluded.status',
            (cal_date, user_id, status)
        )
    db.commit()

    # Notify other users already home on the same day
    if status == 'home':
        me = db.execute('SELECT name FROM users WHERE id = ?', (user_id,)).fetchone()
        others = db.execute(
            "SELECT u.name, u.email, u.lang FROM calendar c "
            "JOIN users u ON c.user_id = u.id "
            "WHERE c.date = ? AND c.user_id != ? AND c.status = 'home'",
            (cal_date, user_id)
        ).fetchall()
        if me and others:
            for other in others:
                if other['email']:
                    threading.Thread(
                        target=_send_conflict_email,
                        args=(other['email'], other['lang'], me['name'], cal_date),
                        daemon=True
                    ).start()

    return jsonify({'date': cal_date, 'user_id': user_id, 'status': status})


# ── Static files ──────────────────────────────────────────────────────────────
_BLOCKED = ('.py', '.db', '.db-wal', '.db-shm', '.env', '.git')

@app.get('/')
def root():
    return send_from_directory(BASE_DIR, 'index.html')

@app.get('/<path:path>')
def serve_static(path):
    if any(path.endswith(ext) for ext in _BLOCKED) or path.startswith('.'):
        return '', 404
    return send_from_directory(BASE_DIR, path)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    t = threading.Thread(target=_purge_scheduler, daemon=True)
    t.start()
    print(f'\n  WFH Planner  →  http://localhost:{PORT}\n')
    app.run(host=HOST, port=PORT, debug=DEBUG)
