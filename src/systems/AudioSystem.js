import System from './System';
import Events from '../utils/Events';

const audioContext = window.AudioContext || window.webkitAudioContext;

/**
 * System used to manage audio.
 *
 * @example
 * const system = new AudioSystem();
 */
export default class AudioSystem extends System {

  /** @type {AudioContext} */
  get context() {
    return this._context;
  }

  /** @type {Events} */
  get events() {
    return this._events;
  }

  static createAudioContext() {
    return new audioContext();
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._context = AudioSystem.createAudioContext();
    this._events = new Events();
    this._sounds = new Map();
    this._musics = new Map();
  }

  /**
   * Destructor (dispose internal resources).
   *
   * @example
   * system.dispose();
   * system = null;
   */
  dispose() {
    for (const key of this._sounds.keys()) {
      this.unregisterSound(key);
    }

    for (const key of this._musics.keys()) {
      this.unregisterMusic(key);
    }

    this._context.close();
    this._events.dispose();
    this._context = null;
    this._events = null;
    this._sounds = null;
    this._musics = null;

    super.dispose();
  }

  /**
   * Register new sound.
   *
   * @param {string}	id - Sound id.
   * @param {ArrayBuffer|AudioBuffer}	data - Sound data.
   */
  registerSound(id, data) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    if (data instanceof ArrayBuffer) {
      this._context.decodeAudioData(data, buffer => this._sounds.set(id, buffer));
      this._sounds.set(id, null);
    } else if (data instanceof AudioBuffer) {
      this._sounds.set(id, data);
    } else {
      throw new Error('`data` is not type of either ArrayBuffer or AudioBuffer!');
    }
  }

  /**
   * Unregister existing sound.
   *
   * @param {string}	id - Sound id.
   */
  unregisterSound(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._sounds.delete(id);
  }

  /**
   * Tells if there is registered given sound.
   *
   * @param {string}	id - Sound id.
   *
   * @return {boolean} True if sound exists, false otherwise.
   */
  hasSound(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._sounds.has(id);
  }

  /**
   * Gets given sound instance.
   *
   * @param {string}	id - Sound id.
   *
   * @return {AudioBufferSourceNode|null} Sound audio buffer source node if found or null if not.
   */
  getSound(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _sounds } = this;
    if (_sounds.has(id)) {
      return _sounds.get(id);
    }

    return null;
  }

  /**
   * Play given sound.
   *
   * @param {string}	id - Sound id.
   * @param {boolean}	autoDestination - Tells if sound should be automaticaly bound with context destination.
   *
   * @return {AudioBufferSourceNode} Sound audio buffer source node.
   */
  playSound(id, autoDestination = true) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (typeof autoDestination !== 'boolean') {
      throw new Error('`boolean` is not type of Boolean!');
    }

    const { _context, _sounds } = this;
    if (!_sounds.has(id)) {
      throw new Error(`There is no registered sound: ${id}`);
    }

    const buffer = _sounds.get(id);
    if (!buffer) {
      throw new Error(`Sound is not yet ready: ${id}`);
    }

    const source = _context.createBufferSource();
    source.buffer = buffer;
    const onended = () => {
      source.disconnect();
      source.removeEventListener('ended', onended);
    };
    source.addEventListener('ended', onended);
    source.start();
    if (autoDestination) {
      source.connect(_context.destination);
    }
    return source;
  }

  /**
   * Produces promise that resolves when sound is decoded into memory (decoding is done asynchronously).
   *
   * @param {string}	id - Sound id.
   *
   * @return {Promise} Produced promise.
   *
   * @example
   * system.whenSoundIsReady('fire').then(() => system.playSound('fire'));
   */
  whenSoundIsReady(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _context, _sounds } = this;
    if (!_sounds.has(id)) {
      throw new Error(`There is no registered sound: ${id}`);
    }

    return new Promise((resolve, reject) => {
      let request = 0;

      const checkSound = () => {
        if (!_sounds.has(id)) {
          reject(new Error(`There is no registered sound: ${id}`));
          return;
        }

        const sound = _sounds.get(id);
        if (!!sound) {
          cancelAnimationFrame(request);
          resolve(sound);
        } else {
          request = requestAnimationFrame(checkSound);
        }
      };

      checkSound();
    });
  }

  /**
   * Register new music.
   *
   * @param {string}	id - Music id.
   * @param {HTMLAudioElement}	audio - HTML audio element.
   *
   * @example
   * system.registerMusic('ambient', document.getElementById('ambient'));
   */
  registerMusic(id, audio) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!(audio instanceof HTMLAudioElement)) {
      throw new Error('`audio` is not type of HTMLAudioElement');
    }

    this._musics.set(id, audio);
  }

  /**
   * Unregister existing music.
   *
   * @param {string}	id - Music id.
   */
  unregisterMusic(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._musics.delete(id);
  }

  /**
   * Tells if given music is registered.
   *
   * @param {string}	id - Music id.
   *
   * @return {boolean} True if music exists, false otherwise.
   */
  hasMusic(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._musics.has(id);
  }

  /**
   * Gets music instance.
   *
   * @param {string}	id - Music id.
   *
   * @return {HTMLAudioElement|null} Music instance if found, null otherwise.
   */
  getMusic(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _musics } = this;
    if (_musics.has(id)) {
      return _musics.get(id);
    }

    return null;
  }

  /**
   * Play given music.
   * Mostly you will be able to play only one music at the same time.
   *
   * @param {string}	id - Music id.
   *
   * @return {HTMLAudioElement} Music instance.
   */
  playMusic(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _context, _musics } = this;
    if (!_musics.has(id)) {
      throw new Error(`There is no registered music: ${id}`);
    }

    const music = _musics.get(id);
    let source = null;
    if (music.__source instanceof MediaElementAudioSourceNode) {
      source = music.__source;
    } else {
      source = _context.createMediaElementSource(music);
      music.__source = source;
    }

    const onended = () => {
      source.disconnect();
      source.removeEventListener('ended', onended);
    };
    source.addEventListener('ended', onended);
    music.currentTime = 0;
    music.play();
    return source;
  }

}
