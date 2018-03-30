import Component from '../systems/EntitySystem/Component';
import Camera, { PostprocessPass } from './Camera';

export class PostprocessRackPass extends PostprocessPass {

  get connections() {
    return this._connections;
  }

  set connections(value) {
    this._connections = value;
  }

  constructor() {
    super();

    this._connections = null;
    this._passes = new Map();
  }

  dispose() {
    this.unregisterAllPasses();
    super.dispose();

    this._connections = null;
    this._passes = null;
  }

  getTargetId(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const found = id.indexOf(':');
    if (found < 0) {
      return super.getTargetId(id);
    } else {
      const pid = id.substr(0, found);
      const tid = id.substr(found + 1);
      const pass = this._passes.get(pid);
      if (!pass) {
        throw new Error(`Unknown postprocess rack pass: ${pid}`);
      }

      return pass.getTargetId(tid);
    }
  }

  registerPass(id, pass) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!(pass instanceof PostprocessPass)) {
      throw new Error('`pass` is not type of PostprocessPass!');
    }

    this._passes.set(id, pass);
  }

  unregisterPass(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._passes.delete(id);
  }

  unregisterAllPasses() {
    this._passes.clear();
  }

  onApply(gl, renderer, textureSource, renderTarget) {
    super.onApply(gl, renderer, textureSource, renderTarget);

    const { _connections, _passes } = this;
    if (!_connections || _connections.length <= 0) {
      console.warn('Cannot postprocess empty list of connections!');
      return;
    }

    for (const c of _connections) {
      const [ source, effect, target ] = c;
      let ts = textureSource;
      let rt = renderTarget;
      if (source === target && !!source) {
        console.warn(
          `Cannot postprocess image when source and target are the same: ${source}`
        );
      }
      if (!!source) {
        ts = this.getTargetId(source);
        if (!ts) {
          console.warn(`Trying to get unknown postprocess rack source: ${source}`);
          continue;
        }
      }
      if (!!target) {
        rt = this.getTargetId(target);
        if (!rt) {
          console.warn(`Trying to get unknown postprocess rack target: ${target}`);
          continue;
        }
      }
      const pass = _passes.get(effect);
      if (!pass) {
        console.warn(
          `Trying to apply unknown postprocess rack effect: ${effect}`
        );
        continue;
      }

      pass.onApply(gl, renderer, ts, rt);
    }
  }

}

export class PostprocessRackRawEffectPass extends PostprocessPass {

  get shader() {
    return this._shader;
  }

  set shader(value) {
    this._shader = value;
  }

  get overrideUniforms() {
    return this._overrideUniforms;
  }

  set overrideUniforms(value) {
    this._overrideUniforms = value;
  }

  get overrideSamplers() {
    return this._overrideSamplers;
  }

  set overrideSamplers(value) {
    this._overrideSamplers = value;
  }

  constructor() {
    super();

    this._shader = null;
    this._overrideUniforms = null;
    this._overrideSamplers = null;
  }

  dispose() {
    super.dipose();

    this._shader = null;
    this._overrideUniforms = null;
    this._overrideSamplers = null;
  }

  onApply(gl, renderer, textureSource, renderTarget) {
    super.onApply(gl, renderer, textureSource, renderTarget);

    this.apply(
      gl,
      renderer,
      textureSource,
      renderTarget,
      this._shader,
      this._overrideUniforms,
      this._overrideSamplers
    );
  }

}

/**
 * Camera postprocess rack.
 */
export default class PostprocessRack extends Component {

  static get propsTypes() {
    return {
      connections: 'array(array(any))',
      targets: 'array(any)',
      sourceFloatPointData: 'boolean',
      effects: 'map(any)'
    };
  }

  /**
   * Component factory.
   *
   * @return {PostprocessRack} Component instance.
   */
  static factory() {
    return new PostprocessRack();
  }

  get connections() {
    return this._mainPass.connections;
  }

  set connections(value) {
    if (!value) {
      this._mainPass.connections = null;
      return;
    }

    if (!Array.isArray(value)) {
      throw new Error('`value` is not type of Array!');
    }
    for (const item of value) {
      if (!Array.isArray(item)) {
        throw new Error('One of `value` items is not type of Array!');
      }
    }

    this._mainPass.connections = value;
  }

  get targets() {
    return this._targets;
  }

  set targets(value) {
    if (!value) {
      this._targets = null;
      return;
    }

    const { _targets, _mainPass } = this;
    if (!!_targets) {
      for (const id in _targets) {
        _mainPass.destroyTarget(id);
      }
    }
    this._targets = value;
    if (!!value) {
      for (const id in value) {
        const { level, floatPointData, potMode } = value[id];
        _mainPass.createTarget(id, level, floatPointData, potMode);
      }
    }
  }

  get sourceFloatPointData() {
    return this._sourceFloatPointData;
  }

  set sourceFloatPointData(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._sourceFloatPointData = value;
  }

  get effects() {
    return this._effects;
  }

  set effects(value) {
    this._unregisterEffects();
    this._effects = value;
    this._registerEffects();
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._sourceFloatPointData = false;
    this._mainPass = new PostprocessRackPass();
    this._targets = null;
    this._effects = null;
    this._effectsPasses = null;
  }

  /**
   * Destructor (disposes internal resources).
   *
   * @example
   * rack.dispose();
   * rack = null;
   */
  dispose() {
    super.dispose();

    this._mainPass.dispose();
    this._mainPass = null;
    this._targets = null;
    this._effects = null;
    this._effectsPasses = null;
  }

  getTargetId(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const found = id.indexOf(':');
    if (found < 0) {
      return super.getTargetId(id);
    } else {
      const pid = id.substr(0, found);
      const tid = id.substr(found + 1);
      const pass = this._passes.get(pid);
      if (!pass) {
        throw new Error(`Unknown postprocess rack pass: ${pid}`);
      }

      return pass.getTargetId(tid);
    }
  }

  registerPass(id, pass) {
    this._mainPass.registerPass(id, pass);
  }

  unregisterPass(id) {
    this._mainPass.unregisterPass(id);
  }

  unregisterAllPasses() {
    this._mainPass.unregisterAllPasses();
  }

  onAttach() {
    this._register();
  }

  onDetach() {
    this._unregister();
  }

  _register() {
    const { entity } = this;
    if (!entity) {
      return;
    }

    const camera = entity.getComponent(Camera);
    if (!camera) {
      throw new Error('There is no Camera component in entity!');
    }

    camera.registerPostprocess(this._mainPass, this._sourceFloatPointData);
  }

  _unregister() {
    const { entity } = this;
    if (!entity) {
      return;
    }

    const camera = entity.getComponent(Camera);
    if (!camera) {
      throw new Error('There is no Camera component in entity!');
    }

    camera.unregisterPostprocess();
  }

  _registerEffects() {
    const { _effects } = this;
    if (!_effects) {
      return;
    }

    this._effectsPasses = new Map();
    for (const id in _effects) {
      const { shader, overrideUniforms, overrideSamplers } = _effects[id];
      const pass = new PostprocessRackRawEffectPass();
      pass.shader = shader;
      pass.overrideUniforms = overrideUniforms;
      pass.overrideSamplers = overrideSamplers;
      this._effectsPasses.set(id, pass);
      this.registerPass(id, pass);
    }
  }

  _unregisterEffects() {
    const { _effectsPasses } = this;
    if (!_effectsPasses) {
      return;
    }

    for (const [id, pass] of _effectsPasses.entries()) {
      pass.dispose();
      this.unregisterPass(id);
    }
    this._effectsPasses = null;
  }

}
