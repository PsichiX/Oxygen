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
    const inputPrefix = compiler.context;

    compiler.plugin('emit', (compilation, callback) => {
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

        const ipaths = Array.isArray(input)
          ? input.map(i => fp.join(inputPrefix, i))
          : [ fp.join(inputPrefix, input) ];
        const result = packToBuffer(ipaths);
        compilation.assets[output] = {
          source: () => result,
          size: () => result.byteLength
        };
      }

      callback();
    });

    compiler.plugin('after-emit', (compilation, callback) => {
      const deps = new Set(compilation.contextDependencies);

      for (const item of _patterns) {
        let { input, output } = item;
        if (!input) {
          throw new Error(
            'PackWebpackPlugin: pattern `input` field cannot be null!'
          );
        }

        const ipaths = Array.isArray(input)
          ? input.map(i => fp.join(inputPrefix, i))
          : [ fp.join(inputPrefix, input) ];
        for (const i of ipaths) {
          if (!deps.has(i)) {
            compilation.contextDependencies.push(i);
          }
        }
      }

      callback();
    });
  }

}
