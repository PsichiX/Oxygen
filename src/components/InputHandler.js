import Script from './Script';
import System from '../systems/System';

const ControlDevice = {
  NONE: 'none',
  MOUSE_KEYBOARD: 'mouse-keyboard',
  GAMEPAD: 'gamepad',
  LEAP: 'leap'
};
const regexLeapItem = /^(\w+)(-(\w+)(-(\w+))?)?$/;
const fingerTypes = {
  thumb: 0,
  index: 1,
  middle: 2,
  ring: 3,
  pinky: 4
};
const boneTypes = {
  metacarpal: 0,
  proximal: 1,
  intermediate: 2,
  distal: 3
};

function getGamepadAxisById(axes, id) {
  if (id === 'primary-x') {
    return axes[0];
  } else if (id === 'primary-y') {
    return axes[1];
  } else if (id === 'secondary-x') {
    return axes[2];
  } else if (id === 'secondary-y') {
    return axes[3];
  } else if (id === 'primary-left') {
    return -Math.min(0, axes[0]);
  } else if (id === 'primary-right') {
    return Math.max(0, axes[0]);
  } else if (id === 'primary-up') {
    return -Math.min(0, axes[1]);
  } else if (id === 'primary-down') {
    return Math.max(0, axes[1]);
  } else if (id === 'secondary-left') {
    return -Math.min(0, axes[2]);
  } else if (id === 'secondary-right') {
    return Math.max(0, axes[2]);
  } else if (id === 'secondary-up') {
    return -Math.min(0, axes[3]);
  } else if (id === 'secondary-down') {
    return Math.max(0, axes[3]);
  } else {
    return 0;
  }
}

function getLeapItemById(frame, id) {
  const matches = regexLeapItem.exec(id);
  const hand_type = matches[1];
  const hand = frame.hands.find(h => h.type === hand_type) || null;
  if (!hand) {
    return null;
  }

  hand.isHand = true;
  const finger_type = matches[3];
  const finger = hand.fingers.find(f => f.type === fingerTypes[finger_type]);
  if (!finger) {
    return hand;
  }

  finger.isFinger = true;
  const bone_type = matches[5];
  const bone = finger.bones.find(b => b.type === boneTypes[bone_type]);
  if (!bone) {
    return finger;
  }

  bone.isBone = true;
  return bone;
}

function getLeapAxisById(frame, id) {
  if (id.startsWith('pos-')) {
    const item = getLeapItemById(frame, id.substr(6));
    if (!item) {
      return 0;
    }

    let pos = !!item.isHand ? item.palmPosition : item.tipPosition;
    if (!pos) {
      return 0;
    }
    pos = frame.interactionBox.normalizePoint(pos);
    if (id.startsWith('pos-x-')) {
      return pos[0] * 2 - 1;
    } else if (id.startsWith('pos-y-')) {
      return pos[1] * 2 - 1;
    } else if (id.startsWith('pos-z-')) {
      return pos[2] * 2 - 1;
    }
  } else if (id.startsWith('dir-')) {
    const item = getLeapItemById(frame, id.substr(6));
    if (!item) {
      return 0;
    }

    const dir = item.direction;
    if (!dir) {
      return 0;
    }
    if (id.startsWith('dir-x-')) {
      return dir[0];
    } else if (id.startsWith('dir-y-')) {
      return dir[1];
    } else if (id.startsWith('dir-z-')) {
      return dir[2];
    }
  } else if (id === 'pinch-left') {
    const hand = frame.hands.find(h => h.type === 'left');
    return !!hand ? hand.pinchStrength : 0;
  } else if (id === 'pinch-right') {
    const hand = frame.hands.find(h => h.type === 'right');
    return !!hand ? hand.pinchStrength : 0;
  } else if (id === 'grab-left') {
    const hand = frame.hands.find(h => h.type === 'left');
    return !!hand ? hand.grabStrength : 0;
  } else if (id === 'grab-right') {
    const hand = frame.hands.find(h => h.type === 'right');
    return !!hand ? hand.grabStrength : 0;
  } else if (id === 'confidence-left') {
    const hand = frame.hands.find(h => h.type === 'left');
    return !!hand ? hand.confidence : 0;
  } else if (id === 'confidence-right') {
    const hand = frame.hands.find(h => h.type === 'right');
    return !!hand ? hand.confidence : 0;
  }

  return 0;
}

export default class InputHandler extends Script {

  static factory() {
    return new InputHandler();
  }

  static propsTypes() {
    return {
      ...Script.propsTypes,
      requireGamepad: 'boolean',
      acceptMouse: 'boolean',
      acceptKeyboard: 'boolean',
      acceptGamepad: 'boolean',
      acceptLeap: 'boolean',
      controlDeviceChangeTreshold: 'number',
      repeatingTriggersDelay: 'number',
      firstTriggersDelay: 'number',
      acceptFirstConnectedGamepad: 'boolean'
    };
  }

  static get ControlDevice() {
    return ControlDevice;
  }

  get requireGamepad() {
    return this._requireGamepad;
  }

  set requireGamepad(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._requireGamepad = value;
  }

  get acceptMouse() {
    return this._acceptMouse;
  }

  set acceptMouse(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptMouse = value;
  }

  get acceptKeyboard() {
    return this._acceptKeyboard;
  }

  set acceptKeyboard(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptKeyboard = value;
  }

  get acceptGamepad() {
    return this._acceptGamepad;
  }

  set acceptGamepad(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptGamepad = value;
  }

  get acceptLeap() {
    return this._acceptLeap;
  }

  set acceptLeap(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptLeap = value;
  }

  get controlDeviceChangeTreshold() {
    return this._controlDeviceChangeTreshold;
  }

  set controlDeviceChangeTreshold(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._controlDeviceChangeTreshold = value;
  }

  get repeatingTriggersDelay() {
    return this._repeatingTriggersDelay;
  }

  set repeatingTriggersDelay(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._repeatingTriggersDelay = value;
  }

  get firstTriggersDelay() {
    return this._firstTriggersDelay;
  }

  set firstTriggersDelay(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._firstTriggersDelay = value;
  }

  get acceptFirstConnectedGamepad() {
    return this._acceptFirstConnectedGamepad;
  }

  set acceptFirstConnectedGamepad(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptFirstConnectedGamepad = value;
  }

  get isAcquiringGamepad() {
    return !!this._acquireGamepad;
  }

  get axes() {
    const result = {};

    for (const [key, value] of this._axes) {
      result[key] = value;
    }

    return result;
  }

  get triggers() {
    const result = {};

    for (const [key, value] of this._triggers) {
      result[key] = value;
    }

    return result;
  }

  get gamepadIndex() {
    return this._gamepadIndex;
  }

  get lastControlDevice() {
    return this._lastControlDevice;
  }

  constructor() {
    super();

    this._requireGamepad = false;
    this._acceptMouse = true;
    this._acceptKeyboard = true;
    this._acceptGamepad = true;
    this._acceptLeap = true;
    this._controlDeviceChangeTreshold = 0.1;
    this._repeatingTriggersDelay = -1;
    this._firstTriggersDelay = -1;
    this._acceptFirstConnectedGamepad = false;
    this._configAxesMouse = new Map();
    this._configAxesKey = new Map();
    this._configAxesGamepad = new Map();
    this._configAxesGamepadAxis = new Map();
    this._configAxesLeap = new Map();
    this._configTriggersMouse = new Map();
    this._configTriggersKey = new Map();
    this._configTriggersGamepad = new Map();
    this._configTriggersGamepadAxis = new Map();
    this._configTriggersLeap = new Map();
    this._axes = new Map();
    this._axesPrev = new Map();
    this._axesNext = new Map();
    this._triggers = new Map();
    this._triggersPrev = new Map();
    this._triggersNext = new Map();
    this._triggersTimers = new Map();
    this._acquireGamepad = null;
    this._gamepadIndex = -1;
    this._lastControlDevice = ControlDevice.NONE;
  }

  dispose() {
    this.clear();

    this._acquireGamepad = null;
    this._gamepadIndex = -1;

    super.dispose();
  }

  clear() {
    this._configAxesMouse.clear();
    this._configAxesKey.clear();
    this._configAxesGamepad.clear();
    this._configAxesGamepadAxis.clear();
    this._configAxesLeap.clear();
    this._configTriggersMouse.clear();
    this._configTriggersKey.clear();
    this._configTriggersGamepad.clear();
    this._configTriggersGamepadAxis.clear();
    this._configTriggersLeap.clear();
    this._axes.clear();
    this._axesPrev.clear();
    this._axesNext.clear();
    this._triggers.clear();
    this._triggersPrev.clear();
    this._triggersNext.clear();
    this._triggersTimers.clear();
  }

  setup(config) {
    this.clear();

    if (!config) {
      return;
    }

    const { axes, triggers } = config;

    if (!!axes) {
      for (const name in axes) {
        const axis = axes[name];
        if (!axis) {
          continue;
        }

        const {
          mouse,
          keys,
          gamepad,
          gamepadAxis,
          leap
        } = axis;
        if (typeof mouse === 'string') {
          this._configAxesMouse.set(name, mouse);
        }

        if (keys instanceof Array && keys.length === 4) {
          this._configAxesKey.set(
            name,
            keys.map(item => typeof item === 'string'
              ? item.charCodeAt(0)
              : item
            )
          );
        }

        if (typeof gamepad === 'number') {
          this._configAxesGamepad.set(name, gamepad);
        }

        if (typeof gamepadAxis === 'string') {
          this._configAxesGamepadAxis.set(name, gamepadAxis);
        }

        if (typeof leap === 'string') {
          this._configAxesLeap.set(name, leap);
        }
      }
    }

    if (!!triggers) {
      for (const name in triggers) {
        const trigger = triggers[name];
        if (!trigger) {
          continue;
        }

        const {
          mouse,
          key,
          gamepad,
          gamepadAxis,
          leap
        } = trigger;
        if (typeof mouse === 'number') {
          this._configTriggersMouse.set(name, mouse);
        } else if (typeof mouse === 'string') {
          if (mouse === 'left') {
            this._configTriggersMouse.set(name, 0);
          } else if (mouse === 'middle') {
            this._configTriggersMouse.set(name, 1);
          } else if (mouse === 'right') {
            this._configTriggersMouse.set(name, 2);
          }
        }

        if (typeof key === 'number') {
          this._configTriggersKey.set(name, key);
        } else if (typeof key === 'string') {
          this._configTriggersKey.set(name, key.charCodeAt(0));
        }

        if (typeof gamepad === 'number') {
          this._configTriggersGamepad.set(name, gamepad);
        }

        if (typeof gamepadAxis === 'string') {
          this._configTriggersGamepadAxis.set(name, gamepadAxis)
        }

        if (typeof leap === 'string') {
          this._configTriggersLeap.set(name, leap);
        }
      }
    }
  }

  getAxis(id, treshold = 0) {
    const result = this._axes.get(id) || 0;
    return Math.abs(result) > treshold ? result : 0;
  }

  getAxisDelta(id) {
    return (this._axes.get(id) || 0) - (this._axesPrev.get(id) || 0);
  }

  setAxis(id, value) {
    this._axes.set(id, Math.max(-1, Math.min(1, value || 0)));
  }

  isAxisHold(id, treshold = 0.5) {
    return Math.abs(this.getAxis(id, treshold)) > 0;
  }

  isAxisPressed(id, treshold = 0.5) {
    const current = Math.abs(this._axes.get(id) || 0) > treshold;
    const prev = Math.abs(this._axesPrev.get(id) || 0) > treshold;
    return current && !prev;
  }

  isAxisReleased(id, treshold = 0.5) {
    const current = Math.abs(this._axes.get(id) || 0) > treshold;
    const prev = Math.abs(this._axesPrev.get(id) || 0) > treshold;
    return !current && prev;
  }

  getTrigger(id, treshold = 0) {
    const result = this._triggers.get(id) || 0;
    return result > treshold ? result : 0;
  }

  getTriggerDelta(id) {
    return (this._triggers.get(id) || 0) - (this._triggersPrev.get(id) || 0);
  }

  setTrigger(id, value) {
    this._triggers.set(id, Math.max(0, Math.min(1, value || 0)));
  }

  isTriggerHold(id, treshold = 0.5) {
    return Math.abs(this.getTrigger(id, treshold)) > 0;
  }

  isTriggerPressed(id, treshold = 0.5) {
    const current = Math.abs(this._triggers.get(id) || 0) > treshold;
    const prev = Math.abs(this._triggersPrev.get(id) || 0) > treshold;
    return current && !prev;
  }

  isTriggerReleased(id, treshold = 0.5) {
    const current = Math.abs(this._triggers.get(id) || 0) > treshold;
    const prev = Math.abs(this._triggersPrev.get(id) || 0) > treshold;
    return !current && prev;
  }

  acquireGamepad(trigger, timeout = 3000) {
    if (typeof trigger !== 'number') {
      throw new Error('`trigger` is not type of Number!');
    }
    if (typeof timeout !== 'number') {
      throw new Error('`timeout` is not type of Number!');
    }
    if (trigger < 0) {
      throw new Error('`trigger` cannot be less than 0!');
    }
    if (timeout <= 0) {
      throw new Error('`timeout` must be grater than 0!');
    }
    if (!!this._acquireGamepad) {
      throw new Error('Acquiring gamepad already in progress!');
    }

    this._gamepadIndex = -1;

    return new Promise((resolve, reject) => {
      const onTimeout = () => {
        this._acquireGamepad = null;
        this._gamepadIndex = -1;
        reject(new Error('Detecting gamepad timeout!'));
      };
      const timer = setTimeout(onTimeout, timeout);

      this._acquireGamepad = (value, index) => {
        if (value !== trigger) {
          return false;
        }

        this._acquireGamepad = null;
        this._gamepadIndex = index;
        clearTimeout(timer);
        resolve();
        return true;
      };
    });
  }

  releaseGamepad() {
    this._gamepadIndex = -1;
  }

  setAcquiredGamepad(index) {
    const { InputSystem } = System.systems;

    if (!!InputSystem) {
      for (const gamepad of InputSystem.gamepads.values()) {
        if (index === gamepad.index) {
          this._gamepadIndex = index;
          return;
        }
      }
    }
  }

  getAcquiredGamepad() {
    const { InputSystem } = System.systems;

    if (!!InputSystem) {
      for (const gamepad of InputSystem.gamepads.values()) {
        if (gamepad.index === this._gamepadIndex) {
          return gamepad;
        }
      }
    }

    return null;
  }

  onAttach() {
    this.listenTo = Script.EventFlags.INPUT;

    super.onAttach();
  }

  onDetach() {
    super.onDetach();

    this.listenTo = Script.EventFlags.INPUT;
    this.clear();
  }

  onUpdate(deltaTime) {
    this._axesPrev.clear();
    this._triggersPrev.clear();

    for (const [key, value] of this._axes) {
      this._axesPrev.set(key, value);
    }

    for (const [key, value] of this._triggers) {
      this._triggersPrev.set(key, value);
    }

    for (const [key, value] of this._axesNext) {
      this._axes.set(key, value);
    }

    for (const [key, value] of this._triggersNext) {
      this._triggers.set(key, value);
    }

    this._axesNext.clear();
    this._triggersNext.clear();

    if (this._repeatingTriggersDelay > 0) {
      for (let [key, value] of this._triggersTimers) {
        value -= deltaTime;
        this._triggersTimers.set(key, value);
        if (value <= 0) {
          this._triggers.delete(key);
          this._triggersTimers.set(key, this._repeatingTriggersDelay);
        }
      }
    }
  }

  onMouseDown(unitVec, screenVec, button) {
    if (!this._acceptMouse) {
      return;
    }
    this._applyControlDevice(ControlDevice.MOUSE_KEYBOARD);

    for (const [key, value] of this._configTriggersMouse.entries()) {
      if (value === button) {
        this._triggersNext.set(key, 1);
        if (this._firstTriggersDelay > 0) {
          this._triggersTimers.set(key, this._firstTriggersDelay);
        }
      }
    }
  }

  onMouseUp(unitVec, screenVec, button) {
    if (!this._acceptMouse) {
      return;
    }
    this._applyControlDevice(ControlDevice.MOUSE_KEYBOARD);

    for (const [key, value] of this._configTriggersMouse.entries()) {
      if (value === button) {
        this._triggersNext.set(key, 0);
        if (this._firstTriggersDelay > 0) {
          this._triggersTimers.delete(key);
        }
      }
    }
  }

  onMouseMove(unitVec, screenVec) {
    if (!this._acceptMouse) {
      return;
    }
    this._applyControlDevice(ControlDevice.MOUSE_KEYBOARD);

    for (const [key, value] of this._configAxesMouse.entries()) {
      if (value === 'x') {
        this._axesNext.set(key, unitVec[0]);
      } else if (value === 'y') {
        this._axesNext.set(key, -unitVec[1]);
      }
    }
  }

  onKeyDown(code) {
    if (!this._acceptKeyboard) {
      return;
    }
    this._applyControlDevice(ControlDevice.MOUSE_KEYBOARD);

    for (const [key, value] of this._configTriggersKey.entries()) {
      if (value === code) {
        this._triggersNext.set(key, 1);
        if (this._firstTriggersDelay > 0) {
          this._triggersTimers.set(key, this._firstTriggersDelay);
        }
      }
    }

    for (const [key, value] of this._configAxesKey.entries()) {
      const [fc, fv, tc, tv] = value;
      if (fc === code) {
        this._axesNext.set(key, Math.max(-1, Math.min(1, fv)));
      } else if (tc === code) {
        this._axesNext.set(key, Math.max(-1, Math.min(1, tv)));
      }
    }
  }

  onKeyUp(code) {
    if (!this._acceptKeyboard) {
      return;
    }
    this._applyControlDevice(ControlDevice.MOUSE_KEYBOARD);

    for (const [key, value] of this._configTriggersKey.entries()) {
      if (value === code) {
        this._triggersNext.set(key, 0);
        if (this._firstTriggersDelay > 0) {
          this._triggersTimers.delete(key);
        }
      }
    }

    for (const [key, value] of this._configAxesKey.entries()) {
      const [fc, fv, tc, tv] = value;
      if (fc === code) {
        this._axesNext.set(key, 0);
      } else if (tc === code) {
        this._axesNext.set(key, 0);
      }
    }
  }

  onGamepadConnected(gamepad) {
    if (!this._acceptGamepad) {
      return;
    }

    if (this._gamepadIndex < 0 && this._acceptFirstConnectedGamepad) {
      this._gamepadIndex = gamepad.index;
    }
  }

  onGamepadDisconnected(gamepad) {
    if (!this._acceptGamepad) {
      return;
    }

    const {
      _axes,
      _axesPrev,
      _axesNext,
      _triggers,
      _triggersPrev,
      _triggersNext,
      _triggersTimers
    } = this;
    const { index } = gamepad;

    for (const key of [..._axes.keys()]) {
      if (key.endsWith(`:${index}`)) {
        _axes.delete(key);
        _axesPrev.delete(key);
        _axesNext.delete(key);
      }
    }

    for (const key of [..._triggers.keys()]) {
      if (key.endsWith(`:${index}`)) {
        _triggers.delete(key);
        _triggersPrev.delete(key);
        _triggersNext.delete(key);
        _triggersTimers.delete(key);
      }
    }

    if (this._gamepadIndex === index) {
      this._gamepadIndex = -1;
    }
  }

  onGamepadProcess(gamepad) {
    if (!this._acceptGamepad) {
      return;
    }

    const { index, buttons, axes } = gamepad;
    const {
      _controlDeviceChangeTreshold,
      _triggersTimers,
      _firstTriggersDelay
    } = this;

    if (!!this._acquireGamepad) {
      for (let i = 0, c = buttons.length; i < c; ++i) {
        if (buttons[i].value > 0 && this._acquireGamepad(i, index)) {
          break;
        }
      }
    }

    if (this._requireGamepad && this._gamepadIndex < 0) {
      return;
    }

    for (const [key, value] of this._configTriggersGamepad.entries()) {
      const button = buttons[value];

      if (!!button) {
        if (this._gamepadIndex < 0 || this._gamepadIndex === index) {
          this._triggersNext.set(key, button.value || 0);
          this._triggersNext.set(`${key}:${index}`, button.value || 0);

          if (_firstTriggersDelay > 0) {
            if (button.value || 0 > 0) {
              if (!_triggersTimers.has(key)) {
                _triggersTimers.set(key, _firstTriggersDelay);
                _triggersTimers.set(`${key}:${index}`, _firstTriggersDelay);
              }
            } else {
              _triggersTimers.delete(key);
              _triggersTimers.delete(`${key}:${index}`);
            }
          }

          if ((button.value || 0) > _controlDeviceChangeTreshold) {
            this._applyControlDevice(ControlDevice.GAMEPAD);
          }
        }
      }
    }

    for (const [key, value] of this._configTriggersGamepadAxis.entries()) {
      const axis = getGamepadAxisById(axes, value);

      if (this._gamepadIndex < 0 || this._gamepadIndex === index) {
        this._triggersNext.set(key, axis || 0);
        this._triggersNext.set(`${key}:${index}`, axis || 0);

        if (_firstTriggersDelay > 0) {
          if (Math.abs(axis || 0) > 0.5) {
            if (!_triggersTimers.has(key)) {
              _triggersTimers.set(key, _firstTriggersDelay);
              _triggersTimers.set(`${key}:${index}`, _firstTriggersDelay);
            }
          } else {
            _triggersTimers.delete(key);
            _triggersTimers.delete(`${key}:${index}`);
          }
        }

        if (Math.abs(axis || 0) > _controlDeviceChangeTreshold) {
          this._applyControlDevice(ControlDevice.GAMEPAD);
        }
      }
    }

    for (const [key, value] of this._configAxesGamepad.entries()) {
      const button = buttons[value];

      if (!!button) {
        if (this._gamepadIndex < 0 || this._gamepadIndex === index) {
          this._axesNext.set(key, button.value || 0);
          this._axesNext.set(`${key}:${index}`, button.value || 0);

          if ((button.value || 0) > _controlDeviceChangeTreshold) {
            this._applyControlDevice(ControlDevice.GAMEPAD);
          }
        }
      }
    }

    for (const [key, value] of this._configAxesGamepadAxis.entries()) {
      const axis = getGamepadAxisById(axes, value);

      if (this._gamepadIndex < 0 || this._gamepadIndex === index) {
        this._axesNext.set(key, axis || 0);
        this._axesNext.set(`${key}:${index}`, axis || 0);

        if (Math.abs(axis || 0) > _controlDeviceChangeTreshold) {
          this._applyControlDevice(ControlDevice.GAMEPAD);
        }
      }
    }
  }

  onLeapProcess(frame, leap) {
    if (!this._acceptLeap) {
      return;
    }

    this._applyControlDevice(ControlDevice.LEAP);

    for (const [key, value] of this._configAxesLeap.entries()) {
      const axis = getLeapAxisById(frame, value);
      this._axesNext.set(key, axis || 0);
    }

    for (const [key, value] of this._configTriggersLeap.entries()) {
      const axis = getLeapAxisById(frame, value);
      this._triggersNext.set(key, axis || 0);
    }
  }

  _applyControlDevice(device) {
    const { _lastControlDevice } = this;
    this._lastControlDevice = device;

    if (_lastControlDevice !== device) {
      System.events.trigger('input-handler-control-device', this, device);
    }
  }

}
