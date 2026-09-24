const CACHE_VERSION = "__CACHE_VERSION__";
const PRECACHE_NAME = `loop-precache-${CACHE_VERSION}`;
const RUNTIME_NAME = `loop-runtime-${CACHE_VERSION}`;
const PRECACHE_URLS = __PRECACHE_URLS__;

const scopeUrl = new URL(self.registration.scope);
const BASE_PATH = scopeUrl.pathname.endsWith('/')
  ? scopeUrl.pathname
  : `${scopeUrl.pathname}/`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter((key) => (
          (key.startsWith('loop-precache-') || key.startsWith('loop-runtime-'))
          && key !== PRECACHE_NAME
          && key !== RUNTIME_NAME
        ))
        .map((key) => caches.delete(key)),
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin
    || !url.pathname.startsWith(BASE_PATH)
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstAsset(request));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const runtime = await caches.open(RUNTIME_NAME);
      await runtime.put(request, response.clone());
    }

    return response;
  } catch {
    return (
      await caches.match(request)
      || await caches.match(BASE_PATH)
      || await caches.match(`${BASE_PATH}index.html`)
      || new Response(
        '<!doctype html><title>Loop Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#07070b;color:#f8fafc;font:16px system-ui;display:grid;place-items:center;min-height:100vh"><main style="text-align:center;padding:24px"><h1>Loop is offline</h1><p>Open Loop once while online to cache the app.</p></main></body>',
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        },
      )
    );
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const runtime = await caches.open(RUNTIME_NAME);
      await runtime.put(request, response.clone());
    }

    return response;
  } catch {
    return new Response('', {
      status: 503,
      statusText: 'Offline',
    });
  }
}
