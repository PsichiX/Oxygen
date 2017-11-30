import fp from 'path';
import { packToBuffer } from './pack';

module.exports = class PackWebpackPlugin {

  constructor(patterns = [], options = {}) {
    if (!Array.isArray(patterns)) {
      throw new Error('`patterns` is not type of Array!');
    }

    this._patterns = patterns;
    this._options = options;
  }

  apply(compiler) {
    const { _patterns, _options } = this;

    compiler.plugin('emit', (compilation, callback) => {
      const inputPrefix = compiler.context;
      for (const item of _patterns) {
        let { input, output } = item;
        if (!input) {
          throw new Error(
            'PackWebpackPlugin: pattern `input` field cannot be null!'
          );
        }
        if (!output) {
          output = 'assets.pack';
        }

        const ipath = fp.join(inputPrefix, input);
        const result = packToBuffer(ipath);
        compilation.assets[output] = {
          source: () => result,
          size: () => result.byteLength
        };
      }

      callback();
    });
  }

}
