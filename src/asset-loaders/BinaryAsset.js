import Asset from '../systems/AssetSystem/Asset';

/**
 * Binary asset loader.
 */
export default class BinaryAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {BinaryAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('binary', BinaryAsset.factory);
   */
  static factory(...args) {
    return new BinaryAsset(...args);
  }

  /**
   * @override 
   */
  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.arrayBuffer()
        : Promise.reject(new Error(`Cannot load binary file: ${filename}`))
      )
      .then(data => {
        this.data = data;

        return this;
      });
  }

}
