import VerticesRenderer from './VerticesRenderer';
import System from '../systems/System';
import { vec2, vec4 } from '../utils';

const cachedTemp1 = vec2.create();
const cachedTemp2 = vec2.create();
const cachedTemp3 = vec2.create();

export default class UiSprite extends VerticesRenderer {

  static factory() {
    return new UiSprite();
  }

  static get propsTypes() {
    return {
      visible: VerticesRenderer.propsTypes.visible,
      shader: VerticesRenderer.propsTypes.shader,
      overrideUniforms: VerticesRenderer.propsTypes.overrideUniforms,
      overrideSamplers: VerticesRenderer.propsTypes.overrideSamplers,
      layers: VerticesRenderer.propsTypes.layers,
      overrideBaseTexture: 'string_null',
      overrideBaseFiltering: 'enum(nearest, linear)',
      camera: 'string_null',
      width: 'number',
      height: 'number',
      widthAnchor: 'number',
      heightAnchor: 'number',
      xOrigin: 'number',
      yOrigin: 'number',
      topOffset: 'number',
      bottomOffset: 'number',
      leftOffset: 'number',
      rightOffset: 'number',
      leftOffset: 'number',
      topBorder: 'number',
      bottomBorder: 'number',
      leftBorder: 'number',
      rightBorder: 'number',
      atlas: 'asset(atlas?:.*$)',
      color: 'rgba'
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
    this._atlas = null;
    this._frame = null;
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

      this._cameraComponent = this._cameraEntity.getComponent('Camera2D');
      if (!this._cameraComponent) {
        throw new Error(
          `Entity doe not have Camera2D component: ${this._cameraEntity.path}`
        );
      }
    }

    this.recalculateSize();
  }

  get width() {
    return this._width;
  }

  set width(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._width = value;
    this.recalculateSize();
  }

  get height() {
    return this._height;
  }

  set height(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._height = value;
    this.recalculateSize();
  }

  get widthAnchor() {
    return this._widthAnchor;
  }

  set widthAnchor(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._widthAnchor = value;
    this.recalculateSize();
  }

  get heightAnchor() {
    return this._heightAnchor;
  }

  set heightAnchor(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._heightAnchor = value;
    this.recalculateSize();
  }

  get xOrigin() {
    return this._xOrigin;
  }

  set xOrigin(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._xOrigin = value;
    this.recalculateSize();
  }

  get yOrigin() {
    return this._yOrigin;
  }

  set yOrigin(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._yOrigin = value;
    this.recalculateSize();
  }

  get topOffset() {
    return this._topOffset;
  }

  set topOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._topOffset = value;
    this._rebuild = true;
  }

  get bottomOffset() {
    return this._bottomOffset;
  }

  set bottomOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._bottomOffset = value;
    this._rebuild = true;
  }

  get leftOffset() {
    return this._leftOffset;
  }

  set leftOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._leftOffset = value;
    this._rebuild = true;
  }

  get rightOffset() {
    return this._rightOffset;
  }

  set rightOffset(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._rightOffset = value;
    this._rebuild = true;
  }

  get topBorder() {
    return this._topBorder;
  }

  set topBorder(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._topBorder = Math.max(value, 0);
    this._rebuild = true;
  }

  get bottomBorder() {
    return this._bottomBorder;
  }

  set bottomBorder(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._bottomBorder = Math.max(value, 0);
    this._rebuild = true;
  }

  get leftBorder() {
    return this._leftBorder;
  }

  set leftBorder(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._leftBorder = Math.max(value, 0);
    this._rebuild = true;
  }

  get rightBorder() {
    return this._rightBorder;
  }

  set rightBorder(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._rightBorder = Math.max(value, 0);
    this._rebuild = true;
  }

  get atlas() {
    return this._atlas;
  }

  set atlas(value) {
    if (!value || value === '') {
      this._atlas = value;
      this.overrideBaseTexture = '';
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const found = value.indexOf(':');
    if (found < 0) {
      throw new Error('`value` does not conform rule of "atlas:frame" naming!');
    }

    const original = value;
    const frame = value.substr(found + 1);
    value = value.substr(0, found);

    const assets = System.get('AssetSystem');
    if (!assets) {
      throw new Error('There is no registered AssetSystem!');
    }

    const atlas = assets.get(`atlas://${value}`);
    if (!atlas) {
      throw new Error(`There is no atlas asset loaded: ${value}`);
    }

    const { meta, frames } = atlas.data.descriptor;
    if (!meta || !frames) {
      throw new Error(`There is either no metadata or frames in atlas: ${value}`);
    }

    const info = frames[frame];
    if (!info || !info.frame) {
      throw new Error(`There is no frame information in atlas: ${value} (${frame})`);
    }

    this.overrideBaseTexture = meta.image;
    this._atlas = original;
    this._frame = info.frame;
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

  get cachedWidth() {
    return this._cachedWidth;
  }

  get cachedHeight() {
    return this._cachedHeight;
  }

  constructor() {
    super();

    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
    this._width = 0;
    this._height = 0;
    this._widthAnchor = 1;
    this._heightAnchor = 1;
    this._xOrigin = 0;
    this._yOrigin = 0;
    this._topOffset = 0;
    this._bottomOffset = 0;
    this._leftOffset = 0;
    this._rightOffset = 0;
    this._topBorder = 0;
    this._bottomBorder = 0;
    this._leftBorder = 0;
    this._rightBorder = 0;
    this._atlas = null;
    this._color = vec4.fromValues(1, 1, 1, 1);
    this._frame = null;
    this._cachedWidth = 0;
    this._cachedHeight = 0;
    this._rebuild = true;
  }

  dispose() {
    super.dispose();

    this._camera = null;
    this._cameraEntity = null;
    this._cameraComponent = null;
    this._atlas = null;
    this._frame = null;
  }

  recalculateSize() {
    this._cachedWidth = 0;
    this._cachedHeight = 0;

    const { entity, _width, _height, _widthAnchor, _heightAnchor } = this;
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

    this._cachedWidth = (_width < 0 ? pw : _width) * _widthAnchor;
    this._cachedHeight = (_height < 0 ? ph : _height) * _heightAnchor;
    this._rebuild = true;
  }

  ensureVertices(renderer) {
    if (!this._rebuild) {
      return;
    }

    const meta = renderer.getTextureMeta(this.overrideBaseTexture);
    if (!meta) {
      throw new Error(
        `Cannot find texture meta data: ${this.overrideBaseTexture}`
      );
    }

    const {
      _cachedWidth,
      _cachedHeight,
      _xOrigin,
      _yOrigin,
      _topOffset,
      _bottomOffset,
      _leftOffset,
      _rightOffset,
      _topBorder,
      _bottomBorder,
      _leftBorder,
      _rightBorder,
      _frame
    } = this;
    const ox = _cachedWidth * _xOrigin;
    const oy = _cachedHeight * _yOrigin;
    const p0c = _leftOffset - ox;
    const p1c = p0c + _leftBorder;
    const p3c = p0c + _cachedWidth - _rightOffset - _leftOffset;
    const p2c = p3c - _rightBorder;
    const p0r = _topOffset - oy;
    const p1r = p0r + _topBorder;
    const p3r = p0r + _cachedHeight - _bottomOffset - _topOffset;
    const p2r = p3r - _bottomBorder;

    if (!_frame) {
      const t0c = 0;
      const t1c = _leftBorder / meta.width;
      const t2c = 1 - _rightBorder / meta.width;
      const t3c = 1;
      const t0r = 0;
      const t1r = _topBorder / meta.width;
      const t2r = 1 - _bottomBorder / meta.width;
      const t3r = 1;

      this.vertices = [
        p0c, p0r, t0c, t0r,
        p1c, p0r, t1c, t0r,
        p2c, p0r, t2c, t0r,
        p3c, p0r, t3c, t0r,

        p0c, p1r, t0c, t1r,
        p1c, p1r, t1c, t1r,
        p2c, p1r, t2c, t1r,
        p3c, p1r, t3c, t1r,

        p0c, p2r, t0c, t2r,
        p1c, p2r, t1c, t2r,
        p2c, p2r, t2c, t2r,
        p3c, p2r, t3c, t2r,

        p0c, p3r, t0c, t3r,
        p1c, p3r, t1c, t3r,
        p2c, p3r, t2c, t3r,
        p3c, p3r, t3c, t3r
      ];
    } else {
      const { x, y, w, h } = _frame;
      const t0c = x / meta.width;
      const t1c = t0c + _leftBorder / meta.width;
      const t3c = (x + w) / meta.width;
      const t2c = t3c - _rightBorder / meta.width;
      const t0r = y / meta.height;
      const t1r = t0r + _topBorder / meta.height;
      const t3r = (y + h) / meta.height;
      const t2r = t3r - _bottomBorder / meta.height;

      this.vertices = [
        p0c, p0r, t0c, t0r,
        p1c, p0r, t1c, t0r,
        p2c, p0r, t2c, t0r,
        p3c, p0r, t3c, t0r,

        p0c, p1r, t0c, t1r,
        p1c, p1r, t1c, t1r,
        p2c, p1r, t2c, t1r,
        p3c, p1r, t3c, t1r,

        p0c, p2r, t0c, t2r,
        p1c, p2r, t1c, t2r,
        p2c, p2r, t2c, t2r,
        p3c, p2r, t3c, t2r,

        p0c, p3r, t0c, t3r,
        p1c, p3r, t1c, t3r,
        p2c, p3r, t2c, t3r,
        p3c, p3r, t3c, t3r
      ];
    }

    this.indices = [
       0, 1, 5, 5, 4, 0,
       1, 2, 6, 6, 5, 1,
       2, 3, 7, 7, 6, 2,
       4, 5, 9, 9, 8, 4,
       5, 6,10,10, 9, 5,
       6, 7,11,11,10, 6,
       8, 9,13,13,12, 8,
       9,10,14,14,13, 9,
      10,11,15,15,14,10
    ];

    this._rebuild = false;
    // 0, 1, 2, 3,
    // 4, 5, 6, 7,
    // 8, 9,10,11,
    //12,13,14,15
  }

  onAttach() {
    super.onAttach();

    const { overrideUniforms } = this;
    overrideUniforms.uColor = this._color;
    this.overrideUniforms = overrideUniforms;
    this.camera = this.camera;
  }

  onAction(name, ...args) {
    if (name === 'camera-changed') {
      return this.onCameraChanged(...args);
    } else {
      return super.onAction(name, ...args);
    }
  }

  onPropertySerialize(name, value) {
    if (name === 'overrideSamplers') {
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

  onRender(gl, renderer, deltaTime, layer) {
    this.ensureVertices(renderer);
    super.onRender(gl, renderer, deltaTime, layer);
  }

  onCameraChanged(camera) {
    if (camera === this._cameraComponent
      && (this._width < 0 || this._height < 0)
    ) {
      this.recalculateSize();
    }
  }

}
