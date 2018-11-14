import * as box2d from 'box2dweb-commonjs';

export * from 'box2dweb-commonjs';
export const Box2D = box2d.Box2D;

export default {
  ...box2d,
  ...box2d.Box2D
}
