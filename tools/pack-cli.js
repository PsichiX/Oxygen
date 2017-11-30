#!/usr/bin/env node

import process from 'process';
import { pack } from './pack';

const args = process.argv;
let argmode = null;
let input = null;
let output = null;
let silent = false;
let verbose = false;

for (let i = 1, c = args.length; i < c; ++i) {
  const arg = args[i];
  if (!argmode) {
    if (arg === '-i' || arg === '--input') {
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
    input = arg;
    argmode = null;
  } else if (argmode === 'output') {
    output = arg;
    argmode = null;
  }
}

if (!input) {
  throw new Error('input is not provided!');
}
if (!output) {
  throw new Error('input is not provided!');
}

pack(input, output, { silent, verbose });
