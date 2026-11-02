import { Marker, type Map as MapLibreMap } from 'maplibre-gl'

type Position = { lon: number; lat: number }
type Ring = number[][]
type Polygon = Ring[]
type CollisionArea = { minLon: number; maxLon: number; minLat: number; maxLat: number; rings: Polygon }

const METERS_PER_RADIAN = 6_371_008.8
const SPEED_METERS_PER_SECOND = 10
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


const SPRITE_ROWS = { down: 0, downRight: 1, right: 2, upRight: 3, up: 4, upLeft: 5, left: 6, downLeft: 7 } as const
const SCREEN_DIRECTIONS = ['up', 'upRight', 'right', 'downRight', 'down', 'downLeft', 'left', 'upLeft'] as const
const TRAINER_HEIGHT_METERS = 1.8
const MIN_VISIBLE_TRAINER_HEIGHT_PX = 8
const AVATAR_RENDER_SCALE = 2
const JOYSTICK_START_MIN = .1
const JOYSTICK_START_MAX = .9
const COLLISION_RADIUS_METERS = 28
const CACHE_REFRESH_METERS = 12
const METERS_PER_DEGREE = METERS_PER_RADIAN * Math.PI / 180

function distanceMeters(a: Position, b: Position): number {
  return Math.hypot(
    (a.lon - b.lon) * METERS_PER_DEGREE * Math.cos(radians(a.lat)),
    (a.lat - b.lat) * METERS_PER_DEGREE,
  )
}

function closestOnSegment(origin: Position, a: number[], b: number[]): Position {
  const lonScale = METERS_PER_DEGREE * Math.cos(radians(origin.lat))
  const ax = (a[0] - origin.lon) * lonScale
  const ay = (a[1] - origin.lat) * METERS_PER_DEGREE
  const dx = (b[0] - a[0]) * lonScale
  const dy = (b[1] - a[1]) * METERS_PER_DEGREE
  const lenSq = dx * dx + dy * dy
  const t = lenSq ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq)) : 0
  return { lon: a[0] + (b[0] - a[0]) * t, lat: a[1] + (b[1] - a[1]) * t }
}

export function startExploration(map: MapLibreMap): void {
  const app = document.querySelector<HTMLElement>('#app')!
  const joystick = document.querySelector<HTMLElement>('#joystick')!
  const knob = document.querySelector<HTMLElement>('#joystick-knob')!
  const movementStatus = document.querySelector<HTMLElement>('#movement-status')!
  const avatar = document.createElement('div')
  avatar.className = 'trainer'
  avatar.setAttribute('role', 'img')
  avatar.setAttribute('aria-label', 'Trainer avatar')
  // Keep geographic player position and collision size unchanged while
  // enlarging only the displayed sprite for phone readability.
  avatar.style.backgroundImage = `url("${import.meta.env.BASE_URL}trainer-atlas.svg")`
  const avatarMarker = new Marker({
    element: avatar, anchor: 'bottom', rotationAlignment: 'viewport', pitchAlignment: 'viewport',
  }).setLngLat([START.lon, START.lat]).addTo(map)

  let position = { ...START }
  // Size the sprite from the nominal 1.8 m projection with a readability floor,
  // then double both dimensions without changing geographic collision.
  function updateAvatarScale(): void {
    const metersPerPixel = 2 * Math.PI * METERS_PER_RADIAN * Math.cos(radians(position.lat)) /
      (512 * 2 ** map.getZoom())
    const heightPx = Math.max(MIN_VISIBLE_TRAINER_HEIGHT_PX, TRAINER_HEIGHT_METERS / metersPerPixel) * AVATAR_RENDER_SCALE
    avatar.style.height = `${heightPx}px`
    avatar.style.width = `${heightPx * .75}px`
  }
  map.on('zoom', updateAvatarScale)
  updateAvatarScale()

  let heading = map.getBearing()
  let targetBearing = heading
  let collisionAreas: CollisionArea[] = []
  let collisionOrigin: Position | null = null
  let hasPlacedSpawn = false
  let stick = { x: 0, y: 0 }
  let activePointer: number | null = null
  let touchOrigin = { x: 0, y: 0 }
  let controlBearing = heading
  let animationTime = 0
  let lastAppearance = ''
  const keys = new Set<string>()
  let frame: number | null = null
  let lastFrameTime = 0

  function renderAvatar(moving: boolean): void {
    const relativeHeading = angleDelta(heading, map.getBearing())
    const octant = (Math.round(relativeHeading / 45) + 8) % 8
    const direction = SCREEN_DIRECTIONS[octant]
    const step = moving ? 1 + Math.floor(animationTime / .12) % 4 : 0
    const appearance = direction + ':' + step
    if (appearance === lastAppearance) return
    avatar.style.backgroundPosition = `${step * 25}% ${SPRITE_ROWS[direction] * (100 / 7)}%`
    lastAppearance = appearance
  }

  // Use source WGS84 polygons, not screen-space extrusions or rendered pixels.
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
          if (bounds.maxLon < position.lon - .002 || bounds.minLon > position.lon + .002 ||
              bounds.maxLat < position.lat - .002 || bounds.minLat > position.lat + .002) continue
          areas.push({ ...bounds, rings })
        }
      }
    }
    collisionAreas = areas
    collisionOrigin = { ...position }

    // Initial Brera coordinates can fall inside a real mapped building.
    // Spawn at a nearby mapped route, not by disabling building collisions.
    if (!hasPlacedSpawn) {
      const search = (candidate: Position) => !isBlocked(candidate) &&
        distanceMeters(START, candidate) <= 70
      let best: Position | null = null
      let bestDistance = Infinity
      if (isBlocked(position)) {
        for (const feature of map.querySourceFeatures('openmaptiles', { sourceLayer: 'transportation' })) {
          if (!['path', 'pedestrian', 'minor', 'service', 'tertiary', 'track'].includes(String(feature.properties?.class))) continue
          const geometry = feature.geometry
          if (geometry.type !== 'LineString' && geometry.type !== 'MultiLineString') continue
          const lines: number[][][] = geometry.type === 'LineString'
            ? [geometry.coordinates] : geometry.coordinates
          for (const line of lines) {
            for (let i = 1; i < line.length; i++) {
              const candidate = closestOnSegment(START, line[i - 1], line[i])
              const distance = distanceMeters(START, candidate)
              if (distance < bestDistance && search(candidate)) {
                best = candidate
                bestDistance = distance
              }
            }
          }
        }
        // Source roads may be absent. Select the nearest safe coordinate
        // using only the existing source polygons, without drawing a new road.
        if (!best) {
          for (let radius = 2; radius <= 60 && !best; radius += 2) {
            for (let bearing = 0; bearing < 360; bearing += 20) {
              const candidate = displace(START,
                Math.sin(radians(bearing)) * radius, Math.cos(radians(bearing)) * radius)
              if (search(candidate)) { best = candidate; break }
            }
          }
        }
        if (best) {
          position = best
          avatarMarker.setLngLat([position.lon, position.lat])
          map.jumpTo({ center: [position.lon, position.lat] })
          collisionOrigin = { ...position }
        }
      }
      if (!isBlocked(position)) {
        hasPlacedSpawn = true
        movementStatus.hidden = true
      } else {
        movementStatus.hidden = false
        movementStatus.textContent = 'No clear starting spot in loaded map data.'
      }
    }
  }

  function isBlocked(candidate: Position): boolean {
    // All feet contact points must remain outside mapped building/water polygons.
    return [candidate, displace(candidate, .5, 0), displace(candidate, -.5, 0),
      displace(candidate, 0, .5), displace(candidate, 0, -.5)]
      .some((point) => collisionAreas.some((area) => contains(area, point)))
  }

  function requestTick(): void {
    if (frame !== null) return
    if (!lastFrameTime) lastFrameTime = performance.now()
    frame = requestAnimationFrame(tick)
  }

  function tick(now: number): void {
    frame = null
    const dt = Math.min(Math.max((now - lastFrameTime) / 1000, 0), .05)
    lastFrameTime = now
    const landscape = window.matchMedia('(orientation: landscape)').matches
    const keyboardX = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'))
    const keyboardY = Number(keys.has('ArrowDown') || keys.has('s')) - Number(keys.has('ArrowUp') || keys.has('w'))
    const usingStick = activePointer !== null
    const x = usingStick ? stick.x : keyboardX
    const y = usingStick ? stick.y : keyboardY
    const length = Math.hypot(x, y)
    let walking = false
    let blocked = false
    // A transient tile-loading state must not freeze walking while the
    // player's already-verified local collision neighborhood is still valid.
    if (collisionOrigin && distanceMeters(position, collisionOrigin) > CACHE_REFRESH_METERS) refreshCollision()
    const ready = collisionOrigin !== null &&
      distanceMeters(position, collisionOrigin) < COLLISION_RADIUS_METERS && !isBlocked(position)
    if (!landscape && length > DEAD_ZONE && ready) {
      const magnitude = Math.min(1, (length - DEAD_ZONE) / (1 - DEAD_ZONE))
      // Both touch and keyboard report screen Y as positive downward.
      // Up is forward relative to the bearing captured at gesture start;
      // down must go backward, even while the camera turns to follow travel.
      const desiredHeading = controlBearing + degrees(Math.atan2(x, -y))
      const distance = SPEED_METERS_PER_SECOND * magnitude * dt
      const east = Math.sin(radians(desiredHeading)) * distance
      const north = Math.cos(radians(desiredHeading)) * distance
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
          blocked = true
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
    movementStatus.hidden = landscape || length <= DEAD_ZONE || (ready && !blocked)
    if (!movementStatus.hidden) {
      movementStatus.textContent = !ready
        ? 'Checking nearby OpenFreeMap terrain…' : 'A mapped building or water blocks this way.'
    }
    const turn = angleDelta(targetBearing, map.getBearing())
    const nextBearing = Math.abs(turn) < .05
      ? map.getBearing() : map.getBearing() + turn * (1 - Math.exp(-CAMERA_TURN_RATE * dt))
    if (walking || Math.abs(turn) >= .05) {
      map.jumpTo({ center: [position.lon, position.lat], bearing: nextBearing })
    }
    renderAvatar(walking)
    if ((usingStick && length > DEAD_ZONE) || keys.size || Math.abs(turn) >= .05) requestTick()
    else lastFrameTime = 0
  }

  function resetStick(): void {
    activePointer = null
    stick = { x: 0, y: 0 }
    knob.style.transform = 'translate(0px, 0px)'
    joystick.hidden = true
    movementStatus.hidden = true
    animationTime = 0
    renderAvatar(false)
  }

  function moveStick(clientX: number, clientY: number): void {
    const radius = joystick.offsetWidth * .34
    const dx = clientX - touchOrigin.x
    const dy = clientY - touchOrigin.y
    const fraction = Math.min(1, radius / (Math.hypot(dx, dy) || 1))
    stick = { x: dx * fraction / radius, y: dy * fraction / radius }
    knob.style.transform = `translate(${stick.x * radius}px, ${stick.y * radius}px)`
    requestTick()
  }

  // The finger may start anywhere in the middle 80% of the portrait viewport.
  // Top/bottom 10% and interactive HUD controls never initiate movement.
  app.addEventListener('pointerdown', (event) => {
    if (activePointer !== null || !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      window.matchMedia('(orientation: landscape)').matches) return
    if (event.target instanceof Element &&
      event.target.closest('#zoom-control, a, button, input, textarea, select')) return
    const bounds = app.getBoundingClientRect()
    const verticalFraction = (event.clientY - bounds.top) / bounds.height
    if (verticalFraction < JOYSTICK_START_MIN || verticalFraction > JOYSTICK_START_MAX) return

    event.preventDefault()
    activePointer = event.pointerId
    touchOrigin = { x: event.clientX, y: event.clientY }
    controlBearing = map.getBearing()
    joystick.style.left = `${event.clientX - bounds.left}px`
    joystick.style.top = `${event.clientY - bounds.top}px`
    joystick.hidden = false
    app.setPointerCapture(event.pointerId)
    moveStick(event.clientX, event.clientY)
  })
  app.addEventListener('pointermove', (event) => {
    if (event.pointerId === activePointer) moveStick(event.clientX, event.clientY)
  })
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    app.addEventListener(eventName, (event) => {
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
    requestTick()
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
    if (event.sourceId === 'openmaptiles' && event.isSourceLoaded &&
      (!collisionOrigin || distanceMeters(position, collisionOrigin) >= CACHE_REFRESH_METERS)) {
      refreshCollision()
    }
  })
  map.once('idle', refreshCollision)
  renderAvatar(false)
}
