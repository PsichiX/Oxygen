import Asset from '../systems/AssetSystem/Asset';

/**
 * Text asset loader.
 */
export default class TextAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {TextAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('text', TextAsset.factory);
   */
  static factory(...args) {
    return new TextAsset(...args);
  }

  /**
   * @override 
   */
  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.text()
        : Promise.reject(new Error(`Cannot load text file: ${filename}`))
      )
      .then(data => {
        this.data = data;

        return this;
      });
  }

}
