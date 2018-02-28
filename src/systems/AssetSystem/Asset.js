import AssetSystem from '.';

/**
 * Asset - base of any asset loader.
 */
export default class Asset {

  /** @type {AssetSystem} */
  get owner() {
    return this._owner;
  }

  /** @type {string} */
  get protocol() {
    return this._protocol;
  }

  /** @type {string} */
  get filename() {
    return this._filename;
  }

  /** @type {*} */
  get options() {
    return this._options;
  }

  /** @type {*} */
  get data() {
    return this._data;
  }

  /** @type {*} */
  set data(data) {
    this._data = data;
  }

  /**
   * Constructor.
   *
   * @param {AssetSystem}	owner - Asset owner.
   * @param {string}	protocol - Used protocol name.
   * @param {string}	filename - File name path.
   * @param {*} options - Options.
   */
  constructor(owner, protocol, filename, options = null) {
    if (!(owner instanceof AssetSystem)) {
      throw new Error('`owner` is not type of AssetSystem!');
    }
    if (typeof protocol !== 'string') {
      throw new Error('`protocol` is not type of String!');
    }
    if (typeof filename !== 'string') {
      throw new Error('`filename` is not type of String!');
    }

    this._owner = owner;
    this._protocol = protocol;
    this._filename = filename;
    this._options = options;
    this._data = null;
  }

  /**
   * Destructor (disposes internal resources).
   *
   * @example
   * asset.dispose();
   * asset = null;
   */
  dispose() {
    this._data = null;
    this._options = null;
  }

  /**
   * Load asset.
   *
   * @abstract
   * @return {Promise} Promise that loads asset.
   */
  load() {
    return Promise.reject(new Error('Cannot load generic empty asset!'));
  }

  /**
   * Use this asset as fetch engine and load part of it's content as asset.
   *
   * @param {string}	path - Asset path.
   * @param {*}	options - fetch engine options.
   *
   * @return {Promise} Promise that loads subasset.
   */
  fetchSubAsset(path, options) {
    return Promise.reject(new Error('Cannot fetch subasset! Asset is not a container!'));
  }

  /** @type {Function} */
  makeFetchEngine(fallbackEngine = AssetSystem.fetch) {
    return (path, options) => this.fetchSubAsset(path, options, fallbackEngine);
  }

  /**
   * Called when asset is loaded and ready to use.
   */
  onReady() {}

}
