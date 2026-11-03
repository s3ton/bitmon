export function registerPwa(): void {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((registration) => {
      let reloadRequested = false

      function showUpdate(): void {
        if (!navigator.serviceWorker.controller || !registration.waiting ||
            document.querySelector('.pwa-update')) return

        const notice = document.createElement('aside')
        notice.className = 'pwa-update'
        notice.setAttribute('role', 'status')
        const message = document.createElement('span')
        message.textContent = 'An update is ready.'
        const reload = document.createElement('button')
        reload.type = 'button'
        reload.textContent = 'Reload'
        reload.addEventListener('click', () => {
          const waiting = registration.waiting
          if (!waiting) return
          reload.disabled = true
          reload.textContent = 'Updating…'
          reloadRequested = true
          waiting.postMessage({ type: 'SKIP_WAITING' })
        })
        notice.append(message, reload)
        document.querySelector('#app')?.append(notice)
      }

      registration.addEventListener('updatefound', () => {
        registration.installing?.addEventListener('statechange', (event) => {
          if ((event.target as ServiceWorker).state === 'installed') showUpdate()
        })
      })
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadRequested) window.location.reload()
      })
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void registration.update().catch((error: unknown) => {
          console.warn('PWA update check unavailable', error)
        })
      })
      showUpdate()
    }).catch((error: unknown) => {
      console.warn('Offline shell unavailable', error)
    })
  })
}
