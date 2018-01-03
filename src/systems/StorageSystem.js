import System from './System';
import Events from '../utils/Events';

/**
 * Permanent and session data storage.
 *
 * @example
 * const system = new StorageSystem({ id: 'my-game' });
 * system.load();
 * system.storage.score = (system.storage.score || 0) + 1;
 * system.save();
 */
export default class StorageSystem extends System {

  /** @type {Events} */
  get events() {
    return this._events;
  }

  /** @type {*} */
  get storage() {
    return this._storage;
  }

  /** @type {*} */
  get storageSession() {
    return this._storageSession;
  }

  /**
   * Constructor.
   *
   * @param {string}	id - application storage unique id.
   */
  constructor(id = 'oxygen-data') {
    super();

    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._events = new Events();
    this._id = id;
    this._storageSession = null;
    this._storage = null;
  }

  /**
   * Destructor (disposes internal resources).
   *
   * @example
   * system.dispose();
   * system = null;
   */
  dispose() {
    super.dispose();

    const { _events } = this;
    if (!!_events) {
      _events.dispose();
    }

    this._events = null;
    this._id = null;
    this._storageSession = null;
    this._storage = null;
  }

  /**
   * @override
   */
  onRegister() {
    this.loadSession();
    this.load();
  }

  /**
   * @override
   */
  onUnregister() {
    this.saveSession();
    this.save();
  }

  /**
   * Load browser session storage data into memory.
   *
   * @example
   * system.loadSession();
   * console.log(system.storageSession.score);
   */
  loadSession() {
    try {
      this._storageSession = JSON.parse(sessionStorage[this._id] || '{}');
      this._events.trigger('load-session', this._storageSession);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  /**
   * Save memory session storage into browser.
   *
   * @example
   * system.storageSession.score = 10;
   * system.saveSession();
   */
  saveSession() {
    try {
      const data = this._storageSession || {};

      sessionStorage[this._id] = JSON.stringify(data);
      this._events.trigger('save-session', data);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  /**
   * Clear session storage.
   */
  clearSession() {
    this._storageSession = {};
    this.saveSession();
  }

  /**
   * Load browser permanent storage data into memory.
   *
   * @example
   * system.load();
   * console.log(system.storage.score);
   */
  load() {
    try {
      this._storage = JSON.parse(localStorage[this._id] || '{}');
      this._events.trigger('load', this._storage);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  /**
   * Save memory permanent storage into browser.
   *
   * @example
   * system.storage.score = 10;
   * system.save();
   */
  save() {
    try {
      const data = this._storage || {};

      localStorage[this._id] = JSON.stringify(data);
      this._events.trigger('save', data);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  /**
   * Clear permanent storage.
   */
  clear() {
    this._storage = {};
    this.save();
  }

}
