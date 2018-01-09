import Script from './Script';
import Camera2D from './Camera2D';
import { vec2, mat4 } from '../utils/gl-matrix';
import { isLocalPointInLocalBoundingBox } from '../utils';

const cachedLocalVec = vec2.create();
const cachedInverseMatrix = mat4.create();

/**
 * Entity listener for mouse input (good for buttons logic).
 *
 * @example
 * const component = new InputListener();
 * component.deserialize({ width: 100, height: 50, xOffset: 50, yOfffset: 25, camera: '/ui' });
 */
export default class InputListener extends Script {

  /**
   * Component factory.
   *
   * @return {InputListener} Component factory.
   */
  static factory() {
    return new InputListener();
  }

  /** @type {*} */
  static get propsTypes() {
    return {
      ...Script.propsTypes,
      width: 'number',
      height: 'number',
      xOffset: 'number',
      yOffset: 'number',
      camera: 'string_null'
    };
  }

  /** @type {number} */
  get width() {
    return this._width;
  }

  /** @type {number} */
  set width(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._width = value;
  }

  /** @type {number} */
  get height() {
    return this._height;
  }

  /** @type {number} */
  set height(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._height = value;
  }

  /** @type {number} */
  get xOffset() {
    return this._xOffset;
  }

  /** @type {number} */
  set xOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOffset = value;
  }

  /** @type {number} */
  get yOffset() {
    return this._yOffset;
  }

  /** @type {number} */
  set yOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOffset = value;
  }

  /** @type {string|null} */
  get camera() {
    return this._camera;
  }

  /** @type {string|null} */
  set camera(value) {
    if (!value) {
      this._camera = null;
      this._cameraEntity = null;
      this._cameraComponent = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const { entity } = this;

    this._camera = value;

    if (!!entity) {
      this._cameraEntity = entity.findEntity(value);

      if (!this._cameraEntity) {
        throw new Error(`Cannot find entity: ${value}`);
      }

      this._cameraComponent = this._cameraEntity.getComponent('Camera2D');
      if (!this._cameraComponent) {
        throw new Error(
          `Entity doe not have Camera2D component: ${this._cameraEntity.path}`
        );
      }
    }
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._width = 1;
    this._height = 1;
    this._xOffset = 0;
    this._yOffset = 0;
    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
    this._lastOver = false;
  }

  /**
   * @override
   */
  onAttach() {
    super.onAttach();

    this.camera = this.camera;
  }

  /**
   * @override
   */
  onMouseDown(unitVec, screenVec) {
    this._convertUnitToLocalCoords(cachedLocalVec, unitVec);

    if (this._isPointInBoundingBox(cachedLocalVec)) {
      this.entity.performAction('click', cachedLocalVec);
    }
  }

  /**
   * @override
   */
  onMouseUp(unitVec, screenVec) {
    this._convertUnitToLocalCoords(cachedLocalVec, unitVec);

    if (this._isPointInBoundingBox(cachedLocalVec)) {
      this.entity.performAction('click-release', cachedLocalVec);
    }
  }

  /**
   * @override
   */
  onMouseMove(unitVec, screenVec) {
    const { _lastOver } = this;
    this._convertUnitToLocalCoords(cachedLocalVec, unitVec);

    const over = this._isPointInBoundingBox(cachedLocalVec);
    if (over && !_lastOver) {
      this.entity.performAction('mouse-enter', cachedLocalVec);
    } else if (!over && _lastOver) {
      this.entity.performAction('mouse-leave', cachedLocalVec);
    }
    this._lastOver = over;
  }

  _isPointInBoundingBox(localVec) {
    const { _width, _height, _xOffset, _yOffset } = this;

    return isLocalPointInLocalBoundingBox(
      localVec,
      _width,
      _height,
      _xOffset,
      _yOffset
    );
  }

  _convertUnitToLocalCoords(out, unitVec) {
    const { _cameraComponent, entity } = this;
    if (!_cameraComponent) {
      return;
    }

    mat4.multiply(
      cachedInverseMatrix,
      entity.inverseTransform,
      _cameraComponent.inverseProjectionMatrix
    );

    vec2.transformMat4(out, unitVec, cachedInverseMatrix);
  }

}
