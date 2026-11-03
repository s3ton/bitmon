const SCOPE_PATH = new URL(self.registration.scope).pathname
const IS_PREVIEW = SCOPE_PATH.endsWith('/preview/')
const CACHE_PREFIX = 'bitmon-shell-' + SCOPE_PATH.replace(/[^a-z0-9]/gi, '_') + '-'
const CACHE = CACHE_PREFIX + 'v5-__BUILD_REVISION__'
const SHELL_URL = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const response = await fetch(SHELL_URL, { cache: 'no-store' })
    if (!response.ok) throw new Error('App shell unavailable')
    const cache = await caches.open(CACHE)
    await cache.put(SHELL_URL, response.clone())
    const html = await response.text()
    const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => new URL(match[1], SHELL_URL))
      .filter((url) => url.origin === self.location.origin && /\.(?:js|css)$/.test(url.pathname))
      .map((url) => url.href)
    await cache.addAll([...assets, ...[
      'manifest.webmanifest', 'icon-192.svg', 'icon-512.svg', 'trainer-atlas.webp',
    ].map((path) => new URL(path, SHELL_URL).href)])
  })())
})

// Let the player finish a session before activating a downloaded update.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((name) =>
      name !== CACHE && (name.startsWith(CACHE_PREFIX) ||
        (!IS_PREVIEW && /^bitmon-shell-v\d+$/.test(name)))
    ).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.pathname.startsWith(SCOPE_PATH) ||
      (!IS_PREVIEW && url.pathname.startsWith(SCOPE_PATH + 'preview/'))) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    // Hashed bundles, worker scripts, icons and the manifest belong to this
    // build's scoped cache. Avoid re-fetching them on each launch.
    if (request.mode !== 'navigate') {
      const stored = await cache.match(request)
      if (stored) return stored
    }
    try {
      const response = await fetch(request)
      if (response.ok && request.mode === 'navigate') {
        // Store one offline entry, not an entry for every navigation query.
        await cache.put(SHELL_URL, response.clone())
      } else if (response.ok && /\.(?:js|css)$/.test(url.pathname)) {
        await cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      const offline = await cache.match(request.mode === 'navigate' ? SHELL_URL : request)
      if (offline) return offline
      throw error
    }
  })())
})
