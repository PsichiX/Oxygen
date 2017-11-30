import System from './System';
import Events from '../utils/Events';
import { createAudioContext, createWaver } from 'waver-js';

export default class AudioSystem extends System {

  get context() {
    return this._context;
  }

  get events() {
    return this._events;
  }

  constructor() {
    super();

    this._context = createAudioContext();
    this._events = new Events();
    this._wavers = new Map();
    this._sounds = new Map();
    this._musics = new Map();
  }

  dispose() {
    for (const key of this._wavers.keys()) {
      this.unregisterWaver(key);
    }

    for (const key of this._sounds.keys()) {
      this.unregisterSound(key);
    }

    for (const key of this._musics.keys()) {
      this.unregisterMusic(key);
    }

    this._events.dispose();
    super.dispose();
  }

  registerWaver(id, source) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (typeof source !== 'string') {
      throw new Error('`source` is not type of String!');
    }

    const { _context } = this;
    const waver = createWaver(_context, source);
    if (!waver.valid) {
      waver.dispose();
      throw new Error(`Cannot compile waver: ${id}`);
    }

    this._wavers.set(id, waver);
  }

  unregisterWaver(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _wavers } = this;
    if (_wavers.has(id)) {
      _wavers.get(id).dispose();
      _wavers.delete(id);
    }
  }

  getWaver(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _wavers } = this;
    if (_wavers.has(id)) {
      return _wavers.get(id);
    }

    return null;
  }

  waverPlaySound(id, input, sound) {
    const waver = this.getWaver(id);
    if (!waver) {
      throw new Error(`There is no registered waver: ${id}`);
    }

    const source = this.playSound(sound);
    waver.bindInput(input, source);
    return source;
  }

  waverPlayMusic(id, input, music) {
    const waver = this.getWaver(id);
    if (!waver) {
      throw new Error(`There is no registered waver: ${id}`);
    }

    const source = this.playMusic(music);
    waver.bindInput(input, source);
    return source;
  }

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

  unregisterSound(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._sounds.delete(id);
  }

  hasSound(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._sounds.has(id);
  }

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

  registerMusic(id, audio) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }
    if (!(audio instanceof HTMLAudioElement)) {
      throw new Error('`audio` is not type of HTMLAudioElement');
    }

    this._musics.set(id, audio);
  }

  unregisterMusic(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    this._musics.delete(id);
  }

  hasMusic(id) {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    return this._musics.has(id);
  }

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
