import Asset from '../systems/AssetSystem/Asset';

/**
 * Scene asset loader.
 */
export default class SceneAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {SceneAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('scene', SceneAsset.factory);
   */
  static factory(...args) {
    return new SceneAsset(...args);
  }

  /**
   * @override
   */
  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    const { _descriptorAsset } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }

    this._descriptorAsset = null;
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`json://${filename}`)
      .then(descriptorAsset => {
        this.data = descriptorAsset.data;
        this._descriptorAsset = descriptorAsset;

        return this;
      });
  }

}
