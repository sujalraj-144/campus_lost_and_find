-- TKRCET CampusFind Database Schema (SQLite & MySQL)
-- TKR College of Engineering & Technology, Hyderabad

-- 1. Official TKRCET Student Directory
CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no VARCHAR(20) NOT NULL UNIQUE, -- e.g. 22K91A0542
    name VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL, -- CSE, ECE, IT, CSM (AI&ML), EEE, MECH, CIVIL
    year_sem VARCHAR(30) NOT NULL, -- B.Tech III Year I Sem
    section VARCHAR(10) DEFAULT 'A',
    college_email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    parent_phone VARCHAR(20),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_no VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    college_email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    department VARCHAR(80),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_no) REFERENCES students(roll_no)
);

-- 3. Items Table (Lost & Found Posts with TKRCET Geotags)
CREATE TABLE IF NOT EXISTS items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_code VARCHAR(30) NOT NULL UNIQUE,
    user_id INTEGER,
    roll_no VARCHAR(20),
    reporter_name VARCHAR(100) NOT NULL,
    reporter_email VARCHAR(120) NOT NULL,
    reporter_phone VARCHAR(20),
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL,
    status VARCHAR(25) DEFAULT 'reported',
    location VARCHAR(100) NOT NULL, -- TKRCET Landmark Block
    location_detail VARCHAR(255),
    map_coord_x INTEGER DEFAULT 50, -- Percentage coordinates on campus map
    map_coord_y INTEGER DEFAULT 50,
    date_event VARCHAR(30) NOT NULL,
    time_event VARCHAR(30),
    description TEXT NOT NULL,
    secret_identifying_details TEXT,
    custody_location VARCHAR(150), -- Safe Custody at TKRCET
    image_url TEXT,
    is_emergency INTEGER DEFAULT 0, -- Serious matter flag (wallet, govt ID, laptop)
    matched_item_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Claims Table (Ownership Verification)
CREATE TABLE IF NOT EXISTS claims (
    claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_code VARCHAR(30) NOT NULL UNIQUE,
    item_id INTEGER NOT NULL,
    claimant_id INTEGER,
    claimant_roll_no VARCHAR(20),
    claimant_name VARCHAR(100) NOT NULL,
    claimant_email VARCHAR(120) NOT NULL,
    claimant_phone VARCHAR(20) NOT NULL,
    proof_description TEXT NOT NULL,
    secret_identifying_answers TEXT NOT NULL,
    proof_file_url TEXT,
    verification_status VARCHAR(25) DEFAULT 'pending',
    admin_comment TEXT,
    handover_pass_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email VARCHAR(120),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'system',
    link_item_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Emergency Incidents Log
CREATE TABLE IF NOT EXISTS emergency_alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_roll_no VARCHAR(20),
    reporter_name VARCHAR(100) NOT NULL,
    reporter_phone VARCHAR(20) NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- 'Lost Original Certificates', 'Lost Wallet with IDs', 'Suspicious Unattended Bag', 'Medical/Accident'
    location VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    dispatched_to VARCHAR(100) DEFAULT 'TKRCET Security Control Room',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
