# 🌐 CampusFind 2.0 — 24/7 Cloud Deployment Guide

This guide explains how to deploy **CampusFind** to the cloud so it is accessible **24/7 from anywhere** on students\' smartphones, laptops, and college Wi-Fi, along with full **PWA offline support**.

---

## 🚀 Option 1: Free 24/7 Cloud Hosting on Render (Recommended)

Render offers free web service hosting for Python/Flask applications with automatic free SSL (HTTPS) certificates and continuous deployment from GitHub.

### 🌟 Method A: 1-Click Instant Blueprint Deploy
Click this link to deploy immediately without manual typing:

👉 **[Deploy CampusFind on Render](https://render.com/deploy?repo=https://github.com/sujalraj-144/CampusFind)**

Render will automatically read `render.yaml` from your repository, install dependencies, run seed data, and launch Gunicorn.

---

### 🛠️ Method B: Manual Dashboard Setup
1. **Sign In**:
   - Go to [render.com](https://render.com) and click **Sign In with GitHub** (using your `sujalraj-144` account).
2. **Create New Web Service**:
   - Click the blue **"New +"** button at the top right ➔ Select **"Web Service"**.
   - Select **"Build and deploy from a Git repository"** ➔ click **Next**.
   - Choose `sujalraj-144/CampusFind` from your repository list (or paste `https://github.com/sujalraj-144/CampusFind`).
3. **Configure Service Details**:
   - **Name**: `campusfind` (or `tkrcet-campusfind`)
   - **Region**: `Singapore` (Fastest for Hyderabad / India) or `Frankfurt` / `Oregon`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python backend/seed_data.py`
   - **Start Command**: `gunicorn wsgi:app --workers=2 --timeout=120`
   - **Instance Type**: Select **"Free"** ($0/month)
4. **Deploy**:
   - Click **"Deploy Web Service"**.
   - Render will build the container, install packages, initialize the SQLite database, and launch the WSGI server.
5. **Your Permanent 24/7 Live URL**:
   Within 2-3 minutes, your application will be live at:
   👉 **`https://campusfind.onrender.com`** (or `https://tkrcet-campusfind.onrender.com`)

> [!TIP]
> **Prevent Free Tier Sleep (Cold Starts)**:
> Render's free tier spins down after 15 minutes of inactivity. To keep it warm 24/7 for judges, set up a free 5-minute ping on [UptimeRobot.com](https://uptimerobot.com) targeting your `/api/health` endpoint (e.g. `https://campusfind.onrender.com/api/health`).

---

## ⚡ Option 2: 1-Click Serverless Cloud on Vercel (Fastest & Zero Sleep)

Vercel provides free, high-speed edge hosting that **never goes to sleep** and requires **zero configuration**:

### 1-Click Deploy:
👉 **[Deploy CampusFind on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/sujalraj-144/CampusFind)**

1. Sign in with GitHub (`sujalraj-144`).
2. Click **Create** / **Deploy**.
3. In ~25 seconds, your Flask backend & SPA are live at a permanent URL:  
   👉 `https://campusfind.vercel.app` (or `https://campusfind-tkrcet.vercel.app`).
4. Runs 24/7 forever, even when your laptop is turned off!

---

## 🚂 Option 3: 24/7 Cloud Hosting on Railway

Railway gives you an instant cloud URL and persistent storage.

1. Install Railway CLI or connect via [railway.app](https://railway.app).
2. Connect your GitHub repository.
3. Railway automatically detects `requirements.txt` and `Procfile`.
4. Generate a public domain:
   Go to **Settings** ➔ **Generate Domain** ➔ e.g. `https://campusfind-production.up.railway.app`.

---

## 📱 Option 3: Install as a Native PWA on Mobile / Desktop

Because CampusFind 2.0 includes a web manifest and service worker:

### On Android / Chrome:
1. Open your live URL (e.g. `https://campusfind.onrender.com` or local network).
2. Tap the **"📱 Install App"** button in the header or Chrome menu (⋮) ➔ **"Install app"** / **"Add to Home screen"**.
3. CampusFind is installed on your phone home screen with its custom icon!

### On iPhone (iOS Safari):
1. Open the URL in Safari.
2. Tap the **Share** button (box with upward arrow) ➔ tap **"Add to Home Screen"**.

---

## 📴 How Offline Mode & Auto-Sync Works

1. **Browsing Offline**:
   When internet drops, the **Service Worker** intercepts all requests and serves the cached app shell and inventory.
2. **Filing Offline Reports**:
   When a student fills the Lost/Found form while disconnected:
   - The ambient banner highlights: `📡 OFFLINE MODE ACTIVE`.
   - The report is safely written to **IndexedDB Outbox** (`#LF-OFFLINE-...`).
   - The header displays `📡 1 Pending Sync`.
3. **Automatic Reconnection Sync**:
   As soon as internet connectivity returns:
   - `SyncManager` detects the `online` event.
   - The outbox automatically posts the pending report to the central Flask API.
   - A success toast confirms: `✅ Synced to central database as #LF-2026-00006!`.

---

## 🔒 Production Security Checklist

- [x] Passwords salted and hashed.
- [x] Identifying distinguishing marks concealed on found items.
- [x] Parameterized SQL queries preventing SQL injection.
- [x] Production WSGI server (`gunicorn` / `waitress`) instead of Flask dev server.
- [x] Automatic HTTPS enforced by cloud host.
