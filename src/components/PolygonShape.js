import Shape from './Shape';
import { vec2 } from '../utils/gl-matrix';

const cachedVec2 = vec2.create();

export default class PolygonShape extends Shape {

  static factory() {
    return new PolygonShape();
  }

  static get propsTypes() {
    return {
      ...Shape.propsTypes,
      vertices: 'array(number)'
    };
  }

  get vertices() {
    return this._vertices;
  }

  set vertices(value) {
    if (!value) {
      throw new Error('`value` cannot be null!');
    }

    if (value instanceof Array) {
      value = new Float32Array(value);
    }

    if (!(value instanceof Float32Array)) {
      throw new Error('`value` is not type of either Array or Float32Array!');
    }

    if (value.length < 4) {
      throw new Error('`value` items count is less than 4!');
    }
    if (value.length % 2 !== 0) {
      throw new Error('`value` items count is not multiple of 2!');
    }

    this._vertices = value;
  }

  constructor() {
    super();

    this._vertices = null;
  }

  dispose() {
    super.dispose();

    this._vertices = null;
  }

  containsPoint(globalPoint, layer = null) {
    if (!globalPoint) {
      throw new Error('`globalPoint` cannot be null!');
    }
    if (globalPoint.length < 2) {
      throw new Error('`globalPoint` is not a 2 component vector!');
    }

    const { inverseTransform } = this.entity;
    const { _vertices } = this;
    if (!_vertices || !this.acceptsLayer(layer)) {
      return false;
    }

    vec2.transformMat4(cachedVec2, globalPoint, inverseTransform);
    for (var i = 0, c = _vertices.length; i < c; i += 2) {
      const vax = _vertices[i % c];
      const vay = _vertices[(i + 1) % c];
      const vbx = _vertices[(i + 2) % c];
      const vby = _vertices[(i + 3) % c];
      const bx = -(vby - vay);
      const by = vbx - vax;
      const dx = cachedVec2[0] - vax;
      const dy = cachedVec2[1] - vay;
      if (dx * bx + dy * by < 0.0) {
        return false;
      }
    }
    return true;
  }

  onPropertySerialize(name, value) {
    if (name === 'vertices') {
      if (!value) {
        return;
      }

      return [ ...value ];
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

}
