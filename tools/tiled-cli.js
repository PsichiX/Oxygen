#!/usr/bin/env node

import process from 'process';
import fs from 'fs';
import tiled from './tiled';

const args = process.argv;
let argmode = null;
let json = null;
let output = null;
const ignore = [];

for (let i = 1, c = args.length; i < c; ++i) {
  const arg = args[i];
  if (!argmode) {
    if (arg === '-h' || arg === '--help') {
      console.log(
        'Usage: oxy-tiled -j map.json -o destination/path/\n' +
        '  -j  | --json   - Tiled map file.\n' +
        '  -o  | --output - Destination directory for converted files.\n' +
        '  -i  | --ignore - Ignored layer names.'
      );
      process.exit(1);
    } else if (arg === '-j' || arg === '--json') {
      argmode = 'json';
    } else if (arg === '-o' || arg === '--output') {
      argmode = 'output';
    } else if (arg === '-i' || arg === '--ignore') {
      argmode = 'ignore';
    }
  } else if (argmode === 'json') {
    json = arg;
    argmode = null;
  } else if (argmode === 'output') {
    output = arg;
    argmode = null;
  } else if (argmode === 'ignore') {
    ignore.push(...arg.split(','));
    argmode = null;
  }
}

if (!json) {
  throw new Error('json path is not provided!');
}
if (!output) {
  throw new Error('output is not provided!');
}

tiled(json, output, ignore);
