import Sprite from './Sprite';
import System from '../systems/System';

export default class AtlasSprite extends Sprite {

  static factory() {
    return new AtlasSprite();
  }

  static get propsTypes() {
    return {
      visible: Sprite.propsTypes.visible,
      shader: Sprite.propsTypes.shader,
      overrideUniforms: Sprite.propsTypes.overrideUniforms,
      overrideSamplers: Sprite.propsTypes.overrideSamplers,
      layers: Sprite.propsTypes.layers,
      xOffset: Sprite.propsTypes.xOffset,
      yOffset: Sprite.propsTypes.yOffset,
      xOrigin: Sprite.propsTypes.xOrigin,
      yOrigin: Sprite.propsTypes.yOrigin,
      color: Sprite.propsTypes.color,
      overrideBaseFiltering: Sprite.propsTypes.overrideBaseFiltering,
      atlas: 'asset(atlas?:.*$)',
      scale: 'number'
    };
  }

  get atlas() {
    return this._atlas;
  }

  set atlas(value) {
    if (!value || value === '') {
      this._atlas = value;
      this.overrideBaseTexture = '';
      this.width = 0;
      this.height = 0;
      this.frameTopLeft = [0, 0];
      this.frameBottomRight = [0, 0];
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

    const { size } = meta;
    const { x, y, w, h } = info.frame;
    const { _scale } = this;

    this._atlas = original;
    this.overrideBaseTexture = meta.image;
    this.width = w * _scale;
    this.height = h * _scale;
    this.frameTopLeft = [
      x / size.w,
      y / size.h
    ];
    this.frameBottomRight = [
      (x + w) / size.w,
      (y + h) / size.h
    ];
  }

  get scale() {
    return this._scale;
  }

  set scale(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._scale = value;
    this.atlas = this.atlas;
  }

  constructor() {
    super();

    this._atlas = null;
    this._scale = 1;
  }

}
