const PNG = require('png-js');

const config = require('./config');

const png = PNG.load(config.imagePath);

const calculateLocation = index => ({
  x: index % png.width,
  y: Math.floor(index / png.width),
});

const comparePixels = (lhs, rhs) =>
  lhs.r === rhs.r &&
  lhs.g === rhs.g &&
  lhs.b === rhs.b &&
  lhs.a === rhs.a;

exports.isBlue = pixel => comparePixels(pixel, config.blue);

const locationToIndex = l => l.x + l.y * png.width;

exports.pixelForLocation = (pixels, location) => {
  return pixels.filter(p => calculateLocation(p.index).x === location.x && calculateLocation(p.index).y === location.y)[0];
};

exports.pixelsForLocations = (pixels, locations) =>
  locations.map(l => pixelForLocation(pixels, l)).filter(p => p !== undefined);

const distance = (a, b) => Math.sqrt(
  (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)
);

exports.distance = distance;

exports.calculateNeighbors = (location, points) =>
  points.filter(p => distance(location, calculateLocation(p.index)) < (config.pixelSkipCount + 1) * Math.sqrt(2.01));