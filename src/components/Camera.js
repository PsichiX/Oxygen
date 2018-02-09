import Component from '../systems/EntitySystem/Component';
import { Command, RenderFullscreenCommand } from '../systems/RenderSystem';
import System from '../systems/System';
import { mat4 } from '../utils/gl-matrix';

const cachedTempMat4 = mat4.create();
const cachedZeroMat4 = mat4.fromValues(
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);
let rttUidGenerator = 0;

/**
 * Postprocess pass processed by camera to modify it's output image.
 *
 * @example
 * const pass = new PostprocessPass();
 * pass.deserialize({ shader: 'pixelate.json', overrideUniforms: { uScale: [100, 100] } });
 * camera.registerPostprocessPass(pass);
 */
export class PostprocessPass extends RenderFullscreenCommand {

  /**
   * Serialize pass state into JSON object.
   *
   * @return {*} Serialized JSON object.
   *
   * @example
   * const data = { shader: 'pixelate.json' };
   * const pass = new PostprocessPass();
   * pass.deserialize(data);
   * pass.serialize().shader === data.shader
   */
  serialize() {
    const result = {
      shader: this._shader
    };

    if (this._overrideUniforms.size > 0) {
      result.overrideUniforms = {};
      for (const [key, value] of this._overrideUniforms.entries()) {
        result.overrideUniforms[key] = value;
      }
    }

    if (this._overrideSamplers.size > 0) {
      result.overrideSamplers = {};
      for (const [key, value] of this._overrideSamplers.entries()) {
        result.overrideSamplers[key] = value;
      }
    }

    return result;
  }

  /**
   * Deserialize JSON data into pass state.
   *
   * @param {*}	data - JSON object with pass state.
   *
   * @example
   * const data = { shader: 'pixelate.json' };
   * const pass = new PostprocessPass();
   * pass.deserialize(data);
   * pass.serialize().shader === data.shader
   */
  deserialize(data) {
    if (!data) {
      return;
    }

    this.shader = data.shader || null;

    if ('overrideUniforms' in data) {
      for (const key in data.overrideUniforms) {
        this._overrideUniforms.set(key, data.overrideUniforms[key]);
      }
    }

    if ('overrideSamplers' in data) {
      for (const key in data.overrideSamplers) {
        this._overrideSamplers.set(key, data.overrideSamplers[key]);
      }
    }
  }

}

/**
 * Camera base class component.
 */
export default class Camera extends Component {

  /** @type {*} */
  static get propsTypes() {
    return {
      ignoreChildrenViews: 'boolean',
      captureEntity: 'string_null',
      renderTargetId: 'string_null',
      renderTargetWidth: 'integer',
      renderTargetHeight: 'integer',
      renderTargetScale: 'number',
      renderTargetFloat: 'boolean',
      renderTargetMultiCount: 'integer',
      layer: 'string_null'
    };
  }

  /**
   * Component factory.
   *
   * @return {Camera} Component instance.
   */
  static factory() {
    return new Camera();
  }

  /** @type {boolean} */
  get ignoreChildrenViews() {
    return this._ignoreChildrenViews;
  }

  /** @type {boolean} */
  set ignoreChildrenViews(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._ignoreChildrenViews = value;
  }

  /** @type {string|null} */
  get captureEntity() {
    return this._captureEntity;
  }

  /** @type {string|null} */
  set captureEntity(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._captureEntity = value;
  }

  /** @type {string|null} */
  get renderTargetId() {
    return this._renderTargetId;
  }

  /** @type {string|null} */
  set renderTargetId(value) {
    if (!!value && typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._renderTargetId = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  /** @type {number} */
  get renderTargetWidth() {
    return this._renderTargetWidth;
  }

  /** @type {number} */
  set renderTargetWidth(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetWidth = value | 0;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  /** @type {number} */
  get renderTargetHeight() {
    return this._renderTargetHeight;
  }

  /** @type {number} */
  set renderTargetHeight(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetHeight = value | 0;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  /** @type {number} */
  get renderTargetScale() {
    return this._renderTargetScale;
  }

  /** @type {number} */
  set renderTargetScale(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetScale = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  /** @type {boolean} */
  get renderTargetFloat() {
    return this._renderTargetFloat;
  }

  /** @type {boolean} */
  set renderTargetFloat(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean');
    }

    this._renderTargetFloat = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  /** @type {number} */
  get renderTargetMultiCount() {
    return this._renderTargetMultiCount;
  }

  /** @type {number} */
  set renderTargetMultiCount(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetMultiCount = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  /** @type {string|null} */
  get layer() {
    return this._layer;
  }

  /** @type {string|null} */
  set layer(value) {
    if (!!value && typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._layer = value;
  }

  /** @type {mat4} */
  get projectionMatrix() {
    return this._projectionMatrix;
  }

  /** @type {mat4} */
  get inverseProjectionMatrix() {
    return this._inverseProjectionMatrix;
  }

  /** @type {Command|null} */
  get command() {
    return this._command;
  }

  /** @type {Command|null} */
  set command(value) {
    if (!value) {
      this._command = null;
      return;
    }

    if (!(value instanceof Command)) {
      throw new Error('`value` is not type of Command!');
    }

    this._command = value;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._ignoreChildrenViews = false;
    this._captureEntity = null;
    this._projectionMatrix = mat4.create();
    this._inverseProjectionMatrix = mat4.create();
    mat4.copy(this._projectionMatrix, cachedZeroMat4);
    mat4.copy(this._inverseProjectionMatrix, cachedZeroMat4);
    this._context = null;
    this._renderTargetId = null;
    this._renderTargetIdUsed = null;
    this._renderTargetWidth = 0;
    this._renderTargetHeight = 0;
    this._renderTargetScale = 1;
    this._renderTargetFloat = false;
    this._renderTargetMultiCount = 0;
    this._renderTargetDirty = false;
    this._layer = null;
    this._postprocess = [];
    this._postprocessRtt = null;
    this._postprocessCachedWidth = 0;
    this._postprocessCachedHeight = 0;
    this._command = null;
    this._dirty = true;
    this._onResize = this.onResize.bind(this);
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    this._postprocess = null;
    const {
      _context,
      _renderTargetIdUsed,
      _postprocessRtt,
      _command
    } = this;

    if (!!_context) {
      if (!!_renderTargetIdUsed) {
        _context.unregisterRenderTarget(_renderTargetIdUsed);
      }
      if (!!_postprocessRtt) {
        _context.unregisterRenderTarget(_postprocessRtt[0]);
        _context.unregisterRenderTarget(_postprocessRtt[1]);
      }

      this._context = null;
    }

    this._renderTargetId = null;
    this._renderTargetIdUsed = null;
    this._postprocessRtt = null;

    if (!!_command) {
      _command.dispose();
      this._command = null;
    }
  }

  /**
   * Building camera matrix.
   *
   * @abstract
   * @param {mat4}	target - Result mat4 object.
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   */
  buildCameraMatrix(target, width, height) {
    throw new Error('Not implemented!');
  }

  /**
   * Register postprocess pass.
   *
   * @param {PostprocessPass}	pass - Postprocess pass.
   */
  registerPostprocessPass(pass) {
    if (!(pass instanceof PostprocessPass)) {
      throw new Error('`pass` is not type of PostprocessPass!');
    }

    const { _postprocess } = this;
    if (_postprocess.length <= 0) {
      this._postprocessCachedWidth = 0;
      this._postprocessCachedHeight = 0;
    }
    _postprocess.push(pass);
  }

  /**
   * Unregister postprocess pass.
   *
   * @param {PostprocessPass}	pass - Postprocess pass.
   */
  unregisterPostprocessPass(pass) {
    if (!(pass instanceof PostprocessPass)) {
      throw new Error('`pass` is not type of PostprocessPass!');
    }

    const { _postprocess } = this;
    if (!_postprocess) {
      return;
    }

    const found = _postprocess.indexOf(pass);
    if (found >= 0) {
      _postprocess.splice(found, 1);
      if (_postprocess.length <= 0) {
        this._postprocessCachedWidth = 0;
        this._postprocessCachedHeight = 0;
      }
    }
  }

  /**
   * Unregister all postprocess passes.
   */
  unregisterAllPostprocessPasses() {
    const { _postprocess } = this;
    if (!_postprocess) {
      return;
    }

    this._postprocess = [];
    this._postprocessCachedWidth = 0;
    this._postprocessCachedHeight = 0;
  }

  /**
   * @override
   */
  onAttach() {
    const { RenderSystem } = System.systems;
    if (!RenderSystem) {
      throw new Error('There is no registered RenderSystem!');
    }

    RenderSystem.events.on('resize', this._onResize);
  }

  /**
   * @override
   */
  onDetach() {
    const { RenderSystem } = System.systems;
    if (!RenderSystem) {
      throw new Error('There is no registered RenderSystem!');
    }

    RenderSystem.events.off('resize', this._onResize);
  }

  /**
   * @override
   */
  onAction(name, ...args) {
    if (name === 'view') {
      return this.onView(...args);
    }
  }

  /**
   * Called when camera need to view rendered scene.
   *
   * @param {WebGLRenderingContext}	gl - WebGL context.
   * @param {RenderSystem}	renderer - Calling renderer instance.
   * @param {number}	deltaTime - Delta time.
   *
   * @return {boolean} True if ignore viewing entity children, false otherwise.
   */
  onView(gl, renderer, deltaTime) {
    const { entity, _ignoreChildrenViews } = this;
    if (!entity) {
      return _ignoreChildrenViews;
    }

    let { width, height } = renderer.canvas;
    const {
      _captureEntity,
      _projectionMatrix,
      _inverseProjectionMatrix,
      _renderTargetWidth,
      _renderTargetHeight,
      _renderTargetScale,
      _postprocess
    } = this;

    if (_renderTargetWidth > 0) {
      width = _renderTargetWidth;
    }
    if (_renderTargetHeight > 0) {
      height = _renderTargetHeight;
    }

    if ((width | 0) === 0 || (height | 0) === 0) {
      mat4.copy(_projectionMatrix, cachedZeroMat4);
      mat4.copy(_inverseProjectionMatrix, cachedZeroMat4);
      mat4.copy(renderer.projectionMatrix, cachedZeroMat4);
      mat4.copy(renderer.inverseProjectionMatrix, cachedZeroMat4);

      if (this._dirty) {
        this._dirty = false;
        target.performAction('camera-changed', this);
      }

      return _ignoreChildrenViews;
    }

    this._context = renderer;

    if (this._renderTargetDirty) {
      if (!!this._renderTargetId) {
        if (!!this._renderTargetIdUsed) {
          renderer.unregisterRenderTarget(this._renderTargetIdUsed);
        }
        this._renderTargetIdUsed = this._renderTargetId;
        renderer.registerRenderTarget(
          this._renderTargetIdUsed,
          width * _renderTargetScale,
          height * _renderTargetScale,
          this._renderTargetFloat,
          this._renderTargetMultiCount
        );
      } else {
        renderer.unregisterRenderTarget(this._renderTargetIdUsed);
        this._renderTargetIdUsed = null;
      }
      this._renderTargetDirty = false;
    }

    const target = !!_captureEntity
      ? entity.findEntity(_captureEntity)
      : entity;

    if (!!_captureEntity) {
      this.buildCameraMatrix(cachedTempMat4, width, height);
      mat4.multiply(_projectionMatrix, cachedTempMat4, entity.inverseTransform);
    } else {
      this.buildCameraMatrix(_projectionMatrix, width, height);
    }

    mat4.copy(renderer.projectionMatrix, _projectionMatrix);
    mat4.invert(_inverseProjectionMatrix, _projectionMatrix);

    if (this._postprocessCachedWidth !== width ||
        this._postprocessCachedHeight !== height
    ) {
      this._postprocessCachedWidth = width;
      this._postprocessCachedHeight = height;
      if (!!this._postprocessRtt) {
        renderer.unregisterRenderTarget(this._postprocessRtt[0]);
        renderer.unregisterRenderTarget(this._postprocessRtt[1]);
        this._postprocessRtt = null;
      }
      if (_postprocess.length > 0) {
        const a = `#Camera-PostprocessPass-${++rttUidGenerator}`;
        const b = `#Camera-PostprocessPass-${++rttUidGenerator}`;
        renderer.registerRenderTarget(a, width, height, false);
        renderer.registerRenderTarget(b, width, height, false);
        this._postprocessRtt = [a, b];
      }
    }

    if (_postprocess.length === 0) {
      if (!!this._renderTargetIdUsed) {
        renderer.enableRenderTarget(this._renderTargetIdUsed);
      }
      if (!!this._command) {
        renderer.executeCommand(this._command, deltaTime, this._layer);
      } else {
        if (!!this._layer) {
          target.performAction('render-layer', gl, renderer, deltaTime, this._layer);
        } else {
          target.performAction('render', gl, renderer, deltaTime, null);
        }
      }
      if (!!this._renderTargetIdUsed) {
        renderer.disableRenderTarget();
      }
    } else if (_postprocess.length === 1) {
      const pass = _postprocess[0];
      const passTarget = pass.renderTargetId;
      const id = passTarget || this._postprocessRtt[0];
      renderer.enableRenderTarget(id);
      if (!!this._command) {
        renderer.executeCommand(this._command, deltaTime, this._layer);
      } else {
        if (!!this._layer) {
          target.performAction('render-layer', gl, renderer, deltaTime, this._layer);
        } else {
          target.performAction('render', gl, renderer, deltaTime, null);
        }
      }
      pass.overrideSamplers.set('sBackBuffer', {
        texture: id,
        filtering: 'linear'
      });
      if (!!this._renderTargetIdUsed) {
        renderer.enableRenderTarget(this._renderTargetIdUsed);
        pass.onRender(gl, renderer, deltaTime);
        renderer.disableRenderTarget();
      } else {
        renderer.disableRenderTarget();
        pass.onRender(gl, renderer, deltaTime);
      }
    } else {
      const pass = _postprocess[0];
      const passTarget = pass.renderTargetId;
      const id = passTarget || this._postprocessRtt[0];
      renderer.enableRenderTarget(id);
      if (!!this._command) {
        renderer.executeCommand(this._command, deltaTime, this._layer);
      } else {
        if (!!this._layer) {
          target.performAction('render-layer', gl, renderer, deltaTime, this._layer);
        } else {
          target.performAction('render', gl, renderer, deltaTime, null);
        }
      }
      let lastTarget = id;
      let lastPass = pass;
      for (let i = 1, c = _postprocess.length; i < c; ++i) {
        const pass = _postprocess[i];
        const passTarget = pass.renderTargetId;
        const id = passTarget || this._postprocessRtt[i % 2];
        lastPass.overrideSamplers.set('sBackBuffer', {
          texture: lastTarget,
          filtering: 'linear'
        });
        renderer.enableRenderTarget(id);
        lastPass.onRender(gl, renderer, deltaTime);
        lastTarget = id;
        lastPass = pass;
      }
      lastPass.overrideSamplers.set('sBackBuffer', {
        texture: lastTarget,
        filtering: 'linear'
      });
      if (!!this._renderTargetIdUsed) {
        renderer.enableRenderTarget(this._renderTargetIdUsed);
        lastPass.onRender(gl, renderer, deltaTime);
        renderer.disableRenderTarget();
      } else {
        renderer.disableRenderTarget();
        lastPass.onRender(gl, renderer, deltaTime);
      }
    }

    if (this._dirty) {
      this._dirty = false;
      target.performAction('camera-changed', this);
    }

    return _ignoreChildrenViews;
  }

  /**
   * Called on view resize.
   *
   * @param {number}	width - Width.
   * @param {number}	height - Height.
   */
  onResize(width, height) {
    const { _renderTargetWidth, _renderTargetHeight, _command } = this;
    if (_renderTargetWidth <= 0 || _renderTargetHeight <= 0) {
      this._renderTargetDirty = true;
      this._postprocessCachedWidth = 0;
      this._postprocessCachedHeight = 0;
      this._dirty = true;
    }
    if (!!_command) {
      _command.onResize(width, height);
    }
  }

}
