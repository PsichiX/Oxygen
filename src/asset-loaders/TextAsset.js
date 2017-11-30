import Asset from '../systems/AssetSystem/Asset';

export default class TextAsset extends Asset {

  static factory(...args) {
    return new TextAsset(...args);
  }

  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.text()
        : Promise.reject(new Error(`Cannot load text file: ${filename}`))
      )
      .then(data => {
        this.data = data;

        return this;
      });
  }

}
