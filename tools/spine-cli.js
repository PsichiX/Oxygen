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
    if (arg === '-h' || arg === '--help') {
      console.log(
        'Usage: oxy-spine -j spine.json -a spine.atlas -o destination/path/\n' +
        '  -j  | --json   - Spine skeleton json file.\n' +
        '  -a  | --atlas  - Spine skeleton atlas file.\n' +
        '  -o  | --output - Destination directory for converted files.\n' +
        '  -op | --option - Key-value pairs of options.'
      );
      process.exit(1);
    } else if (arg === '-j' || arg === '--json') {
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
