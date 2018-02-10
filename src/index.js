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
import Camera, { PostprocessPass } from './components/Camera';
import Camera2D from './components/Camera2D';
import CameraDirector2D from './components/CameraDirector2D';
import InputHandler from './components/InputHandler';
import InputListener from './components/InputListener';
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
import Postprocess from './components/Postprocess';
import DeferredRenderer, { DeferredPipeline } from './components/DeferredRenderer';
import System from './systems/System';
import EntitySystem from './systems/EntitySystem';
import Component from './systems/EntitySystem/Component';
import Entity from './systems/EntitySystem/Entity';
import AssetSystem from './systems/AssetSystem';
import Asset from './systems/AssetSystem/Asset';
import RenderSystem, { Command, Pipeline, RenderFullscreenCommand } from './systems/RenderSystem';
import InputSystem from './systems/InputSystem';
import StorageSystem from './systems/StorageSystem';
import AudioSystem from './systems/AudioSystem';
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
  Camera,
  PostprocessPass,
  Camera2D,
  CameraDirector2D,
  InputHandler,
  InputListener,
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
  Postprocess,
  DeferredRenderer,
  DeferredPipeline,
  System,
  EntitySystem,
  Component,
  Entity,
  RenderSystem,
  Command,
  Pipeline,
  RenderFullscreenCommand,
  InputSystem,
  StorageSystem,
  AssetSystem,
  Asset,
  AudioSystem,
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
  Camera,
  PostprocessPass,
  Camera2D,
  CameraDirector2D,
  InputHandler,
  InputListener,
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
  Postprocess,
  DeferredRenderer,
  DeferredPipeline,
  System,
  EntitySystem,
  Component,
  Entity,
  RenderSystem,
  Command,
  Pipeline,
  RenderFullscreenCommand,
  InputSystem,
  StorageSystem,
  AssetSystem,
  Asset,
  AudioSystem,
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

/**
 * Function used to initialize Oxygen Core engine without any effort.
 *
 * @param {*} config - engine configuration options.
 *
 * @example
 * lazyInitialization({
 *   entities: { triggerEvents: true },
 *   asset: { pathPrefix: 'assets/' },
 *   render: { screen: 'screen-0' },
 *   input: { triggerEvents: true },
 *   store: { id: 'my-game-id' },
 *   events: { transform: true, update: true, view: true, gamepads: true, leap: true }
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
    !!render ? render.version : 1
  ));
  const inputs = System.register('InputSystem', new InputSystem(
    renderer.canvas,
    !!input ? input.triggerEvents : true
  ));
  const storage = System.register('StorageSystem', new StorageSystem(
    !!store ? store.id : 'oxygen-data'
  ));
  const audio = System.register('AudioSystem', new AudioSystem());
  const eventTransform = !!events ? !!events.transform : true;
  const eventUpdate = !!events ? !!events.update : true;
  const eventView = !!events ? !!events.view : true;
  const eventGamepads = !!events ? !!events.gamepads : true;
  const eventLeap = !!events ? !!events.leap : true;

  entities.registerComponent('Camera2D', Camera2D.factory);
  entities.registerComponent('CameraDirector2D', CameraDirector2D.factory);
  entities.registerComponent('InputHandler', InputHandler.factory);
  entities.registerComponent('InputListener', InputListener.factory);
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
  entities.registerComponent('Postprocess', Postprocess.factory);
  entities.registerComponent('DeferredRenderer', DeferredRenderer.factory);

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

  assets.events.on('load', asset => {
    const { protocol, filename, data } = asset;

    if (protocol === 'image' || protocol === 'svg') {
      renderer.registerTexture(filename, data);
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
    }
  });

  renderer.events.on('render', (context, renderer, deltaTime) => {
    eventTransform && entities.updateTransforms();
    eventUpdate && entities.performAction('update', deltaTime);
    eventView && entities.performAction('view', context, renderer, deltaTime);
    eventGamepads && inputs.scanForGamepads();
    eventLeap && inputs.leapProcessFrame();
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
}
