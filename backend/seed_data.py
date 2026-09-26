# TKRCET CampusFind Seed Data Script
# TKR College of Engineering & Technology, Hyderabad
import sqlite3
import os

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
db_path = os.path.join(BASE_DIR, "campusfind.db")
if os.path.exists(db_path):
    try:
        os.remove(db_path)
    except Exception as e:
        print('DB remove warning:', e)

schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
with open(schema_path, 'r', encoding='utf-8') as f:
    schema = f.read()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.executescript(schema)

# 1. TKRCET Official Student Directory
students = [
    ('22K91A0542', 'Shiva Kumar', 'Computer Science & Engineering (CSE)', 'B.Tech III Year I Sem', 'A', 'shiva.22cse@tkrcet.ac.in', '+91 98765 43210', '+91 98480 11223', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'),
    ('23K91A0415', 'Priya Sharma', 'Electronics & Communication (ECE)', 'B.Tech II Year I Sem', 'B', 'priya.23ece@tkrcet.ac.in', '+91 98765 87654', '+91 98480 22334', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'),
    ('22K91A6620', 'Rahul Varma', 'AI & Machine Learning (CSM)', 'B.Tech III Year I Sem', 'A', 'rahul.22csm@tkrcet.ac.in', '+91 98765 11223', '+91 98480 33445', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80'),
    ('21K91A1208', 'Sneha Reddy', 'Information Technology (IT)', 'B.Tech IV Year I Sem', 'A', 'sneha.21it@tkrcet.ac.in', '+91 98765 99887', '+91 98480 44556', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'),
    ('22K91A0214', 'Aditya Goud', 'Electrical & Electronics (EEE)', 'B.Tech III Year I Sem', 'B', 'aditya.22eee@tkrcet.ac.in', '+91 98765 77665', '+91 98480 55667', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'),
    ('23K91A0305', 'Vikram Singh', 'Mechanical Engineering', 'B.Tech II Year I Sem', 'A', 'vikram.23mech@tkrcet.ac.in', '+91 98765 33445', '+91 98480 66778', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'),
    ('23K91A0112', 'Ananya Rao', 'Civil Engineering', 'B.Tech II Year I Sem', 'A', 'ananya.23civil@tkrcet.ac.in', '+91 98765 55667', '+91 98480 77889', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80')
]
cursor.executemany('''
    INSERT INTO students (roll_no, name, branch, year_sem, section, college_email, phone, parent_phone, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
''', students)

# 2. Users
users = [
    ('22K91A0542', 'Shiva Kumar', 'shiva.22cse@tkrcet.ac.in', 'student_pass', 'student', 'Computer Science & Engineering', '+91 98765 43210', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'),
    ('23K91A0415', 'Priya Sharma', 'priya.23ece@tkrcet.ac.in', 'student_pass', 'student', 'Electronics & Communication', '+91 98765 87654', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'),
    ('EMP-TKR-01', 'Prof. K. Ravindra Reddy', 'proctor@tkrcet.ac.in', 'admin_pass', 'admin', 'Dean Student Affairs & Chief Proctor', '040-2409 2555', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'),
    ('SEC-TKR-09', 'Officer K. Narsimha', 'security@tkrcet.ac.in', 'security_pass', 'admin', 'Chief Security Office (Gate 1)', '+91 91000 24001', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80')
]
cursor.executemany('''
    INSERT INTO users (roll_no, name, college_email, password_hash, role, department, phone, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', users)

# 3. TKRCET Geotagged Items
items = [
    (
        'LF-2026-00421', 1, '22K91A0542', 'Shiva Kumar', 'shiva.22cse@tkrcet.ac.in', '+91 98765 43210',
        'Apple AirPods Pro (2nd Gen)', 'Electronics', 'lost', 'reported',
        'TKR Central Library', '2nd Floor Quiet Study Zone, Desk #14 near East Window',
        28, 38,
        '2026-09-24', '14:30',
        'White Apple AirPods Pro 2nd Gen case. Left in study carrel during afternoon study session.',
        'Case has tiny crescent scratch near charging port. Inside lid says A2698 with blue sticker on right pod stem.',
        'With Reporter',
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
        0, None
    ),
    (
        'FD-2026-00892', 2, '23K91A0415', 'Priya Sharma', 'priya.23ece@tkrcet.ac.in', '+91 98765 87654',
        'Apple AirPods Pro Wireless Case', 'Electronics', 'found', 'reported',
        'TKR Central Library', '2nd Floor Reading Table 14',
        28, 38,
        '2026-09-24', '16:00',
        'White wireless earbuds case found sitting on Table 14 after library quiet hours.',
        'Has tiny crescent scratch on bottom near Lightning/USB-C port and blue marking on right pod stem.',
        'TKR Central Library Helpdesk (Librarian Mr. Sudhakar)',
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80',
        0, None
    ),
    (
        'LF-2026-00418', 1, '22K91A0542', 'Shiva Kumar', 'shiva.22cse@tkrcet.ac.in', '+91 98765 43210',
        'Dell 65W USB-C Laptop Charger', 'Electronics', 'lost', 'reported',
        'CSE & IT Tech Block', 'Lab 4, 3rd Floor workstation near projector',
        45, 25,
        '2026-09-23', '11:15',
        'Black Dell oval USB Type-C adapter with Indian 3-pin power cord. Wrapped with velcro strap.',
        'Has red insulation tape wrapped around the joint near the connector pin.',
        'With Reporter',
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
        0, None
    ),
    (
        'FD-2026-00885', 2, '23K91A0415', 'Priya Sharma', 'priya.23ece@tkrcet.ac.in', '+91 98765 87654',
        'Casio FX-991EX Scientific Calculator', 'Electronics', 'found', 'returned',
        'Main Academic Block A', 'Room 204 Physics Lecture Hall',
        52, 60,
        '2026-09-21', '13:00',
        'Casio ClassWiz scientific calculator with black sliding cover.',
        'Engraved initials AG (Aditya Goud) on back battery cover with metallic pen.',
        'Handed over to Aditya Goud (22K91A0214)',
        'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
        0, None
    ),
    (
        'FD-2026-00887', 4, 'SEC-TKR-09', 'Officer K. Narsimha', 'security@tkrcet.ac.in', '+91 91000 24001',
        'Navy Blue Skybags Backpack', 'Bags', 'found', 'reported',
        'TKR Student Canteen', 'Outdoor seating bench under neem tree',
        72, 70,
        '2026-09-25', '13:45',
        'Water-resistant backpack containing 2 spiral notebooks and an empty Milton stainless flask.',
        'Keychain of Marvel Iron Man helmet attached to front secondary zipper.',
        'Gate 1 Security Cabin (Safe Locker #04)',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
        0, None
    ),
    (
        'LF-2026-00415', 2, '23K91A0415', 'Priya Sharma', 'priya.23ece@tkrcet.ac.in', '+91 98765 87654',
        'TKRCET College ID & Bus Pass SmartCard', 'ID/Cards', 'lost', 'reported',
        'TKR Student Canteen', 'Juice counter billing line',
        74, 72,
        '2026-09-25', '17:30',
        'Blue neck lanyard with TKRCET university emblem holding ID badge for ECE Dept.',
        'Roll No: 23K91A0415, Blood Group B+ on the card.',
        'With Reporter',
        'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80',
        1, None
    ),
    (
        'FD-2026-00890', 4, 'SEC-TKR-09', 'Officer K. Narsimha', 'security@tkrcet.ac.in', '+91 91000 24001',
        'Ring with 3 Godrej Keys & Pulsar 150 Bike Key', 'Keys', 'found', 'reported',
        'Campus Parking Bays', 'North Two-Wheeler bay Row D near yellow lamp post',
        85, 30,
        '2026-09-26', '09:15',
        'Metallic keyring with Bajaj Pulsar key and 3 brass keys with blue rubber tag.',
        'Blue rubber ring marked Room 204 TKRCET Boys Hostel.',
        'Gate 1 Security Office',
        'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
        0, None
    ),
    (
        'LF-2026-00410', 1, '22K91A0542', 'Shiva Kumar', 'shiva.22cse@tkrcet.ac.in', '+91 98765 43210',
        'Fastrack Reflex Smartwatch (Black Strap)', 'Accessories', 'lost', 'returned',
        'TKR Sports Ground', 'Cricket Pavilion changing bench',
        20, 75,
        '2026-09-20', '18:00',
        'Black silicon strap smartwatch with metallic buckle.',
        'Custom wallpaper showing astronaut floating in purple galaxy.',
        'Returned by Physical Director Mr. Srinivas',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
        0, None
    )
]

cursor.executemany('''
    INSERT INTO items (
        report_code, user_id, roll_no, reporter_name, reporter_email, reporter_phone,
        item_name, category, type, status, location, location_detail,
        map_coord_x, map_coord_y, date_event, time_event, description,
        secret_identifying_details, custody_location, image_url, is_emergency, matched_item_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', items)

# 4. Claims
cursor.execute('''
    INSERT INTO claims (
        claim_code, item_id, claimant_id, claimant_roll_no, claimant_name, claimant_email,
        claimant_phone, proof_description, secret_identifying_answers,
        proof_file_url, verification_status, admin_comment, handover_pass_code
    ) VALUES (
        'CLM-2026-0012', 2, 1, '22K91A0542', 'Shiva Kumar', 'shiva.22cse@tkrcet.ac.in',
        '+91 98765 43210',
        'Lost during OS lab revision on Table 14 in Central Library. Student ID 22K91A0542.',
        'It has a distinct tiny crescent-shaped scratch right above the Lightning charging port. The right stem has a faint blue dot marker.',
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&auto=format&fit=crop&q=80',
        'pending',
        'Physical verification scheduled at TKR Central Library Desk.',
        'HP-TKRCET-9421'
    )
''')

# 5. Emergency Incident Seed
cursor.execute('''
    INSERT INTO emergency_alerts (
        reporter_roll_no, reporter_name, reporter_phone, incident_type,
        location, details, status, dispatched_to
    ) VALUES (
        '23K91A0415', 'Priya Sharma', '+91 98765 87654', 'Lost Original Certificates & ID',
        'TKR Student Canteen', 'Lost folder containing 10th & Intermediate original memo and college ID card.',
        'active', 'TKRCET Security Control Room (Gate 1)'
    )
''')

conn.commit()
conn.close()
print('SUCCESS: TKRCET Campus database seeded with official students, coordinates, and emergency records.')
