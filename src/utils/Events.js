export default class Events {

  constructor() {
    this._events = new Map();
    this._onQueue = [];
    this._offQueue = [];
    this._triggerDepth = 0;
  }

  dispose() {
    this._events.clear();
    this._onQueue = [];
    this._offQueue = [];
    this._triggerDepth = 0;
  }

  on(name, callback) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }
    if (!(callback instanceof Function)) {
      throw new Error('`callback` is not type of Function!');
    }

    const { _events, _triggerDepth, _onQueue } = this;

    if (_triggerDepth > 0) {
      _onQueue.push({ name, callback });
      return;
    }

    if (!_events.has(name)) {
     _events.set(name, []);
    }

    _events.get(name).push(callback);
  }

  off(name, callback) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }

    const { _events, _triggerDepth, _offQueue } = this;

    if (!callback) {
      _events.delete(name);
      return;
    }

    if (!(callback instanceof Function)) {
      throw new Error('`callback` is not type of Function!');
    }

    if (_triggerDepth > 0) {
      _offQueue.push({ name, callback });
      return;
    }

    const callbacks = _events.get(name);

    if (!callbacks) {
      return;
    }

    const found = callbacks.indexOf(callback);

    if (found >= 0) {
      callbacks.splice(found, 1);

      if (callbacks.length === 0) {
        _events.delete(name);
      }
    }
  }

  trigger(name, ...args) {
    this._trigger(name, false, ...args);
  }

  triggerLater(name, ...args) {
    this._trigger(name, true, ...args);
  }

  _trigger(name, delayed, ...args) {
    if (typeof name !== 'string') {
      throw new Error('`name` is not type of String!');
    }

    const { _events, _onQueue, _offQueue } = this;

    if (this._triggerDepth <= 0) {
      for (let i = 0, c = _onQueue.length; i < c; ++i) {
        const { name, callback } = _onQueue[i];

        this.on(name, callback);
      }

      for (let i = 0, c = _offQueue.length; i < c; ++i) {
        const { name, callback } = _offQueue[i];

        this.off(name, callback);
      }

      this._onQueue = [];
      this._offQueue = [];
    }

    const callbacks = _events.get(name);

    if (!callbacks) {
      return;
    }

    if (!!delayed) {
      for (let i = 0, c = callbacks.length; i < c; ++i) {
        setTimeout((callback) => {
          try {
            callback(...args);
          } catch (error) {
            console.error(error);
          }
        }, 0, callbacks[i]);
      }
    } else {
      ++this._triggerDepth;
      for (let i = 0, c = callbacks.length; i < c; ++i) {
        try {
          callbacks[i](...args);
        } catch (error) {
          console.error(error);
        }
      }
      --this._triggerDepth;
    }
  }

}
