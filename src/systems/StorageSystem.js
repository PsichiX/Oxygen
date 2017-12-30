import System from './System';
import Events from '../utils/Events';

export default class StorageSystem extends System {

  get events() {
    return this._events;
  }

  get storage() {
    return this._storage;
  }

  get storageSession() {
    return this._storageSession;
  }

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

  onRegister() {
    this.loadSession();
    this.load();
  }

  onUnregister() {
    this.saveSession();
    this.save();
  }

  loadSession() {
    try {
      this._storageSession = JSON.parse(sessionStorage[this._id] || '{}');
      this._events.trigger('load-session', this._storageSession);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  saveSession() {
    try {
      const data = this._storageSession || {};

      sessionStorage[this._id] = JSON.stringify(data);
      this._events.trigger('save-session', data);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  clearSession() {
    this._storageSession = {};
    this.saveSession();
  }

  load() {
    try {
      this._storage = JSON.parse(localStorage[this._id] || '{}');
      this._events.trigger('load', this._storage);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  save() {
    try {
      const data = this._storage || {};

      localStorage[this._id] = JSON.stringify(data);
      this._events.trigger('save', data);
    } catch(error) {
      this._events.trigger('error', error);
    }
  }

  clear() {
    this._storage = {};
    this.save();
  }

}
