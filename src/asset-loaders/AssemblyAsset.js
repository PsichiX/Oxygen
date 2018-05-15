import Asset from '../systems/AssetSystem/Asset';

/**
 * Assembly (WASM) asset loader.
 */
export default class AssemblyAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {AssemblyAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('wasm', AssemblyAsset.factory);
   */
  static factory(...args) {
    return new AssemblyAsset(...args);
  }

  /**
   * @override
   */
  constructor(...args) {
    super(...args);

    this._binaryAsset = null;
    this._module = null;
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    const { _binaryAsset, _module } = this;

    if (!!_binaryAsset) {
      _binaryAsset.dispose();
    }

    this._binaryAsset = null;
    this._module = null;
  }

  /**
   * @override
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`binary://${filename}`)
      .then(binaryAsset => {
        const m = new WebAssembly.Module(new Uint8Array(binaryAsset.data));
        this._binaryAsset = binaryAsset;
        this.data = this._module = m;

        return this;
      });
  }

}
