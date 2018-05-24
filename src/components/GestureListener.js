import Script from './Script';
import Camera2D from './Camera2D';
import Shape from './Shape';
import { vec2 } from '../utils/gl-matrix';

const cachedGlobalVec = vec2.create();

/**
 * Entity listener for mouse input (good for buttons logic).
 *
 * @example
 * const component = new GestureListener();
 * component.deserialize({ camera: '/ui' });
 */
export default class GestureListener extends Script {

  /**
   * Component factory.
   *
   * @return {GestureListener} Component factory.
   */
  static factory() {
    return new GestureListener();
  }

  /** @type {*} */
  static get propsTypes() {
    return {
      ...Script.propsTypes,
      camera: 'string_null',
      layer: 'string_null'
    };
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

  /** @type {string|null} */
  get layer() {
    return this._layer;
  }

  /** @type {string|null} */
  set layer(value) {
    if (!value) {
      this._layer = null;
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._layer = value;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
    this._layer = null;
    this._lastOver = false;
    this._shape = null;
  }

  dispose() {
    super.dispose();

    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
    this._layer = null;
    this._shape = null;
  }

  /**
   * @override
   */
  onAttach() {
    super.onAttach();

    this.camera = this.camera;
    this._shape = this.entity.getComponent(Shape);
    if (!this._shape) {
      throw new Error(
        `There is no Shape component in entity: ${this.entity.path}`
      );
    }
  }

  /**
   * @override
   */
  onMouseDown(unitVec, screenVec) {
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click', cachedGlobalVec);
    }
  }

  /**
   * @override
   */
  onMouseUp(unitVec, screenVec) {
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click-release', cachedGlobalVec);
    }
  }

  /**
   * @override
   */
  onMouseMove(unitVec, screenVec) {
    const { _lastOver } = this;
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    const over = this._containsPoint(cachedGlobalVec);
    if (over && !_lastOver) {
      this.entity.performAction('mouse-enter', cachedGlobalVec);
    } else if (!over && _lastOver) {
      this.entity.performAction('mouse-leave', cachedGlobalVec);
    }
    this._lastOver = over;
  }

  /**
   * @override
   */
  onTouchDown(unitVec, screenVec) {
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click', cachedGlobalVec);
    }
  }

  /**
   * @override
   */
  onTouchUp(unitVec, screenVec) {
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click-release', cachedGlobalVec);
    }
  }

  _containsPoint(globalVec) {
    const { _shape } = this;
    return !!_shape ? _shape.containsPoint(globalVec, this._layer) : false;
  }

  _convertUnitToGlobalCoords(out, unitVec) {
    const { _cameraComponent } = this;
    if (!!_cameraComponent) {
      vec2.transformMat4(
        out,
        unitVec,
        _cameraComponent.inverseProjectionMatrix
      );
    }
  }

}
