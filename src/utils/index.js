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
  bezierCubic
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
  bezierCubic
};

const regexRGBA = /([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/;
const cachedLocalVec = vec2.create();
const cachedInverseMatrix = mat4.create();

function findMapKeyOfValue(map, value) {
  for (const [ k, v ] of map.entries()) {
    if (v === value) {
      return k;
    }
  }

  return null;
}

function waitForSeconds(seconds) {
  return new Promise((resolve, reject) => setInterval(resolve, seconds * 1000));
}

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

function angleDifference(a, b) {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

function convertGlobalPointToLocalPoint(target, globalVec, globalTransform) {
  mat4.invert(cachedInverseMatrix, globalTransform);
  vec2.transformMat4(target, globalVec, cachedInverseMatrix);
}

function convertLocalPointToGlobalPoint(target, localVec, globalTransform) {
  vec2.transformMat4(target, localVec, globalTransform);
}

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

function isLocalPointInLocalBoundingBox(localVec, w, h, ox, oy) {
  const x = localVec[0];
  const y = localVec[1];
  const left = -ox;
  const right = w - ox;
  const top = -oy;
  const bottom = h - oy;

  return x >= left && x <= right && y >= top && y <= bottom;
}

function bezierCubic(t, a, b, c, d) {
  t = Math.max(0, Math.min(1, t));
  const r = 1 - t;
  return a * r * r * r + 3 * b * t * r * r + 3 * c * t * t * r + d * t * t * t;
}
