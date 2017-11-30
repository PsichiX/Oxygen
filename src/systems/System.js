import Events from '../utils/Events';
import { findMapKeyOfValue } from '../utils';

const _systems = new Map();
const _events = new Events();

export default class System {

  static get systems() {
    const result = {};

    for (const [name, system] of _systems) {
      result[name] = system;
    }

    return result;
  }

  static get events() {
    return _events;
  }

  static register(typename, system) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }
    if (!(system instanceof System)) {
      throw new Error('`system` is not type of System!');
    }

    if (_systems.has(typename)) {
      throw new Error(`Given system type is already registered: ${typename}`);
    }

    _systems.set(typename, system);
    system.onRegister();
    return system;
  }

  static unregister(typename) {
    let system = typename;

    if (typeof typename === 'string') {
      system = _systems.get(typename);
    } else if (system instanceof System) {
      typename = findMapKeyOfValue(_systems, system);
    } else {
      throw new Error('`typename` is not type of either System or String!');
    }

    if (_systems.delete(typename)) {
      system.onUnregister();
      return system;
    } else {
      throw new Error(`Trying to remove non-registered system type: ${typename}`);
    }
  }

  static get(typename) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }

    return _systems.get(typename) || null;
  }

  static dispose() {
    for (const system of _systems.values()) {
      system.dispose();
    }

    _systems.clear();
    _events.dispose();
  }

  dispose() {}

  onRegister() {}

  onUnregister() {}

}
