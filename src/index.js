import JSONAsset from './asset-loaders/JSONAsset';
import TextAsset from './asset-loaders/TextAsset';
import BinaryAsset from './asset-loaders/BinaryAsset';
import ImageAsset from './asset-loaders/ImageAsset';
import ShaderAsset from './asset-loaders/ShaderAsset';
import SceneAsset from './asset-loaders/SceneAsset';
import AtlasAsset from './asset-loaders/AtlasAsset';
import FontAsset from './asset-loaders/FontAsset';
import SoundAsset from './asset-loaders/SoundAsset';
import MusicAsset from './asset-loaders/MusicAsset';
import ParticleSystemAsset from './asset-loaders/ParticleSystemAsset';
import PackAsset from './asset-loaders/PackAsset';
import SkeletonAsset from './asset-loaders/SkeletonAsset';
import SVGAsset from './asset-loaders/SVGAsset';
import SetAsset from './asset-loaders/SetAsset';
import AssemblyAsset from './asset-loaders/AssemblyAsset';
import PostprocessRackEffectAsset from './asset-loaders/PostprocessRackEffectAsset';
import Camera, { PostprocessPass } from './components/Camera';
import Camera2D from './components/Camera2D';
import CameraDirector2D from './components/CameraDirector2D';
import InputHandler from './components/InputHandler';
import GestureListener from './components/GestureListener';
import Particles from './components/Particles';
import PhysicsBody from './components/PhysicsBody';
import PhysicsWorld from './components/PhysicsWorld';
import PrefabInstance from './components/PrefabInstance';
import RectangleRenderer from './components/RectangleRenderer';
import Script from './components/Script';
import Sprite from './components/Sprite';
import AtlasSprite from './components/AtlasSprite';
import TextRenderer from './components/TextRenderer';
import VerticesRenderer from './components/VerticesRenderer';
import UiSprite from './components/UiSprite';
import UiLayout from './components/UiLayout';
import Skeleton from './components/Skeleton';
import SortedActions from './components/SortedActions';
import DeferredRenderer, { DeferredPipeline } from './components/DeferredRenderer';
import MultipassRenderer, { MultipassPipeline } from './components/MultipassRenderer';
import PostprocessRack, {
  PostprocessRackPass,
  PostprocessRackRawEffectPass
} from './components/PostprocessRack';
import Shape from './components/Shape';
import PolygonShape from './components/PolygonShape';
import CircleShape from './components/CircleShape';
import RectangleShape from './components/RectangleShape';
import System from './systems/System';
import EntitySystem from './systems/EntitySystem';
import Component from './systems/EntitySystem/Component';
import Entity from './systems/EntitySystem/Entity';
import AssetSystem from './systems/AssetSystem';
import Asset from './systems/AssetSystem/Asset';
import RenderSystem, {
  RenderTargetWrapper,
  Command,
  Pipeline,
  RenderFullscreenCommand
} from './systems/RenderSystem';
import InputSystem from './systems/InputSystem';
import StorageSystem from './systems/StorageSystem';
import AudioSystem from './systems/AudioSystem';
import AssemblySystem from './systems/AssemblySystem';
import Events from './utils/Events';
import {
  glMatrix,
  mat2,
  mat2d,
  mat3,
  mat4,
  quat,
  vec2,
  vec3,
  vec4
} from './utils/gl-matrix';
import { box2d } from './utils';
import AssetLoaders from './asset-loaders';
import Components from './components';
import Systems from './systems';
import Utils from './utils';

export default {
  AssetLoaders,
  Components,
  Systems,
  Utils,
  JSONAsset,
  TextAsset,
  BinaryAsset,
  ImageAsset,
  ShaderAsset,
  SceneAsset,
  AtlasAsset,
  FontAsset,
  SoundAsset,
  MusicAsset,
  ParticleSystemAsset,
  PackAsset,
  SkeletonAsset,
  SVGAsset,
  SetAsset,
  AssemblyAsset,
  PostprocessRackEffectAsset,
  Camera,
  PostprocessPass,
  Camera2D,
  CameraDirector2D,
  InputHandler,
  GestureListener,
  Particles,
  PhysicsBody,
  PhysicsWorld,
  PrefabInstance,
  RectangleRenderer,
  Script,
  Sprite,
  AtlasSprite,
  TextRenderer,
  VerticesRenderer,
  UiSprite,
  UiLayout,
  Skeleton,
  SortedActions,
  DeferredRenderer,
  DeferredPipeline,
  MultipassRenderer,
  MultipassPipeline,
  PostprocessRack,
  PostprocessRackPass,
  PostprocessRackRawEffectPass,
  Shape,
  PolygonShape,
  CircleShape,
  RectangleShape,
  System,
  EntitySystem,
  Component,
  Entity,
  RenderSystem,
  RenderTargetWrapper,
  Command,
  Pipeline,
  RenderFullscreenCommand,
  InputSystem,
  StorageSystem,
  AssetSystem,
  Asset,
  AudioSystem,
  AssemblySystem,
  Events,
  glMatrix,
  mat2,
  mat2d,
  mat3,
  mat4,
  quat,
  vec2,
  vec3,
  vec4,
  box2d
};

export {
  AssetLoaders,
  Components,
  Systems,
  Utils,
  JSONAsset,
  TextAsset,
  BinaryAsset,
  ImageAsset,
  ShaderAsset,
  SceneAsset,
  AtlasAsset,
  FontAsset,
  SoundAsset,
  MusicAsset,
  ParticleSystemAsset,
  PackAsset,
  SkeletonAsset,
  SVGAsset,
  SetAsset,
  AssemblyAsset,
  PostprocessRackEffectAsset,
  Camera,
  PostprocessPass,
  Camera2D,
  CameraDirector2D,
  InputHandler,
  GestureListener,
  Particles,
  PhysicsBody,
  PhysicsWorld,
  PrefabInstance,
  RectangleRenderer,
  Script,
  Sprite,
  AtlasSprite,
  TextRenderer,
  VerticesRenderer,
  UiSprite,
  UiLayout,
  Skeleton,
  SortedActions,
  DeferredRenderer,
  DeferredPipeline,
  MultipassRenderer,
  MultipassPipeline,
  PostprocessRack,
  PostprocessRackPass,
  PostprocessRackRawEffectPass,
  Shape,
  PolygonShape,
  CircleShape,
  RectangleShape,
  System,
  EntitySystem,
  Component,
  Entity,
  RenderSystem,
  RenderTargetWrapper,
  Command,
  Pipeline,
  RenderFullscreenCommand,
  InputSystem,
  StorageSystem,
  AssetSystem,
  Asset,
  AudioSystem,
  AssemblySystem,
  Events,
  glMatrix,
  mat2,
  mat2d,
  mat3,
  mat4,
  quat,
  vec2,
  vec3,
  vec4,
  box2d
};

export class EventsController {

  get transform() {
    return this._transform;
  }

  set transform(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._transform = value;
  }

  get update() {
    return this._update;
  }

  set update(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._update = value;
  }

  get view() {
    return this._view;
  }

  set view(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._view = value;
  }

  get gamepads() {
    return this._gamepads;
  }

  set gamepads(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._gamepads = value;
  }

  get all() {
    return this._transform
      && this._update
      && this._view
      && this._gamepads;
  }

  set all(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._transform = this._update = this._view = this._gamepads = value;
  }

  get none() {
    return !this._transform
      && !this._update
      && !this._view
      && !this._gamepads;
  }

  set none(value) {
    if (typeof value !== 'boolean') {
      throw new Error('`value` is not type of Boolean!');
    }

    this._transform = this._update = this._view = this._gamepads = !value;
  }

  get accepted() {
    const result = [];
    if (!!this._transform) {
      result.push('transform');
    }
    if (!!this._update) {
      result.push('update');
    }
    if (!!this._view) {
      result.push('view');
    }
    if (!!this._gamepads) {
      result.push('gamepads');
    }
    return result;
  }

  set accepted(value) {
    if (!Array.isArray(value)) {
      throw new Error('`value` is not type of Array!');
    }

    this._transform = value.indexOf('transform') >= 0;
    this._update = value.indexOf('update') >= 0;
    this._view = value.indexOf('view') >= 0;
    this._gamepads = value.indexOf('gamepads') >= 0;
  }

  constructor() {
    this._transform = true;
    this._update = true;
    this._view = true;
    this._gamepads = true;
  }

}

/**
 * Function used to initialize Oxygen Core engine without any effort.
 *
 * @param {*} config - engine configuration options.
 * @return {EventsController} - instance used to dynamically control events processing.
 *
 * @example
 * lazyInitialization({
 *   entities: { triggerEvents: true },
 *   asset: { pathPrefix: 'assets/' },
 *   render: { screen: 'screen-0' },
 *   input: { triggerEvents: true },
 *   store: { id: 'my-game-id' },
 *   events: { transform: true, update: true, view: true, gamepads: true }
 * });
 */
export function lazyInitialization({ entity, asset, render, input, store, events }) {
  const entities = System.register('EntitySystem', new EntitySystem(
    !!entity ? entity.triggerEvents : true
  ));
  const assets = System.register('AssetSystem', new AssetSystem(
    !!asset ? asset.pathPrefix : null,
    !!asset ? asset.fetchOptions : null,
    !!asset ? asset.fetchEngine : null
  ));
  const renderer = System.register('RenderSystem', new RenderSystem(
    !!render ? render.screen : null,
    !!render ? render.optimize : true,
    !!render ? render.extensions : null,
    !!render ? render.version : 1,
    !!render ? render.manualMode : false
  ));
  const inputs = System.register('InputSystem', new InputSystem(
    renderer.canvas,
    !!input ? input.triggerEvents : true
  ));
  const storage = System.register('StorageSystem', new StorageSystem(
    !!store ? store.id : 'oxygen-data'
  ));
  const audio = System.register('AudioSystem', new AudioSystem());
  const assembly = System.register('AssemblySystem', new AssemblySystem());
  const controller = new EventsController();
  controller.transform = !!events ? !!events.transform : true;
  controller.update = !!events ? !!events.update : true;
  controller.view = !!events ? !!events.view : true;
  controller.gamepads = !!events ? !!events.gamepads : true;

  entities.registerComponent('Camera2D', Camera2D.factory);
  entities.registerComponent('CameraDirector2D', CameraDirector2D.factory);
  entities.registerComponent('InputHandler', InputHandler.factory);
  entities.registerComponent('GestureListener', GestureListener.factory);
  entities.registerComponent('Particles', Particles.factory);
  entities.registerComponent('PhysicsBody', PhysicsBody.factory);
  entities.registerComponent('PhysicsWorld', PhysicsWorld.factory);
  entities.registerComponent('PrefabInstance', PrefabInstance.factory);
  entities.registerComponent('RectangleRenderer', RectangleRenderer.factory);
  entities.registerComponent('Script', Script.factory);
  entities.registerComponent('Sprite', Sprite.factory);
  entities.registerComponent('AtlasSprite', AtlasSprite.factory);
  entities.registerComponent('TextRenderer', TextRenderer.factory);
  entities.registerComponent('VerticesRenderer', VerticesRenderer.factory);
  entities.registerComponent('UiSprite', UiSprite.factory);
  entities.registerComponent('UiLayout', UiLayout.factory);
  entities.registerComponent('Skeleton', Skeleton.factory);
  entities.registerComponent('SortedActions', SortedActions.factory);
  entities.registerComponent('DeferredRenderer', DeferredRenderer.factory);
  entities.registerComponent('MultipassRenderer', MultipassRenderer.factory);
  entities.registerComponent('PostprocessRack', PostprocessRack.factory);
  entities.registerComponent('PolygonShape', PolygonShape.factory);
  entities.registerComponent('CircleShape', CircleShape.factory);
  entities.registerComponent('RectangleShape', RectangleShape.factory);

  assets.registerProtocol('json', JSONAsset.factory);
  assets.registerProtocol('text', TextAsset.factory);
  assets.registerProtocol('binary', BinaryAsset.factory);
  assets.registerProtocol('image', ImageAsset.factory);
  assets.registerProtocol('shader', ShaderAsset.factory);
  assets.registerProtocol('scene', SceneAsset.factory);
  assets.registerProtocol('atlas', AtlasAsset.factory);
  assets.registerProtocol('font', FontAsset.factory);
  assets.registerProtocol('sound', SoundAsset.factory);
  assets.registerProtocol('music', MusicAsset.factory);
  assets.registerProtocol('particles', ParticleSystemAsset.factory);
  assets.registerProtocol('pack', PackAsset.factory);
  assets.registerProtocol('skeleton', SkeletonAsset.factory);
  assets.registerProtocol('svg', SVGAsset.factory);
  assets.registerProtocol('set', SetAsset.factory);
  assets.registerProtocol('wasm', AssemblyAsset.factory);
  assets.registerProtocol('postprocess', PostprocessRackEffectAsset.factory);

  assets.events.on('load', asset => {
    const { protocol, filename, data } = asset;

    if (protocol === 'image' || protocol === 'svg') {
      renderer.registerTexture(
        filename,
        data,
        !!asset.options && !!asset.options.mipmap
      );
    } else if (protocol === 'shader') {
      renderer.registerShader(
        filename,
        data.vertex,
        data.fragment,
        data.layout,
        data.uniforms,
        data.samplers,
        data.blending,
        data.extensions
      );
    } else if (protocol === 'sound') {
      audio.registerSound(filename, data);
    } else if (protocol === 'music') {
      audio.registerMusic(filename, data);
    } else if (protocol === 'particles') {
      Particles.registerProcessor(filename, data);
    } else if (protocol === 'wasm') {
      assembly.registerAssembly(
        filename,
        data,
        !!asset.options && !!asset.options.imports
          ? (assembly.getImports(asset.options.imports) || {})
          : null
      );
    }
  });

  assets.events.on('unload', asset => {
    const { protocol, filename } = asset;

    if (protocol === 'image' || protocol === 'svg') {
      renderer.unregisterTexture(filename);
    } else if (protocol === 'shader') {
      renderer.unregisterShader(filename);
    } else if (protocol === 'sound') {
      audio.unregisterSound(filename);
    } else if (protocol === 'music') {
      audio.unregisterMusic(filename);
    } else if (protocol === 'particles') {
      Particles.unregisterProcessor(filename);
    } else if (protocol === 'wasm') {
      assembly.unregisterAssembly(filename);
    }
  });

  renderer.events.on('render', (context, renderer, deltaTime) => {
    !!controller.transform && entities.updateTransforms();
    !!controller.update && entities.performAction('update', deltaTime);
    !!controller.view && entities.performAction('view', context, renderer, deltaTime);
    !!controller.gamepads && inputs.scanForGamepads();
  });

  System.events.on('change-scene', path => {
    const asset = assets.get(path);
    if (!asset) {
      throw new Error(`There is no asset loaded: ${path}`);
    }
    if (!(asset instanceof SceneAsset)) {
      throw new Error(`Asset is not type of SceneAsset: ${path}`);
    }

    entities.root = entities.buildEntity(asset.data);
  });

  System.events.on('clear-scene', () => {
    entities.root = null;
  });

  return controller;
}
