import Component from '../systems/EntitySystem/Component';
import { Command, Pipeline, RenderFullscreenCommand } from '../systems/RenderSystem';
import Camera from './Camera';

export class MultipassPipeline extends Command {

  get passes() {
    return this._passes;
  }

  set passes(value) {
    if (!Array.isArray(value)) {
      throw new Error('`value` is not type of Array!');
    }
    this._passes = value || [];
    this._dirty = true;
  }

  get fullscreen() {
    return this._fullscreen;
  }

  constructor(owner) {
    super();

    this._owner = owner;
    this._renderer = null;
    this._fullscreen = new RenderFullscreenCommand();
    this._dirty = true;
    this._passes = [];
    this._passesTargets = new Set();
  }

  dispose() {
    super.dispose();

    const { _renderer, _fullscreen } = this;
    if (!!_renderer && !!this._passesTargets) {
      for (const target of this._passesTargets.values()) {
        _renderer.unregisterRenderTarget(target);
      }
    }
    if (!!_fullscreen) {
      _fullscreen.dispose();
    }
    this._owner = null;
    this._renderer = null;
    this._fullscreen = null;
    this._passes = null;
    this._passesTargets = null;
  }

  onRender(gl, renderer, deltaTime, mainLayer) {
    this._ensureState(renderer);

    const { _owner, _passes, _passesTargets } = this;
    const { entity } = _owner;
    const rtt = renderer.activeRenderTarget;
    for (const pass of _passes) {
      const {
        layer,
        buffer,
        persistentBuffer,
        captureEntity,
        shader,
        overrideUniforms,
        overrideSamplers
      } = pass;
      if (!!shader) {
        this._fullscreen.shader = shader;
        const uniforms = this._fullscreen.overrideUniforms;
        const samplers = this._fullscreen.overrideSamplers;
        uniforms.clear();
        samplers.clear();
        if (!!overrideUniforms) {
          for (const name in overrideUniforms) {
            uniforms.set(name, overrideUniforms[name]);
          }
        }
        if (!!overrideSamplers) {
          for (const name in overrideSamplers) {
            samplers.set(name, overrideSamplers[name]);
          }
        }
        if (!!rtt) {
          renderer.enableRenderTarget(rtt, false);
        } else {
          renderer.disableRenderTarget();
        }
        this._fullscreen.onRender(gl, renderer, deltaTime, mainLayer);
      } else {
        const target = !!captureEntity
          ? entity.findEntity(captureEntity)
          : entity;
        if (!!buffer) {
          renderer.enableRenderTarget(buffer, !persistentBuffer);
        } else if (!!rtt) {
          renderer.enableRenderTarget(rtt, false);
        } else {
          renderer.disableRenderTarget();
        }
        if (!!layer) {
          target.performAction('render-layer', gl, renderer, deltaTime, layer);
        } else {
          target.performAction('render', gl, renderer, deltaTime, null);
        }
      }
    }
    if (!!rtt) {
      renderer.enableRenderTarget(rtt, false);
    } else {
      renderer.disableRenderTarget();
    }
  }

  onResize(width, height) {
    this._dirty = true;
  }

  _ensureState(renderer) {
    if (!this._dirty) {
      return;
    }
    const { _passes, _passesTargets } = this;
    for (const target of _passesTargets.values()) {
      renderer.unregisterRenderTarget(target);
    }

    this._passesTargets = new Set();
    for (const pass of _passes) {
      const { buffer, targets, floatPointData } = pass;
      this._passesTargets.add(buffer);
      if (!targets) {
        renderer.registerRenderTarget(
          buffer,
          renderer.canvas.width,
          renderer.canvas.height,
          floatPointData
        );
      } else {
        renderer.registerRenderTargetMulti(
          buffer,
          renderer.canvas.width,
          renderer.canvas.height,
          targets
        );
      }
    }

    this._renderer = renderer;
    this._dirty = false;
  }

}

export default class MultipassRenderer extends Component {

  static get propsTypes() {
    return {
      passes: 'array(any)',
    };
  }

  static factory() {
    return new MultipassRenderer();
  }

  /** @type {*} */
  get passes() {
    return this._pipeline.passes;
  }

  /** @type {*} */
  set passes(value) {
    this._pipeline.passes = value;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._camera = null;
    this._pipeline = new MultipassPipeline(this);
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
