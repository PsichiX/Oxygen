import Asset from '../systems/AssetSystem/Asset';

/**
 * Set of ossets list asset loader.
 */
export default class SetAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {SetAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('set', SetAsset.factory);
   */
  static factory(...args) {
    return new SetAsset(...args);
  }

  /**
   * @override
   */
  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
    this._assetList = null;
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    const { _descriptorAsset, _assetList } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }
    if (!!_assetList && _assetList.length > 0) {
      for (const asset of _assetList) {
        asset.dispose();
      }
    }

    this._descriptorAsset = null;
    this._assetList = null;
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`json://${filename}`)
      .then(descriptorAsset => {
        const descriptor = descriptorAsset.data;

        if (!Array.isArray(descriptor.assets)) {
          throw new Error(`Set descriptor does not have assets list: ${filename}`);
        }

        this.data = descriptor;
        this._descriptorAsset = descriptorAsset;

        return owner.loadSequence(descriptor.assets);
      })
      .then(assets => {
        this._assetList = assets;
        return this;
      });
  }

}
