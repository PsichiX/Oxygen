import Shape from './Shape';
import { vec2 } from '../utils/gl-matrix';

const cachedVec2 = vec2.create();

export default class RectangleShape extends Shape {

  static factory() {
    return new RectangleShape();
  }

  static get propsTypes() {
    return {
      ...Shape.propsTypes,
      width: 'number',
      height: 'number',
      xOffset: 'number',
      yOffset: 'number',
      xOrigin: 'number',
      yOrigin: 'number'
    };
  }

  get width() {
    return this._width;
  }

  set width(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._width = value;
  }

  get height() {
    return this._height;
  }

  set height(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._height = value;
  }

  get xOffset() {
    return this._xOffset;
  }

  set xOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOffset = value;
  }

  get yOffset() {
    return this._yOffset;
  }

  set yOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOffset = value;
  }

  get xOrigin() {
    return this._xOrigin;
  }

  set xOrigin(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOrigin = value;
  }

  get yOrigin() {
    return this._yOrigin;
  }

  set yOrigin(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOrigin = value;
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

    const { _width, _height, _xOffset, _yOffset, _xOrigin, _yOrigin } = this;
    const xo = -_xOffset - (_xOrigin * _width);
    const yo = -_yOffset - (_yOrigin * _height);
    vec2.transformMat4(cachedVec2, globalPoint, inverseTransform);
    const [ x, y ] = cachedVec2;

    return x >= xo && y >= yo && x < xo + _width && y < yo + _height;
  }

}
