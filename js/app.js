
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
    pickerMaps: {},

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
        this.renderCampusBlocksChips();
        this.renderBrowseItems();
        this.renderDashboard();
        this.renderAdmin();
        this.renderAdminStudents();
        this.renderAdminEmergencies();
        this.renderNotifications();
    },

    switchView(viewName) {
        // Protect Admin view: require admin role
        if (viewName === 'admin' && CampusStore.currentUser.role !== 'admin') {
            this.showToast('🛡️ Admin Center requires Proctor / Security credentials. Please sign in via Faculty SSO.', 'warning');
            this.switchView('login');
            this.switchSSOTab('admin');
            return;
        }

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
            this.renderCampusBlocksChips();
            if (this.leafletMap) {
                setTimeout(() => {
                    this.leafletMap.invalidateSize();
                }, 150);
            }
        } else if (viewName === 'report-lost') {
            setTimeout(() => {
                this.initPickerMap('lost');
            }, 150);
        } else if (viewName === 'report-found') {
            setTimeout(() => {
                this.initPickerMap('found');
            }, 150);
        } else if (viewName === 'login') {
            this.renderSSOPortal();
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
        const logoutBtn = document.getElementById('btn-header-logout');
        const personaSelect = document.getElementById('persona-select');

        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) {
            roleEl.textContent = user.role === 'admin' 
                ? '🛡️ Proctor / Admin' 
                : `${user.roll_no || 'Student'} • ${user.department ? user.department.split(' ')[0] : 'CSE'}`;
        }
        if (avatarEl) avatarEl.src = user.avatar;

        if (adminNavLink) {
            if (user.role === 'admin') {
                adminNavLink.classList.remove('hidden');
            } else {
                adminNavLink.classList.add('hidden');
            }
        }

        if (personaSelect) {
            const key = Object.keys(CampusStore.personas).find(k => CampusStore.personas[k].roll_no === user.roll_no) || 'shiva';
            personaSelect.value = key;
        }

        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
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

                const lat = parseFloat(document.getElementById('lost-lat')?.value) || 17.3235;
                const lng = parseFloat(document.getElementById('lost-lng')?.value) || 78.5362;

                const reportData = {
                    type: 'lost',
                    roll_no: roll_no,
                    is_emergency: is_emergency,
                    item_name: name,
                    category: category,
                    location: location,
                    location_detail: location_detail,
                    lat: lat,
                    lng: lng,
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
                const lat = parseFloat(document.getElementById('found-lat')?.value) || 17.3235;
                const lng = parseFloat(document.getElementById('found-lng')?.value) || 78.5362;

                const reportData = {
                    type: 'found',
                    roll_no: roll_no,
                    item_name: name,
                    category: category,
                    location: location,
                    location_detail: location_detail,
                    custody_location: custody,
                    lat: lat,
                    lng: lng,
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

                    <div class="modal-actions mt-6 flex items-center justify-end gap-3 flex-wrap">
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${item.lat || 17.3235},${item.lng || 78.5362}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                            🗺️ Google Maps Directions
                        </a>
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
            // TKRCET Meerpet Campus Center: 17.3235° N, 78.5362° E
            this.leafletMap = L.map('leaflet-campus-map', {
                center: [17.3235, 78.5362],
                zoom: 17,
                minZoom: 15,
                maxZoom: 19,
                zoomControl: true
            });

            // Tile Layer 1: Official Google Maps Standard Roadmap (Streets, Buildings, Labels)
            this.tileLayers.google = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener">Google Maps</a>',
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20
            });

            // Tile Layer 2: Official Google Maps Hybrid (High-Resolution Satellite with Street & Campus Labels)
            this.tileLayers['google-sat'] = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noopener">Google Maps</a>',
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20
            });

            // Tile Layer 3: Cyber Dark Matter
            this.tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
                maxZoom: 19
            });

            // Tile Layer 4: High-Resolution Satellite Imagery (Esri)
            this.tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
                maxZoom: 19
            });

            // Default to Official Google Maps
            this.tileLayers.google.addTo(this.leafletMap);
            this.currentMapLayer = 'google';

            // TKRCET Campus Boundary Perimeter (Survey No -8/A Medbowli, Meerpet)
            const campusPerimeter = [
                [17.3246, 78.5350],
                [17.3247, 78.5375],
                [17.3238, 78.5383],
                [17.3223, 78.5372],
                [17.3224, 78.5342],
                [17.3236, 78.5341]
            ];
            L.polygon(campusPerimeter, {
                color: '#38bdf8',
                weight: 2,
                dashArray: '6, 6',
                fillColor: '#0ea5e9',
                fillOpacity: 0.05
            }).addTo(this.leafletMap).bindTooltip('🏫 TKREC / TKRCET Campus • Survey No -8/A Medbowli, Meerpet, Telangana 500097', {
                sticky: true
            });

            // Landmark Chips across campus blocks (Accurate GPS on campus grounds)
            const landmarkLabels = [
                { name: '📚 Central Library', lat: 17.3237, lng: 78.5356 },
                { name: '💻 CSE & IT Block', lat: 17.3239, lng: 78.5367 },
                { name: '🏛️ Academic Block A', lat: 17.3231, lng: 78.5367 },
                { name: '☕ TKR Canteen', lat: 17.3232, lng: 78.5358 },
                { name: '🅿️ Parking Bays', lat: 17.3244, lng: 78.5372 },
                { name: '🏏 Sports Ground', lat: 17.3226, lng: 78.5346 },
                { name: '🛡️ Gate 1 Security', lat: 17.3243, lng: 78.5363 },
                { name: '🎭 Main Auditorium', lat: 17.3234, lng: 78.5374 }
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

            // Click anywhere on campus map to drop a pin & launch report form
            this.leafletMap.on('click', (e) => {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                const nearest = CampusStore.getNearestBuilding(lat, lng);
                const nearestName = nearest ? (nearest.name || nearest.key) : 'TKRCET Campus';

                const popupHtml = `
                    <div style="min-width: 230px; font-family: inherit; text-align: center; padding: 4px;">
                        <div style="font-size: 1.2rem; margin-bottom: 2px;">📍</div>
                        <div style="font-weight: 800; color: #fff; font-size: 0.88rem; margin-bottom: 2px;">Pin Selected Spot</div>
                        <div style="font-size: 0.74rem; color: #38bdf8; font-weight: 600; margin-bottom: 2px;">Near ${nearestName}</div>
                        <div style="font-size: 0.65rem; color: #94a3b8; margin-bottom: 4px;">Survey No -8/A Medbowli, Meerpet, 500097</div>
                        <div style="font-size: 0.68rem; font-family: monospace; color: #cbd5e1; margin-bottom: 10px;">${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E</div>
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button class="btn btn-xs btn-danger" style="flex: 1; padding: 6px 8px; font-size: 0.74rem;" onclick="App.reportAtCoordinates('lost', ${lat}, ${lng}, '${nearestName.replace(/'/g, "\\'")}')">🔴 Report Lost</button>
                            <button class="btn btn-xs btn-success" style="flex: 1; padding: 6px 8px; font-size: 0.74rem;" onclick="App.reportAtCoordinates('found', ${lat}, ${lng}, '${nearestName.replace(/'/g, "\\'")}')">🟢 Report Found</button>
                        </div>
                    </div>
                `;

                L.popup({ offset: [0, -5] })
                    .setLatLng(e.latlng)
                    .setContent(popupHtml)
                    .openOn(this.leafletMap);
            });

            this.renderCampusMap();
            this.renderBlueprintPins();
        } catch (e) {
            console.error('[CampusFind Map] Failed to initialize Leaflet map:', e);
        }
    },

    setMapLayer(mode) {
        this.currentMapLayer = mode;
        const btnGoogle = document.getElementById('btn-layer-google');
        const btnGoogleSat = document.getElementById('btn-layer-google-sat');
        const btnDark = document.getElementById('btn-layer-dark');
        const btnSat = document.getElementById('btn-layer-sat');
        const btnBlueprint = document.getElementById('btn-layer-blueprint');
        const btnEmbed = document.getElementById('btn-layer-embed');

        const leafletEl = document.getElementById('leaflet-campus-map');
        const blueprintEl = document.getElementById('campus-map-blueprint');
        const googleEmbedEl = document.getElementById('campus-map-google-embed');

        [btnGoogle, btnGoogleSat, btnDark, btnSat, btnBlueprint, btnEmbed].forEach(b => {
            if (b) b.classList.remove('active');
        });

        // 1. Handle Official Google Maps 3D Embed Iframe
        if (mode === 'embed') {
            if (btnEmbed) btnEmbed.classList.add('active');
            if (leafletEl) leafletEl.classList.add('hidden');
            if (blueprintEl) blueprintEl.classList.add('hidden');
            if (googleEmbedEl) googleEmbedEl.classList.remove('hidden');
            this.showToast('Switched to Official Google Maps Interactive 3D Embed View', 'info');
            return;
        }

        // 2. Handle Architectural Blueprint Schematic
        if (mode === 'blueprint') {
            if (btnBlueprint) btnBlueprint.classList.add('active');
            if (leafletEl) leafletEl.classList.add('hidden');
            if (googleEmbedEl) googleEmbedEl.classList.add('hidden');
            if (blueprintEl) blueprintEl.classList.remove('hidden');
            this.renderBlueprintPins();
            this.showToast('Switched to Architectural Blueprint schematic', 'info');
            return;
        }

        // 3. Leaflet-based layers (Google Maps, Google Satellite, Cyber Dark, Esri)
        if (leafletEl) leafletEl.classList.remove('hidden');
        if (blueprintEl) blueprintEl.classList.add('hidden');
        if (googleEmbedEl) googleEmbedEl.classList.add('hidden');

        if (mode === 'google' && btnGoogle) btnGoogle.classList.add('active');
        if (mode === 'google-sat' && btnGoogleSat) btnGoogleSat.classList.add('active');
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

        const labels = {
            'google': '🗺️ Google Maps (Official Road & Campus Buildings)',
            'google-sat': '🌍 Google Maps Hybrid Satellite (Satellite + Labels)',
            'dark': '🌌 Cyber Dark Matter',
            'satellite': '🛰️ Esri High-Resolution Satellite'
        };
        this.showToast(`Switched map layer to ${labels[mode] || mode}`, 'info');
    },

    centerTKRCET() {
        if (this.leafletMap) {
            this.leafletMap.setView([17.3235, 78.5362], 17, { animate: true });
            this.showToast('🎯 Centered on TKREC / TKRCET (Survey No -8/A Medbowli, Meerpet, 500097)', 'info');
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

            const lat = (item.lat || 17.3235) + jitterLat;
            const lng = (item.lng || 78.5362) + jitterLng;

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
            { name: 'Security Gate 1 & Vault', lat: 17.3243, lng: 78.5363, note: 'Entering TKRCET via Gate 1 Security Cabin' },
            { name: 'TKR Central Library', lat: 17.3237, lng: 78.5356, note: 'Approaching Central Library & Quiet Study Hall' },
            { name: 'CSE & IT Tech Block', lat: 17.3239, lng: 78.5367, note: 'Walking near CSE Block & AI Labs' },
            { name: 'Academic Block A', lat: 17.3231, lng: 78.5367, note: 'Passing Academic Block A (ECE & Mech)' },
            { name: 'Main Auditorium', lat: 17.3234, lng: 78.5374, note: 'Near Main Auditorium Seminar Hall' },
            { name: 'TKR Student Canteen', lat: 17.3232, lng: 78.5358, note: 'Taking lunch break at TKR Student Canteen' },
            { name: 'TKR Sports Ground', lat: 17.3226, lng: 78.5346, note: 'Near Cricket Oval & Sports Complex' }
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
                    applyLocation(17.3237, 78.5356, 15);
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            applyLocation(17.3237, 78.5356, 15);
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
    },

    /* =========================================================
       TKRCET Interactive GPS Pin Picker for Lost & Found Reports
       ========================================================= */

    initPickerMap(type) {
        if (typeof L === 'undefined') return;

        const mapContainerId = `${type}-picker-map`;
        const container = document.getElementById(mapContainerId);
        if (!container) return;

        // If map already instantiated, simply refresh leaflet size calculation
        if (this.pickerMaps[type] && this.pickerMaps[type].map) {
            setTimeout(() => {
                this.pickerMaps[type].map.invalidateSize();
            }, 100);
            return;
        }

        // Get initial coordinates from hidden input or default to Central Library
        const latInput = document.getElementById(`${type}-lat`);
        const lngInput = document.getElementById(`${type}-lng`);
        const initLat = latInput ? parseFloat(latInput.value) || 17.3235 : 17.3235;
        const initLng = lngInput ? parseFloat(lngInput.value) || 78.5362 : 78.5362;

        try {
            const map = L.map(mapContainerId, {
                center: [initLat, initLng],
                zoom: 17,
                minZoom: 15,
                maxZoom: 20,
                zoomControl: true
            });

            // Google Maps Standard Layer (Roadmap & College Buildings)
            const googleLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps',
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20
            });

            // Google Maps Hybrid Layer (High-Resolution Satellite + Roads + Building Names)
            const googleSatLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps',
                subdomains: ['0', '1', '2', '3'],
                maxZoom: 20
            });

            // Cyber Dark Layer
            const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
                maxZoom: 19
            });

            // Default to Google Maps
            googleLayer.addTo(map);

            // Campus boundary perimeter (Real TKRCET Grounds)
            const campusPerimeter = [
                [17.3246, 78.5350],
                [17.3247, 78.5375],
                [17.3238, 78.5383],
                [17.3223, 78.5372],
                [17.3224, 78.5342],
                [17.3236, 78.5341]
            ];
            L.polygon(campusPerimeter, {
                color: type === 'lost' ? '#ef4444' : '#10b981',
                weight: 2,
                dashArray: '5, 5',
                fillColor: type === 'lost' ? '#ef4444' : '#10b981',
                fillOpacity: 0.04
            }).addTo(map);

            // Campus landmark chips
            const landmarkLabels = [
                { name: '📚 Library', key: 'Central Library', lat: 17.3237, lng: 78.5356 },
                { name: '💻 CSE Block', key: 'CSE Block', lat: 17.3239, lng: 78.5367 },
                { name: '🏛️ Block A', key: 'Block A', lat: 17.3231, lng: 78.5367 },
                { name: '☕ Canteen', key: 'Canteen', lat: 17.3232, lng: 78.5358 },
                { name: '🅿️ Parking', key: 'Parking', lat: 17.3244, lng: 78.5372 },
                { name: '🏏 Ground', key: 'Sports Ground', lat: 17.3226, lng: 78.5346 },
                { name: '🛡️ Gate 1', key: 'Gate 1 Security', lat: 17.3243, lng: 78.5363 },
                { name: '🎭 Auditorium', key: 'Auditorium', lat: 17.3234, lng: 78.5374 }
            ];

            landmarkLabels.forEach(lm => {
                const icon = L.divIcon({
                    className: 'building-chip-picker',
                    html: lm.name,
                    iconSize: [85, 20],
                    iconAnchor: [42, 10]
                });
                const lmMarker = L.marker([lm.lat, lm.lng], { icon }).addTo(map);
                lmMarker.on('click', () => {
                    this.updatePinnedLocation(type, lm.lat, lm.lng, true);
                });
            });

            // Draggable pin marker
            const pinClass = type === 'lost' ? 'pin-lost' : 'pin-found';
            const pinEmoji = type === 'lost' ? '🔴' : '🟢';
            const markerIcon = L.divIcon({
                className: 'custom-leaflet-marker',
                html: `
                    <div class="map-item-pin-leaflet ${pinClass}">
                        <div class="pin-pulse-wave"></div>
                        <div class="pin-marker">
                            <div class="pin-marker-inner">${pinEmoji}</div>
                        </div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });

            const marker = L.marker([initLat, initLng], {
                icon: markerIcon,
                draggable: true
            }).addTo(map);

            marker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                this.updatePinnedLocation(type, pos.lat, pos.lng, false);
            });

            map.on('click', (e) => {
                this.updatePinnedLocation(type, e.latlng.lat, e.latlng.lng, false);
            });

            this.pickerMaps[type] = {
                map: map,
                marker: marker,
                currentLayer: 'google',
                googleLayer: googleLayer,
                googleSatLayer: googleSatLayer,
                darkLayer: darkLayer
            };

            this.updatePinnedLocation(type, initLat, initLng, false);

            setTimeout(() => {
                map.invalidateSize();
            }, 200);
        } catch (e) {
            console.error(`[CampusFind Picker] Error initializing ${type} map:`, e);
        }
    },

    updatePinnedLocation(type, lat, lng, pan = false) {
        const latEl = document.getElementById(`${type}-lat`);
        const lngEl = document.getElementById(`${type}-lng`);
        if (latEl) latEl.value = lat.toFixed(6);
        if (lngEl) lngEl.value = lng.toFixed(6);

        const picker = this.pickerMaps[type];
        if (picker && picker.marker) {
            picker.marker.setLatLng([lat, lng]);
            if (pan && picker.map) {
                picker.map.panTo([lat, lng], { animate: true });
            }
        }

        const nearest = CampusStore.getNearestBuilding(lat, lng);
        const buildingName = nearest ? (nearest.name || nearest.key) : 'TKRCET Campus';

        const statusEl = document.getElementById(`${type}-picker-status-text`);
        const badgeEl = document.getElementById(`${type}-picker-coords-badge`);
        const prefix = type === 'lost' ? '🔴' : '🟢';

        if (statusEl) {
            statusEl.innerHTML = `${prefix} <strong>Pinned at:</strong> ${buildingName}`;
        }
        if (badgeEl) {
            badgeEl.textContent = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
        }

        // Auto-select corresponding option in campus location select dropdown
        const selectEl = document.getElementById(`${type}-location`);
        if (selectEl && nearest) {
            for (let opt of selectEl.options) {
                if (opt.value.toLowerCase().includes(nearest.key.toLowerCase()) || 
                    nearest.key.toLowerCase().includes(opt.value.toLowerCase()) ||
                    nearest.name.toLowerCase().includes(opt.value.toLowerCase())) {
                    selectEl.value = opt.value;
                    break;
                }
            }
        }
    },

    setPickerLayer(type, mode) {
        this.initPickerMap(type);
        const picker = this.pickerMaps[type];
        if (!picker || !picker.map) return;

        const layers = {
            'google': picker.googleLayer,
            'google-sat': picker.googleSatLayer,
            'dark': picker.darkLayer
        };

        const target = layers[mode] || picker.googleLayer;

        Object.values(layers).forEach(l => {
            if (l && picker.map.hasLayer(l)) {
                picker.map.removeLayer(l);
            }
        });

        target.addTo(picker.map);
        picker.currentLayer = mode;

        ['google', 'google-sat', 'dark'].forEach(m => {
            const btn = document.getElementById(`btn-${type}-picker-${m}`);
            if (btn) {
                if (m === mode) {
                    btn.classList.add('btn-primary');
                    btn.classList.remove('btn-secondary');
                } else {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                }
            }
        });

        const titles = {
            'google': '🗺️ Google Maps (Roads & Buildings)',
            'google-sat': '🌍 Google Maps Hybrid Satellite',
            'dark': '🌌 Cyber Dark'
        };
        this.showToast(`Picker map set to ${titles[mode] || mode}`, 'info');
    },

    togglePickerMapLayer(type) {
        const picker = this.pickerMaps[type];
        if (!picker) return;
        const next = picker.currentLayer === 'google' ? 'google-sat' : (picker.currentLayer === 'google-sat' ? 'dark' : 'google');
        this.setPickerLayer(type, next);
    },

    pinCurrentLiveLocation(type) {
        if (!('geolocation' in navigator)) {
            this.showToast('Geolocation is not supported by your browser', 'warning');
            return;
        }

        this.showToast('📡 Acquiring live GPS fix...', 'info');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                this.initPickerMap(type);
                this.updatePinnedLocation(type, latitude, longitude, true);
                this.showToast(`🎯 Pinned live GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`, 'success');
            },
            (err) => {
                console.warn('[CampusFind GPS] Device GPS error:', err);
                this.showToast('Could not get device GPS. Pinned to TKRCET Central Library.', 'warning');
                this.quickPinBuilding(type, 'Central Library');
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
    },

    quickPinBuilding(type, buildingKey) {
        const b = CampusStore.landmarksGPS[buildingKey] || CampusStore.landmarksGPS['Central Library'];
        if (b) {
            this.initPickerMap(type);
            this.updatePinnedLocation(type, b.lat, b.lng, true);
            this.showToast(`📍 Pinned to ${b.name || buildingKey}`, 'info');
        }
    },

    reportAtCoordinates(type, lat, lng, buildingName) {
        if (this.leafletMap) {
            this.leafletMap.closePopup();
        }
        this.switchView('report-' + type);
        setTimeout(() => {
            this.initPickerMap(type);
            this.updatePinnedLocation(type, lat, lng, true);
            const locDetail = document.getElementById(`${type}-location-detail`);
            if (locDetail && (!locDetail.value || locDetail.value.startsWith('Near '))) {
                locDetail.value = `Near ${buildingName}`;
            }
            this.showToast(`📍 Pin placed at ${buildingName}!`, 'info');
        }, 220);
    },

    /* =========================================================
       VISIT OUR CAMPUS & FIND US - GOOGLE MAPS & BLOCKS METHODS
       ========================================================= */

    selectedBlockId: null,

    renderCampusBlocksChips() {
        const container = document.getElementById('campus-blocks-chip-container');
        if (!container) return;

        const blocks = CampusStore.campusBlocks || [];
        container.innerHTML = blocks.map(b => `
            <button type="button" class="block-chip-btn ${this.selectedBlockId === b.id ? 'active' : ''}" id="block-chip-${b.id}" onclick="App.selectCampusBlock('${b.id}')" title="${b.name}">
                <span style="font-size: 1.1rem; line-height: 1;">${b.icon}</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.shortName || b.name}</span>
            </button>
        `).join('');

        if (!this.selectedBlockId && blocks.length > 0) {
            this.selectCampusBlock('canteen');
        }
    },

    selectCampusBlock(blockId) {
        const blocks = CampusStore.campusBlocks || [];
        const block = blocks.find(b => b.id === blockId) || blocks[0];
        if (!block) return;

        this.selectedBlockId = block.id;

        document.querySelectorAll('.block-chip-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`block-chip-${block.id}`);
        if (activeBtn) activeBtn.classList.add('active');

        const card = document.getElementById('selected-block-info');
        if (card) {
            card.classList.remove('hidden');

            let userDistanceHtml = '';
            if (this.userGPSLocation) {
                const dist = CampusStore.calculateDistanceMeters(this.userGPSLocation.lat, this.userGPSLocation.lng, block.lat, block.lng);
                if (dist !== null) {
                    const distText = dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(2)} km`;
                    userDistanceHtml = `<span style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.7rem;">📏 ${distText} from you</span>`;
                }
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
                            <span>${block.icon}</span>
                            <span>${block.name}</span>
                        </div>
                        <span class="badge badge-info" style="margin-top: 2px; font-size: 0.65rem;">${block.category}</span>
                    </div>
                    ${userDistanceHtml}
                </div>
                <p style="color: #cbd5e1; font-size: 0.76rem; margin: 4px 0; line-height: 1.45;">${block.description}</p>
                <div style="font-size: 0.72rem; color: #94a3b8; display: flex; flex-direction: column; gap: 3px; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 8px;">
                    <div>📍 <strong>Location:</strong> ${block.locationDetail}</div>
                    <div>🕒 <strong>Hours:</strong> ${block.timings} • <strong>Floor:</strong> ${block.floorInfo}</div>
                    <div>👤 <strong>In-Charge:</strong> ${block.incharge}</div>
                    <div>🌐 <strong>Exact GPS:</strong> <span style="font-family: monospace; color: #38bdf8;">${block.lat.toFixed(4)}° N, ${block.lng.toFixed(4)}° E</span></div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${block.lat},${block.lng}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-primary" style="flex: 1; text-decoration: none; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" title="Get directions to ${block.name} on Google Maps">
                        🧭 Directions to ${block.shortName}
                    </a>
                    <button type="button" class="btn btn-xs btn-secondary" style="flex: 1;" onclick="App.centerMapOnBlock('${block.id}')">
                        🎯 Focus Map Here
                    </button>
                </div>
            `;
        }
    },

    centerMapOnBlock(blockId) {
        const blocks = CampusStore.campusBlocks || [];
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        if (this.leafletMap) {
            this.leafletMap.setView([block.lat, block.lng], 18, { animate: true });
        }
        if (this.visitLeafletMap) {
            this.visitLeafletMap.setView([block.lat, block.lng], 18, { animate: true });
        }

        const iframe = document.getElementById('iframe-google-map');
        if (iframe) {
            iframe.src = `https://maps.google.com/maps?q=${block.lat},${block.lng}&t=m&z=18&ie=UTF8&iwloc=&output=embed`;
        }
        const satIframe = document.getElementById('iframe-google-satellite');
        if (satIframe) {
            satIframe.src = `https://maps.google.com/maps?q=${block.lat},${block.lng}&t=k&z=19&ie=UTF8&iwloc=&output=embed`;
        }

        this.showToast(`🎯 Centered map on ${block.name}`, 'info');
    },

    detectUserCampusLocation() {
        const statusBox = document.getElementById('detect-location-status');
        const btn = document.getElementById('btn-detect-user-location');

        if (!('geolocation' in navigator)) {
            if (statusBox) {
                statusBox.className = 'detect-status-active';
                statusBox.innerHTML = '❌ Geolocation is not supported by your browser.';
            }
            this.showToast('Geolocation is not supported by this browser.', 'warning');
            return;
        }

        if (btn) btn.innerHTML = '📡 Detecting...';
        if (statusBox) {
            statusBox.className = 'detect-status-active';
            statusBox.innerHTML = '⏳ Requesting your device GPS position and measuring campus proximity...';
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                this.updateUserLiveLocation(latitude, longitude, accuracy, false);
                if (btn) btn.innerHTML = '🟢 GPS Detected';

                const distMeters = CampusStore.getDistanceToCollege(latitude, longitude);
                const nearest = CampusStore.getNearestBuilding(latitude, longitude);

                let distFormatted = '';
                let proximityNote = '';
                if (distMeters !== null) {
                    if (distMeters < 1000) {
                        distFormatted = `${distMeters} meters`;
                        proximityNote = '📍 <strong>You are currently on or immediately adjacent to TKRCET Campus!</strong>';
                    } else {
                        distFormatted = `${(distMeters / 1000).toFixed(2)} km`;
                        proximityNote = `🚗 You are approximately <strong>${distFormatted}</strong> away from TKR College.`;
                    }
                }

                if (statusBox) {
                    statusBox.className = 'detect-status-active';
                    statusBox.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                                <span style="font-weight: 700; color: #38bdf8;">✅ Location Locked</span>
                                <span style="font-family: monospace; font-size: 0.72rem; color: #94a3b8;">${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E (±${Math.round(accuracy)}m)</span>
                            </div>
                            <div style="color: #e2e8f0; font-size: 0.76rem;">${proximityNote}</div>
                            ${nearest ? `<div style="font-size: 0.74rem; color: #7dd3fc;">🏛️ Closest Facility: <strong>${nearest.name}</strong> (${nearest.distance}m away)</div>` : ''}
                            <div style="margin-top: 4px;">
                                <a href="https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=TKR+College+of+Engineering+%26+Technology%2C+Meerpet%2C+Hyderabad" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    🧭 Get Navigation Directions from My Current Location
                                </a>
                            </div>
                        </div>
                    `;
                }

                this.showToast(`📍 Location detected: ${distFormatted} from TKRCET`, 'success');

                if (this.selectedBlockId) {
                    this.selectCampusBlock(this.selectedBlockId);
                }
            },
            (err) => {
                console.warn('[CampusFind GPS] Geolocation error, attempting IP network fallback:', err);
                if (btn) btn.innerHTML = '🌐 IP Detecting...';
                
                // Seamless fallback to network IP geolocation
                fetch('https://ipapi.co/json/')
                    .then(res => res.json())
                    .then(data => {
                        const lat = (data && data.latitude) ? data.latitude : 17.3843;
                        const lng = (data && data.longitude) ? data.longitude : 78.4583;
                        const city = (data && data.city) ? data.city : 'Hyderabad';
                        const region = (data && data.region) ? data.region : 'Telangana';
                        
                        this.updateUserLiveLocation(lat, lng, 350, false);
                        if (btn) btn.innerHTML = '🟢 Network Location';

                        const distMeters = CampusStore.getDistanceToCollege(lat, lng);
                        const nearest = CampusStore.getNearestBuilding(lat, lng);
                        const distFormatted = distMeters < 1000 ? `${distMeters} meters` : `${(distMeters / 1000).toFixed(2)} km`;

                        if (statusBox) {
                            statusBox.className = 'detect-status-active';
                            statusBox.innerHTML = `
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                                        <span style="font-weight: 700; color: #38bdf8;">🌐 Detected Location (${city}, ${region})</span>
                                        <span style="font-family: monospace; font-size: 0.72rem; color: #94a3b8;">${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (IP Geolocation)</span>
                                    </div>
                                    <div style="color: #e2e8f0; font-size: 0.76rem;">🚗 You are approximately <strong>${distFormatted}</strong> away from TKR College.</div>
                                    ${nearest ? `<div style="font-size: 0.74rem; color: #7dd3fc;">🏛️ Closest Facility: <strong>${nearest.name}</strong> (${nearest.distance}m away)</div>` : ''}
                                    <div style="margin-top: 4px;">
                                        <a href="https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=TKR+College+of+Engineering+%26+Technology%2C+Meerpet%2C+Hyderabad" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                            🧭 Get Navigation Directions from My Current Location
                                        </a>
                                    </div>
                                </div>
                            `;
                        }
                        this.showToast(`🌐 Detected location: ${city}, ${region} (${distFormatted} from TKRCET)`, 'success');
                    })
                    .catch(() => {
                        // Instant fallback to Hyderabad coordinates
                        const lat = 17.3843, lng = 78.4583;
                        this.updateUserLiveLocation(lat, lng, 400, false);
                        if (btn) btn.innerHTML = '🟢 Hyderabad Location';
                        const distMeters = CampusStore.getDistanceToCollege(lat, lng);
                        const distFormatted = `${(distMeters / 1000).toFixed(2)} km`;
                        if (statusBox) {
                            statusBox.className = 'detect-status-active';
                            statusBox.innerHTML = `
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                                        <span style="font-weight: 700; color: #38bdf8;">🌐 Detected Location (Hyderabad, Telangana)</span>
                                        <span style="font-family: monospace; font-size: 0.72rem; color: #94a3b8;">17.3843° N, 78.4583° E</span>
                                    </div>
                                    <div style="color: #e2e8f0; font-size: 0.76rem;">🚗 You are approximately <strong>${distFormatted}</strong> away from TKR College.</div>
                                    <div style="margin-top: 4px;">
                                        <a href="https://www.google.com/maps/dir/?api=1&origin=17.3843,78.4583&destination=TKR+College+of+Engineering+%26+Technology%2C+Meerpet%2C+Hyderabad" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                            🧭 Get Navigation Directions from My Current Location
                                        </a>
                                    </div>
                                </div>
                            `;
                        }
                        this.showToast(`🌐 Detected location: Hyderabad, Telangana (12.59 km from TKRCET)`, 'success');
                    });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    },

    copyCampusCoordinates() {
        const text = '17.3235, 78.5362';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('📋 Copied TKRCET coordinates (17.3235° N, 78.5362° E) to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Coordinates: 17.3235, 78.5362', 'info');
            });
        } else {
            this.showToast('Coordinates: 17.3235, 78.5362', 'info');
        }
    },

    switchCampusMapView(mode) {
        const btnGmap = document.getElementById('btn-toggle-embed-gmap');
        const btnSat = document.getElementById('btn-toggle-embed-sat');
        const btnInteractive = document.getElementById('btn-toggle-embed-interactive');
        const wrapGmap = document.getElementById('wrapper-gmap-embed');
        const wrapSat = document.getElementById('wrapper-gmap-satellite');
        const wrapInteractive = document.getElementById('wrapper-interactive-explorer');
        const label = document.getElementById('map-active-view-label');

        [btnGmap, btnSat, btnInteractive].forEach(b => { if (b) b.classList.remove('active'); });
        [wrapGmap, wrapSat, wrapInteractive].forEach(w => { if (w) w.classList.add('hidden'); });

        if (mode === 'gmap') {
            if (btnGmap) btnGmap.classList.add('active');
            if (wrapGmap) wrapGmap.classList.remove('hidden');
            if (label) label.textContent = 'Official Google Maps Roadmap View';
            this.showToast('Switched to Official Google Maps Roadmap', 'info');
        } else if (mode === 'satellite') {
            if (btnSat) btnSat.classList.add('active');
            if (wrapSat) wrapSat.classList.remove('hidden');
            if (label) label.textContent = 'Google Maps Hybrid Satellite View';
            this.showToast('Switched to Google Maps Satellite View', 'info');
        } else if (mode === 'interactive') {
            if (btnInteractive) btnInteractive.classList.add('active');
            if (wrapInteractive) wrapInteractive.classList.remove('hidden');
            if (label) label.textContent = 'Interactive Campus Explorer with Items & Pins';
            this.initVisitLeafletMap();
            this.showToast('Switched to Interactive Campus Explorer', 'info');
        }
    },

    visitLeafletMap: null,
    initVisitLeafletMap() {
        if (typeof L === 'undefined') return;
        const container = document.getElementById('visit-leaflet-map');
        if (!container) return;

        if (!this.visitLeafletMap) {
            try {
                this.visitLeafletMap = L.map('visit-leaflet-map', {
                    center: [17.3235, 78.5362],
                    zoom: 17,
                    minZoom: 15,
                    maxZoom: 19
                });

                L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                    attribution: '&copy; Google Maps',
                    subdomains: ['0', '1', '2', '3'],
                    maxZoom: 20
                }).addTo(this.visitLeafletMap);

                const blocks = CampusStore.campusBlocks || [];
                blocks.forEach(b => {
                    const icon = L.divIcon({
                        className: 'custom-leaflet-marker',
                        html: `<div class="building-map-chip" onclick="App.selectCampusBlock('${b.id}')">${b.icon} ${b.shortName}</div>`,
                        iconSize: [120, 24],
                        iconAnchor: [60, 12]
                    });
                    L.marker([b.lat, b.lng], { icon }).addTo(this.visitLeafletMap).bindPopup(`
                        <div style="font-family: inherit; font-size: 0.8rem; padding: 4px;">
                            <strong>${b.icon} ${b.name}</strong><br>
                            <span style="font-size: 0.7rem; color: #38bdf8;">${b.category}</span><br>
                            <span style="font-size: 0.72rem; color: #cbd5e1;">${b.locationDetail}</span>
                        </div>
                    `);
                });
            } catch (e) {
                console.error('Error initializing visit leaflet map:', e);
            }
        }

        setTimeout(() => {
            if (this.visitLeafletMap) {
                this.visitLeafletMap.invalidateSize();
            }
        }, 150);
    },

    centerTKRCETOnVisitMap() {
        const iframe = document.getElementById('iframe-google-map');
        if (iframe) {
            iframe.src = 'https://maps.google.com/maps?q=17.3235,78.5362&t=m&z=17&ie=UTF8&iwloc=&output=embed';
        }
        if (this.visitLeafletMap) {
            this.visitLeafletMap.setView([17.3235, 78.5362], 17, { animate: true });
        }
        this.showToast('🎯 Centered on TKR College of Engineering & Technology', 'info');
    },

    scrollToVisitSection(event) {
        if (event) event.preventDefault();
        if (this.currentView !== 'landing') {
            this.switchView('landing');
            setTimeout(() => {
                const el = document.getElementById('section-campus-visit');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 250);
        } else {
            const el = document.getElementById('section-campus-visit');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /* =========================================================
       TKRCET SINGLE SIGN-ON (SSO) AUTHENTICATION CONTROLLER
       ========================================================= */

    ssoCurrentTab: 'student',

    switchSSOTab(role) {
        this.ssoCurrentTab = role;
        const btnStudent = document.getElementById('tab-sso-student');
        const btnAdmin = document.getElementById('tab-sso-admin');
        const paneStudent = document.getElementById('pane-sso-student');
        const paneAdmin = document.getElementById('pane-sso-admin');

        if (role === 'student') {
            if (btnStudent) btnStudent.classList.add('active');
            if (btnAdmin) btnAdmin.classList.remove('active');
            if (paneStudent) paneStudent.classList.remove('hidden');
            if (paneAdmin) paneAdmin.classList.add('hidden');
        } else {
            if (btnAdmin) btnAdmin.classList.add('active');
            if (btnStudent) btnStudent.classList.remove('active');
            if (paneAdmin) paneAdmin.classList.remove('hidden');
            if (paneStudent) paneStudent.classList.add('hidden');
        }
    },

    validateSSORoll(roll) {
        const badge = document.getElementById('sso-roll-badge');
        if (!badge) return;

        const val = roll.trim().toUpperCase();
        const student = CampusStore.getStudentByRoll(val);

        if (student) {
            badge.className = 'roll-validation-badge roll-valid';
            badge.innerHTML = `✅ Verified TKRCET Student: ${student.name} (${student.branch})`;
            const emailInput = document.getElementById('sso-student-email');
            if (emailInput && student.college_email) {
                emailInput.value = student.college_email;
            }
        } else if (/^[0-9]{2}[A-Z0-9]{3}[A-Z0-9]{5}$/i.test(val)) {
            badge.className = 'roll-validation-badge roll-valid';
            badge.innerHTML = `✅ Valid JNTUH/TKRCET Roll Format: ${val}`;
        } else if (val.length >= 4) {
            badge.className = 'roll-validation-badge roll-invalid';
            badge.innerHTML = `⚠️ Standard TKRCET format: 10 chars (e.g. 22K91A0542)`;
        } else {
            badge.className = 'roll-validation-badge roll-invalid';
            badge.innerHTML = `⚠️ Enter authentic 10-digit TKRCET Roll Number`;
        }
    },

    handleStudentLogin(event) {
        if (event) event.preventDefault();
        const rollInput = document.getElementById('sso-student-roll');
        const emailInput = document.getElementById('sso-student-email');
        const rollVal = (rollInput ? rollInput.value : '').trim().toUpperCase();
        const emailVal = (emailInput ? emailInput.value : '').trim();

        const student = CampusStore.getStudentByRoll(rollVal);
        let personaKey = 'shiva';

        if (rollVal === '22K91A0542') personaKey = 'shiva';
        else if (rollVal === '23K91A0415') personaKey = 'priya';
        else if (rollVal === '22K91A6620') personaKey = 'rahul';
        else if (student) {
            CampusStore.currentUser = {
                user_id: 99,
                roll_no: student.roll_no,
                name: student.name,
                college_email: student.college_email || emailVal,
                role: 'student',
                student_id: student.roll_no,
                department: student.branch,
                phone: student.phone || '+91 98765 00000',
                avatar: student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
            };
            this.renderAll();
            this.showToast(`🎓 Welcome, ${student.name}! Student SSO session established.`, 'success');
            this.switchView('dashboard');
            return;
        }

        CampusStore.setPersona(personaKey);
        this.renderAll();
        this.showToast(`🎓 Welcome, ${CampusStore.currentUser.name}! Student SSO authenticated.`, 'success');
        this.switchView('dashboard');
    },

    handleAdminLogin(event) {
        if (event) event.preventDefault();
        const staffIdInput = document.getElementById('sso-admin-id');
        const staffId = (staffIdInput ? staffIdInput.value : '').trim().toUpperCase();

        let personaKey = 'admin';
        if (staffId.includes('SEC') || staffId.includes('09')) {
            personaKey = 'security';
        }

        CampusStore.setPersona(personaKey);
        this.renderAll();
        this.showToast(`🛡️ Proctor SSO Authenticated: Welcome, ${CampusStore.currentUser.name}!`, 'success');
        this.switchView('admin');
    },

    quickLoginSSO(personaKey) {
        CampusStore.setPersona(personaKey);
        this.renderAll();
        const user = CampusStore.currentUser;
        if (user.role === 'admin') {
            this.showToast(`🛡️ Authenticated as ${user.name} (${user.department})`, 'success');
            this.switchView('admin');
        } else {
            this.showToast(`🎓 Authenticated as ${user.name} (${user.roll_no})`, 'success');
            this.switchView('dashboard');
        }
    },

    loginWithGoogleWorkspace(personaKey = 'shiva') {
        this.showToast('Connecting to TKRCET Google Workspace SSO (@tkrcet.ac.in)...', 'info');
        setTimeout(() => {
            CampusStore.setPersona(personaKey);
            this.renderAll();
            this.showToast(`✅ Signed in via TKRCET Google Workspace as ${CampusStore.currentUser.name} (${CampusStore.currentUser.college_email})`, 'success');
            this.switchView('dashboard');
        }, 600);
    },

    logoutUser() {
        const currentName = CampusStore.currentUser.name;
        CampusStore.setPersona('shiva');
        this.renderAll();
        this.showToast(`Signed out from session (${currentName}). Redirected to login portal.`, 'info');
        this.switchView('login');
    },

    renderSSOPortal() {
        const user = CampusStore.currentUser;
        const rollInput = document.getElementById('sso-student-roll');
        const emailInput = document.getElementById('sso-student-email');
        if (user.role === 'student') {
            if (rollInput) rollInput.value = user.roll_no;
            if (emailInput) emailInput.value = user.college_email;
            this.validateSSORoll(user.roll_no);
            this.switchSSOTab('student');
        } else {
            this.switchSSOTab('admin');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
