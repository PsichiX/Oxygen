import Asset from '../systems/AssetSystem/Asset';

export default class SceneAsset extends Asset {

  static factory(...args) {
    return new SceneAsset(...args);
  }

  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
  }

  dispose() {
    super.dispose();

    const { _descriptorAsset } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }

    this._descriptorAsset = null;
  }

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
