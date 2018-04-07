import Shape from './Shape';
import { vec2 } from '../utils/gl-matrix';

const cachedVec2 = vec2.create();

export default class CircleShape extends Shape {

  static factory() {
    return new CircleShape();
  }

  static get propsTypes() {
    return {
      ...Shape.propsTypes,
      radius: 'number'
    };
  }

  get radius() {
    return this._radius;
  }

  set radius(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._radius = value;
  }

  constructor() {
    super();

    this._radius = 0;
  }

  containsPoint(globalPoint, layer = null) {
    if (!globalPoint) {
      throw new Error('`globalPoint` cannot be null!');
    }
    if (globalPoint.length < 2) {
      throw new Error('`globalPoint` is not a 2 component vector!');
    }

    const { inverseTransform } = this.entity;
    if (!this.acceptsLayer(layer)) {
      return false;
    }

    vec2.transformMat4(cachedVec2, globalPoint, inverseTransform);
    return vec2.distance(cachedVec2, globalPoint) <= this._radius;
  }

}
