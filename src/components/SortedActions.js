import Component from '../systems/EntitySystem/Component';

export default class SortedActions extends Component {

  static factory() {
    return new SortedActions();
  }

  static get propsTypes() {
    return {
      actions: 'array(string)',
      metaPropOrder: 'string_null'
    };
  }

  get actions() {
    return this._actions;
  }

  set actions(value) {
    if (!Array.isArray(value)) {
      throw new Error('`value` is not type of Array!');
    }

    this._actions = value;
  }

  get metaPropOrder() {
    return this._metaPropOrder;
  }

  set metaPropOrder(value) {
    if (!value) {
      this._metaPropOrder = null;
      return;
    }
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._metaPropOrder = value;
  }

  get sorting() {
    return this._sorting;
  }

  set sorting(value) {
    if (!(value instanceof Function)) {
      throw new Error('`value` is not type of Function!');
    }

    this._sorting = value;
  }

  constructor() {
    super();

    this._actions = [];
    this._metaPropOrder = null;
    this._sorting = null;
  }

  dispose() {
    super.dispose();

    this._actions = null;
    this._metaPropOrder = null;
    this._sorting = null;
  }

  onAction(name, ...args) {
    const { _actions, _metaPropOrder, _sorting } = this;
    if (!!_actions && _actions.length > 0 && _actions.indexOf(name) >= 0) {
      const list = [];

      this.entity.performOnChildren(child => list.push(child), true);
      if (!!_sorting) {
        list.sort(_sorting);
      } else if (!!_metaPropOrder) {
        list.sort(
          (a, b) => (a.meta[_metaPropOrder] || 0) - (b.meta[_metaPropOrder] || 0)
        );
      } else {
        console.warn('There are no `metaPropOrder` and `sorting` properties set!');
        return;
      }

      for (let i = 0, c = list.length; i < c; ++i) {
        list[i].performActionOnComponents(name, ...args);
      }
      return true;
    }
  }

}
