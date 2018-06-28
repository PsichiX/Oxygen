import Script from './Script';
import Camera2D from './Camera2D';
import Shape from './Shape';
import { vec2 } from '../utils/gl-matrix';
import { propsEnumStringify } from '../utils';

const cachedGlobalVec = vec2.create();

const ActionFlags = {
  NONE: 0,
  CLICK: 1 << 0,
  CLICK_RELEASE: 1 << 1,
  MOUSE_ENTER_LEAVE: 1 << 2,
  ALL: 0xF,
};

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
      layer: 'string_null',
      actions: `flags(${propsEnumStringify(ActionFlags)})`,
    };
  }

  static get ActionFlags() {
    return ActionFlags;
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

  get actions() {
    return this._actions;
  }

  set actions(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._actions = value | 0;
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
    this._actions = ActionFlags.NONE;
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
  onPropertySetup(name, value) {
    if (name === 'actions') {
      if (!(value instanceof Array)) {
        throw new Error('`value` is not type of Array!');
      }

      let flags = ActionFlags.NONE;
      for (let i = 0, c = value.length; i < c; ++i) {
        const flag = value[i];
        if (flag === 'click') {
          flags |= ActionFlags.CLICK;
        } else if (flag === 'click-release') {
          flags |= ActionFlags.CLICK_RELEASE;
        } else if (flag === 'mouse-enter-leave') {
          flags |= ActionFlags.MOUSE_ENTER_LEAVE;
        } else if (flag === 'all') {
          flags |= ActionFlags.ALL;
        }
      }

      this._actions = flags;
    } else {
      super.onPropertySetup(name, value);
    }
  }

  /**
   * @override
   */
  onPropertySerialize(name, value) {
    if (name === 'actions') {
      if ((value & ActionFlags.ALL) === ActionFlags.ALL) {
        return [ 'all' ];
      }

      const result = [];
      if ((value & ActionFlags.CLICK) !== 0) {
        result.push('click');
      }
      if ((value & ActionFlags.CLICK_RELEASE) !== 0) {
        result.push('click-release');
      }
      if ((value & ActionFlags.MOUSE_ENTER_LEAVE) !== 0) {
        result.push('mouse-enter-leave');
      }
      return result;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  /**
   * @override
   */
  onMouseDown(unitVec, screenVec) {
    if ((this._actions & ActionFlags.CLICK) === 0) {
      return;
    }
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click', cachedGlobalVec);
    }
  }

  /**
   * @override
   */
  onMouseUp(unitVec, screenVec) {
    if ((this._actions & ActionFlags.CLICK_RELEASE) === 0) {
      return;
    }
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click-release', cachedGlobalVec);
    }
  }

  /**
   * @override
   */
  onMouseMove(unitVec, screenVec) {
    if ((this._actions & ActionFlags.MOUSE_ENTER_LEAVE) === 0) {
      return;
    }
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
    if ((this._actions & ActionFlags.CLICK) === 0) {
      return;
    }
    this._convertUnitToGlobalCoords(cachedGlobalVec, unitVec);

    if (this._containsPoint(cachedGlobalVec)) {
      this.entity.performAction('click', cachedGlobalVec);
    }
  }

  /**
   * @override
   */
  onTouchUp(unitVec, screenVec) {
    if ((this._actions & ActionFlags.CLICK_RELEASE) === 0) {
      return;
    }
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
        _cameraComponent.inverseProjectionMatrix,
      );
    }
  }

}
