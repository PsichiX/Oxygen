import Component from '../systems/EntitySystem/Component';
import System from '../systems/System';
import Events from '../utils/Events';

let instancing = 0;

export default class PrefabInstance extends Component {

  static factory() {
    return new PrefabInstance();
  }

  static get propsTypes() {
    return {
      asset: 'string_null',
      count: 'integer',
      components: 'map(any)'
    };
  }

  static get instancing() {
    return instancing;
  }

  get events() {
    return this._events;
  }

  get asset() {
    return this._asset;
  }

  set asset(value) {
    if (!value) {
      this._asset = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._asset = value;
  }

  get count() {
    return this._count;
  }

  set count(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._count = value | 0;
  }

  get components() {
    return this._components;
  }

  set components(value) {
    this._components = value;
  }

  constructor() {
    super();

    this._events = new Events();
    this._asset = null;
    this._count = 1;
    this._components = null;
  }

  dispose() {
    this._events.dispose();
    super.dispose();
  }

  onAttach() {
    const { entity, _asset, _components, _count } = this;
    if (!_asset) {
      throw new Error('There is no source prefab asset provided!');
    }

    const { AssetSystem } = System.systems;
    if (!AssetSystem) {
      throw new Error('There is no registered AssetSystem!');
    }

    if (_count > 0) {
      const asset = AssetSystem.get(`scene://${_asset}`);
      if (!asset) {
        throw new Error(`There is no asset loaded: ${_asset}`);
      }

      const { name, tag, active, parent, position, scale } = entity;
      const rotation = entity.getRotation();
      for (let i = 0; i < _count; ++i) {
        const instance = entity.owner.buildEntity(asset.data);

        ++instancing;
        instance.deserialize({
          name: name || undefined,
          tag: tag || undefined,
          active: active || undefined,
          transform: {
            position: position,
            rotation: rotation,
            scale: scale
          },
          components: _components
        });

        setTimeout(() => {
          const index = entity.indexInParent;
          instance.reparent(parent, index);
          --instancing;
        }, 0);
      }
    }

    setTimeout(() => {
      entity.parent = null;
      entity.dispose();
      this._events.trigger('instantiate');
      this._events.off('instantiate');
    }, 0);
  }

}
