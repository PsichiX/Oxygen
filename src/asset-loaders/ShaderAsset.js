import Asset from '../systems/AssetSystem/Asset';

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
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    const { _descriptorAsset, _vertexAsset, _fragmentAsset } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }
    if (!!_vertexAsset) {
      _vertexAsset.dispose();
    }
    if (!!_fragmentAsset) {
      _fragmentAsset.dispose();
    }

    this._descriptorAsset = null;
    this._vertexAsset = null;
    this._fragmentAsset = null;
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

        this._descriptorAsset = descriptorAsset;
        return owner.loadSequence([
          `text://${descriptor.vertex}`,
          `text://${descriptor.fragment}`
        ]);
      })
      .then(sources => {
        const [ vertex, fragment ] = sources;

        this._vertexAsset = vertex;
        this._fragmentAsset = fragment;
        this.data = {
          vertex: vertex.data,
          fragment: fragment.data,
          layout: descriptor.layout,
          uniforms: descriptor.uniforms,
          samplers: descriptor.samplers,
          blending: descriptor.blending,
          extensions: descriptor.extensions
        };

        return this;
      });
  }

}
