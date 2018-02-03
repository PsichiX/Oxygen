import Asset from '../systems/AssetSystem/Asset';

const includePattern = /\#include\s+\"([\w/.-]+)\"/g;

/**
 * Shader asset loader.
 */
export default class ShaderAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {ShaderAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('shader', ShaderAsset.factory);
   */
  static factory(...args) {
    return new ShaderAsset(...args);
  }

  /**
   * @override
   */
  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
    this._vertexAsset = null;
    this._fragmentAsset = null;
    this._includes = null;
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    const {
      _descriptorAsset,
      _vertexAsset,
      _fragmentAsset,
      _includes
    } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }
    if (!!_vertexAsset) {
      _vertexAsset.dispose();
    }
    if (!!_fragmentAsset) {
      _fragmentAsset.dispose();
    }
    if (!!_includes) {
      for (const item of _includes) {
        item.dispose();
      }
    }

    this._descriptorAsset = null;
    this._vertexAsset = null;
    this._fragmentAsset = null;
    this._includes = null;
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;
    let descriptor = null;

    return owner.load(`json://${filename}`)
      .then(descriptorAsset => {
        descriptor = descriptorAsset.data;

        if (typeof descriptor.vertex !== 'string') {
          throw new Error(
            `Shader descriptor does not have vertex source path: ${filename}`
          );
        }
        if (typeof descriptor.fragment !== 'string') {
          throw new Error(
            `Shader descriptor does not have fragment source path: ${filename}`
          );
        }

        const result = [
          `text://${descriptor.vertex}`,
          `text://${descriptor.fragment}`
        ];
        if (Array.isArray(descriptor.includes)) {
          for (const item of descriptor.includes) {
            result.push(`text://${item}`);
          }
        }

        this._descriptorAsset = descriptorAsset;
        return owner.loadSequence(result);
      })
      .then(sources => {
        const [ vertex, fragment ] = sources;
        this._includes = sources.slice(2);
        this._vertexAsset = vertex;
        this._fragmentAsset = fragment;
        this.data = {
          vertex: this._implement(vertex.data, this._includes),
          fragment: this._implement(fragment.data, this._includes),
          layout: descriptor.layout,
          uniforms: descriptor.uniforms,
          samplers: descriptor.samplers,
          blending: descriptor.blending,
          extensions: descriptor.extensions
        };

        return this;
      });
  }

  _implement(source, includes) {
    if (!includes || includes.length <= 0) {
      return source;
    }

    const { owner } = this;
    return source.replace(includePattern, (m, p) => {
      const asset = owner.get(`text://${p}`);
      if (!asset) {
        throw new Error(`There is no loaded include shader: ${p}`);
      }

      return asset.data;
    });
  }

}
