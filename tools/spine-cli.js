#!/usr/bin/env node

import process from 'process';
import { spine } from './spine';

const args = process.argv;
let argmode = null;
let json = null;
let atlas = null;
let output = null;
const options = {};
let optionProp = null;

for (let i = 1, c = args.length; i < c; ++i) {
  const arg = args[i];
  if (!argmode) {
    if (arg === '-j' || arg === '--json') {
      argmode = 'json';
    } else if (arg === '-a' || arg === '--atlas') {
      argmode = 'atlas';
    } else if (arg === '-o' || arg === '--output') {
      argmode = 'output';
    } else if (arg === '-op' || arg === '--option') {
      argmode = 'option-prop';
    }
  } else if (argmode === 'json') {
    json = arg;
    argmode = null;
  } else if (argmode === 'atlas') {
    atlas = arg;
    argmode = null;
  } else if (argmode === 'output') {
    output = arg;
    argmode = null;
  } else if (argmode === 'option-prop') {
    optionProp = arg;
    argmode = 'option-value';
  } else if (argmode === 'option-value') {
    option[optionProp] = arg;
    argmode = null;
  }
}

if (!json) {
  throw new Error('json path is not provided!');
}
if (!atlas) {
  throw new Error('atlas path is not provided!');
}
if (!output) {
  throw new Error('input is not provided!');
}

spine(json, atlas, output, options);
