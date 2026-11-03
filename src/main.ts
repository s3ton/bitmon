import { addProtocol, AttributionControl, Map, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import { buildingLayers, enrichTile, startBuildingArt } from './building-art'
import { startExploration } from './exploration'
import { registerPwa } from './pwa'
import { initializeSettings } from './settings'
import { MAP_CACHE_LIMIT_MIB, offlineMap, savedPosition } from './offline-map'

setWorkerUrl(workerUrl)
addProtocol('bitmon', async (params, controller) => {
  // The offline cache keeps source bytes; facade tags are derived per delivery.
  const [, , x, y] = new URL(params.url).pathname.split(/[/.]/).map(Number)
  return { data: await enrichTile(await offlineMap.loadProtocolTile(params.url, controller.signal), x, y) }
})
const startingPosition = savedPosition()
offlineMap.setPlayerPosition(startingPosition)

// Every geographic layer reads geometry from this single OpenFreeMap tile source.
// Only its visual treatment (color, line width, facade art and building height fallback) is ours.
const style: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: {
      type: 'vector',
      tiles: ['bitmon://tiles/{z}/{x}/{y}.pbf'],
      maxzoom: 14,
      attribution: '© OpenFreeMap · © OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'ground', type: 'background', paint: { 'background-color': '#e7e3d5' } },
    {
      id: 'landuse', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
      paint: {
        'fill-color': ['match', ['get', 'class'],
          'residential', '#e9e2d4',
          'commercial', '#e6dfcf',
          'industrial', '#d9d8c8',
          'cemetery', '#bfd0ae',
          'pitch', '#a6c8a7',
          'playground', '#c7d9aa',
          '#d7ddc6'],
      },
    },
    {
      id: 'landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      paint: {
        'fill-color': ['match', ['get', 'class'],
          'wood', '#9fbea1', 'grass', '#c1d6ae', 'farmland', '#d6d5ad', '#cad8b6'],
      },
    },
    {
      id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      paint: { 'fill-color': '#8bbdc2' },
    },
    {
      id: 'waterways', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway',
      paint: { 'line-color': '#8bbdc2', 'line-width': 2.5 },
    },
    {
      id: 'mapped-plazas', type: 'fill', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: { 'fill-color': '#eee8d8' },
    },
    {
      id: 'roads-edge', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['in', ['get', 'class'],
        ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service', 'track', 'busway']]],
      paint: {
        'line-color': '#cfc8b9',
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 3, 17, 15],
      },
    },
    {
      id: 'roads', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['in', ['get', 'class'],
        ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service', 'track', 'busway']]],
      paint: {
        'line-color': '#f6f0e1',
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 2, 17, 11],
      },
    },
    {
      id: 'paths', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'path'],
      paint: {
        'line-color': '#e8ddc4',
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 17, 5],
        'line-dasharray': [1, 1.25],
      },
    },
    ...buildingLayers(),
  ],
}

const status = document.querySelector<HTMLParagraphElement>('#status')!
const zoomSlider = document.querySelector<HTMLInputElement>('#zoom-slider')!
const zoomValue = document.querySelector<HTMLOutputElement>('#zoom-value')!
initializeSettings()
zoomValue.value = Number(zoomSlider.value).toFixed(1)
const cacheStatus = document.querySelector<HTMLElement>('#offline-cache-status')!
offlineMap.setStatusListener((bytes, persistent) => {
  cacheStatus.textContent = persistent
    ? 'Offline map: ' + (bytes / 1024 / 1024).toFixed(1) + ' / ' + MAP_CACHE_LIMIT_MIB + ' MiB'
    : 'Offline map storage unavailable'
})

const map = new Map({
  container: 'map',
  style,
  center: [startingPosition.lon, startingPosition.lat],
  zoom: Number(zoomSlider.value),
  minZoom: 15.5,
  maxZoom: 20,
  pitch: 45,
  minPitch: 0,
  maxPitch: 45,
  bearing: -20,
  interactive: false,
  attributionControl: false,
  pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  canvasContextAttributes: { antialias: false },
})

zoomSlider.addEventListener('input', () => {
  const zoom = Number(zoomSlider.value)
  zoomValue.value = zoom.toFixed(1)
  map.setZoom(zoom)
})
map.addControl(new AttributionControl({ compact: false }), 'bottom-right')
map.on('idle', () => {
  if (map.isSourceLoaded('openmaptiles') && map.areTilesLoaded()) status.hidden = true
})
startBuildingArt(map)
startExploration(map, startingPosition)
map.on('error', () => {
  status.classList.add('map-warning')
  status.hidden = false
  status.textContent = 'Some map tiles are unavailable. Reconnect to explore farther.'
})

registerPwa()
