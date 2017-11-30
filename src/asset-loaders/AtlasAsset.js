import Asset from '../systems/AssetSystem/Asset';

export default class AtlasAsset extends Asset {

  static factory(...args) {
    return new AtlasAsset(...args);
  }

  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
    this._imageAsset = null;
  }

  dispose() {
    super.dispose();

    const { _descriptorAsset, _imageAsset } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }
    if (!!_imageAsset) {
      _imageAsset.dispose();
    }

    this._descriptorAsset = null;
    this._imageAsset = null;
  }

  load() {
    const { filename, owner } = this;

    return owner.load(`json://${filename}`)
      .then(descriptorAsset => {
        const data = descriptorAsset.data;
        this._descriptorAsset = descriptorAsset;

        const { meta } = data;
        if (!meta) {
          throw new Error(`There is no metadata in atlas descriptor: ${filename}`);
        }

        const { image } = meta;
        if (typeof image !== 'string') {
          throw new Error(`There is no image path in atlas descriptor: ${filename}`);
        }

        return image;
      })
      .then(path => owner.load(`image://${path}`))
      .then(imageAsset => {
        this._imageAsset = imageAsset;
        this.data = {
          descriptor: this._descriptorAsset.data,
          image: imageAsset.data
        };

        return this;
      });
  }

}
