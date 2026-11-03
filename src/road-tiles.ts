import type { VectorTile } from '@mapbox/vector-tile'
import { Grid, metresPerUnit, type Feature, type Point, type Value } from './tile-geometry'

// Surface-art tags for the `transportation` layer of an OpenFreeMap tile.
// Every source feature is copied with its geometry and attributes unchanged,
// plus `bitmon_ppm` (CSS px per metre at zoom 16 for this tile's latitude, so
// the style can draw roads at true ground width) and, on streets whose
// sidewalks are already mapped as footways, `bitmon_sidewalk: 'mapped'`.
// Painted pedestrian crossings become a separate `bitmon_crossing` layer: each
// is the stretch of a mapped footway that lies across a mapped street.

// The tiles carry no width or lane data, so carriageway widths are art
// choices per class; the style draws streets with the same widths.
export const CARRIAGEWAY_METRES: Record<string, number> = {
  motorway: 14, trunk: 12, primary: 11, secondary: 9, tertiary: 8, minor: 6, busway: 6, service: 4, track: 3,
}
// Footway widths by subclass; other paths are 2 m wide.
export const PATH_METRES: Record<string, number> = { pedestrian: 4, platform: 3, steps: 2.5, path: 1.5 }
// Parapets add this much to a bridge deck beyond its carriageway or footway.
export const PARAPET_METRES = 1.2

// Full drawn width of a mapped bridge deck, or undefined for classes (rail,
// ferry) whose bridges are not drawn and cannot be walked.
export function deckMetres(tags: Record<string, unknown>): number | undefined {
  const width = tags.class === 'path' ? PATH_METRES[String(tags.subclass)] ?? 2 : CARRIAGEWAY_METRES[String(tags.class)]
  return width === undefined ? undefined : width + PARAPET_METRES
}
// Streets with kerbs and sidewalks, where mapped footways get painted crossings.
export const STREETS = ['trunk', 'primary', 'secondary', 'tertiary', 'minor', 'busway']
const WALKWAYS = new Set(['footway', 'path', 'pedestrian'])
// A footway meeting a street at under 30° runs alongside it, not across.
const CROSSING_MIN_SINE = .5
// A mapped sidewalk runs within 15° of the street, beside the kerb.
const SIDEWALK_MAX_SINE = .26
const SIDEWALK_MIN_METRES = 2
const SIDEWALK_BEYOND_KERB_METRES = 8
const SIDEWALK_SAMPLE_METRES = 15

type Segment = { a: Point; b: Point; tags: Record<string, Value> }

// Tunnels, bridges, indoor corridors and other levels never meet the street surface.
const atGround = (tags: Record<string, Value>) => !tags.brunnel && !tags.indoor && !Number(tags.layer)

function box({ a, b }: Segment, margin: number) {
  return {
    minX: Math.min(a.x, b.x) - margin, minY: Math.min(a.y, b.y) - margin,
    maxX: Math.max(a.x, b.x) + margin, maxY: Math.max(a.y, b.y) + margin,
  }
}

function sine(s: Segment, t: Segment): number {
  const [dx, dy, ex, ey] = [s.b.x - s.a.x, s.b.y - s.a.y, t.b.x - t.a.x, t.b.y - t.a.y]
  return Math.abs(dx * ey - dy * ex) / (Math.hypot(dx, dy) * Math.hypot(ex, ey))
}

function distance(point: Point, { a, b }: Segment): number {
  const [dx, dy] = [b.x - a.x, b.y - a.y]
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy)
}

// Fraction along `s` where it properly crosses `t`, if it does.
function crossing(s: Segment, t: Segment): number | undefined {
  const [dx, dy, ex, ey] = [s.b.x - s.a.x, s.b.y - s.a.y, t.b.x - t.a.x, t.b.y - t.a.y]
  const denominator = dx * ey - dy * ex
  if (!denominator) return undefined
  const [fx, fy] = [t.a.x - s.a.x, t.a.y - s.a.y]
  const along = (fx * ey - fy * ex) / denominator, across = (fx * dy - fy * dx) / denominator
  return along > 0 && along < 1 && across > 0 && across < 1 ? along : undefined
}

function segments(geometry: Point[][], tags: Record<string, Value>): Segment[] {
  const result: Segment[] = []
  for (const line of geometry) for (let i = 1; i < line.length; i++) {
    if (line[i - 1].x !== line[i].x || line[i - 1].y !== line[i].y) result.push({ a: line[i - 1], b: line[i], tags })
  }
  return result
}

// Most of the street's length has a mapped footway alongside it.
function hasMappedSidewalk(street: Segment[], walkways: Grid<Segment>, unit: number): boolean {
  const half = CARRIAGEWAY_METRES[String(street[0].tags.class)] / 2
  const [near, far] = [SIDEWALK_MIN_METRES / unit, (half + SIDEWALK_BEYOND_KERB_METRES) / unit]
  let samples = 0, mapped = 0
  for (const segment of street) {
    const count = Math.max(1, Math.round(Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y) * unit / SIDEWALK_SAMPLE_METRES))
    const candidates = [...walkways.near(box(segment, far))].filter((walkway) => sine(segment, walkway) < SIDEWALK_MAX_SINE)
    for (let k = 0; k < count; k++) {
      const t = (k + .5) / count
      const point = { x: segment.a.x + t * (segment.b.x - segment.a.x), y: segment.a.y + t * (segment.b.y - segment.a.y) }
      samples++
      if (candidates.some((walkway) => { const d = distance(point, walkway); return d >= near && d <= far })) mapped++
    }
  }
  return mapped * 2 >= samples
}

export function roadFeatures(tile: VectorTile, y: number): { roads: Feature[]; crossings: Feature[] } {
  const layer = tile.layers.transportation
  if (!layer) return { roads: [], crossings: [] }
  const unit = metresPerUnit(y, layer.extent)
  // A z14 tile is 512 CSS px wide at zoom 14, so 2048 px at zoom 16.
  const ppm = Math.round(2048 / (unit * layer.extent) * 1000) / 1000
  const roads: Feature[] = [], streets: Segment[][] = [], walkways: Segment[] = []
  const walkwayGrid = new Grid<Segment>(), streetGrid = new Grid<Segment>()
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i)
    const tags: Record<string, Value> = { ...feature.properties, bitmon_ppm: ppm }
    const geometry = feature.loadGeometry()
    roads.push({ type: feature.type, tags, geometry })
    if (feature.type !== 2 || !atGround(tags)) continue
    if (STREETS.includes(String(tags.class))) {
      const street = segments(geometry, tags)
      if (street.length) streets.push(street)
      for (const segment of street) streetGrid.add(segment, box(segment, 0))
    } else if (tags.class === 'path' && WALKWAYS.has(String(tags.subclass))) {
      for (const segment of segments(geometry, tags)) {
        walkways.push(segment)
        walkwayGrid.add(segment, box(segment, 0))
      }
    }
  }
  for (const street of streets) if (hasMappedSidewalk(street, walkwayGrid, unit)) street[0].tags.bitmon_sidewalk = 'mapped'

  const crossings: Feature[] = []
  for (const walkway of walkways) {
    const length = Math.hypot(walkway.b.x - walkway.a.x, walkway.b.y - walkway.a.y)
    for (const street of streetGrid.near(box(walkway, 0))) {
      const at = crossing(walkway, street)
      const angle = sine(walkway, street)
      if (at === undefined || angle < CROSSING_MIN_SINE) continue
      // Span the carriageway along the footway, never past its own vertices.
      const reach = CARRIAGEWAY_METRES[String(street.tags.class)] / 2 / unit / angle / length
      const point = (t: number) => ({
        x: Math.round(walkway.a.x + t * (walkway.b.x - walkway.a.x)),
        y: Math.round(walkway.a.y + t * (walkway.b.y - walkway.a.y)),
      })
      crossings.push({ type: 2, tags: { bitmon_ppm: ppm }, geometry: [[point(Math.max(0, at - reach)), point(Math.min(1, at + reach))]] })
    }
  }
  return { roads, crossings }
}
