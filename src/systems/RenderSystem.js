import System from './System';
import Events from '../utils/Events';
import { vec4, mat4 } from '../utils/gl-matrix';

/**
 * Rendering command base class.
 */
export class Command {

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
      timeScale: 'number'
    };
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
  get modelViewMatrix() {
    return this._modelViewMatrix;
  }

  /** @type {Map} */
  get stats() {
    return this._stats;
  }

  /**
   * Constructor.
   * Automaticaly binds into specified canvas.
   *
   * @param {string}	canvas - HTML canvas element id.
   * @param {boolean}	optimize - Optimize rendering pipeline.
   * @param {Array.<string>}	extensions - array with WebGL extensions list.
   * @param {number}	contextVersion - WebGL context version number.
   */
  constructor(canvas, optimize = true, extensions = null, contextVersion = 1) {
    super();

    this._extensions = new Map();
    this._contextVersion = contextVersion | 0;
    this._useDevicePixelRatio = false;
    this._timeScale = 1;
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
    this._clearColor = vec4.create();
    this._projectionMatrix = mat4.create();
    this._modelViewMatrix = mat4.create();
    this._blendingConstants = {};
    this._stats = new Map();
    this._counterShaderChanges = 0;
    this._counterFrames = 0;
    this._optimize = !!optimize;
    this._passedTime = 0;

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
  }

  /**
   * Get loaded WebGL extension by it's name.
   *
   * @param {string}	name - Extension name.
   *
   * @return {*|null} WebGL extension or null if not found.
   *
   * @example
   * const extension = system.extension('OES_vertex_array_object');
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
   * const extension = system.requestExtension('OES_vertex_array_object');
   * if (!!extension) {
   *   const vao = extension.createVertexArrayOES();
   *   extension.bindVertexArrayOES(vao);
   * }
   */
  requestExtension(name) {
    const { _context, _extensions } = this;
    if (!_context) {
      throw new Error('WebGL context is not yet ready!');
    }

    let ext = _extensions.get(name);
    if (!!ext) {
      return ext;
    }

    ext = _context.getExtension(name);
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
   * @param {string}	args - Extension names.
   *
   * @return {boolean} True if all are supported and loaded, false otherwise.
   *
   * @example
   * const supported = system.requestExtensions('OES_texture_float', 'OES_texture_float_linear');
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
   * Execute rendering commands.
   *
   * @param {Command[]}	commands - Array of commands to execute.
   * @param {number}	deltaTime - Delta time.
   * @param {string|null}	layer - Layer ID.
   */
  executeCommands(commands, deltaTime, layer) {
    if (!Array.isArray(commands)) {
      throw new Error('`commands` is not type of Array!');
    }
    for (const command of commands) {
      if (!(command instanceof Command)) {
        throw new Error('One of `commands` items is not type of Command!');
      }
    }
    if (typeof deltaTime !== 'number') {
      throw new Error('`deltaTime` is not type of Number!');
    }

    const { _context } = this;
    for (const command of commands) {
      command.onRender(_context, this, deltaTime, layer);
    }
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

        const location = gl.getUniformLocation(shader, name);
        if (!location) {
          deleteAll();
          throw new Error(
            `Shader does not have uniform: ${id} (${name})`
          );
        }

        const forcedUpdate =
          mapping === 'projection-matrix' ||
          mapping === 'model-view-matrix' ||
          mapping === 'time' ||
          mapping === 'viewport-size' ||
          mapping === 'inverse-viewport-size';

        uniforms.set(name, {
          location,
          mapping,
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
      _modelViewMatrix,
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

    for (const { location, mapping, forcedUpdate } of uniforms.values()) {
      const { length } = mapping;

      if (mapping === '' || (!changeShader && !forcedUpdate)) {
        continue;

      } else if (mapping === 'projection-matrix') {
        gl.uniformMatrix4fv(location, false, _projectionMatrix);

      } else if (mapping === 'model-view-matrix') {
        gl.uniformMatrix4fv(location, false, _modelViewMatrix);

      } else if (mapping === 'time') {
        gl.uniform1f(location, _passedTime * 0.001);

      } else if (mapping === 'viewport-size') {
        gl.uniform2f(location, this._canvas.width, this._canvas.height);

      } else if (mapping === 'inverse-viewport-size') {
        const { width, height } = this._canvas;

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

      const mode = filtering === 'linear'
        ? gl.LINEAR
        : gl.NEAREST;

      gl.activeTexture(gl.TEXTURE0 + channel | 0);
      gl.bindTexture(gl.TEXTURE_2D, tex.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode);
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
   * @param {string|null}	filtering - Sampler filtering. Can be linear or nearest.
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
    const mode = filtering === 'linear'
      ? gl.LINEAR
      : gl.NEAREST;

    gl.activeTexture(gl.TEXTURE0 + channel | 0);
    gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode);
    gl.uniform1i(location, channel | 0);
  }

  /**
   * Register new texture.
   *
   * @param {string}	id - Texture id.
   * @param {HTMLImageElement}	image - Image instance.
   *
   * @example
   * const image = new Image();
   * image.src = 'marsian.png';
   * system.registerTexture('marsian', image);
   */
  registerTexture(id, image) {
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
      'OES_texture_float',
      'OES_texture_float_linear'
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

  /**
   * Register new render target.
   *
   * @param {string}	id - Render target id.
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   * @param {boolean}	floatPointData - Tells if render target will store floating point data.
   * @param {number}  multiTargetsCount - Number of target color attachments.
   *
   * @example
   * system.registerRenderTarget('offscreen', 512, 512);
   */
  registerRenderTarget(
    id,
    width,
    height,
    floatPointData = false,
    multiTargetsCount = 0
  ) {
    if (!!floatPointData && !this.requestExtensions(
      'OES_texture_float',
      'OES_texture_float_linear'
    )) {
      throw new Error('Float textures are not supported!');
    }
    if (!!multiTargetsCount > 0 && !this.requestExtensions(
      'WEBGL_draw_buffers'
    )) {
      throw new Error('Draw buffers are not supported!');
    }

    this.unregisterRenderTarget(id);

    const gl = this._context;
    width = Math.max(1, width);
    height = Math.max(1, height);

    if (multiTargetsCount > 0) {
      const ext = this.extension('WEBGL_draw_buffers');
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
        multiTargets: buffers
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
        multiTargets: null
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
      const ext = this.extension('WEBGL_draw_buffers');
      if (!!ext) {
        ext.drawBuffersWEBGL(target.multiTargets);
      }
    }
    gl.viewport(0, 0, target.width, target.height);
    gl.scissor(0, 0, target.width, target.height);
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
      const ext = this.extension('WEBGL_draw_buffers');
      if (!!ext) {
        ext.drawBuffersWEBGL([]);
      }
    }
    _context.bindFramebuffer(_context.FRAMEBUFFER, null);
    _context.viewport(0, 0, _canvas.width, _canvas.height);
    _context.scissor(0, 0, _canvas.width, _canvas.height);
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
    return !!this._shaders.get(id);
  }

  /**
   * Tells if there is registered given texture.
   *
   * @param {string}	id - Texture id.
   *
   * @return {boolean}
   */
  hasTexture(id) {
    return !!this._textures.get(id);
  }

  /**
   * Tells if there is registered given render target.
   *
   * @param {string}	id - Render target id.
   *
   * @return {boolean}
   */
  hasRenderTarget(id) {
    return !!this._renderTargets.get(id);
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
      this._events.trigger('resize', clientWidth, clientHeight);
    }
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

    const { _contextVersion } = this;
    const options = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    };
    const contextName = _contextVersion === 1
      ? 'webgl'
      : `webgl${_contextVersion}`;
    const gl = this._context =
      canvas.getContext(contextName, options) ||
      canvas.getContext(`experimental-${contextName}`, options);

    if (!gl) {
      throw new Error(`Cannot create WebGL context: ${contextName}`);
    }

    for (const name of this._extensions.keys()) {
      this.requestExtension(name);
    }

    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.scissor(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.registerTextureColor('', 1, 1, 255, 255, 255, 255);

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

    _stats.set('delta-time', deltaTime);
    _stats.set('passed-time', this._passedTime);
    _stats.set('shader-changes', _counterShaderChanges);
    _stats.set('frames', ++this._counterFrames);
    _stats.set('shaders', this._shaders.size);
    _stats.set('textures', this._textures.size);
    _stats.set('renderTargets', this._renderTargets.size);
    _stats.set('extensions', this._extensions.keys());

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
