import Script from './Script';
import System from '../systems/System';
import Events from '../utils/Events';
import { angleDifference } from '../utils';

function findFrame(time, frames) {
  for (let i = 0, c = frames.length; i < c; ++i) {
    const f = frames[i];
    if (time >= f.time) {
      return f;
    }
  }

  return null;
}

function findFrames(time, frames) {
  if (frames.length < 2) {
    const frame = findFrame(time, frames);
    if (!!frame) {
      return { a: frame, b: frame };
    }

    return null;
  }

  for (let i = 1, c = frames.length; i < c; ++i) {
    const a = frames[i - 1];
    const b = frames[i];
    if (time >= a.time && time < b.time) {
      return { a, b };
    }
  }

  return null;
}

function sampleValue(sampler, from, to, timeFrom, timeTo, time) {
  const dt = timeTo - timeFrom;
  if (Math.abs(dt) > 0) {
    time = Math.max(timeFrom, Math.min(timeTo, time));
    return (to - from) * sampler((time - timeFrom) / dt) + from;
  }
  return to;
}

export default class Skeleton extends Script {

  static factory() {
    return new Skeleton();
  }

  static get propsTypes() {
    return {
      ...Script.propsTypes,
      asset: 'string_null',
      skin: 'string_null',
      animation: 'string_null',
      loop: 'boolean',
      speed: 'number',
      time: 'number',
      paused: 'boolean'
    };
  }

  get asset() {
    return this._asset;
  }

  set asset(value) {
    if (!value) {
      this._asset = null;
      this._data = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._asset = value;
    this._slots = null;
    this._data = null;

    const { AssetSystem } = System.systems;
    if (!AssetSystem) {
      throw new Error('There is no registered AssetSystem!');
    }

    const asset = AssetSystem.get(`skeleton://${value}`);
    if (!asset) {
      throw new Error(`There is no asset loaded: ${value}`);
    }

    if (!!this.entity) {
      this.rebind();
    }

    this._data = asset.data;
    this._rebuildSkin = true;
  }

  get skin() {
    return this._skin;
  }

  set skin(value) {
    if (!value) {
      this._skin = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._skin = value;
    this._rebuildSkin = true;
  }

  get animation() {
    return this._animation;
  }

  set animation(value) {
    if (!value) {
      this._animation = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._animation = value;
  }

  get loop() {
    return this._loop;
  }

  set loop(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._loop = value;
  }

  get speed() {
    return this._speed;
  }

  set speed(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._speed = value;
  }

  get time() {
    return this._time;
  }

  set time(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._time = value;
  }

  get paused() {
    return this._paused;
  }

  set paused(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._paused = value;
  }

  get events() {
    return this._events;
  }

  constructor() {
    super();

    this._events = new Events();
    this._asset = null;
    this._skin = 'default';
    this._animation = null;
    this._speed = 1;
    this._loop = true;
    this._time = 0;
    this._paused = false;
    this._data = null;
    this._slots = null;
    this._bones = null;
    this._rebuildSkin = false;
  }

  dispose() {
    super.dispose();

    const { _events } = this;
    if (!!_events) {
      _events.dispose();
    }

    this._events = null;
    this._asset = null;
    this._animation = null;
    this._slots = null;
    this._data = null;
    this._slots = null;
    this._bones = null;
  }

  rebind() {
    const { entity, _data } = this;
    if (!entity || !_data) {
      return;
    }

    const slots = this._slots = {};
    const bones = this._bones = {};
    for (const key in _data.slots) {
      slots[key] = entity.findEntity(_data.slots[key]);
    }
    for (const key in _data.bones) {
      bones[key] = entity.findEntity(_data.bones[key]);
    }
  }

  applySkin(id = 'default') {
    if (typeof id !== 'string') {
      throw new Error('`id` is not type of String!');
    }

    const { _data, _slots } = this;
    if (!_data) {
      throw new Error('There is no skeleton data!');
    }
    if (!_slots) {
      throw new Error('There are no slots bindings!');
    }

    const { skins } = _data;
    if (!skins) {
      throw new Error('There are no skins in skeleton data!');
    }

    const skin = skins[id];
    if (!skin) {
      throw new Error(`Skin not found in skeleton data: ${id}`);
    }

    for (const key in _slots) {
      const slot = skin[key] || skins.default[key];
      if (!slot) {
        console.warn(`There is no slot in skeleton data: ${key}`);
        continue;
      }

      const attachmentName = Object.keys(slot)[0];
      if (!attachmentName) {
        console.warn(`There are no attachments in slot: ${key}`);
        continue;
      }

      this._applyAttachment(_slots[key], slot, attachmentName);
    }
  }

  applyAnimationFrame(id, time, loop = false) {
    const { _data, _slots, _bones, _skin } = this;
    if (!_data) {
      throw new Error('There is no skeleton data!');
    }

    const { animations, attachments, skins, pose } = _data;
    if (!animations) {
      throw new Error('There are no animations in skeleton data!');
    }
    if (!skins) {
      throw new Error('There are no skins in skeleton data!');
    }
    if (!pose) {
      throw new Error('There is no pose in skeleton data!');
    }

    const skin = skins[_skin];
    if (!skin) {
      throw new Error(`Skin not found in skeleton data: ${id}`);
    }

    const animation = animations[id];
    if (!animation) {
      throw new Error(`There is no animation: ${id}`);
    }

    const { bones, slots, duration } = animation;
    if (!!loop) {
      time = time % duration;
    }

    if (!!bones) {
      for (const boneKey in bones) {
        const bone = _bones[boneKey];
        if (!bone) {
          console.warn(`There is no bone: ${boneKey}`);
          continue;
        }

        const timelines = bones[boneKey];
        const { translate, rotate, scale } = timelines;
        const p = pose[boneKey];
        if (!!translate) {
          const frame = findFrames(time, translate);
          if (!!frame) {
            const { a, b } = frame;
            const { sample } = a;
            if (!!sample) {
              bone.setPosition(
                p.x + sampleValue(sample, a.x, b.x, a.time, b.time, time),
                p.y + sampleValue(sample, a.y, b.y, a.time, b.time, time)
              );
            }
          }
        }
        if (!!rotate) {
          const frame = findFrames(time, rotate);
          if (!!frame) {
            const { a, b } = frame;
            const { sample } = a;
            if (!!sample) {
              bone.setRotation(
                (p.rotation + sampleValue(
                  sample,
                  a.angle,
                  a.angle + angleDifference(b.angle, a.angle),
                  a.time,
                  b.time,
                  time
                )) * Math.PI / 180
              );
            }
          }
        }
        if (!!scale) {
          const frame = findFrames(time, scale);
          if (!!frame) {
            const { a, b } = frame;
            const { sample } = a;
            if (!!sample) {
              bone.setScale(
                p.scaleX + sampleValue(sample, a.x, b.x, a.time, b.time, time),
                p.scaleY + sampleValue(sample, a.y, b.y, a.time, b.time, time)
              );
            }
          }
        }
      }
    }

    if (!!slots) {
      for (const slotKey in slots) {
        const slot = _slots[slotKey];
        if (!slot) {
          console.warn(`There is no slot: ${slotKey}`);
          continue;
        }

        const timelines = slots[slotKey];
        const { attachment } = timelines;
        if (!!attachment) {
          const frame = findFrame(time, attachment);
          if (!!frame) {
            this._applyAttachment(
              slot,
              skin[slotKey] || skins.default[slotKey],
              attachment.name
            );
          }
        }
      }
    }
  }

  playAnimation(id, looped = false) {
    this.time = 0;
    this.loop = looped;
    this.animation = id;
  }

  stopAnimation() {
    this.time = 0;
    this.animation = null;
  }

  onAttach() {
    super.onAttach();
    this.rebind();
  }

  onUpdate(deltaTime) {
    deltaTime *= 0.001;
    const { _rebuildSkin, _skin, _animation, _loop, _time } = this;

    if (_rebuildSkin) {
      this._rebuildSkin = false;
      this.applySkin(_skin);
    }

    if (!!_animation && !this._paused) {
      this.applyAnimationFrame(_animation, _time, _loop);
      this._time += deltaTime * this._speed;
      this._performAnimationEvents(_animation, _time, this._time, _loop);
    }
  }

  _performAnimationEvents(id, timePrev, time, loop) {
    const { _data, _events } = this;
    if (!_data) {
      throw new Error('There is no skeleton data!');
    }

    const { animations } = _data;
    if (!animations) {
      throw new Error('There are no animations in skeleton data!');
    }

    const animation = animations[id];
    if (!animation) {
      throw new Error(`There is no animation: ${id}`);
    }

    const { events, duration } = animation;
    const diff = time - timePrev;
    if (!!loop) {
      time = time % duration;
      timePrev = time - diff;
    }

    if (!!events) {
      for (const event of events) {
        if (event.time >= timePrev && event.time < time) {
          const { name } = event;
          if (name.startsWith('#')) {
            System.events.trigger(name.substr(1), event.int, event.float, event.string);
          } else {
            _events.trigger(name, event.int, event.float, event.string);
          }
        }
      }
    }
  }

  _applyAttachment(node, slot, id) {
    const atlasFrame = this._data.attachments[id];
    if (!atlasFrame) {
      console.warn(`There is no attachment in skeleton data: ${id}`);
      return;
    }

    const attachment = slot[id];
    if (!attachment) {
      console.warn(`There is no attachment in skeleton slots data: ${id}`);
      return;
    }

    const renderer = node.getComponent('AtlasSprite');
    renderer.atlas = atlasFrame;
    renderer.xOrigin = 0.5;
    renderer.yOrigin = 0.5;
    if ('width' in attachment) {
      renderer.width = attachment.width;
    }
    if ('height' in attachment) {
      renderer.height = attachment.height;
    }
    node.setPosition(attachment.x || 0, attachment.y || 0);
    node.setRotation((attachment.rotation || 0) * Math.PI / 180);
    node.setScale(attachment.scaleX || 1, attachment.scaleY || 1);
  }

}
