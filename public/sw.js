/* CricCast service worker — hand-written, no build step, no dependencies.
 *
 * TRUST RULE: CricCast lives on FRESH verified broadcast info, so this
 * worker must NEVER serve a cached page or data response. Pages and API
 * calls always go to the network. The worker is only:
 *   1. an offline safety net (shows /offline when a navigation fails), and
 *   2. a cache for static assets (JS/CSS chunks, our own icons and images).
 * Remote images (photo CDNs) are never touched, so a swapped photo can
 * never get stuck behind a cached copy.
 *
 * To remove the PWA cleanly: delete this file, app/manifest.js,
 * components/pwa/*, app/install, app/offline, public/icons and the two
 * mounts in app/layout.js.
 */

var CACHE_NAME = "criccast-pwa-v1";
var RUNTIME_CACHE = "criccast-pwa-v1-runtime";
var KNOWN_CACHES = [CACHE_NAME, RUNTIME_CACHE];

var PRECACHE_URLS = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    (async function () {
      try {
        var cache = await caches.open(CACHE_NAME);
        // Each URL in its own try/catch: one failed asset must never
        // break the whole install.
        await Promise.all(
          PRECACHE_URLS.map(async function (url) {
            try {
              await cache.add(url);
            } catch (err) {
              /* ignore — offline net still works without this asset */
            }
          })
        );
      } catch (err) {
        /* ignore — the worker must install even if caching fails */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      try {
        var names = await caches.keys();
        await Promise.all(
          names.map(function (name) {
            if (KNOWN_CACHES.indexOf(name) === -1) {
              return caches.delete(name);
            }
            return undefined;
          })
        );
      } catch (err) {
        /* ignore */
      }
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  var path = url.pathname;
  if (path.indexOf("/_next/static/") === 0) return true;
  if (path.indexOf("/icons/") === 0) return true;
  if (/\.(?:css|js|mjs|woff2?|ttf|otf)$/i.test(path)) return true;
  // Image files served from our own origin (e.g. /news/<photo>.jpg).
  if (/\.(?:png|jpe?g|webp|gif|svg|avif|ico)$/i.test(path)) return true;
  return false;
}

function staleWhileRevalidate(request) {
  return caches.open(RUNTIME_CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var network = fetch(request)
        .then(function (response) {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(function () {
          return cached;
        });
      return cached || network;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }

  // API calls: pass through completely untouched. Never cached, never
  // intercepted — broadcast data must always be live.
  if (url.pathname.indexOf("/api/") === 0) return;

  // Page navigations: NETWORK ONLY. On failure, show the offline page.
  // Cached HTML is never served — a stale page could show wrong channel
  // numbers, which breaks the site's core promise.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match("/offline", { cacheName: CACHE_NAME }).then(function (offline) {
          return offline || Response.error();
        });
      })
    );
    return;
  }

  // Anything from another origin (photo CDNs, analytics, fonts CDN):
  // network only, no caching, no interception.
  if (url.origin !== self.location.origin) return;

  // Same-origin static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else same-origin: leave the default network behaviour.
});
