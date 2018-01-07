/**
 * Component - entity way to express it's behaviour.
 */
export default class Component {

  /** @type {*} */
  static get propsTypes() {
    return {};
  }

  /**
   * Component factory.
   *
   * @return {Component} New component instance.
   */
  static factory() {
    throw new Error('Factory is not implemented!');
  }

  /** @type {Entity|null} */
  get entity() {
    return this._owner;
  }

  /**
   * Constructor.
   */
  constructor() {
    this._owner = null;
  }

  /**
   * Destructor (dispose internal resources and detach from entity).
   *
   * @example
   * component.parent = system.root;
   * component.dispose();
   * component.parent === null;
   */
  dispose() {
    const { _owner } = this;

    if (!!_owner) {
      _owner.detachComponent(this);
    }

    this._owner = null;
  }

  /**
   * Serialize component into JSON data.
   *
   * @return {*} Serialized JSON data.
   *
   * @example
   * component.hello = 'world';
   * const json = component.serialize();
   * json.hello === 'world';
   */
  serialize() {
    const { propsTypes } = this.constructor;
    const result = {};

    for (const key in propsTypes) {
      const value = this.onPropertySerialize(key, this[key]);
      if (value === null || typeof value === 'undefined') {
        continue;
      }

      result[key] = value;
    }

    return result;
  }

  /**
   * Deserialize JSON properties into this component.
   *
   * @param {*}	json - Serialized JSON data.
   *
   * @example
   * component.deserialize({ hello: 'world' });
   * component.hello === 'world';
   */
  deserialize(json) {
    if (!json) {
      return;
    }

    for (const key in json) {
      this.onPropertySetup(key, json[key]);
    }
  }

  /**
   * Called after attached to entity.
   */
  onAttach() {}

  /**
   * Called before detached from entity.
   */
  onDetach() {}

  /**
   * Called when action arrived.
   *
   * @param {string}	name - Action name.
   * @param {*}	args - Action parameters.
   */
  onAction(name, ...args) {}

  /**
   * Called when asked to alter arrived action parameters.
   *
   * @param {string}	name - Action name.
   * @param {*}	args - Action parameters.
   *
   * @return {array|undefined} New action parameters or undefined if they're not change.
   */
  onAlterActionArguments(name, args) {}

  /**
   * Called when given property is deserialized.
   *
   * @param {string}	name - Property name.
   * @param {*}	value - Property value.
   */
  onPropertySetup(name, value) {
    this[name] = value;
  }

  /**
   * Called when property is serialized.
   *
   * @param {string}	name - Property name.
   * @param {*}	value - Property value.
   *
   * @return {*} Serializable proeprty JSON value.
   */
  onPropertySerialize(name, value) {
    return value;
  }

}
