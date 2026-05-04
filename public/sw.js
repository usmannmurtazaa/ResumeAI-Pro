// ── Service Worker Configuration ────────────────────────────────────────────
const CONFIG = {
  // Cache versioning - bump this number to force cache updates
  CACHE_VERSION: '2.5.0',
  
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
  
  // Resources to precache (critical for offline functionality)
  PRECACHE_URLS: [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/offline.html', // Optional: offline fallback page
  ],
  
  // Cache strategies per resource type
  STRATEGIES: {
    NAVIGATION: 'network-first', // Always get fresh HTML
    STATIC_ASSETS: 'cache-first',  // JS, CSS bundles (hashed in filenames)
    FONTS: 'cache-first',          // Fonts rarely change
    IMAGES: 'stale-while-revalidate', // Images can be stale
    API: 'network-only',           // Never cache API responses
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
    'hot-update', // HMR in development
    'chrome-extension',
    'sockjs-node',  // Webpack dev server
    '.json',        // Dynamic JSON (except manifest)
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
  return CONFIG.EXCLUDE_PATTERNS.some(pattern => url.includes(pattern));
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
 * Network-first strategy (best for HTML pages).
 * Falls back to cache if network fails, then to offline page.
 */
const networkFirst = async (request, cacheName) => {
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request, show offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Nothing cached, return error
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
 * Cache-first strategy (best for versioned assets like JS/CSS bundles).
 * Falls back to network if not in cache.
 */
const cacheFirst = async (request, cacheName) => {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check if cache is stale
    const cacheTime = getCacheTime(cachedResponse);
    if (cacheTime && Date.now() - cacheTime > CONFIG.STALE_TIMEOUT) {
      // Stale - update in background
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
  
  // Start network fetch in background (don't await)
  const fetchPromise = updateCache(request, cacheName);
  
  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
};

/**
 * Updates cache with fresh network response.
 */
const updateCache = async (request, cacheName) => {
  try {
    const cache = await caches.open(cacheName);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
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

/**
 * Trims cache to stay within size limits.
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

// ── Install Event ───────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(getCacheName('STATIC'));
        
        // Precache critical resources
        const cachePromises = CONFIG.PRECACHE_URLS.map(url => {
          return cache.add(url).catch(error => {
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
        const currentCaches = Object.values(CONFIG.CACHE_NAMES).map(name => 
          `${name}-v${CONFIG.CACHE_VERSION}`
        );
        
        // Delete old caches
        const deletePromises = cacheNames.map(cacheName => {
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
        clients.forEach(client => {
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
  
  // Skip cross-origin requests (except fonts.googleapis.com)
  if (!url.origin.includes(self.location.origin) && 
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
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
  // FIX: Handle non-standard messages (e.g., navigation preload, dev tools, browser extensions)
  if (!event.data || typeof event.data !== 'object') {
    return; // Silently ignore malformed messages
  }
  
  const { type, payload } = event.data;
  
  // FIX: If no type is provided, ignore the message instead of logging warning
  if (!type) {
    return; // This prevents the "Unknown message type: undefined" warning
  }
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_ALL_CACHES':
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(name => caches.delete(name))
          );
        })
      );
      break;
      
    case 'GET_VERSION':
      // FIX: Safe check for ports before accessing
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: CONFIG.CACHE_VERSION,
        });
      }
      break;
      
    case 'UPDATE_CACHE':
      if (payload?.url) {
        event.waitUntil(
          updateCache(payload.url, getCacheName('DYNAMIC'))
        );
      }
      break;
      
    case 'SW_UPDATED':
      // Handle service worker update notifications from clients
      console.log('Service Worker updated to version:', payload?.version || CONFIG.CACHE_VERSION);
      break;
      
    case 'SYNC_OFFLINE_DATA':
      // Handle sync data messages from clients
      console.log('Sync request received for:', payload?.category);
      break;
      
    case 'NOTIFICATION_CLICKED':
      // Handle notification click forwarded from clients
      console.log('Notification click handled:', payload);
      break;
      
    default:
      console.warn('Unknown message type:', type, 'from:', event.source);
  }
});

// ── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-resumes') {
    event.waitUntil(
      // Sync offline resumes with server
      syncOfflineResumes()
    );
  }
  
  if (event.tag === 'sync-analytics') {
    event.waitUntil(
      // Sync offline analytics events
      syncOfflineAnalytics()
    );
  }
});

/**
 * Example: Sync offline resumes with server when back online.
 * Implement based on your app's data structure.
 */
const syncOfflineResumes = async () => {
  try {
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients to sync their data
    clients.forEach(client => {
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

/**
 * Example: Sync offline analytics events.
 */
const syncOfflineAnalytics = async () => {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
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
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
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

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'ResumeAI Pro',
        options
      )
    );
  } catch (error) {
    console.error('Push notification error:', error);
    
    // Fallback: show basic notification
    const fallbackOptions = {
      body: 'You have a new notification from ResumeAI Pro',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    };
    
    event.waitUntil(
      self.registration.showNotification('ResumeAI Pro', fallbackOptions)
    );
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
        // Find or create a client window
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        
        // If there's an existing window, focus it
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
        
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          await self.clients.openWindow(url);
        }
      } catch (error) {
        console.error('Notification click error:', error);
      }
    })()
  );
});

// ── Periodic Cache Cleanup ──────────────────────────────────────────────────

// Clean up caches periodically to prevent storage bloat
setInterval(async () => {
  try {
    await trimCache(getCacheName('DYNAMIC'), CONFIG.LIMITS.DYNAMIC);
    await trimCache(getCacheName('IMAGES'), CONFIG.LIMITS.IMAGES);
    await trimCache(getCacheName('PAGES'), CONFIG.LIMITS.PAGES);
    await trimCache(getCacheName('FONTS'), CONFIG.LIMITS.FONTS);
    
    // Report storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usagePercent = (estimate.usage / estimate.quota) * 100;
      
      if (usagePercent > 80) {
        console.warn('⚠️ Storage usage high:', usagePercent.toFixed(1) + '%');
        // Could trigger emergency cache cleanup
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour

console.log('📦 Service Worker v' + CONFIG.CACHE_VERSION + ' loaded');