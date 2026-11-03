// Persistent-storage permission is origin-wide. Request it only when bitmon is
// running as an installed app; preview/stable keep separate data namespaces.
function protectInstalledStorage(): void {
  const status = document.querySelector<HTMLElement>('#storage-persistence-status')!
  const retry = document.querySelector<HTMLButtonElement>('#storage-persistence-retry')!
  const installed = matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  if (!installed) {
    status.textContent = 'Launch installed bitmon from the home screen to protect offline data.'
    return
  }
  const storage = navigator.storage
  if (!storage?.persist || !storage.persisted) {
    status.textContent = 'Storage protection is not supported on this device.'
    return
  }

  async function requestProtection(): Promise<void> {
    retry.hidden = true
    status.textContent = 'Checking offline storage protection…'
    try {
      const granted = await storage.persisted() || await storage.persist()
      status.textContent = granted
        ? 'Protected from automatic storage eviction. Clearing app/site data still deletes saves.'
        : 'Best effort: the phone may delete offline tiles when storage is low.'
      retry.hidden = granted
    } catch {
      status.textContent = 'Storage protection could not be requested on this device.'
      retry.hidden = false
    }
  }

  retry.addEventListener('click', () => { void requestProtection() })
  void requestProtection()
}

export function registerPwa(): void {
  protectInstalledStorage()
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
