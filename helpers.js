
const config = require('./config');

const calculateLocation = gridSize => index => ({
  x: index % gridSize.width,
  y: Math.floor(index / gridSize.width),
});

const calculateIndex = gridSize => position => position.y * gridSize.width + position.x;

exports.calculateLocation = calculateLocation;
exports.calculateIndex = calculateIndex;

const comparePixels = (lhs, rhs) =>
  lhs.r === rhs.r &&
  lhs.g === rhs.g &&
  lhs.b === rhs.b &&
  lhs.a === rhs.a;

exports.isBlue = pixel => comparePixels(pixel, config.blue);

// exports.pixelForLocation = (pixels, location) => {
//   return pixels.filter(p => location(p.index).x === location.x && location(p.index).y === location.y)[0];
// };

// exports.pixelsForLocations = (pixels, locations) =>
//   locations.map(l => pixelForLocation(pixels, l)).filter(p => p !== undefined);

const distance = (a, b) => Math.sqrt(
  (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)
);

exports.distance = distance;

exports.calculateNeighbors = gridSize => (location, points, jumpSize) =>
  points.filter(p => distance(location, calculateLocation(gridSize)(p.index)) <= jumpSize);

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
  x: Math.round( (originCoordinates.long - long) * scales.long + originGrid.x ),
  y: Math.round( (originCoordinates.lat - lat) * scales.lat + originGrid.y ),
});

exports.gridToCoordinates = ({ originCoordinates, originGrid, scales }) => ({ x, y }) => ({
  lat: originCoordinates.lat - (y - originGrid.y) / scales.lat,
  long: originCoordinates.long - (x - originGrid.x) / scales.long
});

exports.snapToGrid = ({ x, y }) => {
  const roundX = Math.round(x);
  const roundY = Math.round(y);

  return { x: roundX - (roundX % config.pixelSkipCount), y: roundY - (roundY % config.pixelSkipCount) };
};