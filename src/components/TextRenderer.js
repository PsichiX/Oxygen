import VerticesRenderer from './VerticesRenderer';
import System from '../systems/System';
import { vec4 } from '../utils/gl-matrix';
import { stringToRGBA } from '../utils';

export default class TextRenderer extends VerticesRenderer {

  static factory() {
    return new TextRenderer();
  }

  static get propsTypes() {
    return {
      visible: VerticesRenderer.propsTypes.visible,
      shader: VerticesRenderer.propsTypes.shader,
      overrideUniforms: VerticesRenderer.propsTypes.overrideUniforms,
      overrideSamplers: VerticesRenderer.propsTypes.overrideSamplers,
      layers: VerticesRenderer.propsTypes.layers,
      text: 'string',
      font: 'asset(font)',
      color: 'rgba',
      colorOutline: 'rgba',
      halign: 'enum(left, center, right)',
      valign: 'enum(top, middle, bottom)',
      filtering: 'enum(nearest, linear)'
    };
  }

  get text() {
    return this._text;
  }

  set text(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._text = value;
    this._rebuild = true;
  }

  get font() {
    return this._font;
  }

  set font(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const assets = System.get('AssetSystem');
    if (!assets) {
      throw new Error('There is no registered AssetSystem!');
    }

    const font = assets.get(`font://${value}`);
    if (!font) {
      throw new Error(`There is no font asset loaded: ${value}`);
    }

    this._font = value;
    this._fontData = font.data.descriptor;
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

  get colorOutline() {
    return this._colorOutline;
  }

  set colorOutline(value) {
    if (typeof value === 'string') {
      value = stringToRGBA(value);
    }
    if (!(value instanceof Array) && !(value instanceof Float32Array)) {
      throw new Error('`value` is not type of either Array or Float32Array!');
    }
    if (value.length < 4) {
      throw new Error('`value` array must have at least 4 items!');
    }

    vec4.copy(this._colorOutline, value);
    const { overrideUniforms } = this;
    overrideUniforms.uColorOutline = this._colorOutline;
    this.overrideUniforms = overrideUniforms;
  }

  get halign() {
    return this._halign;
  }

  set halign(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._halign = value;
    this._rebuild = true;
  }

  get valign() {
    return this._valign;
  }

  set valign(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._valign = value;
    this._rebuild = true;
  }

  get filtering() {
    return this._filtering;
  }

  set filtering(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._filtering = value;

    const { _fontData } = this;
    if (!_fontData) {
      return;
    }

    const { pages } = _fontData;
    const samplers = {};

    for (let i = 0, c = pages.size; i < c; ++i) {
      samplers[`sPage${i}`] = {
        texture: pages.get(i).file,
        filtering: value
      };
    }

    this.overrideSamplers = samplers;
  }

  constructor() {
    super();

    this._text = null;
    this._font = null;
    this._color = vec4.fromValues(1, 1, 1, 1);
    this._colorOutline = vec4.fromValues(1, 1, 1, 1);
    this._halign = 'left';
    this._valign = 'top';
    this._filtering = 'linear';
    this._fontData = null;
    this._rebuild = true;
  }

  dispose() {
    super.dispose();

    this._text = null;
    this._font = null;
    this._fontData = null;
  }

  onAttach() {
    const { overrideUniforms } = this;
    overrideUniforms.uColor = this._color;
    overrideUniforms.uColorOutline = this._colorOutline;
    this.overrideUniforms = overrideUniforms;
  }

  onRender(gl, renderer, deltaTime, layer) {
    this.ensureVertices(renderer);

    const { _text, _fontData } = this;
    if (!!_text && _text !== '' && !!_fontData) {
      super.onRender(gl, renderer, deltaTime);
    }
  }

  onPropertySerialize(name, value) {
    if (name === 'color' || name === 'colorOutline') {
      return [ ...value ];
    } else if (name === 'overrideUniforms') {
      const result = super.onPropertySerialize(name, value);

      if (!result) {
        return null;
      }

      delete result.uColor;
      delete result.uColorOutline;
      return Object.keys(result).length > 0 ? result : null;
    } else if (name === 'overrideSamplers') {
      const result = super.onPropertySerialize(name, value);

      if (!result) {
        return null;
      }

      for (const key in result) {
        if (key.indexOf('sPage') === 0) {
          delete result[key];
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  ensureVertices(renderer) {
    if (!this._rebuild) {
      return;
    }

    this._rebuild = false;

    const { _text, _fontData, _halign, _valign, _filtering } = this;
    if (!_text || _text === '' || !_fontData) {
      this.vertices = [0];
      this.indices = [0, 0, 0];
      return;
    }

    const { common, pages, chars } = _fontData;
    const { lineHeight, scaleW, scaleH } = common;
    const vertices = [];
    const indices = [];
    const samplers = {};

    for (let i = 0, c = pages.size; i < c; ++i) {
      samplers[`sPage${i}`] = {
        texture: pages.get(i).file,
        filtering: _filtering
      };
    }

    let x = 0;
    let y = 0;
    let lineStartPos = 0;
    for (let i = 0, c = _text.length, pos = 0; i < c; ++i) {
      const code = _text.charCodeAt(i);
      if (code === 10 || code === 13) {
        const { length } = vertices;

        if (_halign === 'right') {
          for (let j = lineStartPos; j < length; j += 5) {
            vertices[j] -= x;
          }
        } else if (_halign === 'center') {
          for (let j = lineStartPos; j < length; j += 5) {
            vertices[j] -= x * 0.5;
          }
        }

        x = 0;
        y += lineHeight;
        lineStartPos = vertices.length;
        continue;
      }

      const char = chars.get(code);
      if (!char) {
        continue;
      }

      const xs = x + char.xoffset;
      const ys = y + char.yoffset;
      const xe = xs + char.width;
      const ye = ys + char.height;
      const txs = char.x / scaleW;
      const tys = char.y / scaleH;
      const txe = (char.x + char.width) / scaleW;
      const tye = (char.y + char.height) / scaleH;

      vertices.push(
        xs, ys, txs, tys, char.page | 0,
        xe, ys, txe, tys, char.page | 0,
        xe, ye, txe, tye, char.page | 0,
        xs, ye, txs, tye, char.page | 0
      );
      indices.push(
        pos, pos + 1, pos + 2,
        pos + 2, pos + 3, pos
      );
      pos += 4;
      x += char.xadvance;
    }

    const { length } = vertices;

    if (_halign === 'right') {
      for (let j = lineStartPos; j < length; j += 5) {
        vertices[j] -= x;
      }
    } else if (_halign === 'center') {
      for (let j = lineStartPos; j < length; j += 5) {
        vertices[j] -= x * 0.5;
      }
    }

    if (_valign === 'bottom') {
      for (let j = 1; j < length; j += 5) {
        vertices[j] -= y + lineHeight;
      }
    } else if (_valign === 'middle') {
      for (let j = 1; j < length; j += 5) {
        vertices[j] -= (y + lineHeight) * 0.5;
      }
    }

    this.vertices = vertices;
    this.indices = indices;
    this.overrideSamplers = samplers;
  }

}
