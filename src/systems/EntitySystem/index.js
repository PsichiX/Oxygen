import System from '../System';
import Entity from './Entity';
import Component from './Component';
import { mat4 } from '../../utils/gl-matrix';

export {
  Entity,
  Component
};

const identityMatrix = mat4.create();

/**
 * Manages entities on scene.
 *
 * @example
 * const system = new EntitySystem();
 * class Hello extends Component { constructor() { this.hello = null; } onAction(name) { console.log(name); } }
 * system.registerComponent('Hello', () => new Hello());
 * system.root = system.buildEntity({ name: 'hey', components: { Hello: { hello: 'world' } } });
 * system.updateTransforms();
 * system.performAction('hi');
 */
export default class EntitySystem extends System {

  /** @type {Entity|null} */
  get root() {
    return this._root;
  }

  /** @type {Entity|null} */
  set root(value) {
    if (!!value && !(value instanceof Entity)) {
      throw new Error('`value` is not type of Entity!');
    }

    const { _root } = this;

    if (!!_root) {
      _root.dispose();
    }

    this._root = value;
    if (!!value) {
      value._setOwner(this);
    }
  }

  /** @type {boolean} */
  get triggerEvents() {
    return this._triggerEvents;
  }

  /**
   * Constructor.
   *
   * @param {boolean}	triggerEvents - Tells if system should trigger events.
   */
  constructor(triggerEvents = true) {
    super();

    this._root = new Entity();
    this._components = new Map();
    this._triggerEvents = !!triggerEvents;
  }

  /**
   * Destructor (dispose internal resources).
   *
   * @example
   * system.dispose();
   * system = null;
   */
  dispose() {
    const { _root } = this;

    if (!!_root) {
      _root.dispose();
    }

    this._components.clear();

    this._root = null;
  }

  /**
   * Register new component factory.
   *
   * @param {string}	typename - Component type name.
   * @param {Function}	componentConstructor - Component factory function (it should return new instance of component).
   *
   * @example
   * class MyComponent extends Component { static factory() { return new MyComponent(); } }
   * system.registerComponent('MyComponent', MyComponent.factory);
   */
  registerComponent(typename, componentConstructor) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }
    if (!(componentConstructor instanceof Function)) {
      throw new Error('`componentConstructor` is not type of Function!');
    }

    const { _components } = this;

    if (_components.has(typename)) {
      throw new Error(`There is already registered component: ${typename}`);
    }

    _components.set(typename, componentConstructor);
  }

  /**
   * Unregister component factory.
   *
   * @param {string}	typename - Component type name.
   *
   * @example
   * system.unregisterComponent('MyComponent');
   */
  unregisterComponent(typename) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }
    if (!this._components.delete(typename)) {
      throw new Error(`There is no registered component: ${typename}`);
    }
  }

  /**
   * Create component instnace by it's type name and apply properties to it.
   *
   * @param {string}	typename - Component type name.
   * @param {*}	properties - Object with key-value pairs of component properties.
   *
   * @return {Component} Component instance.
   *
   * @example
   * class Hello extends Component { constructor() { this.hello = null; } }
   * system.registerComponent('Hello', () => new Hello());
   * const hello = system.createComponent('Hello', { hello: 'world' });
   * console.log(hello.hello);
   */
  createComponent(typename, properties) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }

    const factory = this._components.get(typename);
    if (!factory) {
      throw new Error(`There is no registered component: ${typename}`);
    }

    const component = factory();
    if (!component) {
      throw new Error(`Cannot create proper component: ${typename}`);
    }

    if (!!properties) {
      for (const name in properties) {
        component.onPropertySetup(name, properties[name]);
      }
    }

    return component;
  }

  /**
   * Build entity from JSON data.
   *
   * @param {*}	data - JSON representation of serialized entity data.
   *
   * @return {Entity} Entity instance.
   *
   * @example
   * class Hello extends Component { constructor() { this.hello = null; } }
   * system.registerComponent('Hello', () => new Hello());
   * const entity = system.buildEntity({ name: 'hey', components: { Hello: { hello: 'world' } } });
   * const hello = entity.getComponent('Hello');
   * console.log(hello.hello);
   */
  buildEntity(data) {
    if (!data) {
      throw new Error('`data` cannot be null!');
    }

    const { components, children } = data;
    const result = new Entity();
    const options = {};

    if ('name' in data) {
      options.name = data.name;
    }
    if ('tag' in data) {
      options.tag = data.tag;
    }
    if ('active' in data) {
      options.active = data.active;
    }
    if ('meta' in data) {
      options.meta = data.meta;
    }
    if ('transform' in data) {
      options.transform = data.transform;
    }
    result.deserialize(options);

    if (!!components) {
      for (const name in components) {
        result.attachComponent(name, this.createComponent(name, components[name]));
      }
    }

    if (!!children) {
      for (const meta of children.values()) {
        this.buildEntity(meta).parent = result;
      }
    }

    return result;
  }

  /**
   * Perform action on root entity.
   * Actions are events that are performed by entity components and are passed down to it's children.
   *
   * @param {string}	name - action name.
   * @param {*}	args - Action arguments.
   *
   * @example
   * class Hi extends Component { onAction(name, what) { if (name === 'hi') console.log(what); } }
   * system.registerComponent('Hi', () => new Hi());
   * system.root = system.buildEntity({ components: { Hi: {} } });
   * system.performAction('hi', 'hello');
   */
  performAction(name, ...args) {
    const { _root } = this;

    if (!!_root) {
      _root.performAction(name, ...args);
    }
  }

  /**
   * Update entities transforms.
   */
  updateTransforms() {
    const { _root } = this;

    if (!!_root) {
      _root.updateTransforms(identityMatrix);
    }
  }

}
