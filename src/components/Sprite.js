import RectangleRenderer from './RectangleRenderer';
import { vec2 } from '../utils/gl-matrix';

export default class Sprite extends RectangleRenderer {

  static factory() {
    return new Sprite();
  }

  static get propsTypes() {
    return {
      visible: RectangleRenderer.propsTypes.visible,
      shader: RectangleRenderer.propsTypes.shader,
      overrideUniforms: RectangleRenderer.propsTypes.overrideUniforms,
      overrideSamplers: RectangleRenderer.propsTypes.overrideSamplers,
      layers: RectangleRenderer.propsTypes.layers,
      width: RectangleRenderer.propsTypes.width,
      height: RectangleRenderer.propsTypes.height,
      xOffset: RectangleRenderer.propsTypes.xOffset,
      yOffset: RectangleRenderer.propsTypes.yOffset,
      xOrigin: RectangleRenderer.propsTypes.xOrigin,
      yOrigin: RectangleRenderer.propsTypes.yOrigin,
      color: RectangleRenderer.propsTypes.color,
      overrideBaseTexture: 'string_null',
      overrideBaseFiltering: 'enum(nearest, linear)',
      frameTopLeft: 'vec2',
      frameBottomRight: 'vec2'
    };
  }

  get overrideBaseTexture() {
    const { overrideSamplers } = this;
    const sampler = overrideSamplers.sBase;

    return !!sampler
      ? sampler.texture
      : null;
  }

  set overrideBaseTexture(value) {
    const { overrideSamplers } = this;

    if (!value) {
      delete overrideSamplers.sBase;
      this.overrideSamplers = overrideSamplers;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const sampler = overrideSamplers['sBase'];

    if (!sampler) {
      overrideSamplers.sBase = {
        texture: value,
        filtering: 'linear'
      };
    } else {
      sampler.texture = value;
    }
    this.overrideSamplers = overrideSamplers;
  }

  get overrideBaseFiltering() {
    const { overrideSamplers } = this;
    const sampler = overrideSamplers.get('sBase');

    return !!sampler
      ? sampler.filtering
      : null;
  }

  set overrideBaseFiltering(value) {
    const { overrideSamplers } = this;

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const sampler = overrideSamplers.sBase;

    if (!sampler) {
      overrideSamplers.sBase = {
        texture: '',
        filtering: value
      };
    } else {
      sampler.filtering = value;
    }
    this.overrideSamplers = overrideSamplers;
  }

  get frameTopLeft() {
    return this._frameTopLeft;
  }

  set frameTopLeft(value) {
    if (!(value instanceof Array)) {
      throw new Error('`value` is not type of Array!');
    }
    if (value.length < 2) {
      throw new Error('`value` must have at least 2 elements!');
    }

    vec2.copy(this._frameTopLeft, value);
    this._rebuild = true;
  }

  get frameBottomRight() {
    return this._frameBottomRight;
  }

  set frameBottomRight(value) {
    if (!(value instanceof Array)) {
      throw new Error('`value` is not type of Array!');
    }
    if (value.length < 2) {
      throw new Error('`value` must have at least 2 elements!');
    }

    vec2.copy(this._frameBottomRight, value);
    this._rebuild = true;
  }

  constructor() {
    super();

    this._frameTopLeft = vec2.fromValues(0, 0);
    this._frameBottomRight = vec2.fromValues(1, 1);
  }

  onPropertySerialize(name, value) {
    if (name === 'frameTopLeft' || name === 'frameBottomRight') {
      return [ ...value ];
    } else if (name === 'overrideSamplers') {
      const result = super.onPropertySerialize(name, value);

      if (!result) {
        return null;
      }

      delete result.sBase;
      return Object.keys(result).length > 0 ? result : null;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  ensureVertices(renderer) {
    if (!this._rebuild) {
      return;
    }

    let {
      _width,
      _height
    } = this;
    const {
      _xOffset,
      _yOffset,
      _xOrigin,
      _yOrigin,
      _frameTopLeft,
      _frameBottomRight
    } = this;
    if (_width < 0 || _height < 0) {
      const meta = renderer.getTextureMeta(this.overrideBaseTexture);
      if (_width < 0) {
        _width = !!meta ? meta.width : 0;
      }
      if (_height < 0) {
        _height = !!meta ? meta.height : 0;
      }
    }
    const xo = -_xOffset - (_xOrigin * _width);
    const yo = -_yOffset - (_yOrigin * _height);

    this.vertices = [
      xo,           yo,           _frameTopLeft[0],     _frameTopLeft[1],
      _width + xo,  yo,           _frameBottomRight[0], _frameTopLeft[1],
      _width + xo,  _height + yo, _frameBottomRight[0], _frameBottomRight[1],
      xo,           _height + yo, _frameTopLeft[0],     _frameBottomRight[1]
    ];
    this.indices = [ 0, 1, 2, 2, 3, 0 ];
    this._rebuild = false;
  }

}
