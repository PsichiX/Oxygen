import Component from './Component';
import EntitySystem from '.';
import { mat4, quat, vec3 } from '../../utils/gl-matrix';
import { findMapKeyOfValue } from '../../utils';

const zVector = vec3.fromValues(0, 0, 1);
const cachedTempVec3 = vec3.create();

export default class Entity {

  get owner() {
    return this._owner;
  }

  get name() {
    return this._name;
  }

  set name(value) {
    if (!!value && typeof value != 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._name = value || '';
  }

  get tag() {
    return this._tag;
  }

  set tag(value) {
    if (!!value && typeof value != 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._tag = value || '';
  }

  get active() {
    return this._active;
  }

  set active(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._active = value;
  }

  get path() {
    let result = `/${this._name}`;
    let current = this._parent;
    while (!!current) {
      result = `/${current.name}${result}`;
      current = current._parent;
    }
    return result;
  }

  get root() {
    let result = this;
    let current = this._parent;
    while (!!current) {
      result = current;
      current = current._parent;
    }
    return result;
  }

  get parent() {
    return this._parent;
  }

  set parent(value) {
    this.reparent(value);
  }

  get childrenCount() {
    return this._children.length;
  }

  get indexInParent() {
    const { _parent } = this;
    return !_parent ? -1 : _parent._children.indexOf(this);
  }

  get transformLocal() {
    return this._transformLocal;
  }

  get transform() {
    return this._transform;
  }

  get inverseTransform() {
    return this._inverseTransform;
  }

  get position() {
    return this._position;
  }

  get rotation() {
    return this._rotation;
  }

  get scale() {
    return this._scale;
  }

  get globalPosition() {
    const result = vec3.create();
    vec3.set(cachedTempVec3, 0, 0, 0);
    return vec3.transformMat4(result, cachedTempVec3, this._transform);
  }

  get componentNames() {
    return this._components.keys();
  }

  get childrenSorting() {
    return this._childrenSorting;
  }

  set childrenSorting(value) {
    if (!value) {
      this._childrenSorting = null;
      return;
    }
    if (!(value instanceof Function)) {
      throw new Error('`value` is not type of Function!');
    }

    this._childrenSorting = value;
    this.sortChildren();
  }

  get meta() {
    return this._meta;
  }

  constructor() {
    this._owner = null;
    this._name = '';
    this._tag = '';
    this._active = true;
    this._children = [];
    this._parent = null;
    this._components = new Map();
    this._transformLocal = mat4.create();
    this._transform = mat4.create();
    this._inverseTransform = mat4.create();
    this._position = vec3.create();
    this._rotation = quat.create();
    this._scale = vec3.fromValues(1, 1, 1);
    this._childrenSorting = null;
    this._meta = {};
    this._dirty = true;
  }

  dispose() {
    const { _children, _components } = this;

    this.reparent(null);

    for (let i = _children.length - 1; i >= 0; --i) {
      _children[i].dispose();
    }

    for (const component of _components.values()) {
      component.dispose();
    }

    this._owner = null;
    this._name = null;
    this._tag = null;
    this._children = null;
    this._parent = null;
    this._components = null;
    this._transformLocal = null;
    this._transform = null;
    this._inverseTransform = null;
    this._position = null;
    this._rotation = null;
    this._scale = null;
    this._childrenSorting = null;
    this._meta = null;
  }

  serialize() {
    const name = this._name || '';
    const tag = this._tag || '';
    const active = this._active;
    const position = [ ...this._position ].slice(0, 2);
    const scale = [ ...this._scale ].slice(0, 2);
    const rotation = this.getRotation() * 180 / Math.PI;
    const result = {
      name,
      tag,
      active,
      meta: {},
      transform: {
        position,
        rotation,
        scale
      },
      components: {},
      children: []
    };

    for (const key in this._meta) {
      result.meta[key] = this._meta[key];
    }

    for (const [key, value] of this._components) {
      result.components[key] = value.serialize();
    }

    for (const child of this._children) {
      result.children.push(child.serialize());
    }

    return result;
  }

  deserialize(json) {
    if (!json) {
      return;
    }

    if (typeof json.name !== 'undefined') {
      this.name = json.name;
    }

    if (typeof json.tag !== 'undefined') {
      this.tag = json.tag;
    }

    if (typeof json.active !== 'undefined') {
      this.active = json.active;
    }

    const { meta, transform, components } = json;

    if (!!meta) {
      const { _meta } = this;

      for (const name in meta) {
        _meta[name] = meta[name];
      }
    }

    if (!!transform) {
      const { position, rotation, scale } = transform;

      if (typeof position === 'number') {
        this.setPosition(position, position);
      } else if (!!position && position.length >= 2) {
        this.setPosition(position[0], position[1]);
      }

      if (typeof rotation === 'number') {
        this.setRotation(rotation * Math.PI / 180);
      }

      if (typeof scale === 'number') {
        this.setScale(scale, scale);
      } else if (!!scale && scale.length >= 2) {
        this.setScale(scale[0], scale[1]);
      }
    }

    if (!!components) {
      const { _components } = this;

      for (const name in components) {
        if (_components.has(name)) {
          _components.get(name).deserialize(components[name]);
        }
      }
    }
  }

  setPosition(x, y) {
    if (typeof x !== 'number') {
      throw new Error('`x` is not type of Number!');
    }
    if (typeof y !== 'number') {
      throw new Error('`y` is not type of Number!');
    }

    vec3.set(this._position, x, y, 0);
    this._dirty = true;
  }

  setRotation(rad) {
    if (typeof rad !== 'number') {
      throw new Error('`rad` is not type of Number!');
    }

    quat.setAxisAngle(this._rotation, zVector, rad);
    this._dirty = true;
  }

  getRotation() {
    return quat.getAxisAngle(cachedTempVec3, this._rotation) * cachedTempVec3[2];
  }

  setScale(x, y) {
    if (typeof x !== 'number') {
      throw new Error('`x` is not type of Number!');
    }
    if (typeof y !== 'number') {
      throw new Error('`y` is not type of Number!');
    }

    vec3.set(this._scale, x, y, 1);
    this._dirty = true;
  }

  getChild(index) {
    if (typeof index !== 'number') {
      throw new Error('`index` is not type of Number!');
    }

    const { _children } = this;

    if (index < 0 || index >= _children.length) {
      throw new Error('`index` is out of bounds!');
    }

    return _children[index];
  }

  killChildren() {
    const { _children } = this;
    const container = new Set(_children);

    for (const child of container) {
      child.dispose();
    }
    container.clear();
  }

  reparent(entity, insertAt = -1) {
    if (!!entity && !(entity instanceof Entity)) {
      throw new Error('`entity` is not type of Entity!');
    }
    if (typeof insertAt !== 'number') {
      throw new Error('`insertAt` is not type of Number!');
    }

    const { _parent } = this;

    if (entity === _parent) {
      return;
    }

    this._parent = entity;

    if (!!_parent) {
      const { _children } = _parent;
      const found = _children.indexOf(this);

      if (found >= 0) {
        this._setOwner(null);
        _children.splice(found, 1);
      }
      _parent.sortChildren();
    }

    if (!!entity) {
      if (insertAt < 0) {
        entity._children.push(this);
      } else {
        entity._children.splice(insertAt, 0, this);
      }
      this._setOwner(entity.owner);
      entity.sortChildren();
    }
  }

  findEntity(name) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }

    let current = this;
    while (!!current && name.length > 0) {
      const found = name.indexOf('/');

      if (found === 0) {
        while (!!current._parent) {
          current = current._parent;
        }

        name = name.substr(found + 1);
      } else {
        const part = found > 0 ? name.substr(0, found) : name;

        if (part === '.') {
          // do nothing

        } else if (part === '..') {
          current = current._parent;

        } else {
          const { _children } = current;
          let found = false;

          for (let i = 0, c = _children.length; i < c; ++i) {
            const child = _children[i];

            if (child.name === part) {
              current = child;
              found = true;
              break;
            }
          }

          if (!found) {
            return null;
          }

        }

        if (found < 0) {
          return current;
        }

        name = name.substr(found + 1);
      }
    }

    return current;
  }

  attachComponent(typename, component) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }
    if (!(component instanceof Component)) {
      throw new Error('`component` is not type of Component!');
    }

    const { _components } = this;

    if (_components.has(typename)) {
      throw new Error(
        `Given component type is already attached to entity: ${typename}`
      );
    }

    _components.set(typename, component);
    component._owner = this;
    if (!!this._owner && !!this._owner.triggerEvents) {
      component.onAttach();
    }
  }

  detachComponent(typename) {
    const { _components } = this;
    let component = typename;

    if (typeof typename === 'string') {
      component = _components.get(typename);
    } else if (component instanceof Component) {
      typename = findMapKeyOfValue(_components, component);
    } else {
      throw new Error('`typename` is not type of either Component or String!');
    }

    if (_components.delete(typename)) {
      component._owner = null;
      if (!!this._owner && !!this._owner.triggerEvents) {
        component.onDetach();
      }
    } else {
      throw new Error(`Trying to remove non-attached component type: ${typename}`);
    }
  }

  getComponent(typename) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }

    return this._components.get(typename) || null;
  }

  performAction(name, ...args) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }
    if (!this._active) {
      return;
    }

    const { _components, _children } = this;
    let status = false;
    let a = args;

    for (const component of _components.values()) {
      status = !!component.onAction(name, ...a) || status;
      a = component.onAlterActionArguments(name, a) || a;
    }

    if (status) {
      return;
    }

    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i].performAction(name, ...a);
    }
  }

  performActionOnComponents(name, ...args) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }
    if (!this._active) {
      return;
    }

    const { _components } = this;
    let a = args;

    for (const component of _components.values()) {
      !!component.onAction(name, ...a);
      a = component.onAlterActionArguments(name, a) || a;
    }
  }

  performOnComponents(id, action) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!(action instanceof Function)) {
      throw new Error('`action` is not type of Function!');
    }

    const component = this.getComponent(id);
    if (!!component) {
      action(component);
    }

    const { _children } = this;
    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i].performOnComponents(id, action);
    }
  }

  performOnChildren(action, deep = false) {
    if (!(action instanceof Function)) {
      throw new Error('`action` is not type of Function!');
    }

    const { _children } = this;
    for (let i = 0, c = _children.length; i < c; ++i) {
      const child = _children[i];

      action(child);
      if (!!deep) {
        child.performOnChildren(action, deep);
      }
    }
  }

  updateTransforms(parentTransform, forced = false) {
    if (!this._active) {
      return;
    }

    const {
      _children,
      _transform,
      _inverseTransform,
      _transformLocal,
      _position,
      _rotation,
      _scale
    } = this;

    if (!!forced || this._dirty) {
      mat4.fromRotationTranslationScale(
        _transformLocal,
        _rotation,
        _position,
        _scale
      );

      mat4.multiply(_transform, parentTransform, _transformLocal);
      mat4.invert(_inverseTransform, _transform);

      forced = true;
      this._dirty = false;
    }

    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i].updateTransforms(_transform, forced);
    }
  }

  sortChildren() {
    const { _childrenSorting, _children } = this;
    if (!_childrenSorting) {
      return;
    }

    _children.sort(_childrenSorting);
  }

  _setOwner(owner) {
    const { _owner, _components, _children } = this;

    if (!!owner === !!_owner) {
      return;
    }

    if (!!_owner && !!_owner.triggerEvents) {
      for (const component of _components.values()) {
        component.onDetach();
      }
    }

    this._owner = owner;

    if (!!owner && !!owner.triggerEvents) {
      for (const component of _components.values()) {
        component.onAttach();
      }
    }

    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i]._setOwner(owner);
    }
  }

}
