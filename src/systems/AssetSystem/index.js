import System from '../System';
import Asset from './Asset';
import Events from '../../utils/Events';

export { Asset };

const _pathRegex = /(\w+)(\:\/\/)(.*)/;

/**
 * Assets database and loader.
 *
 * @example
 * const system = new AssetSystem('assets/', { cached: true }, AssetSystem.fetchArrayView);
 */
export default class AssetSystem extends System {

  /**
   * Default browser fetch mechanism.
   *
   * @param {*}	args - Fetch engine parameters.
   *
   * @return {Promise} Promise that fetches file.
   */
  static fetch(...args) {
    return fetch(...args);
  }

  /**
   * Custom fetch mechanism that loads data from array view.
   *
   * @param {ArrayBufferView}	view - Data array buffer view.
   * @param {string}	path - Asset path.
   * @param {*}	options - Fetch engine options.
   * @param {Function}	fallbackEngine - Fallback fetch engine.
   *
   * @return {Promise} Promise that fetches file from array view.
   */
  static fetchArrayView(view, path, options = {}, fallbackEngine = null) {
    if (!!view && !ArrayBuffer.isView(view)) {
      throw new Error('`view` is not type of ArrayView!');
    }
    if (typeof path !== 'string') {
      throw new Error('`path` is not type of String!');
    }
    if (!!fallbackEngine && !(fallbackEngine instanceof Function)) {
      throw new Error('`fallbackEngine` is not type of Function!');
    }

    try {
      if (!view) {
        if (!!fallbackEngine) {
          return fallbackEngine(path, options);
        } else {
          return Promise.resolve(new Response(new Blob(), { status: 404 }));
        }
      } else {
        return Promise.resolve(
          new Response(new Blob([ view ]), { status: 200 })
        );
      }
    } catch(error) {
      return Promise.reject(error);
    }
  }

  /** @type {string} */
  get pathPrefix() {
    return this._pathPrefix;
  }

  /** @type {*} */
  get fetchOptions() {
    return this._fetchOptions;
  }

  /** @type {Function} */
  get fetchEngine() {
    return this._fetchEngine;
  }

  /** @type {Function} */
  set fetchEngine(value) {
    if (!(value instanceof Function)) {
      throw new Error('`value` is not type of Function!');
    }

    this._fetchEngine = value;
  }

  /** @type {Events} */
  get events() {
    return this._events;
  }

  /**
   * Constructor.
   *
   * @param {string|null}	pathPrefix - Path prefix used for every requested asset or null no path prefix.
   * @param {*|null}	fetchOptions - Custom fetch options or null if default will be used.
   * @param {Function|null}	fetchEngine - Custom fetch engine or null if default will be used.
   */
  constructor(pathPrefix, fetchOptions, fetchEngine) {
    super();

    if (!!pathPrefix && typeof pathPrefix !== 'string') {
      throw new Error('`pathPrefix` is not type of String!');
    }

    this._pathPrefix = pathPrefix || '';
    this._fetchOptions = fetchOptions || {};
    this._fetchEngine = fetchEngine || AssetSystem.fetch;
    this._assets = new Map();
    this._loaders = new Map();
    this._events = new Events();
    this._loaded = 0;
    this._toLoad = 0;
  }

  /**
   * Destructor (dispose internal resources and clear assets database).
   *
   * @example
   * system.dispose();
   * system = null;
   */
  dispose() {
    const { _assets, _loaders, _events } = this;

    for (const asset of _assets.values()) {
      asset.dispose();
    }

    _assets.clear();
    _loaders.clear();
    _events.dispose();
  }

  /**
   * Register assets loader under given protocol.
   *
   * @param {string}	protocol - Assets loader protocol name.
   * @param {Function}	assetConstructor - Asset factory.
   *
   * @example
   * system.registerProtocol('json', JSONAsset.factory);
   */
  registerProtocol(protocol, assetConstructor) {
    if (typeof protocol !== 'string') {
      throw new Error('`protocol` is not type of String!');
    }
    if (!(assetConstructor instanceof Function)) {
      throw new Error('`assetConstructor` is not type of Function!');
    }

    const { _loaders } = this;

    if (_loaders.has(protocol)) {
      throw new Error(`There is already registered protocol: ${protocol}`);
    }

    _loaders.set(protocol, assetConstructor);
  }

  /**
   * Unregister given assets loader protocol.
   *
   * @param {string}	protocol - Assets loader protocol name.
   *
   * @example
   * system.unregisterProtocol('json');
   */
  unregisterProtocol(protocol) {
    if (typeof protocol !== 'string') {
      throw new Error('`protocol` is not type of String!');
    }
    if (!this._loaders.delete(protocol)) {
      throw new Error(`There is no registered protocol: ${protocol}`);
    }
  }

  /**
   * Get asset by it's full path.
   *
   * @param {string}	path - Asset path (with protocol).
   *
   * @return {Asset|null} Asset instance if found or null otherwise.
   *
   * @example
   * const config = system.get('json://config.json');
   */
  get(path) {
    if (typeof path !== 'string') {
      throw new Error('`path` is not type of String!');
    }

    return this._assets.get(path) || null;
  }

  /**
   * Load asset from given path.
   *
   * @param {string}	path - Asset path (with protocol).
   *
   * @return {Promise} Promise of fetch engine loader.
   *
   * @example
   * system.load('json://config.json').then(asset => console.log(asset.data));
   */
  load(path) {
    this._events.trigger('progress', this._loaded, this._toLoad);
    ++this._toLoad;
    return this._load(path)
      .then(asset => {
        ++this._loaded;
        this._events.trigger('progress', this._loaded, this._toLoad);
        --this._loaded;
        --this._toLoad;
        this._events.trigger('progress', this._loaded, this._toLoad);
        return asset;
      })
      .catch(error => {
        ++this._loaded;
        this._events.trigger('progress', this._loaded, this._toLoad);
        --this._loaded;
        --this._toLoad;
        this._events.trigger('progress', this._loaded, this._toLoad);
        throw error;
      });
  }

  /**
   * Load list of assets in sequence (one by one).
   *
   * @param {array}	paths - Array of assets paths.
   *
   * @return {Promise} Promise of fetch engine loader.
   *
   * @example
   * const list = [ 'json://config.json', 'text://hello.txt' ];
   * system.loadSequence(list).then(assets => console.log(assets.map(a => a.data)));
   */
  async loadSequence(paths) {
    if (!(paths instanceof Array)) {
      throw new Error('`paths` is not type of Array!');
    }

    const result = [];
    this._events.trigger('progress', this._loaded, this._toLoad);
    this._toLoad += paths.length;
    for (let i = 0, c = paths.length; i < c; ++i) {
      result.push(
        await this._load(paths[i])
          .then(asset => {
            ++this._loaded;
            this._events.trigger('progress', this._loaded, this._toLoad);
            return asset;
          })
          .catch(error => {
            ++this._loaded;
            this._events.trigger('progress', this._loaded, this._toLoad);
            throw error;
          })
      );
    }

    this._loaded -= paths.length;
    this._toLoad -= paths.length;
    this._events.trigger('progress', this._loaded, this._toLoad);
    return result;
  }

  /**
   * Load list of assets possibly all at the same time (asynchronously).
   *
   * @param {array}	paths - Array of assets paths.
   *
   * @return {Promise} Promise of fetch engine loader.
   *
   * @example
   * const list = [ 'json://config.json', 'text://hello.txt' ];
   * system.loadAll(list).then(assets => console.log(assets.map(a => a.data)));
   */
  async loadAll(paths) {
    if (!(paths instanceof Array)) {
      throw new Error('`paths` is not type of Array!');
    }

    this._events.trigger('progress', this._loaded, this._toLoad);
    this._toLoad += paths.length;
    return Promise.all(paths.map(
      path => this._load(path)
        .then(asset => {
          ++this._loaded;
          this._events.trigger('progress', this._loaded, this._toLoad);
          return asset;
        })
        .catch(error => {
          ++this._loaded;
          this._events.trigger('progress', this._loaded, this._toLoad);
          throw error;
        })
    ))
    .then(assets => {
      this._loaded -= paths.length;
      this._toLoad -= paths.length;
      this._events.trigger('progress', this._loaded, this._toLoad);
      return assets;
    })
    .catch(error => {
      this._loaded -= paths.length;
      this._toLoad -= paths.length;
      this._events.trigger('progress', this._loaded, this._toLoad);
      throw error;
    });
  }

  /**
   * Unload asset by path and remove from database.
   *
   * @param {string}	path - Asset path (with protocol).
   *
   * @example
   * system.unload('json://config.json');
   */
  unload(path) {
    const { _assets } = this;
    const asset = _assets.get(path);

    if (!asset) {
      throw new Error(`Trying to unload non-existing asset: ${path}`);
    }

    this._events.trigger('unload', asset);
    asset.dispose();
    _assets.delete(path);
  }

  /**
   * Unload all assets from paths list.
   *
   * @param {array}	paths - Array of assets paths.
   */
  unloadAll(paths) {
    if (!(paths instanceof Array)) {
      throw new Error('`paths` is not type of Array!');
    }

    for (const path of paths) {
      this.unload(path);
    }
  }

  /**
   * @override
   */
  onUnregister() {
    dispose();
  }

  _load(path) {
    if (typeof path !== 'string') {
      throw new Error('`path` is not type of String!');
    }

    const found = path.lastIndexOf('|');
    if (found < 0) {
      return this._loadPart(path);
    } else {
      const prefix = path.substr(0, found).trim();
      const container = this._assets.get(prefix);
      if (!container) {
        throw new Error(`There is no loaded subassets container: ${prefix}`);
      }

      const oldEngine = this.fetchEngine;
      const postfix = path.substr(found + 1).trim();
      this.fetchEngine = container.makeFetchEngine(oldEngine);
      return this._loadPart(postfix, path).finally(() => {
        this.fetchEngine = oldEngine;
      });
    }
  }

  _loadPart(path, key = null) {
    if (typeof path !== 'string') {
      throw new Error('`path` is not type of String!');
    }
    if (!key) {
      key = path;
    }

    const result = _pathRegex.exec(path);
    if (!result) {
      throw new Error(`\`path\` does not conform asset path name rules: ${path}`);
    }

    const [ , protocol,, filename ] = result;
    const loader = this._loaders.get(protocol);
    if (!loader) {
      throw new Error(`There is no registered protocol: ${protocol}`);
    }

    const { _assets } = this;
    if (_assets.has(path)) {
      return Promise.resolve(_assets.get(path));
    }

    const asset = loader(this, protocol, filename);
    if (!(asset instanceof Asset)) {
      throw new Error(
        `Cannot create asset for file: ${filename} of protocol: ${protocol}`
      );
    }

    return asset.load().then(data => {
      this._assets.set(key, asset);
      this._events.trigger('load', asset);
      return data;
    });
  }

}
