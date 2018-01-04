import Asset from '../systems/AssetSystem/Asset';

/**
 * Waver asset loader.
 *
 * @experimental
 */
export default class WaverAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {WaverAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('waver', WaverAsset.factory);
   */
  static factory(...args) {
    return new WaverAsset(...args);
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`text://${filename}`)
      .then(asset => {
        this.data = asset.data;

        return this;
      });
  }

}
