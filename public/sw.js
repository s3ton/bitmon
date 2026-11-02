const CACHE = 'bitmon-shell-v3'
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const start = self.registration.scope
    const response = await fetch(start)
    if (!response.ok) throw new Error('App shell unavailable')
    await cache.put(start, response.clone())
    const html = await response.text()
    const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => new URL(match[1], start))
      .filter((url) => url.origin === self.location.origin && /\.(?:js|css)$/.test(url.pathname))
      .map((url) => url.href)
    await cache.addAll([...assets, new URL('manifest.webmanifest', start).href,
      new URL('icon-192.svg', start).href, new URL('icon-512.svg', start).href,
      new URL('trainer-atlas.svg', start).href])
    await self.skipWaiting()
  })())
})
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter((name) => name !== CACHE).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    try {
      const response = await fetch(request)
      if (response.ok && (request.mode === 'navigate' || /\.(?:js|css)$/.test(url.pathname))) {
        await cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      const offline = await cache.match(request.mode === 'navigate' ? self.registration.scope : request)
      if (offline) return offline
      throw error
    }
  })())
})