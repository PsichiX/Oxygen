import Asset from '../systems/AssetSystem/Asset';

export default class SoundAsset extends Asset {

  static factory(...args) {
    return new SoundAsset(...args);
  }

  load() {
    const { filename, owner } = this;

    return owner.load(`binary://${filename}`)
      .then(asset => {
        this.data = asset.data;

        return this;
      });
  }

}
