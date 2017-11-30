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
  box2d
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
  box2d
};

const regexRGBA = /([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/;

export function findMapKeyOfValue(map, value) {
  for (const [ k, v ] of map.entries()) {
    if (v === value) {
      return k;
    }
  }

  return null;
}

export function waitForSeconds(seconds) {
  return new Promise((resolve, reject) => setInterval(resolve, seconds * 1000));
}

export function stringToRGBA(value) {
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

export function propsEnumStringify(values) {
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
