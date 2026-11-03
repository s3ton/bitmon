import { Marker, type Map as MapLibreMap } from 'maplibre-gl'
import { offlineMap, savePosition, tileKeyAt, validPosition, type Position } from './offline-map'

type Ring = number[][]
type Polygon = Ring[]
type CollisionArea = { minLon: number; maxLon: number; minLat: number; maxLat: number; rings: Polygon; height?: number }

const METERS_PER_RADIAN = 6_371_008.8
const SPEED_METERS_PER_SECOND = 10
// Presets deliberately keep translation responsive while limiting automatic yaw.
const CAMERA_PRESETS = {
  relaxed: { delay: .7, maxDegreesPerSecond: 35, dampingSeconds: 1.2 },
  balanced: { delay: .4, maxDegreesPerSecond: 60, dampingSeconds: .8 },
  responsive: { delay: .15, maxDegreesPerSecond: 100, dampingSeconds: .45 },
} as const
type CameraPreset = keyof typeof CAMERA_PRESETS
const CAMERA_HEADING_DEAD_ZONE = 12
const CAMERA_BACKWARD_ANGLE = 135
const CAMERA_EXPLORATION_PITCH = 45
const CAMERA_PITCH_SAFETY_METERS = 1
const CAMERA_PITCH_SCAN_SECONDS = .1
const CAMERA_PITCH_RETURN_RATE = 45
const DEAD_ZONE = 0.16

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

// Return the nearest source footprint crossed by a ray from the player toward
// the camera. This stays in world meters and does not infer a missing building.
function rayDistanceToBuilding(position: Position, bearing: number, area: CollisionArea): number {
  const lonScale = METERS_PER_DEGREE * Math.cos(radians(position.lat))
  const ray = radians(bearing + 180)
  const east = Math.sin(ray)
  const north = Math.cos(ray)
  let nearest = Infinity
  const ring = area.rings[0]
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = (ring[j][0] - position.lon) * lonScale
    const ay = (ring[j][1] - position.lat) * METERS_PER_DEGREE
    const sx = (ring[i][0] - ring[j][0]) * lonScale
    const sy = (ring[i][1] - ring[j][1]) * METERS_PER_DEGREE
    const det = east * sy - north * sx
    if (Math.abs(det) < .000001) continue
    const rayDistance = (ax * sy - ay * sx) / det
    const onEdge = (ax * north - ay * east) / det
    if (rayDistance > 0 && onEdge >= 0 && onEdge <= 1) {
      nearest = Math.min(nearest, rayDistance)
    }
  }
  return nearest
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

export function startExploration(map: MapLibreMap, initialPosition: Position): void {
  const app = document.querySelector<HTMLElement>('#app')!
  const joystick = document.querySelector<HTMLElement>('#joystick')!
  const knob = document.querySelector<HTMLElement>('#joystick-knob')!
  const movementStatus = document.querySelector<HTMLElement>('#movement-status')!
  const cameraMenu = document.querySelector<HTMLDetailsElement>('#camera-control')!
  const cameraPresetSelect = document.querySelector<HTMLSelectElement>('#camera-preset')!
  const coordinateForm = document.querySelector<HTMLFormElement>('#coordinate-form')!
  const coordinateInput = document.querySelector<HTMLInputElement>('#coordinate-input')!
  const coordinateGo = document.querySelector<HTMLButtonElement>('#coordinate-go')!
  const coordinateStatus = document.querySelector<HTMLElement>('#coordinate-status')!
  const coordinateDisplay = document.querySelector<HTMLElement>('#world-coordinates')!
  const avatar = document.createElement('div')
  avatar.className = 'trainer'
  avatar.setAttribute('role', 'img')
  avatar.setAttribute('aria-label', 'Trainer avatar')
  // Keep geographic player position and collision size unchanged while
  // enlarging only the displayed sprite for phone readability.
  avatar.style.backgroundImage = `url("${import.meta.env.BASE_URL}trainer-atlas.svg")`
  const avatarMarker = new Marker({
    element: avatar, anchor: 'bottom', rotationAlignment: 'viewport', pitchAlignment: 'viewport',
  }).setLngLat([initialPosition.lon, initialPosition.lat]).addTo(map)

  let position = { ...initialPosition }
  let lastPositionSave = 0
  function persistProgress(force = false): void {
    const now = performance.now()
    if (!force && now - lastPositionSave < 1500) return
    lastPositionSave = now
    savePosition(position)
    coordinateDisplay.textContent = position.lat.toFixed(5) + ', ' + position.lon.toFixed(5)
  }
  coordinateDisplay.textContent = position.lat.toFixed(5) + ', ' + position.lon.toFixed(5)
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
  let collisionAreas: CollisionArea[] = []
  let collisionOrigin: Position | null = null
  const decodedTiles = new Set<string>()
  let hasPlacedSpawn = false
  let teleporting = false
  let stick = { x: 0, y: 0 }
  let activePointer: number | null = null
  let touchOrigin = { x: 0, y: 0 }
  let controlBearing = heading
  let cameraPreset: CameraPreset = cameraPresetSelect.value as CameraPreset
  let steadyHeading: number | null = null
  let steadySeconds = 0
  let occlusionScanSeconds = CAMERA_PITCH_SCAN_SECONDS
  let desiredPitch = CAMERA_EXPLORATION_PITCH
  cameraPresetSelect.addEventListener('change', () => {
    cameraPreset = cameraPresetSelect.value as CameraPreset
    steadyHeading = null
    steadySeconds = 0
    cameraMenu.open = false
  })
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

  // A 1 m ring covers the player's foot probes and the next 0.5 m step.
  // Missing distant viewport tiles must not invalidate this local geometry.
  function neighborhoodReady(point: Position): boolean {
    for (const east of [-1, 0, 1]) {
      for (const north of [-1, 0, 1]) {
        if (!tileReady(displace(point, east, north))) return false
      }
    }
    return true
  }

  // Use source WGS84 polygons, not screen-space extrusions or rendered pixels.
  function refreshCollision(): void {
    if (!neighborhoodReady(position)) return
    const areas: CollisionArea[] = []
    const seen = new Set<string>()
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
          // Match the height fallback used by the fill-extrusion layer.
          const sourceHeight = Number(feature.properties?.render_height)
          const height = layer === 'building' && feature.properties?.hide_3d !== true
            ? (Number.isFinite(sourceHeight) && sourceHeight > 0 ? sourceHeight : 14)
            : undefined
          // Exact duplicates have the same geometry and appearance. Keep any
          // overlapping footprints with different heights for safe occlusion.
          const signature = layer + ':' + height + ':' + JSON.stringify(rings)
          if (seen.has(signature)) continue
          seen.add(signature)
          areas.push({ ...bounds, rings, height })
        }
      }
    }
    collisionAreas = areas
    collisionOrigin = { ...position }
    occlusionScanSeconds = CAMERA_PITCH_SCAN_SECONDS
    requestTick()

    // The default or restored spawn point can fall inside a mapped building.
    // Spawn at a nearby mapped route, not by disabling building collisions.
    if (!hasPlacedSpawn && !teleporting) {
      const search = (candidate: Position) => !isBlocked(candidate) &&
        distanceMeters(initialPosition, candidate) <= 70
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
              const candidate = closestOnSegment(initialPosition, line[i - 1], line[i])
              const distance = distanceMeters(initialPosition, candidate)
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
              const candidate = displace(initialPosition,
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
          offlineMap.setPlayerPosition(position)
        }
      }
      if (!isBlocked(position)) {
        hasPlacedSpawn = true
        movementStatus.hidden = true
        persistProgress(true)
      } else {
        movementStatus.hidden = false
        movementStatus.textContent = 'No clear starting spot in loaded map data.'
      }
    }
  }

  // A building can occlude a DOM marker, which otherwise draws over 3D walls.
  // Tilt toward overhead only as far as the nearest mapped building requires.
  function safeCameraPitch(bearing: number): number {
    let result = CAMERA_EXPLORATION_PITCH
    for (const area of collisionAreas) {
      if (area.height === undefined) continue
      const distance = rayDistanceToBuilding(position, bearing, area)
      if (!Number.isFinite(distance)) continue
      const clearDistance = Math.max(0, distance - CAMERA_PITCH_SAFETY_METERS)
      const clearPitch = degrees(Math.atan2(clearDistance, area.height + CAMERA_PITCH_SAFETY_METERS))
      result = Math.min(result, clearPitch)
    }
    return result
  }

  function tileReady(candidate: Position): boolean {
    if (!validPosition(candidate)) return false
    const key = tileKeyAt(candidate)
    if (decodedTiles.has(key)) return true
    // On some launch/update paths source events do not rebuild the decoded set.
    // Use the public full-source readiness check only for a PBF that was
    // actually delivered to MapLibre, never for a failed/unknown source tile.
    return offlineMap.wasSuppliedAt(candidate) &&
      map.isSourceLoaded('openmaptiles') && map.areTilesLoaded()
  }

  function isBlocked(candidate: Position): boolean {
    // Both the feet and their small collision margin must be on decoded tiles.
    // At a tile edge, no unloaded building geometry can be treated as empty.
    return [candidate, displace(candidate, .5, 0), displace(candidate, -.5, 0),
      displace(candidate, 0, .5), displace(candidate, 0, -.5)]
      .some((point) => !tileReady(point) || collisionAreas.some((area) => contains(area, point)))
  }

  function requestTick(): void {
    if (frame !== null) return
    if (!lastFrameTime) lastFrameTime = performance.now()
    frame = requestAnimationFrame(tick)
  }

  function tick(now: number): void {
    frame = null
    if (teleporting) { lastFrameTime = 0; return }
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
    let missingMapTile = false
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
        missingMapTile = !tileReady(candidate)
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
        animationTime += dt
        avatarMarker.setLngLat([position.lon, position.lat])
        offlineMap.setPlayerPosition(position)
        persistProgress()
      }
    }
    if (!walking) animationTime = 0
    movementStatus.hidden = landscape || length <= DEAD_ZONE || (ready && !blocked)
    if (!movementStatus.hidden) {
      movementStatus.textContent = !ready
        ? 'Map data is not loaded here.' : missingMapTile
          ? 'This map area is not cached. Reconnect to explore it.'
          : 'A mapped building or water blocks this way.'
    }
    // A camera turn should be earned by sustained movement, not each twitch.
    // Walking backward keeps the camera where it is, so pulling down never
    // triggers a sudden 180° flip. The input bearing stays fixed per gesture,
    // independent of these visual camera turns.
    let nextBearing = map.getBearing()
    const inputAngle = degrees(Math.atan2(x, -y))
    if (walking && Math.abs(inputAngle) < CAMERA_BACKWARD_ANGLE) {
      if (steadyHeading === null || Math.abs(angleDelta(heading, steadyHeading)) > CAMERA_HEADING_DEAD_ZONE) {
        steadyHeading = heading
        steadySeconds = 0
      } else {
        steadySeconds += dt
      }
      const preset = CAMERA_PRESETS[cameraPreset]
      const turn = angleDelta(heading, nextBearing)
      if (steadySeconds >= preset.delay && Math.abs(turn) > CAMERA_HEADING_DEAD_ZONE) {
        const smoothed = turn * (1 - Math.exp(-dt / preset.dampingSeconds))
        const capped = Math.sign(smoothed) * Math.min(Math.abs(smoothed), preset.maxDegreesPerSecond * dt)
        nextBearing += capped
      }
    } else {
      steadyHeading = null
      steadySeconds = 0
    }
    // Adjust camera elevation only when a sourced building would cover the
    // trainer, rather than drawing the trainer through an opaque wall.
    occlusionScanSeconds += dt
    if (occlusionScanSeconds >= CAMERA_PITCH_SCAN_SECONDS) {
      desiredPitch = safeCameraPitch(nextBearing)
      occlusionScanSeconds = 0
    }
    const pitch = map.getPitch()
    const pitchDifference = desiredPitch - pitch
    // Building clearance takes priority over camera smoothing. Snap toward
    // overhead as soon as the sampled source geometry requires it, then ease
    // only the return to 45°. The trainer therefore never needs to disappear
    // beside a wall while the camera catches up.
    let nextPitch = desiredPitch
    if (pitchDifference > .15) {
      const pitchStep = Math.min(
        pitchDifference * (1 - Math.exp(-dt / .2)),
        CAMERA_PITCH_RETURN_RATE * dt,
      )
      nextPitch = pitch + pitchStep
    }
    if (walking || Math.abs(pitchDifference) >= .15) {
      map.jumpTo({ center: [position.lon, position.lat], bearing: nextBearing, pitch: nextPitch })
    }
    renderAvatar(walking)
    if ((usingStick && length > DEAD_ZONE) || keys.size || Math.abs(pitchDifference) >= .15) requestTick()
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
    occlusionScanSeconds = CAMERA_PITCH_SCAN_SECONDS
    requestTick()
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

  async function teleport(target: Position): Promise<void> {
    if (teleporting) return
    resetStick()
    keys.clear()
    teleporting = true
    coordinateGo.disabled = true
    coordinateStatus.textContent = 'Checking destination map…'
    const original = { ...position }
    const originalCenter = map.getCenter()
    const previousAreas = collisionAreas
    const previousOrigin = collisionOrigin
    const previousSpawn = hasPlacedSpawn
    const previousDecodedTiles = new Set(decodedTiles)
    offlineMap.protectLandingPosition(target)
    try {
      if (!(await offlineMap.ensureTileAt(target))) {
        throw new Error('Destination map is unavailable. Connect or visit it while online first.')
      }
      avatar.style.visibility = 'hidden'
      if (tileKeyAt(target) !== tileKeyAt(original)) decodedTiles.clear()
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => finish(false), 12000)
        const onData = () => { if (neighborhoodReady(target)) finish(true) }
        function finish(ready: boolean): void {
          clearTimeout(timer)
          map.off('sourcedata', onData)
          map.off('idle', onData)
          if (ready) resolve()
          else reject(new Error('Could not load destination map tiles.'))
        }
        map.on('sourcedata', onData)
        map.on('idle', onData)
        map.jumpTo({ center: [target.lon, target.lat] })
      })
      position = { ...target }
      refreshCollision()
      if (!collisionOrigin || isBlocked(position)) {
        throw new Error('That coordinate lies inside mapped building/water or unavailable terrain.')
      }
      avatarMarker.setLngLat([position.lon, position.lat])
      updateAvatarScale()
      hasPlacedSpawn = true
      heading = map.getBearing()
      steadyHeading = null
      steadySeconds = 0
      offlineMap.setPlayerPosition(position)
      persistProgress(true)
      cameraMenu.open = false
      coordinateGo.blur()
      coordinateStatus.textContent = ''
    } catch (error) {
      position = original
      decodedTiles.clear()
      for (const tile of previousDecodedTiles) decodedTiles.add(tile)
      collisionAreas = previousAreas
      collisionOrigin = previousOrigin
      hasPlacedSpawn = previousSpawn
      offlineMap.setPlayerPosition(original)
      map.jumpTo({ center: [originalCenter.lng, originalCenter.lat] })
      map.once('idle', refreshCollision)
      coordinateStatus.textContent = error instanceof Error ? error.message : 'Destination unavailable.'
    } finally {
      offlineMap.protectLandingPosition(null)
      avatar.style.visibility = 'visible'
      teleporting = false
      coordinateGo.disabled = false
      requestTick()
    }
  }

  // The finger may start anywhere in the middle 80% of the portrait viewport.
  // Top/bottom 10% and interactive HUD controls never initiate movement.
  app.addEventListener('pointerdown', (event) => {
    if (teleporting || activePointer !== null || !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      window.matchMedia('(orientation: landscape)').matches) return
    if (event.target instanceof Element &&
      event.target.closest('#zoom-control, #camera-control, a, button, input, textarea, select')) return
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
    if (!directionKeys.has(key) || teleporting ||
      (event.target instanceof Element &&
        event.target.closest('input, textarea, select, button'))) return
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
    if (document.hidden) { resetStick(); keys.clear(); if (hasPlacedSpawn) persistProgress(true) }
  })
  window.matchMedia('(orientation: landscape)').addEventListener('change', () => {
    resetStick()
    keys.clear()
  })
  window.addEventListener('pagehide', () => { if (hasPlacedSpawn) persistProgress(true) })
  map.on('sourcedataloading', (event) => {
    if (event.sourceId === 'openmaptiles' && event.coord) {
      const { z, x, y } = event.coord.canonical
      decodedTiles.delete(z + '/' + x + '/' + y)
    }
  })
  map.on('sourcedata', (event) => {
    if (event.sourceId !== 'openmaptiles') return
    let newlyDecoded = false
    if (event.coord && event.tile?.state === 'loaded') {
      const { z, x, y } = event.coord.canonical
      const key = z + '/' + x + '/' + y
      newlyDecoded = !decodedTiles.has(key)
      decodedTiles.add(key)
    } else if (event.coord && event.tile?.state === 'errored') {
      const { z, x, y } = event.coord.canonical
      decodedTiles.delete(z + '/' + x + '/' + y)
    }
    if (!teleporting && (newlyDecoded || !collisionOrigin ||
        distanceMeters(position, collisionOrigin) >= CACHE_REFRESH_METERS)) {
      refreshCollision()
    }
  })
  map.on('idle', () => {
    // Initialize or restore collision geometry once the map settles. Keep
    // the last verified snapshot while loading other viewport tiles.
    if (!collisionOrigin || distanceMeters(position, collisionOrigin) >= CACHE_REFRESH_METERS) {
      refreshCollision()
    }
  })
  coordinateForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/.exec(coordinateInput.value.trim())
    const target = match ? { lat: Number(match[1]), lon: Number(match[2]) } : null
    if (!validPosition(target)) {
      coordinateStatus.textContent = 'Use latitude, longitude (latitude −85 to 85; longitude −180 to 180).'
      return
    }
    void teleport(target)
  })
  renderAvatar(false)
}
