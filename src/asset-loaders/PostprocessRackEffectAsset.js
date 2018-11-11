import Asset from '../systems/AssetSystem/Asset';

export default class PostprocessRackEffectAsset extends Asset {

  static factory(...args) {
    return new PostprocessRackEffectAsset(...args);
  }

  get targets() {
    return this._targets;
  }

  get connections() {
    return this._connections;
  }

  get effects() {
    return this._effects;
  }

  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
    this._targets = null;
    this._connections = null;
    this._effects = null;
  }

  dispose() {
    super.dispose();

    const { _descriptorAsset } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }

    this._descriptorAsset = null;
    this._targets = null;
    this._connections = null;
    this._effects = null;
  }

  load() {
    const { filename, owner } = this;

    return owner.load(`json://${filename}`)
      .then(descriptorAsset => {
        const descriptor = descriptorAsset.data;
        const { targets, connections, effects } = descriptor;
        if (!targets) {
          throw new Error(`Postprocess rack effect does not have targets: ${filename}`);
        }
        if (!connections) {
          throw new Error(`Postprocess rack effect does not have connections: ${filename}`);
        }
        if (!Array.isArray(connections)) {
          throw new Error(`Postprocess rack effect connections are not an array: ${filename}`);
        }
        if (!effects) {
          throw new Error(`Postprocess rack effect does not have effects: ${filename}`);
        }

        this.data = descriptor;
        this._descriptorAsset = descriptorAsset;
        this._targets = targets;
        this._connections = connections;
        this._effects = effects;

        return this;
      });
  }

}
