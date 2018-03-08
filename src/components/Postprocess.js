import Component from '../systems/EntitySystem/Component';
import Camera, { PostprocessPass } from './Camera';

export class PostprocessBase extends Component {

  static get propsTypes() {
    return {
      active: 'boolean'
    };
  }

  static factory() {
    throw new Error('Cannot instantiate PostprocessBase abstract component!');
  }

  get active() {
    return this._active;
  }

  set active(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    const { _active } = this;
    this._active = value;
    if (!!this._camera && value !== _active) {
      if (!!value) {
        this.onRegister();
      } else {
        this.onUnregister();
      }
    }
  }

  get camera() {
    return this._camera;
  }

  constructor() {
    super();

    this._active = true;
    this._camera = null;
  }

  dispose() {
    super.dispose();

    this._camera = null;
  }

  registerPostprocessPass(pass) {
    const { _camera } = this;
    if (!!_camera && this._active) {
      _camera.registerPostprocessPass(pass);
    }
  }

  unregisterPostprocessPass(pass) {
    const { _camera } = this;
    if (!!_camera) {
      _camera.unregisterPostprocessPass(pass);
    }
  }

  unregisterAllPostprocessPasses() {
    const { _camera } = this;
    if (!!_camera) {
      _camera.unregisterAllPostprocessPasses();
    }
  }

  onAttach() {
    const camera = this._camera = this.entity.getComponent(Camera);
    if (!camera) {
      throw new Error('There is no Camera component in entity!');
    }

    this.onRegister();
  }

  onDetach() {
    this.onUnregister();
    this._camera = null;
  }

  onRegister() {}

  onUnregister() {}

}

/**
 * Multipass camera postprocess controller.
 *
 * @example
 * const effect = new Postprocess();
 * effect.deserialize({ passes: [ { shader: 'pixelate.json' }, { shader: 'yellowish.json' } ] });
 */
export default class Postprocess extends PostprocessBase {

  /** @type {*} */
  static get propsTypes() {
    return {
      passes: 'array(any)|null'
    };
  }

  /**
   * Component factory.
   *
   * @return {Postprocess} Component instance.
   */
  static factory() {
    return new Postprocess();
  }

  /** @type {[*]} */
  get passes() {
    return this._passes;
  }

  /** @type {[*]} */
  set passes(value) {
    if (!value) {
      this._unregister();
      this._passes = null;
      return;
    }
    if (!Array.isArray(value)) {
      throw new Error('`value` is not type of Array!');
    }

    this._passes = value;
    if (this._camera) {
      this._register();
    }
  }

  /** @type {[PostprocessPass]} */
  get passesInstances() {
    return this._passInstances;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._passes = null;
    this._passInstances = null;
  }

  /**
   * Destructor (disposes internal resources).
   *
   * @example
   * effect.dispose();
   * effect = null;
   */
  dispose() {
    super.dispose();

    this._passes = null;
    this._passInstances = null;
  }

  /**
   * @override
   */
  onRegister() {
    this._register();
  }

  /**
   * @override
   */
  onUnregister() {
    this._unregister();
  }

  /**
   * @override
   */
  onPropertySerialize(name, value) {
    if (name === 'passes') {
      const { _passInstances, _passes } = this;
      return (!!_passInstances
        ? _passInstances.map(p => p.serialzie())
        : _passes) || undefined;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  _register() {
    this._unregister();

    const { _passes } = this;
    if (!_passes || _passes.length <= 0) {
      return;
    }

    this._passInstances = this._passes.map(data => {
      const pass = new PostprocessPass();
      pass.deserialize(data);
      this.registerPostprocessPass(pass);
      return pass;
    });
  }

  _unregister() {
    const { _passInstances } = this;

    if (!!_passInstances && _passInstances.length > 0) {
      this._passes = _passInstances.map(pass => {
        const data = pass.serialize();
        this.unregisterPostprocessPass(pass);
        pass.dispose();
        return data;
      });
      this._passInstances = null;
    }
  }

}
