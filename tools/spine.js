import fs from 'fs';
import fp from 'path';

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

function spineAtlas(input, output) {
  const content = fs.readFileSync(input);
  if (!content) {
    throw new Error(`Cannot read file: ${input}`);
  }

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

  options.shader = options.shader || 'sprite-transparent.json';

  const { bones, slots } = JSON.parse(content.toString());
  const nodes = [];

  for (const bone of bones) {
    nodes.push({
      name: bone.name,
      transform: {
        position: [
          bone.x || 0,
          bone.y || 0
        ],
        rotation: bone.rotation,
        scale: [
          bone.scaleX || 1,
          bone.scaleY || 1
        ]
      },
      components: {},
      children: []
    });
  }

  const prefab = mapFind(nodes, (k, v) => !v.parent);
  if (!prefab) {
    throw new Error('There is no root bone!');
  }

  prefab.components.Animator = {};

  for (const bone of bones) {
    const node = nodes.find(n => n.name === bone.name);
    const parent = nodes.find(n => n.name === bone.parent);
    if (!!parent) {
      parent.children.push(node);
    }
  }

  for (const slot of slots) {
    if (!!slot.attachment) {
      const node = nodes.find(n => n.name === slot.bone);
      const atlas = mapFindSomething(
        atlasData,
        (k, v) => slot.attachment in v.regions ? k : undefined
      );

      node.components.AtlasSprite = {
        shader: options.shader,
        atlas: `${fp.basename(atlas, fp.extname(atlas))}.atlas.json:${slot.attachment}`
      };
    }
  }

  fs.writeFileSync(
    fp.join(output, `${fp.basename(input, fp.extname(input))}.prefab.json`),
    JSON.stringify(prefab, null, '  ')
  );
}

export function spine(json, atlas, output, options) {
  const a = spineAtlas(atlas, output);
  spinePrefab(json, output, a, options);
}
