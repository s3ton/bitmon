import type { PbfWriter } from 'pbf'

// Geometry helpers and the vector-tile layer writer shared by the tile-art
// worker's building and road passes. Coordinates are z14 tile units.

export type Point = { x: number; y: number }
export type Polygon = Point[][]
export type Value = string | number | boolean
export type Area = { rings: Polygon; minX: number; maxX: number; minY: number; maxY: number }
type Box = { minX: number; minY: number; maxX: number; maxY: number }
// Line (2) or polygon (3) features, with geometry as loadGeometry returns it:
// one point array per line or ring. The OpenMapTiles layers rewritten here
// (building, transportation) contain no point features.
export type Feature = { id?: number; type: number; tags: Record<string, Value>; geometry: Point[][] }

export function bounded(rings: Polygon): Area {
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

export function withinOutline(area: Area, point: Point): boolean {
  return point.x >= area.minX && point.x <= area.maxX && point.y >= area.minY && point.y <= area.maxY &&
    inRing(point, area.rings[0])
}

export function contains(area: Area, point: Point): boolean {
  return withinOutline(area, point) && !area.rings.slice(1).some((hole) => inRing(point, hole))
}

export function signedArea(ring: Point[]): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j].x - ring[i].x) * (ring[j].y + ring[i].y)
  return sum / 2
}

// Clips a closed ring to the tile square [0, extent]. Cut points are rounded
// to whole units, so the two tiles sharing an edge cut a footprint at exactly
// the same vertices. Returns a closed ring, or undefined when nothing is left.
export function clipRing(ring: Point[], extent: number): Point[] | undefined {
  let points = ring.slice(0, -1)
  for (const [axis, limit, side] of [['x', 0, 1], ['x', extent, -1], ['y', 0, 1], ['y', extent, -1]] as const) {
    const other = axis === 'x' ? 'y' : 'x'
    const kept: Point[] = []
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length]
      const aInside = (a[axis] - limit) * side >= 0
      if (aInside) kept.push(a)
      if (aInside !== ((b[axis] - limit) * side >= 0)) {
        const t = (limit - a[axis]) / (b[axis] - a[axis])
        kept.push({ [axis]: limit, [other]: Math.round(a[other] + t * (b[other] - a[other])) } as Point)
      }
    })
    points = kept
  }
  return points.length >= 3 && signedArea(points) ? [...points, points[0]] : undefined
}

export const pointBox =({ x, y }: Point): Box => ({ minX: x, minY: y, maxX: x, maxY: y })

// Every enriched tile is z14; Web Mercator shrinks metres by cos(latitude).
export function metresPerUnit(y: number, extent: number): number {
  const latitude = Math.atan(Math.sinh(Math.PI * (1 - (2 * y + 1) / 2 ** 14)))
  return 40_075_016.7 * Math.cos(latitude) / 2 ** 14 / extent
}

// Uniform cell index over tile coordinates. Dense tiles hold ~10k footprints
// and thousands of POIs or road segments, so pairwise scans would cost about
// a second per tile.
export class Grid<T> {
  private cells = new Map<number, T[]>()
  private static readonly SIZE = 256
  private static key(cx: number, cy: number): number { return (cx + 64) * 4096 + cy + 64 }

  add(item: T, box: Box): void {
    for (let cx = Math.floor(box.minX / Grid.SIZE); cx <= Math.floor(box.maxX / Grid.SIZE); cx++) {
      for (let cy = Math.floor(box.minY / Grid.SIZE); cy <= Math.floor(box.maxY / Grid.SIZE); cy++) {
        const key = Grid.key(cx, cy)
        const cell = this.cells.get(key)
        if (cell) cell.push(item)
        else this.cells.set(key, [item])
      }
    }
  }

  near(box: Box): Set<T> {
    const found = new Set<T>()
    for (let cx = Math.floor(box.minX / Grid.SIZE); cx <= Math.floor(box.maxX / Grid.SIZE); cx++) {
      for (let cy = Math.floor(box.minY / Grid.SIZE); cy <= Math.floor(box.maxY / Grid.SIZE); cy++) {
        for (const item of this.cells.get(Grid.key(cx, cy)) ?? []) found.add(item)
      }
    }
    return found
  }
}

const zigzag = (n: number) => (n << 1) ^ (n >> 31)

export function writeLayer(layer: { name: string; extent: number; features: Feature[] }, pbf: PbfWriter): void {
  const keys: string[] = [], values: Value[] = []
  const keyIndex = new Map<string, number>(), valueIndex = new Map<string, number>()
  pbf.writeVarintField(15, 2)
  pbf.writeStringField(1, layer.name)
  for (const feature of layer.features) {
    pbf.writeMessage(2, (_, out) => {
      if (feature.id !== undefined) out.writeVarintField(1, feature.id)
      const tags: number[] = []
      for (const [key, value] of Object.entries(feature.tags)) {
        if (!keyIndex.has(key)) keyIndex.set(key, keys.push(key) - 1)
        const valueKey = typeof value + ':' + value
        if (!valueIndex.has(valueKey)) valueIndex.set(valueKey, values.push(value) - 1)
        tags.push(keyIndex.get(key)!, valueIndex.get(valueKey)!)
      }
      out.writePackedVarint(2, tags)
      out.writeVarintField(3, feature.type)
      const geometry: number[] = []
      let cx = 0, cy = 0
      for (const line of feature.geometry) {
        // loadGeometry repeats a ring's first vertex; ClosePath encodes it instead.
        const last = line.length - 1
        const closed = feature.type === 3 && line[0].x === line[last].x && line[0].y === line[last].y
        const points = closed ? line.slice(0, last) : line
        points.forEach((point, i) => {
          if (i === 0) geometry.push(9)
          else if (i === 1) geometry.push(2 | ((points.length - 1) << 3))
          geometry.push(zigzag(point.x - cx), zigzag(point.y - cy))
          cx = point.x
          cy = point.y
        })
        if (feature.type === 3) geometry.push(15)
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
