const BASE = __QCV_BASE__;
const VERSION = __QCV_VERSION__;
const PRECACHE_URLS = __QCV_PRECACHE__;
const PRECACHE_CACHE = `qcv-precache-${VERSION}`;
const RUNTIME_CACHE = `qcv-runtime-${VERSION}`;
const CDN_CACHE = "qcv-cdn";

function cacheKeyFor(url, { navigation = false } = {}) {
  const key = new URL(url);
  key.search = "";
  if (navigation && !key.pathname.endsWith("/")) {
    key.pathname += "/";
  }
  return key.href;
}

function isUnderBase(pathname) {
  return BASE === ""
    ? pathname.startsWith("/")
    : pathname === BASE || pathname.startsWith(`${BASE}/`);
}

async function cacheSuccessfulResponse(
  cacheName,
  request,
  response,
  cacheKey = request
) {
  if (response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_CACHE);
      for (let index = 0; index < PRECACHE_URLS.length; index += 50) {
        const chunk = PRECACHE_URLS.slice(index, index + 50);
        const [result] = await Promise.allSettled([cache.addAll(chunk)]);
        if (result.status === "rejected") {
          const retries = await Promise.allSettled(
            chunk.map((url) => cache.add(url))
          );
          retries.forEach((retry, retryIndex) => {
            if (retry.status === "rejected") {
              console.warn(
                "QCV precache failed:",
                chunk[retryIndex],
                retry.reason
              );
            }
          });
        }
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PRECACHE_CACHE, RUNTIME_CACHE, CDN_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("qcv-") && !keep.has(name))
          .map((name) => caches.delete(name))
      );
      await clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin &&
    url.hostname === "cdn.jsdelivr.net" &&
    url.pathname.includes("monaco-editor")
  ) {
    const update = caches.open(CDN_CACHE).then(async (cache) => {
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        await cache.put(request, response.clone());
      }
      return response;
    });
    event.waitUntil(update.catch(() => undefined));
    event.respondWith(
      caches.open(CDN_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          return await update;
        } catch {
          return Response.error();
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin || !isUnderBase(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await cacheSuccessfulResponse(
            RUNTIME_CACHE,
            request,
            await fetch(request),
            cacheKeyFor(request.url, { navigation: true })
          );
        } catch {
          const fallbackUrl = new URL(request.url);
          fallbackUrl.search = "";
          if (!fallbackUrl.pathname.endsWith("/")) {
            fallbackUrl.pathname += "/";
          }
          return (
            (await caches.match(fallbackUrl.href, { ignoreSearch: true })) ??
            (await caches.match(`${url.origin}${BASE}/`)) ??
            Response.error()
          );
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith(`${BASE}/_next/static/`)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          return await cacheSuccessfulResponse(
            RUNTIME_CACHE,
            request,
            await fetch(request)
          );
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await cacheSuccessfulResponse(
          RUNTIME_CACHE,
          request,
          await fetch(request),
          cacheKeyFor(request.url)
        );
      } catch {
        return (
          (await caches.match(request, { ignoreSearch: true })) ??
          Response.error()
        );
      }
    })()
  );
});
