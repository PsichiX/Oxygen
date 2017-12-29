import System from '../System';
import Entity from './Entity';
import Component from './Component';
import { mat4 } from '../../utils/gl-matrix';

export {
  Entity,
  Component
};

const identityMatrix = mat4.create();

export default class EntitySystem extends System {

  get root() {
    return this._root;
  }

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

  get triggerEvents() {
    return this._triggerEvents;
  }

  constructor(triggerEvents = true) {
    super();

    this._root = new Entity();
    this._components = new Map();
    this._triggerEvents = !!triggerEvents;
  }

  dispose() {
    const { _root } = this;

    if (!!_root) {
      _root.dispose();
    }

    this._components.clear();

    this._root = null;
  }

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

  unregisterComponent(typename) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }
    if (!this._components.delete(typename)) {
      throw new Error(`There is no registered component: ${typename}`);
    }
  }

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

  performAction(name, ...args) {
    const { _root } = this;

    if (!!_root) {
      _root.performAction(name, ...args);
    }
  }

  updateTransforms() {
    const { _root } = this;

    if (!!_root) {
      _root.updateTransforms(identityMatrix);
    }
  }

}
