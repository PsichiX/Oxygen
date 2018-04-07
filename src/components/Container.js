import Sprite from './Sprite';
import { RenderTargetWrapper } from '../systems/RenderSystem';

export default class Container extends Sprite {

  static factory() {
    return new Container();
  }

  get renderTargetId() {
    return this._renderTarget.id;
  }

  constructor() {
    super();

    const rt = this._renderTarget = new RenderTargetWrapper();
    rt.pushPopMode = true;
    this.overrideBaseTexture = rt.id;
  }

  dispose() {
    super.dispose();

    const { _renderTarget } = this;
    if (!!_renderTarget) {
      _renderTarget.dipose();
    }

    this._renderTarget = null;
  }

  onRender(gl, renderer, deltaTime, layer = null) {
    const { _renderTarget, width, height } = this;
    if (!_renderTarget) {
      return;
    }

    if (_renderTarget.width !== width || _renderTarget.height !== height) {
      _renderTarget.width = width;
      _renderTarget.height = height;
    }
    _renderTarget.enable(renderer);
    // TODO: build projection and perform view action on children.
    _renderTarget.disable();
    super.onRender(gl, renderer, deltaTime, layer);
  }

}
