import Component from './Component';
import EntitySystem from '.';
import { mat4, quat, vec3 } from '../../utils/gl-matrix';
import { findMapKeyOfValue } from '../../utils';

const zVector = vec3.fromValues(0, 0, 1);
const cachedTempVec3 = vec3.create();

/**
 * Entity - actor of the scene, container for behaviour components.
 *
 * @example
 * const entity = new Entity();
 * entity.deserialize({ name: 'hey', components: { Hello: { hello: 'world' } } });
 * const hello = entity.getComponent('Hello');
 * console.log(hello.hello);
 */
export default class Entity {

  /** @type {EntitySystem|null} */
  get owner() {
    return this._owner;
  }

  /** @type {string|null} */
  get name() {
    return this._name;
  }

  /** @type {string|null} */
  set name(value) {
    if (!!value && typeof value != 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._name = value || '';
  }

  /** @type {string|null} */
  get tag() {
    return this._tag;
  }

  /** @type {string|null} */
  set tag(value) {
    if (!!value && typeof value != 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._tag = value || '';
  }

  /** @type {boolean} */
  get active() {
    return this._active;
  }

  /** @type {boolean} */
  set active(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._active = value;
  }

  /** @type {string} */
  get path() {
    let result = `/${this._name}`;
    let current = this._parent;
    while (!!current) {
      result = `/${current.name}${result}`;
      current = current._parent;
    }
    return result;
  }

  /** @type {Entity} */
  get root() {
    let result = this;
    let current = this._parent;
    while (!!current) {
      result = current;
      current = current._parent;
    }
    return result;
  }

  /** @type {Entity|null} */
  get parent() {
    return this._parent;
  }

  /** @type {Entity|null} */
  set parent(value) {
    this.reparent(value);
  }

  /** @type {number} */
  get childrenCount() {
    return this._children.length;
  }

  /** @type {number} */
  get indexInParent() {
    const { _parent } = this;
    return !_parent ? -1 : _parent._children.indexOf(this);
  }

  /** @type {mat4} */
  get transformLocal() {
    return this._transformLocal;
  }

  /** @type {mat4} */
  get transform() {
    return this._transform;
  }

  /** @type {mat4} */
  get inverseTransform() {
    return this._inverseTransform;
  }

  /** @type {vec3} */
  get position() {
    return this._position;
  }

  /** @type {quat} */
  get rotation() {
    return this._rotation;
  }

  /** @type {vec3} */
  get scale() {
    return this._scale;
  }

  /** @type {vec3} */
  get globalPosition() {
    const result = vec3.create();
    vec3.set(cachedTempVec3, 0, 0, 0);
    return vec3.transformMat4(result, cachedTempVec3, this._transform);
  }

  /** @type {*} */
  get componentNames() {
    return this._components.keys();
  }

  /** @type {Function|null} */
  get childrenSorting() {
    return this._childrenSorting;
  }

  /** @type {Function|null} */
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

  /** @type {*} */
  get meta() {
    return this._meta;
  }

  /**
   * Constructor.
   */
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

  /**
   * Destructor (disposes internal resources).
   *
   * @example
   * entity.dispose();
   * entity = null;
   */
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

  /**
   * Make this entity and it's children active.
   *
   * @example
   * entity.activete();
   * entity.active === true;
   */
  activate() {
    this.active = true;

    const { _children } = this;
    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i].activate();
    }
  }

  /**
   * Make this entity and it's children inactive.
   *
   * @example
   * entity.deactivete();
   * entity.active === false;
   */
  deactivate() {
    this.active = false;

    const { _children } = this;
    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i].deactivate();
    }
  }

  /**
   * Serialize this entity into JSON data.
   *
   * @return {*} Serialized JSON data.
   *
   * @example
   * entity.name = 'serialized';
   * const json = entity.serialize();
   * json.name === 'serialized';
   */
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

  /**
   * Deserialize JSON data into this entity.
   *
   * @param {*}	json - Serialized entity JSON data.
   *
   * @example
   * entity.deserialize({ name: 'deserialized' });
   * entity.name === 'deserialized';
   */
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

  /**
   * Set entity local position.
   *
   * @param {number}	x - Local X position.
   * @param {number}	y - Local Y position.
   * @param {number}	z - Local Z position.
   *
   * @example
   * entity.setPosition(40, 2);
   */
  setPosition(x, y, z = 0) {
    if (typeof x !== 'number') {
      throw new Error('`x` is not type of Number!');
    }
    if (typeof y !== 'number') {
      throw new Error('`y` is not type of Number!');
    }
    if (typeof z !== 'number') {
      throw new Error('`z` is not type of Number!');
    }

    vec3.set(this._position, x, y, z);
    this._dirty = true;
  }

  /**
   * Set entity local Z axis rotation.
   *
   * @param {number}	rad - Z axis radian angle.
   *
   * @example
   * entity.setRotation(90 * Math.PI / 180);
   */
  setRotation(rad) {
    if (typeof rad !== 'number') {
      throw new Error('`rad` is not type of Number!');
    }

    quat.setAxisAngle(this._rotation, zVector, rad);
    this._dirty = true;
  }

  /**
   * Set entity local rotation from euler degrees.
   *
   * @param {number}	x - X axis degree rotation.
   * @param {number}	y - Y axis degree rotation.
   * @param {number}	z - Z axis degree rotation.
   *
   * @example
   * entity.setRotationEuler(15, 30, 45);
   */
  setRotationEuler(x, y, z) {
    if (typeof x !== 'number') {
      throw new Error('`x` is not type of Number!');
    }
    if (typeof y !== 'number') {
      throw new Error('`y` is not type of Number!');
    }
    if (typeof z !== 'number') {
      throw new Error('`z` is not type of Number!');
    }

    quat.fromEuler(this._rotation, x, y, z);
    this._dirty = true;
  }

  /**
   * Get entity local Z axis radian rotation.
   *
   * @return {number} Z axis local radian rotation.
   *
   * @example
   * console.log(entity.getRotation());
   */
  getRotation() {
    return quat.getAxisAngle(cachedTempVec3, this._rotation) * cachedTempVec3[2];
  }

  /**
   * Get entity local euler axis rotation in degrees.
   *
   * @param {vec3}	result - Result vec3 object.
   *
   * @example
   * const euler = vec3.create();
   * entity.getRotationEuler(euler);
   * console.log(euler);
   */
  getRotationEuler(result) {
    if (!result) {
      throw new Error('`result` cannot be null!');
    }

    const rad2deg = 180 / Math.PI;
    const angle = quat.getAxisAngle(cachedTempVec3, this._rotation);
    vec3.set(
      result,
      cachedTempVec3[0] * angle * rad2deg,
      cachedTempVec3[1] * angle * rad2deg,
      cachedTempVec3[2] * angle * rad2deg
    );
  }

  /**
   * Set entity local scale.
   *
   * @param {number}	x - Local X scale.
   * @param {number}	y - Local Y scale.
   * @param {number}	z - Local Z scale.
   *
   * @example
   * entity.setScale(2, 3);
   */
  setScale(x, y, z = 1) {
    if (typeof x !== 'number') {
      throw new Error('`x` is not type of Number!');
    }
    if (typeof y !== 'number') {
      throw new Error('`y` is not type of Number!');
    }
    if (typeof z !== 'number') {
      throw new Error('`z` is not type of Number!');
    }

    vec3.set(this._scale, x, y, z);
    this._dirty = true;
  }

  /**
   * Get entity children at given index.
   *
   * @param {number}	index - Child index.
   *
   * @return {Entity} Child entity instance.
   */
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

  /**
   * Kills all entity children (calls dispose on them and removes them from entity).
   *
   * @example
   * entity.killChildren();
   */
  killChildren() {
    const { _children } = this;
    const container = new Set(_children);

    for (const child of container) {
      child.dispose();
    }
    container.clear();
  }

  /**
   * Rebind entity to different parent.
   *
   * @param {Entity|null}	entity - New parent entity or null if not bound to any entity.
   * @param {number}	insertAt - Child index at given should be placed this entity in new parent
   *
   * @example
   * entity.reparent(system.root);
   */
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

  /**
   * Find entity by it's name or path in scene tree.
   *
   * @param {string}	name - Entity name or path.
   *
   * @return {Entity|null} Found entity instance or null if not found.
   *
   * @example
   * entity.findEntity('./some-child');
   * entity.findEntity('/root-child');
   * entity.findEntity('/root-child/some-child');
   */
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

  /**
   * Attach component to this entity.
   *
   * @param {string}	typename - Component type name.
   * @param {Component}	component - Component instance.
   *
   * @example
   * entity.attachComponent('MyComponent', new MyComponent());
   * entity.attachComponent('Hello', new Hello());
   */
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

  /**
   * Detach component by it's type name.
   *
   * @param {string}	typename - Component type name.
   *
   * @example
   * entity.detachComponent('Hello');
   */
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

  /**
   * Find component by it's type name.
   *
   * @param {string|Function}	typename - Component type (class or name).
   *
   * @return {Component|null} Component instance if found or null otherwise.
   *
   * @example
   * class Hello extends Component {}
   * entity.attachComponent('Hello', new Hello());
   * const hello1 = entity.getComponent('Hello');
   * const hello2 = entity.getComponent(Hello);
   */
  getComponent(typename) {
    if (typeof typename === 'string') {
      return this._components.get(typename) || null;
    } else if (typename instanceof Function) {
      for (const c of this._components.values()) {
        if (c instanceof typename) {
          return c;
        }
      }
      return null;
    }

    throw new Error('`typename` is not type of either String or Function!');
  }

  /**
   * Perform action on entity.
   *
   * @param {string}	name - Action name.
   * @param {*}	args - Action parameters.
   *
   * @example
   * class Hi extends Component { onAction(name, wat) { if (name === 'hi') console.log(wat); } }
   * entity.attachComponent('Hi', new Hi());
   * entity.performAction('hi', 'hello');
   */
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

  /**
   * Perform action only on components (do not pass action further to children).
   * See: {@link performAction}
   *
   * @param {string}	name - Action name.
   * @param {*}	args - Action parameters.
   */
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

  /**
   * Perform custom callback action on entity components of given type and it's children.
   *
   * @param {string|null}	id - Affected component type (can be null if want to call every component).
   * @param {Function}	action - Custom action callback. Callback gets one argument with component instance.
   *
   * @example
   * entity.performOnComponents('Hello', component => console.log(component.hello));
   */
  performOnComponents(id, action) {
    if (!!id && typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!(action instanceof Function)) {
      throw new Error('`action` is not type of Function!');
    }

    if (!!id) {
      const component = this.getComponent(id);
      if (!!component) {
        action(component);
      }
    } else {
      const { _components } = this;
      for (const component of _components.values()) {
        action(component);
      }
    }

    const { _children } = this;
    for (let i = 0, c = _children.length; i < c; ++i) {
      _children[i].performOnComponents(id, action);
    }
  }

  /**
   * Perform custom callback action only on entity and optionally it's children.
   *
   * @param {Function}	action - Custom action callback. Callback gets one argument with child instance.
   * @param {boolean}	deep - True if should be called on it's children.
   *
   * @example
   * entity.performOnChildren(e => console.log(e.name));
   */
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

  /**
   * Update entity ant it's children transforms.
   *
   * @param {mat4}	parentTransform - Parent transformation.
   * @param {boolean}	forced - If true ignore optimizations and update anyway.
   *
   * @example
   * entity.updateTransforms();
   */
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

  /**
   * Sort children by entity childrenSorting function if set.
   */
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
