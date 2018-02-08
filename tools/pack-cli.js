#!/usr/bin/env node

import process from 'process';
import { pack } from './pack';

const args = process.argv;
let argmode = null;
let input = [];
let output = null;
let silent = false;
let verbose = false;

for (let i = 1, c = args.length; i < c; ++i) {
  const arg = args[i];
  if (!argmode) {
    if (arg === '-h' || arg === '--help') {
      console.log(
        'Usage: oxy-pack -i source/directory/path -o packed.pack\n' +
        '  -i | --input   - Source files directory (can be used multiple times).\n' +
        '  -o | --output  - Result packed file.\n' +
        '  -s | --silent  - Absolutely no log.\n' +
        '  -v | --verbose - Absolutely every information logged.'
      );
      process.exit(1);
    } else if (arg === '-i' || arg === '--input') {
      argmode = 'input';
    } else if (arg === '-o' || arg === '--output') {
      argmode = 'output';
    } else if (arg === '-s' || arg === '--silent') {
      silent = true;
    } else if (arg === '-v' || arg === '--verbose') {
      silent = false;
      verbose = true;
    }
  } else if (argmode === 'input') {
    input.push(arg);
    argmode = null;
  } else if (argmode === 'output') {
    output = arg;
    argmode = null;
  }
}

if (input.length <= 0) {
  throw new Error('input is not provided!');
}
if (!output) {
  throw new Error('output is not provided!');
}

pack(input, output, { silent, verbose });
