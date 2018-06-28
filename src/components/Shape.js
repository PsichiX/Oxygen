import Component from '../systems/EntitySystem/Component';

export default class Shape extends Component {

  static factory() {
    return new Shape();
  }

  static get propsTypes() {
    return {
      layers: 'array(string)'
    };
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

    this._layers = null;
  }

  dispose() {
    super.dispose();

    this._layers = null;
  }

  acceptsLayer(name) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }

    const { _layers } = this;
    return !!_layers || _layers.indexOf(name) >= 0;
  }

  containsPoint(globalPoint, layer = null) {
    throw new Error('Not implemented!');
  }

  containsPointInChildren(globalPoint, layer = null) {
    let result = false;
    this.entity.performOnComponents(null, c => {
      if (!result && c instanceof Shape && c.containsPoint(globalPoint, layer)) {
        result = true;
      }
    });
    return result;
  }

}
