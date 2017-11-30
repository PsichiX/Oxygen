import Component from '../systems/EntitySystem/Component';
import System from '../systems/System';
import { mat4 } from '../utils/gl-matrix';

const ZoomMode = {
  PIXEL_PERFECT: 'pixel-perfect',
  KEEP_ASPECT: 'keep-aspect'
};

const cachedTempMat4 = mat4.create();
const cachedZeroMat4 = mat4.fromValues(
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

export default class Camera2D extends Component {

  static factory() {
    return new Camera2D();
  }

  static get propsTypes() {
    return {
      ignoreChildrenViews: 'boolean',
      zoom: 'number',
      zoomOut: 'number',
      near: 'number',
      far: 'number',
      zoomMode: 'enum(pixel-perfect, keep-aspect)',
      captureEntity: 'string_null',
      renderTargetId: 'string_null',
      renderTargetWidth: 'integer',
      renderTargetHeight: 'integer',
      renderTargetScale: 'number',
      layer: 'string_null'
    };
  }

  static get ZoomMode() {
    return ZoomMode;
  }

  get ignoreChildrenViews() {
    return this._ignoreChildrenViews;
  }

  set ignoreChildrenViews(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._ignoreChildrenViews = value;
  }

  get zoom() {
    return this._zoom;
  }

  set zoom(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._zoom = value;
    this._dirty = true;
  }

  get zoomOut() {
    const { _zoom } = this;
    return _zoom !== 0 ? 1 / _zoom : 1;
  }

  set zoomOut(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._zoom = value !== 0 ? 1 / value : 1;
    this._dirty = true;
  }

  get near() {
    return this._near;
  }

  set near(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._near = value;
    this._dirty = true;
  }

  get far() {
    return this._far;
  }

  set far(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._far = value;
    this._dirty = true;
  }

  get zoomMode() {
    return this._zoomMode;
  }

  set zoomMode(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._zoomMode = value;
    this._dirty = true;
  }

  get captureEntity() {
    return this._captureEntity;
  }

  set captureEntity(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._captureEntity = value;
    this._dirty = true;
  }

  get renderTargetId() {
    return this._renderTargetId;
  }

  set renderTargetId(value) {
    if (!!value && typeof value !== 'string') {
      throw new Error('`value` is not type of String');
    }

    this._renderTargetId = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  get renderTargetWidth() {
    return this._renderTargetWidth;
  }

  set renderTargetWidth(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetWidth = value | 0;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  get renderTargetHeight() {
    return this._renderTargetHeight;
  }

  set renderTargetHeight(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetHeight = value | 0;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  get renderTargetScale() {
    return this._renderTargetScale;
  }

  set renderTargetScale(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number');
    }

    this._renderTargetScale = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  get renderTargetFloat() {
    return this._renderTargetFloat;
  }

  set renderTargetFloat(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean');
    }

    this._renderTargetFloat = value;
    this._renderTargetDirty = true;
    this._dirty = true;
  }

  get layer() {
    return this._layer;
  }

  set layer(value) {
    if (!!value && typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._layer = value;
  }

  get projectionMatrix() {
    return this._projectionMatrix;
  }

  get inverseProjectionMatrix() {
    return this._inverseProjectionMatrix;
  }

  constructor() {
    super();

    this._ignoreChildrenViews = false;
    this._zoom = 1;
    this._near = -1;
    this._far = 1;
    this._zoomMode = ZoomMode.PIXEL_PERFECT;
    this._captureEntity = null;
    this._projectionMatrix = mat4.create();
    this._inverseProjectionMatrix = mat4.create();
    mat4.copy(this._projectionMatrix, cachedZeroMat4);
    mat4.copy(this._inverseProjectionMatrix, cachedZeroMat4);
    this._renderTargetId = null;
    this._renderTargetIdUsed = null;
    this._renderTargetWidth = 0;
    this._renderTargetHeight = 0;
    this._renderTargetScale = 1;
    this._renderTargetFloat = false;
    this._renderTargetDirty = false;
    this._renderTargetRenderer = null;
    this._layer = null;
    this._dirty = true;
    this._onResize = this.onResize.bind(this);
  }

  dispose() {
    super.dispose();

    const { _renderTargetIdUsed, _renderTargetRenderer } = this;

    if (!!_renderTargetIdUsed && !!_renderTargetRenderer) {
      _renderTargetRenderer.unregisterRenderTarget(_renderTargetIdUsed);
      this._renderTargetIdUsed = null;
    }
  }

  onAttach() {
    const { RenderSystem } = System.systems;
    if (!RenderSystem) {
      throw new Error('There is no registered RenderSystem!');
    }

    RenderSystem.events.on('resize', this._onResize);
  }

  onDetach() {
    const { RenderSystem } = System.systems;
    if (!RenderSystem) {
      throw new Error('There is no registered RenderSystem!');
    }

    RenderSystem.events.off('resize', this._onResize);
  }

  onAction(name, ...args) {
    if (name === 'view') {
      return this.onView(...args);
    }
  }

  onPropertySerialize(name, value) {
    if (this.zoomOut > this.zoom ? name === 'zoom' : name === 'zoomOut') {
      return;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  onView(gl, renderer, deltaTime) {
    const { entity, _ignoreChildrenViews } = this;
    if (!entity) {
      return _ignoreChildrenViews;
    }

    let { width, height } = renderer.canvas;
    const {
      _zoom,
      _zoomMode,
      _captureEntity,
      _projectionMatrix,
      _inverseProjectionMatrix,
      _renderTargetWidth,
      _renderTargetHeight,
      _renderTargetScale
    } = this;
    const scale = _zoom > 0 ? 1 / _zoom : 0;

    if (_renderTargetWidth > 0) {
      width = _renderTargetWidth;
    }
    if (_renderTargetHeight > 0) {
      height = _renderTargetHeight;
    }

    if ((width | 0) === 0 || (height | 0) === 0) {
      mat4.copy(_projectionMatrix, cachedZeroMat4);
      mat4.copy(_inverseProjectionMatrix, cachedZeroMat4);
      mat4.copy(renderer.projectionMatrix, cachedZeroMat4);
      mat4.copy(renderer.inverseProjectionMatrix, cachedZeroMat4);

      if (this._dirty) {
        this._dirty = false;
        target.performAction('camera-changed', this);
      }

      return _ignoreChildrenViews;
    }

    if (this._renderTargetDirty) {
      if (!!this._renderTargetId) {
        this._renderTargetIdUsed = this._renderTargetId;
        this._renderTargetRenderer = renderer;
        renderer.registerRenderTarget(
          this._renderTargetIdUsed,
          width * _renderTargetScale,
          height * _renderTargetScale,
          this._renderTargetFloat
        );
      } else {
        renderer.unregisterRenderTarget(this._renderTargetIdUsed);
        this._renderTargetIdUsed = null;
      }
      this._renderTargetDirty = false;
    }

    if (_zoomMode === ZoomMode.KEEP_ASPECT) {
      if (width >= height) {
        width = width / height;
        height = 1;
      } else {
        height = height / width;
        width = 1;
      }
    }

    const halfWidth = width * 0.5 * scale;
    const halfHeight = height * 0.5 * scale;
    const target = !!_captureEntity
      ? entity.findEntity(_captureEntity)
      : entity;

    if (!!_captureEntity) {
      mat4.ortho(
        cachedTempMat4,
        -halfWidth,
        halfWidth,
        halfHeight,
        -halfHeight,
        this._near,
        this._far
      );
      mat4.multiply(_projectionMatrix, cachedTempMat4, entity.inverseTransform);
    } else {
      mat4.ortho(
        _projectionMatrix,
        -halfWidth,
        halfWidth,
        halfHeight,
        -halfHeight,
        this._near,
        this._far
      );
    }

    mat4.copy(renderer.projectionMatrix, _projectionMatrix);
    mat4.invert(_inverseProjectionMatrix, _projectionMatrix);

    if (!!this._renderTargetIdUsed) {
      renderer.enableRenderTarget(this._renderTargetIdUsed);
    }

    if (!!this._layer) {
      target.performAction('render-layer', gl, renderer, deltaTime, this._layer);
    } else {
      target.performAction('render', gl, renderer, deltaTime, null);
    }

    if (!!this._renderTargetIdUsed) {
      renderer.disableRenderTarget();
    }

    if (this._dirty) {
      this._dirty = false;
      target.performAction('camera-changed', this);
    }

    return _ignoreChildrenViews;
  }

  onResize(width, height) {
    const { _renderTargetWidth, _renderTargetHeight } = this;
    if (_renderTargetWidth <= 0 || _renderTargetHeight <= 0) {
      this._renderTargetDirty = true;
      this._dirty = true;
    }
  }

}
