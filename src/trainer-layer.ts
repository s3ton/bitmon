import { EXTENT, MercatorCoordinate, type CustomLayerInterface, type Map as MapLibreMap } from 'maplibre-gl'

type Position = { lon: number; lat: number }

const METERS_PER_RADIAN = 6_371_008.8
const TRAINER_HEIGHT_METERS = 1.8
const MIN_VISIBLE_TRAINER_HEIGHT_PX = 8
const TRAINER_RENDER_SCALE = 2
const TRAINER_ASPECT_RATIO = 53 / 80
const ATLAS_COLUMNS = 8
const ATLAS_ROWS = 5
// Keep custom-layer coordinates local so WebGL float32 precision stays stable
// at the game's zoom range. Absolute 0..1 Mercator coordinates quantize by
// meters on the GPU and visibly jump/flicker while the camera follows movement.
const TRAINER_POSITION_TILE_ZOOM = 20

function radians(degrees: number): number {
  return degrees * Math.PI / 180
}

function shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const result = gl.createShader(type)
  if (!result) throw new Error('Could not create trainer shader.')
  gl.shaderSource(result, source)
  gl.compileShader(result)
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(result) ?? 'Unknown trainer shader error.'
    gl.deleteShader(result)
    throw new Error(message)
  }
  return result
}

function program(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = shader(gl, gl.VERTEX_SHADER, `#version 300 es
    uniform mat4 u_matrix;
    uniform vec3 u_origin;
    uniform float u_altitude;
    uniform vec2 u_viewport;
    uniform vec2 u_size;
    uniform vec4 u_uv;
    in vec2 a_corner;
    out highp vec2 v_uv;

    void main() {
      // Keep the atlas sprite screen-facing like the previous DOM marker,
      // while interpolating depth from the physical feet to 1.8 m head height.
      // This avoids the billboard becoming edge-on near top-down pitch, yet
      // still lets building depth hide only the pixels physically behind it.
      vec4 foot = u_matrix * vec4(u_origin, 1.0);
      vec4 head = u_matrix * vec4(u_origin.xy, u_origin.z + u_altitude, 1.0);
      vec4 clip = foot;
      clip.xy += vec2(
        a_corner.x * u_size.x * 2.0 / u_viewport.x,
        a_corner.y * u_size.y * 2.0 / u_viewport.y
      ) * foot.w;
      float footDepth = foot.z / foot.w;
      float headDepth = head.z / head.w;
      clip.z = mix(footDepth, headDepth, a_corner.y) * foot.w;
      gl_Position = clip;
      v_uv = vec2(
        mix(u_uv.x, u_uv.z, a_corner.x + 0.5),
        mix(u_uv.w, u_uv.y, a_corner.y)
      );
    }
  `)
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float;
    uniform sampler2D u_texture;
    in highp vec2 v_uv;
    out highp vec4 fragColor;

    void main() {
      vec4 color = texture(u_texture, v_uv);
      if (color.a < 0.03) discard;
      fragColor = color;
    }
  `)
  const result = gl.createProgram()
  if (!result) throw new Error('Could not create trainer WebGL program.')
  gl.attachShader(result, vertex)
  gl.attachShader(result, fragment)
  gl.linkProgram(result)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(result) ?? 'Unknown trainer WebGL link error.'
    gl.deleteProgram(result)
    throw new Error(message)
  }
  return result
}

function uniform(gl: WebGL2RenderingContext, value: WebGLProgram, name: string): WebGLUniformLocation {
  const location = gl.getUniformLocation(value, name)
  if (location === null) throw new Error('Missing trainer uniform: ' + name)
  return location
}

export function createTrainerLayer(
  map: MapLibreMap,
  initialPosition: Position,
  atlasUrl: string,
) {
  let position = { ...initialPosition }
  let row = 0
  let column = 0
  let mirrored = false
  let visible = true
  let textureReady = false
  let glProgram: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let texture: WebGLTexture | null = null
  let aCorner = -1
  let uMatrix: WebGLUniformLocation | null = null
  let uOrigin: WebGLUniformLocation | null = null
  let uAltitude: WebGLUniformLocation | null = null
  let uViewport: WebGLUniformLocation | null = null
  let uSize: WebGLUniformLocation | null = null
  let uUv: WebGLUniformLocation | null = null
  let uTexture: WebGLUniformLocation | null = null

  const layer: CustomLayerInterface = {
    id: 'trainer-3d',
    type: 'custom',
    renderingMode: '3d',

    onAdd(_map, gl) {
      glProgram = program(gl)
      aCorner = gl.getAttribLocation(glProgram, 'a_corner')
      if (aCorner < 0) throw new Error('Missing trainer corner attribute.')
      uMatrix = uniform(gl, glProgram, 'u_matrix')
      uOrigin = uniform(gl, glProgram, 'u_origin')
      uAltitude = uniform(gl, glProgram, 'u_altitude')
      uViewport = uniform(gl, glProgram, 'u_viewport')
      uSize = uniform(gl, glProgram, 'u_size')
      uUv = uniform(gl, glProgram, 'u_uv')
      uTexture = uniform(gl, glProgram, 'u_texture')

      buffer = gl.createBuffer()
      if (!buffer) throw new Error('Could not create trainer vertex buffer.')
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -.5, 0,
         .5, 0,
        -.5, 1,
         .5, 1,
      ]), gl.STATIC_DRAW)

      texture = gl.createTexture()
      if (!texture) throw new Error('Could not create trainer texture.')
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]),
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      const image = new Image()
      image.addEventListener('load', () => {
        if (!texture) return
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        textureReady = true
        map.triggerRepaint()
      }, { once: true })
      image.src = atlasUrl
    },

    render(gl, args) {
      if (!visible || !textureReady || !glProgram || !buffer || !texture ||
          !uMatrix || !uOrigin || !uAltitude || !uViewport || !uSize || !uUv || !uTexture) return

      const origin = MercatorCoordinate.fromLngLat([position.lon, position.lat], 0)
      const tiles = 2 ** TRAINER_POSITION_TILE_ZOOM
      const scaledX = origin.x * tiles
      const scaledY = origin.y * tiles
      const unwrappedTileX = Math.floor(scaledX)
      const tileY = Math.min(tiles - 1, Math.max(0, Math.floor(scaledY)))
      const wrap = Math.floor(unwrappedTileX / tiles)
      const tileX = ((unwrappedTileX % tiles) + tiles) % tiles
      const localX = (scaledX - unwrappedTileX) * EXTENT
      const localY = (scaledY - Math.floor(scaledY)) * EXTENT
      const projectionData = args.getProjectionData({
        tileID: {
          wrap,
          canonical: { x: tileX, y: tileY, z: TRAINER_POSITION_TILE_ZOOM },
        },
      })
      const metersPerPixel = 2 * Math.PI * METERS_PER_RADIAN * Math.cos(radians(position.lat)) /
        (512 * 2 ** map.getZoom())
      const heightPx = Math.max(
        MIN_VISIBLE_TRAINER_HEIGHT_PX,
        TRAINER_HEIGHT_METERS / metersPerPixel,
      ) * TRAINER_RENDER_SCALE
      const widthPx = heightPx * TRAINER_ASPECT_RATIO
      const columnStart = column / ATLAS_COLUMNS
      const columnEnd = (column + 1) / ATLAS_COLUMNS
      const u0 = mirrored ? columnEnd : columnStart
      const u1 = mirrored ? columnStart : columnEnd
      const v0 = row / ATLAS_ROWS
      const v1 = (row + 1) / ATLAS_ROWS

      gl.useProgram(glProgram)
      // Use MapLibre's tile-relative projection matrix. The matrix accepts X/Y
      // in 0..EXTENT tile units and Z in meters, avoiding absolute-Mercator
      // float32 cancellation at zoom 15.5-20 while preserving shared depth.
      gl.uniformMatrix4fv(uMatrix, false, projectionData.mainMatrix)
      gl.uniform3f(uOrigin, localX, localY, 0)
      gl.uniform1f(uAltitude, TRAINER_HEIGHT_METERS)
      gl.uniform2f(uViewport, gl.drawingBufferWidth, gl.drawingBufferHeight)
      gl.uniform2f(uSize, widthPx * map.getPixelRatio(), heightPx * map.getPixelRatio())
      gl.uniform4f(uUv, u0, v0, u1, v1)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(uTexture, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(aCorner)
      gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },

    onRemove(_map, gl) {
      if (buffer) gl.deleteBuffer(buffer)
      if (texture) gl.deleteTexture(texture)
      if (glProgram) gl.deleteProgram(glProgram)
      buffer = null
      texture = null
      glProgram = null
      textureReady = false
    },
  }

  return {
    layer,
    setPosition(next: Position) {
      position = { ...next }
      map.triggerRepaint()
    },
    setFrame(nextRow: number, nextColumn: number, nextMirrored = false) {
      if (row === nextRow && column === nextColumn && mirrored === nextMirrored) return
      row = nextRow
      column = nextColumn
      mirrored = nextMirrored
      map.triggerRepaint()
    },
    setVisible(next: boolean) {
      if (visible === next) return
      visible = next
      map.triggerRepaint()
    },
  }
}
