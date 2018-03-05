import Asset from '../systems/AssetSystem/Asset';

const viewBoxPattern =
  /viewBox=\"(\d+(\.\d+)?)\s+(\d+(\.\d+)?)\s+(\d+(\.\d+)?)\s+(\d+(\.\d+)?)\"/;

/**
 * SVG image asset loader.
 */
export default class SVGAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {SVGAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('svg', SVGAsset.factory);
   */
  static factory(...args) {
    return new SVGAsset(...args);
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
        ? response.text()
        : Promise.reject(new Error(`Cannot load SVG image file: ${filename}`))
      )
      .then(data => new Promise((resolve, reject) => {
        const viewBox = viewBoxPattern.exec(data);
        if (!viewBox) {
          reject(new Error(`Cannot parse SVG image viewBox property: ${filename}`));
          return;
        }
        const b64 = `data:image/svg+xml;base64,${btoa(data)}`;
        const image = new Image();
        image.width = parseFloat(viewBox[5]) - parseFloat(viewBox[1]);
        image.height = parseFloat(viewBox[7]) - parseFloat(viewBox[3]);

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
        image.onerror = error => reject(`Cannot read SVG image file: ${filename}`);

        image.src = b64;
      }));
  }

}
