import System from './System';
import Events from '../utils/Events';
import { vec2 } from '../utils/gl-matrix';
import Leap from 'leapjs';

const cachedUnitsVector = vec2.create();
const cachedScreenVector = vec2.create();

export default class InputSystem extends System {

  get events() {
    return this._events;
  }

  get gamepads() {
    return this._gamepads;
  }

  get leap() {
    return this._leap;
  }

  get leapConnected() {
    return this._leapConnected;
  }

  get triggerEvents() {
    return this._triggerEvents;
  }

  constructor(canvas, triggerEvents = true) {
    super();

    this._canvas = canvas;
    this._events = new Events();
    this._gamepads = new Map();
    this._leap = new Leap.Controller({
      background: true,
      enableGestures: true
    });
    this._leapConnected = false;
    this._triggerEvents = !!triggerEvents;
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
  }

  onRegister() {
    this._canvas.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    this._leap.connect();
  }

  onUnregister() {
    this._canvas.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this._leap.disconnect();
  }

  onMouseDown(event, target) {
    this._canvasToUnitCoords(
      cachedUnitsVector,
      cachedScreenVector,
      event,
      target
    );
    !!this._triggerEvents && this._events.trigger(
      'mouse-down',
      cachedUnitsVector,
      cachedScreenVector,
      event.button
    );
  }

  onMouseUp(event, target) {
    this._canvasToUnitCoords(
      cachedUnitsVector,
      cachedScreenVector,
      event,
      target
    );
    !!this._triggerEvents && this._events.trigger(
      'mouse-up',
      cachedUnitsVector,
      cachedScreenVector,
      event.button
    );
  }

  onMouseMove(...args) {
    this._canvasToUnitCoords(
      cachedUnitsVector,
      cachedScreenVector,
      ...args
    );
    !!this._triggerEvents && this._events.trigger(
      'mouse-move',
      cachedUnitsVector,
      cachedScreenVector
    );
  }

  onKeyDown(event) {
    !!this._triggerEvents && this._events.trigger(
      'key-down',
      event.which || event.keyCode
    );
  }

  onKeyUp(event) {
    !!this._triggerEvents && this._events.trigger(
      'key-up',
      event.which || event.keyCode
    );
  }

  scanForGamepads() {
    const { _gamepads, _events, _triggerEvents } = this;
    const gamepads = !!navigator.getGamepads
      ? [ ...navigator.getGamepads() ]
      : (!!navigator.webkitGetGamepads
        ? [ ...navigator.webkitGetGamepads() ]
        : null);

    if (!gamepads) {
      return;
    }

    for (let i = 0, c = gamepads.length; i < c; ++i) {
      const gamepad = gamepads[i];
      if (!gamepad) {
        continue;
      }

      const { id } = gamepad;

      if (!_gamepads.has(id)) {
        _gamepads.set(id, gamepad);
        !!_triggerEvents && _events.trigger('gamepad-connected', gamepad);
      }
    }

    for (const gamepad of _gamepads.values()) {
      if (!gamepad.connected || gamepads.indexOf(gamepad) < 0) {
        _gamepads.delete(gamepad.id);
        !!_triggerEvents && _events.trigger('gamepad-disconnected', gamepad);
      } else {
        !!_triggerEvents && _events.trigger('gamepad-process', gamepad);
      }
    }
  }

  leapProcessFrame() {
    const { _leap, _events, _triggerEvents } = this;
    if (!!_leap) {
      const frame = _leap.frame();
      if (!!frame && frame.valid) {
        if (!this._leapConnected) {
          this._leapConnected = true;
          !!_triggerEvents && _events.trigger('leap-connected', _leap);
        }
        !!_triggerEvents && _events.trigger('leap-process', frame, _leap);
      } else if (this._leapConnected) {
        this._leapConnected = false;
        !!_triggerEvents && _events.trigger('leap-disconnected', _leap);
      }
    }
  }

  _canvasToUnitCoords(outUnits, outScreen, event, target) {
    target = target || event.target;

    const { width, height } = this._canvas;
    const bounds = target.getBoundingClientRect();
    let x = event.clientX - bounds.left;
    let y = event.clientY - bounds.top;

    outScreen[0] = x = x * target.width / target.clientWidth;
    outScreen[1] = y = y * target.height / target.clientHeight;
    outUnits[0] = x / width * 2 - 1;
    outUnits[1] = y / height * -2 + 1;
  }

}
