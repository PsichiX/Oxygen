import Events from './Events';
import {
  glMatrix,
  mat2,
  mat2d,
  mat3,
  mat4,
  quat,
  vec2,
  vec3,
  vec4
} from './gl-matrix';
import * as box2d from './box2d';

export default {
  Events,
  glMatrix,
  mat2,
  mat2d,
  mat3,
  mat4,
  quat,
  vec2,
  vec3,
  vec4,
  box2d,
  findMapKeyOfValue,
  waitForSeconds,
  stringToRGBA,
  propsEnumStringify,
  angleDifference,
  convertGlobalPointToLocalPoint,
  convertLocalPointToGlobalPoint,
  isGlobalPointInGlobalBoundingBox,
  isLocalPointInLocalBoundingBox,
  bezierCubic,
  isPOT,
  getPOT,
  getMipmapScale
};

export {
  Events,
  glMatrix,
  mat2,
  mat2d,
  mat3,
  mat4,
  quat,
  vec2,
  vec3,
  vec4,
  box2d,
  findMapKeyOfValue,
  waitForSeconds,
  stringToRGBA,
  propsEnumStringify,
  angleDifference,
  convertGlobalPointToLocalPoint,
  convertLocalPointToGlobalPoint,
  isGlobalPointInGlobalBoundingBox,
  isLocalPointInLocalBoundingBox,
  bezierCubic,
  isPOT,
  getPOT,
  getMipmapScale
};

const regexRGBA = /([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/;
const cachedLocalVec = vec2.create();
const cachedInverseMatrix = mat4.create();

/**
 * Search for key of given map value.
 *
 * @param {*}	map - map collection object.
 * @param {*}	value - value you're looking for.
 *
 * @return {string|null} value key or null if value not found.
 *
 * @example
 * const found = findMapKeyOfValue({ hello: 'world' }, 'world');
 */
function findMapKeyOfValue(map, value) {
  for (const [ k, v ] of map.entries()) {
    if (v === value) {
      return k;
    }
  }

  return null;
}

/**
 * Produces promise that waits given amount of seconds, then resolves itself.
 *
 * @param {number}	seconds - Number of seconds to wait.
 *
 * @return {Promise} Produced promise.
 *
 * @example
 * waitForSeconds(1.5).then(() => console.log('hello!'));
 */
function waitForSeconds(seconds) {
  return new Promise((resolve, reject) => setInterval(resolve, seconds * 1000));
}

/**
* Converts hexadecimal color string into four element array of color channels values.
 *
 * @param {string}	value - Hexadecimal color string.
 *
 * @return {[number]} Four element array of color channels.
 *
 * @example
 * const color = stringToRGBA('AABBCCFF');
 */
function stringToRGBA(value) {
  const matches = regexRGBA.exec(value);
  if (!matches) {
    throw new Error(`Cannot convert string to RGBA: ${value}`);
  }

  const result = [ 0, 0, 0, 0 ];

  for (let i = 0; i < 4; ++i) {
    result[i] = parseInt(matches[i + 1], 16) / 255;
  }

  return result;
}

/**
 * Stringify key-value map into enumeration-like representation.
 *
 * @param {*}	values - Map collection.
 *
 * @return {string} Stringified map collection.
 *
 * @example
 * const enum = propsEnumStringify({ hello: 'world', ohayo: 'gosaimasu' });
 */
function propsEnumStringify(values) {
  if (!values) {
    return '';
  }

  return Object.keys(values).map(key => {
    const value = values[key];

    if (typeof value === 'string' || typeof value === 'number') {
      return `${key}:${value}`;
    } else {
      return '';
    }
  }).join(',')
}

/**
 * Calculate closest turn angle difference.
 *
 * @param {number}	a - From angle.
 * @param {number}	b - To angle.
 *
 * @return {number} Angle difference (negative values possible).
 *
 * @example
 * angleDifference(10, 350) === -20
 */
function angleDifference(a, b) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

/**
 * Converts global vec2 coordinate into local vec2 coordinate.
 *
 * @param {vec2}	target - Result vec2 value.
 * @param {vec2}	globalVec - Global vec2 value.
 * @param {mat4}	globalTransform - Object mat4 transform.
 *
 * @example
 * const result = vec2.create();
 * const pos = vec2.fromValues(1, 1);
 * const transform = mat4.identity();
 * convertGlobalPointToLocalPoint(result, pos, transform);
 */
function convertGlobalPointToLocalPoint(target, globalVec, globalTransform) {
  mat4.invert(cachedInverseMatrix, globalTransform);
  vec2.transformMat4(target, globalVec, cachedInverseMatrix);
}

/**
 * Converts local vec2 coordinate into global vec2 coordinate.
 *
 * @param {vec2}	target - Result vec2 value.
 * @param {vec2}	localVec - Local vec2 value.
 * @param {mat4}	globalTransform - Object mat4 transform.
 *
 * @example
 * const result = vec2.create();
 * const pos = vec2.fromValues(1, 1);
 * const transform = mat4.identity();
 * convertLocalPointToGlobalPoint(result, pos, transform);
 */
function convertLocalPointToGlobalPoint(target, localVec, globalTransform) {
  vec2.transformMat4(target, localVec, globalTransform);
}

/**
 * Tells if given global vec2 coordinate is contained by given bounding box in given global transform space.
 *
 * @param {vec2}	globalVec - Global vec2 value.
 * @param {number}	w - BBox width.
 * @param {number}	h - BBox height.
 * @param {number}	ox - BBox X offset.
 * @param {number}	oy - BBox Y offset.
 * @param {mat4}	globalTransform - Object mat4 transform.
 *
 * @return {boolean} True if point is contained by bounding box.
 *
 * @example
 * const pos = vec2.fromValues(2, 2);
 * const transform = mat4.identity();
 * isGlobalPointInGlobalBoundingBox(pos, 2, 2, 1, 1, transform) === true
 */
function isGlobalPointInGlobalBoundingBox(
  globalVec,
  w,
  h,
  ox,
  oy,
  globalTransform
) {
  convertGlobalPointToLocalPoint(cachedLocalVec, globalVec, globalTransform);
  return isLocalPointInLocalBoundingBox(cachedLocalVec, w, h, ox, oy);
}

/**
 * Tells if given local vec2 coordinate is contained by given bounding box.
 *
 * @param {vec2}	localVec - Local vec2 value.
 * @param {number}	w - BBox width.
 * @param {number}	h - BBox height.
 * @param {number}	ox - BBox X offset.
 * @param {number}	oy - BBox Y offset.
 *
 * @return {boolean} True if point is contained by bounding box.
 */
function isLocalPointInLocalBoundingBox(localVec, w, h, ox, oy) {
  const x = localVec[0];
  const y = localVec[1];
  const left = -ox;
  const right = w - ox;
  const top = -oy;
  const bottom = h - oy;

  return x >= left && x <= right && y >= top && y <= bottom;
}

/**
 * Calculate cubic bezier curve value at given time with four curve parameters.
 *
 * @param {number}	t - Time.
 * @param {number}	a - First curve position.
 * @param {number}	b - First curve controller.
 * @param {number}	c - Second curve controller.
 * @param {number}	d - Second curve controller.
 *
 * @return {number} Calculated curve value.
 */
function bezierCubic(t, a, b, c, d) {
  t = Math.max(0, Math.min(1, t));
  const r = 1 - t;
  return a * r * r * r + 3 * b * t * r * r + 3 * c * t * t * r + d * t * t * t;
}

/**
 * Checks if all arguments are power-of-two.
 *
 * @param {number[]}	args - Values.
 *
 * @return {boolean} True if all arguments are power-of-two.
 */
function isPOT(...args) {
  for (const arg of args) {
    const v = arg | 0;
    const pot = (v !== 0) && ((v & (~v + 1)) === v);
    if (!pot) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate nearest power-of-two.
 *
 * @param {number}	v - Value.
 * @param {boolean} upper - calculate upper POT value.
 *
 * @return {number} Nearest power-of-two value.
 */
function getPOT(v, upper = false) {
  let result = 1;
  while (result < v) {
    result = result << 1;
  }
  return upper ? result : result >> 1;
}

/**
 * Calculate mipmap scale at given level.
 *
 * @param {number} level - Level value (0 means base level, full scale).
 *
 * @return {number} Mipmap scale for given level.
 */
function getMipmapScale(level) {
  level = level | 0;
  return 1 / Math.max(1, Math.pow(2, Math.max(0, level)));
}
