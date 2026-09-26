/**
 * CampusFind - Offline Sync Manager & IndexedDB Outbox
 * CampusFind 2.0 - PWA & Resilience Layer
 */
window.SyncManager = {
    DB_NAME: 'CampusFindOfflineDB',
    DB_VERSION: 1,
    db: null,
    isOnlineState: navigator.onLine,
    isSyncing: false,

    async init() {
        await this.initIndexedDB();
        this.setupNetworkListeners();
        this.checkInitialConnection();
        this.updateOutboxUI();
    },

    // 1. IndexedDB Initialization
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('[SyncManager] IndexedDB not supported. Falling back to memory/localStorage.');
                resolve(null);
                return;
            }

            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('outbox_reports')) {
                    db.createObjectStore('outbox_reports', { keyPath: 'local_id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('cached_inventory')) {
                    db.createObjectStore('cached_inventory', { keyPath: 'item_id' });
                }
            };

            request.onsuccess = event => {
                this.db = event.target.result;
                console.log('[SyncManager] IndexedDB initialized successfully.');
                resolve(this.db);
            };

            request.onerror = event => {
                console.error('[SyncManager] IndexedDB error:', event.target.error);
                resolve(null);
            };
        });
    },

    // 2. Network Status Listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('[SyncManager] Browser reported ONLINE');
            this.handleConnectionRestored();
        });

        window.addEventListener('offline', () => {
            console.log('[SyncManager] Browser reported OFFLINE');
            this.handleConnectionLost();
        });
    },

    async checkInitialConnection() {
        try {
            const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
            if (res.ok) {
                this.isOnlineState = true;
                this.hideOfflineBanner();
                // Check if any reports were queued while offline
                this.syncPendingReports();
            } else {
                this.handleConnectionLost();
            }
        } catch (e) {
            if (!navigator.onLine) {
                this.handleConnectionLost();
            }
        }
    },

    handleConnectionLost() {
        this.isOnlineState = false;
        this.showOfflineBanner();
        if (window.App && App.showToast) {
            App.showToast('📡 You are offline. CampusFind is running in Offline-First mode.', 'warning');
        }
    },

    async handleConnectionRestored() {
        this.isOnlineState = true;
        this.hideOfflineBanner();
        if (window.App && App.showToast) {
            App.showToast('🌐 Internet connection restored! Synchronizing pending reports...', 'info');
        }
        await this.syncPendingReports();
    },

    isOnline() {
        return navigator.onLine && this.isOnlineState;
    },

    // 3. Enqueue Offline Report (IndexedDB Outbox)
    async enqueueOfflineReport(reportData) {
        const type = reportData.type || 'lost';
        const prefix = type === 'lost' ? 'LF-OFFLINE' : 'FD-OFFLINE';
        const tempId = Date.now();
        const tempCode = `#${prefix}-${String(tempId).slice(-4)}`;

        const queuedReport = {
            ...reportData,
            local_id: tempId,
            report_code: tempCode,
            status: 'pending_sync',
            created_at: new Date().toLocaleString(),
            is_offline_draft: true
        };

        if (this.db) {
            await new Promise((resolve, reject) => {
                const tx = this.db.transaction('outbox_reports', 'readwrite');
                const store = tx.objectStore('outbox_reports');
                store.add(queuedReport);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }

        // Also add locally into CampusStore with pending_sync status
        if (window.CampusStore) {
            const items = JSON.parse(localStorage.getItem('campusfind_items') || '[]');
            items.unshift({
                ...queuedReport,
                item_id: tempId
            });
            localStorage.setItem('campusfind_items', JSON.stringify(items));
        }

        await this.updateOutboxUI();

        if (window.App) {
            App.renderAll();
            App.showToast(
                `📴 Offline Report ${tempCode} saved locally! It will automatically sync to central database when connection returns.`,
                'warning'
            );
        }

        return queuedReport;
    },

    // 4. Get Pending Outbox Count
    async getPendingReports() {
        if (!this.db) {
            return [];
        }

        return new Promise((resolve) => {
            const tx = this.db.transaction('outbox_reports', 'readonly');
            const store = tx.objectStore('outbox_reports');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    },

    // 5. Automatic Sync Manager
    async syncPendingReports() {
        if (this.isSyncing) return;
        const pending = await this.getPendingReports();
        if (pending.length === 0) return;

        this.isSyncing = true;
        this.showSyncingBanner(pending.length);

        console.log(`[SyncManager] Synchronizing ${pending.length} offline reports with central server...`);

        for (const report of pending) {
            try {
                // Post to Flask backend API
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(report)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('[SyncManager] Report synchronized:', result);

                    // Remove from IndexedDB Outbox
                    await this.removePendingReport(report.local_id);

                    // Update local storage representation
                    if (window.CampusStore) {
                        const items = JSON.parse(localStorage.getItem('campusfind_items') || '[]');
                        const idx = items.findIndex(i => i.item_id === report.local_id || i.report_code === report.report_code);
                        if (idx !== -1) {
                            items[idx] = result.item;
                            localStorage.setItem('campusfind_items', JSON.stringify(items));
                        }
                    }

                    if (window.App && App.showToast) {
                        App.showToast(`✅ Synced: ${report.item_name} registered as ${result.item.report_code} in campus database!`, 'success');
                    }
                }
            } catch (err) {
                console.warn('[SyncManager] Sync failed for report, will retry on next connection event:', err);
                break; // Stop and retry later
            }
        }

        this.isSyncing = false;
        this.hideSyncingBanner();
        await this.updateOutboxUI();

        if (window.App) {
            App.renderAll();
        }
    },

    async removePendingReport(localId) {
        if (!this.db) return;
        return new Promise((resolve) => {
            const tx = this.db.transaction('outbox_reports', 'readwrite');
            const store = tx.objectStore('outbox_reports');
            store.delete(localId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        });
    },

    // 6. UI Updates (Banner & Badges)
    async updateOutboxUI() {
        const pending = await this.getPendingReports();
        const badge = document.getElementById('outbox-sync-badge');
        if (badge) {
            if (pending.length > 0) {
                badge.textContent = `📡 ${pending.length} Pending Sync`;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    },

    showOfflineBanner() {
        let banner = document.getElementById('ambient-offline-banner');
        if (banner) {
            banner.innerHTML = `
                <div class="container flex items-center justify-between" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; font-weight: 600;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="pulse-amber-dot">●</span>
                        <span>OFFLINE MODE ACTIVE: You can still search cached items and report lost/found items. Reports will auto-sync when back online.</span>
                    </div>
                    <button class="btn btn-xs btn-secondary" onclick="SyncManager.checkInitialConnection()" style="border-color: rgba(245,158,11,0.4); color: #fbbf24;">
                        Retry Connection 🔄
                    </button>
                </div>
            `;
            banner.className = 'offline-banner active';
        }
    },

    hideOfflineBanner() {
        const banner = document.getElementById('ambient-offline-banner');
        if (banner) {
            banner.className = 'offline-banner hidden';
        }
    },

    showSyncingBanner(count) {
        const banner = document.getElementById('ambient-offline-banner');
        if (banner) {
            banner.innerHTML = `
                <div class="container flex items-center justify-center" style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span class="spin-icon">🔄</span>
                    <span>Synchronizing ${count} offline report(s) with campus central server...</span>
                </div>
            `;
            banner.className = 'offline-banner syncing';
        }
    },

    hideSyncingBanner() {
        this.hideOfflineBanner();
    }
};

// Start SyncManager
document.addEventListener('DOMContentLoaded', () => {
    window.SyncManager.init();
});
