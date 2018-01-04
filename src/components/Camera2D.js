import Camera from './Camera';
import System from '../systems/System';
import { mat4 } from '../utils/gl-matrix';

const ZoomMode = {
  PIXEL_PERFECT: 'pixel-perfect',
  KEEP_ASPECT: 'keep-aspect'
};

/**
 * Camera used to view 2D scene.
 *
 * @example
 * const component = new Camera2D();
 * component.deserialize({ zoomOut: 1024, zoomMode: 'keep-aspect' });
 */
export default class Camera2D extends Camera {

  /**
   * Component factory.
   *
   * @return {Camera2D} Component instance.
   */
  static factory() {
    return new Camera2D();
  }

  /** @type {*} */
  static get propsTypes() {
    return {
      ...Camera.propsTypes,
      zoom: 'number',
      zoomOut: 'number',
      near: 'number',
      far: 'number',
      zoomMode: 'enum(pixel-perfect, keep-aspect)'
    };
  }

  /** @type {*} */
  static get ZoomMode() {
    return ZoomMode;
  }

  /** @type {number} */
  get zoom() {
    return this._zoom;
  }

  /** @type {number} */
  set zoom(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._zoom = value;
    this._dirty = true;
  }

  /** @type {number} */
  get zoomOut() {
    const { _zoom } = this;
    return _zoom !== 0 ? 1 / _zoom : 1;
  }

  /** @type {number} */
  set zoomOut(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._zoom = value !== 0 ? 1 / value : 1;
    this._dirty = true;
  }

  /** @type {number} */
  get near() {
    return this._near;
  }

  /** @type {number} */
  set near(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._near = value;
    this._dirty = true;
  }

  /** @type {number} */
  get far() {
    return this._far;
  }

  /** @type {number} */
  set far(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._far = value;
    this._dirty = true;
  }

  /** @type {string} */
  get zoomMode() {
    return this._zoomMode;
  }

  /** @type {string} */
  set zoomMode(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._zoomMode = value;
    this._dirty = true;
  }

  /** @type {number} */
  get cachedWorldWidth() {
    return this._cachedWorldWidth;
  }

  /** @type {number} */
  get cachedWorldHeight() {
    return this._cachedWorldHeight;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._zoom = 1;
    this._near = -1;
    this._far = 1;
    this._zoomMode = ZoomMode.PIXEL_PERFECT;
    this._cachedWorldWidth = 0;
    this._cachedWorldHeight = 0;
  }

  /**
   * @override
   */
  buildCameraMatrix(target, width, height) {
    const { _zoom, _zoomMode } = this;
    const scale = _zoom > 0 ? 1 / _zoom : 0;

    if (_zoomMode === ZoomMode.KEEP_ASPECT) {
      if (width >= height) {
        width = width / height;
        height = 1;
      } else {
        height = height / width;
        width = 1;
      }
    }

    const ww = this._cachedWorldWidth = width * scale;
    const wh = this._cachedWorldHeight = height * scale;
    const halfWidth = ww * 0.5;
    const halfHeight = wh * 0.5;

    mat4.ortho(
      target,
      -halfWidth,
      halfWidth,
      halfHeight,
      -halfHeight,
      this._near,
      this._far
    );
  }

  /**
   * @override
   */
  onPropertySerialize(name, value) {
    if (this.zoomOut > this.zoom ? name === 'zoom' : name === 'zoomOut') {
      return;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

}
