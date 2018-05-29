import System from './System';
import Events from '../utils/Events';
import { vec2 } from '../utils/gl-matrix';
import Leap from 'leapjs';

const cachedUnitsVector = vec2.create();
const cachedScreenVector = vec2.create();
const touchDetectionMediaQuery = [
  '(-webkit-heartz)',
  '(-moz-heartz)',
  '(-o-heartz)',
  '(-ms-heartz)',
  '(heartz)'
].join(',');

function detectTouchDevice() {
  if (
    ('ontouchstart' in window) ||
    (!!window.DocumentTouch && document instanceof DocumentTouch)
  ) {
    return true;
  } else {
    return window.matchMedia(touchDetectionMediaQuery).matches;
  }
}

/**
 * User input (mouse, keyboard, gamepad, leap motion).
 *
 * @example
 * const system = new InputSystem(document.getElementById('screen-0'));
 */
export default class InputSystem extends System {

  /** @type {Events} */
  get events() {
    return this._events;
  }

  /** @type {Map} */
  get gamepads() {
    return this._gamepads;
  }

  /** @type {Leap.Controller} */
  get leap() {
    return this._leap;
  }

  /** @type {boolean} */
  get leapConnected() {
    return this._leapConnected;
  }

  /** @type {boolean}*/
  get isTouchDevice() {
    return this._isTouchDevice;
  }

  /** @type {boolean} */
  get triggerEvents() {
    return this._triggerEvents;
  }

  /**
   * Constructor.
   *
   * @param {HTMLCanvasElement}	canvas - Canvas element to listen for events from.
   * @param {boolean}	triggerEvents - Tells if system should trigger events.
   */
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
    this._onTouchDown = this.onTouchDown.bind(this);
    this._onTouchUp = this.onTouchUp.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._isTouchDevice = detectTouchDevice();
  }

  dispose() {
    super.dispose();
    if (!!this._events) {
      this._events.dispose();
    }

    this._canvas = null;
    this._events = null;
    this._gamepads = null;
    this._leap = null;
    this._onMouseDown = null;
    this._onMouseUp = null;
    this._onMouseMove = null;
    this._onTouchDown = null;
    this._onTouchUp = null;
    this._onTouchMove = null;
    this._onKeyDown = null;
    this._onKeyUp = null;
  }

  /**
   * @override
   */
  onRegister() {
    this._canvas.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('mousemove', this._onMouseMove);
    this._canvas.addEventListener('touchstart', this._onTouchDown);
    this._canvas.addEventListener('touchend', this._onTouchUp);
    this._canvas.addEventListener('touchcancel', this._onTouchUp);
    this._canvas.addEventListener('touchmove', this._onTouchMove);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    this._leap.connect();
  }

  /**
   * @override
   */
  onUnregister() {
    this._canvas.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    this._canvas.removeEventListener('touchstart', this._onTouchDown);
    this._canvas.removeEventListener('touchend', this._onTouchUp);
    this._canvas.removeEventListener('touchcancel', this._onTouchUp);
    this._canvas.removeEventListener('touchmove', this._onTouchMove);
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
    !!this._triggerEvents && !!this._events && this._events.trigger(
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
    !!this._triggerEvents && !!this._events && this._events.trigger(
      'mouse-up',
      cachedUnitsVector,
      cachedScreenVector,
      event.button
    );
  }

  onMouseMove(event, target) {
    this._canvasToUnitCoords(
      cachedUnitsVector,
      cachedScreenVector,
      event,
      target
    );
    !!this._triggerEvents && !!this._events && this._events.trigger(
      'mouse-move',
      cachedUnitsVector,
      cachedScreenVector
    );
  }

  onTouchDown(event, target) {
    for (const touch of event.changedTouches) {
      this._canvasToUnitCoords(
        cachedUnitsVector,
        cachedScreenVector,
        touch,
        target
      );
      !!this._triggerEvents && !!this._events && this._events.trigger(
        'touch-down',
        cachedUnitsVector,
        cachedScreenVector,
        touch.identifier
      );
    }
  }

  onTouchUp(event, target) {
    for (const touch of event.changedTouches) {
      this._canvasToUnitCoords(
        cachedUnitsVector,
        cachedScreenVector,
        touch,
        target
      );
      !!this._triggerEvents && !!this._events && this._events.trigger(
        'touch-up',
        cachedUnitsVector,
        cachedScreenVector,
        touch.identifier
      );
    }
  }

  onTouchMove(event, target) {
    for (const touch of event.changedTouches) {
      this._canvasToUnitCoords(
        cachedUnitsVector,
        cachedScreenVector,
        touch,
        target
      );
      !!this._triggerEvents && !!this._events && this._events.trigger(
        'touch-move',
        cachedUnitsVector,
        cachedScreenVector,
        touch.identifier
      );
    }
  }

  onKeyDown(event) {
    !!this._triggerEvents && !!this._events && this._events.trigger(
      'key-down',
      event.which || event.keyCode
    );
  }

  onKeyUp(event) {
    !!this._triggerEvents && !!this._events && this._events.trigger(
      'key-up',
      event.which || event.keyCode
    );
  }

  /**
   * Scan for changes in browser gamepads list.
   */
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
        !!_triggerEvents && !!_events && _events.trigger('gamepad-connected', gamepad);
      }
    }

    for (const gamepad of _gamepads.values()) {
      if (!gamepad.connected || gamepads.indexOf(gamepad) < 0) {
        _gamepads.delete(gamepad.id);
        !!_triggerEvents && !!_events && _events.trigger('gamepad-disconnected', gamepad);
      } else {
        !!_triggerEvents && !!_events && _events.trigger('gamepad-process', gamepad);
      }
    }
  }

  /**
   * Process leap motion data frame.
   */
  leapProcessFrame() {
    const { _leap, _events, _triggerEvents } = this;
    if (!!_leap) {
      const frame = _leap.frame();
      if (!!frame && frame.valid) {
        if (!this._leapConnected) {
          this._leapConnected = true;
          !!_triggerEvents && !!_events && _events.trigger('leap-connected', _leap);
        }
        !!_triggerEvents && !!_events && _events.trigger('leap-process', frame, _leap);
      } else if (this._leapConnected) {
        this._leapConnected = false;
        !!_triggerEvents && !!_events && _events.trigger('leap-disconnected', _leap);
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
