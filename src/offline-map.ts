import { CHANNEL } from './channel'

// Local, per-PWA-channel vector-tile storage. No generated geography or bulk prefetching.
export type Position = { lon: number; lat: number }

export const DEFAULT_POSITION: Position = { lon: 9.1869, lat: 45.4715 }
export const MAP_CACHE_LIMIT_MIB = 100
const LIMIT_BYTES = MAP_CACHE_LIMIT_MIB * 1024 * 1024
const TILE_ZOOM = 14 // OpenFreeMap's maximum vector tile level; MapLibre overzooms above it.
const POSITION_KEY = 'bitmon:' + CHANNEL + ':position:v1'
const DB_NAME = 'bitmon-map-' + CHANNEL

type TileMeta = { key: string; bytes: number }
type TileRecord = { key: string; data: ArrayBuffer }
type StatusListener = (usedBytes: number, persistent: boolean) => void

export function validPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false
  const point = value as Partial<Position>
  return typeof point.lon === 'number' && typeof point.lat === 'number' &&
    Number.isFinite(point.lon) && Number.isFinite(point.lat) &&
    point.lon >= -180 && point.lon <= 180 && point.lat >= -85 && point.lat <= 85
}

export function savedPosition(): Position {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null')
    if (validPosition(value)) return { lon: value.lon, lat: value.lat }
  } catch { /* Local storage may be disabled. */ }
  return { ...DEFAULT_POSITION }
}

export function savePosition(value: Position): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(value))
  } catch { /* Play remains possible without persistent local storage. */ }
}

export function tileKeyAt(point: Position): string {
  const size = 2 ** TILE_ZOOM
  const x = Math.max(0, Math.min(size - 1, Math.floor((point.lon + 180) / 360 * size)))
  const latitude = point.lat * Math.PI / 180
  const y = Math.max(0, Math.min(size - 1, Math.floor(
    (1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * size,
  )))
  return TILE_ZOOM + '/' + x + '/' + y
}

function tileCenter(key: string): Position {
  const [z, x, y] = key.split('/').map(Number)
  const count = 2 ** z
  return {
    lon: (x + .5) / count * 360 - 180,
    lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + .5) / count))) * 180 / Math.PI,
  }
}

function distanceFromPlayer(a: Position, b: Position): number {
  const toRad = Math.PI / 180
  const latitude = (a.lat - b.lat) * toRad
  const longitude = (a.lon - b.lon) * toRad
  const h = Math.sin(latitude / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(longitude / 2) ** 2
  return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}

function dbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('tiles', { keyPath: 'key' })
      db.createObjectStore('metadata', { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Map storage is blocked'))
  })
}

class OfflineMapCache {
  private db: IDBDatabase | null = null
  private metadata = new Map<string, TileMeta>()
  private usedBytes = 0
  private player: Position = savedPosition()
  private landingTile: string | null = null
  private onStatus: StatusListener | null = null
  private writeQueue: Promise<void> = Promise.resolve()
  private inFlight = new Map<string, Promise<ArrayBuffer>>()
  private pendingWrites = new Map<string, ArrayBuffer>()
  readonly ready: Promise<void>

  constructor() {
    this.ready = this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await openDatabase()
      const tx = this.db.transaction('metadata', 'readonly')
      const metadata = await dbRequest(tx.objectStore('metadata').getAll() as IDBRequest<TileMeta[]>)
      for (const tile of metadata) {
        this.metadata.set(tile.key, tile)
        this.usedBytes += tile.bytes
      }
    } catch (error) {
      console.warn('Offline map persistence unavailable', error)
      this.db = null
    }
    this.report()
  }

  setStatusListener(listener: StatusListener): void {
    this.onStatus = listener
    void this.ready.then(() => this.report())
  }

  setPlayerPosition(position: Position): void {
    this.player = { ...position }
  }

  protectLandingPosition(position: Position | null): void {
    this.landingTile = position ? tileKeyAt(position) : null
  }

  private report(): void {
    this.onStatus?.(this.usedBytes, this.db !== null)
  }

  private async readTile(key: string): Promise<ArrayBuffer | null> {
    if (!this.db || !this.metadata.has(key)) return null
    try {
      const tx = this.db.transaction('tiles', 'readonly')
      const record = await dbRequest(tx.objectStore('tiles').get(key) as IDBRequest<TileRecord | undefined>)
      return record?.data || null
    } catch (error) {
      console.warn('Stored map tile unavailable', error)
      return null
    }
  }

  private async storeTile(key: string, data: ArrayBuffer): Promise<void> {
    if (!this.db || this.metadata.has(key) || data.byteLength > LIMIT_BYTES) return
    const currentTile = tileKeyAt(this.player)
    const toDelete: string[] = []
    let remaining = this.usedBytes
    if (remaining + data.byteLength > LIMIT_BYTES) {
      const farthest = [...this.metadata.values()]
        .filter((tile) => tile.key !== currentTile && tile.key !== this.landingTile)
        .map((tile) => ({
          ...tile, distance: distanceFromPlayer(tileCenter(tile.key), this.player),
        }))
        .sort((a, b) => b.distance - a.distance)
      for (const tile of farthest) {
        if (remaining + data.byteLength <= LIMIT_BYTES) break
        toDelete.push(tile.key)
        remaining -= tile.bytes
      }
    }
    // Never discard the tile under the trainer just to store a remote tile.
    if (remaining + data.byteLength > LIMIT_BYTES) return
    const meta: TileMeta = { key, bytes: data.byteLength }
    try {
      const tx = this.db.transaction(['tiles', 'metadata'], 'readwrite')
      const tiles = tx.objectStore('tiles')
      const metadata = tx.objectStore('metadata')
      for (const oldKey of toDelete) {
        tiles.delete(oldKey)
        metadata.delete(oldKey)
      }
      tiles.put({ key, data } satisfies TileRecord)
      metadata.put(meta)
      await transactionDone(tx)
      for (const oldKey of toDelete) {
        this.metadata.delete(oldKey)
      }
      this.metadata.set(key, meta)
      this.usedBytes = remaining + meta.bytes
      this.report()
    } catch (error) {
      // A device storage quota can be smaller than our application limit.
      console.warn('Unable to persist this map tile', error)
    }
  }

  private async fetchTile(key: string): Promise<ArrayBuffer> {
    await this.ready
    // A tile already queued for disk must not be fetched a second time.
    const pending = this.pendingWrites.get(key)
    if (pending) return pending
    const saved = await this.readTile(key)
    if (saved) return saved
    const response = await fetch('https://tiles.openfreemap.org/planet/latest/' + key + '.pbf',
      { cache: 'no-store' })
    if (!response.ok) throw new Error('OpenFreeMap tile unavailable (' + response.status + ')')
    const data = await response.arrayBuffer()
    if (!data.byteLength) throw new Error('Empty OpenFreeMap tile')
    this.pendingWrites.set(key, data)
    // Do not delay rendering while a previous tile is being written to disk.
    // The internal buffer is never handed to MapLibre (which may transfer it).
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        await this.storeTile(key, data)
      } finally {
        this.pendingWrites.delete(key)
      }
    }).catch((error: unknown) => {
      console.warn('Map tile write failed', error)
    })
    return data
  }

  private getTile(key: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    if (signal?.aborted) return Promise.reject(new DOMException('Tile request aborted', 'AbortError'))
    let flight = this.inFlight.get(key)
    if (!flight) {
      flight = this.fetchTile(key)
      this.inFlight.set(key, flight)
      const current = flight
      // Both success and failure must release the entry for future requests.
      void flight.then(
        () => { if (this.inFlight.get(key) === current) this.inFlight.delete(key) },
        () => { if (this.inFlight.get(key) === current) this.inFlight.delete(key) },
      )
    }
    // Every caller owns its own transferable buffer; there is just one fetch.
    const result = flight.then((bytes) => bytes.slice(0))
    if (!signal) return result
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const onAbort = () => reject(new DOMException('Tile request aborted', 'AbortError'))
      signal.addEventListener('abort', onAbort, { once: true })
      if (signal.aborted) onAbort()
      void result.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
    })
  }

  async ensureTileAt(position: Position): Promise<boolean> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      await this.getTile(tileKeyAt(position), controller.signal)
      return true
    } catch {
      return false
    } finally {
      clearTimeout(timeout)
    }
  }

  async loadProtocolTile(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const parsed = new URL(url)
    if (parsed.hostname !== 'tiles') throw new Error('Unsupported map source')
    const match = /^\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(parsed.pathname)
    if (!match) throw new Error('Invalid tile URL')
    const [z, x, y] = match.slice(1).map(Number)
    if (z < 0 || z > TILE_ZOOM || x >= 2 ** z || y >= 2 ** z) {
      throw new Error('Invalid tile coordinates')
    }
    return this.getTile(z + '/' + x + '/' + y, signal)
  }
}

export const offlineMap = new OfflineMapCache()
