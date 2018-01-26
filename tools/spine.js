import fs from 'fs';
import fp from 'path';
import { mkdirp } from './utils';

function parseAtlas(content) {
  const lines = content.trim().split(/[\n\r]/);
  const result = {};
  let page = null;
  let region = null;

  for (const line of lines) {
    if (line === '') {
      page = null;
      region = null;
    } else if (!page) {
      result[line] = page = { regions: {} };
    } else {
      if (!region) {
        const f = line.indexOf(':');

        if (f >= 0) {
          const prop = line.substr(0, f).trim();
          const value = line.substr(f + 1).trim();

          if (prop === 'size') {
            const f = value.split(',');

            page.size = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim())
            ];
          } else if (prop === 'format') {
            page.format = value;
          } else if (prop === 'filter') {
            const f = value.split(',');

            page.filter = [
              f[0].trim(),
              f[1].trim()
            ];
          } else if (prop === 'repeat') {
            page.repeat = value;
          }
        } else {
          page.regions[line] = region = {};
        }
      } else {
        const f = line.indexOf(':');

        if (f >= 0) {
          const prop = line.substr(0, f).trim();
          const value = line.substr(f + 1).trim();

          if (prop === 'rotate') {
            region.rotate = value === 'true';
          } else if (prop === 'xy') {
            const f = value.split(',');

            region.xy = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim())
            ];
          } else if (prop === 'size') {
            const f = value.split(',');

            region.size = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim())
            ];
          } else if (prop === 'split') {
            const f = value.split(',');

            region.split = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim()),
              parseInt(f[2].trim()),
              parseInt(f[3].trim())
            ];
          } else if (prop === 'pad') {
            const f = value.split(',');

            region.pad = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim()),
              parseInt(f[2].trim()),
              parseInt(f[3].trim())
            ];
          } else if (prop === 'orig') {
            const f = value.split(',');

            region.orig = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim())
            ];
          } else if (prop === 'offset') {
            const f = value.split(',');

            region.offset = [
              parseInt(f[0].trim()),
              parseInt(f[1].trim())
            ];
          } else if (prop === 'index') {
            region.index = parseInt(value);
          }
        } else {
          page.regions[line] = region = {};
        }
      }
    }
  }

  return result;
}

function convertAtlas(name, data) {
  const result = { meta: {}, frames: {} };
  const { meta, frames } = result;

  meta.image = name;
  meta.size = {
    w: data.size[0],
    h: data.size[1]
  };
  meta.scale = '1';

  for (const key in data.regions) {
    const region = data.regions[key];

    frames[key] = {
      frame: {
        x: region.xy[0] || 0,
        y: region.xy[1] || 0,
        w: region.size[0] || 0,
        h: region.size[1] || 0
      }
    };
  }

  return result;
}

function mapFind(data, cb) {
  for (const key in data) {
    const value = data[key];

    if (cb(key, value)) {
      return value;
    }
  }

  return null;
}

function mapFindSomething(data, cb) {
  for (const key in data) {
    const value = data[key];
    const result = cb(key, value);

    if (result !== undefined) {
      return result;
    }
  }

  return null;
}

function findNodePath(name, root, path = '.') {
  if (root.name === name) {
    return `${path}/${name}`;
  }

  if (!!root.children) {
    for (const child of root.children) {
      const found = findNodePath(name, child, `${path}/${root.name}`);
      if (!!found) {
        return found;
      }
    }
  }

  return null;
}

function spineAtlas(input, output) {
  const content = fs.readFileSync(input);
  if (!content) {
    throw new Error(`Cannot read file: ${input}`);
  }

  mkdirp(output);
  const atlas = parseAtlas(content.toString());
  for (const key in atlas) {
    const buffer = fs.readFileSync(fp.join(fp.dirname(input), key));
    const data = convertAtlas(key, atlas[key]);

    fs.writeFileSync(fp.join(output, key), buffer);
    fs.writeFileSync(
      fp.join(output, `${fp.basename(key, fp.extname(key))}.atlas.json`),
      JSON.stringify(data, null, '  ')
    );
  }

  return atlas;
}

function spinePrefab(input, output, atlasData, options = {}) {
  const content = fs.readFileSync(input);
  if (!content) {
    throw new Error(`Cannot read file: ${input}`);
  }

  options.shader = options.shader || 'shaders/sprite-transparent.json';
  options.invertX = options.invertX === 'true';
  options.invertY = options.invertY !== 'false';
  options.invertRotation = options.invertRotation !== 'false';
  options.defaultSkin = options.defaultSkin || 'default';

  const fx = options.invertX ? -1 : 1;
  const fy = options.invertY ? -1 : 1;
  const fr = options.invertRotation ? -1 : 1;
  const data = JSON.parse(content.toString());
  const { bones, slots, skins, animations } = data;
  const nodes = [];
  const defaultSkin = skins[options.defaultSkin];
  const skeleton = {
    fps: data.skeleton.fps || 30,
    slots: {},
    bones: {},
    attachments: {},
    skins,
    pose: {},
    animations
  };
  if (!defaultSkin) {
    throw new Error(`There is no default skin: ${options.defaultSkin}`);
  }
  for (const key in skins) {
    const skin = skins[key];
    for (const key in skin) {
      const slot = skin[key];
      for (const key in slot) {
        const attachment = slot[key];

        if ('x' in attachment) {
          attachment.x *= fx;
        }
        if ('y' in attachment) {
          attachment.y *= fy;
        }
        if ('rotation' in attachment) {
          attachment.rotation *= fr;
        }
      }
    }
  }
  for (const animationKey in animations) {
    const animation = animations[animationKey];
    for (const typeKey in animation) {
      const type = animation[typeKey];
      if (typeKey === 'events') {
        type.sort((a, b) => a.time - b.time);
        for (const eventKey in type) {
          const event = type[eventKey];
          if ('time' in event) {
            animation.duration = Math.max(animation.duration || 0, event.time);
          }
        }
      } else {
        for (const itemKey in type) {
          const item = type[itemKey];
          for (const timelineKey in item) {
            const timeline = item[timelineKey];
            for (const frame of timeline) {
              if ('time' in frame) {
                animation.duration = Math.max(animation.duration || 0, frame.time);
              }
            }
            timeline.sort((a, b) => a.time - b.time);
            if (typeKey === 'bones') {
              if (timelineKey === 'translate') {
                for (const frame of timeline) {
                  if ('x' in frame) {
                    frame.x *= fx;
                  }
                  if ('y' in frame) {
                    frame.y *= fy;
                  }
                }
              } else if (timelineKey === 'rotate') {
                for (const frame of timeline) {
                  if ('angle' in frame) {
                    frame.angle *= fr;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  for (const bone of bones) {
    const x = fx * bone.x || 0;
    const y = fy * bone.y || 0;
    const rotation = fr * bone.rotation || 0;
    const scaleX = bone.scaleX || 1;
    const scaleY = bone.scaleY || 1;
    nodes.push({
      name: `bone:${bone.name}`,
      transform: {
        position: [x, y],
        rotation,
        scale: [scaleX, scaleY]
      },
      components: {},
      children: []
    });
    skeleton.pose[bone.name] = { x, y, rotation, scaleX, scaleY };
  }

  const rootBone = mapFind(nodes, (k, v) => !v.parent);
  if (!rootBone) {
    throw new Error('There is no root bone!');
  }

  const prefab = {
    name: fp.basename(input, fp.extname(input)),
    components: {
      Skeleton: {
        asset: `${fp.basename(input, fp.extname(input))}.skeleton.json`
      },
      SortedActions: {
        actions: [ 'render', 'render-layer', 'preview' ],
        metaPropOrder: 'drawOrder'
      }
    },
    children: [ rootBone ]
  };

  let drawOrder = 0;
  for (const slot of slots) {
    if (!!slot.attachment) {
      const skinSlot = defaultSkin[slot.name];
      if (!skinSlot) {
        throw new Error(`Slot not found in default skin: ${slot.name}`);
      }

      const attachment = skinSlot[slot.attachment];
      if (!attachment || (!!attachment.type && attachment.type !== 'region')) {
        throw new Error(
          `Attachment not found in default skin slot: ${slot.attachment}`
        );
      }

      const node = nodes.find(n => n.name === `bone:${slot.bone}`);
      const atlas = mapFindSomething(
        atlasData,
        (k, v) => slot.attachment in v.regions ? k : undefined
      );

      node.children.push({
        name: `slot:${slot.name}`,
        meta: {
          drawOrder: drawOrder++
        },
        transform: {
          position: [
            attachment.x || 0,
            attachment.y || 0
          ],
          rotation: attachment.rotation || 0,
          scale: [
            attachment.scaleX || 1,
            attachment.scaleY || 1
          ]
        },
        components: {
          AtlasSprite: {
            shader: options.shader,
            atlas: `${fp.basename(atlas, fp.extname(atlas))}.atlas.json:${slot.attachment}`,
            width: attachment.width || undefined,
            height: attachment.height || undefined,
            xOrigin: 0.5,
            yOrigin: 0.5
          }
        }
      });
    }
  }

  for (const bone of bones) {
    const node = nodes.find(n => n.name === `bone:${bone.name}`);
    const parent = nodes.find(n => n.name === `bone:${bone.parent}`);
    if (!!parent) {
      parent.children.push(node);
    }
  }

  for (const slot of slots) {
    skeleton.slots[slot.name] = findNodePath(`slot:${slot.name}`, rootBone);
  }
  for (const bone of bones) {
    skeleton.bones[bone.name] = findNodePath(`bone:${bone.name}`, rootBone);
  }
  for (const skinKey in skins) {
    const skin = skins[skinKey];

    for (const slotKey in skin) {
      const slot = skin[slotKey];

      for (const attachmentKey in slot) {
        const attachment = slot[attachmentKey];
        const atlas = mapFindSomething(
          atlasData,
          (k, v) => attachmentKey in v.regions ? k : undefined
        );

        skeleton.attachments[attachmentKey] =
          `${fp.basename(atlas, fp.extname(atlas))}.atlas.json:${attachmentKey}`;
      }
    }
  }

  mkdirp(output);
  fs.writeFileSync(
    fp.join(output, `${fp.basename(input, fp.extname(input))}.prefab.json`),
    JSON.stringify(prefab, null, '  ')
  );
  fs.writeFileSync(
    fp.join(output, `${fp.basename(input, fp.extname(input))}.skeleton.json`),
    JSON.stringify(skeleton, null, '  ')
  );
}

export default function spine(json, atlas, output, options) {
  const a = spineAtlas(atlas, output);
  spinePrefab(json, output, a, options);
}
