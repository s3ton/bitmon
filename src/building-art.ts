import type { ExpressionSpecification, FillExtrusionLayerSpecification, Map as MapLibreMap } from 'maplibre-gl'
import type { JoinedStyle } from './building-tiles.worker'
import { LANDMARK_TINTS, type LandmarkStyle } from './landmarks'

// Facade art for mapped OpenFreeMap buildings. Geometry, footprints and heights
// stay exactly as sourced; only surface patterns are inferred and invented.
// The tile worker tags each footprint with `bitmon_style` (from POIs/landuse in
// the same tile) and `bitmon_variant`; untagged footprints are styled by height.
// Famous landmarks (`bitmon_landmark`) use their own archetypes, a tint taken
// from the mapped colour, and a gold cornice just below the roof cap.
//
// MapLibre sizes extrusion patterns per integer tile zoom: walls advance
// 2^(z-16) CSS px per metre and roofs follow tile pixels. Each zoom therefore
// gets its own power-of-two-sized image (keeping wall rows anchored at ground
// level across tile seams), drawn on demand the first time a tile needs it.

const SOURCE = 'openmaptiles'
const FLOOR_METERS = 4
const ROOF_CAP_METERS = .5
const TRIM_METERS = 1
const GOLD = '#d9a93a'
const PART_LAYERS = ['ground', 'upper', 'roof'] as const
type Part = typeof PART_LAYERS[number]

type GroundKind = 'door' | 'shopfront' | 'entrance' | 'roller' | 'arch' | 'clinic' | 'portal' | 'arcade' | 'lattice' | 'colonnade'
type UpperKind = 'window' | 'strip' | 'arched' | 'ribbed' | 'balcony' | 'band' | 'lancet' | 'arcade' | 'lattice' | 'slit' | 'pilaster'
type RoofKind = 'tiles' | 'flat' | 'ribbed'
type FacadeStyle = {
  walls: string[]; accents: string[]; roofs: string[]
  ground: GroundKind; upper: UpperKind; roof: RoofKind; glass?: string; masonry?: boolean
}

const STYLES: Record<JoinedStyle | LandmarkStyle | 'house' | 'block' | 'tower', FacadeStyle> = {
  station: { walls: ['#d7dde2', '#e2ddd2'], accents: ['#3e7cc0', '#2f9a8e'], roofs: ['#5d7590', '#6f8295'], ground: 'entrance', upper: 'band', roof: 'ribbed' },
  medical: { walls: ['#f3f5f4', '#eef2ef'], accents: ['#2f9a8e', '#3e8fb0'], roofs: ['#b9c3c6', '#a9b6b8'], ground: 'clinic', upper: 'band', roof: 'flat' },
  worship: { walls: ['#e8e1d1', '#ddd6c6'], accents: ['#7a5cc4', '#3e7cc0'], roofs: ['#5b6573', '#6b5f73'], ground: 'arch', upper: 'arched', roof: 'tiles' },
  culture: { walls: ['#e6d7bd', '#ddd2c2'], accents: ['#8a4fae', '#c4553f'], roofs: ['#7c6a8c', '#5f7d7a'], ground: 'arch', upper: 'arched', roof: 'flat' },
  school: { walls: ['#e7c49c', '#dfb999'], accents: ['#3f9a74', '#3e7cc0'], roofs: ['#4f8c6a', '#b0624f'], ground: 'entrance', upper: 'window', roof: 'flat' },
  civic: { walls: ['#e3d9c4', '#d9d4c8'], accents: ['#3e5f99', '#9a6a3a'], roofs: ['#6b7f99', '#7b8a7a'], ground: 'arch', upper: 'window', roof: 'flat' },
  lodging: { walls: ['#efe0d0', '#e8d5d8'], accents: ['#c99a3a', '#b54f62'], roofs: ['#8c6b5a', '#5f6b8c'], ground: 'entrance', upper: 'balcony', roof: 'flat' },
  food: { walls: ['#f2e3c8', '#eed9c6'], accents: ['#e8a33d', '#d9574a', '#7a5cc4'], roofs: ['#b0624f', '#8c7a5a'], ground: 'shopfront', upper: 'window', roof: 'flat' },
  shop: { walls: ['#f2e6cf', '#e5e3d6'], accents: ['#e0574a', '#3f9a74', '#3e7cc0'], roofs: ['#a07a5a', '#7a8a9a'], ground: 'shopfront', upper: 'window', roof: 'flat' },
  office: { walls: ['#c3ccd6', '#cdc7bd'], accents: ['#3e7cc0', '#5d7590'], roofs: ['#8f99a3', '#9a9488'], ground: 'entrance', upper: 'strip', roof: 'flat', glass: '#5d86ad' },
  commercial: { walls: ['#e9e1d0', '#dfe2da'], accents: ['#e8a33d', '#3e7cc0', '#d9574a'], roofs: ['#b39a84', '#97a6a0'], ground: 'shopfront', upper: 'window', roof: 'flat' },
  industrial: { walls: ['#c9c8be', '#bfc6c4'], accents: ['#e8a33d', '#3f7f9a'], roofs: ['#9aa0a6', '#8e9a92'], ground: 'roller', upper: 'ribbed', roof: 'ribbed' },
  house: { walls: ['#f1e3c6', '#e9d2bf', '#dfe6d3'], accents: ['#3f8f8a', '#b0624f', '#3e7cc0'], roofs: ['#d9574a', '#3f7fbf', '#3f9a74'], ground: 'door', upper: 'window', roof: 'tiles' },
  block: { walls: ['#d8e0e6', '#e6dccb', '#d4d9cf'], accents: ['#3e7cc0', '#3f8f8a', '#b0624f'], roofs: ['#b6a58f', '#8fa39b', '#a9a2b4'], ground: 'entrance', upper: 'window', roof: 'flat' },
  tower: { walls: ['#b9c4cf', '#c9c3b8', '#aab8c2'], accents: ['#3e7cc0', '#5d7590', '#7a5cc4'], roofs: ['#8f99a3', '#9a9488', '#7f8c99'], ground: 'entrance', upper: 'strip', roof: 'flat', glass: '#4f6f8f' },
  // Landmarks: the variant is a LANDMARK_TINTS index chosen by the tile worker.
  cathedral: { walls: LANDMARK_TINTS, accents: ['#7a5cc4', '#3e7cc0', '#c4553f'], roofs: ['#5b6573', '#4f8a7c'], ground: 'portal', upper: 'lancet', roof: 'tiles', glass: '#6f7fc4', masonry: true },
  shrine: { walls: LANDMARK_TINTS, accents: ['#3f8f8a', '#c99a3a'], roofs: ['#4f8a7c', '#c9a24a'], ground: 'arch', upper: 'arched', roof: 'flat', masonry: true },
  fortress: { walls: LANDMARK_TINTS, accents: ['#6b4a3a', '#5b6573'], roofs: ['#9a958a', '#8a8579'], ground: 'arch', upper: 'slit', roof: 'flat', masonry: true },
  arena: { walls: LANDMARK_TINTS, accents: ['#8a7458'], roofs: ['#cdbb94', '#c2b08a'], ground: 'arcade', upper: 'arcade', roof: 'flat', masonry: true },
  ironwork: { walls: LANDMARK_TINTS, accents: ['#c99a3a'], roofs: ['#6f6250', '#5c5a55'], ground: 'lattice', upper: 'lattice', roof: 'ribbed' },
  palace: { walls: LANDMARK_TINTS, accents: ['#3e5f99', '#4f8a7c', '#9a6a3a'], roofs: ['#8a8f98', '#4f8a7c'], ground: 'colonnade', upper: 'pilaster', roof: 'flat', masonry: true },
}

const INK = '#2f3550'
const FRAME = '#f4f1e6'
const GLASS = '#8fc9de'
const SHINE = '#eef8fb'

const height: ExpressionSpecification = ['case',
  ['>', ['to-number', ['get', 'render_height'], 0], 0], ['to-number', ['get', 'render_height']], 14]
const minHeight: ExpressionSpecification = ['to-number', ['get', 'render_min_height'], 0]
const wallTop: ExpressionSpecification = ['-', height, ROOF_CAP_METERS]
const landmark: ExpressionSpecification = ['==', ['get', 'bitmon_landmark'], true]
// Landmark walls stop lower to make room for the gold cornice.
const facadeTop: ExpressionSpecification = ['case', landmark, ['-', wallTop, TRIM_METERS], wallTop]
const upperBase: ExpressionSpecification = ['case', ['>', minHeight, 0], minHeight, FLOOR_METERS]
// Without a joined POI/landuse hint, only the sourced height picks the style.
const facadeStyle: ExpressionSpecification = ['coalesce', ['get', 'bitmon_style'],
  ['step', height, 'house', 9, 'block', 25, 'tower']]

function patternName(part: Part): ExpressionSpecification {
  const name = (zoom: number): ExpressionSpecification =>
    ['concat', 'bt-', part, '-', ['var', 's'], '-', ['to-string', ['get', 'bitmon_variant']], '-', String(zoom)]
  return ['let', 's', facadeStyle,
    ['step', ['zoom'], name(15), 16, name(16), 17, name(17), 18, name(18), 19, name(19), 20, name(20)]]
}

// Ground floor, upper floors and a thin roof cap stacked within each source
// volume, so the top stays at render_height and collision/camera use is unchanged.
export function buildingLayers(): FillExtrusionLayerSpecification[] {
  const common = { type: 'fill-extrusion', source: SOURCE, 'source-layer': 'building', minzoom: 14 } as const
  const visible: ExpressionSpecification = ['!=', ['get', 'hide_3d'], true]
  const paint = (part: Part, base: ExpressionSpecification | number, top: ExpressionSpecification) => ({
    'fill-extrusion-pattern': patternName(part),
    'fill-extrusion-base': base,
    'fill-extrusion-height': top,
    'fill-extrusion-vertical-gradient': false,
  })
  return [
    { ...common, id: 'buildings-ground', filter: ['all', visible, ['==', minHeight, 0]],
      paint: paint('ground', 0, ['min', facadeTop, FLOOR_METERS]) },
    { ...common, id: 'buildings-upper', filter: ['all', visible, ['>', facadeTop, upperBase]],
      paint: paint('upper', upperBase, facadeTop) },
    { ...common, id: 'buildings-trim', filter: ['all', visible, landmark, ['<', minHeight, wallTop]],
      paint: {
        'fill-extrusion-color': GOLD,
        'fill-extrusion-base': ['max', minHeight, facadeTop],
        'fill-extrusion-height': wallTop,
        'fill-extrusion-vertical-gradient': false,
      } },
    { ...common, id: 'buildings-roof', filter: visible,
      paint: paint('roof', ['max', minHeight, wallTop], height) },
  ]
}

function drawImage(part: Part, style: FacadeStyle, variant: number, zoom: number, pixelRatio: number): ImageData {
  // Power-of-two CSS sizes divide MapLibre's 512 px tile origin, so every wall
  // starts its pattern at ground level and roofs line up across tile seams.
  const unit = 2 ** (zoom - 16)
  // Pitched-looking tiles span ~10-20 m so a typical house shows one ridge.
  const roofSize = (style.roof === 'tiles' ? 16 : 8) * unit
  // Lattice bays are wide so the girders stay legible at a distance.
  const bay = part === 'upper' && style.upper !== 'lattice' ? 4 : 8
  const cssWidth = part === 'roof' ? roofSize : bay * unit
  const cssHeight = part === 'roof' ? roofSize : FLOOR_METERS * unit
  const width = Math.max(1, Math.round(cssWidth * pixelRatio))
  const heightPx = Math.max(1, Math.round(cssHeight * pixelRatio))
  const canvas = new OffscreenCanvas(width, heightPx)
  const ctx = canvas.getContext('2d')!
  const pick = (colors: string[]) => colors[variant % colors.length]
  const wall = pick(style.walls)
  const accent = pick(style.accents)
  const glass = style.glass ?? GLASS
  // Fractional rectangles snap to device pixels for a crisp pixel-art look.
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    const x0 = Math.round(x * width), y0 = Math.round(y * heightPx)
    ctx.fillStyle = color
    ctx.fillRect(x0, y0, Math.max(1, Math.round((x + w) * width) - x0), Math.max(1, Math.round((y + h) * heightPx) - y0))
  }
  const px = 1 / width, py = 1 / heightPx
  const pane = (x: number, y: number, w: number, h: number, mullions = true) => {
    rect(x, y, w, h, INK)
    rect(x + px, y + py, w - 2 * px, h - 2 * py, glass)
    if (mullions && w * width >= 6) {
      rect(x + w / 2 - px / 2, y + py, px, h - 2 * py, FRAME)
      rect(x + px, y + h / 2 - py / 2, w - 2 * px, py, FRAME)
    }
    rect(x + 2 * px, y + 2 * py, px, py, SHINE)
  }
  // Outlined opening with a stepped round or pointed head.
  const opening = (x: number, y: number, w: number, h: number, fill: string, pointed = false) => {
    const head = h * (pointed ? .35 : .25)
    for (const [inset, color] of [[0, INK], [1, fill]] as const) {
      const ix = inset * px, iy = inset * py
      for (let step = 0; step < 3; step++) {
        const narrow = w * (3 - step) / (pointed ? 8 : 12)
        rect(x + narrow + ix, y + head * step / 3 + iy, w - 2 * narrow - 2 * ix, head / 3 + py, color)
      }
      rect(x + ix, y + head + iy, w - 2 * ix, h - head - iy, color)
    }
  }
  const column = (x: number, y: number, w: number, h: number) => {
    rect(x, y, w, h, shade(wall, .25))
    rect(x + w - px, y, px, h, shade(wall, -.25))
    rect(x - w * .2, y, w * 1.4, py * 2, shade(wall, -.1))
  }

  if (part === 'roof') {
    const roof = pick(style.roofs)
    rect(0, 0, 1, 1, roof)
    if (style.roof === 'tiles') {
      // Lit and shaded halves suggest a pitched ridge on a flat cap.
      rect(0, .5, 1, .5, shade(roof, -.18))
      rect(0, 0, 1, 2 * py, shade(roof, .22))
      for (let row = 1; row < 12; row++) rect(0, row / 12, 1, py, shade(roof, row < 6 ? -.08 : -.26))
    } else if (style.roof === 'ribbed') {
      for (let col = 0; col < 8; col++) rect(col / 8, 0, px, 1, shade(roof, -.15))
    } else {
      // Quiet concrete panels; the world-aligned grid reads as a flat deck.
      rect(0, 0, 1, py, shade(roof, -.07))
      rect(0, 0, px, 1, shade(roof, -.07))
      rect(px, py, .5, py, shade(roof, .1))
    }
    return ctx.getImageData(0, 0, width, heightPx)
  }

  rect(0, 0, 1, 1, wall)
  if (style.masonry) {
    // Stone courses with staggered joints.
    for (let row = 0; row < 4; row++) {
      rect(0, row / 4, 1, py, shade(wall, -.1))
      for (const x of row % 2 ? [.25, .75] : [0, .5]) rect(x, row / 4, px, .25, shade(wall, -.1))
    }
  }
  if (style.ground === 'lattice' || style.upper === 'lattice') {
    // Open ironwork: sky-pale gaps behind X-braced girders.
    rect(0, 0, 1, 1, shade(wall, .55))
    ctx.strokeStyle = wall
    ctx.lineWidth = Math.max(1, width / 8)
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(width, heightPx)
    ctx.moveTo(width, 0); ctx.lineTo(0, heightPx)
    ctx.stroke()
    rect(0, 0, .1, 1, shade(wall, -.15))
    rect(.9, 0, .1, 1, shade(wall, -.15))
    rect(0, 0, 1, .06, shade(wall, -.15))
  }
  if (part === 'ground') {
    // The image's bottom row meets the ground.
    rect(0, .9, 1, .1, shade(wall, -.3))
    switch (style.ground) {
      case 'door':
        pane(.12, .3, .2, .3)
        rect(.44, .35, .16, .55, INK)
        rect(.44 + px, .35 + py, .16 - 2 * px, .55 - py, accent)
        pane(.7, .3, .2, .3)
        break
      case 'shopfront':
        for (let i = 0; i < 8; i++) rect(i / 8, .12, 1 / 16, .14, accent)
        rect(0, .12, 1, py, INK)
        rect(0, .26, 1, py, INK)
        pane(.06, .36, .56, .54, false)
        rect(.7, .38, .2, .52, INK)
        rect(.7 + px, .38 + py, .2 - 2 * px, .52 - py, shade(accent, -.2))
        break
      case 'entrance':
        rect(0, .14, 1, .1, accent)
        pane(.08, .32, .3, .58, false)
        pane(.4, .32, .2, .58)
        pane(.62, .32, .3, .58, false)
        break
      case 'clinic':
        rect(0, .14, 1, .08, accent)
        rect(.14, .36, .16, .06, accent)
        rect(.19, .3, .06, .18, accent)
        pane(.4, .3, .22, .6)
        pane(.7, .32, .22, .3)
        break
      case 'roller':
        rect(.1, .22, .5, .68, INK)
        for (let y = .24; y < .9; y += 3 * py) rect(.1 + px, y, .5 - 2 * px, py, shade(wall, -.12))
        rect(.7, .22, .02, .68, accent)
        pane(.76, .3, .16, .2)
        break
      case 'arch':
        for (const x of [.08, .58]) {
          rect(x, .28, .34, .62, INK)
          rect(x + px, .32, .34 - 2 * px, .58, shade(accent, -.15))
          rect(x + .06, .28 - 2 * py, .22, 2 * py, INK)
        }
        break
      case 'portal':
        opening(.36, .2, .28, .7, shade(accent, -.35), true)
        opening(.08, .3, .14, .45, glass, true)
        opening(.78, .3, .14, .45, glass, true)
        break
      case 'arcade':
        for (const x of [.04, .54]) opening(x, .12, .42, .78, shade(wall, -.55))
        break
      case 'colonnade':
        rect(0, .08, 1, .08, shade(wall, -.12))
        for (let i = 0; i < 4; i++) {
          rect(i / 4 + .07, .16, .12, .74, shade(wall, -.45))
          column(i / 4 + .02, .16, .05, .74)
        }
        break
      case 'lattice':
        break
    }
    return ctx.getImageData(0, 0, width, heightPx)
  }

  // Upper floors: one 4 m storey per image row, with a ledge at its base.
  rect(0, .92, 1, .08, shade(wall, -.12))
  switch (style.upper) {
    case 'window':
      pane(.25, .25, .5, .5)
      break
    case 'balcony':
      pane(.25, .2, .5, .5)
      rect(.15, .7, .7, .06, accent)
      rect(.15, .6, px, .1, INK)
      rect(.85 - px, .6, px, .1, INK)
      break
    case 'strip':
      rect(0, .18, 1, .56, INK)
      rect(0, .18 + py, 1, .56 - 2 * py, glass)
      rect(.5 - px / 2, .18, px, .56, shade(wall, -.25))
      rect(.1, .22, px, py, SHINE)
      break
    case 'band':
      rect(0, .22, 1, .46, INK)
      rect(0, .22 + py, 1, .46 - 2 * py, glass)
      rect(.1, .26, px, py, SHINE)
      rect(0, .8, 1, .06, accent)
      break
    case 'arched':
      pane(.3, .3, .4, .5, false)
      rect(.36, .22, .28, .08, INK)
      rect(.42, .18, .16, .04, INK)
      break
    case 'ribbed':
      for (let col = 0; col < 4; col++) rect(col / 4, 0, px, .92, shade(wall, -.15))
      pane(.3, .12, .4, .16, false)
      break
    case 'lancet':
      opening(.32, .1, .36, .74, glass, true)
      rect(.49, .3, px, .54, INK)
      break
    case 'arcade':
      opening(.1, .1, .8, .78, shade(wall, -.55))
      break
    case 'slit':
      rect(.46, .25, .08, .4, INK)
      rect(.4, .4, .2, .08, INK)
      break
    case 'pilaster':
      column(.04, 0, .1, .92)
      pane(.3, .22, .4, .5)
      rect(.26, .14, .48, .06, shade(wall, -.15))
      break
    case 'lattice':
      break
  }
  return ctx.getImageData(0, 0, width, heightPx)
}

function shade(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1), 16)
  const channel = (shift: number) => {
    const c = (value >> shift) & 255
    return Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  }
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`
}

const worker = new Worker(new URL('./building-tiles.worker.ts', import.meta.url), { type: 'module' })
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

// Splits and tags a raw z14 building layer off the main thread.
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

export function startBuildingArt(map: MapLibreMap): void {
  const pixelRatio = map.getPixelRatio()
  map.setMissingStyleImageResolver((id) => {
    const match = /^bt-(ground|upper|roof)-(\w+)-(\d)-(\d+)$/.exec(id)
    if (!match || !(match[2] in STYLES)) return
    const image = drawImage(match[1] as Part, STYLES[match[2] as keyof typeof STYLES], Number(match[3]), Number(match[4]), pixelRatio)
    map.addImage(id, image, { pixelRatio })
  })
}
