import Asset from '../systems/AssetSystem/Asset';

export default class WaverAsset extends Asset {

  static factory(...args) {
    return new WaverAsset(...args);
  }

  load() {
    const { filename, owner } = this;
    
    return owner.load(`text://${filename}`)
      .then(asset => {
        this.data = asset.data;

        return this;
      });
  }

}
