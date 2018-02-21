import fs from 'fs';
import fp from 'path';
import xml2js from 'xml2js';
import util from 'util';
import { mkdirp } from './utils';

function readJson(path) {
  const content = fs.readFileSync(path);
  if (!content) {
    throw new Error(`Cannot read file: ${path}`);
  }

  return JSON.parse(content);
}

function readXml(path) {
  const content = fs.readFileSync(path);
  if (!content) {
    throw new Error(`Cannot read file: ${path}`);
  }

  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();
    parser.parseString(content, (err, result) => {
      if (!!err) {
        reject(err);
      } else {
        try {
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

function mapChunksToTexturedChunks(chunks, tilesetsData) {
  const result = [];
  for (const chunk of chunks) {
    const { data } = chunk;
    for (const tileset of tilesetsData) {
      result.push({
        ...chunk,
        image: tileset.source,
        tilewidth: tileset.tilewidth,
        tileheight: tileset.tileheight,
        width: tileset.width,
        height: tileset.height,
        columns: tileset.columns,
        data: data.map(
          d => d >= tileset.firstgid && d < tileset.firstgid + tileset.tilecount
            ? d - tileset.firstgid
            : -1
        )
      });
    }
  }
  return result.filter(c => c.data.some(i => i >= 0));
}

function mapChunkDataToVerticesIndices(chunk, tw, th, layer) {
  const vertices = [];
  const indices = [];
  const { data, columns } = chunk;
  for (var i = 0, c = data.length; i < c; ++i) {
    const x = (i % layer.width) | 0;
    const y = (i / layer.width) | 0;
    const id = data[i] | 0;
    const tx = (id % columns) | 0;
    const ty = (id / columns) | 0;
    if (id >= 0) {
      const o = vertices.length / 4;
      const x1 = tw * x;
      const x2 = x1 + tw;
      const y1 = th * y;
      const y2 = y1 + th;
      const tx1 = (tx * chunk.tilewidth) / chunk.width;
      const tx2 = ((tx + 1) * chunk.tilewidth) / chunk.width;
      const ty1 = (ty * chunk.tileheight) / chunk.height;
      const ty2 = ((ty + 1) * chunk.tileheight) / chunk.height;
      vertices.push(
        x1, y1, tx1, ty1,
        x2, y1, tx2, ty1,
        x2, y2, tx2, ty2,
        x1, y2, tx1, ty2
      );
      indices.push(
        o, o + 1, o + 2,
        o + 2, o + 3, o
      );
    }
  }
  return { vertices, indices };
}

function mapLayersToEntities(layers, tilesetsData, ignore, tw, th) {
  return !!layers
    ? layers.map(layer => {
      if (ignore.indexOf(layer.name) >= 0) {
        return;
      }

      const result = {
        name: layer.name,
        active: layer.visible,
        transform: {
          position: [
            tw * (layer.startx || layer.x || 0),
            th * (layer.starty || layer.y || 0)
          ]
        }
      };
      const { type } = layer;
      if (type === 'group') {
        result.children = mapLayersToEntities(
          layer.layers,
          tilesetsData,
          ignore,
          tw,
          th
        );
      } else if (type === 'imagelayer') {
        result.transform.position = [
          layer.offsetx || 0,
          layer.offsety || 0
        ];
        result.components = {
          Sprite: {
            shader: 'shaders/sprite-transparent.json',
            overrideBaseTexture: layer.image,
            width: -1,
            height: -1
          }
        };
      } else if (type === 'tilelayer') {
        const chunks = !!layer.data ? [ layer ] : layer.chunks;
        const texturedChunks = mapChunksToTexturedChunks(chunks, tilesetsData);
        result.children = texturedChunks.map(chunk => {
          const {
            vertices,
            indices
          } = mapChunkDataToVerticesIndices(chunk, tw, th, layer);
          return {
            transform: {
              position: [
                tw * (chunk.startx || chunk.x || 0),
                th * (chunk.starty || chunk.y || 0)
              ]
            },
            components: {
              VerticesRenderer: {
                shader: 'shaders/sprite-transparent.json',
                overrideSamplers: {
                  sBase: {
                    texture: chunk.image,
                    channel: 0,
                    filtering: 'linear'
                  }
                },
                vertices,
                indices
              }
            }
          };
        });
      } else if (type === 'objectgroup') {
        if (!!layer.objects) {
          result.children = layer.objects.map(o => {
            if (o.type === 'prefab') {
              return {
                name: o.properties.name || o.name,
                transform: {
                  position: [o.x || 0, o.y || 0],
                  rotation: o.rotation || 0
                },
                components: {
                  PrefabInstance: {
                    asset: o.properties.asset || undefined,
                    count: o.properties.count || undefined
                  }
                }
              };
            }
          }).filter(o => !!o);
        }
      } else {
        console.warn(`Unsupported layer type: ${type}`);
      }

      return result;
    }).filter(i => !!i)
    : undefined;
}

function mapLayersToMeta(layers, ignore) {
  return !!layers
    ? layers.map(layer => {
      if (ignore.indexOf(layer.name) >= 0) {
        return;
      }

      const { type } = layer;
      const result = {
        name: layer.name,
        type
      };
      if (type === 'group') {
        result.layers = mapLayersToMeta(layer.layers, ignore);
      } else if (type === 'imagelayer') {
        result.x = layer.offsetx || 0;
        result.y = layer.offsety || 0;
      } else if (type === 'tilelayer') {
        const chunks = !!layer.data ? [ layer ] : layer.chunks;
        result.chunks = chunks.map(chunk => {
          return {
            x: chunk.x || 0,
            y: chunk.y || 0,
            cols: chunk.width | 0,
            rows: chunk.height | 0,
            data: chunk.data
          };
        });
      } else if (type === 'objectgroup') {
        result.objects = layer.objects || [];
      } else {
        console.warn(`Unsupported layer type: ${type}`);
      }

      return result;
    }).filter(i => !!i)
    : undefined;
}

function getImages(layers, ignore, target = null) {
  const result = target || [];
  for (const layer of layers) {
    if (ignore.indexOf(layer.name) >= 0) {
      continue;
    }

    if (layer.type === 'imagelayer' && !!layer.image && result.indexOf(layer.image) < 0) {
      result.push(layer.image);
    } else if (layer.type === 'group' && !!layer.layers) {
      getImages(layer.layers, ignore, result);
    }
  }
  return result;
}

export default function tiled(input, output, ignore = [], meta = false) {
  const data = readJson(input);
  const {
    infinite,
    orientation,
    layers,
    tilesets,
    type,
    tilewidth,
    tileheight
  } = data;
  if (infinite === true) {
    throw new Error('Infinite maps are not yet supported!');
  }
  if (orientation !== 'orthogonal') {
    throw new Error(`Unsupported map orientation: ${orientation}`);
  }
  if (type !== 'map') {
    throw new Error(`Unsupported map type: ${type}`);
  }

  mkdirp(output);
  const dir = fp.dirname(input);

  const tilesetsPromises = tilesets.map(tileset => {
    const { source } = tileset;
    if (!!source) {
      return readXml(fp.join(dir, source))
        .then(data => {
          const ts = data.tileset.$;
          const im = data.tileset.image[0].$;
          return {
            firstgid: tileset.firstgid || 1,
            name: ts.name,
            tilewidth: parseInt(ts.tilewidth),
            tileheight: parseInt(ts.tileheight),
            tilecount: parseInt(ts.tilecount),
            columns: parseInt(ts.columns),
            source: im.source,
            width: parseInt(im.width),
            height: parseInt(im.height)
          };
        })
        .catch(error => console.error(error));
    }
  });

  return Promise.all(tilesetsPromises)
    .then(tilesetsData => {
      const otd = tilesetsData;
      tilesetsData = [];
      for (const td of otd) {
        if (!tilesetsData.some(t => t.source === td.source)) {
          tilesetsData.push(td);
        }
      }
      for (const ts of tilesetsData) {
        if (!ts.source) {
          throw new Error(
            `Tileset does not have source image: ${ts.name}`
          );
        }

        const buffer = fs.readFileSync(fp.join(dir, ts.source));
        fs.writeFileSync(fp.join(output, ts.source), buffer);
      }

      const images = getImages(layers, ignore);
      for (const image of images) {
        const buffer = fs.readFileSync(fp.join(dir, image));
        fs.writeFileSync(fp.join(output, image), buffer);
      }

      const prefab = {
        name: 'map',
        children: mapLayersToEntities(
          layers,
          tilesetsData,
          ignore,
          tilewidth || 1,
          tileheight || 1
        )
      };
      fs.writeFileSync(
        fp.join(
          output,
          fp.basename(input, fp.extname(input)) + '.prefab.json'
        ),
        JSON.stringify(prefab, null, 2)
      );

      if (!!meta) {
        const info = {
          name: '',
          type: 'map',
          tilewidth,
          tileheight,
          layers: mapLayersToMeta(layers, ignore)
        };
        fs.writeFileSync(
          fp.join(
            output,
            fp.basename(input, fp.extname(input)) + '.meta.json'
          ),
          JSON.stringify(info, null, 2)
        );
      }
    });
}
