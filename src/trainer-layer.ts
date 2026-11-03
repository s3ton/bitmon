import { MercatorCoordinate, type CustomLayerInterface, type Map as MapLibreMap } from 'maplibre-gl'

type Position = { lon: number; lat: number }

const METERS_PER_RADIAN = 6_371_008.8
const TRAINER_HEIGHT_METERS = 1.8
const MIN_VISIBLE_TRAINER_HEIGHT_PX = 8
const TRAINER_RENDER_SCALE = 2
const TRAINER_ASPECT_RATIO = .75
const ATLAS_COLUMNS = 5
const ATLAS_ROWS = 8

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
    uniform vec2 u_right;
    uniform float u_width;
    uniform float u_height;
    uniform vec4 u_uv;
    in vec2 a_corner;
    out highp vec2 v_uv;

    void main() {
      vec3 world = vec3(
        u_origin.xy + u_right * (a_corner.x * u_width),
        u_origin.z + a_corner.y * u_height
      );
      gl_Position = u_matrix * vec4(world, 1.0);
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
  let visible = true
  let textureReady = false
  let glProgram: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let texture: WebGLTexture | null = null
  let aCorner = -1
  let uMatrix: WebGLUniformLocation | null = null
  let uOrigin: WebGLUniformLocation | null = null
  let uRight: WebGLUniformLocation | null = null
  let uWidth: WebGLUniformLocation | null = null
  let uHeight: WebGLUniformLocation | null = null
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
      uRight = uniform(gl, glProgram, 'u_right')
      uWidth = uniform(gl, glProgram, 'u_width')
      uHeight = uniform(gl, glProgram, 'u_height')
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
          !uMatrix || !uOrigin || !uRight || !uWidth || !uHeight || !uUv || !uTexture) return

      const origin = MercatorCoordinate.fromLngLat([position.lon, position.lat], 0)
      const metersPerPixel = 2 * Math.PI * METERS_PER_RADIAN * Math.cos(radians(position.lat)) /
        (512 * 2 ** map.getZoom())
      const heightMeters = Math.max(
        TRAINER_HEIGHT_METERS,
        MIN_VISIBLE_TRAINER_HEIGHT_PX * metersPerPixel,
      ) * TRAINER_RENDER_SCALE
      const mercatorPerMeter = origin.meterInMercatorCoordinateUnits()
      const height = heightMeters * mercatorPerMeter
      const width = heightMeters * TRAINER_ASPECT_RATIO * mercatorPerMeter
      const bearing = radians(map.getBearing())
      const u0 = column / ATLAS_COLUMNS
      const u1 = (column + 1) / ATLAS_COLUMNS
      const v0 = row / ATLAS_ROWS
      const v1 = (row + 1) / ATLAS_ROWS

      gl.useProgram(glProgram)
      gl.uniformMatrix4fv(uMatrix, false, args.defaultProjectionData.mainMatrix)
      gl.uniform3f(uOrigin, origin.x, origin.y, origin.z)
      gl.uniform2f(uRight, Math.cos(bearing), Math.sin(bearing))
      gl.uniform1f(uWidth, width)
      gl.uniform1f(uHeight, height)
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
    setFrame(nextRow: number, nextColumn: number) {
      if (row === nextRow && column === nextColumn) return
      row = nextRow
      column = nextColumn
      map.triggerRepaint()
    },
    setVisible(next: boolean) {
      if (visible === next) return
      visible = next
      map.triggerRepaint()
    },
  }
}
