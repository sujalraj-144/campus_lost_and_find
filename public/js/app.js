
/**
 * CampusFind - Main UI Controller & View Router
 * SIH 2026 College Showcase Platform
 */
window.App = {
    currentView: 'landing',
    adminCurrentTab: 'claims',
    activeSearchFilters: {
        type: 'all',
        category: 'all',
        location: 'all',
        status: 'all',
        search: '',
        sort: 'newest'
    },
    viewMode: 'grid',
    leafletMap: null,
    tileLayers: {},
    leafletMarkers: [],
    userGPSMarker: null,
    userGPSCircle: null,
    userGPSLocation: null,
    currentMapLayer: 'dark',
    watchPositionId: null,
    simulationInterval: null,
    simulationStep: 0,
    campusMapFilter: 'all',

    init() {
        this.setupNavigation();
        this.setupPersonaSelector();
        this.setupFormSubmissions();
        this.setupSearchFilters();
        this.setupNotificationsDropdown();
        this.setupPWA();
        this.setupEmergencyHotline();
        this.setupRollNumberValidation();
        this.initCampusMap();
        this.renderAll();
        
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) this.switchView(hash);
        });

        if (window.DemoStory) {
            DemoStory.updatePresenterBar();
        }
    },

    setupPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('[CampusFind PWA] Service Worker active:', reg.scope))
                .catch(err => console.log('[CampusFind PWA] Service Worker reg failed:', err));
        }

        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBtn = document.getElementById('btn-install-app');
            if (installBtn) {
                installBtn.classList.remove('hidden');
                installBtn.onclick = async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log('[CampusFind PWA] Install prompt outcome:', outcome);
                        deferredPrompt = null;
                        installBtn.classList.add('hidden');
                    }
                };
            }
        });
    },

    renderAll() {
        this.renderHeaderUser();
        this.renderStats();
        this.renderCampusMap();
        this.renderRecentLandingItems();
        this.renderCampusHotspots();
        this.renderBrowseItems();
        this.renderDashboard();
        this.renderAdmin();
        this.renderAdminStudents();
        this.renderAdminEmergencies();
        this.renderNotifications();
    },

    switchView(viewName) {
        this.currentView = viewName;
        window.location.hash = viewName;

        document.querySelectorAll('.view-container').forEach(el => {
            el.classList.add('hidden');
        });

        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.view === viewName) {
                link.classList.add('active-nav');
            } else {
                link.classList.remove('active-nav');
            }
        });

        if (viewName === 'browse') {
            this.renderBrowseItems();
        } else if (viewName === 'dashboard') {
            this.renderDashboard();
        } else if (viewName === 'admin') {
            this.renderAdmin();
        } else if (viewName === 'landing') {
            this.renderStats();
            this.renderRecentLandingItems();
            if (this.leafletMap) {
                setTimeout(() => {
                    this.leafletMap.invalidateSize();
                }, 150);
            }
        }
    },

    setupNavigation() {
        document.querySelectorAll('[data-view-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = btn.dataset.viewTarget;
                this.switchView(view);
            });
        });

        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = btn.dataset.view;
                if (view) this.switchView(view);
            });
        });
    },

    setupPersonaSelector() {
        const personaSelect = document.getElementById('persona-select');
        if (personaSelect) {
            personaSelect.addEventListener('change', (e) => {
                const key = e.target.value;
                CampusStore.setPersona(key);
                this.renderAll();
                this.showToast(`Switched persona to ${CampusStore.currentUser.name} (${CampusStore.currentUser.role.toUpperCase()})`, 'info');
                
                if (CampusStore.currentUser.role !== 'admin' && this.currentView === 'admin') {
                    this.switchView('dashboard');
                }
            });
        }
    },

    renderHeaderUser() {
        const user = CampusStore.currentUser;
        const nameEl = document.getElementById('user-display-name');
        const roleEl = document.getElementById('user-display-role');
        const avatarEl = document.getElementById('user-avatar');
        const adminNavLink = document.getElementById('nav-admin-link');

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) roleEl.textContent = user.role === 'admin' ? '🛡️ Proctor / Admin' : '🎓 Student';
        if (avatarEl) avatarEl.src = user.avatar;

        if (adminNavLink) {
            if (user.role === 'admin') {
                adminNavLink.classList.remove('hidden');
            } else {
                adminNavLink.classList.add('hidden');
            }
        }
    },

    renderStats() {
        const stats = CampusStore.getStats();
        const statReported = document.getElementById('stat-reported');
        const statRecovered = document.getElementById('stat-recovered');
        const statActive = document.getElementById('stat-active');
        const statMatchRate = document.getElementById('stat-match-rate');

        if (statReported) statReported.textContent = stats.items_reported + '+';
        if (statRecovered) statRecovered.textContent = stats.items_recovered;
        if (statActive) statActive.textContent = stats.active_listings;
        if (statMatchRate) statMatchRate.textContent = stats.successful_matches_rate;

        const adminRep = document.getElementById('admin-stat-reported');
        const adminRec = document.getElementById('admin-stat-recovered');
        const adminPend = document.getElementById('admin-stat-pending');
        if (adminRep) adminRep.textContent = stats.items_reported;
        if (adminRec) adminRec.textContent = stats.items_recovered;
        if (adminPend) adminPend.textContent = stats.pending_claims;
    },

    renderRecentLandingItems() {
        const container = document.getElementById('recent-items-grid');
        if (!container) return;

        const items = CampusStore.getItems().slice(0, 4);
        container.innerHTML = items.map(item => this.createItemCardHtml(item)).join('');
    },

    renderCampusHotspots() {
        const container = document.getElementById('campus-hotspots-container');
        if (!container) return;

        const spots = [
            { name: 'Central Library', icon: '📚', count: '42 items', desc: 'Reading zones, Study carrels & Tech floor', badge: 'High Recovery Rate' },
            { name: 'Canteen & Cafeteria', icon: '☕', count: '28 items', desc: 'Dining hall, Juice counters & Seating benches', badge: 'Active' },
            { name: 'Block A (Engineering)', icon: '🏛️', count: '19 items', desc: 'Lecture halls, Physics & Mechanics labs', badge: 'Verified Desks' },
            { name: 'CSE Block & Labs', icon: '💻', count: '23 items', desc: 'Computer Labs 1-4, Server room & Terraces', badge: 'Security Tagged' },
            { name: 'Sports Complex', icon: '⚽', count: '14 items', desc: 'Indoor badminton hall, Pavilion & Gym', badge: 'Proctor Desk' },
            { name: 'Campus Parking', icon: '🛵', count: '11 items', desc: 'North & South student parking bays', badge: 'Security Guard' }
        ];

        container.innerHTML = spots.map(spot => `
            <div class="hotspot-card" onclick="App.filterByHotspot('${spot.name}')">
                <div class="hotspot-icon">${spot.icon}</div>
                <div class="hotspot-info">
                    <div class="flex items-center justify-between">
                        <h4>${spot.name}</h4>
                        <span class="hotspot-badge">${spot.badge}</span>
                    </div>
                    <p class="hotspot-desc">${spot.desc}</p>
                    <span class="hotspot-count">📍 ${spot.count} recorded</span>
                </div>
            </div>
        `).join('');
    },

    filterByHotspot(locationName) {
        this.activeSearchFilters.location = locationName;
        const locSelect = document.getElementById('filter-location');
        if (locSelect) locSelect.value = locationName;
        this.switchView('browse');
    },
    createItemCardHtml(item) {
        const isLost = item.type === 'lost';
        const typeBadge = isLost 
            ? `<span class="badge badge-lost">🔴 Lost</span>` 
            : `<span class="badge badge-found">🟢 Found</span>`;
        
        let statusBadge = '';
        if (item.status === 'returned') {
            statusBadge = `<span class="badge badge-success">✓ Returned</span>`;
        } else if (item.status === 'match_found') {
            statusBadge = `<span class="badge badge-match">✨ Match Detected</span>`;
        } else if (item.status === 'claim_submitted') {
            statusBadge = `<span class="badge badge-warning">⏳ Under Claim</span>`;
        } else if (item.status === 'verified') {
            statusBadge = `<span class="badge badge-info">🛡️ Claim Verified</span>`;
        }

        return `
            <div class="item-card group" onclick="App.openItemModal(${item.item_id})">
                <div class="item-card-image-box">
                    <img src="${item.image_url}" alt="${item.item_name}" class="item-card-image" loading="lazy" />
                    <div class="item-card-overlay">
                        <span class="view-pill">🔍 View Details</span>
                    </div>
                    <div class="item-card-badges">
                        ${typeBadge}
                        ${statusBadge}
                    </div>
                    <span class="item-code-tag">${item.report_code || '#LF-2026'}</span>
                </div>
                <div class="item-card-body">
                    <div class="item-card-category-row">
                        <span class="category-pill">${this.getCategoryIcon(item.category)} ${item.category}</span>
                        <span class="item-date">📅 ${item.date_event}</span>
                    </div>
                    <h3 class="item-card-title">${item.item_name}</h3>
                    <p class="item-card-location">📍 ${item.location} <span class="text-slate-400 text-xs">(${item.location_detail || 'Campus area'})</span></p>
                    <p class="item-card-desc">${item.description.length > 90 ? item.description.substring(0, 90) + '...' : item.description}</p>
                    
                    <div class="item-card-footer">
                        <span class="reporter-tag">👤 ${item.reporter_name}</span>
                        <button class="btn-card-action" onclick="event.stopPropagation(); App.openItemModal(${item.item_id})">
                            ${isLost ? 'I Found This' : 'Claim Ownership'} ➔
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    getCategoryIcon(cat) {
        const icons = {
            'Electronics': '📱',
            'Bags': '🎒',
            'Books': '📚',
            'Keys': '🔑',
            'Clothing': '👕',
            'ID/Cards': '💳',
            'Accessories': '🧴',
            'Other': '📦'
        };
        return icons[cat] || '📦';
    },

    setupSearchFilters() {
        const searchInput = document.getElementById('search-query');
        const typeFilter = document.getElementById('filter-type');
        const catFilter = document.getElementById('filter-category');
        const locFilter = document.getElementById('filter-location');
        const statusFilter = document.getElementById('filter-status');
        const sortFilter = document.getElementById('filter-sort');
        const resetBtn = document.getElementById('btn-reset-filters');
        const viewGridBtn = document.getElementById('btn-view-grid');
        const viewListBtn = document.getElementById('btn-view-list');

        let debounceTimer;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.activeSearchFilters.search = e.target.value.trim();
                    this.renderBrowseItems();
                }, 250);
            });
        }

        const applyFilter = (filterKey, value) => {
            this.activeSearchFilters[filterKey] = value;
            this.renderBrowseItems();
        };

        if (typeFilter) typeFilter.addEventListener('change', (e) => applyFilter('type', e.target.value));
        if (catFilter) catFilter.addEventListener('change', (e) => applyFilter('category', e.target.value));
        if (locFilter) locFilter.addEventListener('change', (e) => applyFilter('location', e.target.value));
        if (statusFilter) statusFilter.addEventListener('change', (e) => applyFilter('status', e.target.value));
        if (sortFilter) sortFilter.addEventListener('change', (e) => applyFilter('sort', e.target.value));

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.activeSearchFilters = {
                    type: 'all', category: 'all', location: 'all', status: 'all', search: '', sort: 'newest'
                };
                if (searchInput) searchInput.value = '';
                if (typeFilter) typeFilter.value = 'all';
                if (catFilter) catFilter.value = 'all';
                if (locFilter) locFilter.value = 'all';
                if (statusFilter) statusFilter.value = 'all';
                if (sortFilter) sortFilter.value = 'newest';
                this.renderBrowseItems();
            });
        }

        if (viewGridBtn && viewListBtn) {
            viewGridBtn.addEventListener('click', () => {
                this.viewMode = 'grid';
                viewGridBtn.classList.add('active');
                viewListBtn.classList.remove('active');
                this.renderBrowseItems();
            });
            viewListBtn.addEventListener('click', () => {
                this.viewMode = 'list';
                viewListBtn.classList.add('active');
                viewGridBtn.classList.remove('active');
                this.renderBrowseItems();
            });
        }
    },

    renderBrowseItems() {
        const container = document.getElementById('browse-items-container');
        const countEl = document.getElementById('browse-results-count');
        if (!container) return;

        const items = CampusStore.getItems(this.activeSearchFilters);
        if (countEl) countEl.textContent = `${items.length} Campus Items Found`;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card col-span-full">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No campus items match your filters</h3>
                    <p>Try clearing your keywords or selecting "All Categories" & "All Locations".</p>
                    <button class="btn btn-secondary mt-3" onclick="document.getElementById('btn-reset-filters').click()">Clear All Filters</button>
                </div>
            `;
            return;
        }

        if (this.viewMode === 'grid') {
            container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
            container.innerHTML = items.map(item => this.createItemCardHtml(item)).join('');
        } else {
            container.className = 'flex flex-col gap-3';
            container.innerHTML = `
                <div class="table-container">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Location</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr onclick="App.openItemModal(${item.item_id})" class="clickable-row">
                                    <td class="font-semibold flex items-center gap-3">
                                        <img src="${item.image_url}" class="table-thumb" alt="" />
                                        <div>
                                            <div>${item.item_name}</div>
                                            <span class="text-xs text-slate-400">${item.report_code}</span>
                                        </div>
                                    </td>
                                    <td><span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.type.toUpperCase()}</span></td>
                                    <td>${this.getCategoryIcon(item.category)} ${item.category}</td>
                                    <td>📍 ${item.location}</td>
                                    <td>${item.date_event}</td>
                                    <td><span class="status-pill status-${item.status}">${item.status.replace('_', ' ').toUpperCase()}</span></td>
                                    <td><button class="btn-xs btn-primary">Details</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    },
    renderDashboard() {
        const user = CampusStore.currentUser;
        const greetingName = document.getElementById('dash-user-name');
        if (greetingName) greetingName.textContent = user.name.split(' ')[0];

        const myItems = CampusStore.getItems({ user_email: user.college_email });
        const myReportsContainer = document.getElementById('dash-my-reports');
        if (myReportsContainer) {
            if (myItems.length === 0) {
                myReportsContainer.innerHTML = `
                    <div class="empty-state-mini">
                        <p>You haven't reported any lost or found items yet.</p>
                        <div class="flex gap-2 mt-2">
                            <button class="btn btn-sm btn-lost" onclick="App.switchView('report-lost')">Report Lost</button>
                            <button class="btn btn-sm btn-found" onclick="App.switchView('report-found')">Report Found</button>
                        </div>
                    </div>
                `;
            } else {
                myReportsContainer.innerHTML = myItems.map(item => `
                    <div class="dash-item-card" onclick="App.openItemModal(${item.item_id})">
                        <img src="${item.image_url}" class="dash-item-thumb" alt="" />
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                                <h4 class="font-bold truncate">${item.item_name}</h4>
                                <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.type.toUpperCase()}</span>
                            </div>
                            <p class="text-xs text-slate-400">📍 ${item.location} • 📅 ${item.date_event}</p>
                            <div class="mt-2">
                                ${this.renderItemProgressMini(item.status)}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        const myClaims = CampusStore.getClaims({ user_email: user.college_email });
        const myClaimsContainer = document.getElementById('dash-my-claims');
        if (myClaimsContainer) {
            if (myClaims.length === 0) {
                myClaimsContainer.innerHTML = `
                    <div class="empty-state-mini">
                        <p>No active claims filed under your student account.</p>
                        <button class="btn btn-sm btn-secondary mt-2" onclick="App.switchView('browse')">Browse Campus Inventory</button>
                    </div>
                `;
            } else {
                myClaimsContainer.innerHTML = myClaims.map(claim => `
                    <div class="dash-claim-card">
                        <div class="flex items-center justify-between">
                            <span class="claim-code-badge">🎫 ${claim.claim_code}</span>
                            <span class="claim-status-pill claim-status-${claim.verification_status}">
                                ${claim.verification_status === 'approved' ? '✓ VERIFIED' : (claim.verification_status === 'pending' ? '⏳ UNDER REVIEW' : 'REJECTED')}
                            </span>
                        </div>
                        <h4 class="font-bold mt-1 text-slate-100">${claim.item_name}</h4>
                        <p class="text-xs text-slate-400 mt-1">Custody: ${claim.custody_location}</p>
                        
                        ${claim.verification_status === 'approved' ? `
                            <div class="handover-pass-box mt-2">
                                <div class="text-xs text-emerald-400 font-semibold">DIGITAL HANDOVER PASS READY:</div>
                                <div class="font-mono text-sm tracking-wider text-white font-bold">${claim.handover_pass_code}</div>
                                <div class="text-[11px] text-slate-300">Show this code with your College ID card at safe desk.</div>
                            </div>
                        ` : `
                            <div class="text-xs text-slate-400 mt-2 bg-slate-800/60 p-2 rounded border border-slate-700">
                                💬 <em>"${claim.admin_comment}"</em>
                            </div>
                        `}
                    </div>
                `).join('');
            }
        }

        const matchBanner = document.getElementById('dashboard-match-banner');
        if (matchBanner) {
            const lostAirpods = myItems.find(i => i.type === 'lost' && i.status === 'match_found');
            if (lostAirpods) {
                const allItems = CampusStore.getItems();
                const matchedCandidate = allItems.find(i => i.item_id === lostAirpods.matched_item_id) || allItems.find(i => i.item_id === 2);
                if (matchedCandidate) {
                    matchBanner.classList.remove('hidden');
                    matchBanner.innerHTML = `
                        <div class="smart-match-alert-box">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex items-start gap-3">
                                    <div class="smart-match-sparkle">✨ 94%</div>
                                    <div>
                                        <div class="text-xs font-semibold uppercase tracking-wider text-cyan-400">AI Match Engine Detected Potential Item</div>
                                        <h3 class="text-lg font-bold text-white mt-0.5">We found a matching "${matchedCandidate.item_name}"</h3>
                                        <p class="text-sm text-slate-300 mt-1">Reported found by ${matchedCandidate.reporter_name} at ${matchedCandidate.location}. Safe custody: ${matchedCandidate.custody_location}.</p>
                                    </div>
                                </div>
                                <button class="btn btn-primary whitespace-nowrap shadow-lg shadow-cyan-500/20" onclick="App.openItemModal(${matchedCandidate.item_id})">
                                    Review & Claim Match ➔
                                </button>
                            </div>
                        </div>
                    `;
                }
            } else {
                matchBanner.classList.add('hidden');
            }
        }
    },

    renderItemProgressMini(status) {
        const steps = ['reported', 'match_found', 'claim_submitted', 'verified', 'returned'];
        const currentIdx = steps.indexOf(status);
        const percent = currentIdx === -1 ? 20 : ((currentIdx + 1) / steps.length) * 100;
        
        return `
            <div class="flex items-center gap-2">
                <div class="progress-bar-bg flex-1">
                    <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <span class="text-[11px] font-mono font-medium text-cyan-400">${status.replace('_', ' ').toUpperCase()}</span>
            </div>
        `;
    },

    setupFormSubmissions() {
        const formLost = document.getElementById('form-report-lost');
        if (formLost) {
            formLost.addEventListener('submit', async (e) => {
                e.preventDefault();
                const roll_no = document.getElementById('lost-roll-no')?.value || CampusStore.currentUser.roll_no || '22K91A0542';
                const is_emergency = document.getElementById('lost-is-emergency')?.checked || false;
                const name = document.getElementById('lost-item-name').value;
                const category = document.getElementById('lost-category').value;
                const location = document.getElementById('lost-location').value;
                const location_detail = document.getElementById('lost-location-detail').value;
                const date_event = document.getElementById('lost-date').value;
                const description = document.getElementById('lost-desc').value;
                const secret = document.getElementById('lost-secret').value;
                const image_url = document.getElementById('lost-image-url').value || 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80';

                const reportData = {
                    type: 'lost',
                    roll_no: roll_no,
                    is_emergency: is_emergency,
                    item_name: name,
                    category: category,
                    location: location,
                    location_detail: location_detail,
                    date_event: date_event,
                    description: description,
                    secret_identifying_details: secret,
                    image_url: image_url
                };

                // Offline Check & Queue
                if (window.SyncManager && !window.SyncManager.isOnline()) {
                    await window.SyncManager.enqueueOfflineReport(reportData);
                    formLost.reset();
                    this.switchView('dashboard');
                    return;
                }

                const result = CampusStore.createItem(reportData);

                formLost.reset();
                this.renderAll();

                if (result.smart_match) {
                    this.showMatchModal(result.item, result.smart_match.candidate, result.smart_match.score);
                } else {
                    this.showToast(`Lost Report ${result.item.report_code} created successfully!`, 'success');
                    this.switchView('dashboard');
                }
            });
        }

        const formFound = document.getElementById('form-report-found');
        if (formFound) {
            formFound.addEventListener('submit', async (e) => {
                e.preventDefault();
                const roll_no = document.getElementById('found-roll-no')?.value || CampusStore.currentUser.roll_no || '23K91A0415';
                const name = document.getElementById('found-item-name').value;
                const category = document.getElementById('found-category').value;
                const location = document.getElementById('found-location').value;
                const location_detail = document.getElementById('found-location-detail').value;
                const custody = document.getElementById('found-custody').value;
                const date_event = document.getElementById('found-date').value;
                const description = document.getElementById('found-desc').value;
                const secret = document.getElementById('found-secret').value;
                const image_url = document.getElementById('found-image-url').value || 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80';

                const reportData = {
                    type: 'found',
                    roll_no: roll_no,
                    item_name: name,
                    category: category,
                    location: location,
                    location_detail: location_detail,
                    custody_location: custody,
                    date_event: date_event,
                    description: description,
                    secret_identifying_details: secret,
                    image_url: image_url
                };

                // Offline Check & Queue
                if (window.SyncManager && !window.SyncManager.isOnline()) {
                    await window.SyncManager.enqueueOfflineReport(reportData);
                    formFound.reset();
                    this.switchView('browse');
                    return;
                }

                const result = CampusStore.createItem(reportData);

                formFound.reset();
                this.renderAll();

                if (result.smart_match) {
                    this.showMatchModal(result.item, result.smart_match.candidate, result.smart_match.score);
                } else {
                    this.showToast(`Found Report ${result.item.report_code} logged into safe custody!`, 'success');
                    this.switchView('browse');
                }
            });
        }

        const formClaim = document.getElementById('form-claim-item');
        if (formClaim) {
            formClaim.addEventListener('submit', (e) => {
                e.preventDefault();
                const itemId = document.getElementById('claim-item-id').value;
                const claimant_roll_no = document.getElementById('claim-roll-no')?.value || CampusStore.currentUser.roll_no || '22K91A0542';
                const proofDesc = document.getElementById('claim-proof-desc').value;
                const secretAns = document.getElementById('claim-secret-answers').value;

                const claim = CampusStore.createClaim({
                    item_id: itemId,
                    claimant_roll_no: claimant_roll_no,
                    proof_description: proofDesc,
                    secret_identifying_answers: secretAns
                });

                this.closeAllModals();
                this.renderAll();
                this.showToast(`Ownership Claim ${claim.claim_code} submitted for Admin Review!`, 'success');
                this.switchView('dashboard');
            });
        }
    },
    openItemModal(itemId) {
        const item = CampusStore.getItem(itemId);
        if (!item) return;

        const modal = document.getElementById('item-details-modal');
        const content = document.getElementById('item-modal-content');
        if (!modal || !content) return;

        const isFound = item.type === 'found';
        const isOwner = item.reporter_email === CampusStore.currentUser.college_email;
        const isAdmin = CampusStore.currentUser.role === 'admin';

        const allItems = CampusStore.getItems();
        const candidateMatches = window.MatchingEngine ? window.MatchingEngine.findCandidateMatches(item, allItems) : [];

        content.innerHTML = `
            <div class="modal-grid">
                <div class="modal-left">
                    <div class="modal-img-container">
                        <img src="${item.image_url}" alt="${item.item_name}" class="modal-img" />
                        <div class="modal-badges">
                            <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.type.toUpperCase()}</span>
                            <span class="badge badge-info">${item.report_code}</span>
                        </div>
                    </div>

                    <div class="stepper-box mt-4">
                        <h4 class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Campus Recovery Lifecycle</h4>
                        ${this.renderFullLifecycleStepper(item.status)}
                    </div>
                </div>

                <div class="modal-right">
                    <div class="flex items-center justify-between">
                        <span class="category-pill">${this.getCategoryIcon(item.category)} ${item.category}</span>
                        <span class="text-xs text-slate-400">📅 Reported on ${item.created_at || item.date_event}</span>
                    </div>

                    <h2 class="text-2xl font-bold text-white mt-2">${item.item_name}</h2>

                    <div class="info-chips-grid mt-3">
                        <div class="info-chip">
                            <span class="text-xs text-slate-400">Campus Location:</span>
                            <span class="font-medium text-slate-200">📍 ${item.location}</span>
                            <span class="text-xs text-slate-400">${item.location_detail || 'General campus'}</span>
                        </div>
                        <div class="info-chip">
                            <span class="text-xs text-slate-400">Safe Custody / Status:</span>
                            <span class="font-medium text-cyan-300">🛡️ ${item.custody_location || 'Campus Desk'}</span>
                        </div>
                        <div class="info-chip">
                            <span class="text-xs text-slate-400">Reporter:</span>
                            <span class="font-medium text-slate-200">👤 ${item.reporter_name}</span>
                            <span class="text-xs text-slate-400">${item.reporter_email}</span>
                        </div>
                    </div>

                    <div class="mt-4">
                        <h4 class="text-sm font-semibold text-slate-300">Description</h4>
                        <p class="text-slate-300 text-sm mt-1 leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-800">${item.description}</p>
                    </div>

                    <div class="security-card mt-4">
                        <div class="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                            <span>🛡️ Anti-Fraud Claim Protection</span>
                        </div>
                        <p class="text-xs text-slate-300 mt-1">
                            ${isFound && !isAdmin 
                                ? 'Distinctive identifying marks (engravings, scratches, serial numbers) are hidden from public view to prevent fraudulent claims.'
                                : `<strong>Inspection Notes:</strong> ${item.secret_identifying_details || 'None specified'}`}
                        </p>
                    </div>

                    ${candidateMatches.length > 0 ? `
                        <div class="mt-4 p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-cyan-300 uppercase tracking-wide">✨ AI Match Candidates Detected (${candidateMatches[0].score}%)</span>
                                <span class="text-xs text-cyan-400 font-mono">${candidateMatches.length} candidates</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <img src="${candidateMatches[0].candidate.image_url}" class="w-12 h-12 rounded object-cover border border-cyan-500/30" />
                                <div class="flex-1 min-w-0">
                                    <div class="font-semibold text-sm text-white truncate">${candidateMatches[0].candidate.item_name}</div>
                                    <div class="text-xs text-slate-300">📍 ${candidateMatches[0].candidate.location} (${candidateMatches[0].candidate.type.toUpperCase()})</div>
                                </div>
                                <button class="btn-xs btn-primary" onclick="App.openItemModal(${candidateMatches[0].candidate.item_id})">Compare</button>
                            </div>
                        </div>
                    ` : ''}

                    <div class="modal-actions mt-6 flex items-center justify-end gap-3">
                        <button class="btn btn-secondary" onclick="App.closeAllModals()">Close</button>
                        ${isFound && item.status !== 'returned' ? `
                            <button class="btn btn-primary" onclick="App.openClaimModal(${item.item_id})">
                                🔐 Submit Ownership Claim
                            </button>
                        ` : ''}
                        ${isAdmin && item.status !== 'returned' ? `
                            <button class="btn btn-success" onclick="App.markReturnedFromModal(${item.item_id})">
                                ✓ Mark as Returned
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    renderFullLifecycleStepper(status) {
        const steps = [
            { key: 'reported', label: 'Reported' },
            { key: 'match_found', label: 'Match Found' },
            { key: 'claim_submitted', label: 'Claim Filed' },
            { key: 'verified', label: 'Verified' },
            { key: 'returned', label: 'Returned' }
        ];

        const stepKeys = steps.map(s => s.key);
        const activeIdx = stepKeys.indexOf(status) === -1 ? 0 : stepKeys.indexOf(status);

        return `
            <div class="stepper-track">
                ${steps.map((st, i) => `
                    <div class="stepper-step ${i <= activeIdx ? 'step-active' : ''} ${i === activeIdx ? 'step-current' : ''}">
                        <div class="step-circle">${i < activeIdx ? '✓' : (i + 1)}</div>
                        <span class="step-label">${st.label}</span>
                    </div>
                    ${i < steps.length - 1 ? `<div class="step-line ${i < activeIdx ? 'line-active' : ''}"></div>` : ''}
                `).join('')}
            </div>
        `;
    },

    openClaimModal(itemId) {
        const item = CampusStore.getItem(itemId);
        if (!item) return;

        const modal = document.getElementById('claim-modal');
        const titleEl = document.getElementById('claim-modal-item-title');
        const idInput = document.getElementById('claim-item-id');
        const custodyEl = document.getElementById('claim-custody-info');

        if (titleEl) titleEl.textContent = item.item_name;
        if (idInput) idInput.value = item.item_id;
        if (custodyEl) custodyEl.textContent = `Safe custody: ${item.custody_location} (${item.location})`;

        modal.classList.remove('hidden');
    },

    showMatchModal(itemA, itemB, score) {
        const modal = document.getElementById('match-alert-modal');
        const content = document.getElementById('match-alert-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="text-center">
                <div class="match-score-badge">${score}% Confidence Match</div>
                <h2 class="text-2xl font-bold text-white mt-3">Smart Match Found on Campus!</h2>
                <p class="text-slate-300 text-sm mt-1 max-w-lg mx-auto">
                    Our similarity engine matched your new report with an existing campus item with <strong>${score}% probability</strong>.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left">
                    <div class="match-compare-card">
                        <span class="badge ${itemA.type === 'lost' ? 'badge-lost' : 'badge-found'} mb-2">${itemA.type.toUpperCase()} (YOURS)</span>
                        <img src="${itemA.image_url}" class="h-32 w-full object-cover rounded mb-2" />
                        <h4 class="font-bold text-white">${itemA.item_name}</h4>
                        <p class="text-xs text-slate-400">📍 ${itemA.location}</p>
                    </div>

                    <div class="match-compare-card border-cyan-500/50">
                        <span class="badge ${itemB.type === 'lost' ? 'badge-lost' : 'badge-found'} mb-2">${itemB.type.toUpperCase()} (MATCHED)</span>
                        <img src="${itemB.image_url}" class="h-32 w-full object-cover rounded mb-2" />
                        <h4 class="font-bold text-white">${itemB.item_name}</h4>
                        <p class="text-xs text-slate-400">📍 ${itemB.location} • Safe: ${itemB.custody_location}</p>
                    </div>
                </div>

                <div class="flex items-center justify-center gap-3 mt-6">
                    <button class="btn btn-secondary" onclick="App.closeAllModals()">Review Later</button>
                    <button class="btn btn-primary" onclick="App.closeAllModals(); App.openItemModal(${itemB.item_id})">
                        Open Matched Listing ➔
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    },

    markReturnedFromModal(itemId) {
        CampusStore.updateItemStatus(itemId, 'returned');
        this.closeAllModals();
        this.renderAll();
        this.showToast(`Item #${itemId} marked as Returned to Owner! Recovery stats updated.`, 'success');
    },

    closeAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    },
    switchAdminTab(tabName) {
        this.adminCurrentTab = tabName;
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('.admin-tab-pane').forEach(pane => {
            pane.classList.add('hidden');
        });

        const target = document.getElementById(`admin-pane-${tabName}`);
        if (target) target.classList.remove('hidden');

        if (tabName === 'students') {
            this.renderAdminStudents();
        } else if (tabName === 'emergency') {
            this.renderAdminEmergencies();
        } else {
            this.renderAdmin();
        }
    },

    renderAdmin() {
        const claims = CampusStore.getClaims();
        const items = CampusStore.getItems();

        const claimsContainer = document.getElementById('admin-claims-list');
        if (claimsContainer) {
            const pendingClaims = claims.filter(c => c.verification_status === 'pending');
            if (pendingClaims.length === 0) {
                claimsContainer.innerHTML = `
                    <div class="empty-state-mini">
                        <p>No pending claims in moderation queue. All claims are verified!</p>
                    </div>
                `;
            } else {
                claimsContainer.innerHTML = pendingClaims.map(claim => `
                    <div class="admin-claim-box">
                        <div class="admin-claim-header">
                            <div>
                                <span class="claim-code-badge">🎫 ${claim.claim_code}</span>
                                <h3 class="text-lg font-bold text-white mt-1">${claim.item_name}</h3>
                                <p class="text-xs text-slate-400">Claimant: <strong>${claim.claimant_name}</strong> (${claim.claimant_email}) • 📞 ${claim.claimant_phone}</p>
                            </div>
                            <span class="badge badge-warning">⏳ Pending Verification</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                            <div>
                                <span class="text-xs uppercase font-bold text-cyan-400 tracking-wider">Claimant's Secret Distinguishing Answers</span>
                                <p class="text-sm text-slate-200 mt-1 italic bg-slate-900 p-2.5 rounded border border-slate-700/60">
                                    "${claim.secret_identifying_answers}"
                                </p>
                                <p class="text-xs text-slate-400 mt-2"><strong>Claimant Explanation:</strong> ${claim.proof_description}</p>
                            </div>

                            <div class="border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                                <span class="text-xs uppercase font-bold text-amber-400 tracking-wider">Confidential Custody Inspection Notes</span>
                                <p class="text-sm text-slate-200 mt-1 bg-slate-900 p-2.5 rounded border border-amber-900/30">
                                    "${claim.item_secret_inspection}"
                                </p>
                                <p class="text-xs text-slate-400 mt-2"><strong>Safe Custody:</strong> ${claim.custody_location}</p>
                            </div>
                        </div>

                        <div class="admin-claim-actions mt-4 flex items-center justify-between">
                            <span class="text-xs text-slate-400">Handover Pass to issue: <strong class="font-mono text-cyan-300">${claim.handover_pass_code}</strong></span>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-danger" onclick="App.handleAdminClaimDecision(${claim.claim_id}, 'rejected')">
                                    ❌ Reject Claim
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="App.handleAdminClaimDecision(${claim.claim_id}, 'approved')">
                                    🛡️ Approve Claim
                                </button>
                                <button class="btn btn-sm btn-success" onclick="App.handleAdminClaimDecision(${claim.claim_id}, 'returned')">
                                    ✓ Verify & Mark Returned
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        const itemsModeration = document.getElementById('admin-items-moderation');
        if (itemsModeration) {
            itemsModeration.innerHTML = `
                <div class="table-container">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Report Code</th>
                                <th>Item</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td class="font-mono text-xs text-cyan-400">${item.report_code}</td>
                                    <td class="font-semibold">${item.item_name}</td>
                                    <td><span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">${item.type.toUpperCase()}</span></td>
                                    <td>📍 ${item.location}</td>
                                    <td><span class="status-pill status-${item.status}">${item.status.replace('_', ' ').toUpperCase()}</span></td>
                                    <td>
                                        <div class="flex gap-1.5">
                                            <button class="btn-xs btn-secondary" onclick="App.openItemModal(${item.item_id})">View</button>
                                            ${item.status !== 'returned' ? `
                                                <button class="btn-xs btn-success" onclick="App.markReturnedFromModal(${item.item_id})">Return</button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    },

    handleAdminClaimDecision(claimId, decision) {
        CampusStore.verifyClaim(claimId, decision, 'Moderator verified distinguishing marks against physical item.');
        this.renderAll();
        if (decision === 'returned') {
            this.showToast('Claim approved and item marked as Returned to owner! Campus Recovery count incremented.', 'success');
        } else if (decision === 'approved') {
            this.showToast('Claim approved! Handover pass issued to student.', 'info');
        } else {
            this.showToast('Claim rejected.', 'warning');
        }
    },

    setupNotificationsDropdown() {
        const bellBtn = document.getElementById('btn-notifications-bell');
        const popover = document.getElementById('notifications-popover');
        
        if (bellBtn && popover) {
            bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                popover.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!popover.contains(e.target) && e.target !== bellBtn) {
                    popover.classList.add('hidden');
                }
            });
        }
    },

    renderNotifications() {
        const notifs = CampusStore.getNotifications();
        const unreadCount = notifs.filter(n => !n.is_read).length;
        const badge = document.getElementById('notif-unread-count');
        const list = document.getElementById('notif-items-list');

        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        if (list) {
            if (notifs.length === 0) {
                list.innerHTML = `<div class="p-4 text-center text-xs text-slate-400">No notifications yet.</div>`;
            } else {
                list.innerHTML = notifs.map(n => `
                    <div class="notif-item ${n.is_read ? 'read' : 'unread'}" onclick="App.handleNotifClick(${n.notification_id}, ${n.link_item_id || 'null'})">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-xs text-white">${n.title}</span>
                            <span class="text-[10px] text-slate-400">${n.created_at}</span>
                        </div>
                        <p class="text-xs text-slate-300 mt-1">${n.message}</p>
                    </div>
                `).join('');
            }
        }
    },

    handleNotifClick(notifId, linkItemId) {
        CampusStore.markNotificationRead(notifId);
        this.renderNotifications();
        const popover = document.getElementById('notifications-popover');
        if (popover) popover.classList.add('hidden');
        if (linkItemId) {
            this.openItemModal(linkItemId);
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-slide-in`;
        
        const icons = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            danger: '❌'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-msg">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /* =========================================================
       TKRCET Live Campus Map, Emergency Hotline & Student Directory
       ========================================================= */

    initCampusMap() {
        if (typeof L === 'undefined') {
            console.warn('[CampusFind Map] Leaflet library not loaded yet.');
            return;
        }
        const mapContainer = document.getElementById('leaflet-campus-map');
        if (!mapContainer || this.leafletMap) return;

        try {
            // TKRCET Meerpet Campus Center: 17.3230° N, 78.5580° E
            this.leafletMap = L.map('leaflet-campus-map', {
                center: [17.3230, 78.5580],
                zoom: 17,
                minZoom: 15,
                maxZoom: 19,
                zoomControl: true
            });

            // Tile Layer 1: Cyber Dark Matter
            this.tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
                maxZoom: 19
            });

            // Tile Layer 2: High-Resolution Satellite Imagery (Esri)
            this.tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
                maxZoom: 19
            });

            this.tileLayers.dark.addTo(this.leafletMap);
            this.currentMapLayer = 'dark';

            // TKRCET Campus Boundary Perimeter
            const campusPerimeter = [
                [17.3248, 78.5562],
                [17.3249, 78.5587],
                [17.3238, 78.5599],
                [17.3216, 78.5593],
                [17.3212, 78.5564]
            ];
            L.polygon(campusPerimeter, {
                color: '#38bdf8',
                weight: 2,
                dashArray: '6, 6',
                fillColor: '#0ea5e9',
                fillOpacity: 0.05
            }).addTo(this.leafletMap).bindTooltip('🏫 TKR College of Engineering & Technology (TKRCET Campus)', {
                sticky: true
            });

            // Landmark Chips across campus blocks
            const landmarkLabels = [
                { name: '📚 Central Library', lat: 17.3232, lng: 78.5575 },
                { name: '💻 CSE & IT Block', lat: 17.3237, lng: 78.5582 },
                { name: '🏛️ Academic Block A', lat: 17.3228, lng: 78.5585 },
                { name: '☕ TKR Canteen', lat: 17.3223, lng: 78.5574 },
                { name: '🅿️ Parking Bays', lat: 17.3242, lng: 78.5588 },
                { name: '🏏 Sports Ground', lat: 17.3218, lng: 78.5564 },
                { name: '🛡️ Gate 1 Security', lat: 17.3242, lng: 78.5578 },
                { name: '🎭 Main Auditorium', lat: 17.3229, lng: 78.5588 }
            ];

            landmarkLabels.forEach(lm => {
                const icon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `<div class="building-map-chip">${lm.name}</div>`,
                    iconSize: [130, 24],
                    iconAnchor: [65, 12]
                });
                L.marker([lm.lat, lm.lng], { icon, interactive: false }).addTo(this.leafletMap);
            });

            this.renderCampusMap();
            this.renderBlueprintPins();
        } catch (e) {
            console.error('[CampusFind Map] Failed to initialize Leaflet map:', e);
        }
    },

    setMapLayer(mode) {
        this.currentMapLayer = mode;
        const btnDark = document.getElementById('btn-layer-dark');
        const btnSat = document.getElementById('btn-layer-sat');
        const btnBlueprint = document.getElementById('btn-layer-blueprint');
        const leafletEl = document.getElementById('leaflet-campus-map');
        const blueprintEl = document.getElementById('campus-map-blueprint');

        [btnDark, btnSat, btnBlueprint].forEach(b => {
            if (b) b.classList.remove('active');
        });

        if (mode === 'blueprint') {
            if (btnBlueprint) btnBlueprint.classList.add('active');
            if (leafletEl) leafletEl.classList.add('hidden');
            if (blueprintEl) blueprintEl.classList.remove('hidden');
            this.renderBlueprintPins();
            this.showToast('Switched to Architectural Blueprint schematic', 'info');
            return;
        }

        if (leafletEl) leafletEl.classList.remove('hidden');
        if (blueprintEl) blueprintEl.classList.add('hidden');

        if (mode === 'dark' && btnDark) btnDark.classList.add('active');
        if (mode === 'satellite' && btnSat) btnSat.classList.add('active');

        if (this.leafletMap && this.tileLayers) {
            Object.values(this.tileLayers).forEach(layer => {
                if (this.leafletMap.hasLayer(layer)) {
                    this.leafletMap.removeLayer(layer);
                }
            });
            if (this.tileLayers[mode]) {
                this.tileLayers[mode].addTo(this.leafletMap);
            }
            setTimeout(() => {
                this.leafletMap.invalidateSize();
            }, 100);
        }
        this.showToast(`Switched map layer to ${mode === 'dark' ? '🌌 Cyber Dark' : '🛰️ High-Res Satellite'}`, 'info');
    },

    centerTKRCET() {
        if (this.leafletMap) {
            this.leafletMap.setView([17.3230, 78.5580], 17, { animate: true });
            this.showToast('🎯 Centered on TKRCET Campus (Meerpet, Hyderabad)', 'info');
        }
    },

    renderCampusMap(filter = null) {
        if (filter !== null) {
            this.campusMapFilter = filter;
        }
        const activeFilter = this.campusMapFilter;

        let items = CampusStore.getItems();
        if (activeFilter === 'lost') {
            items = items.filter(i => i.type === 'lost');
        } else if (activeFilter === 'found') {
            items = items.filter(i => i.type === 'found');
        } else if (activeFilter === 'emergency') {
            items = items.filter(i => Boolean(i.is_emergency));
        }

        // Keep blueprint pins in sync
        this.renderBlueprintPins(items);

        if (!this.leafletMap || typeof L === 'undefined') return;

        // Clear previous markers
        this.leafletMarkers.forEach(m => m.remove());
        this.leafletMarkers = [];

        items.forEach((item, index) => {
            // Apply slight offset for multiple items sharing the same landmark
            const jitterLat = ((index % 5) - 2) * 0.00008;
            const jitterLng = (((index + 2) % 5) - 2) * 0.00008;

            const lat = (item.lat || 17.3230) + jitterLat;
            const lng = (item.lng || 78.5580) + jitterLng;

            const isEmerg = Boolean(item.is_emergency);
            const pinClass = isEmerg ? 'pin-emergency' : (item.type === 'lost' ? 'pin-lost' : 'pin-found');
            const pinIcon = isEmerg ? '🚨' : (item.type === 'lost' ? '🔴' : '🟢');

            // Distance from user live GPS position
            let distanceHtml = '';
            if (this.userGPSLocation) {
                const dist = CampusStore.calculateDistanceMeters(this.userGPSLocation.lat, this.userGPSLocation.lng, lat, lng);
                if (dist !== null) {
                    distanceHtml = `<div class="distance-badge">📏 ${dist < 1000 ? dist + 'm away from you' : (dist / 1000).toFixed(1) + 'km away'}</div>`;
                }
            }

            const customIcon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `
                    <div class="map-item-pin-leaflet ${pinClass}">
                        <div class="pin-pulse-wave"></div>
                        <div class="pin-marker">
                            <div class="pin-marker-inner">${pinIcon}</div>
                        </div>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -18]
            });

            const popupContent = `
                <div style="min-width: 250px; max-width: 290px; font-family: inherit;">
                    <img src="${item.image_url}" alt="${item.item_name}" style="width: 100%; height: 115px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" onerror="this.src='https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80'">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span class="badge ${item.type === 'lost' ? 'badge-danger' : 'badge-success'}">${item.type.toUpperCase()}</span>
                        <span style="font-size: 0.68rem; font-family: monospace; color: var(--text-dim);">${item.report_code}</span>
                    </div>
                    <h4 style="font-size: 0.9rem; font-weight: 700; color: #fff; margin: 4px 0 6px 0;">${item.item_name}</h4>
                    ${distanceHtml}
                    <div style="font-size: 0.72rem; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; border: 1px solid rgba(56, 189, 248, 0.2);">
                        🏛️ Safe Custody: ${item.custody_location || 'Campus Desk'}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">
                        📍 <strong>Spot:</strong> ${item.location} ${item.location_detail ? '(' + item.location_detail + ')' : ''}<br>
                        🎓 <strong>Reporter Roll:</strong> <span style="font-family: monospace; color: #38bdf8;">${item.roll_no || '22K91A0542'}</span>
                    </div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button class="btn btn-xs btn-secondary" style="flex: 1;" onclick="App.openItemModal(${item.item_id})">View Details</button>
                        ${item.type === 'found' && item.status !== 'returned' ? `
                            <button class="btn btn-xs btn-primary" style="flex: 1;" onclick="App.openClaimModal(${item.item_id})">Claim</button>
                        ` : ''}
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" class="btn btn-xs btn-outline" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 4px 8px; font-size: 0.72rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); color:#cbd5e1;" title="Get Google Maps navigation directions">🧭 Directions</a>
                    </div>
                </div>
            `;

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.leafletMap).bindPopup(popupContent);
            this.leafletMarkers.push(marker);
        });
    },

    renderBlueprintPins(items = null) {
        const container = document.getElementById('campus-map-pins');
        if (!container) return;

        if (!items) {
            items = CampusStore.getItems();
            if (this.campusMapFilter === 'lost') {
                items = items.filter(i => i.type === 'lost');
            } else if (this.campusMapFilter === 'found') {
                items = items.filter(i => i.type === 'found');
            } else if (this.campusMapFilter === 'emergency') {
                items = items.filter(i => Boolean(i.is_emergency));
            }
        }

        container.innerHTML = items.map(item => {
            const isEmerg = Boolean(item.is_emergency);
            const pinClass = isEmerg ? 'pin-emergency' : (item.type === 'lost' ? 'pin-lost' : 'pin-found');
            const pinIcon = isEmerg ? '🚨' : (item.type === 'lost' ? '🔴' : '🟢');
            const x = item.map_coord_x || 50;
            const y = item.map_coord_y || 50;

            return `
                <div class="map-item-pin ${pinClass}" style="left: ${x}%; top: ${y}%;" data-id="${item.item_id}">
                    <div class="pin-pulse-wave"></div>
                    <div class="pin-marker">
                        <div class="pin-marker-inner">${pinIcon}</div>
                    </div>

                    <!-- Interactive Hover/Tap Popover Card -->
                    <div class="map-popover">
                        <img src="${item.image_url}" alt="${item.item_name}" class="popover-img" onerror="this.src='https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80'">
                        <div class="popover-header">
                            <span class="badge ${item.type === 'lost' ? 'badge-danger' : 'badge-success'}">${item.type.toUpperCase()}</span>
                            <span style="font-size: 0.68rem; font-family: monospace; color: var(--text-dim);">${item.report_code}</span>
                        </div>
                        <h4 class="popover-title">${item.item_name}</h4>
                        <span class="popover-custody">🏛️ Safe Custody: ${item.custody_location || 'Campus Desk'}</span>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 6px;">
                            📍 <strong>Spot:</strong> ${item.location} ${item.location_detail ? '(' + item.location_detail + ')' : ''}<br>
                            🎓 <strong>Reporter Roll:</strong> <span class="font-mono text-cyan-300">${item.roll_no || '22K91A0542'}</span>
                        </div>
                        <div class="popover-actions">
                            <button class="btn btn-xs btn-secondary" style="flex: 1;" onclick="App.openItemModal(${item.item_id})">View Details</button>
                            ${item.type === 'found' && item.status !== 'returned' ? `
                                <button class="btn btn-xs btn-primary" style="flex: 1;" onclick="App.openClaimModal(${item.item_id})">Claim</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    filterCampusMap(filter) {
        this.campusMapFilter = filter;
        const btns = {
            'all': document.getElementById('map-btn-all'),
            'lost': document.getElementById('map-btn-lost'),
            'found': document.getElementById('map-btn-found'),
            'emergency': document.getElementById('map-btn-emergency')
        };

        Object.values(btns).forEach(b => {
            if (b) b.className = 'map-filter-btn';
        });

        if (filter === 'all' && btns.all) btns.all.classList.add('active');
        if (filter === 'lost' && btns.lost) btns.lost.classList.add('active-lost');
        if (filter === 'found' && btns.found) btns.found.classList.add('active-found');
        if (filter === 'emergency' && btns.emergency) btns.emergency.classList.add('active-emergency');

        this.renderCampusMap(filter);
    },

    trackLiveGPSLocation() {
        const btn = document.getElementById('btn-track-gps');
        if (this.watchPositionId !== null) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
            if (btn) btn.innerHTML = '📍 Track My Live Location';
            this.showToast('Stopped live GPS tracking', 'info');
            return;
        }

        if (!('geolocation' in navigator)) {
            this.showToast('Geolocation is not supported by your browser', 'warning');
            return;
        }

        if (btn) btn.innerHTML = '📡 Acquiring GPS...';
        this.showToast('Acquiring high-accuracy GPS coordinates...', 'info');

        let isFirstFix = true;
        this.watchPositionId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                this.updateUserLiveLocation(latitude, longitude, accuracy, false);
                if (btn) btn.innerHTML = '🟢 GPS Active (Live)';

                if (isFirstFix) {
                    isFirstFix = false;
                    this.showToast(`Live GPS Locked: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${Math.round(accuracy)}m)`, 'success');
                    if (this.leafletMap) {
                        this.leafletMap.panTo([latitude, longitude], { animate: true });
                    }
                }
            },
            (err) => {
                console.warn('[CampusFind GPS] Geolocation error:', err);
                if (btn) btn.innerHTML = '📍 Track My Live Location';
                this.watchPositionId = null;
                this.showToast('Device GPS unavailable. Click "🚶 Walk on Campus" to test with simulated campus movement!', 'warning');
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    },

    updateUserLiveLocation(lat, lng, accuracy = 10, isSimulated = false) {
        this.userGPSLocation = { lat, lng, accuracy, isSimulated };

        const gpsText = document.getElementById('live-gps-text');
        const gpsNear = document.getElementById('live-gps-nearest');
        const gpsIndicator = document.getElementById('live-gps-indicator');

        if (gpsIndicator) gpsIndicator.classList.add('active');
        if (gpsText) {
            gpsText.innerHTML = `📍 Live: <strong>${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</strong> (±${Math.round(accuracy)}m) ${isSimulated ? '• 🚶 Walk Sim' : '• 📡 Device GPS'}`;
        }

        const nearest = CampusStore.getNearestBuilding(lat, lng);
        if (gpsNear && nearest) {
            gpsNear.innerHTML = `🏛️ Nearest: <strong>${nearest.name}</strong> (${nearest.distance}m away)`;
        }

        if (this.leafletMap && typeof L !== 'undefined') {
            const userIcon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `
                    <div class="user-live-gps-pin">
                        <div class="user-live-gps-pulse"></div>
                        <div class="user-live-gps-dot">📍</div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
            });

            const popupContent = `
                <div style="font-size: 0.82rem; padding: 4px; line-height: 1.4; color: #f8fafc;">
                    <strong style="color: #38bdf8;">📍 You Are Here</strong><br>
                    <span style="font-size: 0.72rem; color: #94a3b8;">${isSimulated ? '🚶 Simulated Campus Walk' : '📡 Live Device GPS'}</span><br>
                    <span style="color: #cbd5e1;">Near <strong>${nearest ? nearest.name : 'TKRCET Campus'}</strong> (${nearest ? nearest.distance + 'm' : ''})</span>
                </div>
            `;

            if (!this.userGPSMarker) {
                this.userGPSMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.leafletMap);
                this.userGPSMarker.bindPopup(popupContent);
                this.userGPSCircle = L.circle([lat, lng], {
                    radius: Math.max(accuracy, 12),
                    color: '#38bdf8',
                    fillColor: '#0ea5e9',
                    fillOpacity: 0.12,
                    weight: 1.5
                }).addTo(this.leafletMap);
            } else {
                this.userGPSMarker.setLatLng([lat, lng]);
                this.userGPSMarker.setPopupContent(popupContent);
                this.userGPSCircle.setLatLng([lat, lng]);
                this.userGPSCircle.setRadius(Math.max(accuracy, 12));
            }
        }

        // Re-render pins to update live distance badges
        this.renderCampusMap();
    },

    simulateCampusWalk() {
        const campusWaypoints = [
            { name: 'Security Gate 1 & Vault', lat: 17.3242, lng: 78.5578, note: 'Entering TKRCET via Gate 1 Security Cabin' },
            { name: 'TKR Central Library', lat: 17.3232, lng: 78.5575, note: 'Approaching Central Library & Quiet Study Hall' },
            { name: 'CSE & IT Tech Block', lat: 17.3237, lng: 78.5582, note: 'Walking near CSE Block & AI Labs' },
            { name: 'Academic Block A', lat: 17.3228, lng: 78.5585, note: 'Passing Academic Block A (ECE & Mech)' },
            { name: 'Main Auditorium', lat: 17.3229, lng: 78.5588, note: 'Near Main Auditorium Seminar Hall' },
            { name: 'TKR Student Canteen', lat: 17.3223, lng: 78.5574, note: 'Taking lunch break at TKR Student Canteen' },
            { name: 'TKR Sports Ground', lat: 17.3218, lng: 78.5564, note: 'Near Cricket Oval & Sports Complex' }
        ];

        if (this.simulationInterval !== null) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
            this.showToast('Campus walk simulation paused.', 'info');
            return;
        }

        this.showToast('Starting simulated campus walk across TKRCET blocks...', 'info');

        const step = () => {
            const wp = campusWaypoints[this.simulationStep % campusWaypoints.length];
            this.updateUserLiveLocation(wp.lat, wp.lng, 8, true);
            if (this.leafletMap) {
                this.leafletMap.panTo([wp.lat, wp.lng], { animate: true, duration: 1 });
            }
            this.showToast(`🚶 Walk: ${wp.note}`, 'info');
            this.simulationStep++;
        };

        step();
        this.simulationInterval = setInterval(step, 3000);
    },

    autoFillGPSLocation(formType) {
        const selectId = formType === 'lost' ? 'lost-location' : 'found-location';
        const detailId = formType === 'lost' ? 'lost-location-detail' : 'found-location-detail';
        const selectEl = document.getElementById(selectId);
        const detailEl = document.getElementById(detailId);

        const applyLocation = (lat, lng, accuracy = 10) => {
            const nearest = CampusStore.getNearestBuilding(lat, lng);
            if (!nearest) return;

            const mapping = {
                'Central Library': 'Central Library',
                'TKR Central Library': 'Central Library',
                'CSE Block': 'CSE Block',
                'CSE & IT Tech Block': 'CSE Block',
                'Block A': 'Block A',
                'Academic Block A': 'Block A',
                'Main Academic Block A': 'Block A',
                'Canteen': 'Canteen',
                'TKR Canteen': 'Canteen',
                'TKR Student Canteen': 'Canteen',
                'Parking': 'Parking',
                'Campus Parking Bays': 'Parking',
                'Sports Ground': 'Sports Ground',
                'TKR Sports Ground': 'Sports Ground',
                'Auditorium': 'Auditorium',
                'Main Auditorium': 'Auditorium',
                'Gate 1 Security': 'Central Library',
                'Security Gate 1 & Vault': 'Central Library'
            };

            const targetVal = mapping[nearest.key] || 'Central Library';
            if (selectEl) {
                selectEl.value = targetVal;
            }

            if (detailEl) {
                detailEl.value = `📍 Live GPS: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E (~${Math.round(nearest.distance)}m from ${nearest.name})`;
            }

            this.showToast(`✅ Geotagged: Nearest landmark is ${nearest.name} (${Math.round(nearest.distance)}m away)`, 'success');
        };

        if (this.userGPSLocation) {
            applyLocation(this.userGPSLocation.lat, this.userGPSLocation.lng, this.userGPSLocation.accuracy);
        } else if ('geolocation' in navigator) {
            this.showToast('Acquiring current GPS position...', 'info');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    this.updateUserLiveLocation(latitude, longitude, accuracy, false);
                    applyLocation(latitude, longitude, accuracy);
                },
                (err) => {
                    this.showToast('GPS unavailable. Falling back to TKRCET Central Library location.', 'warning');
                    applyLocation(17.3232, 78.5575, 15);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            applyLocation(17.3232, 78.5575, 15);
        }
    },

    openEmergencyModal() {
        const modal = document.getElementById('emergency-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        const rollInput = document.getElementById('emergency-roll-no');
        const phoneInput = document.getElementById('emergency-phone');
        if (rollInput && CampusStore.currentUser) {
            rollInput.value = CampusStore.currentUser.roll_no || '22K91A0542';
        }
        if (phoneInput && CampusStore.currentUser) {
            phoneInput.value = CampusStore.currentUser.phone || '+91 98765 43210';
        }

        const badge = document.getElementById('emergency-roll-badge');
        if (badge && rollInput) {
            const student = CampusStore.getStudentByRoll(rollInput.value);
            if (student) {
                badge.className = 'roll-validation-badge roll-valid';
                badge.innerHTML = `✅ Verified TKRCET Student: <strong>${student.name}</strong> (${student.branch})`;
            }
        }
    },

    setupEmergencyHotline() {
        const formAlert = document.getElementById('form-emergency-alert');
        if (formAlert) {
            formAlert.addEventListener('submit', async (e) => {
                e.preventDefault();
                const roll_no = document.getElementById('emergency-roll-no').value;
                const incident_type = document.getElementById('emergency-incident-type').value;
                const location = document.getElementById('emergency-location').value;
                const phone = document.getElementById('emergency-phone').value;
                const details = document.getElementById('emergency-details').value;

                const student = CampusStore.getStudentByRoll(roll_no);
                const reporter_name = student ? student.name : CampusStore.currentUser.name;

                const alert = await CampusStore.submitEmergencyAlert({
                    reporter_roll_no: roll_no,
                    reporter_name: reporter_name,
                    reporter_phone: phone,
                    incident_type: incident_type,
                    location: location,
                    details: details
                });

                this.closeAllModals();
                this.renderAll();
                this.showToast(`🚨 Priority Alert #${alert.alert_id} dispatched to TKRCET Gate 1 Security!`, 'danger');

                if (CampusStore.currentUser.role === 'admin') {
                    this.switchView('admin');
                    this.switchAdminTab('emergency');
                }
            });
        }
    },

    setupRollNumberValidation() {
        const hookValidation = (inputId, badgeId) => {
            const inputEl = document.getElementById(inputId);
            const badgeEl = document.getElementById(badgeId);
            if (!inputEl || !badgeEl) return;

            const update = () => {
                const val = inputEl.value.trim().toUpperCase();
                if (!val) {
                    badgeEl.className = 'roll-validation-badge roll-invalid';
                    badgeEl.textContent = 'Please enter student roll number';
                    return;
                }
                const s = CampusStore.getStudentByRoll(val);
                if (s) {
                    badgeEl.className = 'roll-validation-badge roll-valid';
                    badgeEl.innerHTML = `✅ Verified TKRCET Student: <strong>${s.name}</strong> (${s.branch} - Sec ${s.section || 'A'})`;
                } else if (val.startsWith('EMP-') || val.startsWith('SEC-')) {
                    badgeEl.className = 'roll-validation-badge roll-valid';
                    badgeEl.innerHTML = `🛡️ Verified TKRCET Staff / Security Credential: <strong>${val}</strong>`;
                } else if (val.length >= 6) {
                    badgeEl.className = 'roll-validation-badge roll-invalid';
                    badgeEl.innerHTML = `⚠️ Roll number "${val}" not recognized in TKRCET database (Requires manual verification)`;
                } else {
                    badgeEl.className = 'roll-validation-badge roll-invalid';
                    badgeEl.textContent = 'Enter complete Roll No (e.g. 22K91A0542)';
                }
            };

            inputEl.addEventListener('input', update);
            update();
        };

        hookValidation('lost-roll-no', 'lost-roll-badge');
        hookValidation('found-roll-no', 'found-roll-badge');
        hookValidation('claim-roll-no', 'claim-roll-badge');
        hookValidation('emergency-roll-no', 'emergency-roll-badge');
    },

    renderAdminStudents(query = '') {
        const tbody = document.getElementById('admin-students-table-body');
        if (!tbody) return;

        const students = CampusStore.getStudents(query);
        if (students.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
                        No TKRCET student records matched "${query}".
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = students.map(s => `
            <tr>
                <td><span class="student-roll-chip">${s.roll_no}</span></td>
                <td>
                    <div style="font-weight: 700; color: #fff;">${s.name}</div>
                    <div style="font-size: 0.72rem; color: var(--text-dim);">${s.college_email}</div>
                </td>
                <td><span class="student-branch-pill">${s.branch}</span></td>
                <td><span style="font-size: 0.75rem; color: #cbd5e1;">${s.year_sem} (Sec ${s.section || 'A'})</span></td>
                <td>
                    <div style="font-size: 0.78rem;">${s.phone}</div>
                    <div style="font-size: 0.68rem; color: var(--text-dim);">Parent: ${s.parent_phone || 'Registered'}</div>
                </td>
                <td>
                    <button class="btn btn-xs btn-secondary" onclick="App.searchStudentActivity('${s.roll_no}')" title="Filter items reported by this student">
                        🔍 Activity
                    </button>
                </td>
            </tr>
        `).join('');
    },

    searchStudentActivity(rollNo) {
        this.switchView('browse');
        const searchInput = document.getElementById('search-query');
        if (searchInput) {
            searchInput.value = rollNo;
            this.activeSearchFilters.search = rollNo;
            this.renderBrowseItems();
            this.showToast(`Showing items related to student ${rollNo}`, 'info');
        }
    },

    renderAdminEmergencies() {
        const container = document.getElementById('admin-emergency-list');
        if (!container) return;

        const alerts = CampusStore.getEmergencyAlerts();
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-state-mini" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 24px; text-align: center;">
                    <p style="color: #34d399; font-weight: 700; font-size: 0.9rem;">🟢 No active emergency alerts currently filed.</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">All reported campus incidents have been dispatched and attended by Gate 1 Security.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(a => `
            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                    <div>
                        <span style="background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px;">ALERT #${a.alert_id}</span>
                        <span style="font-weight: 800; color: #fff; margin-left: 8px;">${a.incident_type}</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-dim);">${a.created_at}</span>
                </div>

                <div style="font-size: 0.8rem; color: #e2e8f0; margin-bottom: 8px;">
                    <strong>Location:</strong> ${a.location} • <strong>Reporter:</strong> ${a.reporter_name} (<span class="font-mono text-cyan-300">${a.reporter_roll_no}</span>) • 📞 ${a.reporter_phone}
                </div>

                <p style="font-size: 0.78rem; color: var(--text-muted); background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;">
                    ${a.details || 'No additional notes provided.'}
                </p>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.72rem; color: #fca5a5;">Dispatched to: <strong>${a.dispatched_to}</strong></span>
                    <button class="btn btn-xs btn-success" onclick="App.resolveEmergency(${a.alert_id})">
                        ✓ Mark Incident Resolved
                    </button>
                </div>
            </div>
        `).join('');
    },

    resolveEmergency(alertId) {
        const alert = CampusStore.emergencyAlerts.find(a => a.alert_id === alertId);
        if (alert) {
            alert.status = 'resolved';
            CampusStore.saveToStorage();
            this.renderAdminEmergencies();
            this.showToast(`Emergency alert #${alertId} marked as resolved.`, 'success');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
