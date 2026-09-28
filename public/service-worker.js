/**
 * CampusFind Service Worker (PWA & Offline Cache)
 * CampusFind 2.0 - SIH Showcase
 */
const CACHE_NAME = 'campusfind-tkrcet-v4';

const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/store.js',
    './js/matching.js',
    './js/demo-story.js',
    './js/sync-manager.js',
    './manifest.json',
    './assets/icon.svg'
];

// Install: Cache critical assets
self.addEventListener('install', event => {
    console.log('[CampusFind SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[CampusFind SW] Pre-caching offline app shell');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate: Cleanup previous caches
self.addEventListener('activate', event => {
    console.log('[CampusFind SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => {
                    console.log('[CampusFind SW] Removing old cache:', key);
                    return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Strategy for Static Assets & API calls
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Bypass non-GET requests (e.g. POST /api/items handled by SyncManager)
    if (event.request.method !== 'GET') {
        return;
    }

    // 1. API GET Requests: Network-First with Cache Fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    console.log('[CampusFind SW] Network failed, serving cached API for:', url.pathname);
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Offline fallback JSON
                    return new Response(JSON.stringify({
                        offline: true,
                        message: 'Working in offline mode. Cached data served.'
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // 2. Static Assets: Stale-While-Revalidate Strategy
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If offline and requesting root HTML, return cached index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html') || caches.match('/');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
