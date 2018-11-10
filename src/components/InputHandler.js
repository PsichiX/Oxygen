import Script from './Script';
import System from '../systems/System';

const ControlDevice = {
  NONE: 'none',
  MOUSE_KEYBOARD: 'mouse-keyboard',
  GAMEPAD: 'gamepad',
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

/**
 * Simple yet powerful input handler.
 *
 * @example
 * const component = new InputHandler();
 * component.deserialize({ requireGamepad: true });
 */
export default class InputHandler extends Script {

  /**
   * Component factory.
   *
   * @return {InputHandler} Component instance.
   */
  static factory() {
    return new InputHandler();
  }

  /** @type {*} */
  static get propsTypes() {
    return {
      ...Script.propsTypes,
      requireGamepad: 'boolean',
      acceptMouse: 'boolean',
      acceptKeyboard: 'boolean',
      acceptGamepad: 'boolean',
      controlDeviceChangeTreshold: 'number',
      repeatingTriggersDelay: 'number',
      firstTriggersDelay: 'number',
      acceptFirstConnectedGamepad: 'boolean'
    };
  }

  /** @type {*} */
  static get ControlDevice() {
    return ControlDevice;
  }

  /** @type {boolean} */
  get requireGamepad() {
    return this._requireGamepad;
  }

  /** @type {boolean} */
  set requireGamepad(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._requireGamepad = value;
  }

  /** @type {boolean} */
  get acceptMouse() {
    return this._acceptMouse;
  }

  /** @type {boolean} */
  set acceptMouse(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptMouse = value;
  }

  /** @type {boolean} */
  get acceptKeyboard() {
    return this._acceptKeyboard;
  }

  /** @type {boolean} */
  set acceptKeyboard(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptKeyboard = value;
  }

  /** @type {boolean} */
  get acceptGamepad() {
    return this._acceptGamepad;
  }

  /** @type {boolean} */
  set acceptGamepad(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptGamepad = value;
  }

  /** @type {number} */
  get controlDeviceChangeTreshold() {
    return this._controlDeviceChangeTreshold;
  }

  /** @type {number} */
  set controlDeviceChangeTreshold(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._controlDeviceChangeTreshold = value;
  }

  /** @type {number} */
  get repeatingTriggersDelay() {
    return this._repeatingTriggersDelay;
  }

  /** @type {number} */
  set repeatingTriggersDelay(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._repeatingTriggersDelay = value;
  }

  /** @type {number} */
  get firstTriggersDelay() {
    return this._firstTriggersDelay;
  }

  /** @type {number} */
  set firstTriggersDelay(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._firstTriggersDelay = value;
  }

  /** @type {boolean} */
  get acceptFirstConnectedGamepad() {
    return this._acceptFirstConnectedGamepad;
  }

  /** @type {boolean} */
  set acceptFirstConnectedGamepad(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._acceptFirstConnectedGamepad = value;
  }

  /** @type {boolean} */
  get isAcquiringGamepad() {
    return !!this._acquireGamepad;
  }

  /** @type {*} */
  get axes() {
    const result = {};

    for (const [key, value] of this._axes) {
      result[key] = value;
    }

    return result;
  }

  /** @type {*} */
  get triggers() {
    const result = {};

    for (const [key, value] of this._triggers) {
      result[key] = value;
    }

    return result;
  }

  /** @type {number} */
  get gamepadIndex() {
    return this._gamepadIndex;
  }

  /** @type {string} */
  get lastControlDevice() {
    return this._lastControlDevice;
  }

  /**
   * Constructor.
   */
  constructor() {
    super();

    this._requireGamepad = false;
    this._acceptMouse = true;
    this._acceptKeyboard = true;
    this._acceptGamepad = true;
    this._controlDeviceChangeTreshold = 0.1;
    this._repeatingTriggersDelay = -1;
    this._firstTriggersDelay = -1;
    this._acceptFirstConnectedGamepad = false;
    this._configAxesMouse = new Map();
    this._configAxesKey = new Map();
    this._configAxesGamepad = new Map();
    this._configAxesGamepadAxis = new Map();
    this._configTriggersMouse = new Map();
    this._configTriggersKey = new Map();
    this._configTriggersGamepad = new Map();
    this._configTriggersGamepadAxis = new Map();
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

  /**
   * @override
   */
  dispose() {
    this.clear();

    this._acquireGamepad = null;
    this._gamepadIndex = -1;

    super.dispose();
  }

  /**
   * Clear all axes, triggers and configs.
   *
   * @example
   * component.clear();
   */
  clear() {
    this._configAxesMouse.clear();
    this._configAxesKey.clear();
    this._configAxesGamepad.clear();
    this._configAxesGamepadAxis.clear();
    this._configTriggersMouse.clear();
    this._configTriggersKey.clear();
    this._configTriggersGamepad.clear();
    this._configTriggersGamepadAxis.clear();
    this._axes.clear();
    this._axesPrev.clear();
    this._axesNext.clear();
    this._triggers.clear();
    this._triggersPrev.clear();
    this._triggersNext.clear();
    this._triggersTimers.clear();
  }

  /**
   * Setup axes and triggers.
   *
   * @param {*}	config - Configuration object.
   *
   * @example
   * component.setup({ axes: { 'pos-x': { mouse: 'x' } }, triggers: { action: { key: 32 } } });
   */
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
      }
    }
  }

  /**
   * Get value of given axis.
   *
   * @param {string}	id - Axis id.
   * @param {number}	treshold - Value treshold (if value is greater than treshold, return value, zero otherwise).
   *
   * @return {number} Axis value.
   *
   * @example
   * x += component.getAxis('pos-x');
   */
  getAxis(id, treshold = 0) {
    const result = this._axes.get(id) || 0;
    return Math.abs(result) > treshold ? result : 0;
  }

  /**
   * Get delta value of given axis.
   *
   * @param {string}	id - Axis id.
   *
   * @return {number} Axis value.
   *
   * @example
   * if (component.getAxisDelta('pos-y') < 0) { entity.performAction('jump'); }
   */
  getAxisDelta(id) {
    return (this._axes.get(id) || 0) - (this._axesPrev.get(id) || 0);
  }

  /**
   * Set given axis value.
   *
   * @param {string}	id - Axis id.
   * @param {number}	value - New axis value.
   *
   * @example
   * // reset axis to prevent further usage in this frame.
   * component.setAxis('pos-x', 0);
   */
  setAxis(id, value) {
    this._axes.set(id, Math.max(-1, Math.min(1, value || 0)));
  }

  /**
   * Tells if axis is currently hold.
   *
   * @param {string}	id - Axis id.
   * @param {number}	treshold - Value treshold (if value is greater than treshold, return true, false otherwise).
   *
   * @return {boolean} Holding state.
   *
   * @example
   * if (component.isAxisHold('pos-x')) { entity.performAction('animate', 'walk'); }
   */
  isAxisHold(id, treshold = 0.5) {
    return Math.abs(this.getAxis(id, treshold)) > 0;
  }

  /**
   * Tells if axis is pressed in current frame.
   *
   * @param {string}	id - Axis id.
   * @param {number}	treshold - Value treshold (if value is greater than treshold and axis was not hold in previous frame, return true, false otherwise).
   *
   * @return {boolean} Pressing state.
   *
   * @example
   * if (component.isAxisPressed('bow')) { entity.performAction('aim'); }
   */
  isAxisPressed(id, treshold = 0.5) {
    const current = Math.abs(this._axes.get(id) || 0) > treshold;
    const prev = Math.abs(this._axesPrev.get(id) || 0) > treshold;
    return current && !prev;
  }

  /**
   * Tells if axis is released in current frame.
   *
   * @param {string}	id - Axis id.
   * @param {number}	treshold - Value treshold (if value is smaller than treshold and axis was hold in previous frame, return true, false otherwise).
   *
   * @return {boolean} Releasing state.
   *
   * @example
   * if (component.isAxisReleased('bow')) { entity.performAction('fire'); }
   */
  isAxisReleased(id, treshold = 0.5) {
    const current = Math.abs(this._axes.get(id) || 0) > treshold;
    const prev = Math.abs(this._axesPrev.get(id) || 0) > treshold;
    return !current && prev;
  }

  /**
  * Get value of given trigger.
   *
   * @param {string}	id - Trigger id.
   * @param {number}	treshold - Value treshold (if value is greater than treshold, return value, zero otherwise).
   *
   * @return {number} Trigger value.
   *
   * @example
   * speed += component.getTrigger('accel');
   */
  getTrigger(id, treshold = 0) {
    const result = this._triggers.get(id) || 0;
    return result > treshold ? result : 0;
  }

  /**
   * Get delta value of given trigger.
   *
   * @param {string}	id - Trigger id.
   *
   * @return {number} Trigger value.
   *
   * @example
   * if (component.getTriggerDelta('pull') > 0) { entity.performAction('pull-rope'); }
   */
  getTriggerDelta(id) {
    return (this._triggers.get(id) || 0) - (this._triggersPrev.get(id) || 0);
  }

  /**
   * Set given trigger value.
   *
   * @param {string}	id - Trigger id.
   * @param {number}	value - New trigger value.
   *
   * @example
   * // reset trigger to prevent further usage in this frame.
   * component.setTrigger('pos-x', 0);
   */
  setTrigger(id, value) {
    this._triggers.set(id, Math.max(0, Math.min(1, value || 0)));
  }

  /**
   * Tells if trigger is currently hold.
   *
   * @param {string}	id - Trigger id.
   * @param {number}	treshold - Value treshold (if value is greater than treshold, return true, false otherwise).
   *
   * @return {boolean} Holding state.
   *
   * @example
   * if (component.isTriggerHold('swim')) { entity.performAction('swim'); }
   */
  isTriggerHold(id, treshold = 0.5) {
    return Math.abs(this.getTrigger(id, treshold)) > 0;
  }

  /**
   * Tells if trigger is pressed in current frame.
   *
   * @param {string}	id - Trigger id.
   * @param {number}	treshold - Value treshold (if value is greater than treshold and trigger was not hold in previous frame, return true, false otherwise).
   *
   * @return {boolean} Pressing state.
   *
   * @example
   * if (component.isTriggerPressed('jump')) { entity.performAction('jump'); }
   */
  isTriggerPressed(id, treshold = 0.5) {
    const current = Math.abs(this._triggers.get(id) || 0) > treshold;
    const prev = Math.abs(this._triggersPrev.get(id) || 0) > treshold;
    return current && !prev;
  }

  /**
   * Tells if trigger is released in current frame.
   *
   * @param {string}	id - Trigger id.
   * @param {number}	treshold - Value treshold (if value is smaller than treshold and trigger was hold in previous frame, return true, false otherwise).
   *
   * @return {boolean} Releasing state.
   *
   * @example
   * if (component.isTriggerReleased('fire')) { entity.performAction('fire'); }
   */
  isTriggerReleased(id, treshold = 0.5) {
    const current = Math.abs(this._triggers.get(id) || 0) > treshold;
    const prev = Math.abs(this._triggersPrev.get(id) || 0) > treshold;
    return !current && prev;
  }

  /**
   * Asynchronously acquire gamepad (specify trigger to press and waiting duration).
   *
   * @param {number}	trigger - Trigger index.
   * @param {number}	timeout - Waiting duration in milliseconds.
   *
   * @return {Promise} Waiting promise.
   *
   * @example
   * component.acquireGamepad(0).then(() => System.events.trigger('player-is-ready'));
   */
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

  /**
   * Release acquired gamepad.
   *
   * @example
   * if (gameOver) { component.releaseGamepad(); }
   */
  releaseGamepad() {
    this._gamepadIndex = -1;
  }

  /**
   * Manually acquire gamepad by it's index.
   *
   * @param {number}	index - Gamepad index.
   *
   * @example
   * component.setAcquiredGamepad(0);
   */
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

  /**
   * Get acquired gamepad instance.
   *
   * @return {Gamepad|null} Acquired gamepad instance or null.
   */
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

  /**
   * @override
   */
  onAttach() {
    this.listenTo = Script.EventFlags.INPUT;

    super.onAttach();
  }

  /**
   * @override
   */
  onDetach() {
    super.onDetach();

    this.listenTo = Script.EventFlags.INPUT;
    this.clear();
  }

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  /**
   * @override
   */
  onGamepadConnected(gamepad) {
    if (!this._acceptGamepad) {
      return;
    }

    if (this._gamepadIndex < 0 && this._acceptFirstConnectedGamepad) {
      this._gamepadIndex = gamepad.index;
    }
  }

  /**
   * @override
   */
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

  /**
   * @override
   */
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

  _applyControlDevice(device) {
    const { _lastControlDevice } = this;
    this._lastControlDevice = device;

    if (_lastControlDevice !== device) {
      System.events.trigger('input-handler-control-device', this, device);
    }
  }

}
