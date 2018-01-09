import VerticesRenderer from './VerticesRenderer';
import parser from '../utils/particleSystemParser';

// base vertex layout:
// float: life;
// float: timeScale;
// vec2: vertex position;
// vec2: tex coord;

const processors = new Map();

/**
 * Particles renderer.
 *
 * @example
 * const component = new Particles();
 * component.deserialize({ shader: 'shaders/particles.json', processor: 'particles/fire.ps' });
 */
export default class Particles extends VerticesRenderer {

  /**
   * Component factory.
   *
   * @return {Particles} Component instance.
   */
  static factory() {
    return new Particles();
  }

  /** @type {*} */
  static get propsTypes() {
    return {
      visible: VerticesRenderer.propsTypes.visible,
      shader: VerticesRenderer.propsTypes.shader,
      overrideUniforms: VerticesRenderer.propsTypes.overrideUniforms,
      overrideSamplers: VerticesRenderer.propsTypes.overrideSamplers,
      layers: VerticesRenderer.propsTypes.layers,
      capacity: 'integer',
      processor: 'string',
      overrideParams: 'map(number)',
      constantBurst: 'boolean',
      constantBurstDelay: 'number',
      constantBurstCount: 'integer'
    };
  }

  /**
   * Register new particles processor.
   *
   * @param {string}	id - Processor id.
   * @param {string}	contents - Processor code.
   *
   * @example
   * const code = 'attribute x: 0;\nattribute y: 1;\nprogram:\ny -= deltaTime * life;';
   * Particles.registerProcessor('fire', code);
   */
  static registerProcessor(id, contents) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (typeof contents !== 'string') {
      throw new Error('`contents` is not type of String!');
    }
    if (processors.has(id)) {
      throw new Error(`There is already registered processor: ${id}`);
    }

    const p = parser.parse(contents);
    const { attributes, params, code } = p;
    for (const key in attributes) {
      if (key === 'life' ||
        key === 'timeScale' ||
        key === 'deltaTime' ||
        key === 'ps_View' ||
        key === 'this'
      ) {
        throw new Error(`Cannot use attribute name: ${key}`);
      }
    }
    for (const key in params) {
      if (key === 'life' ||
        key === 'timeScale' ||
        key === 'deltaTime' ||
        key === 'ps_View' ||
        key === 'this'
      ) {
        throw new Error(`Cannot use param name: ${key}`);
      }
    }

    let size = 0;
    let processor = 'const life=ps_View[0];const timeScale=ps_View[1];if(life<=0)return false;';
    for (const key in attributes) {
      const offset = attributes[key];
      size = Math.max(size, offset + 1);
      processor += `let ${key}=ps_View[${offset + 6}];`;
    }
    const vsize = size + 6;
    processor += code + `;ps_View[0]=ps_View[${vsize}]=ps_View[${vsize * 2}]=ps_View[${vsize * 3}]=life-timeScale*deltaTime;`;
    for (const key in attributes) {
      const offset = attributes[key];
      processor += `ps_View[${offset + 6}]=ps_View[${offset + 6 + vsize}]=ps_View[${offset + 6 + vsize * 2}]=ps_View[${offset + 6 + vsize * 3}]=${key};`;
    }
    processor += 'return true;';

    processors.set(id, {
      size,
      params,
      processor: new Function('ps_View', 'deltaTime', processor)
    });
  }

  /**
   * Unregister existing processor.
   *
   * @param {string}	id - processor id
   *
   * @example
   * Particles.unregisterProcessor('fire');
   */
  static unregisterProcessor(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!processors.has(id)) {
      throw new Error(`There is no registered processor: ${id}`);
    }

    processors.delete(id);
  }

  /** @type {number} */
  get capacity() {
    return this._capacity;
  }

  /** @type {number} */
  set capacity(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._capacity = value | 0;
    this._rebuildParticlesData();
  }

  /** @type {string|null} */
  get processor() {
    return this._processor;
  }

  /** @type {string|null} */
  set processor(value) {
    if (!value) {
      this._processor = null;
      this._processorAction = null;
      this._viewSize = 0;
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }
    if (!processors.has(value)) {
      throw new Error(`There is no registered processor: ${value}`);
    }

    const { _overrideParams } = this;
    const p = processors.get(value);
    const { size, params, processor } = p;
    const pms = {};
    for (const key in params) {
      pms[key] = params[key] || 0;
    }
    for (const key in _overrideParams) {
      pms[key] = _overrideParams[key] || 0;
    }

    this._processor = value;
    this._processorAction = processor;
    this._viewSize = size;
    this._params = pms;
    this._rebuildParticlesData();
  }

  /** @type {*} */
  get overrideParams() {
    return { ...this._overrideParams };
  }

  /** @type {*} */
  set overrideParams(value) {
    this._overrideParams = {};

    for (const key in value) {
      const v = value[key];
      if (typeof v !== 'number') {
        throw new Error(`\`value[${key}]\` is not type of Number!`);
      }

      this._overrideParams[key] = v;
    }

    this.processor = this.processor;
  }

  /** @type {Function|null} */
  get burstGenerator() {
    return this._burstGenerator;
  }

  /** @type {Function|null} */
  set burstGenerator(value) {
    if (!!value && !(value instanceof Function)) {
      throw new Error('`value` is not type of Function!');
    }

    this._burstGenerator = value;
  }

  /** @type {boolean} */
  get constantBurst() {
    return this._constantBurst;
  }

  /** @type {boolean} */
  set constantBurst(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._constantBurst = value;
    this._constantBurstTimeout = 0;
  }

  /** @type {number} */
  get constantBurstDelay() {
    return this._constantBurstDelay;
  }

  /** @type {number} */
  set constantBurstDelay(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._constantBurstDelay = value;
  }

  /** @type {number} */
  get constantBurstCount() {
    return this._constantBurstCount;
  }

  /** @type {number} */
  set constantBurstCount(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._constantBurstCount = value | 0;
  }

  /** @type {number} */
  get activeCount() {
    return this._active;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._capacity = 0;
    this._views = null;
    this._processor = null;
    this._processorAction = null;
    this._viewSize = 0;
    this._overrideParams = null;
    this._burstGenerator = null;
    this._constantBurst = false;
    this._constantBurstDelay = 1;
    this._constantBurstCount = -1;
    this._constantBurstTimeout = 0;
    this._params = null;
    this._cursor = 0;
    this._active = 0;
    this._emitParticle = this.emitParticle.bind(this);

    this._rebuildParticlesData();
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    this._views = null;
    this._processor = null;
    this._processorAction = null;
    this._overrideParams = null;
    this._params = null;
  }

  /**
   * Emit single particle.
   *
   * @param {number}	life - Initial life value.
   * @param {number}	timeScale - Particle life-cycle time scale.
   * @param {number}	size - Particle size.
   * @param {*}	args - Particle attributes.
   *
   * @return {boolean} True if emitted, false otherwise.
   *
   * @example
   * component.emitParticle(1, 0.5, 10);
   */
  emitParticle(life, timeScale, size, ...args) {
    if (typeof life !== 'number') {
      throw new Error('`life` is not type of Number!');
    }
    if (typeof timeScale !== 'number') {
      throw new Error('`timeScale` is not type of Number!');
    }

    const index = this._findFreeIndex();
    if (index < 0) {
      return false;
    }
    ++this._active;

    const { _viewSize } = this;
    const hs = size * 0.5;
    const vs = _viewSize + 6;
    const vs2 = vs + vs;
    const vs3 = vs2 + vs;
    const view = this._views[index];

    view[0] = view[vs] = view[vs2] = view[vs3] = life;
    view[1] = view[vs + 1] = view[vs2 + 1] = view[vs3 + 1] = timeScale;
    view[2] = -hs;
    view[3] = -hs;
    view[4] = 0;
    view[5] = 0;
    view[vs + 2] = hs;
    view[vs + 3] = -hs;
    view[vs + 4] = 1;
    view[vs + 5] = 0;
    view[vs2 + 2] = hs;
    view[vs2 + 3] = hs;
    view[vs2 + 4] = 1;
    view[vs2 + 5] = 1;
    view[vs3 + 2] = -hs;
    view[vs3 + 3] = hs;
    view[vs3 + 4] = 0;
    view[vs3 + 5] = 1;

    let i = 6;
    for (const arg of args) {
      view[i] = view[vs + i] = view[vs2 + i] = view[vs3 + i] = arg;
      ++i;
    }
    return true;
  }

  /**
   * Emit burst of particles using burst generator function.
   *
   * @param {number}	count - Number of particles to emit.
   * @param {*}	args - Particles attributes.
   *
   * @example
   * component.emitBurst(100);
   */
  emitBurst(count, ...args) {
    const { _burstGenerator } = this;
    if (!_burstGenerator) {
      throw new Error('Burst generator is not provided!');
    }

    if (count < 0) {
      count = this._capacity;
    }
    while (count-- > 0) {
      _burstGenerator.call(this, this._emitParticle, ...args);
    }
  }

  /**
   * Set particles parameter.
   *
   * @param {string}	id - Parameter id.
   * @param {number}	value - Parameter value.
   *
   * @example
   * component.setParam('alpha', 0.5);
   */
  setParam(id, value) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _params } = this;
    if (!(id in _params)) {
      throw new Error(`Unknown param: ${id}`);
    }

    this._params[id] = value;
  }

  /**
   * @override
   */
  onAction(name, ...args) {
    if (name === 'update') {
      return this.onUpdate(...args);
    } else {
      return super.onAction(name, ...args);
    }
  }

  /**
   * @override
   */
  onUpdate(deltaTime) {
    deltaTime *= 0.001;

    if (this._constantBurst) {
      if (this._constantBurstTimeout <= 0) {
        this.emitBurst(this._constantBurstCount);
        this._constantBurstTimeout = this._constantBurstDelay;
      }

      this._constantBurstTimeout -= deltaTime;
    }

    const { _processorAction, _views } = this;
    if (!!_processorAction) {
      let active = 0;

      for (const view of _views) {
        if (this._processorAction.call(this._params, view, deltaTime)) {
          ++active;
        }
      }

      this._active = active;
      this.reuploadData();
    }
  }

  _rebuildParticlesData() {
    const { _capacity, _viewSize } = this;
    const vsize = _viewSize + 6;
    const vertices = this.vertices = new Float32Array(vsize * 4 * _capacity);
    const views = this._views = [];
    let offset = 0;
    let index = 0;

    const indices = [];
    for (let i = 0; i < _capacity; ++i) {
      views.push(vertices.subarray(offset, offset + vsize * 4));
      indices.push(
        index,
        index + 1,
        index + 2,
        index + 2,
        index + 3,
        index
      );

      offset += vsize * 4;
      index += 4;
    }

    this.indices = indices;
    this.verticesUsage = VerticesRenderer.BufferUsage.DYNAMIC;
    this._cursor = 0;
  }

  _findFreeIndex() {
    const { _capacity, _active, _views } = this;
    if (_active >= _capacity) {
      return -1;
    }

    let view = null;
    for (let i = 0; i < _capacity; ++i) {
      view = _views[this._cursor];

      if (view[0] <= 0) {
        return this._cursor;
      }

      ++this._cursor;
      if (this._cursor >= _capacity) {
        this._cursor = 0;
      }
    }

    return -1;
  }

}
