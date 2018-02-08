import fs from 'fs';
import fp from 'path';
import process from 'process';
import { WritableStreamBuffer } from 'stream-buffers';
import { mkdirp } from './utils';

function toUnixPath(path, input) {
  path = fp.relative(input, path);
  path = fp.normalize(path);
  return path.replace(/\\/g, '/');
}

function merge(source, target) {
  for (const s of source) {
    const t = !!target ? target.find(i => i.name === s.name) : null;
    if (!!t) {
      if (!!t.file) {
        t.content = s.content;
        t.size = s.size;
      } else if (!!t.dir) {
        merge(s.content, t.content);
      }
    } else {
      target.push(s);
    }
  }
}

function listDirectories(paths) {
  const sources = paths.map(p => listDirectory(p, p));
  const files = [];
  for (const s of sources) {
    merge(s, files);
  }
  return files;
}

function listDirectory(path, input) {
  const list = fs.readdirSync(path);
  if (!list) {
    throw new Error(`Cannot list path: ${path}`);
  }

  return list.map(name => {
    const fpath = `${path}/${name}`;
    const fname = toUnixPath(fpath, input);
    const stat = fs.statSync(fpath);
    if (stat.isDirectory()) {
      return {
        dir: true,
        name,
        path: fname,
        content: listDirectory(fpath, input)
      };
    } else {
      const content = fs.readFileSync(fpath);
      if (!content) {
        throw new Error(`Cannot read file: ${fpath}`);
      }

      return {
        file: true,
        name,
        path: fname,
        size: content.byteLength,
        content
      };
    }
  });
}

function toDescriptor(files, state) {
  state = state || { offset: 0 };
  return files.map(item => {
    const { file, dir } = item;
    if (!!file) {
      const { name, path, size } = item;
      const offset = state.offset;
      state.offset += item.size;

      return {
        file,
        name,
        path,
        offset,
        size
      };
    } else if (!!dir) {
      const { name, path } = item;

      return {
        dir,
        name,
        path,
        content: toDescriptor(item.content, state)
      };
    }
  });
}

function writeFiles(stream, files) {
  for (const item of files) {
    if (!!item.file) {
      stream.write(item.content);
      item.content = null;
    } else if (!!item.dir) {
      writeFiles(stream, item.content);
    }
  }
}

export function packToBuffer(input, options = {}) {
  if (!Array.isArray(input)) {
    input = [ input ];
  }
  for (const i of input) {
    if (typeof i !== 'string') {
      throw new Error('One of `input` elements is not type of String!');
    }
  }

  const files = listDirectories(input);
  const descriptor = toDescriptor(files);
  const descriptorBinary = Buffer.from(JSON.stringify(descriptor));
  const headerBinary = Buffer.alloc(4);
  const stream = new WritableStreamBuffer();
  if (!stream) {
    throw new Error('Cannot create output stream!');
  }

  headerBinary.writeUInt32BE(descriptorBinary.length | 0, 0);
  stream.write(headerBinary);
  stream.write(descriptorBinary);
  writeFiles(stream, files);
  stream.end();

  return stream.getContents();
}

export function pack(input, output, options = {}) {
  if (!Array.isArray(input)) {
    input = [ input ];
  }
  for (const i of input) {
    if (typeof i !== 'string') {
      throw new Error('One of `input` elements is not type of String!');
    }
  }
  if (typeof output !== 'string') {
    throw new Error('`output` is not type of String!');
  }

  const { silent } = options;
  !silent && console.log(`Packing "${input.join(';')}" into "${output}"...`);
  const result = packToBuffer(input);
  mkdirp(fp.dirname(output));
  fs.writeFileSync(output, result, { encoding: 'binary' });
  !silent && console.log('Done!');
}
