import Asset from '../systems/AssetSystem/Asset';
import AssetSystem from '../systems/AssetSystem';

export default class PackAsset extends Asset {

  static factory(...args) {
    return new PackAsset(...args);
  }

  constructor(...args) {
    super(...args);

    this._baseOffset = 0;
    this._descriptor = null;
    this._raw = null;
    this._binaryAsset = null;
  }

  dispose() {
    super.dispose();

    const { _binaryAsset } = this;

    if (!!_binaryAsset) {
      _binaryAsset.dispose();
    }

    this._baseOffset = 0;
    this._descriptor = null;
    this._raw = null;
    this._binaryAsset = null;
  }

  load() {
    const { filename, owner } = this;

    return owner.load(`binary://${filename}`)
      .then(asset => {
        const { data } = asset;
        const view = new DataView(data);
        const descriptorSize = view.getUint32(0);
        const descriptorText = String.fromCharCode.apply(
          null,
          new Uint8Array(data, 4, descriptorSize)
        );
        const descriptor = JSON.parse(descriptorText);

        this._descriptor = descriptor;
        this._baseOffset = descriptorSize + 4;
        this._raw = data;
        this._binaryAsset = asset;
        this.data = {
          descriptor,
          raw: data
        };

        return this;
      });
  }

  fetchSubAsset(path, options, fallbackEngine) {
    try {
      const view = this.entryView(path, true);
      return AssetSystem.fetchArrayView(view, path, options, fallbackEngine);
    } catch(error) {
      return Promise.reject(error);
    }
  }

  hasEntry(path) {
    return !!this._findEntry(path, this._descriptor);
  }

  entryView(path, noThrow = false) {
    const entry = this._findEntry(path, this._descriptor);
    if (!entry) {
      if (!!noThrow) {
        return null;
      } else {
        throw new Error(`Cannot find entry: ${path}`);
      }
    }
    if (!entry.file) {
      if (!!noThrow) {
        return null;
      } else {
        throw new Error(`Entry is not a file: ${path}`);
      }
    }

    return new Uint8Array(
      this._raw,
      this._baseOffset + entry.offset,
      entry.size
    );
  }

  entryText(path, noThrow = false) {
    const view = this.entryView(path, noThrow);
    return String.fromCharCode.apply(null, view);
  }

  _findEntry(path, list) {
    for (const item of list) {
      if (item.path === path) {
        return item;
      } else if (!!item.dir) {
        const found = this._findEntry(path, item.content);

        if (!!found) {
          return found;
        }
      }
    }

    return null;
  }

}
