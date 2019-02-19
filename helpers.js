const Jimp = require('jimp');
const PNG = require('png-js');
const terminalImage = require('terminal-image');

const config = require('./config');

const png = PNG.load(config.imagePath);

const comparePixels = (lhs, rhs) =>
  lhs.r === rhs.r &&
  lhs.g === rhs.g &&
  lhs.b === rhs.b &&
  lhs.a === rhs.a;

exports.isBlue = pixel => comparePixels(pixel, config.blue);

const locationToIndex = l => l.x + l.y * png.width;

exports.pixelForLocation = (pixels, location) => {
  return pixels.filter(p => p.location.x === location.x && p.location.y === location.y)[0];
};

exports.pixelsForLocations = (pixels, locations) =>
  locations.map(l => pixelForLocation(pixels, l)).filter(p => p !== undefined);

const distance = (a, b) => Math.sqrt(
  (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)
);

exports.distance = distance;

exports.calculateNeighbors = (location, points) =>
  points.filter(p => distance(location, p.location) < (config.pixelSkipCount + 1) * Math.sqrt(2.01));

exports.writeImage = async ({ filename, pixels, route, width, height, toFile, toConsole }) => {
  console.log('writing image...')
  
  const image = new Jimp(width, height);

  for (let i=0; i<pixels.length; i+=1) {
    const { r, g, b, a } = pixels[i].isBlue
      ? (route.includes(i) ? { r: 0, g: 0, b: 0, a: 255 } : config.blue)
      : { r: 0, g: 0, b: 0, a: 255 };
    const offset = i * 4;

    image.bitmap.data[offset    ] = r;
    image.bitmap.data[offset + 1] = g;
    image.bitmap.data[offset + 2] = b;
    image.bitmap.data[offset + 3] = a;
  }

  if (toConsole) {
    console.log(await terminalImage.buffer(await image.getBufferAsync(Jimp.MIME_PNG)));
  }
  
  if (toFile) {
    image.write(filename);
  }
};