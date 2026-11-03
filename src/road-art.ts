import type { ExpressionSpecification, FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'
import { CARRIAGEWAY_METRES, PARAPET_METRES, PATH_METRES, STREETS } from './road-tiles'

// Street art for mapped OpenFreeMap transportation features: asphalt with
// kerbs, sidewalks and lane markings, paved or dirt footways, tiled plazas,
// bridge decks and painted crossings. Geometry stays exactly as sourced; only
// colours, widths and surface patterns are invented. Widths are true ground
// metres via the worker's per-tile `bitmon_ppm`; tunnels, indoor corridors and
// underground levels are not drawn on the street surface.
//
// Line patterns stretch to the line width, so one image serves every zoom.
// Plaza and deck fill patterns are sized per integer tile zoom like facades:
// each zoom gets its own power-of-two image so paving keeps its ground size.

const SOURCE = 'openmaptiles'
const ROADS = Object.keys(CARRIAGEWAY_METRES)
const MARKED = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']
const SIDEWALK_METRES = 2.5
const KERB_METRES = .3
const CROSSING_METRES = 3
const STRIPE_METRES = .5

const ASPHALT = '#80838a'
const DIRT = '#cdb48a'
const PAINT = '#f4f1e6'

type Expression = ExpressionSpecification

const lines: Expression = ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]]
const areas: Expression = ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]]
const onSurface: Expression = ['all', ['!=', ['get', 'brunnel'], 'tunnel'], ['!=', ['get', 'indoor'], 1],
  ['>=', ['to-number', ['get', 'layer'], 0], 0], ['>=', ['to-number', ['get', 'level'], 0], 0]]
const atGround: Expression = ['all', lines, onSurface, ['!=', ['get', 'brunnel'], 'bridge']]
const onBridge: Expression = ['all', lines, ['==', ['get', 'brunnel'], 'bridge']]
const classIn = (classes: string[]): Expression => ['in', ['get', 'class'], ['literal', classes]]
const unpaved: Expression = ['any', ['==', ['get', 'surface'], 'unpaved'], ['==', ['get', 'class'], 'track']]

const carriageway: Expression = ['to-number', ['get', ['get', 'class'], ['literal', CARRIAGEWAY_METRES]], 0]
const pathWidth: Expression = ['to-number', ['get', ['coalesce', ['get', 'subclass'], ''], ['literal', PATH_METRES]], 2]

// Ground metres to CSS px; MapLibre doubles line widths per zoom level here.
function metres(value: Expression | number): Expression {
  const ppm: Expression = ['to-number', ['get', 'bitmon_ppm'], 1]
  return ['interpolate', ['exponential', 2], ['zoom'], 15, ['*', value, ppm, .5], 18, ['*', value, ppm, 4]]
}

function zoomPattern(name: Expression): Expression {
  const at = (zoom: number): Expression => ['concat', name, '-', String(zoom)]
  return ['step', ['zoom'], at(15), 16, at(16), 17, at(17), 18, at(18)]
}

const round = { 'line-cap': 'round', 'line-join': 'round' } as const
const transportation = { type: 'line', source: SOURCE, 'source-layer': 'transportation' } as const

export function roadLayers(): (FillLayerSpecification | LineLayerSpecification)[] {
  return [
    { id: 'plazas', type: 'fill', source: SOURCE, 'source-layer': 'transportation', filter: ['all', areas, onSurface],
      paint: { 'fill-pattern': zoomPattern(['match', ['get', 'class'], ['bridge', 'pier'], 'rd-deck', 'rd-plaza']) } },
    // Painted under the kerb and asphalt; only the outer strips stay visible.
    { ...transportation, id: 'sidewalks', layout: round,
      filter: ['all', atGround, classIn(STREETS), ['!=', ['get', 'bitmon_sidewalk'], 'mapped']],
      paint: { 'line-pattern': 'rd-sidewalk', 'line-width': metres(['+', carriageway, 2 * SIDEWALK_METRES]) } },
    { ...transportation, id: 'kerbs', layout: round, filter: ['all', atGround, classIn(ROADS)],
      paint: { 'line-color': ['case', unpaved, DIRT, '#c9c3b5'], 'line-width': metres(['+', carriageway, 2 * KERB_METRES]) } },
    { ...transportation, id: 'asphalt', layout: round, filter: ['all', atGround, classIn(ROADS)],
      paint: { 'line-color': ['case', unpaved, DIRT, ASPHALT], 'line-width': metres(carriageway) } },
    { ...transportation, id: 'alleys', layout: round, filter: ['all', atGround, ['==', ['get', 'service'], 'alley']],
      paint: { 'line-pattern': 'rd-setts', 'line-width': metres(carriageway) } },
    { ...transportation, id: 'centre-lines', filter: ['all', atGround, classIn(MARKED)],
      paint: { 'line-color': PAINT, 'line-width': metres(.3), 'line-dasharray': [8, 8] } },
    { ...transportation, id: 'edge-lines', filter: ['all', atGround, classIn(MARKED.slice(0, 3))],
      paint: { 'line-color': PAINT, 'line-width': metres(.2), 'line-gap-width': metres(['-', carriageway, 1]) } },
    { ...transportation, id: 'footways', layout: round, filter: ['all', atGround, ['==', ['get', 'class'], 'path']],
      paint: {
        'line-pattern': ['match', ['get', 'subclass'], 'steps', 'rd-steps', 'cycleway', 'rd-cycleway',
          ['match', ['get', 'surface'], 'unpaved', 'rd-dirt', 'paved', 'rd-paving',
            ['match', ['get', 'subclass'], ['path', 'bridleway'], 'rd-dirt', 'rd-paving']]],
        'line-width': metres(pathWidth),
      } },
    // Asphalt first so the footway's paving does not show between the stripes.
    { type: 'line', source: SOURCE, 'source-layer': 'bitmon_crossing', id: 'crossings',
      paint: { 'line-color': ASPHALT, 'line-width': metres(CROSSING_METRES) } },
    { type: 'line', source: SOURCE, 'source-layer': 'bitmon_crossing', id: 'crossing-stripes',
      paint: { 'line-color': PAINT, 'line-width': metres(CROSSING_METRES),
        'line-dasharray': [STRIPE_METRES / CROSSING_METRES, STRIPE_METRES / CROSSING_METRES] } },
    // Bridges after the ground network so they pass over the roads below.
    { ...transportation, id: 'bridge-sides', layout: { ...round, 'line-sort-key': ['to-number', ['get', 'layer'], 1] },
      filter: ['all', onBridge, ['any', classIn(ROADS), ['==', ['get', 'class'], 'path']]],
      paint: { 'line-color': '#6f6a62',
        'line-width': metres(['+', ['case', ['==', ['get', 'class'], 'path'], pathWidth, carriageway], PARAPET_METRES]) } },
    { ...transportation, id: 'bridges', layout: { ...round, 'line-sort-key': ['to-number', ['get', 'layer'], 1] },
      filter: ['all', onBridge, ['any', classIn(ROADS), ['==', ['get', 'class'], 'path']]],
      paint: { 'line-color': ['case', ['==', ['get', 'class'], 'path'], '#cbbfa8', unpaved, DIRT, ASPHALT],
        'line-width': metres(['case', ['==', ['get', 'class'], 'path'], pathWidth, carriageway]) } },
  ]
}

type Paint = (rect: (x: number, y: number, w: number, h: number, colour: string) => void, size: number) => void

function draw(cssSize: number, pixelRatio: number, paint: Paint): ImageData {
  const size = Math.round(cssSize * pixelRatio)
  const ctx = new OffscreenCanvas(size, size).getContext('2d')!
  // Fractions of the image, snapped to whole device pixels.
  paint((x, y, w, h, colour) => {
    ctx.fillStyle = colour
    const [x0, y0] = [Math.round(x * size), Math.round(y * size)]
    ctx.fillRect(x0, y0, Math.max(1, Math.round((x + w) * size) - x0), Math.max(1, Math.round((y + h) * size) - y0))
  }, size)
  return ctx.getImageData(0, 0, size, size)
}

// A grid of stones with grout, every other row shifted half a stone when
// staggered. Tones are deterministic, and a stone cut by the image edge keeps
// its tone where the pattern repeats.
function stones(rect: Parameters<Paint>[0], rows: number, cols: number, grout: string, tones: string[], stagger: boolean): void {
  rect(0, 0, 1, 1, grout)
  for (let j = 0; j < rows; j++) {
    const shift = stagger && j % 2 ? -.5 : 0
    for (let i = 0; i <= cols; i++) {
      const left = Math.max(0, (i + shift + .06) / cols), right = Math.min(1, (i + shift + .94) / cols)
      const column = i % cols
      if (right > left) rect(left, (j + .08) / rows, right - left, .84 / rows, tones[(column * 5 + j * 3 + column * j) % tones.length])
    }
  }
}

// Line patterns: x runs along the line, y spans its width.
const LINE_PATTERNS: Record<string, Paint> = {
  'rd-sidewalk': (rect) => stones(rect, 8, 8, '#cfc6b2', ['#e3dccb', '#e7e0d0', '#ddd5c3'], false),
  'rd-paving': (rect) => stones(rect, 2, 2, '#d2c3a4', ['#e8dcc2', '#e2d4b8', '#ece2cb'], true),
  'rd-setts': (rect) => stones(rect, 4, 4, '#9b917f', ['#b9ae9c', '#c2b8a6', '#b1a692'], true),
  'rd-steps': (rect) => {
    for (let i = 0; i < 4; i++) {
      rect(i / 4, 0, 1 / 4, 1, '#d9cfbb')
      rect(i / 4 + .19, 0, .06, 1, '#a99f8b')
    }
  },
  'rd-cycleway': (rect) => {
    rect(0, 0, 1, 1, '#c9826d')
    rect(0, 0, 1, .1, PAINT)
    rect(0, .9, 1, .1, PAINT)
  },
  'rd-dirt': (rect) => {
    rect(0, 0, 1, 1, DIRT)
    for (let i = 0; i < 24; i++) rect((i * 37 % 32) / 32, (i * 19 % 32) / 32, 1 / 16, 1 / 16, i % 2 ? '#bba077' : '#dcc7a2')
  },
}

// Fill patterns: one ground-sized repeat (about 27 m) per image at every zoom.
const FILL_PATTERNS: Record<string, Paint> = {
  'rd-plaza': (rect) => stones(rect, 8, 8, '#cdbb98', ['#e4d6bd', '#ddcdb0', '#e9dcc6'], true),
  'rd-deck': (rect) => {
    rect(0, 0, 1, 1, '#a99a84')
    for (let j = 0; j < 8; j++) rect(0, j / 8, 1, 1 / 32, '#8f816d')
  },
}

// Draws a road pattern image the first time a tile needs it.
export function roadImage(id: string, pixelRatio: number): ImageData | undefined {
  if (LINE_PATTERNS[id]) return draw(32, pixelRatio, LINE_PATTERNS[id])
  const match = /^(rd-\w+)-(\d+)$/.exec(id)
  if (!match || !FILL_PATTERNS[match[1]]) return undefined
  // Power-of-two CSS sizes divide the 512 px tile, so paving lines up across seams.
  return draw(32 * 2 ** (Number(match[2]) - 16), pixelRatio, FILL_PATTERNS[match[1]])
}
