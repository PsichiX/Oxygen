import Component from '../systems/EntitySystem/Component';
import { mat4 } from '../utils/gl-matrix';

const RenderMode = {
  TRIANGLES: 'triangles',
  LINES: 'lines',
  POINTS: 'points'
};

const BufferUsage = {
  STATIC: 'static',
  DYNAMIC: 'dynamic',
  STREAM: 'stream'
}

const DirtyMode = {
  NONE: 0,
  SUB: 1,
  ALL: 2
};

export default class VerticesRenderer extends Component {

  static factory() {
    return new VerticesRenderer();
  }

  static get propsTypes() {
    return {
      visible: 'boolean',
      shader: 'asset(shader)',
      vertices: 'array(number)',
      indices: 'array(integer)',
      verticesUsage: 'enum(static, dynamic, stream)',
      indicesUsage: 'enum(static, dynamic, stream)',
      overrideUniforms: 'uniforms',
      overrideSamplers: 'samplers',
      renderMode: 'enum(triangles, lines, points)',
      layers: 'array(string)'
    };
  }

  static get RenderMode() {
    return RenderMode;
  }

  static get BufferUsage() {
    return BufferUsage;
  }

  get visible() {
    return this._visible;
  }

  set visible(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._visible = value;
  }

  get shader() {
    return this._shader;
  }

  set shader(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._shader = value;
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

    const { _vertices } = this;
    this._dirty = true;
    if (this._dirtyMode !== DirtyMode.ALL) {
      this._dirtyMode = !_vertices || _vertices.length != value.length
        ? DirtyMode.ALL
        : DirtyMode.SUB;
    }
    this._vertices = value;
  }

  get indices() {
    return this._indices;
  }

  set indices(value) {
    if (!value) {
      throw new Error('`value` cannot be null!');
    }

    if (value instanceof Array) {
      value = new Uint16Array(value);
    }

    if (!(value instanceof Uint16Array)) {
      throw new Error('`value` is not type of either Array or Uint16Array!');
    }

    const { _indices } = this;
    this._dirty = true;
    if (this._dirtyMode !== DirtyMode.ALL) {
      this._dirtyMode = !_indices || _indices.length != value.length
        ? DirtyMode.ALL
        : DirtyMode.SUB;
    }
    this._indices = value;
  }

  get verticesUsage() {
    return this._verticesUsage;
  }

  set verticesUsage(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._dirty = true;
    this._dirtyMode = DirtyMode.ALL;
    this._verticesUsage = value;
  }

  get indicesUsage() {
    return this._indicesUsage;
  }

  set indicesUsage(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._dirty = true;
    this._dirtyMode = DirtyMode.ALL;
    this._indicesUsage = value;
  }

  get overrideUniforms() {
    const result = {};
    for (const [key, value] of this._overrideUniforms) {
      result[key] = value;
    }

    return result;
  }

  set overrideUniforms(value) {
    const { _overrideUniforms } = this;

    _overrideUniforms.clear();

    if (!value) {
      return;
    }

    for (const name in value) {
      _overrideUniforms.set(name, value[name]);
    }
  }

  get overrideSamplers() {
    const result = {};
    for (const [key, value] of this._overrideSamplers) {
      result[key] = value;
    }

    return result;
  }

  set overrideSamplers(value) {
    const { _overrideSamplers } = this;

    _overrideSamplers.clear();

    if (!value) {
      return;
    }

    for (const name in value) {
      _overrideSamplers.set(name, value[name]);
    }
  }

  get renderMode() {
    return this._renderMode;
  }

  set renderMode(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._renderMode = value;
  }

  get layers() {
    return [ ...this._layers ];
  }

  set layers(value) {
    if (!value) {
      this._layers = null;
      return;
    }

    if (!(value instanceof Array)) {
      throw new Error('`value` is not type of Array!');
    }
    for (let i = 0, c = value.length; i < c; ++i) {
      if (typeof value[i] !== 'string') {
        throw new Error(`\`value\` item #${i} is not type of String!`);
      }
    }

    this._layers = [ ...value ];
  }

  constructor() {
    super();

    this._visible = true;
    this._context = null;
    this._vertexBuffer = null;
    this._indexBuffer = null;
    this._shader = null;
    this._vertices = null;
    this._indices = null;
    this._verticesUsage = BufferUsage.STATIC;
    this._indicesUsage = BufferUsage.STATIC;
    this._overrideUniforms = new Map();
    this._overrideSamplers = new Map();
    this._renderMode = RenderMode.TRIANGLES;
    this._layers = null;
    this._verticesChunksToUpdate = [];
    this._indicesChunksToUpdate = [];
    this._dirty = true;
    this._dirtyMode = DirtyMode.ALL;
  }

  dispose() {
    const { _context, _vertexBuffer, _indexBuffer } = this;

    if (!!_context) {
      if (!!_vertexBuffer) {
        _context.deleteBuffer(_vertexBuffer);
      }
      if (!!_indexBuffer) {
        _context.deleteBuffer(_indexBuffer);
      }
    }

    this._overrideUniforms.clear();
    this._overrideSamplers.clear();

    this._context = null;
    this._vertexBuffer = null;
    this._indexBuffer = null;
    this._shader = null;
    this._vertices = null;
    this._indices = null;
    this._overrideUniforms = null;
    this._overrideSamplers = null;
    this._renderMode = null;
    this._layers = null;
    this._verticesChunksToUpdate = null;
    this._indicesChunksToUpdate = null;
  }

  updateVerticesChunk(data, offset, size = 0) {
    if (!data) {
      throw new Error('`data` cannot be null!');
    }

    const { _vertices } = this;
    if (!_vertices) {
      throw new Error('Cannot update non-existing vertices!');
    }

    if (data instanceof Array || data instanceof Float32Array) {
      if (offset < 0 || offset + data.length > _vertices.length) {
        throw new Error('Trying to update chunk exceeding vertices bounds!');
      }

      _vertices.set(data, offset);
      this._verticesChunksToUpdate.push(offset, data.length);
    } else {
      throw new Error('`data` is not type of either Array or Float32Array!');
    }
  }

  updateIndicesChunk(data, offset, size = 0) {
    if (!data) {
      throw new Error('`data` cannot be null!');
    }

    const { _indices } = this;
    if (!_indices) {
      throw new Error('Cannot update non-existing indices!');
    }

    if (data instanceof Array || data instanceof Uint16Array) {
      if (offset < 0 || offset + data.length > _indices.length) {
        throw new Error('Trying to update chunk exceeding indices bounds!');
      }

      _indices.set(data, offset);
      this._indicesChunksToUpdate.push(offset, data.length);
    } else {
      throw new Error('`data` is not type of either Array or Float32Array!');
    }
  }

  reuploadData() {
    this._dirty = true;
    if (this._dirtyMode !== DirtyMode.ALL) {
      this._dirtyMode = DirtyMode.SUB;
    }
  }

  onAction(name, ...args) {
    if (name === 'render') {
      return this.onRender(...args);
    } else if (name === 'render-layer') {
      return this.onRenderLayer(...args);
    } else if (name === 'preview') {
      return this.onPreview(...args);
    }
  }

  onPropertySerialize(name, value) {
    if (name === 'vertices' || name === 'indices') {
      if (!value) {
        return;
      }

      return [ ...value ];
    } else if (name === 'overrideUniforms' || name === 'overrideSamplers') {
      if (value.size === 0) {
        return;
      }

      const result = {};

      for (const [key, value] of value.entries()) {
        result[key] = value;
      }
      return result;
    } else if (name === 'layers') {
      return !value ? [] : [ ...value ];
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  onRender(gl, renderer, deltaTime, layer) {
    const {
      _visible,
      _shader,
      _vertices,
      _indices,
      _verticesUsage,
      _indicesUsage,
      _overrideUniforms,
      _overrideSamplers,
      _renderMode,
      _verticesChunksToUpdate,
      _indicesChunksToUpdate
    } = this;

    if (!_visible || !_renderMode) {
      return;
    }

    if (!_shader) {
      console.warn('Trying to render VerticesRenderer without shader!');
      return;
    }
    if (!_vertices || _vertices.length <= 0) {
      console.warn('Trying to render VerticesRenderer without vertices!');
      return;
    }
    if (!_indices || _indices.length <= 0) {
      console.warn('Trying to render VerticesRenderer without indices!');
      return;
    }

    this._ensureState(gl);
    mat4.copy(renderer.modelMatrix, this.entity.transform);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

    if (this._dirty) {
      this._dirty = false;
      this._verticesChunksToUpdate = [];
      this._indicesChunksToUpdate = [];

      if (this._dirtyMode === DirtyMode.ALL) {
        let verticesUsage = gl.STATIC_DRAW;
        if (_verticesUsage === BufferUsage.DYNAMIC) {
          verticesUsage = gl.DYNAMIC_DRAW;
        } else if (_verticesUsage === BufferUsage.STREAM) {
          verticesUsage = gl.STREAM_DRAW;
        }

        let indicesUsage = gl.STATIC_DRAW;
        if (_indicesUsage === BufferUsage.DYNAMIC) {
          indicesUsage = gl.DYNAMIC_DRAW;
        } else if (_indicesUsage === BufferUsage.STREAM) {
          indicesUsage = gl.STREAM_DRAW;
        }

        gl.bufferData(gl.ARRAY_BUFFER, _vertices, verticesUsage);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, _indices, indicesUsage);
      } else if (this._dirtyMode === DirtyMode.SUB) {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, _vertices);
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, _indices);
      }

      this._dirtyMode = DirtyMode.NONE;
    }

    if (_verticesChunksToUpdate.length > 0) {
      for (let i = 0, c = _verticesChunksToUpdate.length; i < c; i += 2) {
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          _verticesChunksToUpdate[i],
          _vertices.subarray(
            _verticesChunksToUpdate[i],
            _verticesChunksToUpdate[i + 1]
          )
        );
      }

      this._verticesChunksToUpdate = [];
    }

    if (_indicesChunksToUpdate.length > 0) {
      for (let i = 0, c = _indicesChunksToUpdate.length; i < c; i += 2) {
        gl.bufferSubData(
          gl.ELEMENT_ARRAY_BUFFER,
          _indicesChunksToUpdate[i],
          _indices.subarray(
            _indicesChunksToUpdate[i],
            _indicesChunksToUpdate[i + 1]
          )
        );
      }

      this._indicesChunksToUpdate = [];
    }

    renderer.enableShader(_shader);

    if (_overrideUniforms.size > 0) {
      for (const [ name, value ] of _overrideUniforms) {
        renderer.overrideShaderUniform(name, value);
      }
    }

    if (_overrideSamplers.size > 0) {
      for (const [ name, { texture, filtering } ] of _overrideSamplers) {
        renderer.overrideShaderSampler(name, texture, filtering);
      }
    }

    gl.drawElements(
      gl[_renderMode.toUpperCase()],
      _indices.length,
      gl.UNSIGNED_SHORT,
      0
    );

    renderer.disableShader();
  }

  onRenderLayer(gl, renderer, deltaTime, layer) {
    const { _layers } = this;
    if (!!layer &&
        !!_layers &&
        _layers.length > 0 &&
        _layers.indexOf(layer) < 0
    ) {
      return;
    }

    this.onRender(gl, renderer, deltaTime, layer);
  }

  onPreview(gl, renderer, deltaTime) {
    this.onRender(gl, renderer, deltaTime, null);
  }

  _ensureState(gl) {
    this._context = gl;

    if (!this._vertexBuffer) {
      this._vertexBuffer = gl.createBuffer();
      this._dirty = true;
      this._dirtyMode = DirtyMode.ALL;
    }

    if (!this._indexBuffer) {
      this._indexBuffer = gl.createBuffer();
      this._dirty = true;
      this._dirtyMode = DirtyMode.ALL;
    }
  }

}
