import Component from '../systems/EntitySystem/Component';
import { Command, Pipeline, RenderFullscreenCommand } from '../systems/RenderSystem';
import Camera from './Camera';

export class DeferredPipeline extends Command {

  get gBufferId() {
    return this._gBufferId;
  }

  set gBufferId(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._gBufferId = value;
    this._dirty = true;
  }

  get lBufferId() {
    return this._lBufferId;
  }

  set lBufferId(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._lBufferId = value;
    this._dirty = true;
  }

  get gBufferTargets() {
    return this._gBufferTargets;
  }

  set gBufferTargets(value) {
    if (typeof value === 'number') {
      this._gBufferTargets = { float: true, mipmap: false, count: value | 0 };
    } else if (!!value) {
      this._gBufferTargets = {
        float: 'float' in value ? !!value.float : true,
        mipmap: 'mipmap' in value ? !!value.mipmap : false,
        count: 'count' in value ? value.count | 0 : 2
      };
    } else {
      throw new Error('`value` is not type of either Number or Object!');
    }

    this._dirty = true;
  }

  get lBufferTargets() {
    return this._lBufferTargets;
  }

  set lBufferTargets(value) {
    if (typeof value === 'number') {
      this._lBufferTargets = { float: true, mipmap: false, count: value | 0 };
    } else if (!!value) {
      this._lBufferTargets = {
        float: 'float' in value ? !!value.float : true,
        mipmap: 'mipmap' in value ? !!value.mipmap : false,
        count: 'count' in value ? value.count | 0 : 2
      };
    } else {
      throw new Error('`value` is not type of either Number or Object!');
    }

    this._dirty = true;
  }

  get gBufferLayer() {
    return this._gBufferLayer;
  }

  set gBufferLayer(value) {
    if (!value) {
      this._gBufferLayer = null;
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._gBufferLayer = value;
  }

  get lBufferLayer() {
    return this._lBufferLayer;
  }

  set lBufferLayer(value) {
    if (!value) {
      this._lBufferLayer = null;
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._lBufferLayer = value;
  }

  get fullscreen() {
    return this._fullscreen;
  }

  constructor(owner) {
    super();

    this._owner = owner;
    this._renderer = null;
    this._gBuffer = null;
    this._lBuffer = null;
    this._gBufferId = '#deferred-g-buffer';
    this._lBufferId = '#deferred-l-buffer';
    this._gBufferIdUsed = null;
    this._lBufferIdUsed = null;
    this._gBufferTargets = { float: true, mipmap: false, count: 2 };
    this._lBufferTargets = { float: true, mipmap: false, count: 2 };
    this._gBufferLayer = 'g-buffer';
    this._lBufferLayer = 'l-buffer';
    this._fullscreen = new RenderFullscreenCommand();
    this._dirty = true;
  }

  dispose() {
    super.dispose();

    const { _renderer, _gBufferIdUsed, _lBufferIdUsed, _fullscreen } = this;
    if (!!_renderer) {
      if (!!_gBufferIdUsed) {
        _renderer.unregisterRenderTarget(_gBufferIdUsed);
      }
      if (!!_lBufferIdUsed) {
        _renderer.unregisterRenderTarget(_lBufferIdUsed);
      }
    }
    if (!!_fullscreen) {
      _fullscreen.dispose();
    }
    this._owner = null;
    this._renderer = null;
    this._gBufferId = null;
    this._lBufferId = null;
    this._gBufferIdUsed = null;
    this._lBufferIdUsed = null;
    this._gBufferLayer = null;
    this._lBufferLayer = null;
    this._fullscreen = null;
  }

  onRender(gl, renderer, deltaTime, layer) {
    this._ensureState(renderer);

    const { _owner, _gBufferLayer, _lBufferLayer } = this;
    const { captureEntity, entity } = _owner;
    const target = !!captureEntity
      ? entity.findEntity(captureEntity)
      : entity;
    const rtt = renderer.activeRenderTarget;

    if (!!_gBufferLayer) {
      renderer.enableRenderTarget(this._gBufferIdUsed);
      target.performAction('render-layer', gl, renderer, deltaTime, _gBufferLayer);
      renderer.disableRenderTarget();
    }

    if (!!_lBufferLayer) {
      renderer.enableRenderTarget(this._lBufferIdUsed);
      target.performAction('render-layer', gl, renderer, deltaTime, _lBufferLayer);
      renderer.disableRenderTarget();
    }

    if (!!rtt) {
      renderer.enableRenderTarget(rtt);
    }
    this._fullscreen.onRender(gl, renderer, deltaTime, layer);
  }

  onResize(width, height) {
    this._dirty = true;
  }

  _ensureState(renderer) {
    if (!this._dirty) {
      return;
    }
    const { _gBufferId, _lBufferId } = this;
    if (!_gBufferId) {
      throw new Error('`gBufferId` cannot be null!');
    }
    if (!_lBufferId) {
      throw new Error('`lBufferId` cannot be null!');
    }

    if (!!this._gBufferIdUsed) {
      renderer.unregisterRenderTarget(this._gBufferIdUsed);
    }
    this._gBufferIdUsed = this._gBufferId;
    renderer.registerRenderTarget(
      this._gBufferIdUsed,
      renderer.canvas.width,
      renderer.canvas.height,
      this._gBufferTargets.float,
      this._gBufferTargets.count,
      this._gBufferTargets.mipmap
    );

    if (!!this._lBufferIdUsed) {
      renderer.unregisterRenderTarget(this._lBufferIdUsed);
    }
    this._lBufferIdUsed = this._lBufferId;
    renderer.registerRenderTarget(
      this._lBufferIdUsed,
      renderer.canvas.width,
      renderer.canvas.height,
      this._lBufferTargets.float,
      this._lBufferTargets.count,
      this._lBufferTargets.mipmap
    );

    this._renderer = renderer;
    this._dirty = false;
  }

}

/**
 * Deferred pipeline renderer.
 */
export default class DeferredRenderer extends Component {

  static get propsTypes() {
    return {
      shader: 'string_null',
      overrideUniforms: 'map(any)',
      overrideSamplers: 'map(any)',
      gBufferId: 'string',
      lBufferid: 'string',
      gBufferTargets: 'number',
      lBufferTargets: 'number',
      gBufferLayer: 'string_null',
      lBufferLayer: 'string_null'
    };
  }

  static factory() {
    return new DeferredRenderer();
  }

  /** @type {String|null} */
  get shader() {
    return this._pipeline.fullscreen.shader;
  }

  /** @type {String|null} */
  set shader(value) {
    this._pipeline.fullscreen.shader = value;
  }

  /** @type {*} */
  get overrideUniforms() {
    const { fullscreen } = this._pipeline;
    const result = {};
    for (const [key, value] of fullscreen.overrideUniforms) {
      result[key] = value;
    }

    return result;
  }

  /** @type {*} */
  set overrideUniforms(value) {
    const { overrideUniforms } = this._pipeline.fullscreen;

    overrideUniforms.clear();
    if (!value) {
      return;
    }

    for (const name in value) {
      overrideUniforms.set(name, value[name]);
    }
  }

  /** @type {*} */
  get overrideSamplers() {
    const { fullscreen } = this._pipeline;
    const result = {};
    for (const [key, value] of fullscreen.overrideSamplers) {
      result[key] = value;
    }

    return result;
  }

  /** @type {*} */
  set overrideSamplers(value) {
    const { overrideSamplers } = this._pipeline.fullscreen;

    overrideSamplers.clear();
    if (!value) {
      return;
    }

    for (const name in value) {
      overrideSamplers.set(name, value[name]);
    }
  }

  /** @type {String} */
  get gBufferId() {
    return this._pipeline.gBufferId;
  }

  /** @type {String} */
  set gBufferId(value) {
    this._pipeline.gBufferId = value;
  }

  /** @type {String} */
  get lBufferId() {
    return this._pipeline.lBufferId;
  }

  /** @type {String} */
  set lBufferId(value) {
    this._pipeline.lBufferId = value;
  }

  /** @type {Number} */
  get gBufferTargets() {
    return this._pipeline.gBufferTargets;
  }

  /** @type {Number} */
  set gBufferTargets(value) {
    this._pipeline.gBufferTargets = value;
  }

  /** @type {Number} */
  get lBufferTargets() {
    return this._pipeline.lBufferTargets;
  }

  /** @type {Number} */
  set lBufferTargets(value) {
    this._pipeline.lBufferTargets = value;
  }

  /** @type {String|null} */
  get gBufferLayer() {
    return this._pipeline.gBufferLayer;
  }

  /** @type {String|null} */
  set gBufferLayer(value) {
    this._pipeline.gBufferLayer = value;
  }

  /** @type {String|null} */
  get lBufferLayer() {
    return this._pipeline.lBufferLayer;
  }

  /** @type {String|null} */
  set lBufferLayer(value) {
    this._pipeline.lBufferLayer = value;
  }

  get gBuffer() {
    return this._pipeline.gBuffer;
  }

  get lBuffer() {
    return this._pipeline.lBuffer;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._camera = null;
    this._pipeline = new DeferredPipeline(this);
  }

  /**
   * @override
   */
  dispose() {
    if (!!this._pipeline) {
      this._pipeline.dispose();
      this._pipeline = null;
    }
    this._camera = null;

    super.dispose();
  }

  /**
   * @override
   */
  onAttach() {
    const camera = this._camera = this.entity.getComponent(Camera);
    if (!camera) {
      throw new Error('There is no component of Camera type!');
    }

    camera.command = this._pipeline;
  }

  /**
   * @override
   */
  onDetach() {
    if (!!this._camera) {
      this._camera.command = null;
      this._camera = null;
    }
  }

}
