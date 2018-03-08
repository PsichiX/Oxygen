import System from './System';
import Events from '../utils/Events';
import { vec2, vec3, vec4, mat2, mat3, mat4 } from '../utils/gl-matrix';
import { isPOT } from '../utils';
import funcParser from '../utils/funcParser';

const versions = [
  // TODO: change order to provide fallback to previous versions if requested is not supported.
  [1, 'webgl'],
  [2, 'webgl2'],
];
const vertices = new Float32Array([
  -1, -1, 0, 0,
  1, -1, 1, 0,
  1, 1, 1, 1,
  -1, 1, 0, 1
]);
const indices = new Uint16Array([
  0, 1, 2,
  2, 3, 0
]);
const extensions = {
  instanced_arrays: [
    1, 'ANGLE_instanced_arrays', null,
    2, null, null
  ],
  blend_minmax: [
    1, 'EXT_blend_minmax', null,
    2, null, null
  ],
  color_buffer_float: [
    1, 'WEBGL_color_buffer_float', null,
    2, 'EXT_color_buffer_float', null
  ],
  color_buffer_half_float: [
    1, 'WEBGL_color_buffer_half_float', null,
    2, 'EXT_color_buffer_half_float', null
  ],
  disjoint_timer_query: [
    1, 'EXT_disjoint_timer_query', null,
    2, 'EXT_disjoint_timer_query_webgl2', null
  ],
  frag_depth: [
    1, 'EXT_frag_depth', null,
    2, null, null
  ],
  sRGB: [
    1, 'EXT_sRGB', null,
    2, null, null
  ],
  shader_texture_lod: [
    1, 'EXT_shader_texture_lod', null,
    2, null, null
  ],
  texture_filter_anisotropic: [
    1, 'EXT_texture_filter_anisotropic', null,
    2, 'EXT_texture_filter_anisotropic', null
  ],
  element_index_uint: [
    1, 'OES_element_index_uint', null,
    2, null, null
  ],
  standard_derivatives: [
    1, 'OES_standard_derivatives', null,
    2, null, null
  ],
  texture_float: [
    1, 'OES_texture_float', null,
    2, null, null
  ],
  texture_float_linear: [
    1, 'OES_texture_float_linear', null,
    2, 'OES_texture_float_linear', null
  ],
  texture_half_float: [
    1, 'OES_texture_half_float', null,
    2, null, null
  ],
  texture_half_float_linear: [
    1, 'OES_texture_half_float_linear', null,
    2, 'OES_texture_half_float_linear', null
  ],
  vertex_array_object: [
    1, 'OES_vertex_array_object', null,
    2, null, null
  ],
  compressed_texture_astc: [
    1, 'WEBGL_compressed_texture_astc', null,
    2, 'WEBGL_compressed_texture_astc', null
  ],
  compressed_texture_atc: [
    1, 'WEBGL_compressed_texture_atc', null,
    2, 'WEBGL_compressed_texture_atc', null
  ],
  compressed_texture_etc: [
    1, 'WEBGL_compressed_texture_etc', null,
    2, 'WEBGL_compressed_texture_etc', null
  ],
  compressed_texture_etc1: [
    1, 'WEBGL_compressed_texture_etc1', null,
    2, 'WEBGL_compressed_texture_etc1', null
  ],
  compressed_texture_pvrtc: [
    1, 'WEBGL_compressed_texture_pvrtc', null,
    2, 'WEBGL_compressed_texture_pvrtc', null
  ],
  compressed_texture_s3tc: [
    1, 'WEBGL_compressed_texture_s3tc', null,
    2, 'WEBGL_compressed_texture_s3tc', null
  ],
  compressed_texture_s3tc_srgb: [
    1, 'WEBGL_compressed_texture_s3tc_srgb', null,
    2, 'WEBGL_compressed_texture_s3tc_srgb', null
  ],
  debug_renderer_info: [
    1, 'WEBGL_debug_renderer_info', null,
    2, 'WEBGL_debug_renderer_info', null
  ],
  debug_shaders: [
    1, 'WEBGL_debug_shaders', null,
    2, 'WEBGL_debug_shaders', null
  ],
  depth_texture: [
    1, 'WEBGL_depth_texture', null,
    2, null, null
  ],
  draw_buffers: [
    1, 'WEBGL_draw_buffers', [
      'drawBuffersWEBGL', 'drawBuffers'
    ],
    2, null, null
  ],
  lose_context: [
    1, 'WEBGL_lose_context', null,
    2, 'WEBGL_lose_context', null
  ]
};
const functions = new Map();

function getExtensionByVersion(meta, context, version) {
  for (var i = 0, c = meta.length; i < c; i += 3) {
    if (meta[i] === version) {
      const name = meta[i + 1];
      if (!name) {
        return context;
      } else {
        const ext = context.getExtension(name);
        if (!ext) {
          return null;
        }

        const mappings = meta[i + 2];
        if (!!mappings) {
          for (var j = 0, n = mappings.length; j < n; j += 2) {
            context[mappings[j + 1]] = ext[mappings[j]].bind(ext);
          }
        }
        return ext;
      }
    }
  }
  return null;
}

function makeApplierFunction(code) {
  code = funcParser.parse(code);
  return new Function('location', 'gl', 'out', 'getValue', 'mat4', code);
}

/**
 * Rendering command base class.
 */
export class Command {

  /**
   * Dispose (release all internal resources).
   *
   * @example
   * command.dispose();
   * command = null;
   */
  dispose() {}

  /**
   * Called when command is executed.
   *
   * @abstract
   * @param {WebGLRenderingContext}	gl - WebGL context.
   * @param {RenderSystem}	renderer - Render system that is used to render.
   * @param {number}	deltaTime - Delta time.
   * @param {string}	layer - Layer id.
   */
  onRender(gl, renderer, deltaTime, layer) {
    throw new Error('Not implemented!');
  }

  /**
   * Called on view resize.
   *
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   */
  onResize(width, height) {}

}

/**
 * Rendering pipeline base class.
 * Pipeline is a set of commands to render at once.
 */
export class Pipeline extends Command {

  get commands() {
    return this._commands;
  }

  set commands(value) {
    if (!value) {
      this._commands = null;
      return;
    }

    if (!Array.isArray(value)) {
      throw new Error('`value` is not type of Array!');
    }
    for (const item of value) {
      if (!(item instanceof Command)) {
        throw new Error('One of `value` items is not type of Command!');
      }
    }

    this._commands = value;
  }

  /**
   * Constructor.
   */
  constructor(commands = null) {
    super();

    this.commands = commands;
  }

  /**
   * @override
   */
  dispose() {
    const { _commands } = this;
    if (!!_commands) {
      for (const command of _commands) {
        command.dispose();
      }

      this._commands = null;
    }
  }

  /**
   * @override
   */
  onRender(gl, renderer, deltaTime, layer) {
    const { _commands } = this;
    if (!!_commands) {
      for (const command of _commands) {
        command.onRender(gl, renderer, deltaTime, layer);
      }
    }
  }

  /**
   * @override
   */
  onResize(width, height) {
    const { _commands } = this;
    if (!!_commands) {
      for (const command of _commands) {
        command.onResize(width, height);
      }
    }
  }

}

/**
 * Command to render fullscreen image with given shader.
 */
export class RenderFullscreenCommand extends Command {

  /** @type {string|null} */
  get shader() {
    return this._shader;
  }

  /** @type {string|null} */
  set shader(value) {
    if (!value) {
      this._shader = null;
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._shader = value;
  }

  /** @type {*} */
  get overrideUniforms() {
    return this._overrideUniforms;
  }

  /** @type {*} */
  get overrideSamplers() {
    return this._overrideSamplers;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._context = null;
    this._vertexBuffer = null;
    this._indexBuffer = null;
    this._shader = null;
    this._overrideUniforms = new Map();
    this._overrideSamplers = new Map();
    this._dirty = true;
  }

  /**
   * Destructor (dispose internal resources).
   *
   * @example
   * command.dispose();
   * pass = null;
   */
  dispose() {
    const { _context, _vertexBuffer, _indexBuffer } = this;

    if (!!_context) {
      if (!!_vertexBuffer) {
        _context.deleteBuffer(_vertexBuffer);
      }
      if (!!_indexBuffer) {
        _context.deleteBuffer(_indexBuffer);
      }
    }

    this._overrideUniforms.clear();
    this._overrideSamplers.clear();

    this._context = null;
    this._vertexBuffer = null;
    this._indexBuffer = null;
    this._shader = null;
    this._overrideUniforms = null;
    this._overrideSamplers = null;
  }

  /**
   * Called when camera need to postprocess it's rendered image.
   *
   * @param {WebGLRenderingContext}	gl - WebGL context.
   * @param {RenderSystem}	renderer - Render system that is used to render.
   * @param {number}	deltaTime - Delta time.
   * @param {string|null}  layer - Layer ID.
   */
  onRender(gl, renderer, deltaTime, layer) {
    const {
      _shader,
      _overrideUniforms,
      _overrideSamplers
    } = this;

    if (!_shader) {
      console.warn('Trying to render PostprocessPass without shader!');
      return;
    }

    this._ensureState(gl, renderer);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    if (this._dirty) {
      this._dirty = false;
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    renderer.enableShader(_shader);

    if (_overrideUniforms.size > 0) {
      for (const [ name, value ] of _overrideUniforms) {
        renderer.overrideShaderUniform(name, value);
      }
    }

    if (_overrideSamplers.size > 0) {
      for (const [ name, { texture, filtering } ] of _overrideSamplers) {
        if (texture !== '') {
          renderer.overrideShaderSampler(name, texture, filtering);
        }
      }
    }

    gl.drawElements(
      gl.TRIANGLES,
      indices.length,
      gl.UNSIGNED_SHORT,
      0
    );

    renderer.disableShader();
  }

  _ensureState(gl, renderer) {
    this._context = gl;

    if (!this._vertexBuffer) {
      this._vertexBuffer = gl.createBuffer();
      this._dirty = true;
    }

    if (!this._indexBuffer) {
      this._indexBuffer = gl.createBuffer();
      this._dirty = true;
    }
  }

}

/**
 * Rendering graphics onto screen canvas.
 *
 * @example
 * const system = new RenderSystem('screen-0');
 */
export default class RenderSystem extends System {

  /** @type {*} */
  static get propsTypes() {
    return {
      useDevicePixelRatio: 'boolean',
      timeScale: 'number',
      collectStats: 'boolean'
    };
  }

  /** @type {number} */
  get contextVersion() {
    return this._contextVersion;
  }

  /** @type {boolean} */
  get useDevicePixelRatio() {
    return this._useDevicePixelRatio;
  }

  /** @type {boolean} */
  set useDevicePixelRatio(value) {
    this._useDevicePixelRatio = !!value;
  }

  /** @type {number} */
  get timeScale() {
    return this._timeScale;
  }

  /** @type {number} */
  set timeScale(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._timeScale = value;
  }

  /** @type {boolean} */
  get collectStats() {
    return this._collectStats;
  }

  /** @type {boolean} */
  set collectStats(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._collectStats = value;
  }

  /** @type {number} */
  get passedTime() {
    return this._passedTime;
  }

  /** @type {HTMLCanvasElement} */
  get canvas() {
    return this._canvas;
  }

  /** @type {Events} */
  get events() {
    return this._events;
  }

  /** @type {string} */
  get activeShader() {
    return this._activeShader;
  }

  /** @type {string} */
  get activeRenderTarget() {
    return this._activeRenderTarget;
  }

  /** @type {string} */
  get clearColor() {
    return this._clearColor;
  }

  /** @type {mat4} */
  get projectionMatrix() {
    return this._projectionMatrix;
  }

  /** @type {mat4} */
  get viewMatrix() {
    return this._viewMatrix;
  }

  /** @type {mat4} */
  get modelMatrix() {
    return this._modelMatrix;
  }

  /** @type {Map} */
  get stats() {
    return this._stats;
  }

  /** @type {string} */
  get statsText() {
    if (!this._collectStats) {
      return '';
    }

    const { _stats } = this;
    const deltaTime = _stats.get('delta-time');
    const passedTime = _stats.get('passed-time');
    const fps = `FPS: ${(1000 / deltaTime) | 0} (${1000 / deltaTime})`;
    const dt = `Delta time: ${deltaTime | 0} ms (${deltaTime})`;
    const pt = `Passed time: ${passedTime | 0} ms (${passedTime})`;
    const sc = `Shader changes: ${_stats.get('shader-changes')}`;
    const f = `Frames: ${_stats.get('frames')}`;
    const s = `Shaders: ${_stats.get('shaders')}`;
    const t = `Textures: ${_stats.get('textures')}`;
    const rt = `Render targets: ${_stats.get('renderTargets')}`;
    const e = `Extensions:${_stats.get('extensions').map(e => `\n - ${e}`).join()}`;
    return `${fps}\n${dt}\n${pt}\n${sc}\n${f}\n${s}\n${t}\n${rt}\n${e}`;
  }

  /**
   * Constructor.
   * Automaticaly binds into specified canvas.
   *
   * @param {string}	canvas - HTML canvas element id.
   * @param {boolean}	optimize - Optimize rendering pipeline.
   * @param {Array.<string>}	extensions - array with WebGL extensions list.
   * @param {number}	contextVersion - WebGL context version number.
   * @param {boolean}	manualMode - Manually trigger rendering next frames.
   */
  constructor(canvas, optimize = true, extensions = null, contextVersion = 1, manualMode = false) {
    super();

    this._manualMode = !!manualMode;
    this._extensions = new Map();
    this._contextVersion = contextVersion | 0;
    this._useDevicePixelRatio = false;
    this._timeScale = 1;
    this._collectStats = false;
    this._animationFrame = 0;
    this._lastTimestamp = null;
    this._canvas = null;
    this._context = null;
    this._shaders = new Map();
    this._textures = new Map();
    this._renderTargets = new Map();
    this._events = new Events();
    this._activeShader = null;
    this._activeRenderTarget = null;
    this._activeViewportSize = vec2.create();
    this._clearColor = vec4.create();
    this._projectionMatrix = mat4.create();
    this._viewMatrix = mat4.create();
    this._modelMatrix = mat4.create();
    this._blendingConstants = {};
    this._stats = new Map();
    this._counterShaderChanges = 0;
    this._counterFrames = 0;
    this._optimize = !!optimize;
    this._passedTime = 0;
    this._shaderApplierOut = mat4.create();
    this._shaderApplierGetValue = name => {
      if (name === 'model-matrix') {
        return this._modelMatrix;
      } else if (name === 'view-matrix') {
        return this._viewMatrix;
      } else if (name === 'projection-matrix') {
        return this._projectionMatrix;
      } else {
        throw new Error(`Unknown matrix: ${name}`);
      }
    };

    if (!!extensions) {
      for (const name of extensions) {
        this._extensions.set(name, null);
      }
    }
    this._setup(canvas);
  }

  /**
   * Destructor (disposes internal resources).
   *
   * @example
   * system.dispose();
   * sustem = null;
   */
  dispose() {
    const { _context, _shaders, _textures, _renderTargets, _events } = this;

    this._stopAnimation();
    _context.clear(_context.COLOR_BUFFER_BIT);

    for (const shader of _shaders.keys()) {
      this.unregisterShader(shader);
    }
    for (const texture of _textures.keys()) {
      this.unregisterTexture(texture);
    }
    for (const renderTarget of _renderTargets.keys()) {
      this.unregisterRenderTarget(renderTarget);
    }

    _events.dispose();
    this._stats.clear();
    this._extensions = null;
    this._shaderApplierOut = null;
    this._shaderApplierGetValue = null;
  }

  /**
   * Get loaded WebGL extension by it's name.
   *
   * @param {string}	name - Extension name.
   *
   * @return {*|null} WebGL extension or null if not found.
   *
   * @example
   * const extension = system.extension('vertex_array_object');
   * if (!!extension) {
   *   const vao = extension.createVertexArrayOES();
   *   extension.bindVertexArrayOES(vao);
   * }
   */
  extension(name) {
    return this._extensions.get(name) || null;
  }

  /**
   * Load WebGL extension by it's name.
   *
   * @param {string}	name - Extension name.
   *
   * @return {*|null} WebGL extension or null if not supported.
   *
   * @example
   * const extension = system.requestExtension('vertex_array_object');
   * if (!!extension) {
   *   const vao = extension.createVertexArrayOES();
   *   extension.bindVertexArrayOES(vao);
   * }
   */
  requestExtension(name) {
    const { _context, _contextVersion, _extensions } = this;
    if (!_context) {
      throw new Error('WebGL context is not yet ready!');
    }

    let ext = _extensions.get(name);
    if (!!ext) {
      return ext;
    }

    const meta = extensions[name];
    if (!meta) {
      throw new Error(`Unsupported extension: ${name}`);
    }
    ext = getExtensionByVersion(meta, _context, _contextVersion);

    if (!!ext) {
      _extensions.set(name, ext);
    } else {
      console.warn(`Could not get WebGL extension: ${name}`);
    }

    return ext || null;
  }

  /**
   * Load WebGL extensions by their names.
   *
   * @param {string[]}	args - Extension names.
   *
   * @return {boolean} True if all are supported and loaded, false otherwise.
   *
   * @example
   * const supported = system.requestExtensions('texture_float', 'texture_float_linear');
   * if (!supported) {
   *   throw new Error('One of requested WebGL extensions is not supported!');
   * }
   */
  requestExtensions(...args) {
    for (const arg of args) {
      if (!this.requestExtension(arg)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute rendering command.
   *
   * @param {Command}	command - command to execute.
   * @param {number}	deltaTime - Delta time.
   * @param {string|null}	layer - Layer ID.
   */
  executeCommand(command, deltaTime, layer) {
    if (!(command instanceof Command)) {
      throw new Error('`command` is not type of Command!');
    }
    if (typeof deltaTime !== 'number') {
      throw new Error('`deltaTime` is not type of Number!');
    }

    command.onRender(this._context, this, deltaTime, layer);
  }

  /**
   * Register new shader.
   *
   * @param {string}	id - Shader id.
   * @param {string}	vertex - Vertex shader code.
   * @param {string}	fragment - Fragment shader code.
   * @param {*}	layoutInfo - Vertex layout description.
   * @param {*}	uniformsInfo - Uniforms description.
   * @param {*}	samplersInfo - Samplers description.
   * @param {*}	blendingInfo - Blending mode description.
   * @param {string[]|null}	extensionsInfo - Required extensions list.
   *
   * @example
   * system.registerShader(
   *   'red',
   *   'attribute vec2 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 0.0, 1.0); }',
   *   'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }',
   *   { aPosition: { size: 2, stride: 2, offset: 0 } },
   *   {},
   *   { source: 'src-alpha', destination: 'one-minus-src-alpha' }
   * );
   */
  registerShader(
    id,
    vertex,
    fragment,
    layoutInfo,
    uniformsInfo,
    samplersInfo,
    blendingInfo,
    extensionsInfo
  ) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (typeof vertex !== 'string') {
      throw new Error('`vertex` is not type of String!');
    }
    if (typeof fragment !== 'string') {
      throw new Error('`fragment` is not type of String!');
    }
    if (!layoutInfo) {
      throw new Error('`layoutInfo` cannot be null!');
    }

    this.unregisterShader(id);

    if (Array.isArray(extensionsInfo) && extensionsInfo.length > 0) {
      if (!this.requestExtensions(...extensionsInfo)) {
        throw new Error(`One of shader extensions is not supported (${id})!`);
      }
    }

    const gl = this._context;
    const shader = gl.createProgram();
    const vshader = gl.createShader(gl.VERTEX_SHADER);
    const fshader = gl.createShader(gl.FRAGMENT_SHADER);
    const deleteAll = () => {
      gl.deleteShader(vshader);
      gl.deleteShader(fshader);
      gl.deleteProgram(shader);
    };

    // TODO: fix problem with forced GLSL 3 in WebGL 2.
    // const { _contextVersion } = this;
    // if (_contextVersion > 1) {
    //   vertex = `#version 300 es\n#define OXY_ctx_ver ${_contextVersion}\n${vertex}`;
    //   fragment = `#version 300 es\n#define OXY_ctx_ver ${_contextVersion}\n${fragment}`;
    // } else {
    //   vertex = `#define OXY_ctx_ver ${_contextVersion}\n${vertex}`;
    //   fragment = `#define OXY_ctx_ver ${_contextVersion}\n${fragment}`;
    // }
    gl.shaderSource(vshader, vertex);
    gl.shaderSource(fshader, fragment);
    gl.compileShader(vshader);
    gl.compileShader(fshader);

    if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(vshader);
      deleteAll();
      throw new Error(`Cannot compile vertex shader: ${id}\nLog: ${log}`);
    }
    if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(fshader);
      deleteAll();
      throw new Error(`Cannot compile fragment shader: ${id}\nLog: ${log}`);
    }

    gl.attachShader(shader, vshader);
    gl.attachShader(shader, fshader);
    gl.linkProgram(shader);

    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(shader);
      deleteAll();
      throw new Error(`Cannot link shader program: ${id}\nLog: ${log}`);
    }

    const layout = new Map();
    const uniforms = new Map();
    const samplers = new Map();
    let blending = null;

    for (const name in layoutInfo) {
      const { size, stride, offset } = layoutInfo[name];

      if (typeof size !== 'number' ||
          typeof stride !== 'number' ||
          typeof offset !== 'number'
      ) {
        deleteAll();
        throw new Error(
          `Shader layout does not have proper settings: ${id} (${name})`
        );
      }

      const location = gl.getAttribLocation(shader, name);
      if (location < 0) {
        deleteAll();
        throw new Error(
          `Shader does not have attribute: ${id} (${name})`
        );
      }

      layout.set(name, {
        location,
        size,
        stride,
        offset
      });
    }

    if (layout.size === 0) {
      deleteAll();
      throw new Error(`Shader layout cannot be empty: ${id}`);
    }

    if (!!uniformsInfo) {
      for (const name in uniformsInfo) {
        const mapping = uniformsInfo[name];

        if (typeof mapping !== 'string' &&
            typeof mapping !== 'number' &&
            !(mapping instanceof Array)
        ) {
          deleteAll();
          throw new Error(
            `Shader uniform does not have proper settings: ${id} (${name})`
          );
        }

        let func = null;
        if (typeof mapping === 'string' && mapping.startsWith('@')) {
          func = functions[mapping];
          if (!func) {
            func = functions[mapping] = makeApplierFunction(mapping);
          }
        }

        const location = gl.getUniformLocation(shader, name);
        if (!location) {
          deleteAll();
          throw new Error(
            `Shader does not have uniform: ${id} (${name})`
          );
        }

        const forcedUpdate =
          !!func ||
          mapping === 'projection-matrix' ||
          mapping === 'view-matrix' ||
          mapping === 'model-matrix' ||
          mapping === 'time' ||
          mapping === 'viewport-size' ||
          mapping === 'inverse-viewport-size';

        uniforms.set(name, {
          location,
          mapping: !func ? mapping : func,
          forcedUpdate
        });
      }
    }

    if (!!samplersInfo) {
      for (const name in samplersInfo) {
        const { channel, texture, filtering } = samplersInfo[name];

        if (typeof channel !== 'number' ||
          (!!texture && typeof texture !== 'string') ||
          (!!filtering  && typeof filtering !== 'string')
        ) {
          deleteAll();
          throw new Error(
            `Shader sampler does not have proper settings: ${id} (${name})`
          );
        }

        const location = gl.getUniformLocation(shader, name);
        if (!location) {
          deleteAll();
          throw new Error(
            `Shader does not have sampler: ${id} (${name})`
          );
        }

        samplers.set(name, {
          location,
          channel,
          texture,
          filtering
        });
      }
    }

    if (!!blendingInfo) {
      const { source, destination } = blendingInfo;
      if (typeof source !== 'string' || typeof destination !== 'string') {
        throw new Error(`Shader blending does not have proper settings: ${id}`);
      }

      blending = {
        source: this._getBlendingFromName(source),
        destination: this._getBlendingFromName(destination)
      };
    }

    this._shaders.set(id, { shader, layout, uniforms, samplers, blending });
  }

  /**
   * Unregister existing shader.
   *
   * @param {string}	id - Shader id.
   *
   * @example
   * system.unregisterShader('red');
   */
  unregisterShader(id) {
    const { _shaders } = this;
    const gl = this._context;
    const meta = _shaders.get(id);

    if (!meta) {
      return;
    }

    const { shader } = meta;
    const shaders = gl.getAttachedShaders(shader);

    for (let i = 0, c = shaders.length; i < c; ++i) {
      gl.deleteShader(shaders[i]);
    }
    gl.deleteProgram(shader);
    _shaders.delete(id);
  }

  /**
   * Enable given shader (make it currently active for further rendering).
   *
   * @param {string}	id - Shader id.
   * @param {boolean}	forced - ignore optimizations (by default it will not enable if is currently active).
   *
   * @example
   * system.enableShader('red');
   */
  enableShader(id, forced = false) {
    const {
      _shaders,
      _textures,
      _activeShader,
      _projectionMatrix,
      _viewMatrix,
      _modelMatrix,
      _optimize,
      _passedTime
    } = this;
    const changeShader = forced || _activeShader !== id || !_optimize;
    const gl = this._context;
    const meta = _shaders.get(id);

    if (!meta) {
      console.warn(`Trying to enable non-existing shader: ${id}`);
      return;
    }

    const { shader, layout, uniforms, samplers, blending } = meta;

    if (changeShader) {
      gl.useProgram(shader);
      this._activeShader = id;
      ++this._counterShaderChanges;
    }

    for (const { location, size, stride, offset } of layout.values()) {
      gl.vertexAttribPointer(
        location,
        size,
        gl.FLOAT,
        false,
        stride * 4,
        offset * 4
      );
      gl.enableVertexAttribArray(location);
    }

    for (const [name, { location, mapping, forcedUpdate }] of uniforms.entries()) {
      const { length } = mapping;

      if (mapping === '' || (!changeShader && !forcedUpdate)) {
        continue;

      } else if (mapping === 'projection-matrix') {
        gl.uniformMatrix4fv(location, false, _projectionMatrix);

      } else if (mapping === 'view-matrix') {
        gl.uniformMatrix4fv(location, false, _viewMatrix);

      } else if (mapping === 'model-matrix') {
        gl.uniformMatrix4fv(location, false, _modelMatrix);

      } else if (mapping === 'time') {
        gl.uniform1f(location, _passedTime * 0.001);

      } else if (mapping === 'viewport-size') {
        gl.uniform2f(
          location,
          this._activeViewportSize[0],
          this._activeViewportSize[1]
        );

      } else if (mapping === 'inverse-viewport-size') {
        const [ width, height ] = this._activeViewportSize;

        gl.uniform2f(
          location,
          width === 0 ? 1 : 1 / width,
          height === 0 ? 1 : 1 / height
        );

      } else if (typeof mapping === 'number') {
        gl.uniform1f(location, mapping);

      } else if (length === 2) {
        gl.uniform2fv(location, mapping);

      } else if (length === 3) {
        gl.uniform3fv(location, mapping);

      } else if (length === 4) {
        gl.uniform4fv(location, mapping);

      } else if (length === 9) {
        gl.uniformMatrix3fv(location, false, mapping);

      } else if (length === 16) {
        gl.uniformMatrix4fv(location, false, mapping);

      } else if (mapping instanceof Function) {
        mapping(
          location,
          gl,
          this._shaderApplierOut,
          this._shaderApplierGetValue,
          mat4
        );

      } else {
        console.warn(`Trying to set non-proper uniform: ${name} (${id})`);
      }
    }

    if (!changeShader) {
      return;
    }

    for (const { location, channel, texture, filtering } of samplers.values()) {
      const tex = _textures.get(texture);
      if (!tex) {
        console.warn(`Trying to enable non-existing texture: ${texture} (${id})`);
        continue;
      }

      gl.activeTexture(gl.TEXTURE0 + channel | 0);
      gl.bindTexture(gl.TEXTURE_2D, tex.texture);
      if (filtering === 'trilinear') {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else if (filtering === 'bilinear') {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      } else if (filtering === 'linear') {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      }
      gl.uniform1i(location, channel | 0);
    }

    if (!!blending) {
      gl.enable(gl.BLEND);
      gl.blendFunc(blending.source, blending.destination);
    } else {
      gl.disable(gl.BLEND);
    }
  }

  /**
   * Disable active shader.
   * Make sure that this is currently active shader (otherwise it will unbind wrong shader locations)!
   *
   * @example
   * system.enableShader('red');
   * system.disableShader();
   */
  disableShader() {
    const gl = this._context;
    const meta = this._shaders.get(this._activeShader);
    if (!meta) {
      console.warn(`Trying to disable non-existing shader: ${this._activeShader}`);
      return;
    }

    const { layout } = meta;
    for (const { location } of layout.values()) {
      gl.disableVertexAttribArray(location);
    }
  }

  /**
   * Give active shader uniform a different than it's default value.
   *
   * @param {string}	name - Uniform name.
   * @param {*}	value - Uniform value. Can be number of array of numbers.
   *
   * @example
   * system.enableShader('color');
   * system.overrideShaderUniform('uColor', [1, 0, 0, 1]);
   */
  overrideShaderUniform(name, value) {
    const { _shaders, _activeShader } = this;
    const gl = this._context;
    const meta = _shaders.get(_activeShader);

    if (!meta) {
      console.warn(`Trying to set uniform of non-existing shader: ${_activeShader}`);
      return;
    }

    const { uniforms } = meta;
    const uniform = uniforms.get(name);

    if (!uniform) {
      console.warn(`Trying to set value of non-existing uniform: ${_activeShader} (${name})`);
      return;
    }

    const { location } = uniform;
    const { length } = value;

    if (typeof value === 'number') {
      gl.uniform1f(location, value);

    } else if (length === 2) {
      gl.uniform2fv(location, value);

    } else if (length === 3) {
      gl.uniform3fv(location, value);

    } else if (length === 4) {
      gl.uniform4fv(location, value);

    } else if (length === 9) {
      gl.uniformMatrix3fv(location, false, value);

    } else if (length === 16) {
      gl.uniformMatrix4fv(location, false, value);

    }
  }

  /**
   * Give active shader sampler different than it's default texture.
   *
   * @param {string}	name - Sampler id.
   * @param {string|null}	texture - Texture id.
   * @param {string|null}	filtering - Sampler filtering. Can be trilinear, bilinear, linear or nearest.
   *
   * @example
   * system.enableShader('sprite');
   * system.overrideShaderSampler('sTexture', 'martian', 'linear');
   */
  overrideShaderSampler(name, texture, filtering) {
    const { _shaders, _textures, _activeShader } = this;
    const gl = this._context;
    const meta = _shaders.get(_activeShader);
    if (!meta) {
      console.warn(`Trying to set sampler of non-existing shader: ${_activeShader}`);
      return;
    }

    const { samplers } = meta;
    const sampler = samplers.get(name);
    if (!sampler) {
      console.warn(`Trying to set non-existing sampler: ${_activeShader} (${name})`);
      return;
    }

    texture = texture || sampler.texture;
    filtering = filtering || sampler.filtering;

    const tex = _textures.get(texture);
    if (!tex) {
      console.warn(`Trying to enable non-existing texture: ${texture} (${name})`);
      return;
    }

    const { location, channel } = sampler;
    gl.activeTexture(gl.TEXTURE0 + channel | 0);
    gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    if (filtering === 'trilinear') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else if (filtering === 'bilinear') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    } else if (filtering === 'linear') {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    gl.uniform1i(location, channel | 0);
  }

  /**
   * Register new texture.
   *
   * @param {string}	id - Texture id.
   * @param {HTMLImageElement}	image - Image instance.
   * @param {boolean} generateMipmap - Should generate mipmaps.
   *
   * @example
   * const image = new Image();
   * image.src = 'marsian.png';
   * system.registerTexture('marsian', image);
   */
  registerTexture(id, image, generateMipmap = false) {
    this.unregisterTexture(id);

    const gl = this._context;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this._textures.set(id, {
      texture,
      width: image.width,
      height: image.height
    });

    if (!!generateMipmap) {
      this.generateTextureMipmap(id);
    }
  }

  /**
   * Register empty texture (mostly used in offscreen rendering cases).
   *
   * @param {string}	id - Texture id.
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   * @param {boolean}	floatPointData - Tells if this texture will store floating point data.
   * @param {ArrayBufferView|null} pixelData - ArrayBuffer view with pixel data or null if empty.
   *
   * @example
   * system.registerTextureEmpty('offscreen', 512, 512);
   */
  registerTextureEmpty(id, width, height, floatPointData = false, pixelData = null) {
    if (!!floatPointData && !this.requestExtensions(
      'texture_float',
      'texture_float_linear'
    )) {
      throw new Error('Float textures are not supported!');
    }

    this.unregisterTexture(id);

    const gl = this._context;
    width = Math.max(1, width | 0);
    height = Math.max(1, height | 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      !!floatPointData ? gl.FLOAT : gl.UNSIGNED_BYTE,
      pixelData
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this._textures.set(id, {
      texture,
      width,
      height
    });
  }

  /**
   * Register colored texture (mostly used to create solid color textures).
   *
   * @param {string}	id - Texture id.
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   * @param {number}  r - Red value.
   * @param {number}  g - Green value.
   * @param {number}  b - Blue value.
   * @param {number}  a - Alpha value.
   *
   * @example
   * system.registerTextureEmpty('offscreen', 512, 512);
   */
  registerTextureColor(id, width, height, r, g, b, a) {
    const c = width * height * 4;
    const data = new Uint8Array(c);
    for (let i = 0; i < c; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
    return this.registerTextureEmpty(id, width, height, false, data);
  }

  /**
   * Unregister existing texture.
   *
   * @param {string}	id - Texture id.
   *
   * @example
   * system.unregisterTexture('red');
   */
  unregisterTexture(id) {
    const { _textures } = this;
    const gl = this._context;
    const texture = _textures.get(id);

    if (!!texture) {
      gl.deleteTexture(texture.texture);
      _textures.delete(id);
    }
  }

  /**
   * Get texture meta information (width and height).
   *
   * @param {string}	id - Texture id.
   *
   * @return {*|null} Object with width and height properties or null if not found.
   */
  getTextureMeta(id) {
    const { _textures } = this;
    const texture = _textures.get(id);

    return !!texture
      ? { width: texture.width, height: texture.height }
      : null;
  }

  generateTextureMipmap(id) {
    const { _textures } = this;
    const gl = this._context;
    const texture = _textures.get(id);

    if (!!texture) {
      if ((!isPOT(texture.width, texture.height)) && this._contextVersion < 2) {
        console.warn(
          'Cannot generate mipmaps for non-POT texture within version < 2'
        );
        return;
      }

      gl.bindTexture(gl.TEXTURE_2D, texture.texture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  /**
   * Register new render target.
   *
   * @param {string}	id - Render target id.
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   * @param {boolean}	floatPointData - Tells if render target will store floating point data.
   * @param {number}  multiTargetsCount - Number of target color attachments.
   * @param {boolean}	generateMipmap - Tells if render target will generate mipmap after rendering.
   *
   * @example
   * system.registerRenderTarget('offscreen', 512, 512);
   */
  registerRenderTarget(
    id,
    width,
    height,
    floatPointData = false,
    multiTargetsCount = 0,
    generateMipmap = false
  ) {
    if (!!floatPointData && !this.requestExtensions(
      'texture_float',
      'texture_float_linear'
    )) {
      throw new Error('Float textures are not supported!');
    }
    if (!!multiTargetsCount > 0 && !this.requestExtensions('draw_buffers')) {
      throw new Error('Draw buffers are not supported!');
    }

    this.unregisterRenderTarget(id);

    const gl = this._context;
    width = Math.max(1, width);
    height = Math.max(1, height);

    if (multiTargetsCount > 0) {
      const ext = this.extension('draw_buffers');
      const textures = [];
      const buffers = [];
      for (let i = 0; i < multiTargetsCount; ++i) {
        const tid = `${id}-${i}`;
        this.registerTextureEmpty(tid, width, height, floatPointData);
        const texture = this._textures.get(tid);
        if (!texture) {
          return;
        }
        textures.push(texture);
        buffers.push(ext.COLOR_ATTACHMENT0_WEBGL + i);
      }

      const target = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      for (let i = 0; i < multiTargetsCount; ++i) {
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          buffers[i],
          gl.TEXTURE_2D,
          textures[i].texture,
          0
        );
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this._renderTargets.set(id, {
        target,
        width,
        height,
        multiTargets: buffers,
        textures,
        mipmap: generateMipmap
      });
    } else {
      this.registerTextureEmpty(id, width, height, floatPointData);
      const texture = this._textures.get(id);
      if (!texture) {
        return;
      }

      const target = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture.texture,
        0
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this._renderTargets.set(id, {
        target,
        width,
        height,
        multiTargets: null,
        textures: [ texture ],
        mipmap: generateMipmap
      });
    }
  }

  /**
   * Unregister existing render target.
   *
   * @param {string}	id - Render target id.
   *
   * @example
   * system.unregisterRenderTarget('offscreen');
   */
  unregisterRenderTarget(id) {
    const { _renderTargets } = this;
    const gl = this._context;
    const target = _renderTargets.get(id);

    if (!!target) {
      if (target.multiTargets && target.multiTargets.length > 0) {
        for (let i = 0; i < target.multiTargets.length; ++i) {
          this.unregisterTexture(`${id}-${i}`);
        }
      } else {
        this.unregisterTexture(id);
      }
      gl.deleteFramebuffer(target.target);
      _renderTargets.delete(id);
      target.textures = null;
    }
  }

  /**
   * Get render target meta information (width and height).
   *
   * @param {string}	id - Texture id.
   *
   * @return {*|null} Object with width and height properties or null if not found.
   */
  getRenderTargetMeta(id) {
    const { _renderTargets } = this;
    const target = _renderTargets.get(id);

    return !!target
      ? { width: target.width, height: target.height }
      : null;
  }

  /**
   * Make given render target active for further rendering.
   *
   * @param {string}	id - Render target id
   * @param {bool} clearBuffer - clear buffer.
   *
   * @example
   * system.enableRenderTarget('offscreen');
   */
  enableRenderTarget(id, clearBuffer = true) {
    const { _renderTargets } = this;
    const gl = this._context;
    const target = _renderTargets.get(id);
    if (!target) {
      this.disableRenderTarget();
      return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, target.target);
    if (!!target.multiTargets) {
      gl.drawBuffers(target.multiTargets);
    }
    gl.viewport(0, 0, target.width, target.height);
    gl.scissor(0, 0, target.width, target.height);
    vec2.set(this._activeViewportSize, target.width, target.height);
    if (!!clearBuffer) {
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    this._activeRenderTarget = id;
  }

  /**
   * Disable active render target.
   *
   * @example
   * system.disableRenderTarget();
   */
  disableRenderTarget() {
    const { _context, _canvas, _activeRenderTarget } = this;
    if (!_activeRenderTarget) {
      return;
    }

    const target = this._renderTargets.get(_activeRenderTarget);
    if (!!target.multiTargets) {
      _context.drawBuffers([]);
    }
    _context.bindFramebuffer(_context.FRAMEBUFFER, null);
    _context.viewport(0, 0, _canvas.width, _canvas.height);
    _context.scissor(0, 0, _canvas.width, _canvas.height);
    vec2.set(this._activeViewportSize, _canvas.width, _canvas.height);
    if (!!target.mipmap) {
      for (const t of target.textures) {
        _context.bindTexture(gl.TEXTURE_2D, t.texture);
        _context.generateMipmap(gl.TEXTURE_2D);
      }
      _context.bindTexture(gl.TEXTURE_2D, null);
    }
    this._activeRenderTarget = null;
  }

  /**
   * Tells if there is registered given shader.
   *
   * @param {string}	id - Shader id.
   *
   * @return {boolean}
   */
  hasShader(id) {
    return this._shaders.has(id);
  }

  /**
   * Tells if there is registered given texture.
   *
   * @param {string}	id - Texture id.
   *
   * @return {boolean}
   */
  hasTexture(id) {
    return this._textures.has(id);
  }

  /**
   * Tells if there is registered given render target.
   *
   * @param {string}	id - Render target id.
   *
   * @return {boolean}
   */
  hasRenderTarget(id) {
    return this._renderTargets.has(id);
  }

  /**
   * Resize frame buffer to match canvas size.
   *
   * @param {boolean}	forced - True if ignore optimizations.
   */
  resize(forced = false) {
    const { _canvas, _context } = this;
    let { width, height, clientWidth, clientHeight } = _canvas;

    if (this._useDevicePixelRatio) {
      const { devicePixelRatio } = window;

      clientWidth = (clientWidth * devicePixelRatio) | 0;
      clientHeight = (clientHeight * devicePixelRatio) | 0;
    }

    if (forced || width !== clientWidth || height !== clientHeight) {
      _canvas.width = clientWidth;
      _canvas.height = clientHeight;
      _context.viewport(0, 0, clientWidth, clientHeight);
      _context.scissor(0, 0, clientWidth, clientHeight);
      vec2.set(this._activeViewportSize, clientWidth, clientHeight);
      this._events.trigger('resize', clientWidth, clientHeight);
    }
  }

  renderFrame() {
    if (!this._manualMode) {
      console.warn('Trying to manually render frame without manual render mode!');
      return;
    }

    this._onFrame(this._lastTimestamp);
  }

  /**
   * @override
   */
  onRegister() {
    this._startAnimation();
  }

  /**
   * @override
   */
  onUnregister() {
    this._stopAnimation();
  }

  _setup(canvas) {
    if (typeof canvas !== 'string') {
      throw new Error('`canvas` is not type of String!');
    }

    canvas = this._canvas = document.getElementById(canvas);

    let { _contextVersion } = this;
    const options = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    };
    let version = versions.reduce((r, v) => {
      if (!!r || v[0] > _contextVersion) {
        return r;
      }
      const gl =
        canvas.getContext(v[1], options) ||
        canvas.getContext(`experimental-${v[1]}`, options);
      return !!gl ? { context: gl, contextVersion: v[0] } : r;
    }, null);
    if (!version) {
      throw new Error(
        `Cannot create WebGL context for version: ${_contextVersion}`
      );
    }
    const gl = this._context = version.context;
    this._contextVersion = version.contextVersion;

    for (const name of this._extensions.keys()) {
      this.requestExtension(name);
    }

    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.scissor(0, 0, canvas.width, canvas.height);
    vec2.set(this._activeViewportSize, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.registerTextureColor(
      '',
      1, 1,
      255, 255, 255, 255
    );
    this.registerTextureColor(
      '#default-albedo',
      1, 1,
      255, 255, 255, 255
    );
    this.registerTextureColor(
      '#default-normal',
      1, 1,
      (255 * 0.5) | 0,
      (255 * 0.5) | 0,
      255,
      255
    );
    this.registerTextureColor(
      '#default-metalness-smoothness-emission',
      1, 1,
      0, 0, 0, 255
    );
    this.registerTextureColor(
      '#default-environment',
      1, 1,
      0, 0, 0, 255
    );

    this._blendingConstants = {
      'zero': gl.ZERO,
      'one': gl.ONE,
      'src-color': gl.SRC_COLOR,
      'one-minus-src-color': gl.ONE_MINUS_SRC_COLOR,
      'dst-color': gl.DST_COLOR,
      'one-minus-dst-color': gl.ONE_MINUS_DST_COLOR,
      'src-alpha': gl.SRC_ALPHA,
      'one-minus-src-alpha': gl.ONE_MINUS_SRC_ALPHA,
      'dst-alpha': gl.DST_ALPHA,
      'one-minus-dst-alpha': gl.ONE_MINUS_DST_ALPHA,
      'constant-color': gl.CONSTANT_COLOR,
      'one-minus-constant-color': gl.ONE_MINUS_CONSTANT_COLOR,
      'constant-alpha': gl.CONSTANT_ALPHA,
      'one-minus-constant-alpha': gl.ONE_MINUS_CONSTANT_ALPHA,
      'src-alpha-saturate': gl.SRC_ALPHA_SATURATE
    };
  }

  _startAnimation() {
    this._stopAnimation();

    this._passedTime = 0;
    this._lastTimestamp = performance.now();
    this._requestFrame();
  }

  _stopAnimation() {
    cancelAnimationFrame(this._animationFrame);
    this._passedTime = 0;
    this._lastTimestamp = null;
  }

  _requestFrame() {
    if (!!this._manualMode) {
      return;
    }

    this._animationFrame = requestAnimationFrame(
      timestamp => this._onFrame(timestamp)
    );
  }

  _onFrame(timestamp) {
    this.resize();

    const { _clearColor, _stats, _counterShaderChanges } = this;
    const [ cr, cg, cb, ca ] = _clearColor;
    const gl = this._context;
    const deltaTime = (timestamp - this._lastTimestamp) * this._timeScale;
    this._passedTime += deltaTime;
    this._lastTimestamp = timestamp;
    this._counterShaderChanges = 0
    this._activeShader = null;
    this._activeRenderTarget = null;

    gl.clearColor(cr, cg, cb, ca);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.events.trigger('render', gl, this, deltaTime);

    if (!!this._collectStats) {
      _stats.set('delta-time', deltaTime);
      _stats.set('passed-time', this._passedTime);
      _stats.set('shader-changes', _counterShaderChanges);
      _stats.set('frames', ++this._counterFrames);
      _stats.set('shaders', this._shaders.size);
      _stats.set('textures', this._textures.size);
      _stats.set('renderTargets', this._renderTargets.size);
      _stats.set('extensions', [...this._extensions.keys()]);
    }

    this._requestFrame();
  }

  _getBlendingFromName(name) {
    const { _blendingConstants } = this;

    if (!(name in _blendingConstants)) {
      throw new Error(`There is no blending function: ${name}`);
    }

    return _blendingConstants[name];
  }

}
