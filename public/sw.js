// ── Service Worker Configuration ────────────────────────────────────────────
const CONFIG = {
  // Cache versioning - bump this number on every content-changing deploy
  // to force old caches to be deleted on activate.
  CACHE_VERSION: '2.5.1',

  // Cache names
  CACHE_NAMES: {
    STATIC: 'resumeai-static',
    DYNAMIC: 'resumeai-dynamic',
    FONTS: 'resumeai-fonts',
    IMAGES: 'resumeai-images',
    PAGES: 'resumeai-pages',
  },

  // Cache limits (max items)
  LIMITS: {
    DYNAMIC: 50,
    IMAGES: 30,
    PAGES: 20,
    FONTS: 10,
  },

  // Time before stale resources are revalidated (ms)
  STALE_TIMEOUT: 30 * 60 * 1000, // 30 minutes

  // Precache list - only files that actually exist in /public.
  // (Removed /offline.html - that file does not exist in public/.)
  PRECACHE_URLS: ['/', '/index.html', '/manifest.json', '/favicon.ico'],

  // Cache strategies per resource type.
  // Note: STATIC_ASSETS (JS/CSS bundles) are intentionally bypassed in the
  // fetch handler below - webpack chunks change on every deploy and must
  // not be served stale from the SW cache.
  STRATEGIES: {
    NAVIGATION: 'network-first',
    FONTS: 'cache-first',
    IMAGES: 'stale-while-revalidate',
  },

  // URL patterns to exclude from caching
  EXCLUDE_PATTERNS: [
    '/api/',
    '/__/',
    'firestore',
    'googleapis',
    'sentry',
    'analytics',
    'gtag',
    'gtm',
    'hot-update',
    'chrome-extension',
    'sockjs-node',
    '.json',
  ],
};

// ── Utility Functions ───────────────────────────────────────────────────────

/**
 * Builds a cache key from the config parameters.
 * This allows easy cache invalidation when version changes.
 */
const getCacheName = (type) => {
  return `${CONFIG.CACHE_NAMES[type]}-v${CONFIG.CACHE_VERSION}`;
};

/**
 * Checks if a URL should be excluded from caching.
 */
const shouldExclude = (url) => {
  return CONFIG.EXCLUDE_PATTERNS.some((pattern) => url.includes(pattern));
};

/**
 * Determines the resource type based on URL or content-type.
 */
const getResourceType = (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const destination = request.destination;

  if (destination === 'font' || pathname.includes('fonts.')) return 'FONTS';
  if (destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)) return 'IMAGES';
  if (destination === 'document' || request.mode === 'navigate') return 'PAGES';

  return 'DYNAMIC';
};

/**
 * Trims a cache to stay within its size limit.
 * Called after every cache write instead of using setInterval - SWs are
 * terminated after ~30s of idle time, so timers never fire.
 */
const trimCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`🗑️ Trimmed ${deleteCount} items from ${cacheName}`);
  }
};

/**
 * Network-first strategy (best for HTML pages).
 * Falls back to cache if network fails, then to offline fallback.
 */
const networkFirst = async (request, cacheName) => {
  try {
    const networkResponse = await fetch(request);

    // Cache valid responses
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // SPA: serve cached shell for navigations (avoids synthetic 503 on flaky networks)
    if (request.mode === 'navigate') {
      const indexShell =
        (await caches.match('/index.html')) ||
        (await caches.match(new URL('/index.html', self.location.origin).href));
      if (indexShell) {
        return indexShell;
      }
    }

    return new Response('You are offline and this resource is not cached.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
};

/**
 * Cache-first strategy (best for versioned assets like fonts).
 * Falls back to network if not in cache.
 */
const cacheFirst = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is stale
    const cacheTime = getCacheTime(cachedResponse);
    if (cacheTime && Date.now() - cacheTime > CONFIG.STALE_TIMEOUT) {
      // Stale - update in background (fire and forget)
      updateCache(request, cacheName);
    }
    return cachedResponse;
  }

  // Not in cache, try network
  return networkFirst(request, cacheName);
};

/**
 * Stale-while-revalidate strategy (best for images and non-critical content).
 * Returns cached version immediately, updates cache in background.
 */
const staleWhileRevalidate = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  const fetchPromise = updateCache(request, cacheName);

  if (cachedResponse) {
    void fetchPromise;
    return cachedResponse;
  }

  const resolved = await fetchPromise;
  if (resolved) {
    return resolved;
  }

  return new Response('Resource unavailable while offline.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({ 'Content-Type': 'text/plain' }),
  });
};

/**
 * Updates cache with fresh network response.
 * Runs a trim after every write so caches stay within their size limit -
 * this replaces the previous setInterval approach which never fired because
 * service workers are terminated after ~30s of idle time.
 */
const updateCache = async (request, cacheName) => {
  try {
    const cache = await caches.open(cacheName);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());

      // Trim the cache we just wrote to. Fire-and-forget - we don't await it.
      const type = Object.keys(CONFIG.CACHE_NAMES).find(
        (key) => getCacheName(key) === cacheName
      );
      if (type && CONFIG.LIMITS[type]) {
        trimCache(cacheName, CONFIG.LIMITS[type]).catch(() => {
          // Ignore trim errors - they should not break the fetch
        });
      }

      return networkResponse;
    }
  } catch (error) {
    console.warn('Background cache update failed:', error);
  }

  // If everything fails, return whatever was cached
  return caches.match(request);
};

/**
 * Extracts cache timestamp from cached response.
 */
const getCacheTime = (response) => {
  const dateHeader = response.headers.get('date');
  return dateHeader ? new Date(dateHeader).getTime() : null;
};

// ── Install Event ───────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(getCacheName('STATIC'));

        // Precache critical resources
        const cachePromises = CONFIG.PRECACHE_URLS.map((url) => {
          return cache.add(url).catch((error) => {
            console.warn(`Failed to precache ${url}:`, error);
            // Don't fail the whole install if one resource fails
          });
        });

        await Promise.allSettled(cachePromises);
        console.log('✅ Precache complete');

        // Force the waiting service worker to become active
        return self.skipWaiting();
      } catch (error) {
        console.error('❌ Service Worker installation failed:', error);
        throw error;
      }
    })()
  );
});

// ── Activate Event ──────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');

  event.waitUntil(
    (async () => {
      try {
        // Get all cache names
        const cacheNames = await caches.keys();

        // Get current cache prefixes
        const currentCaches = Object.values(CONFIG.CACHE_NAMES).map(
          (name) => `${name}-v${CONFIG.CACHE_VERSION}`
        );

        // Delete old caches
        const deletePromises = cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });

        await Promise.all(deletePromises.filter(Boolean));
        console.log('✅ Old caches cleaned');

        // Take control of all clients immediately
        await self.clients.claim();

        // Notify all clients about the update
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CONFIG.CACHE_VERSION,
          });
        });

        console.log('✅ Service Worker activated');
      } catch (error) {
        console.error('❌ Activation failed:', error);
      }
    })()
  );
});

// ── Fetch Event ─────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except Google Fonts).
  // Uses exact origin comparison instead of substring includes() to avoid
  // matching attacker-controlled hostnames like maniestacareeros.netlify.app.evil.com
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFonts =
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (!isSameOrigin && !isGoogleFonts) {
    return;
  }

  // Critical: do not intercept webpack/React chunks - prevents SW from returning
  // synthetic 503 Responses that show as "Failed to load resource: 503" for lazy routes.
  if (
    url.pathname.startsWith('/static/') ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    return;
  }

  // Skip excluded URLs
  if (shouldExclude(request.url)) return;

  const resourceType = getResourceType(request);
  const cacheName = getCacheName(resourceType);
  const strategy = CONFIG.STRATEGIES[resourceType] || 'network-first';

  // Choose strategy based on resource type
  switch (strategy) {
    case 'network-first':
      event.respondWith(networkFirst(request, cacheName));
      break;

    case 'cache-first':
      event.respondWith(cacheFirst(request, cacheName));
      break;

    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(request, cacheName));
      break;

    case 'network-only':
      // Don't cache, just fetch
      event.respondWith(fetch(request));
      break;

    default:
      event.respondWith(networkFirst(request, cacheName));
  }
});

// ── Message Event ───────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) {
    return;
  }

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_ALL_CACHES':
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(cacheNames.map((name) => caches.delete(name)));
        })
      );
      break;

    case 'GET_VERSION':
      // Safe check for ports before accessing
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: CONFIG.CACHE_VERSION,
        });
      }
      break;

    case 'UPDATE_CACHE':
      if (payload?.url) {
        event.waitUntil(updateCache(payload.url, getCacheName('DYNAMIC')));
      }
      break;

    default:
      console.warn('Unknown message type:', type, 'from:', event.source);
  }
});

// ── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resumes') {
    event.waitUntil(syncOfflineResumes());
  }

  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncOfflineAnalytics());
  }
});

const syncOfflineResumes = async () => {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_OFFLINE_DATA',
        category: 'resumes',
      });
    });
    console.log('🔄 Resume sync triggered');
  } catch (error) {
    console.error('❌ Resume sync failed:', error);
  }
};

const syncOfflineAnalytics = async () => {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_OFFLINE_DATA',
        category: 'analytics',
      });
    });
    console.log('🔄 Analytics sync triggered');
  } catch (error) {
    console.error('❌ Analytics sync failed:', error);
  }
};

// ── Push Notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/web-app-manifest-192x192.png',
      image: data.image,
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'default',
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
        ...data.extra,
      },
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      renotify: data.renotify || false,
      silent: data.silent || false,
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Maniesta Career OS', options));
  } catch (error) {
    console.error('Push notification error:', error);

    // Fallback: show basic notification
    const fallbackOptions = {
      body: 'You have a new notification from Maniesta Career OS',
      icon: '/web-app-manifest-192x192.png',
    };

    event.waitUntil(self.registration.showNotification('Maniesta Career OS', fallbackOptions));
  }
});

// ── Notification Click ──────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  const action = event.action;

  event.waitUntil(
    (async () => {
      try {
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            await client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action,
              url,
            });
            return;
          }
        }

        if (self.clients.openWindow) {
          await self.clients.openWindow(url);
        }
      } catch (error) {
        console.error('Notification click error:', error);
      }
    })()
  );
});

console.log('📦 Service Worker v' + CONFIG.CACHE_VERSION + ' loaded');