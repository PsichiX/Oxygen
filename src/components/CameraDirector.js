import Camera2D from './Camera2D';
import Component from '../systems/EntitySystem/Component';

export default class CameraDirector extends Component {

  static factory() {
    return new CameraDirector();
  }

  static get propsTypes() {
    return {
      ...Component.propsTypes,
      zoom: 'number',
      zoomOut: 'number',
      near: 'number',
      far: 'number',
      zoomMode: 'enum(pixel-perfect, keep-aspect)',
      captureEntity: 'string_null',
      cameras: 'array(string)'
    };
  }

  static get ZoomMode() {
    return Camera2D.ZoomMode;
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._zoom = value;
  }

  get zoomOut() {
    const { _zoom } = this;
    return _zoom !== 0 ? 1 / _zoom : 1;
  }

  set zoomOut(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._zoom = value !== 0 ? 1 / value : 1;
  }

  get near() {
    return this._near;
  }

  set near(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._near = value;
  }

  get far() {
    return this._far;
  }

  set far(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._far = value;
  }

  get zoomMode() {
    return this._zoomMode;
  }

  set zoomMode(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._zoomMode = value;
  }

  get captureEntity() {
    return this._captureEntity;
  }

  set captureEntity(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._captureEntity = value;
  }

  get cameras() {
    return [ ...this._cameras ];
  }

  set cameras(value) {
    if (!value) {
      this._cameras = null;
      return;
    }

    if (!(value instanceof Array)) {
      throw new Error('`value` is not type of Array!');
    }
    for (let i = 0, c = value.length; i < c; ++i) {
      if (typeof value[i] !== 'string') {
        throw new Error(`\`value\` item #${i} is not type of String!`);
      }
    }

    this._cameras = [ ...value ];
  }

  constructor() {
    super();

    this._zoom = 1;
    this._near = -1;
    this._far = 1;
    this._zoomMode = Camera2D.ZoomMode.PIXEL_PERFECT;
    this._captureEntity = null;
    this._cameras = null;
  }

  onAction(name, ...args) {
    if (name === 'view') {
      return this.onView(...args);
    }
  }

  onPropertySerialize(name, value) {
    if (this.zoomOut > this.zoom ? name === 'zoom' : name === 'zoomOut') {
      return;
    } else if (name === 'cameras') {
      return !value ? [] : [ ...value ];
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  onView(...args) {
    const {
      entity,
      _zoom,
      _near,
      _far,
      _zoomMode,
      _captureEntity,
      _cameras
    } = this;

    if (!entity || !_cameras || _cameras.length === 0) {
      return true;
    }

    for (const item of _cameras) {
      const cameraEntity = entity.findEntity(item);
      if (!cameraEntity) {
        console.warn(`Cannot find camera entity: ${item}`);
        continue;
      }

      const camera = cameraEntity.getComponent('Camera2D');
      if (!!camera) {
        camera.zoom = _zoom;
        camera.near = _near;
        camera.far = _far;
        camera.zoomMode = _zoomMode;
        camera.captureEntity = _captureEntity;
        cameraEntity.performAction('view', ...args);
      } else {
        console.warn(`Camera entity does not have Camera2D component: ${item}`);
      }
    }

    return true;
  }

}
