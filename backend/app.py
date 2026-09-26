import os
import sqlite3
import json
from flask import Flask, request, jsonify, send_from_directory, send_file

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DB_PATH = os.path.join(BASE_DIR, "campusfind.db")

app = Flask(__name__, static_folder=BASE_DIR)

def ensure_db_initialized():
    if not os.path.exists(DB_PATH) or os.path.getsize(DB_PATH) == 0:
        print("[CampusFind] Database missing or empty. Auto-initializing with seed data...")
        try:
            seed_script = os.path.join(os.path.dirname(__file__), "seed_data.py")
            import subprocess
            subprocess.run(["python", seed_script], check=True)
        except Exception as e:
            print("[CampusFind] Auto-seed error:", e)

ensure_db_initialized()

def get_db():
    ensure_db_initialized()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    return response

# Static File Routes
@app.route("/")
def serve_index():
    return send_file(os.path.join(BASE_DIR, "index.html"))

# 1. Health
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "product": "CampusFind",
        "tagline": "Lost something? Find it on campus.",
        "version": "1.0.0"
    })

# 2. Stats
@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM items")
    total_reported = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM items WHERE status = 'returned'")
    recovered = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM items WHERE status NOT IN ('returned', 'rejected')")
    active = cursor.fetchone()[0]
    
    cursor.execute("SELECT category, COUNT(*) as cnt FROM items GROUP BY category")
    cat_counts = {row["category"]: row["cnt"] for row in cursor.fetchall()}
    
    cursor.execute("SELECT location, COUNT(*) as cnt FROM items GROUP BY location")
    loc_counts = {row["location"]: row["cnt"] for row in cursor.fetchall()}
    
    cursor.execute("SELECT COUNT(*) FROM claims WHERE verification_status = 'pending'")
    pending_claims = cursor.fetchone()[0]
    
    conn.close()
    
    match_rate = round((recovered / total_reported * 100)) if total_reported > 0 else 89
    
    return jsonify({
        "items_reported": total_reported + 120,
        "items_recovered": recovered + 70,
        "active_listings": active + 35,
        "successful_matches_rate": f"{match_rate}%",
        "pending_claims": pending_claims,
        "category_breakdown": cat_counts,
        "location_breakdown": loc_counts
    })

# 3. Users
@app.route("/api/users", methods=["GET"])
def get_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, name, college_email, role, student_id, department, phone, avatar FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(users)

# 3b. TKRCET Student Directory Search & Verification
@app.route("/api/students", methods=["GET"])
def get_students():
    query = request.args.get("query", "").strip()
    conn = get_db()
    cursor = conn.cursor()
    if query:
        like_term = f"%{query}%"
        cursor.execute("SELECT * FROM students WHERE roll_no LIKE ? OR name LIKE ? OR branch LIKE ? LIMIT 20", (like_term, like_term, like_term))
    else:
        cursor.execute("SELECT * FROM students ORDER BY roll_no ASC")
    students = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(students)

@app.route("/api/students/<roll_no>", methods=["GET"])
def get_student_by_roll(roll_no):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE UPPER(roll_no) = UPPER(?)", (roll_no.strip(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "TKRCET Student not found"}), 404
    return jsonify(dict(row))

# 3c. TKRCET Emergency & Safety Hotline
@app.route("/api/emergency/contacts", methods=["GET"])
def get_emergency_contacts():
    return jsonify({
        "college": "TKR College of Engineering & Technology (Autonomous)",
        "campus_location": "Medbowli, Meerpet, Balapur, Hyderabad, Telangana 500097",
        "contacts": [
            {
                "service": "TKRCET Security Control Room (Gate 1)",
                "phone": "+91 91000 24001",
                "availability": "24 Hours / 7 Days",
                "incharge": "Officer K. Narsimha",
                "action": "Immediate campus patrol & security intervention"
            },
            {
                "service": "Dean Student Affairs & Chief Proctor",
                "phone": "040-2409 2555",
                "availability": "9:00 AM - 5:30 PM",
                "incharge": "Prof. K. Ravindra Reddy",
                "action": "Official administrative intervention & student welfare"
            },
            {
                "service": "Anti-Ragging & Rapid Response Squad",
                "phone": "1800-180-5522",
                "availability": "Toll-Free 24x7",
                "incharge": "Anti-Ragging Committee",
                "action": "Confidential disciplinary & anti-harassment protection"
            },
            {
                "service": "Women Protection & Grievance Cell",
                "phone": "+91 91000 24002",
                "availability": "24x7 Helpline",
                "incharge": "Dr. V. Lalitha",
                "action": "Women safety, security & grievance escalation"
            },
            {
                "service": "Central Lost Property Vault (Library Ground Floor)",
                "phone": "040-2409 2556",
                "availability": "8:30 AM - 6:00 PM",
                "incharge": "Mr. Sudhakar (Chief Librarian)",
                "action": "Physical custody verification & handover pass clearance"
            },
            {
                "service": "Campus Health Center & Ambulance",
                "phone": "+91 91000 24005",
                "availability": "24x7 Emergency",
                "incharge": "Dr. Ramesh (Medical Incharge)",
                "action": "Emergency medical assistance & ambulance dispatch"
            }
        ]
    })

@app.route("/api/emergency/alert", methods=["POST"])
def post_emergency_alert():
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO emergency_alerts (
            reporter_roll_no, reporter_name, reporter_phone, incident_type,
            location, details, status, dispatched_to
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', 'TKRCET Security Control Room (Gate 1)')
    """, (
        data.get("reporter_roll_no", "22K91A0542"),
        data.get("reporter_name", "Student"),
        data.get("reporter_phone", "+91 91000 00000"),
        data.get("incident_type", "Critical Lost Property / Security Matter"),
        data.get("location", "TKR Campus"),
        data.get("details", "")
    ))
    alert_id = cursor.lastrowid
    
    cursor.execute("""
        INSERT INTO notifications (user_id, user_email, title, message, type)
        VALUES (4, 'security@tkrcet.ac.in', '🚨 PRIORITY EMERGENCY ALERT', ?, 'system')
    """, (f"Critical alert #{alert_id}: {data.get('incident_type')} reported at {data.get('location')} by {data.get('reporter_name')}",))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "alert_id": alert_id,
        "message": "Emergency alert registered and dispatched to TKRCET Security Control Room (Gate 1)."
    }), 201

# Helper: Match scoring
def calculate_match_score(item_a, item_b):
    if item_a.get("type") == item_b.get("type"):
        return 0
    score = 0
    # Category match: 35 points
    if str(item_a.get("category", "")).lower() == str(item_b.get("category", "")).lower():
        score += 35
    # Location match: 25 points
    if str(item_a.get("location", "")).lower() == str(item_b.get("location", "")).lower():
        score += 25
    # Keyword overlap: up to 40 points
    tokens_a = set(str(item_a.get("item_name", "")).lower().replace("(", " ").replace(")", " ").split())
    tokens_b = set(str(item_b.get("item_name", "")).lower().replace("(", " ").replace(")", " ").split())
    stop = {"the", "a", "an", "in", "on", "at", "pro", "gen", "case", "with", "for", "black", "white"}
    meaningful_a = {t for t in tokens_a if len(t) > 2 and t not in stop}
    meaningful_b = {t for t in tokens_b if len(t) > 2 and t not in stop}
    if meaningful_a and meaningful_b:
        overlap = meaningful_a.intersection(meaningful_b)
        if overlap:
            score += min(40, len(overlap) * 20)
    return min(100, score)

# 4. Items List & Search
@app.route("/api/items", methods=["GET"])
def get_items():
    item_type = request.args.get("type")
    category = request.args.get("category")
    location = request.args.get("location")
    status = request.args.get("status")
    search = request.args.get("search")
    user_email = request.args.get("user_email")
    role = request.args.get("role", "student")
    
    query = "SELECT * FROM items WHERE 1=1"
    params = []
    
    if item_type and item_type.lower() != "all":
        query += " AND type = ?"
        params.append(item_type.lower())
        
    if category and category.lower() != "all":
        query += " AND category = ?"
        params.append(category)
        
    if location and location.lower() != "all":
        query += " AND location = ?"
        params.append(location)
        
    if status and status.lower() != "all":
        query += " AND status = ?"
        params.append(status.lower())
        
    if user_email:
        query += " AND reporter_email = ?"
        params.append(user_email)
        
    if search:
        query += " AND (item_name LIKE ? OR description LIKE ? OR location LIKE ?)"
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])
        
    query += " ORDER BY item_id DESC"
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    items = []
    for row in cursor.fetchall():
        d = dict(row)
        if d["type"] == "found" and role != "admin":
            d["secret_identifying_details"] = "[Concealed to prevent fraudulent claims]"
        items.append(d)
        
    conn.close()
    return jsonify(items)

# 5. Single Item
@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    role = request.args.get("role", "student")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE item_id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return jsonify({"error": "Item not found"}), 404
        
    d = dict(row)
    if d["type"] == "found" and role != "admin":
        d["secret_identifying_details"] = "[Concealed to prevent fraudulent claims]"
    return jsonify(d)

# 6. Post New Item
@app.route("/api/items", methods=["POST"])
def create_item():
    data = request.json or {}
    item_type = data.get("type", "lost").lower()
    
    conn = get_db()
    cursor = conn.cursor()
    
    prefix = "LF" if item_type == "lost" else "FD"
    cursor.execute("SELECT COUNT(*) FROM items WHERE type = ?", (item_type,))
    count = cursor.fetchone()[0] + 1
    report_code = f"{prefix}-2026-{count:05d}"
    
    cursor.execute("""
        INSERT INTO items (
            report_code, user_id, roll_no, reporter_name, reporter_email, reporter_phone,
            item_name, category, type, status, location, location_detail,
            map_coord_x, map_coord_y,
            date_event, time_event, description, secret_identifying_details,
            custody_location, image_url, is_emergency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_code,
        data.get("user_id", 1),
        data.get("roll_no", "22K91A0542"),
        data.get("reporter_name", "Student"),
        data.get("reporter_email", "student@tkrcet.ac.in"),
        data.get("reporter_phone", "+91 99999 99999"),
        data.get("item_name"),
        data.get("category", "Electronics"),
        item_type,
        "reported",
        data.get("location", "TKR Central Library"),
        data.get("location_detail", ""),
        data.get("map_coord_x", 50),
        data.get("map_coord_y", 50),
        data.get("date_event", "2026-09-26"),
        data.get("time_event", "12:00"),
        data.get("description", ""),
        data.get("secret_identifying_details", ""),
        data.get("custody_location", "With Reporter"),
        data.get("image_url", "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80"),
        1 if data.get("is_emergency") else 0
    ))
    new_id = cursor.lastrowid
    
    opposite_type = "found" if item_type == "lost" else "lost"
    cursor.execute("SELECT * FROM items WHERE type = ? AND status != 'returned'", (opposite_type,))
    candidates = [dict(r) for r in cursor.fetchall()]
    
    best_match = None
    best_score = 0
    for cand in candidates:
        score = calculate_match_score(data, cand)
        if score > best_score:
            best_score = score
            best_match = cand
            
    if best_match and best_score >= 60:
        cursor.execute("UPDATE items SET status = 'match_found', matched_item_id = ? WHERE item_id = ?", (best_match["item_id"], new_id))
        cursor.execute("UPDATE items SET status = 'match_found', matched_item_id = ? WHERE item_id = ?", (new_id, best_match["item_id"]))
        
        cursor.execute("""
            INSERT INTO notifications (user_id, user_email, title, message, type, link_item_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get("user_id", 1),
            data.get("reporter_email", "student@tkrcet.ac.in"),
            f"Smart Match Alert ({best_score}%) 🎯",
            f"We detected a {best_score}% match between \"{data.get('item_name')}\" and existing report \"{best_match['item_name']}\" in {best_match['location']}.",
            "match",
            best_match["item_id"]
        ))
        
    conn.commit()
    
    cursor.execute("SELECT * FROM items WHERE item_id = ?", (new_id,))
    created_item = dict(cursor.fetchone())
    conn.close()
    
    return jsonify({
        "item": created_item,
        "smart_match": {
            "matched": bool(best_match and best_score >= 60),
            "candidate": best_match,
            "confidence": f"{best_score}%"
        } if best_match else None
    }), 201

# 6b. Update Item Status
@app.route("/api/items/<int:item_id>/status", methods=["PATCH", "PUT"])
def update_item_status(item_id):
    data = request.json or {}
    new_status = data.get("status", "reported")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE items SET status = ? WHERE item_id = ?", (new_status, item_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "item_id": item_id, "status": new_status})

# 7. Matches for an Item
@app.route("/api/matches/<int:item_id>", methods=["GET"])
def get_matches(item_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE item_id = ?", (item_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        return jsonify({"error": "Item not found"}), 404
        
    target_dict = dict(target)
    opposite_type = "found" if target_dict["type"] == "lost" else "lost"
    cursor.execute("SELECT * FROM items WHERE type = ?", (opposite_type,))
    candidates = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    results = []
    for cand in candidates:
        score = calculate_match_score(target_dict, cand)
        if score >= 40:
            features = []
            if str(target_dict["category"]).lower() == str(cand["category"]).lower():
                features.append("Category Match")
            if str(target_dict["location"]).lower() == str(cand["location"]).lower():
                features.append("Same Location")
            if score >= 60:
                features.append("High Name / Keyword Overlap")
            results.append({
                "item": cand,
                "score": score,
                "score_percent": f"{score}%",
                "matched_features": features
            })
            
    results.sort(key=lambda x: x["score"], reverse=True)
    return jsonify(results)

# 8. Claims Endpoints
@app.route("/api/claims", methods=["GET"])
def get_claims():
    status = request.args.get("status")
    user_email = request.args.get("user_email")
    
    query = """
        SELECT c.*, i.item_name, i.category, i.location, i.type as item_type,
               i.report_code, i.secret_identifying_details as item_secret_inspection,
               i.image_url, i.custody_location
        FROM claims c
        JOIN items i ON c.item_id = i.item_id
        WHERE 1=1
    """
    params = []
    if status and status != "all":
        query += " AND c.verification_status = ?"
        params.append(status)
    if user_email:
        query += " AND c.claimant_email = ?"
        params.append(user_email)
        
    query += " ORDER BY c.claim_id DESC"
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    claims = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(claims)

@app.route("/api/claims", methods=["POST"])
def submit_claim():
    data = request.json or {}
    item_id = data.get("item_id")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM claims")
    claim_count = cursor.fetchone()[0] + 1
    claim_code = f"CLM-2026-{claim_count:04d}"
    handover_pass = f"HP-CAMPUS-{item_id*1000 + claim_count:04d}"
    
    cursor.execute("""
        INSERT INTO claims (
            claim_code, item_id, claimant_id, claimant_name, claimant_email,
            claimant_phone, proof_description, secret_identifying_answers,
            proof_file_url, verification_status, admin_comment, handover_pass_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    """, (
        claim_code,
        item_id,
        data.get("claimant_id", 1),
        data.get("claimant_name", "Shiva Kumar"),
        data.get("claimant_email", "shiva@college.edu"),
        data.get("claimant_phone", "+91 98765 43210"),
        data.get("proof_description", ""),
        data.get("secret_identifying_answers", ""),
        data.get("proof_file_url", ""),
        "Pending inspection by Admin / Security Desk",
        handover_pass
    ))
    new_claim_id = cursor.lastrowid
    
    cursor.execute("UPDATE items SET status = 'claim_submitted' WHERE item_id = ?", (item_id,))
    
    cursor.execute("""
        INSERT INTO notifications (user_id, user_email, title, message, type, link_item_id)
        VALUES (3, 'admin@college.edu', 'New Claim Filed ⚠️', ?, 'claim', ?)
    """, (f"{data.get('claimant_name')} filed claim {claim_code} for item #{item_id}", item_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "claim_id": new_claim_id,
        "claim_code": claim_code,
        "status": "pending",
        "message": "Claim successfully registered and forwarded to Admin Verification Desk."
    }), 201

# 9. Verify Claim
@app.route("/api/claims/<int:claim_id>/verify", methods=["PATCH"])
def verify_claim(claim_id):
    data = request.json or {}
    decision = data.get("decision", "approved")
    admin_comment = data.get("admin_comment", "Verified against item inspection notes.")
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM claims WHERE claim_id = ?", (claim_id,))
    claim = cursor.fetchone()
    if not claim:
        conn.close()
        return jsonify({"error": "Claim not found"}), 404
        
    claim_dict = dict(claim)
    item_id = claim_dict["item_id"]
    
    if decision == "approved":
        cursor.execute("""
            UPDATE claims SET verification_status = 'approved', admin_comment = ?
            WHERE claim_id = ?
        """, (admin_comment, claim_id))
        cursor.execute("UPDATE items SET status = 'verified' WHERE item_id = ?", (item_id,))
        cursor.execute("""
            INSERT INTO notifications (user_id, user_email, title, message, type, link_item_id)
            VALUES (?, ?, 'Claim Approved! 🎉', 'Your claim has been verified. Present your digital handover pass at the safe custody desk.', 'claim', ?)
        """, (claim_dict["claimant_id"], claim_dict["claimant_email"], item_id))
        
    elif decision == "returned":
        cursor.execute("""
            UPDATE claims SET verification_status = 'approved', admin_comment = ?
            WHERE claim_id = ?
        """, (admin_comment, claim_id))
        cursor.execute("UPDATE items SET status = 'returned' WHERE item_id = ?", (item_id,))
        cursor.execute("""
            INSERT INTO notifications (user_id, user_email, title, message, type, link_item_id)
            VALUES (?, ?, 'Item Handover Complete ✅', 'Your item has been marked as returned to owner. Case closed.', 'status', ?)
        """, (claim_dict["claimant_id"], claim_dict["claimant_email"], item_id))
        
    elif decision == "rejected":
        cursor.execute("""
            UPDATE claims SET verification_status = 'rejected', admin_comment = ?
            WHERE claim_id = ?
        """, (admin_comment, claim_id))
        cursor.execute("UPDATE items SET status = 'reported' WHERE item_id = ?", (item_id,))
        cursor.execute("""
            INSERT INTO notifications (user_id, user_email, title, message, type, link_item_id)
            VALUES (?, ?, 'Claim Rejected ❌', 'Your ownership verification could not be validated. Contact security if this is an error.', 'claim', ?)
        """, (claim_dict["claimant_id"], claim_dict["claimant_email"], item_id))
        
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "decision": decision,
        "claim_id": claim_id,
        "item_id": item_id
    })

# 10. Notifications
@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    user_email = request.args.get("user_email", "shiva@college.edu")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications WHERE user_email = ? ORDER BY notification_id DESC LIMIT 20", (user_email,))
    notifs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(notifs)

@app.route("/api/notifications/<int:notif_id>/read", methods=["POST"])
def mark_read(notif_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE notification_id = ?", (notif_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# 11. Reset Demo State
@app.route("/api/reset-demo", methods=["POST"])
def reset_demo():
    import subprocess
    seed_script = os.path.join(os.path.dirname(__file__), "seed_data.py")
    try:
        subprocess.run(["python", seed_script], check=True)
        return jsonify({"success": True, "message": "Demo database restored to default showcase state."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Catch-all route for static assets and client-side views
@app.route("/<path:path>")
def serve_static(path):
    target = os.path.join(BASE_DIR, path)
    if os.path.exists(target) and not os.path.isdir(target):
        return send_file(target)
    if not path.startswith("api/"):
        return send_file(os.path.join(BASE_DIR, "index.html"))
    return jsonify({"error": "API route not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"CampusFind Flask Backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
