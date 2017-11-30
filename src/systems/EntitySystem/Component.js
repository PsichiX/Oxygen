export default class Component {

  static get propsTypes() {
    return {};
  }

  get entity() {
    return this._owner;
  }

  constructor() {
    this._owner = null;
  }

  dispose() {
    const { _owner } = this;

    if (!!_owner) {
      _owner.detachComponent(this);
    }

    this._owner = null;
  }

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

  deserialize(json) {
    if (!json) {
      return;
    }

    for (const key in json) {
      this.onPropertySetup(key, json[key]);
    }
  }

  onAttach() {}

  onDetach() {}

  onAction(name, ...args) {}

  onAlterActionArguments(name, args) {}

  onPropertySetup(name, value) {
    this[name] = value;
  }

  onPropertySerialize(name, value) {
    return value;
  }

}
