import { Marker, type Map as MapLibreMap } from 'maplibre-gl'

type Position = { lon: number; lat: number }
type Ring = number[][]
type Polygon = Ring[]
type CollisionArea = { minLon: number; maxLon: number; minLat: number; maxLat: number; rings: Polygon }

const METERS_PER_RADIAN = 6_371_008.8
const SPEED_METERS_PER_SECOND = 4.5
const CAMERA_TURN_RATE = 6
const DEAD_ZONE = 0.16
const START: Position = { lon: 9.1869, lat: 45.4715 }

// Geographic heading: 0° north, 90° east. MapLibre's bearing uses the same convention.
const radians = (degrees: number) => degrees * Math.PI / 180
const degrees = (angle: number) => angle * 180 / Math.PI
const angleDelta = (target: number, current: number) => ((target - current + 540) % 360) - 180

function displace(position: Position, east: number, north: number): Position {
  return {
    lon: position.lon + degrees(east / (METERS_PER_RADIAN * Math.cos(radians(position.lat)))),
    lat: position.lat + degrees(north / METERS_PER_RADIAN),
  }
}

function inRing(point: Position, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a[1] > point.lat) !== (b[1] > point.lat) &&
      point.lon < (b[0] - a[0]) * (point.lat - a[1]) / (b[1] - a[1]) + a[0]) {
      inside = !inside
    }
  }
  return inside
}

function contains(area: CollisionArea, point: Position): boolean {
  if (point.lon < area.minLon || point.lon > area.maxLon ||
      point.lat < area.minLat || point.lat > area.maxLat ||
      !inRing(point, area.rings[0])) return false
  // Holes are walkable; the source's actual polygon rings define the boundary.
  for (let i = 1; i < area.rings.length; i++) {
    if (inRing(point, area.rings[i])) return false
  }
  return true
}

function trainerSvg(direction: 'up' | 'down' | 'left' | 'right', stride: number): string {
  const back = direction === 'up'
  const side = direction === 'left' || direction === 'right'
  const flipped = direction === 'left' ? 'translate(48 0) scale(-1 1)' : ''
  const swing = stride * 17
  // An original, deliberately small vector trainer. Feet and shadow share one ground anchor.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 80" aria-hidden="true">
    <ellipse cx="24" cy="75" rx="14" ry="4" fill="#203b37" opacity=".25"/>
    <g transform="${flipped}">
      <g transform="rotate(${swing} 20 52)">
        <path d="M17 48h8l-1 18-1 4h-8l1-8z" fill="#293d52"/>
        <path d="M14 67h10v5H12z" fill="#513f32"/>
      </g>
      <g transform="rotate(${-swing} 29 52)">
        <path d="M25 48h8l1 18v4h-9l-1-8z" fill="#354b60"/>
        <path d="M24 67h11v5H24z" fill="#624835"/>
      </g>
      ${back ? '<rect x="10" y="32" width="28" height="24" rx="7" fill="#d3a354"/><rect x="16" y="38" width="16" height="12" rx="3" fill="#eac675"/>' : ''}
      <g transform="rotate(${-swing * .55} 12 37)">
        <path d="M13 31 8 37 10 49 15 48 18 36z" fill="#b88d68"/>
        <path d="M10 35 7 42 12 44 17 36z" fill="#2b6a65"/>
      </g>
      <g transform="rotate(${swing * .55} 36 37)">
        <path d="M35 31 40 37 38 49 33 48 30 36z" fill="#b88d68"/>
        <path d="M38 35 41 42 36 44 31 36z" fill="#2b6a65"/>
      </g>
      <path d="M16 30h16l5 20-13 4-13-4z" fill="#377e75"/>
      <path d="M18 33h12v15H18z" fill="#4a988a"/>
      ${back ? '<path d="M14 34h20v21H14z" fill="#d5a352"/><path d="M19 38h10v10H19z" fill="#edca77"/>' :
        '<path d="M22 32h4v19h-4z" fill="#e4c37b"/><path d="M19 50h10v3H19z" fill="#244f4a"/>'}
      <rect x="20" y="26" width="8" height="7" rx="2" fill="#c58f6f"/>
      <path d="M15 13q9-9 18 0v13q-3 8-9 8t-9-8z" fill="#c99771"/>
      ${back ? '<path d="M15 14q8-8 18 0v14q-8 6-18 0z" fill="#423a36"/>' :
        side ? '<circle cx="30" cy="23" r="1.5" fill="#2a2927"/><path d="M33 26h3l-3 2z" fill="#ab7659"/>' :
        '<circle cx="20" cy="23" r="1.4" fill="#2a2927"/><circle cx="28" cy="23" r="1.4" fill="#2a2927"/><path d="M22 28h4" stroke="#8d5f4d" stroke-width="1.5"/>'}
      <path d="M13 14q1-14 11-14 12 0 13 14v5H13z" fill="#dd6c3f"/>
      <path d="M13 14h25v5H12z" fill="#f3a45c"/>
      <path d="M20 5h8v5h-8z" fill="#f3c579"/>
    </g>
  </svg>`
}

export function startExploration(map: MapLibreMap): void {
  const joystick = document.querySelector<HTMLElement>('#joystick')!
  const knob = document.querySelector<HTMLElement>('#joystick-knob')!
  const movementStatus = document.querySelector<HTMLElement>('#movement-status')!
  const avatar = document.createElement('div')
  avatar.className = 'trainer'
  avatar.setAttribute('role', 'img')
  avatar.setAttribute('aria-label', 'Trainer avatar')
  let position = { ...START }
  let heading = map.getBearing()
  let targetBearing = heading
  let collisionAreas: CollisionArea[] = []
  let collisionOrigin: Position | null = null
  let stick = { x: 0, y: 0 }
  let activePointer: number | null = null
  let controlBearing = heading
  let animationTime = 0
  let lastAppearance = ''
  const keys = new Set<string>()
  let frame: number | null = null
  let lastFrameTime = 0

  function renderAvatar(moving: boolean): void {
    const relativeHeading = angleDelta(heading, map.getBearing())
    const direction = Math.abs(relativeHeading) <= 45 ? 'up'
      : relativeHeading > 45 && relativeHeading < 135 ? 'right'
        : relativeHeading < -45 && relativeHeading > -135 ? 'left' : 'down'
    const step = moving ? [0, 1, 0, -1][Math.floor(animationTime / .135) % 4] : 0
    const appearance = direction + ':' + step + ':' + moving
    if (appearance !== lastAppearance) {
      avatar.innerHTML = trainerSvg(direction, step)
      lastAppearance = appearance
    }
  }

  // Source features carry true WGS84 polygon rings; do not use screen-space
  // rendered extrusions for collisions (those change with camera pitch/bearing).
  function refreshCollision(): void {
    if (!map.isSourceLoaded('openmaptiles')) return
    const areas: CollisionArea[] = []
    for (const layer of ['building', 'water']) {
      for (const feature of map.querySourceFeatures('openmaptiles', { sourceLayer: layer })) {
        const geometry = feature.geometry
        if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') continue
        const polygons: Polygon[] = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
        for (const rings of polygons) {
          if (!rings.length || rings[0].length < 3) continue
          const bounds = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity }
          for (const point of rings[0]) {
            bounds.minLon = Math.min(bounds.minLon, point[0])
            bounds.maxLon = Math.max(bounds.maxLon, point[0])
            bounds.minLat = Math.min(bounds.minLat, point[1])
            bounds.maxLat = Math.max(bounds.maxLat, point[1])
          }
          // Only keep geometry near this player, regardless of world tile count.
          if (bounds.maxLon < position.lon - .003 || bounds.minLon > position.lon + .003 ||
              bounds.maxLat < position.lat - .003 || bounds.minLat > position.lat + .003) continue
          areas.push({ ...bounds, rings })
        }
      }
    }
    collisionAreas = areas
    collisionOrigin = { ...position }
  }

  function isBlocked(candidate: Position): boolean {
    // A small foot-contact margin keeps the sprite out of mapped walls/water.
    return [candidate, displace(candidate, .5, 0), displace(candidate, -.5, 0),
      displace(candidate, 0, .5), displace(candidate, 0, -.5)]
      .some((point) => collisionAreas.some((area) => contains(area, point)))
  }

  function requestTick(): void {
    if (frame === null) {
      lastFrameTime = performance.now()
      frame = requestAnimationFrame(tick)
    }
  }

  function tick(now: number): void {
    frame = null
    const dt = Math.min((now - lastFrameTime) / 1000, .05)
    lastFrameTime = now
    const landscape = window.matchMedia('(orientation: landscape)').matches
    const keyboardX = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'))
    const keyboardY = Number(keys.has('ArrowDown') || keys.has('s')) - Number(keys.has('ArrowUp') || keys.has('w'))
    const usingStick = activePointer !== null
    const x = usingStick ? stick.x : keyboardX
    const y = usingStick ? stick.y : keyboardY
    const length = Math.hypot(x, y)
    let walking = false
    const tilesReady = map.isSourceLoaded('openmaptiles')
    movementStatus.hidden = !length || landscape || tilesReady
    if (!landscape && length > DEAD_ZONE && tilesReady) {
      if (!collisionOrigin || Math.abs(position.lon - collisionOrigin.lon) > .0006 ||
        Math.abs(position.lat - collisionOrigin.lat) > .0006) refreshCollision()

      const magnitude = Math.min(1, (length - DEAD_ZONE) / (1 - DEAD_ZONE))
      const desiredHeading = controlBearing + degrees(Math.atan2(x, -y))
      const distance = SPEED_METERS_PER_SECOND * magnitude * dt
      const east = Math.sin(radians(desiredHeading)) * distance
      const north = Math.cos(radians(desiredHeading)) * distance
      // Sliding along a wall is allowed, but never accept a position in mapped
      // solid geometry. If tiles aren't loaded we do not guess passability.
      let actualEast = east
      let actualNorth = north
      let candidate = displace(position, east, north)
      if (isBlocked(candidate)) {
        const eastOnly = displace(position, east, 0)
        const northOnly = displace(position, 0, north)
        if (Math.abs(east) > .00001 && !isBlocked(eastOnly)) {
          candidate = eastOnly
          actualNorth = 0
        } else if (Math.abs(north) > .00001 && !isBlocked(northOnly)) {
          candidate = northOnly
          actualEast = 0
        } else {
          actualEast = 0
          actualNorth = 0
        }
      }
      if (actualEast || actualNorth) {
        position = candidate
        walking = true
        heading = degrees(Math.atan2(actualEast, actualNorth))
        targetBearing = heading
        animationTime += dt
        avatarMarker.setLngLat([position.lon, position.lat])
      }
    }
    if (!walking) animationTime = 0
    const turn = angleDelta(targetBearing, map.getBearing())
    const nextBearing = Math.abs(turn) < .05
      ? map.getBearing() : map.getBearing() + turn * (1 - Math.exp(-CAMERA_TURN_RATE * dt))
    if (walking || Math.abs(turn) >= .05) {
      map.jumpTo({ center: [position.lon, position.lat], bearing: nextBearing })
    }
    renderAvatar(walking)
    if ((usingStick && length > DEAD_ZONE) || keys.size || Math.abs(turn) >= .05) requestTick()
  }

  const avatarMarker = new Marker({
    element: avatar, anchor: 'bottom', rotationAlignment: 'viewport', pitchAlignment: 'viewport',
  }).setLngLat([START.lon, START.lat]).addTo(map)

  function resetStick(): void {
    activePointer = null
    stick = { x: 0, y: 0 }
    knob.style.transform = 'translate(0px, 0px)'
    joystick.classList.remove('engaged')
    movementStatus.hidden = true
  }

  function moveStick(clientX: number, clientY: number): void {
    const bounds = joystick.getBoundingClientRect()
    const radius = bounds.width * .34
    const dx = clientX - (bounds.left + bounds.width / 2)
    const dy = clientY - (bounds.top + bounds.height / 2)
    const fraction = Math.min(1, radius / (Math.hypot(dx, dy) || 1))
    stick = { x: dx * fraction / radius, y: dy * fraction / radius }
    knob.style.transform = `translate(${stick.x * radius}px, ${stick.y * radius}px)`
    requestTick()
  }

  joystick.addEventListener('pointerdown', (event) => {
    if (activePointer !== null) return
    event.preventDefault()
    activePointer = event.pointerId
    controlBearing = map.getBearing() // Lock transform for this gesture: no feedback loop.
    joystick.setPointerCapture(event.pointerId)
    joystick.classList.add('engaged')
    moveStick(event.clientX, event.clientY)
  })
  joystick.addEventListener('pointermove', (event) => {
    if (event.pointerId === activePointer) moveStick(event.clientX, event.clientY)
  })
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    joystick.addEventListener(eventName, (event) => {
      if ((event as PointerEvent).pointerId === activePointer) resetStick()
    })
  }
  const directionKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'])
  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (!directionKeys.has(key)) return
    event.preventDefault()
    if (keys.size === 0 && activePointer === null) controlBearing = map.getBearing()
    keys.add(key)
    requestTick()
  })
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key)
  })
  window.addEventListener('blur', () => { resetStick(); keys.clear() })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resetStick(); keys.clear() }
  })
  window.matchMedia('(orientation: landscape)').addEventListener('change', () => {
    resetStick()
    keys.clear()
  })
  map.on('sourcedata', (event) => {
    if (event.sourceId === 'openmaptiles' && event.isSourceLoaded) refreshCollision()
  })
  map.on('load', refreshCollision)
  renderAvatar(false)
}
