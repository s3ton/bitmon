import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'

// A different compiled app shell must produce different service-worker bytes,
// even when public/sw.js itself has not changed.
const assets = (await readdir('dist/assets')).map((name) => 'assets/' + name)
const files = [
  'index.html', 'manifest.webmanifest', 'icon-192.svg',
  'icon-512.svg', 'trainer-atlas.svg', ...assets,
]
const hash = createHash('sha256')
for (const file of files.sort()) {
  hash.update(file)
  hash.update(await readFile('dist/' + file))
}

const path = 'dist/sw.js'
const worker = await readFile(path, 'utf8')
if (!worker.includes('__BUILD_REVISION__')) {
  throw new Error('Service worker build revision placeholder missing')
}
await writeFile(path, worker.replace('__BUILD_REVISION__', hash.digest('hex').slice(0, 12)))
