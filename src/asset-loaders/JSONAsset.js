import Asset from '../systems/AssetSystem/Asset';

export default class JSONAsset extends Asset {

  static factory(...args) {
    return new JSONAsset(...args);
  }

  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.json()
        : Promise.reject(new Error(`Cannot load JSON file: ${filename}`))
      )
      .then(data => {
        this.data = data;

        return this;
      });
  }

}
