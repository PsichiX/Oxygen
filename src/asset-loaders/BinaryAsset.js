import Asset from '../systems/AssetSystem/Asset';

export default class BinaryAsset extends Asset {

  static factory(...args) {
    return new BinaryAsset(...args);
  }

  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.arrayBuffer()
        : Promise.reject(new Error(`Cannot load binary file: ${filename}`))
      )
      .then(data => {
        this.data = data;

        return this;
      });
  }

}
