import Script from './Script';
import {
  b2Vec2,
  b2BodyDef,
  b2FixtureDef,
  b2CircleShape,
  b2PolygonShape,
  b2Body,
  b2Fixture
} from '../utils/box2d';

const ShapeType = {
  CIRCLE: 'circle',
  POLYGON: 'polygon'
};

const BodyType = {
  STATIC: 'static',
  DYNAMIC: 'dynamic',
  KINEMATIC: 'kinematic'
};

export default class PhysicsBody extends Script {

  static factory() {
    return new PhysicsBody();
  }

  static get propsTypes() {
    return {
      ...Script.propsTypes,
      applyPositionTo: 'string_null',
      applyRotationTo: 'string_null',
      applyPositionFrom: 'string_null',
      applyRotationFrom: 'string_null',
      bodyType: 'enum(static, dynamic, kinematic)',
      radius: 'number',
      vertices: 'array(number)',
      shapeType: 'enum(circle, polygon)',
      density: 'number',
      friction: 'number',
      restitution: 'number',
      linearVelocity: 'vec2',
      angularVelocity: 'number',
      linearDamping: 'number',
      angularDamping: 'number',
      fixedRotation: 'boolean',
      bullet: 'boolean',
      sensor: 'boolean',
      coordsScale: 'number',
      listenForContacts: 'boolean'
    };
  }

  static get ShapeType() {
    return ShapeType;
  }

  get applyPositionTo() {
    return this._applyPositionTo;
  }

  set applyPositionTo(value) {
    if (!value) {
      this._applyPositionTo = null;
      this._applyPositionToEntity = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const { entity } = this;

    this._applyPositionTo = value;

    if (!!entity) {
      this._applyPositionToEntity = entity.findEntity(value);

      if (!this._applyPositionToEntity) {
        throw new Error(`Cannot find entity: ${value}`);
      }
    }
  }

  get applyRotationTo() {
    return this._applyRotationTo;
  }

  set applyRotationTo(value) {
    if (!value) {
      this._applyRotationTo = null;
      this._applyRotationToEntity = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const { entity } = this;

    this._applyRotationTo = value;

    if (!!entity) {
      this._applyRotationToEntity = entity.findEntity(value);

      if (!this._applyRotationToEntity) {
        throw new Error(`Cannot find entity: ${value}`);
      }
    }
  }

  get applyPositionFrom() {
    return this._applyPositionFrom;
  }

  set applyPositionFrom(value) {
    if (!value) {
      this._applyPositionFrom = null;
      this._applyPositionFromEntity = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const { entity } = this;

    this._applyPositionFrom = value;

    if (!!entity) {
      this._applyPositionFromEntity = entity.findEntity(value);

      if (!this._applyPositionFromEntity) {
        throw new Error(`Cannot find entity: ${value}`);
      }
    }
  }

  get applyRotationFrom() {
    return this._applyRotationFrom;
  }

  set applyRotationFrom(value) {
    if (!value) {
      this._applyRotationFrom = null;
      this._applyRotationFromEntity = null;
      return;
    }

    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    const { entity } = this;

    this._applyRotationFrom = value;

    if (!!entity) {
      this._applyRotationFromEntity = entity.findEntity(value);

      if (!this._applyRotationFromEntity) {
        throw new Error(`Cannot find entity: ${value}`);
      }
    }
  }

  get bodyType() {
    return this._bodyType;
  }

  set bodyType(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._bodyType = value;
    this._rebuild = true;
  }

  get radius() {
    return this._radius;
  }

  set radius(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._radius = value;
  }

  get vertices() {
    return this._vertices;
  }

  set vertices(value) {
    if (!value) {
      throw new Error('`value` cannot be null!');
    }

    if (value instanceof Array) {
      value = new Float32Array(value);
    }
    if (!(value instanceof Float32Array)) {
      throw new Error('`value` is not type of either Array or Float32Array!');
    }
    if (value.length % 2 !== 0) {
      throw new Error('`value` has size undividable by 2!');
    }

    this._vertices = value;
  }

  get shapeType() {
    return this._shapeType;
  }

  set shapeType(value) {
    if (typeof value !== 'string') {
      throw new Error('`value` is not type of String!');
    }

    this._shapeType = value;
    this._rebuild = true;
  }

  get density() {
    const { _fixture } = this;
    return !!_fixture ? _fixture.GetDensity() : this._fixtureDef.density;
  }

  set density(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _fixture, _body, density } = this;
    if (!!_fixture) {
      _fixture.SetDensity(value);
    } else {
      this._fixtureDef.density = value;
    }
    if (!!_body && density !== value) {
      _body.ResetMassData();
    }
  }

  get friction() {
    const { _fixture } = this;
    return !!_fixture ? _fixture.GetFriction() : this._fixtureDef.friction;
  }

  set friction(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _fixture } = this;
    if (!!_fixture) {
      _fixture.SetFriction(value);
    } else {
      this._fixtureDef.friction = value;
    }
  }

  get restitution() {
    const { _fixture } = this;
    return !!_fixture ? _fixture.GetRestitution() : this._fixtureDef.restitution;
  }

  set restitution(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _fixture } = this;
    if (!!_fixture) {
      _fixture.SetRestitution(value);
    } else {
      this._fixtureDef.restitution = value;
    }
  }

  get linearVelocity() {
    const { _body } = this;
    return !!_body ? _body.GetLinearVelocity() : this._bodyDef.linearVelocity;
  }

  set linearVelocity(value) {
    if (value instanceof Array || value instanceof Float32Array) {
      value = new b2Vec2(value[0] || 0, value[1] || 0);
    } else {
      throw new Error('`value` is not type of either b2Vec2, Array or Float32Array!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.SetLinearVelocity(value);
    } else {
      this._bodyDef.linearVelocity = value;
    }
  }

  get linearVelocityLength() {
    return this.linearVelocity.Length();
  }

  get angularVelocity() {
    const { _body } = this;
    return !!_body ? _body.GetAngularVelocity() : this._bodyDef.angularVelocity;
  }

  set angularVelocity(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.SetAngularVelocity(value);
    } else {
      this._bodyDef.angularVelocity = value;
    }
  }

  get linearDamping() {
    const { _body } = this;
    return !!_body ? _body.GetLinearDamping() : this._bodyDef.linearDamping;
  }

  set linearDamping(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.SetLinearDamping(value);
    } else {
      this._bodyDef.linearDamping = value;
    }
  }

  get angularDamping() {
    const { _body } = this;
    return !!_body ? _body.GetAngularDamping() : this._bodyDef.angularDamping;
  }

  set angularDamping(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.SetAngularDamping(value);
    } else {
      this._bodyDef.angularDamping = value;
    }
  }

  get fixedRotation() {
    const { _body } = this;
    return !!_body ? _body.IsFixedRotation() : this._bodyDef.fixedRotation;
  }

  set fixedRotation(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.SetFixedRotation(value);
    } else {
      this._bodyDef.fixedRotation = value;
    }
  }

  get bullet() {
    const { _body } = this;
    return !!_body ? _body.IsBullet() : this._bodyDef.bullet;
  }

  set bullet(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.SetBullet(value);
    } else {
      this._bodyDef.bullet = value;
    }
  }

  get sensor() {
    const { _fixture } = this;
    return !!_fixture ? _fixture.IsSensor() : this._fixtureDef.isSensor;
  }

  set sensor(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    const { _fixture } = this;
    if (!!_fixture) {
      _fixture.SetSensor(value);
    } else {
      this._fixtureDef.isSensor = value;
    }
  }

  get coordsScale() {
    return this._coordsScale;
  }

  set coordsScale(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    this._coordsScale = value;
  }

  get listenForContacts() {
    return this._listenForContacts;
  }

  set listenForContacts(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._listenForContacts = value;
  }

  get body() {
    return this._body;
  }

  get world() {
    return this._world;
  }

  get fixture() {
    return this._fixture;
  }

  get mass() {
    const { _body } = this;
    return !!_body ? _body.GetMass() : 0;
  }

  constructor() {
    super();

    this._applyPositionTo = null;
    this._applyPositionToEntity = null;
    this._applyRotationTo = null;
    this._applyRotationToEntity = null;
    this._applyPositionFrom = null;
    this._applyPositionFromEntity = null;
    this._applyRotationFrom = null;
    this._applyRotationFromEntity = null;
    this._bodyType = BodyType.STATIC;
    this._radius = 1;
    this._coordsScale = 1;
    this._listenForContacts = false;
    this._vertices = null;
    this._shapeType = ShapeType.CIRCLE;
    this._bodyDef = new b2BodyDef();
    this._fixtureDef = new b2FixtureDef();
    this._world = null;
    this._body = null;
    this._fixture = null;
    this._shape = null;
    this._rebuild = true;
  }

  dispose() {
    super.dispose();
    this._destroyBody();

    this._applyPositionToEntity = null;
    this._applyRotationToEntity = null;
    this._applyPositionFromEntity = null;
    this._applyRotationFromEntity = null;
    this._bodyDef = null;
    this._fixtureDef = null;
    this._vertices = null;
    this._world = null;
    this._body = null;
    this._fixture = null;
    this._shape = null;
  }

  rebuildBody() {
    this._rebuild = true;
  }

  applyForce(forceX, forceY, pointX, pointY, localSpace = false) {
    if (typeof forceX !== 'number') {
      throw new Error('`forceX` is not type of Number!');
    }
    if (typeof forceY !== 'number') {
      throw new Error('`forceY` is not type of Number!');
    }
    if (typeof pointX !== 'number') {
      throw new Error('`pointX` is not type of Number!');
    }
    if (typeof pointY !== 'number') {
      throw new Error('`pointY` is not type of Number!');
    }
    if (typeof localSpace !== 'boolean') {
      throw new Error('`localSpace` is not type of Boolean!');
    }

    const { _body } = this;
    if (!!_body) {
      if (localSpace) {
        const localPoint = _body.GetLocalPoint(new b2Vec2(pointX, pointY));
        _body.ApplyForce(
          new b2Vec2(forceX, forceY),
          new b2Vec2(localPoint.x, localPoint.y)
        );
      } else {
        _body.ApplyForce(
          new b2Vec2(forceX, forceY),
          new b2Vec2(pointX, pointY)
        );
      }
    }
  }

  applyTorque(value) {
    if (typeof value !== 'number') {
      throw new Error('`value` is not type of Number!');
    }

    const { _body } = this;
    if (!!_body) {
      _body.ApplyTorque(value);
    }
  }

  applyImpulse(forceX, forceY, pointX, pointY, localSpace = false) {
    if (typeof forceX !== 'number') {
      throw new Error('`forceX` is not type of Number!');
    }
    if (typeof forceY !== 'number') {
      throw new Error('`forceY` is not type of Number!');
    }
    if (typeof pointX !== 'number') {
      throw new Error('`pointX` is not type of Number!');
    }
    if (typeof pointY !== 'number') {
      throw new Error('`pointY` is not type of Number!');
    }
    if (typeof localSpace !== 'boolean') {
      throw new Error('`localSpace` is not type of Boolean!');
    }

    const { _body } = this;
    if (!!_body) {
      if (localSpace) {
        const localPoint = _body.GetLocalPoint(new b2Vec2(pointX, pointY));
        _body.ApplyImpulse(
          new b2Vec2(forceX, forceY),
          new b2Vec2(localPoint.x, localPoint.y)
        );
      } else {
        _body.ApplyImpulse(
          new b2Vec2(forceX, forceY),
          new b2Vec2(pointX, pointY)
        );
      }
    }
  }

  wakeUp() {
    const { _body } = this;
    if (!!_body) {
      _body.SetAwake(true);
    }
  }

  sleep() {
    const { _body } = this;
    if (!!_body) {
      _body.SetAwake(false);
    }
  }

  onAttach() {
    this.applyPositionTo = this.applyPositionTo;
    this.applyRotationTo = this.applyRotationTo;
    this.applyPositionFrom = this.applyPositionFrom;
    this.applyRotationFrom = this.applyRotationFrom;

    this._createBody();
  }

  onDetach() {
    this._destroyBody();
  }

  onPropertySerialize(name, value) {
    if (name === 'vertices') {
      if (!value) {
        return;
      }

      return [ ...value ];
    } if (name === 'linearVelocity') {
      if (!value) {
        return;
      }

      return [ value.x, value.y ];
    } else {
      return super.onPropertySerialize(name, value);
    }
  }

  onUpdate(deltaTime) {
    if (this._rebuild) {
      this._destroyBody();
      this._createBody();
      this._rebuild = false;
    }

    const { _body } = this;
    if (!_body) {
      return;
    }

    const {
      _applyPositionToEntity,
      _applyRotationToEntity,
      _applyPositionFromEntity,
      _applyRotationFromEntity,
      _coordsScale
    } = this;
    if (!!_applyPositionToEntity) {
      const position = _body.GetPosition();
      _applyPositionToEntity.setPosition(
        position.x * _coordsScale,
        position.y * _coordsScale
      );
    } else if (!!_applyPositionFromEntity) {
      const position = _applyPositionFromEntity.position;
      _body.SetPosition(new b2Vec2(
        position[0] / _coordsScale,
        position[1] / _coordsScale
      ));
    }
    if (!!_applyRotationToEntity) {
      _applyRotationToEntity.setRotation(_body.GetAngle());
    } else if (!!_applyRotationFromEntity) {
      _body.SetAngle(_applyRotationFromEntity.getRotation());
    }
  }

  _findParentWorld() {
    let entity = this.entity;

    while (!!entity) {
      const world = entity.getComponent('PhysicsWorld');
      if (!!world) {
        return world;
      }

      entity = entity.parent;
    }

    return null;
  }

  _createBody() {
    const world = this._findParentWorld();
    if (!world) {
      throw new Error('Cannot find PhysicsWorld component in parents chain!');
    }

    const {
      _bodyType,
      _shapeType,
      _bodyDef,
      _fixtureDef,
      _coordsScale,
      _vertices,
      entity
    } = this;
    const { position } = entity;

    if (_bodyType === BodyType.STATIC) {
      _bodyDef.type = b2Body.b2_staticBody;
    } else if (_bodyType === BodyType.DYNAMIC) {
      _bodyDef.type = b2Body.b2_dynamicBody;
    } else if (_bodyType === BodyType.KINEMATIC) {
      _bodyDef.type = b2Body.b2_kinematicBody;
    } else {
      console.warn(`Wrong body type: ${_bodyType}`);
      return;
    }

    if (_shapeType === ShapeType.POLYGON) {
      this._shape = new b2PolygonShape();
      const vertices = [];
      for (let i = 0, c = _vertices.length; i < c; i += 2) {
        vertices.push(new b2Vec2(_vertices[i], _vertices[i + 1]));
      }
      this._shape.SetAsVector(vertices);
    } else if (_shapeType === ShapeType.CIRCLE) {
      this._shape = new b2CircleShape(this._radius);
    } else {
      console.warn(`Wrong shape type: ${_shapeType}`);
      return;
    }

    const scale = _coordsScale > 0 ? 1 / _coordsScale : 0;
    _bodyDef.position = new b2Vec2(
      position[0] * scale,
      position[1] * scale
    );
    _bodyDef.angle = entity.getRotation();
    _fixtureDef.shape = this._shape;

    const body = this._body = world.world.CreateBody(_bodyDef);
    if (!body) {
      throw new Error(
        `Could not create body for PhysicsBody of entity: ${entity.name}`
      );
    }
    body.SetUserData(this);
    const fixture = this._fixture = body.CreateFixture(_fixtureDef);
    fixture.SetUserData(this);
    this._world = world;
  }

  _destroyBody() {
    const { _bodyDef, _fixtureDef, _body, _fixture } = this;

    if (!!_fixture) {
      _fixtureDef.shape = null;
      _fixtureDef.density = _fixture.GetDensity();
      _fixtureDef.friction = _fixture.GetFriction();
      _fixtureDef.restitution = _fixture.GetRestitution();
      _fixtureDef.isSensor = _fixture.IsSensor();
    }

    if (!!_body) {
      _bodyDef.type = _body.GetType();
      _bodyDef.linearVelocity = _body.GetLinearVelocity();
      _bodyDef.linearDamping = _body.GetLinearDamping();
      _bodyDef.angularVelocity = _body.GetAngularVelocity();
      _bodyDef.angularDamping = _body.GetAngularDamping();
      _bodyDef.fixedRotation = _body.IsFixedRotation();
      _bodyDef.bullet = _body.IsBullet();
      _body.DestroyFixture(_fixture);
      _body.GetWorld().DestroyBody(_body);
    }

    this._fixture = null;
    this._body = null;
    this._world = null;
  }

}
