import Asset from '../systems/AssetSystem/Asset';

const regexNewLine = /[\r\n]+/;
const regexWhiteSpaces = /\s+/;
const regexKeyValuePair = /(\w+)=("(.*)"|(-?\d+)(,(-?\d+))?(,(-?\d+))?(,(-?\d+))?)/;

function getLineData(line) {
  const words = line.split(regexWhiteSpaces);

  if (words.length < 1) {
    throw new Error(`There is no words in line: ${line}`);
  }

  const result = {
    id: words[0],
    data: {}
  };

  for (let i = 1, c = words.length; i < c; ++i) {
    const word = words[i];
    const matches = regexKeyValuePair.exec(word);
    if (!matches) {
      throw new Error(`There is no key-value in word: ${word}`);
    }

    const [ , key,, txt, num0,, num1,, num2,, num3 ] = matches;

    if (typeof txt !== 'undefined') {
      result.data[key] = txt;
    } else if (typeof num3 !== 'undefined') {
      result.data[key] = [
        parseInt(num0),
        parseInt(num1),
        parseInt(num2),
        parseInt(num3)
      ];
    } else if (typeof num2 !== 'undefined') {
      result.data[key] = [
        parseInt(num0),
        parseInt(num1),
        parseInt(num2)
      ];
    } else if (typeof num1 !== 'undefined') {
      result.data[key] = [
        parseInt(num0),
        parseInt(num1)
      ];
    } else if (typeof num0 !== 'undefined') {
      result.data[key] = parseInt(num0);
    }
  }

  return result;
}

export default class AtlasAsset extends Asset {

  static factory(...args) {
    return new AtlasAsset(...args);
  }

  constructor(...args) {
    super(...args);

    this._descriptor = null;
    this._textAsset = null;
    this._imageAssets = null;
  }

  dispose() {
    super.dispose();

    const { _descriptor, _textAsset, _imageAssets } = this;

    if (!!_descriptor) {
      _descriptor.pages.clear();
      _descriptor.chars.clear();
    }
    if (!!_textAsset) {
      _textAsset.dispose();
    }
    if (!!_imageAssets) {
      for (let i = 0, c = _imageAssets.length; i < c; ++i) {
        _imageAssets[i].dispose();
      }
    }

    this._descriptor = null;
    this._textAsset = null;
    this._imageAssets = null;
  }

  load() {
    const { filename, owner } = this;

    return owner.load(`text://${filename}`)
      .then(textAsset => {
        const data = textAsset.data;
        this._textAsset = textAsset;

        const descriptor = this._descriptor = {
          info: null,
          common: null,
          pages: new Map(),
          chars: new Map()
        };
        const lines = data.split(regexNewLine);
        const images = [];

        for (let i = 0, c = lines.length; i < c; ++i) {
          const meta = getLineData(lines[i]);
          const { id } = meta;

          if (id === 'info') {
            descriptor.info = meta.data;
          } else if (id === 'common') {
            descriptor.common = meta.data;
          } else if (id === 'page') {
            descriptor.pages.set(meta.data.id, meta.data);
            images.push(meta.data.file);
          } else if (id === 'char') {
            descriptor.chars.set(meta.data.id, meta.data);
          }
        }

        return images;
      })
      .then(paths => owner.loadSequence(paths.map(path => `image://${path}`)))
      .then(imageAssets => {
        this._imageAssets = imageAssets;
        this.data = {
          descriptor: this._descriptor,
          images: imageAssets.map(asset => asset.data)
        };

        return this;
      });
  }

}
