import Script from './Script';
import { vec2 } from '../utils/gl-matrix';
import { b2World, b2Vec2, Dynamics } from '../utils/box2d';

export default class PhysicsWorld extends Script {

  static factory() {
    return new PhysicsWorld();
  }

  static get propsTypes() {
    return {
      ...Script.propsTypes,
      gravity: 'vec2',
      doSleep: 'boolean',
      iterations: 'integer',
      timeScale: 'number'
    };
  }

  get gravity() {
    return this._gravity;
  }

  set gravity(value) {
    if (!(value instanceof Array)) {
      throw new Error('`value` is not type of Array!');
    }
    if (value.length < 2) {
      throw new Error('`value` must have at least 2 elements!');
    }

    vec2.copy(this._gravity, value);

    const { _world } = this;
    if(!!_world) {
      _world.SetGravity(new b2Vec2(value[0], value[1]));
    }
  }

  get doSleep() {
    return this._doSleep;
  }

  set doSleep(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._doSleep = value;
  }

  get iterations() {
    return this._iterations;
  }

  set iterations(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._iterations = value | 0;
  }

  get timeScale() {
    return this._timeScale;
  }

  set timeScale(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._timeScale = value;
  }

  get world() {
    return this._world;
  }

  constructor() {
    super();

    this._gravity = vec2.create();
    this._doSleep = true;
    this._iterations = 1;
    this._timeScale = 1;
    this._world = null;
    this._contactListener = null;
    this._onBeginContact = this.onBeginContact.bind(this);
    this._onEndContact = this.onEndContact.bind(this);
  }

  dispose() {
    super.dispose();

    this._gravity = null;
    this._world = null;
    this._contactListener = null;
  }

  rayCast(callback, startX, startY, endX, endY) {
    if (!callback) {
      throw new Error('`callback` cannot be null!');
    }
    if (typeof startX !== 'number') {
      throw new Error('`startX` is not type of Number!');
    }
    if (typeof startY !== 'number') {
      throw new Error('`startY` is not type of Number!');
    }
    if (typeof endX !== 'number') {
      throw new Error('`endX` is not type of Number!');
    }
    if (typeof endY !== 'number') {
      throw new Error('`endY` is not type of Number!');
    }

    const { _world } = this;
    if (!!_world) {
      _world.RayCast(
        (fixture, point, normal, fraction) => {
          return callback(
            fixture.GetUserData(),
            point,
            normal,
            fraction
          );
        },
        new b2Vec2(startX, startY),
        new b2Vec2(endX, endY)
      );
    }
  }

  rayCastOne(startX, startY, endX, endY) {
    if (typeof startX !== 'number') {
      throw new Error('`startX` is not type of Number!');
    }
    if (typeof startY !== 'number') {
      throw new Error('`startY` is not type of Number!');
    }
    if (typeof endX !== 'number') {
      throw new Error('`endX` is not type of Number!');
    }
    if (typeof endY !== 'number') {
      throw new Error('`endY` is not type of Number!');
    }

    const { _world } = this;
    if (!!_world) {
      const result = _world.RayCastOne(
        new b2Vec2(startX, startY),
        new b2Vec2(endX, endY)
      );

      return !!result ? result.GetUserData() : null;
    }

    return null;
  }

  rayCastAll(startX, startY, endX, endY) {
    if (typeof startX !== 'number') {
      throw new Error('`startX` is not type of Number!');
    }
    if (typeof startY !== 'number') {
      throw new Error('`startY` is not type of Number!');
    }
    if (typeof endX !== 'number') {
      throw new Error('`endX` is not type of Number!');
    }
    if (typeof endY !== 'number') {
      throw new Error('`endY` is not type of Number!');
    }

    const { _world } = this;
    if (!!_world) {
      const result = _world.RayCastAll(
        new b2Vec2(startX, startY),
        new b2Vec2(endX, endY)
      );

      return !!result ? result.map(fixture => fixture.GetUserData()) : null;
    }

    return null;
  }

  onAttach() {
    const { _gravity, _doSleep } = this;

    const world = this._world = new b2World(
      new b2Vec2(_gravity[0], _gravity[1]),
      _doSleep
    );
    const contactListener = new Dynamics.b2ContactListener();
    contactListener.BeginContact = this._onBeginContact;
    contactListener.EndContact = this._onEndContact;
    world.SetContactListener(contactListener);
  }

  onDetach() {
    this._world = null;
  }

  onUpdate(deltaTime) {
    const { _world, _iterations, _timeScale } = this;

    if (!!_world) {
      _world.Step(deltaTime * 0.001 * _timeScale, _iterations, _iterations);
    }
  }

  onBeginContact(contact) {
    const bodyA = contact.GetFixtureA().GetUserData();
    const bodyB = contact.GetFixtureB().GetUserData();

    if (!!bodyA && bodyA.listenForContacts) {
      const { entity } = bodyA;
      if (!!entity) {
        entity.performAction('begin-contact', bodyB, contact);
      }
    }
    if (!!bodyB && bodyB.listenForContacts) {
      const { entity } = bodyB;
      if (!!entity) {
        entity.performAction('begin-contact', bodyA, contact);
      }
    }
  }

  onEndContact(contact) {
    const bodyA = contact.GetFixtureA().GetUserData();
    const bodyB = contact.GetFixtureB().GetUserData();

    if (!!bodyA && bodyA.listenForContacts) {
      const { entity } = bodyA;
      if (!!entity) {
        entity.performAction('end-contact', bodyB, contact);
      }
    }
    if (!!bodyB && bodyB.listenForContacts) {
      const { entity } = bodyB;
      if (!!entity) {
        entity.performAction('end-contact', bodyA, contact);
      }
    }
  }

}
