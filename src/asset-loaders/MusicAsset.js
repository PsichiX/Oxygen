import Asset from '../systems/AssetSystem/Asset';

export default class MusicAsset extends Asset {

  static factory(...args) {
    return new MusicAsset(...args);
  }

  load() {
    const { filename, owner } = this;

    return owner.fetchEngine(owner.pathPrefix + filename, owner.fetchOptions)
      .then(response => !!response.ok
        ? response.blob()
        : Promise.reject(new Error(`Cannot load music file: ${filename}`))
      )
      .then(data => new Promise((resolve, reject) => {
        const audio = new Audio();

        this.data = audio;
        audio.onerror = error => reject(`Cannot read music file: ${filename}`);
        audio.src = URL.createObjectURL(data);
        resolve(this);
      }));
  }

}
