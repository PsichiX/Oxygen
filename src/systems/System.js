import Events from '../utils/Events';
import { findMapKeyOfValue } from '../utils';

const _systems = new Map();
const _events = new Events();

/**
 * System base class.
 * Every Oxygen Core system extends this class.
 */
export default class System {

  /** @type {{string, System}} */
  static get systems() {
    const result = {};

    for (const [name, system] of _systems) {
      result[name] = system;
    }

    return result;
  }

  /** @type {Events} */
  static get events() {
    return _events;
  }

  /**
   * Register new system instance under given name.
   *
   * @param {string}	typename - System type name.
   * @param {System}	system - System instance.
   *
   * @return {System} Registered system instance.
   *
   * @example
   * class MySystem extends System {}
   * System.register('MySystem', new MySystem());
   * const { MySystem } = System.systems;
   */
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

  /**
   * Unregister given system.
   *
   * @param {string}	typename - System type name
   *
   * @example
   * System.unregister('MySystem');
   */
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

  /**
   * Returns system instance of given type name.
   *
   * @param {string}	typename - System type name.
   *
   * @return {System|null} System instance if registered or null if not.
   *
   * @example
   * const system = System.get('MySystem');
   */
  static get(typename) {
    if (typeof typename !== 'string') {
      throw new Error('`typename` is not type of String!');
    }

    return _systems.get(typename) || null;
  }

  /**
   * Dispose and remove all registered systems.
   *
   * @example
   * System.dispose();
   */
  static dispose() {
    for (const system of _systems.values()) {
      system.dispose();
    }

    _systems.clear();
    _events.dispose();
  }

  /**
   * Destructor (disposes all internal resources).
   */
  dispose() {}

  /**
   * Event called after system gets registered.
   */
  onRegister() {}

  /**
   * Event called before system gets unregistered.
   */
  onUnregister() {}

}
