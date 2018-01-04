import Asset from '../systems/AssetSystem/Asset';

/**
 * Particle system asset loader.
 */
export default class ParticleSystemAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {ParticleSystemAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('particles', ParticleSystemAsset.factory);
   */
  static factory(...args) {
    return new ParticleSystemAsset(...args);
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`text://${filename}`)
      .then(asset => {
        this.data = asset.data;

        return this;
      });
  }

}
