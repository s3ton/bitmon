import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader, PbfWriter } from 'pbf'
import { buildingFeatures } from './building-tiles'
import { roadFeatures } from './road-tiles'
import { writeLayer } from './tile-geometry'

// Adds art tags to an OpenFreeMap z14 tile on the protocol path, before
// MapLibre parses it. The `building` and `transportation` layers are rebuilt
// with their source geometry and attributes unchanged; every other layer keeps
// its original bytes.

const REBUILT = new Set(['building', 'transportation'])

function layerName(bytes: Uint8Array): string {
  const reader = new PbfReader(bytes)
  while (reader.pos < reader.length) {
    const tag = reader.readVarint()
    if (tag >> 3 === 1) return reader.readString()
    reader.skip(tag & 7)
  }
  return ''
}

function enrich(data: ArrayBuffer, x: number, y: number): Uint8Array {
  const bytes = new Uint8Array(data)
  const tile = new VectorTile(new PbfReader(bytes))
  const out = new PbfWriter()
  // Copy each top-level layer message (field 3) verbatim unless it is rebuilt.
  const reader = new PbfReader(bytes)
  while (reader.pos < reader.length) {
    const tag = reader.readVarint()
    if (tag >> 3 !== 3 || (tag & 7) !== 2) {
      reader.skip(tag & 7)
      continue
    }
    const end = reader.readVarint() + reader.pos
    const layerBytes = bytes.subarray(reader.pos, end)
    reader.pos = end
    if (!REBUILT.has(layerName(layerBytes))) out.writeBytesField(3, layerBytes)
  }
  const { building, transportation } = tile.layers
  if (building) out.writeMessage(3, writeLayer, { name: 'building', extent: building.extent, features: buildingFeatures(tile, x, y) })
  if (transportation) {
    const { roads, crossings } = roadFeatures(tile, y)
    const extent = transportation.extent
    out.writeMessage(3, writeLayer, { name: 'transportation', extent, features: roads })
    if (crossings.length) out.writeMessage(3, writeLayer, { name: 'bitmon_crossing', extent, features: crossings })
  }
  return out.finish()
}

self.onmessage = ({ data }: MessageEvent<{ id: number; data: ArrayBuffer; x: number; y: number }>) => {
  try {
    const result = enrich(data.data, data.x, data.y)
    const buffer = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer
    self.postMessage({ id: data.id, data: buffer }, { transfer: [buffer] })
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) })
  }
}
