import Component from '../systems/EntitySystem/Component';
import Camera, { PostprocessPass } from './Camera';

export default class Postprocess extends Component {

  static get propsTypes() {
    return {
      passes: 'array(any)|null'
    };
  }

  static factory() {
    return new Postprocess();
  }

  get passes() {
    return this._passes;
  }

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

  constructor() {
    super();

    this._camera = null;
    this._passes = null;
    this._passInstances = null;
  }

  dispose() {
    super.dispose();

    this._camera = null;
    this._passes = null;
    this._passInstances = null;
  }

  onAttach() {
    this._register();
  }

  onDetach() {
    this._unregister();
  }

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
      camera.registerPostProcessPass(pass);
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
        _camera.unregisterPostProcessPass(pass);
        return pass.serialize();
      });
      this._passInstances = null;
    }
    this._camera = null;
  }

}
