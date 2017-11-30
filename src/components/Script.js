import Component from '../systems/EntitySystem/Component';
import System from '../systems/System';
import { propsEnumStringify } from '../utils';

const EventFlags = {
  NONE: 0,
  MOUSE_DOWN: 1 << 0,
  MOUSE_UP: 1 << 1,
  MOUSE_MOVE: 1 << 2,
  MOUSE: 0x7,
  KEY_DOWN: 1 << 3,
  KEY_UP: 1 << 4,
  KEY: 0x18,
  GAMEPAD_CONNECTED: 1 << 5,
  GAMEPAD_DISCONNECTED: 1 << 6,
  GAMEPAD_PROCESS: 1 << 7,
  GAMEPAD: 0xE0,
  LEAP_CONNECTED: 1 << 8,
  LEAP_DISCONNECTED: 1 << 9,
  LEAP_PROCESS: 1 << 10,
  LEAP: 0x700,
  INPUT: 0x7FF,
  CONTACT_BEGIN: 1 << 11,
  CONTACT_END: 1 << 12,
  CONTACT: 0x1800,
  ALL: 0x1FFF
};

export default class Script extends Component {

  static factory() {
    return new Script();
  }

  static get propsTypes() {
    return {
      listenTo: `flags(${propsEnumStringify(EventFlags)})`
    };
  }

  static get EventFlags() {
    return EventFlags;
  }

  get listenTo() {
    return this._listenTo;
  }

  set listenTo(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const input = System.get('InputSystem');

    if (!input) {
      throw new Error('There is no registered InputSystem!');
    }

    const last = this._listenTo;
    const listenTo = this._listenTo = value | 0;
    const change = last ^ listenTo;

    if (change & EventFlags.MOUSE_DOWN) {
      if (listenTo & EventFlags.MOUSE_DOWN) {
        input.events.on('mouse-down', this._onMouseDown);
      } else {
        input.events.off('mouse-down', this._onMouseDown);
      }
    }

    if (change & EventFlags.MOUSE_UP) {
      if (listenTo & EventFlags.MOUSE_UP) {
        input.events.on('mouse-up', this._onMouseUp);
      } else {
        input.events.off('mouse-up', this._onMouseUp);
      }
    }

    if (change & EventFlags.MOUSE_MOVE) {
      if (listenTo & EventFlags.MOUSE_MOVE) {
        input.events.on('mouse-move', this._onMouseMove);
      } else {
        input.events.off('mouse-move', this._onMouseMove);
      }
    }

    if (change & EventFlags.KEY_DOWN) {
      if (listenTo & EventFlags.KEY_DOWN) {
        input.events.on('key-down', this._onKeyDown);
      } else {
        input.events.off('key-down', this._onKeyDown);
      }
    }

    if (change & EventFlags.KEY_UP) {
      if (listenTo & EventFlags.KEY_UP) {
        input.events.on('key-up', this._onKeyUp);
      } else {
        input.events.off('key-up', this._onKeyUp);
      }
    }

    if (change & EventFlags.GAMEPAD_CONNECTED) {
      if (listenTo & EventFlags.GAMEPAD_CONNECTED) {
        input.events.on('gamepad-connected', this._onGamepadConnected);
      } else {
        input.events.off('gamepad-connected', this._onGamepadConnected);
      }
    }

    if (change & EventFlags.GAMEPAD_DISCONNECTED) {
      if (listenTo & EventFlags.GAMEPAD_DISCONNECTED) {
        input.events.on('gamepad-disconnected', this._onGamepadDisconnected);
      } else {
        input.events.off('gamepad-disconnected', this._onGamepadDisconnected);
      }
    }

    if (change & EventFlags.GAMEPAD_PROCESS) {
      if (listenTo & EventFlags.GAMEPAD_PROCESS) {
        input.events.on('gamepad-process', this._onGamepadProcess);
      } else {
        input.events.off('gamepad-process', this._onGamepadProcess);
      }
    }

    if (change & EventFlags.LEAP_CONNECTED) {
      if (listenTo & EventFlags.LEAP_CONNECTED) {
        input.events.on('leap-connected', this._onLeapConnected);
      } else {
        input.events.off('leap-connected', this._onLeapConnected);
      }
    }

    if (change & EventFlags.LEAP_DISCONNECTED) {
      if (listenTo & EventFlags.LEAP_DISCONNECTED) {
        input.events.on('leap-disconnected', this._onLeapDisconnected);
      } else {
        input.events.off('leap-disconnected', this._onLeapDisconnected);
      }
    }

    if (change & EventFlags.LEAP_PROCESS) {
      if (listenTo & EventFlags.LEAP_PROCESS) {
        input.events.on('leap-process', this._onLeapProcess);
      } else {
        input.events.off('leap-process', this._onLeapProcess);
      }
    }

    if (change & EventFlags.CONTACT_BEGIN) {
      if (listenTo & EventFlags.CONTACT_BEGIN) {
        input.events.on('contact-begin', this._onContactBegin);
      } else {
        input.events.off('contact-begin', this._onContactBegin);
      }
    }

    if (change & EventFlags.CONTACT_END) {
      if (listenTo & EventFlags.CONTACT_END) {
        input.events.on('contact-end', this._onContactEnd);
      } else {
        input.events.off('contact-end', this._onContactEnd);
      }
    }
  }

  constructor() {
    super();

    this._listenTo = EventFlags.NONE;
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onGamepadConnected = this.onGamepadConnected.bind(this);
    this._onGamepadDisconnected = this.onGamepadDisconnected.bind(this);
    this._onGamepadProcess = this.onGamepadProcess.bind(this);
    this._onLeapConnected = this.onLeapConnected.bind(this);
    this._onLeapDisconnected = this.onLeapDisconnected.bind(this);
    this._onLeapProcess = this.onLeapProcess.bind(this);
    this._onContactBegin = this.onContactBegin.bind(this);
    this._onContactEnd = this.onContactEnd.bind(this);
  }

  dispose() {
    this.listenTo = EventFlags.NONE;
    super.dispose();
  }

  onAttach() {
    if ((this._listenTo | 0) & EventFlags.GAMEPAD_CONNECTED === 0) {
      return;
    }

    const input = System.get('InputSystem');

    if (!input) {
      throw new Error('There is no registered InputSystem!');
    }

    for (const gamepad of input.gamepads.values()) {
      this.onGamepadConnected(gamepad);
    }
  }

  onDetach() {
    if ((this._listenTo | 0) & EventFlags.GAMEPAD_DISCONNECTED === 0) {
      return;
    }

    const input = System.get('InputSystem');

    if (!input) {
      throw new Error('There is no registered InputSystem!');
    }

    for (const gamepad of input.gamepads.values()) {
      this.onGamepadDisconnected(gamepad);
    }
  }

  onAction(name, ...args) {
    if (name === 'update') {
      return this.onUpdate(...args);
    } else if (name === 'render') {
      return this.onRender(...args);
    } else if (name === 'render-layer') {
      return this.onRenderLayer(...args);
    } else if (name === 'preview') {
      return this.onPreview(...args);
    } else if (name === 'begin-contact') {
      if (this._listenTo & EventFlags.CONTACT_BEGIN) {
        return this.onContactBegin(...args);
      }
    } else if (name === 'end-contact') {
      if (this._listenTo & EventFlags.CONTACT_END) {
        return this.onContactEnd(...args);
      }
    }
  }

  onPropertySetup(name, value) {
    if (name === 'listenTo') {
      if (!(value instanceof Array)) {
        throw new Error('`value` is not type of Array!');
      }

      let flags = EventFlags.NONE;
      for (let i = 0, c = value.length; i < c; ++i) {
        const flag = value[i];

        if (flag === 'mouse-down') {
          flags |= EventFlags.MOUSE_DOWN;
        } else if (flag === 'mouse-up') {
          flags |= EventFlags.MOUSE_UP;
        } else if (flag === 'mouse-move') {
          flags |= EventFlags.MOUSE_MOVE;
        } else if (flag === 'mouse') {
          flags |= EventFlags.MOUSE;
        } else if (flag === 'key-down') {
          flags |= EventFlags.KEY_DOWN;
        } else if (flag === 'key-up') {
          flags |= EventFlags.KEY_UP;
        } else if (flag === 'key') {
          flags |= EventFlags.KEY;
        } else if (flag === 'gamepad-connected') {
          flags |= EventFlags.GAMEPAD_CONNECTED;
        } else if (flag === 'gamepad-disconnected') {
          flags |= EventFlags.GAMEPAD_DISCONNECTED;
        } else if (flag === 'gamepad-process') {
          flags |= EventFlags.GAMEPAD_PROCESS;
        } else if (flag === 'gamepad') {
          flags |= EventFlags.GAMEPAD;
        } else if (flag === 'leap-connected') {
          flags |= EventFlags.LEAP_CONNECTED;
        } else if (flag === 'leap-disconnected') {
          flags |= EventFlags.LEAP_DISCONNECTED;
        } else if (flag === 'leap-process') {
          flags |= EventFlags.LEAP_PROCESS;
        } else if (flag === 'leap') {
          flags |= EventFlags.LEAP;
        } else if (flag === 'input') {
          flags |= EventFlags.INPUT;
        } else if (flag === 'contact-begin') {
          flags |= EventFlags.CONTACT_BEGIN;
        } else if (flag === 'contact-end') {
          flags |= EventFlags.CONTACT_END;
        } else if (flag === 'contact') {
          flags |= EventFlags.CONTACT;
        } else if (flag === 'all') {
          flags |= EventFlags.ALL;
        }
      }

      this.listenTo = flags;
    } else {
      super.onPropertySetup(name, value);
    }
  }

  onPropertySerialize(name, value) {
    if (name === 'listenTo') {
      if ((value & EventFlags.ALL) === EventFlags.ALL) {
        return [ 'all' ];
      }

      const result = [];

      if ((value & EventFlags.MOUSE_DOWN) !== 0) {
        result.push('mouse-down');
      }
      if ((value & EventFlags.MOUSE_UP) !== 0) {
        result.push('mouse-up');
      }
      if ((value & EventFlags.MOUSE_MOVE) !== 0) {
        result.push('mouse-move');
      }
      if ((value & EventFlags.KEY_DOWN) !== 0) {
        result.push('key-down');
      }
      if ((value & EventFlags.KEY_UP) !== 0) {
        result.push('key-up');
      }
      if ((value & EventFlags.GAMEPAD_CONNECTED) !== 0) {
        result.push('gamepad-connected');
      }
      if ((value & EventFlags.GAMEPAD_DISCONNECTED) !== 0) {
        result.push('gamepad-disconnected');
      }
      if ((value & EventFlags.GAMEPAD_PROCESS) !== 0) {
        result.push('gamepad-process');
      }
      if ((value & EventFlags.LEAP_CONNECTED) !== 0) {
        result.push('leap-connected');
      }
      if ((value & EventFlags.LEAP_DISCONNECTED) !== 0) {
        result.push('leap-disconnected');
      }
      if ((value & EventFlags.LEAP_PROCESS) !== 0) {
        result.push('leap-process');
      }
      if ((value & EventFlags.CONTACT_BEGIN) !== 0) {
        result.push('contact-begin');
      }
      if ((value & EventFlags.CONTACT_END) !== 0) {
        result.push('contact-end');
      }
      return result;
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  onUpdate(deltaTime) {}

  onRender(gl, renderer, deltaTime, layer) {}

  onRenderLayer(gl, renderer, deltaTime, layer) {
    this.onRender(gl, renderer, deltaTime, layer);
  }

  onPreview(gl, renderer, deltaTime) {
    this.onRender(gl, renderer, deltaTime, null);
  }

  onMouseDown(unitVec, screenVec, button) {}

  onMouseUp(unitVec, screenVec, button) {}

  onMouseMove(unitVec, screenVec) {}

  onKeyDown(code) {}

  onKeyUp(code) {}

  onGamepadConnected(gamepad) {}

  onGamepadDisconnected(gamepad) {}

  onGamepadProcess(gamepad) {}

  onLeapConnected(leap) {}

  onLeapDisconnected(leap) {}

  onLeapProcess(frame, leap) {}

  onContactBegin(body, contact) {}

  onContactEnd(body, contact) {}

}
