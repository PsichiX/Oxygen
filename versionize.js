#!/usr/bin/env node

var fs = require('fs');
var pkg = require('./package.json');

var contents = {
  name: pkg.name,
  description: pkg.description,
  version: pkg.version,
  author: pkg.author
};

fs.writeFileSync('./bin/version.json', JSON.stringify(contents, null, 2));
