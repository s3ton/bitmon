import { AttributionControl, Map, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import { startExploration } from './exploration'

setWorkerUrl(workerUrl)

// Every geographic layer reads geometry from this single OpenFreeMap tile source.
// Only its visual treatment (color, line width and building height fallback) is ours.
const style: StyleSpecification = {
  version: 8,
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet/latest',
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
    {
      id: 'buildings', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building',
      minzoom: 14,
      filter: ['!=', ['get', 'hide_3d'], true],
      paint: {
        'fill-extrusion-color': ['case',
          ['>', ['to-number', ['get', 'render_height'], 0], 0], '#d6bda3', '#c4c6ac'],
        'fill-extrusion-height': ['case',
          ['>', ['to-number', ['get', 'render_height'], 0], 0],
          ['to-number', ['get', 'render_height']], 14],
        'fill-extrusion-base': ['to-number', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 1,
        'fill-extrusion-vertical-gradient': false,
      },
    },
  ],
}

const status = document.querySelector<HTMLParagraphElement>('#status')!
const zoomSlider = document.querySelector<HTMLInputElement>('#zoom-slider')!
const zoomValue = document.querySelector<HTMLOutputElement>('#zoom-value')!

const map = new Map({
  container: 'map',
  style,
  center: [9.1869, 45.4715], // Brera, Milan: geographic coordinates, not a fictional level.
  zoom: 16.4,
  minZoom: 15.5,
  maxZoom: 20,
  pitch: 45,
  minPitch: 45,
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
map.once('idle', () => { status.hidden = true })
startExploration(map)
map.on('error', () => {
  status.hidden = false
  status.textContent = 'Map data unavailable. Reconnect to load this neighborhood.'
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.warn('Offline shell unavailable', error)
    })
  })
}
