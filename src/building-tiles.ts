import { classifyRings, type VectorTile } from '@mapbox/vector-tile'
import { DEFAULT_TINT, LANDMARK_TINTS, type LandmarkStyle } from './landmarks'
import { bounded, clipRing, contains, Grid, metresPerUnit, pointBox, signedArea, withinOutline, type Area, type Feature, type Point, type Polygon, type Value } from './tile-geometry'

// Rebuilds the `building` layer of an OpenFreeMap tile. OpenFreeMap merges
// every building sharing height/colour into one multipolygon feature, so this
// splits it back into one feature per footprint and tags each with an art
// style inferred from POIs and landuse in the same tile. Famous landmarks and
// all their stacked parts get a landmark style instead. Geometry and source
// attributes are copied unchanged, except that a famous arch mapped as one plain
// box is drawn with openings inside that box, which still blocks the player.


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

const LANDMARK_CLASSES = new Set([
  'place_of_worship', 'attraction', 'monument', 'castle', 'museum', 'theatre', 'town_hall', 'library', 'art_gallery',
])
const WORSHIP_STYLES: Record<string, LandmarkStyle> = {
  '': 'cathedral', christian: 'cathedral', muslim: 'mosque',
  buddhist: 'temple', hindu: 'temple', sikh: 'temple', shinto: 'temple', taoist: 'temple', jain: 'temple',
}
// A name translated into many languages marks a world-famous place: every
// landmark sampled (Colosseum, Eiffel Tower, Taj Mahal...) has 55+, while
// only about 1% of all POIs reach 20.
const FAMOUS_TRANSLATIONS = 20

// Names that mark a famous monument as an arch or monumental gate.
const ARCH_NAME = /^(?!.*\b(bridge|park)\b).*\b(arch|arc|arco|gate|gateway|porta|puerta|triumphal)\b/i
// A plain box this tall and elongated can be drawn with openings.
const ARCH_MIN_HEIGHT = 10
const ARCH_MIN_ASPECT = 1.5
// Openings as fractions of the box's length and height. Long arches have a
// tall central opening between two smaller ones, short arches a single one.
const ARCH_LONG_METRES = 20
const LONG_ARCH = [{ from: .12, to: .25, rise: .35 }, { from: .37, to: .63, rise: .55 }, { from: .75, to: .88, rise: .35 }]
const SHORT_ARCH = [{ from: .3, to: .7, rise: .54 }]

// A part rests on another whose top is within this of its base.
const REST_METRES = 1

type Footprint = Area & { tags: Record<string, Value>; size: number; center: Point; group?: LandmarkGroup }
type LandmarkGroup = { style: LandmarkStyle | null; members: Footprint[]; core: Footprint[]; onWater: boolean }

const baseOf = ({ tags }: Footprint) => Number(tags.render_min_height) || 0
const topOf = ({ tags }: Footprint) => Number(tags.render_height) || 0

function styleFor(area: Area, pois: Grid<{ point: Point; style: JoinedStyle }>, landuse: Grid<Area & { style: JoinedStyle }>): JoinedStyle | undefined {
  let best: JoinedStyle | undefined
  for (const poi of pois.near(area)) {
    if (contains(area, poi.point) && (!best || JOINED_STYLES.indexOf(poi.style) < JOINED_STYLES.indexOf(best))) best = poi.style
  }
  if (best) return best
  // A footprint corner inside commercial/industrial land is enough context.
  const corner = area.rings[0][0]
  for (const candidate of landuse.near(pointBox(corner))) if (contains(candidate, corner)) return candidate.style
  return undefined
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

// Classes with an obvious archetype decide it; other famous places are judged
// by shape once all their parts are grouped.
function landmarkSeed(properties: Record<string, Value>): { style: LandmarkStyle | null; fame: number } | undefined {
  const poiClass = String(properties.class)
  if (!LANDMARK_CLASSES.has(poiClass) || properties.subclass === 'artwork') return undefined
  let fame = 0
  for (const key in properties) if (key.startsWith('name:') && key !== 'name:latin' && key !== 'name:nonlatin') fame++
  if (fame < FAMOUS_TRANSLATIONS) return undefined
  if (poiClass === 'place_of_worship') return { style: WORSHIP_STYLES[String(properties.subclass ?? '')] ?? 'shrine', fame }
  if (poiClass === 'castle') return { style: properties.subclass === 'ruins' ? 'ruins' : 'fortress', fame }
  return { style: ARCH_NAME.test(String(properties['name:en'] ?? properties.name)) ? 'arch' : null, fame }
}

// Landmarks without a telling class are judged by where and how they stand.
// Heights are metres; footprint extents are tile units.
function shapeStyle(group: LandmarkGroup, metresPerUnit: number): LandmarkStyle {
  // A famous POI standing in water with a raised, long and narrow deck or
  // walkway is a bridge (Tower Bridge), unlike a moored ship or a fountain.
  const deck = group.members.some((member) => {
    if (!baseOf(member)) return false
    let span = 0
    for (const a of member.rings[0]) for (const b of member.rings[0]) span = Math.max(span, Math.hypot(a.x - b.x, a.y - b.y))
    return span * metresPerUnit >= 80 && span * span >= 4 * member.size
  })
  if (group.onWater && deck) return 'bridge'
  // Raised open rings (Eiffel-like towers) read as ironwork.
  const ironwork = group.members.some((member) => baseOf(member) > 0 && member.rings.length > 1)
  // Very tall landmarks: a solid body rising from the ground is a skyscraper;
  // height made of raised pieces (Eiffel Tower, London Eye) is open ironwork.
  if (Math.max(...group.members.map(topOf)) >= 120) {
    const tallBody = group.members.some((member) => topOf(member) >= 120 && baseOf(member) <= 5)
    return tallBody && !ironwork ? 'skyscraper' : 'ironwork'
  }
  // A POI part at least three times taller than wide is a bell or clock tower.
  const slender = group.core.some((member) => topOf(member) >= 25 &&
    topOf(member) >= 3 * Math.max(member.maxX - member.minX, member.maxY - member.minY) * metresPerUnit)
  if (slender) return 'belltower'
  if (ironwork) return 'ironwork'
  // A courtyard inside a near-elliptical outline reads as an arena.
  const arena = group.members.some((member) => {
    const width = member.maxX - member.minX, depth = member.maxY - member.minY
    const fill = member.size / (width * depth)
    return member.rings.length > 1 && fill > .7 && fill < .85 && Math.min(width, depth) / Math.max(width, depth) > .6
  })
  return arena ? 'arena' : 'palace'
}

let colourContext: OffscreenCanvasRenderingContext2D | undefined
// Snap a mapped CSS colour (`white`, `#706550`...) to the landmark palette.
function tintFor(colour: Value | undefined): number | undefined {
  if (typeof colour !== 'string') return undefined
  colourContext ??= new OffscreenCanvas(1, 1).getContext('2d')!
  colourContext.fillStyle = '#010203'
  colourContext.fillStyle = colour
  const hex = String(colourContext.fillStyle)
  if (hex === '#010203' || !hex.startsWith('#')) return undefined
  const rgb = (value: string) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16))
  const [r, g, b] = rgb(hex)
  let best = 0, bestDistance = Infinity
  LANDMARK_TINTS.forEach((tint, index) => {
    const [tr, tg, tb] = rgb(tint)
    const distance = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2
    if (distance < bestDistance) [best, bestDistance] = [index, distance]
  })
  return best
}

// Parts that touch in plan and meet in height, one of them raised off the
// ground: legs carrying a platform, a drum carrying a dome.
function stacked(a: Footprint, b: Footprint): boolean {
  const [aBase, aTop, bBase, bTop] = [baseOf(a), topOf(a), baseOf(b), topOf(b)]
  if ((aBase <= 0 && bBase <= 0) || aTop < bBase || bTop < aBase) return false
  // Footprints that merely abut (a walkway against a tower wall) still count.
  const margin = 4
  return a.minX - margin <= b.maxX && b.minX - margin <= a.maxX && a.minY - margin <= b.maxY && b.minY - margin <= a.maxY
}

// Vertical strips across a plain box that rise to its top from the ground (the
// piers) or from a stepped round arch head. Sharing one top keeps the roof and
// cornice whole. Returns nothing unless the footprint is a long rectangle.
function archStrips(box: Footprint, metres: number): { rings: Polygon; base: number }[] | undefined {
  const ring = box.rings[0]
  const top = topOf(box)
  if (box.rings.length > 1 || ring.length !== 5 || baseOf(box) || top < ARCH_MIN_HEIGHT || box.tags.hide_3d === true) return undefined
  const between = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y)
  let [a, b, c, d] = ring
  if (between(b, c) > between(a, b)) [a, b, c, d] = [b, c, d, a]
  const length = between(a, b) * metres
  const near = (p: number, q: number) => Math.abs(p - q) <= .1 * Math.max(p, q)
  if (length < ARCH_MIN_ASPECT * between(b, c) * metres || !near(between(a, b), between(c, d)) || !near(between(a, c), between(b, d))) return undefined
  const along = (p: Point, q: Point, t: number) => ({ x: Math.round(p.x + t * (q.x - p.x)), y: Math.round(p.y + t * (q.y - p.y)) })
  const strip = (from: number, to: number, base: number) => {
    const start = along(a, b, from)
    return { base, rings: [[start, along(a, b, to), along(d, c, to), along(d, c, from), start]] }
  }
  const strips = []
  let edge = 0
  for (const { from, to, rise } of length >= ARCH_LONG_METRES ? LONG_ARCH : SHORT_ARCH) {
    strips.push(strip(edge, from, 0))
    const radius = (to - from) * length / 2
    const steps = Math.max(3, Math.round(2 * radius))
    for (let i = 0; i < steps; i++) {
      const offset = (i + .5) / steps * 2 - 1
      const head = rise * top + radius * (Math.sqrt(1 - offset * offset) - 1)
      strips.push(strip(from + (to - from) * i / steps, from + (to - from) * (i + 1) / steps, Math.round(head)))
    }
    edge = to
  }
  strips.push(strip(edge, 1, 0))
  return strips
}

export function buildingFeatures(tile: VectorTile, x: number, y: number): Feature[] {
  const buildings = tile.layers.building
  if (!buildings) return []
  const extent = buildings.extent
  const unit = metresPerUnit(y, extent)
  const pois = new Grid<{ point: Point; style: JoinedStyle }>()
  const seeds: { point: Point; style: LandmarkStyle | null; fame: number }[] = []
  const poiLayer = tile.layers.poi
  for (let i = 0; poiLayer && i < poiLayer.length; i++) {
    const feature = poiLayer.feature(i)
    if (feature.type !== 1) continue
    const style = POI_STYLES[feature.properties.class as string]
    const landmark = landmarkSeed(feature.properties)
    for (const [point] of feature.loadGeometry()) {
      if (style) pois.add({ point, style }, pointBox(point))
      if (landmark) seeds.push({ point, ...landmark })
    }
  }
  const water = new Grid<Area>()
  const waterLayer = tile.layers.water
  for (let i = 0; waterLayer && i < waterLayer.length; i++) {
    const feature = waterLayer.feature(i)
    if (feature.type === 3) for (const rings of classifyRings(feature.loadGeometry())) {
      const area = bounded(rings)
      water.add(area, area)
    }
  }
  const landuse = new Grid<Area & { style: JoinedStyle }>()
  const landuseLayer = tile.layers.landuse
  for (let i = 0; landuseLayer && i < landuseLayer.length; i++) {
    const feature = landuseLayer.feature(i)
    const style = LANDUSE_STYLES[feature.properties.class as string]
    if (style && feature.type === 3) for (const rings of classifyRings(feature.loadGeometry())) {
      const area = { ...bounded(rings), style }
      landuse.add(area, area)
    }
  }

  const footprints: Footprint[] = []
  const footprintGrid = new Grid<Footprint>()
  for (let i = 0; i < buildings.length; i++) {
    const feature = buildings.feature(i)
    if (feature.type !== 3) continue
    for (const rings of classifyRings(feature.loadGeometry())) {
      if (!rings.length || rings[0].length < 4) continue
      const area = bounded(rings)
      const tags: Record<string, Value> = { ...feature.properties, bitmon_variant: variantFor(rings, extent, x, y) }
      const style = styleFor(area, pois, landuse)
      if (style) tags.bitmon_style = style
      const outer = rings[0]
      const center = { x: outer.reduce((sum, p) => sum + p.x, 0) / outer.length, y: outer.reduce((sum, p) => sum + p.y, 0) / outer.length }
      const footprint = { ...area, tags, size: Math.abs(signedArea(outer)), center }
      footprints.push(footprint)
      footprintGrid.add(footprint, footprint)
    }
  }

  // OpenMapTiles hides a building's outline because its parts redraw it, but
  // sometimes no part redraws the body under an upper part, leaving that part
  // floating. Show an outline whose top meets such a part.
  for (const part of footprints) {
    const base = baseOf(part)
    if (!base || part.tags.hide_3d === true) continue
    const beneath = [...footprintGrid.near(pointBox(part.center))].filter((other) =>
      baseOf(other) < base && topOf(other) >= base - REST_METRES && contains(other, part.center))
    if (beneath.some((other) => other.tags.hide_3d !== true)) continue
    for (const other of beneath) if (topOf(other) <= base + REST_METRES) delete other.tags.hide_3d
  }

  // A landmark is mapped as many stacked parts (spires, tiers, domes) and its
  // POI sits in only one of them. Grow each group up to four steps: to parts
  // centred within a member's outline (courtyards and the gaps between tower
  // legs included), to a modest base that surrounds one, or to a part stacked
  // on or under one.
  const groups: LandmarkGroup[] = []
  // The most famous place claims its parts first, so lesser famous POIs
  // inside it (a pavilion, an office) cannot split the landmark.
  for (const seed of seeds.sort((a, b) => b.fame - a.fame)) {
    const members = [...footprintGrid.near(pointBox(seed.point))]
      .filter((footprint) => !footprint.group && contains(footprint, seed.point))
    if (!members.length) continue
    const onWater = [...water.near(pointBox(seed.point))].some((area) => contains(area, seed.point))
    const group = { style: seed.style, members, core: [...members], onWater }
    for (const member of members) member.group = group
    groups.push(group)
    let frontier = members
    for (let step = 0; step < 4; step++) {
      const next: Footprint[] = []
      for (const member of frontier) {
        for (const footprint of footprintGrid.near(member)) {
          if (footprint.group || !(withinOutline(member, footprint.center) ||
              (footprint.size <= 25 * member.size && contains(footprint, member.center)) ||
              stacked(member, footprint))) continue
          footprint.group = group
          next.push(footprint)
        }
      }
      members.push(...next)
      frontier = next
    }
  }
  const arches = new Map<Footprint, { rings: Polygon; base: number }[]>()
  for (const group of groups) {
    const style = group.style ?? shapeStyle(group, unit)
    const tint = group.members.map((member) => tintFor(member.tags.colour)).find((index) => index !== undefined) ?? DEFAULT_TINT[style]
    for (const { tags } of group.members) Object.assign(tags, { bitmon_style: style, bitmon_variant: tint, bitmon_landmark: true })
    const strips = style === 'arch' && group.members.length === 1 && archStrips(group.members[0], unit)
    if (strips) arches.set(group.members[0], strips)
  }
  // World-unique part ids (tile, then footprint index) let the style pick out
  // the parts covering the trainer.
  const tileId = (x * 2 ** 14 + y) * 2 ** 20
  // Each tile also carries the edges of its neighbours' footprints, and the two
  // copies of a footprint crossing a tile edge may be styled differently. Both
  // would draw the overlap and flicker as they fight for depth, so each tile
  // keeps only the part inside its own square; together they cover the footprint.
  const features: Feature[] = []
  const add = ({ rings, minX, minY, maxX, maxY }: Area, tags: Record<string, Value>) => {
    const inside = minX >= 0 && minY >= 0 && maxX <= extent && maxY <= extent
    const clipped = inside ? rings : rings.map((ring) => clipRing(ring, extent))
    if (clipped[0]) features.push({ id: tileId + features.length, type: 3, tags, geometry: clipped.filter((ring) => ring !== undefined) })
  }
  for (const footprint of footprints) {
    const strips = arches.get(footprint)
    // The hidden box keeps blocking the player: the openings are only drawn.
    add(footprint, strips ? { ...footprint.tags, hide_3d: true } : footprint.tags)
    for (const { rings, base } of strips ?? []) add(bounded(rings), { ...footprint.tags, render_min_height: base })
  }
  return features
}
