import fs from 'fs';
import fp from 'path';
import { WritableStreamBuffer } from 'stream-buffers';

function toUnixPath(path, input) {
  path = fp.relative(input, path);
  path = fp.normalize(path);
  return path.replace(/\\/g, '/');
}

function listDirectory(path, input, state = null) {
  state = state || { offset: 0 };
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
        content: listDirectory(fpath, input, state)
      };
    } else {
      const content = fs.readFileSync(fpath);
      if (!content) {
        throw new Error(`Cannot read file: ${fpath}`);
      }

      const o = state.offset;
      state.offset += content.byteLength;

      return {
        file: true,
        name,
        path: fname,
        offset: o,
        size: stat.size,
        content
      };
    }
  });
}

function toDescriptor(files) {
  return files.map(item => {
    const { file, dir } = item;
    if (!!file) {
      const { name, path, offset, size } = item;

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
        content: toDescriptor(item.content)
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
  if (typeof input !== 'string') {
    throw new Error('`input` is not type of String!');
  }

  const files = listDirectory(input, input);
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
  if (typeof input !== 'string') {
    throw new Error('`input` is not type of String!');
  }
  if (typeof output !== 'string') {
    throw new Error('`output` is not type of String!');
  }

  const { silent } = options;
  !silent && console.log(`Packing "${input}" into "${output}"...`);
  const result = packToBuffer(input);
  fs.writeFileSync(output, result, { encoding: 'binary' });
  !silent && console.log('Done!');
}
