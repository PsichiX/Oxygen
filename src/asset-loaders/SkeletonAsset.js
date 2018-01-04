import bezierSampler from 'bezier-easing';
import Asset from '../systems/AssetSystem/Asset';

function linearSampler() {
  return x => x;
}

function steppedSampler() {
  return x => x >= 1 ? 1 : 0;
}

function applySamplers(data) {
  if (!data) {
    return;
  }

  const { animations } = data;
  if (!animations) {
    return;
  }

  for (const animationKey in animations) {
    const animation = animations[animationKey];
    const { bones } = animation;
    if (!!bones) {
      for (const boneKey in bones) {
        const timelines = bones[boneKey];
        for (const timelineKey in timelines) {
          const frames = timelines[timelineKey];
          for (const frame of frames) {
            const { curve } = frame;
            if (!curve || curve === 'linear') {
              frame.sample = linearSampler();
            } else if (curve === 'stepped') {
              frame.sample = steppedSampler();
            } else if (Array.isArray(curve) && curve.length === 4) {
              frame.sample = bezierSampler(
                curve[0],
                curve[1],
                curve[2],
                curve[3]
              );
            } else {
              console.warn(`Not supported curve mode: ${curve}`);
            }
          }
        }
      }
    }
  }
}

/**
 * Spine2D skeleton asset loader.
 */
export default class SkeletonAsset extends Asset {

  /**
   * Asset factory.
   *
   * @param {*}	args - Factory parameters.
   *
   * @return {SkeletonAsset} Asset instance.
   *
   * @example
   * system.registerProtocol('skeleton', SkeletonAsset.factory);
   */
  static factory(...args) {
    return new SkeletonAsset(...args);
  }

  /**
   * @override
   */
  constructor(...args) {
    super(...args);

    this._descriptorAsset = null;
  }

  /**
   * @override
   */
  dispose() {
    super.dispose();

    const { _descriptorAsset } = this;

    if (!!_descriptorAsset) {
      _descriptorAsset.dispose();
    }

    this._descriptorAsset = null;
  }

  /**
   * @override 
   */
  load() {
    const { filename, owner } = this;

    return owner.load(`json://${filename}`)
      .then(descriptorAsset => {
        this.data = descriptorAsset.data;
        this._descriptorAsset = descriptorAsset;
        applySamplers(this.data);

        return this;
      });
  }

}
