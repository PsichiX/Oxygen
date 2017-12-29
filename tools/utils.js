import fs from 'fs';
import fp from 'path';

export function mkdirp(path) {
  const { sep } = fp;
  const initDir = fp.isAbsolute(path) ? sep : '';

  path.split(sep).reduce((parentDir, childDir) => {
    const curDir = fp.resolve(parentDir, childDir);

    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    return curDir;
  }, initDir);
}
