import Component from '../systems/EntitySystem/Component';
import System from '../systems/System';
import { mat4 } from '../utils/gl-matrix';

const cachedTempMat4 = mat4.create();
const cachedZeroMat4 = mat4.fromValues(
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
);

export default class Camera extends Component {

  static factory() {
    return new Camera();
  }

  static get propsTypes() {
    return {
      ignoreChildrenViews: 'boolean',
      captureEntity: 'string_null',
      renderTargetId: 'string_null',
      renderTargetWidth: 'integer',
      renderTargetHeight: 'integer',
      renderTargetScale: 'number',
      layer: 'string_null'
    };
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

  buildCameraMatrix(target, width, height) {
    throw new Error('Not implemented!');
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

  onView(gl, renderer, deltaTime) {
    const { entity, _ignoreChildrenViews } = this;
    if (!entity) {
      return _ignoreChildrenViews;
    }

    let { width, height } = renderer.canvas;
    const {
      _captureEntity,
      _projectionMatrix,
      _inverseProjectionMatrix,
      _renderTargetWidth,
      _renderTargetHeight,
      _renderTargetScale
    } = this;

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

    const target = !!_captureEntity
      ? entity.findEntity(_captureEntity)
      : entity;

    if (!!_captureEntity) {
      this.buildCameraMatrix(cachedTempMat4, width, height);
      mat4.multiply(_projectionMatrix, cachedTempMat4, entity.inverseTransform);
    } else {
      this.buildCameraMatrix(_projectionMatrix, width, height);
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