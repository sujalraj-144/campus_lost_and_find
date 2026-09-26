/**
 * CampusFind - State Store & Persistence Layer
 * Customized for TKR College of Engineering & Technology (TKRCET, Hyderabad)
 */
window.CampusStore = {
    API_BASE: '',
    backendOnline: false,

    // Current User Session (Default: Shiva Kumar, TKRCET CSE)
    currentUser: {
        user_id: 1,
        roll_no: '22K91A0542',
        name: 'Shiva Kumar',
        college_email: 'shiva.22cse@tkrcet.ac.in',
        role: 'student',
        student_id: '22K91A0542',
        department: 'Computer Science & Engineering',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },

    // Available Personas for TKRCET Showcase
    personas: {
        shiva: {
            user_id: 1,
            roll_no: '22K91A0542',
            name: 'Shiva Kumar',
            college_email: 'shiva.22cse@tkrcet.ac.in',
            role: 'student',
            student_id: '22K91A0542',
            department: 'B.Tech CSE (3rd Year)',
            phone: '+91 98765 43210',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
        },
        priya: {
            user_id: 2,
            roll_no: '23K91A0415',
            name: 'Priya Sharma',
            college_email: 'priya.23ece@tkrcet.ac.in',
            role: 'student',
            student_id: '23K91A0415',
            department: 'B.Tech ECE (2nd Year)',
            phone: '+91 98765 87654',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
        },
        admin: {
            user_id: 3,
            roll_no: 'EMP-TKR-01',
            name: 'Prof. K. Ravindra Reddy',
            college_email: 'proctor@tkrcet.ac.in',
            role: 'admin',
            student_id: 'EMP-TKR-01',
            department: 'Dean Student Affairs & Chief Proctor',
            phone: '040-2409 2555',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
        },
        security: {
            user_id: 4,
            roll_no: 'SEC-TKR-09',
            name: 'Officer K. Narsimha',
            college_email: 'security@tkrcet.ac.in',
            role: 'admin',
            student_id: 'SEC-TKR-09',
            department: 'TKRCET Chief Security Office (Gate 1)',
            phone: '+91 91000 24001',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
        }
    },

    // TKRCET Official Student Directory
    defaultStudents: [
        { roll_no: '22K91A0542', name: 'Shiva Kumar', branch: 'Computer Science & Engineering (CSE)', year_sem: 'B.Tech III Year I Sem', section: 'A', college_email: 'shiva.22cse@tkrcet.ac.in', phone: '+91 98765 43210', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80' },
        { roll_no: '23K91A0415', name: 'Priya Sharma', branch: 'Electronics & Communication (ECE)', year_sem: 'B.Tech II Year I Sem', section: 'B', college_email: 'priya.23ece@tkrcet.ac.in', phone: '+91 98765 87654', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80' },
        { roll_no: '22K91A6620', name: 'Rahul Varma', branch: 'AI & Machine Learning (CSM)', year_sem: 'B.Tech III Year I Sem', section: 'A', college_email: 'rahul.22csm@tkrcet.ac.in', phone: '+91 98765 11223', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80' },
        { roll_no: '21K91A1208', name: 'Sneha Reddy', branch: 'Information Technology (IT)', year_sem: 'B.Tech IV Year I Sem', section: 'A', college_email: 'sneha.21it@tkrcet.ac.in', phone: '+91 98765 99887', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
        { roll_no: '22K91A0214', name: 'Aditya Goud', branch: 'Electrical & Electronics (EEE)', year_sem: 'B.Tech III Year I Sem', section: 'B', college_email: 'aditya.22eee@tkrcet.ac.in', phone: '+91 98765 77665', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
        { roll_no: '23K91A0305', name: 'Vikram Singh', branch: 'Mechanical Engineering', year_sem: 'B.Tech II Year I Sem', section: 'A', college_email: 'vikram.23mech@tkrcet.ac.in', phone: '+91 98765 33445', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
        { roll_no: '23K91A0112', name: 'Ananya Rao', branch: 'Civil Engineering', year_sem: 'B.Tech II Year I Sem', section: 'A', college_email: 'ananya.23civil@tkrcet.ac.in', phone: '+91 98765 55667', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80' }
    ],

    // TKRCET Campus Emergency Contacts
    emergencyContacts: [
        { service: 'TKRCET Security Control Room (Gate 1)', phone: '+91 91000 24001', availability: '24 Hours / 7 Days', incharge: 'Officer K. Narsimha', action: 'Immediate campus patrol & security intervention' },
        { service: 'Dean Student Affairs & Chief Proctor', phone: '040-2409 2555', availability: '9:00 AM - 5:30 PM', incharge: 'Prof. K. Ravindra Reddy', action: 'Official administrative intervention & student welfare' },
        { service: 'Anti-Ragging & Rapid Response Squad', phone: '1800-180-5522', availability: 'Toll-Free 24x7', incharge: 'Anti-Ragging Committee', action: 'Confidential disciplinary & anti-harassment protection' },
        { service: 'Women Protection & Grievance Cell', phone: '+91 91000 24002', availability: '24x7 Helpline', incharge: 'Dr. V. Lalitha', action: 'Women safety, security & grievance escalation' },
        { service: 'Central Lost Property Vault (Library Ground Floor)', phone: '040-2409 2556', availability: '8:30 AM - 6:00 PM', incharge: 'Mr. Sudhakar (Chief Librarian)', action: 'Physical custody verification & handover pass clearance' },
        { service: 'Campus Health Center & Ambulance', phone: '+91 91000 24005', availability: '24x7 Emergency', incharge: 'Dr. Ramesh (Medical Incharge)', action: 'Emergency medical assistance & ambulance dispatch' }
    ],
    // Default TKRCET Seed Items with Map Geotags
    defaultItems: [
        {
            item_id: 1,
            report_code: 'LF-2026-00421',
            user_id: 1,
            roll_no: '22K91A0542',
            reporter_name: 'Shiva Kumar',
            reporter_email: 'shiva.22cse@tkrcet.ac.in',
            reporter_phone: '+91 98765 43210',
            item_name: 'Apple AirPods Pro (2nd Gen)',
            category: 'Electronics',
            type: 'lost',
            status: 'match_found',
            location: 'TKR Central Library',
            location_detail: '2nd Floor Quiet Study Zone, Desk #14 near East Window',
            map_coord_x: 28,
            map_coord_y: 38,
            date_event: '2026-09-24',
            time_event: '14:30',
            description: 'White Apple AirPods Pro 2nd Gen case. Left in study carrel during afternoon study session.',
            secret_identifying_details: 'Case has tiny crescent scratch near charging port. Inside lid says A2698 with blue sticker on right pod stem.',
            custody_location: 'With Reporter',
            image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80',
            matched_item_id: 2,
            is_emergency: false,
            created_at: '2026-09-24 14:45'
        },
        {
            item_id: 2,
            report_code: 'FD-2026-00892',
            user_id: 2,
            roll_no: '23K91A0415',
            reporter_name: 'Priya Sharma',
            reporter_email: 'priya.23ece@tkrcet.ac.in',
            reporter_phone: '+91 98765 87654',
            item_name: 'Apple AirPods Pro Wireless Case',
            category: 'Electronics',
            type: 'found',
            status: 'match_found',
            location: 'TKR Central Library',
            location_detail: '2nd Floor Reading Table 14',
            map_coord_x: 28,
            map_coord_y: 38,
            date_event: '2026-09-24',
            time_event: '16:00',
            description: 'White wireless earbuds case found sitting on Table 14 after library quiet hours.',
            secret_identifying_details: 'Has tiny crescent scratch on bottom near Lightning/USB-C port and blue marking on right pod stem.',
            custody_location: 'TKR Central Library Helpdesk (Librarian Mr. Sudhakar)',
            image_url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80',
            matched_item_id: 1,
            is_emergency: false,
            created_at: '2026-09-24 16:15'
        },
        {
            item_id: 3,
            report_code: 'LF-2026-00418',
            user_id: 1,
            roll_no: '22K91A0542',
            reporter_name: 'Shiva Kumar',
            reporter_email: 'shiva.22cse@tkrcet.ac.in',
            reporter_phone: '+91 98765 43210',
            item_name: 'Dell 65W USB-C Laptop Charger',
            category: 'Electronics',
            type: 'lost',
            status: 'reported',
            location: 'CSE & IT Tech Block',
            location_detail: 'Lab 4, 3rd Floor workstation near projector',
            map_coord_x: 45,
            map_coord_y: 25,
            date_event: '2026-09-23',
            time_event: '11:15',
            description: 'Black Dell oval USB Type-C adapter with Indian 3-pin power cord. Wrapped with velcro strap.',
            secret_identifying_details: 'Has red insulation tape wrapped around the joint near the connector pin.',
            custody_location: 'With Reporter',
            image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: false,
            created_at: '2026-09-23 11:30'
        },
        {
            item_id: 4,
            report_code: 'FD-2026-00885',
            user_id: 2,
            roll_no: '23K91A0415',
            reporter_name: 'Priya Sharma',
            reporter_email: 'priya.23ece@tkrcet.ac.in',
            reporter_phone: '+91 98765 87654',
            item_name: 'Casio FX-991EX Scientific Calculator',
            category: 'Electronics',
            type: 'found',
            status: 'returned',
            location: 'Main Academic Block A',
            location_detail: 'Room 204 Physics Lecture Hall',
            map_coord_x: 52,
            map_coord_y: 60,
            date_event: '2026-09-21',
            time_event: '13:00',
            description: 'Casio ClassWiz scientific calculator with black sliding cover.',
            secret_identifying_details: 'Engraved initials AG (Aditya Goud) on back battery cover with metallic pen.',
            custody_location: 'Handed over to Aditya Goud (22K91A0214)',
            image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: false,
            created_at: '2026-09-21 13:10'
        },
        {
            item_id: 5,
            report_code: 'FD-2026-00887',
            user_id: 4,
            roll_no: 'SEC-TKR-09',
            reporter_name: 'Officer K. Narsimha',
            reporter_email: 'security@tkrcet.ac.in',
            reporter_phone: '+91 91000 24001',
            item_name: 'Navy Blue Skybags Backpack',
            category: 'Bags',
            type: 'found',
            status: 'reported',
            location: 'TKR Student Canteen',
            location_detail: 'Outdoor seating bench under neem tree',
            map_coord_x: 72,
            map_coord_y: 70,
            date_event: '2026-09-25',
            time_event: '13:45',
            description: 'Water-resistant backpack containing 2 spiral notebooks and an empty Milton stainless flask.',
            secret_identifying_details: 'Keychain of Marvel Iron Man helmet attached to front secondary zipper.',
            custody_location: 'Gate 1 Security Cabin (Safe Locker #04)',
            image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: false,
            created_at: '2026-09-25 14:00'
        },
        {
            item_id: 6,
            report_code: 'LF-2026-00415',
            user_id: 2,
            roll_no: '23K91A0415',
            reporter_name: 'Priya Sharma',
            reporter_email: 'priya.23ece@tkrcet.ac.in',
            reporter_phone: '+91 98765 87654',
            item_name: 'TKRCET College ID & Bus Pass SmartCard',
            category: 'ID/Cards',
            type: 'lost',
            status: 'reported',
            location: 'TKR Student Canteen',
            location_detail: 'Juice counter billing line',
            map_coord_x: 74,
            map_coord_y: 72,
            date_event: '2026-09-25',
            time_event: '17:30',
            description: 'Blue neck lanyard with TKRCET university emblem holding ID badge for ECE Dept.',
            secret_identifying_details: 'Roll No: 23K91A0415, Blood Group B+ on the card.',
            custody_location: 'With Reporter',
            image_url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: true,
            created_at: '2026-09-25 17:45'
        },
        {
            item_id: 7,
            report_code: 'FD-2026-00890',
            user_id: 4,
            roll_no: 'SEC-TKR-09',
            reporter_name: 'Officer K. Narsimha',
            reporter_email: 'security@tkrcet.ac.in',
            reporter_phone: '+91 91000 24001',
            item_name: 'Ring with 3 Godrej Keys & Pulsar 150 Bike Key',
            category: 'Keys',
            type: 'found',
            status: 'reported',
            location: 'Campus Parking Bays',
            location_detail: 'North Two-Wheeler bay Row D near yellow lamp post',
            map_coord_x: 85,
            map_coord_y: 30,
            date_event: '2026-09-26',
            time_event: '09:15',
            description: 'Metallic keyring with Bajaj Pulsar key and 3 brass keys with blue rubber tag.',
            secret_identifying_details: 'Blue rubber ring marked Room 204 TKRCET Boys Hostel.',
            custody_location: 'Gate 1 Security Office',
            image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: false,
            created_at: '2026-09-26 09:30'
        },
        {
            item_id: 8,
            report_code: 'LF-2026-00410',
            user_id: 1,
            roll_no: '22K91A0542',
            reporter_name: 'Shiva Kumar',
            reporter_email: 'shiva.22cse@tkrcet.ac.in',
            reporter_phone: '+91 98765 43210',
            item_name: 'Fastrack Reflex Smartwatch (Black Strap)',
            category: 'Accessories',
            type: 'lost',
            status: 'returned',
            location: 'TKR Sports Ground',
            location_detail: 'Cricket Pavilion changing bench',
            map_coord_x: 20,
            map_coord_y: 75,
            date_event: '2026-09-20',
            time_event: '18:00',
            description: 'Black silicon strap smartwatch with metallic buckle.',
            secret_identifying_details: 'Custom wallpaper showing astronaut floating in purple galaxy.',
            custody_location: 'Returned by Physical Director Mr. Srinivas',
            image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: false,
            created_at: '2026-09-20 18:30'
        }
    ],

    defaultClaims: [
        {
            claim_id: 1,
            claim_code: 'CLM-2026-0012',
            item_id: 2,
            claimant_id: 1,
            claimant_roll_no: '22K91A0542',
            claimant_name: 'Shiva Kumar',
            claimant_email: 'shiva.22cse@tkrcet.ac.in',
            claimant_phone: '+91 98765 43210',
            proof_description: 'Lost during OS revision on Table 14 in Central Library. Student Roll: 22K91A0542.',
            secret_identifying_answers: 'It has a distinct tiny crescent-shaped scratch right above the Lightning charging port. The right stem also has a faint blue dot marker.',
            proof_file_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&auto=format&fit=crop&q=80',
            verification_status: 'pending',
            admin_comment: 'Pending physical verification at TKR Central Library Desk.',
            handover_pass_code: 'HP-TKRCET-9421',
            created_at: '2026-09-25 10:15'
        }
    ],

    defaultNotifications: [
        {
            notification_id: 1,
            user_id: 1,
            user_email: 'shiva.22cse@tkrcet.ac.in',
            title: 'Potential AI Match Found! 🎯',
            message: 'A found report for "Apple AirPods Pro Wireless Case" in TKR Central Library matches your report LF-2026-00421 with 94% similarity.',
            type: 'match',
            link_item_id: 2,
            is_read: false,
            created_at: '2026-09-24 16:30'
        }
    ],

    items: [],
    claims: [],
    notifications: [],
    students: [],
    emergencyAlerts: [],

    init() {
        const storedItems = localStorage.getItem('tkrcet_campusfind_items');
        const storedClaims = localStorage.getItem('tkrcet_campusfind_claims');
        const storedNotifs = localStorage.getItem('tkrcet_campusfind_notifs');
        const storedStudents = localStorage.getItem('tkrcet_campusfind_students');
        const storedAlerts = localStorage.getItem('tkrcet_campusfind_alerts');
        const storedPersona = localStorage.getItem('tkrcet_campusfind_persona');

        this.items = storedItems ? JSON.parse(storedItems) : JSON.parse(JSON.stringify(this.defaultItems));
        this.claims = storedClaims ? JSON.parse(storedClaims) : JSON.parse(JSON.stringify(this.defaultClaims));
        this.notifications = storedNotifs ? JSON.parse(storedNotifs) : JSON.parse(JSON.stringify(this.defaultNotifications));
        this.students = storedStudents ? JSON.parse(storedStudents) : JSON.parse(JSON.stringify(this.defaultStudents));
        this.emergencyAlerts = storedAlerts ? JSON.parse(storedAlerts) : [];

        // Ensure all items have GPS latitude & longitude
        this.items = this.items.map(item => {
            if (!item.lat || !item.lng) {
                const gps = this.getLocationGPS(item.location);
                item.lat = gps.lat;
                item.lng = gps.lng;
            }
            return item;
        });

        if (storedPersona && this.personas[storedPersona]) {
            this.currentUser = this.personas[storedPersona];
        }

        this.checkBackendHealth();
    },

    saveToStorage() {
        localStorage.setItem('tkrcet_campusfind_items', JSON.stringify(this.items));
        localStorage.setItem('tkrcet_campusfind_claims', JSON.stringify(this.claims));
        localStorage.setItem('tkrcet_campusfind_notifs', JSON.stringify(this.notifications));
        localStorage.setItem('tkrcet_campusfind_students', JSON.stringify(this.students));
        localStorage.setItem('tkrcet_campusfind_alerts', JSON.stringify(this.emergencyAlerts));
    },

    async checkBackendHealth() {
        try {
            const res = await fetch('/api/health');
            if (res.ok) {
                this.backendOnline = true;
                const statusDot = document.getElementById('backend-status-dot');
                if (statusDot) {
                    statusDot.className = 'status-indicator-dot online';
                    statusDot.title = 'Backend Database Online (24/7 Server Connected)';
                }
            }
        } catch (e) {
            this.backendOnline = false;
        }
    },

    setPersona(key) {
        if (this.personas[key]) {
            this.currentUser = this.personas[key];
            localStorage.setItem('tkrcet_campusfind_persona', key);
        }
    },

    landmarksGPS: {
        'Central Library': { lat: 17.3232, lng: 78.5575, x: 28, y: 38, name: 'TKR Central Library' },
        'TKR Central Library': { lat: 17.3232, lng: 78.5575, x: 28, y: 38, name: 'TKR Central Library' },
        'CSE Block': { lat: 17.3237, lng: 78.5582, x: 45, y: 22, name: 'CSE & IT Tech Block' },
        'CSE & IT Tech Block': { lat: 17.3237, lng: 78.5582, x: 45, y: 22, name: 'CSE & IT Tech Block' },
        'Block A': { lat: 17.3228, lng: 78.5585, x: 55, y: 62, name: 'Academic Block A' },
        'Academic Block A': { lat: 17.3228, lng: 78.5585, x: 55, y: 62, name: 'Academic Block A' },
        'Main Academic Block A': { lat: 17.3228, lng: 78.5585, x: 55, y: 62, name: 'Academic Block A' },
        'Canteen': { lat: 17.3223, lng: 78.5574, x: 73, y: 72, name: 'TKR Student Canteen' },
        'TKR Canteen': { lat: 17.3223, lng: 78.5574, x: 73, y: 72, name: 'TKR Student Canteen' },
        'TKR Student Canteen': { lat: 17.3223, lng: 78.5574, x: 73, y: 72, name: 'TKR Student Canteen' },
        'Parking': { lat: 17.3242, lng: 78.5588, x: 85, y: 28, name: 'Campus Parking Bays' },
        'Campus Parking Bays': { lat: 17.3242, lng: 78.5588, x: 85, y: 28, name: 'Campus Parking Bays' },
        'Sports Ground': { lat: 17.3218, lng: 78.5564, x: 18, y: 76, name: 'TKR Sports Ground' },
        'TKR Sports Ground': { lat: 17.3218, lng: 78.5564, x: 18, y: 76, name: 'TKR Sports Ground' },
        'Gate 1 Security': { lat: 17.3242, lng: 78.5578, x: 88, y: 52, name: 'Security Gate 1 & Vault' },
        'Security Gate 1 & Vault': { lat: 17.3242, lng: 78.5578, x: 88, y: 52, name: 'Security Gate 1 & Vault' },
        'Auditorium': { lat: 17.3229, lng: 78.5588, x: 60, y: 38, name: 'Main Auditorium' },
        'Main Auditorium': { lat: 17.3229, lng: 78.5588, x: 60, y: 38, name: 'Main Auditorium' }
    },

    getLocationCoordinates(locationName) {
        const found = this.landmarksGPS[locationName];
        return found ? { x: found.x, y: found.y } : { x: 50, y: 50 };
    },

    getLocationGPS(locationName) {
        return this.landmarksGPS[locationName] || { lat: 17.3230, lng: 78.5580, x: 50, y: 50, name: locationName || 'TKRCET Campus' };
    },

    calculateDistanceMeters(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c);
    },

    getNearestBuilding(lat, lng) {
        let nearest = null;
        let minDistance = Infinity;
        for (const [key, b] of Object.entries(this.landmarksGPS)) {
            const d = this.calculateDistanceMeters(lat, lng, b.lat, b.lng);
            if (d !== null && d < minDistance) {
                minDistance = d;
                nearest = { ...b, key, distance: d };
            }
        }
        return nearest;
    },

    getStudents(query) {
        if (!query || !query.trim()) {
            return [...this.students];
        }
        const q = query.trim().toLowerCase();
        return this.students.filter(s =>
            s.roll_no.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.branch.toLowerCase().includes(q)
        );
    },

    getStudentByRoll(rollNo) {
        if (!rollNo) return null;
        const clean = rollNo.trim().toUpperCase();
        return this.students.find(s => s.roll_no.toUpperCase() === clean) || null;
    },

    getEmergencyContacts() {
        return this.emergencyContacts;
    },

    getEmergencyAlerts() {
        return [...this.emergencyAlerts];
    },

    async submitEmergencyAlert(alertData) {
        const alertId = this.emergencyAlerts.length + 1;
        const newAlert = {
            alert_id: alertId,
            reporter_roll_no: alertData.reporter_roll_no || this.currentUser.roll_no || '22K91A0542',
            reporter_name: alertData.reporter_name || this.currentUser.name,
            reporter_phone: alertData.reporter_phone || this.currentUser.phone,
            incident_type: alertData.incident_type || 'Critical Lost Property / Security Incident',
            location: alertData.location || 'TKR Campus',
            details: alertData.details || '',
            status: 'active',
            dispatched_to: 'TKRCET Security Control Room (Gate 1)',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        this.emergencyAlerts.unshift(newAlert);

        // Add priority notification for Admin & Security
        this.notifications.unshift({
            notification_id: Date.now(),
            user_id: 4,
            user_email: 'security@tkrcet.ac.in',
            title: '🚨 PRIORITY EMERGENCY ALERT',
            message: `Critical alert #${alertId}: ${newAlert.incident_type} at ${newAlert.location} by ${newAlert.reporter_name} (${newAlert.reporter_roll_no})`,
            type: 'system',
            link_item_id: null,
            is_read: false,
            created_at: newAlert.created_at
        });

        this.saveToStorage();

        // Attempt background API post
        try {
            await fetch('/api/emergency/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAlert)
            });
        } catch (e) {
            console.log('[Emergency Alert] Saved locally offline');
        }

        return newAlert;
    },

    getItems(filters = {}) {
        let list = [...this.items];

        if (filters.type && filters.type !== 'all') {
            list = list.filter(item => item.type === filters.type);
        }
        if (filters.category && filters.category !== 'all') {
            list = list.filter(item => item.category === filters.category);
        }
        if (filters.location && filters.location !== 'all') {
            list = list.filter(item => item.location.includes(filters.location));
        }
        if (filters.status && filters.status !== 'all') {
            list = list.filter(item => item.status === filters.status);
        }
        if (filters.user_email) {
            list = list.filter(item => item.reporter_email === filters.user_email);
        }
        if (filters.emergency_only) {
            list = list.filter(item => Boolean(item.is_emergency));
        }
        if (filters.search && filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            list = list.filter(item =>
                item.item_name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q) ||
                item.location.toLowerCase().includes(q) ||
                (item.location_detail && item.location_detail.toLowerCase().includes(q)) ||
                (item.roll_no && item.roll_no.toLowerCase().includes(q))
            );
        }

        // Conceal found inspection secrets for students
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        return list.map(item => {
            const copy = { ...item };
            if (copy.type === 'found' && !isAdmin && copy.reporter_email !== this.currentUser.college_email) {
                copy.secret_identifying_details = '[Concealed to prevent fraudulent claims]';
            }
            return copy;
        });
    },

    getItem(itemId) {
        const id = parseInt(itemId, 10);
        const item = this.items.find(i => i.item_id === id);
        if (!item) return null;

        const copy = { ...item };
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        if (copy.type === 'found' && !isAdmin && copy.reporter_email !== this.currentUser.college_email) {
            copy.secret_identifying_details = '[Concealed to prevent fraudulent claims]';
        }
        return copy;
    },

    createItem(itemData) {
        const id = this.items.length > 0 ? Math.max(...this.items.map(i => i.item_id)) + 1 : 1;
        const prefix = itemData.type === 'lost' ? 'LF' : 'FD';
        const count = this.items.filter(i => i.type === itemData.type).length + 1;
        const code = `${prefix}-2026-${String(count).padStart(3, '0')}`;
        const gps = this.getLocationGPS(itemData.location);

        const newItem = {
            item_id: id,
            report_code: code,
            user_id: itemData.user_id || this.currentUser.user_id,
            roll_no: itemData.roll_no || this.currentUser.roll_no || '22K91A0542',
            reporter_name: itemData.reporter_name || this.currentUser.name,
            reporter_email: itemData.reporter_email || this.currentUser.college_email,
            reporter_phone: itemData.reporter_phone || this.currentUser.phone,
            item_name: itemData.item_name,
            category: itemData.category || 'Electronics',
            type: itemData.type || 'lost',
            status: 'reported',
            location: itemData.location || 'Central Library',
            location_detail: itemData.location_detail || '',
            lat: itemData.lat || gps.lat,
            lng: itemData.lng || gps.lng,
            map_coord_x: itemData.map_coord_x || gps.x,
            map_coord_y: itemData.map_coord_y || gps.y,
            date_event: itemData.date_event || new Date().toISOString().substring(0, 10),
            time_event: itemData.time_event || '12:00',
            description: itemData.description || '',
            secret_identifying_details: itemData.secret_identifying_details || '',
            custody_location: itemData.custody_location || (itemData.type === 'found' ? 'Central Library Vault' : 'With Reporter'),
            image_url: itemData.image_url || 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
            matched_item_id: null,
            is_emergency: Boolean(itemData.is_emergency),
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        // Smart matching algorithm
        const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
        const candidates = this.items.filter(i => i.type === oppositeType && i.status !== 'returned');
        let bestMatch = null;
        let bestScore = 0;

        for (const cand of candidates) {
            let score = 0;
            if (cand.category.toLowerCase() === newItem.category.toLowerCase()) score += 35;
            if (cand.location.toLowerCase() === newItem.location.toLowerCase()) score += 25;
            const w1 = newItem.item_name.toLowerCase().split(/\s+/);
            const w2 = cand.item_name.toLowerCase().split(/\s+/);
            const stop = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'pro', 'case', 'with', 'for']);
            const wordsMatch = w1.filter(w => w.length > 2 && !stop.has(w) && w2.includes(w));
            if (wordsMatch.length > 0) score += Math.min(40, wordsMatch.length * 20);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = cand;
            }
        }

        if (bestMatch && bestScore >= 60) {
            newItem.status = 'match_found';
            newItem.matched_item_id = bestMatch.item_id;
            bestMatch.status = 'match_found';
            bestMatch.matched_item_id = newItem.item_id;

            this.notifications.unshift({
                notification_id: Date.now(),
                user_id: newItem.user_id,
                user_email: newItem.reporter_email,
                title: `Smart AI Match Found (${bestScore}%) 🎯`,
                message: `We detected a ${bestScore}% match between "${newItem.item_name}" and "${bestMatch.item_name}" at ${bestMatch.location}.`,
                type: 'match',
                link_item_id: bestMatch.item_id,
                is_read: false,
                created_at: newItem.created_at
            });
        }

        this.items.unshift(newItem);
        this.saveToStorage();

        // Background POST to backend
        try {
            fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            }).catch(() => {});
        } catch (e) {}

        return { item: newItem, smart_match: bestMatch && bestScore >= 60 ? { candidate: bestMatch, score: bestScore } : null };
    },

    updateItemStatus(itemId, status) {
        const id = parseInt(itemId, 10);
        const item = this.items.find(i => i.item_id === id);
        if (item) {
            item.status = status;
            this.saveToStorage();

            try {
                fetch(`/api/items/${id}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                }).catch(() => {});
            } catch (e) {}
        }
    },

    getClaims(filters = {}) {
        let list = [...this.claims];
        if (filters.status && filters.status !== 'all') {
            list = list.filter(c => c.verification_status === filters.status);
        }
        if (filters.user_email) {
            list = list.filter(c => c.claimant_email === filters.user_email);
        }
        return list.map(c => {
            const item = this.items.find(i => i.item_id === c.item_id) || {};
            return {
                ...c,
                item_name: item.item_name || 'Item #' + c.item_id,
                category: item.category || 'General',
                location: item.location || 'TKRCET Campus',
                item_type: item.type || 'found',
                report_code: item.report_code || 'FD-2026',
                custody_location: item.custody_location || 'Security Office',
                item_secret_inspection: item.secret_identifying_details || ''
            };
        });
    },

    createClaim(claimData) {
        const id = this.claims.length > 0 ? Math.max(...this.claims.map(c => c.claim_id)) + 1 : 1;
        const code = `CLM-2026-${String(id).padStart(4, '0')}`;
        const pass = `HP-TKRCET-${Math.floor(1000 + Math.random() * 9000)}`;

        const newClaim = {
            claim_id: id,
            claim_code: code,
            item_id: parseInt(claimData.item_id, 10),
            claimant_id: claimData.claimant_id || this.currentUser.user_id,
            claimant_roll_no: claimData.claimant_roll_no || this.currentUser.roll_no || '22K91A0542',
            claimant_name: claimData.claimant_name || this.currentUser.name,
            claimant_email: claimData.claimant_email || this.currentUser.college_email,
            claimant_phone: claimData.claimant_phone || this.currentUser.phone,
            proof_description: claimData.proof_description || '',
            secret_identifying_answers: claimData.secret_identifying_answers || '',
            proof_file_url: claimData.proof_file_url || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&auto=format&fit=crop&q=80',
            verification_status: 'pending',
            admin_comment: 'Pending physical verification at TKRCET Security/Library Desk.',
            handover_pass_code: pass,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        this.claims.unshift(newClaim);

        // Update item status
        const item = this.items.find(i => i.item_id === newClaim.item_id);
        if (item) item.status = 'claim_submitted';

        // Notify Admin
        this.notifications.unshift({
            notification_id: Date.now(),
            user_id: 3,
            user_email: 'proctor@tkrcet.ac.in',
            title: 'New Ownership Claim Filed ⚠️',
            message: `${newClaim.claimant_name} (${newClaim.claimant_roll_no}) filed claim ${code} for item #${newClaim.item_id}`,
            type: 'claim',
            link_item_id: newClaim.item_id,
            is_read: false,
            created_at: newClaim.created_at
        });

        this.saveToStorage();

        try {
            fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClaim)
            }).catch(() => {});
        } catch (e) {}

        return newClaim;
    },

    verifyClaim(claimId, decision, comment = '') {
        const id = parseInt(claimId, 10);
        const claim = this.claims.find(c => c.claim_id === id);
        if (!claim) return false;

        claim.admin_comment = comment || 'Moderator verified distinguishing marks against physical item.';
        const item = this.items.find(i => i.item_id === claim.item_id);

        if (decision === 'approved') {
            claim.verification_status = 'approved';
            if (item) item.status = 'verified';
            this.notifications.unshift({
                notification_id: Date.now(),
                user_id: claim.claimant_id,
                user_email: claim.claimant_email,
                title: 'Claim Approved! 🎉',
                message: `Your claim for item #${claim.item_id} has been approved. Present handover pass ${claim.handover_pass_code} at custody desk.`,
                type: 'claim',
                link_item_id: claim.item_id,
                is_read: false,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
        } else if (decision === 'returned') {
            claim.verification_status = 'approved';
            if (item) item.status = 'returned';
            this.notifications.unshift({
                notification_id: Date.now(),
                user_id: claim.claimant_id,
                user_email: claim.claimant_email,
                title: 'Item Handover Complete ✅',
                message: `Item #${claim.item_id} has been marked as returned to owner. Case closed.`,
                type: 'status',
                link_item_id: claim.item_id,
                is_read: false,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
        } else if (decision === 'rejected') {
            claim.verification_status = 'rejected';
            if (item) item.status = 'reported';
            this.notifications.unshift({
                notification_id: Date.now(),
                user_id: claim.claimant_id,
                user_email: claim.claimant_email,
                title: 'Claim Rejected ❌',
                message: `Your ownership verification for item #${claim.item_id} was rejected. Reason: ${claim.admin_comment}`,
                type: 'claim',
                link_item_id: claim.item_id,
                is_read: false,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
        }

        this.saveToStorage();

        try {
            fetch(`/api/claims/${id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision, admin_comment: claim.admin_comment })
            }).catch(() => {});
        } catch (e) {}

        return true;
    },

    getNotifications() {
        const email = this.currentUser.college_email;
        if (this.currentUser.role === 'admin') {
            return [...this.notifications];
        }
        return this.notifications.filter(n => n.user_email === email || n.type === 'system');
    },

    markNotificationRead(notifId) {
        const id = parseInt(notifId, 10);
        const notif = this.notifications.find(n => n.notification_id === id);
        if (notif) {
            notif.is_read = true;
            this.saveToStorage();
            try {
                fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
            } catch (e) {}
        }
    },

    getStats() {
        const total = this.items.length;
        const recovered = this.items.filter(i => i.status === 'returned').length;
        const active = this.items.filter(i => i.status !== 'returned' && i.status !== 'rejected').length;
        const pendingClaims = this.claims.filter(c => c.verification_status === 'pending').length;
        const rate = total > 0 ? Math.round((recovered / total) * 100) : 89;

        return {
            items_reported: total + 120,
            items_recovered: recovered + 70,
            active_listings: active + 35,
            successful_matches_rate: `${rate}%`,
            pending_claims: pendingClaims,
            total_students: this.students.length,
            active_emergencies: this.emergencyAlerts.filter(a => a.status === 'active').length
        };
    },

    resetDemo() {
        this.items = JSON.parse(JSON.stringify(this.defaultItems));
        this.claims = JSON.parse(JSON.stringify(this.defaultClaims));
        this.notifications = JSON.parse(JSON.stringify(this.defaultNotifications));
        this.students = JSON.parse(JSON.stringify(this.defaultStudents));
        this.emergencyAlerts = [];
        this.currentUser = this.personas.shiva;
        localStorage.clear();
        this.saveToStorage();

        try {
            fetch('/api/reset-demo', { method: 'POST' }).catch(() => {});
        } catch (e) {}
    }
};

// Auto-initialize on load
CampusStore.init();
