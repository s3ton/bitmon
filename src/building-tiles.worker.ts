import { classifyRings, VectorTile } from '@mapbox/vector-tile'
import { PbfReader, PbfWriter } from 'pbf'

// Rewrites only the `building` layer of an OpenFreeMap tile. OpenFreeMap merges
// every building sharing height/colour into one multipolygon feature, so this
// splits it back into one feature per footprint and tags each with an art
// style inferred from POIs and landuse in the same tile. Geometry and source
// attributes are copied unchanged; every other layer keeps its original bytes.

// Ordered by precedence when several mapped POIs fall inside one footprint.
const JOINED_STYLES = [
  'station', 'medical', 'worship', 'culture', 'school', 'civic',
  'lodging', 'food', 'shop', 'office', 'commercial', 'industrial',
] as const
export type JoinedStyle = typeof JOINED_STYLES[number]

// OpenMapTiles POI classes suggest a facade. This is a visual heuristic,
// never a claim about what the real building is used for.
const POI_STYLES: Record<string, JoinedStyle> = {
  railway: 'station', bus: 'station', ferry_terminal: 'station',
  hospital: 'medical', doctors: 'medical', dentist: 'medical', pharmacy: 'medical', veterinary: 'medical',
  place_of_worship: 'worship',
  museum: 'culture', art_gallery: 'culture', theatre: 'culture', cinema: 'culture', castle: 'culture',
  monument: 'culture', attraction: 'culture',
  school: 'school', college: 'school',
  town_hall: 'civic', post: 'civic', police: 'civic', fire_station: 'civic', library: 'civic', bank: 'civic',
  lodging: 'lodging',
  restaurant: 'food', cafe: 'food', fast_food: 'food', bar: 'food', beer: 'food', ice_cream: 'food', bakery: 'food',
  shop: 'shop', grocery: 'shop', clothing_store: 'shop', butcher: 'shop', alcohol_shop: 'shop',
  hairdresser: 'shop', bicycle: 'shop', car: 'shop', laundry: 'shop',
  office: 'office',
}
const LANDUSE_STYLES: Record<string, JoinedStyle> = { commercial: 'commercial', retail: 'commercial', industrial: 'industrial' }

type Point = { x: number; y: number }
type Polygon = Point[][]
type Value = string | number | boolean
type Area = { rings: Polygon; minX: number; maxX: number; minY: number; maxY: number }

function bounded(rings: Polygon): Area {
  const area = { rings, minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  for (const { x, y } of rings[0]) {
    area.minX = Math.min(area.minX, x)
    area.maxX = Math.max(area.maxX, x)
    area.minY = Math.min(area.minY, y)
    area.maxY = Math.max(area.maxY, y)
  }
  return area
}

function inRing(point: Point, ring: Point[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function contains(area: Area, point: Point): boolean {
  return point.x >= area.minX && point.x <= area.maxX && point.y >= area.minY && point.y <= area.maxY &&
    inRing(point, area.rings[0]) && !area.rings.slice(1).some((hole) => inRing(point, hole))
}

function styleFor(area: Area, pois: { point: Point; style: JoinedStyle }[], landuse: (Area & { style: JoinedStyle })[]): JoinedStyle | undefined {
  let best: JoinedStyle | undefined
  for (const poi of pois) {
    if (contains(area, poi.point) && (!best || JOINED_STYLES.indexOf(poi.style) < JOINED_STYLES.indexOf(best))) best = poi.style
  }
  // A footprint corner inside commercial/industrial land is enough context.
  return best ?? landuse.find((candidate) => contains(candidate, area.rings[0][0]))?.style
}

// Deterministic 0..2 palette pick from the footprint's west-most in-tile
// vertex in world tile coordinates, independent of feature order.
function variantFor(rings: Polygon, extent: number, x: number, y: number): number {
  let anchor: Point | undefined
  for (const point of rings[0]) {
    if (point.x < 0 || point.y < 0 || point.x > extent || point.y > extent) continue
    if (!anchor || point.x < anchor.x || (point.x === anchor.x && point.y < anchor.y)) anchor = point
  }
  anchor ??= rings[0][0]
  let hash = Math.imul((x * extent + anchor.x) | 0, 73856093) ^ Math.imul((y * extent + anchor.y) | 0, 19349663)
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507)
  return ((hash ^ (hash >>> 13)) >>> 0) % 3
}

const zigzag = (n: number) => (n << 1) ^ (n >> 31)

function writeBuildingLayer(layer: { name: string; extent: number; features: { tags: Record<string, Value>; rings: Polygon }[] }, pbf: PbfWriter): void {
  const keys: string[] = [], values: Value[] = []
  const keyIndex = new Map<string, number>(), valueIndex = new Map<string, number>()
  pbf.writeVarintField(15, 2)
  pbf.writeStringField(1, layer.name)
  for (const feature of layer.features) {
    pbf.writeMessage(2, (_, out) => {
      const tags: number[] = []
      for (const [key, value] of Object.entries(feature.tags)) {
        if (!keyIndex.has(key)) keyIndex.set(key, keys.push(key) - 1)
        const valueKey = typeof value + ':' + value
        if (!valueIndex.has(valueKey)) valueIndex.set(valueKey, values.push(value) - 1)
        tags.push(keyIndex.get(key)!, valueIndex.get(valueKey)!)
      }
      out.writePackedVarint(2, tags)
      out.writeVarintField(3, 3)
      const geometry: number[] = []
      let cx = 0, cy = 0
      for (const ring of feature.rings) {
        // loadGeometry repeats the first vertex; ClosePath encodes it instead.
        const last = ring.length - 1
        const points = ring[0].x === ring[last].x && ring[0].y === ring[last].y ? ring.slice(0, last) : ring
        points.forEach((point, i) => {
          if (i === 0) geometry.push(9)
          else if (i === 1) geometry.push(2 | ((points.length - 1) << 3))
          geometry.push(zigzag(point.x - cx), zigzag(point.y - cy))
          cx = point.x
          cy = point.y
        })
        geometry.push(15)
      }
      out.writePackedVarint(4, geometry)
    }, null)
  }
  for (const key of keys) pbf.writeStringField(3, key)
  for (const value of values) {
    pbf.writeMessage(4, (_, out) => {
      if (typeof value === 'string') out.writeStringField(1, value)
      else if (typeof value === 'boolean') out.writeBooleanField(7, value)
      else if (Number.isInteger(value)) out.writeSVarintField(6, value)
      else out.writeDoubleField(3, value)
    }, null)
  }
  pbf.writeVarintField(5, layer.extent)
}

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
  const buildings = tile.layers.building
  const out = new PbfWriter()
  // Copy each top-level layer message (field 3) verbatim except `building`.
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
    if (!buildings || layerName(layerBytes) !== 'building') out.writeBytesField(3, layerBytes)
  }
  if (!buildings) return out.finish()

  const extent = buildings.extent
  const pois: { point: Point; style: JoinedStyle }[] = []
  const poiLayer = tile.layers.poi
  for (let i = 0; poiLayer && i < poiLayer.length; i++) {
    const feature = poiLayer.feature(i)
    const style = POI_STYLES[feature.properties.class as string]
    if (style && feature.type === 1) for (const [point] of feature.loadGeometry()) pois.push({ point, style })
  }
  const landuse: (Area & { style: JoinedStyle })[] = []
  const landuseLayer = tile.layers.landuse
  for (let i = 0; landuseLayer && i < landuseLayer.length; i++) {
    const feature = landuseLayer.feature(i)
    const style = LANDUSE_STYLES[feature.properties.class as string]
    if (style && feature.type === 3) for (const rings of classifyRings(feature.loadGeometry())) landuse.push({ ...bounded(rings), style })
  }

  const features: { tags: Record<string, Value>; rings: Polygon }[] = []
  for (let i = 0; i < buildings.length; i++) {
    const feature = buildings.feature(i)
    if (feature.type !== 3) continue
    for (const rings of classifyRings(feature.loadGeometry())) {
      if (!rings.length || rings[0].length < 4) continue
      const tags: Record<string, Value> = { ...feature.properties, bitmon_variant: variantFor(rings, extent, x, y) }
      const style = styleFor(bounded(rings), pois, landuse)
      if (style) tags.bitmon_style = style
      features.push({ tags, rings })
    }
  }
  out.writeMessage(3, writeBuildingLayer, { name: 'building', extent, features })
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
