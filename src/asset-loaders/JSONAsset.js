import Asset from '../systems/AssetSystem/Asset';

/**
 * JSON asset loader.
 */
export default class JSONAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {JSONAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('json', JSONAsset.factory);
   */
  static factory(...args) {
    return new JSONAsset(...args);
  }

  /**
   * @override 
   */
  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.json()
        : Promise.reject(new Error(`Cannot load JSON file: ${filename}`))
      )
      .then(data => {
        this.data = data;

        return this;
      });
  }

}
