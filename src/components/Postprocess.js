import Component from '../systems/EntitySystem/Component';
import Camera, { PostprocessPass } from './Camera';

/**
 * Multipass camera postprocess controller.
 *
 * @example
 * const effect = new Postprocess();
 * effect.deserialize({ passes: [ { shader: 'pixelate.json' }, { shader: 'yellowish.json' } ] });
 */
export default class Postprocess extends Component {

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

  /** @type {*} */
  get passes() {
    return this._passes;
  }

  /** @type {*} */
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

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._camera = null;
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

    this._camera = null;
    this._passes = null;
    this._passInstances = null;
  }

  /**
   * @override
   */
  onAttach() {
    this._register();
  }

  /**
   * @override
   */
  onDetach() {
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

    const camera = this._camera = this.entity.getComponent(Camera);
    if (!camera) {
      throw new Error('There is no component of Camera type!');
    }

    const { _passes } = this;
    if (!_passes || _passes.length <= 0) {
      return;
    }

    this._passInstances = this._passes.map(data => {
      const pass = new PostprocessPass();
      pass.deserialize(data);
      camera.registerPostprocessPass(pass);
      return pass;
    });
  }

  _unregister() {
    const { _camera } = this;
    if (!_camera) {
      return;
    }

    const { _passInstances } = this;

    if (!!_passInstances && _passInstances.length > 0) {
      this._passes = _passInstances.map(pass => {
        _camera.unregisterPostprocessPass(pass);
        return pass.serialize();
      });
      this._passInstances = null;
    }
    this._camera = null;
  }

}
