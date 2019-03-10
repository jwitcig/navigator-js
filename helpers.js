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

exports.calculateNeighbors = (location, points, jumpSize=config.pixelSkipCount * Math.sqrt(2)) =>
  points.filter(p => distance(location, calculateLocation(p.index)) <= jumpSize);

const randomBool = () => Math.random() >= 0.5;

const randomizeSign = x => (randomBool() ? -1 : 1) * x;

exports.enumeratePoints = (radius, origin, count=null) => {
  const pointCount = count || 50;

  let points = [];
  for (let i=0; i<pointCount; i++) {
    const xOffset = randomizeSign( Math.floor((Math.random() * radius) + 1) );
    const yOffset = randomizeSign( Math.floor((Math.random() * radius) + 1) );

    points.push({
      x: origin.x + xOffset,
      y: origin.y + yOffset,
    });
  }
  return points;
};

exports.coordinatesToGrid = ({ originCoordinates, originGrid, scales }) => ({ lat, long }) => ({
  x: (originCoordinates.long - long) * scales.long + originGrid.x,
  y: (originCoordinates.lat - lat) * scales.lat + originGrid.y,
});

// exports.coordinatesToGrid = ({ origin, scales }) => ({ lat, long }) => ({
//   x: (-92.715390 - long) * -11666.75855985 + 3485,
//   y: (38.125583 - lat) * 14872.7934206144 + 2747,
// });

exports.snapToGrid = ({ x, y }) => {
  const roundX = Math.round(x);
  const roundY = Math.round(y);

  return { x: roundX - (roundX % config.pixelSkipCount), y: roundY - (roundY % config.pixelSkipCount) };
};