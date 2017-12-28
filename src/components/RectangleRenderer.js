import VerticesRenderer from './VerticesRenderer';
import { vec4 } from '../utils/gl-matrix';
import { stringToRGBA } from '../utils';

export default class RectangleRenderer extends VerticesRenderer {

  static factory() {
    return new RectangleRenderer();
  }

  static get propsTypes() {
    return {
      visible: VerticesRenderer.propsTypes.visible,
      shader: VerticesRenderer.propsTypes.shader,
      overrideUniforms: VerticesRenderer.propsTypes.overrideUniforms,
      overrideSamplers: VerticesRenderer.propsTypes.overrideSamplers,
      layers: VerticesRenderer.propsTypes.layers,
      width: 'number',
      height: 'number',
      xOffset: 'number',
      yOffset: 'number',
      xOrigin: 'number',
      yOrigin: 'number',
      color: 'rgba'
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
    this._rebuild = true;
  }

  get height() {
    return this._height;
  }

  set height(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._height = value;
    this._rebuild = true;
  }

  get xOffset() {
    return this._xOffset;
  }

  set xOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOffset = value;
    this._rebuild = true;
  }

  get yOffset() {
    return this._yOffset;
  }

  set yOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOffset = value;
    this._rebuild = true;
  }

  get xOrigin() {
    return this._xOrigin;
  }

  set xOrigin(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOrigin = value;
    this._rebuild = true;
  }

  get yOrigin() {
    return this._yOrigin;
  }

  set yOrigin(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOrigin = value;
    this._rebuild = true;
  }

  get color() {
    return this._color;
  }

  set color(value) {
    if (typeof value === 'string') {
      value = stringToRGBA(value);
    }
    if (!(value instanceof Array) && !(value instanceof Float32Array)) {
      throw new Error('`value` is not type of either Array or Float32Array!');
    }
    if (value.length < 4) {
      throw new Error('`value` array must have at least 4 items!');
    }

    vec4.copy(this._color, value);
    const { overrideUniforms } = this;
    overrideUniforms.uColor = this._color;
    this.overrideUniforms = overrideUniforms;
  }

  constructor() {
    super();

    this._width = 1;
    this._height = 1;
    this._xOffset = 0;
    this._yOffset = 0;
    this._xOrigin = 0;
    this._yOrigin = 0;
    this._color = vec4.fromValues(1, 1, 1, 1);
    this._rebuild = true;
  }

  onAttach() {
    const { overrideUniforms } = this;
    overrideUniforms.uColor = this._color;
    this.overrideUniforms = overrideUniforms;
  }

  onRender(gl, renderer, deltaTime, layer) {
    this.ensureVertices();
    super.onRender(gl, renderer, deltaTime, layer);
  }

  onPropertySerialize(name, value) {
    if (name === 'color') {
      return [ ...value ];
    } else if (name === 'overrideUniforms') {
      const result = super.onPropertySerialize(name, value);

      if (!result) {
        return null;
      }

      delete result.uColor;
      return Object.keys(result).length > 0 ? result : null;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  ensureVertices() {
    if (!this._rebuild) {
      return;
    }

    const { _width, _height, _xOffset, _yOffset, _xOrigin, _yOrigin } = this;
    const xo = -_xOffset - (_xOrigin * _width);
    const yo = -_yOffset - (_yOrigin * _height);

    this.vertices = [
      xo,           yo,
      _width + xo,  yo,
      _width + xo,  _height + yo,
      xo,           _height + yo
    ];
    this.indices = [ 0, 1, 2, 2, 3, 0 ];
    this._rebuild = false;
  }

}
