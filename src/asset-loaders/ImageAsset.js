import Asset from '../systems/AssetSystem/Asset';

export default class ImageAsset extends Asset {

  static factory(...args) {
    return new ImageAsset(...args);
  }

  dispose() {
    if (!!this.data) {
      delete this.data.src;
    }

    super.dispose();
  }

  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.blob()
        : Promise.reject(new Error(`Cannot load image file: ${filename}`))
      )
      .then(data => new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          this.data = image;

          resolve(this);
        };
        image.onerror = error => reject(`Cannot read image file: ${filename}`);

        image.src = URL.createObjectURL(data);
      }));
  }

}
