import Asset from '../systems/AssetSystem/Asset';

/**
 * Sound asset laoder.
 */
export default class SoundAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {SoundAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('sound', SoundAsset.factory);
   */
  static factory(...args) {
    return new SoundAsset(...args);
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`binary://${filename}`)
      .then(asset => {
        this.data = asset.data;

        return this;
      });
  }

}
