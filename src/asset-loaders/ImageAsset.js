import Asset from '../systems/AssetSystem/Asset';

/**
 * Image asset loader.
 */
export default class ImageAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {ImageAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('image', ImageAsset.factory);
   */
  static factory(...args) {
    return new ImageAsset(...args);
  }

  /**
   * @override
   */
  dispose() {
    if (!!this.data) {
      delete this.data.src;
    }

    super.dispose();
  }

  /**
   * @override
   */
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
          const { options } = this;
          if (!!options) {
            if ('scale' in options && typeof options.scale === 'number') {
              image.width *= options.scale;
              image.height *= options.scale;
            }
          }
          this.data = image;

          resolve(this);
        };
        image.onerror = error => reject(`Cannot read image file: ${filename}`);

        image.src = URL.createObjectURL(data);
      }));
  }

}
