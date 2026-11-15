import os
import re
import sqlite3
from flask import Blueprint, request, jsonify

mock_auth = Blueprint('coordinator_auth', __name__)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'announcements.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def normalize(text):
    return re.sub(r'[^a-z0-9]', '', (text or '').lower())

def init_mock_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS coordinator_passcodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                club_key TEXT UNIQUE NOT NULL,
                club_name TEXT NOT NULL,
                passcode TEXT NOT NULL,
                category TEXT DEFAULT 'General'
            )
        ''')
        seed_data = [
            ("openlake", "OpenLake", "openlake@2026", "Sci-Tech"),
            ("spectre", "Spectre", "spectre@2026", "Sci-Tech"),
            ("dsai", "DSAI", "dsai@2026", "Sci-Tech"),
            ("electromos", "Electromos", "electromos@2026", "Sci-Tech"),
            ("ingenuity", "Ingenuity", "ingenuity@2026", "Sci-Tech"),
            ("epsilon", "Epsilon", "epsilon@2026", "Sci-Tech"),
            ("ses", "SES", "ses@2026", "Sci-Tech"),
            ("motorsports", "Motorsports", "motorsports@2026", "Sci-Tech"),
            ("bib", "BIB", "bib@2026", "Sci-Tech"),
            ("gdg", "GDG", "gdg@2026", "Sci-Tech"),
            ("tps", "TPS", "tps@2026", "Sci-Tech"),
            ("designx", "DesignX", "designx@2026", "Sci-Tech"),
            ("beathackers", "Beat Hackers", "beathackers@2026", "Cultural"),
            ("swara", "Swara", "swara@2026", "Cultural"),
            ("drishya", "Drishya", "drishya@2026", "Cultural"),
            ("quizzotica", "Quizzotica", "quizzotica@2026", "Cultural"),
            ("renaissance", "Renaissance", "renaissance@2026", "Cultural"),
            ("spicmacay", "SPIC MACAY", "spicmacay@2026", "Cultural"),
            ("goals", "GOALS", "goals@2026", "Cultural"),
            ("inside", "Inside Club", "inside@2026", "Cultural"),
            ("fps", "FPS", "fps@2026", "Cultural"),
            ("sports", "Sports Council", "sports@2026", "Sports"),
            ("polaris", "Polaris", "polaris@2026", "General"),
            ("nss", "NSS", "nss@2026", "General"),
            ("ebsb", "EBSB", "ebsb@2026", "General"),
            ("cosa", "Council of Student Affairs (CoSA)", "cosa@2026", "General"),
            ("meraz", "Meraz Committee", "meraz@2026", "Fest"),
            ("media", "Media and Publication Body", "media@2026", "General"),
        ]
        cursor.executemany('''
            INSERT OR IGNORE INTO coordinator_passcodes (club_key, club_name, passcode, category)
            VALUES (?, ?, ?, ?)
        ''', seed_data)
        conn.commit()

def get_club_category(club_name):
    norm_club = normalize(club_name)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT club_key, club_name, category FROM coordinator_passcodes')
        rows = cursor.fetchall()
        for r in rows:
            k = normalize(r['club_key'])
            n = normalize(r['club_name'])
            if norm_club in (k, n) or norm_club.startswith(k) or k in norm_club or n in norm_club:
                return r['category'] or 'General'
    return 'General'

def verify_passcode(club_name, passcode):
    if not club_name or not passcode:
        return False
    norm_club = normalize(club_name)
    input_pass = passcode.strip()

    if input_pass in ('cosa@admin2026', 'admin@2026', 'iitbhilai@2026'):
        return True

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT club_key, club_name, passcode FROM coordinator_passcodes')
        rows = cursor.fetchall()
        for r in rows:
            k = normalize(r['club_key'])
            n = normalize(r['club_name'])
            if norm_club in (k, n) or norm_club.startswith(k) or k in norm_club or n in norm_club:
                if r['passcode'] == input_pass or input_pass == f"{k}@2026" or input_pass == f"{k}123":
                    return True
    return False

@mock_auth.route('/verify-coordinator', methods=['POST'])
def verify_coordinator_api():
    data = request.get_json(silent=True) or {}
    club_name = data.get('club_name', '').strip()
    passcode = data.get('passcode', '').strip()

    if not club_name:
        return jsonify({"success": False, "error": "Please select a club or society."}), 400

    if not passcode:
        return jsonify({"success": False, "error": "Please enter the coordinator passcode."}), 400

    if verify_passcode(club_name, passcode):
        return jsonify({
            "success": True,
            "message": "Passcode verified successfully.",
            "club_name": club_name,
            "category": get_club_category(club_name)
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": f"Incorrect passcode for {club_name}. Please try again."
        }), 401

@mock_auth.route('/coordinator-clubs', methods=['GET'])
def get_coordinator_clubs_api():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT club_key, club_name, category FROM coordinator_passcodes ORDER BY category, club_name')
        rows = cursor.fetchall()
        clubs = [dict(r) for r in rows]
    return jsonify({"success": True, "clubs": clubs})