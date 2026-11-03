// Client for the tile-art worker (tiles.worker.ts) on the tile protocol path.

const worker = new Worker(new URL('./tiles.worker.ts', import.meta.url), { type: 'module' })
const requests = new Map<number, { resolve: (data: ArrayBuffer) => void; reject: (error: Error) => void }>()
let nextRequest = 0
worker.onmessage = ({ data }: MessageEvent<{ id: number; data?: ArrayBuffer; error?: string }>) => {
  const request = requests.get(data.id)!
  requests.delete(data.id)
  if (data.data) request.resolve(data.data)
  else request.reject(new Error(data.error))
}

// MapLibre requests the same z14 tile again for every overscaled zoom level;
// keep the few most recent results instead of re-running the worker.
const ENRICHED_TILE_CACHE = 24
const enriched = new Map<string, Promise<ArrayBuffer>>()

// Adds building and road art tags to a raw z14 tile off the main thread.
export function enrichTile(data: ArrayBuffer, x: number, y: number): Promise<ArrayBuffer> {
  const key = x + '/' + y
  let result = enriched.get(key)
  if (result) enriched.delete(key)
  else {
    const id = nextRequest++
    result = new Promise<ArrayBuffer>((resolve, reject) => {
      requests.set(id, { resolve, reject })
      worker.postMessage({ id, data, x, y }, [data])
    })
    result.catch(() => { if (enriched.get(key) === result) enriched.delete(key) })
  }
  enriched.set(key, result)
  if (enriched.size > ENRICHED_TILE_CACHE) enriched.delete(enriched.keys().next().value!)
  // MapLibre transfers the buffer it receives, so each caller gets a copy.
  return result.then((bytes) => bytes.slice(0))
}
