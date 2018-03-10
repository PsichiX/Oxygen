import Component from '../systems/EntitySystem/Component';
import { vec2 } from '../utils';

const cachedTemp1 = vec2.create();
const cachedTemp2 = vec2.create();
const cachedTemp3 = vec2.create();

export default class UiLayout extends Component {

  static factory() {
    return new UiLayout();
  }

  static get propsTypes() {
    return {
      camera: 'string_null',
      xAnchor: 'number',
      yAnchor: 'number',
      xOffset: 'number',
      yOffset: 'number'
    };
  }

  get camera() {
    return this._camera;
  }

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

      this._dirty = true;
      this._cameraComponent = this._cameraEntity.getComponent('Camera2D');
      if (!this._cameraComponent) {
        throw new Error(
          `Entity doe not have Camera2D component: ${this._cameraEntity.path}`
        );
      }
    }
  }

  get xAnchor() {
    return this._xAnchor;
  }

  set xAnchor(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xAnchor = value;
    this._dirty = true;
  }

  get yAnchor() {
    return this._yAnchor;
  }

  set yAnchor(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yAnchor = value;
    this._dirty = true;
  }

  get xOffset() {
    return this._xOffset;
  }

  set xOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOffset = value;
    this._dirty = true;
  }

  get yOffset() {
    return this._yOffset;
  }

  set yOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOffset = value;
    this._dirty = true;
  }

  constructor() {
    super();

    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
    this._xAnchor = 0;
    this._yAnchor = 0;
    this._xOffset = 0;
    this._yOffset = 0;
    this._dirty = true;
    this._triggeringAction = false;
  }

  dispose() {
    super.dispose();

    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
  }

  layout(triggerAction = true) {
    const { entity, _xAnchor, _yAnchor, _xOffset, _yOffset } = this;
    if (!entity) {
      return;
    }

    const { parent } = entity;
    if (!parent) {
      return;
    }

    const sprite = parent.getComponent('UiSprite');
    let pw = 0;
    let ph = 0;
    if (!!sprite) {
      pw = sprite.cachedWidth;
      ph = sprite.cachedHeight;
    } else {
      const { _cameraComponent } = this;

      if (!!_cameraComponent) {
        vec2.set(cachedTemp1, -1, -1);
        vec2.transformMat4(
          cachedTemp2,
          cachedTemp1,
          _cameraComponent.inverseProjectionMatrix
        );
        vec2.set(cachedTemp1, 1, 1);
        vec2.transformMat4(
          cachedTemp3,
          cachedTemp1,
          _cameraComponent.inverseProjectionMatrix
        );
        pw = Math.abs(cachedTemp3[0] - cachedTemp2[0]);
        ph = Math.abs(cachedTemp3[1] - cachedTemp2[1]);
      }
    }
    entity.setPosition(pw * _xAnchor + _xOffset, ph * _yAnchor + _yOffset);
    if (!!triggerAction) {
      this._triggeringAction = true;
      entity.performAction('ui-layout');
      this._triggeringAction = false;
    }
  }

  onAttach() {
    this.camera = this.camera;

    this.layout();
  }

  onAction(name, ...args) {
    if (name === 'update') {
      return this.onUpdate(...args);
    } else if (name === 'ui-layout') {
      return this.onLayout();
    } else if (name === 'camera-changed') {
      return this.onCameraChanged(...args);
    } else {
      return super.onAction(name, ...args);
    }
  }

  onUpdate(deltaTime) {
    if (this._dirty) {
      this.layout();
      this._dirty = false;
    }
  }

  onLayout() {
    if (!this._triggeringAction) {
      this.layout(false);
    }
  }

  onCameraChanged(camera) {
    if (camera === this._cameraComponent) {
      this.layout(false);
    }
  }

}
