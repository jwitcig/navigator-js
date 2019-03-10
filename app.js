const PNG = require('png-js');
const config = require('./config');
const mapToPoints = require('./map-to-points');
const navigate = require('./navigation');
const {
  distance,
  isBlue,
  enumeratePoints,
  coordinatesToGrid,
  calculateIndex,
  calculateLocation,
} = require('./helpers');
const { writeImage } = require('./path-printer');

const parseArgument = name =>
  process.argv.filter(a => a.includes(`${name}=`))[0]
              .split('=')[1];

const parseCoordinateArgument = name =>
  parseArgument(name)
    .split(',')
    .reduce((acc, x, i) => ({
      ...acc,
      [i == 0 ? 'lat' : 'long']: parseFloat(x),
    }), {});

const convertToGridPoint = coordinatesToGrid({
  originCoordinates: {
    lat: 38.125583,
    long: -92.715390,
  },
  originGrid: {
    x: 3485,
    y: 2747,
  },
  scales: {
    lat: 14872.7934206144,
    long: -11666.75855985,
  },
});

const findPath = async ({
  desiredStartPoint,
  desiredEndPoint,
  gridSize,
  precision,
  mapPath
  }) => {

  const index = calculateIndex(gridSize);
  const location = calculateLocation(gridSize);
  
  const heuristicCostEstimate = (point, dest) => distance(location(point.index), location(dest.index));

  const results = await mapToPoints({
    imagePath: mapPath,
    filter: ({ pixel }) => {
      return isBlue(pixel);
    },
    populatePoint: ({ index }) => ({
      index,
      gScore: 999999999,
      fScore: 999999999,
    }),
  });

  const allPoints = results.points;

  console.log('loading points...')

  const channelPoints = allPoints
                          .filter(p => location(p.index).x % precision === 0 && location(p.index).y % precision === 0)
                          .filter(p => {
                            const neighborhood = enumeratePoints(25, location(p.index), 500);
                            return neighborhood.length - neighborhood.filter(n => results.blues[index(n)]).length < 50;
                          });

  const channelWindowSize = 40;
  const channelWindowTranslation = channelWindowSize;

  let points = [];

  for (let y=0; y<gridSize.height; y+=channelWindowTranslation) {
    for (let x=0; x<gridSize.width; x+=channelWindowTranslation) {
      
      const pointsInWindow = channelPoints.filter(p => {
        const pLocation = location(p.index);

        return pLocation.x >= x && pLocation.x <= x + channelWindowSize &&
               pLocation.y >= y && pLocation.y <= y + channelWindowSize
      });

      if (pointsInWindow.length === 0) continue;

      let meanX = pointsInWindow.reduce((acc, p) => acc + location(p.index).x, 0) / pointsInWindow.length;
      let meanY = pointsInWindow.reduce((acc, p) => acc + location(p.index).y, 0) / pointsInWindow.length;

      const i = index({
        x: Math.floor(meanX),
        y: Math.floor(meanY),
      });
      
      points.push({
        index: i,
        gScore: 999999999,
        fScore: 999999999,  
      });
    }
  }

  points = points.map((x, i) => ({
                      ...x,
                      blueIndex: i + 1,
                    }));
 
  const start = points.map(p => ({
    ...p,
    distance: distance(location(p.index), desiredStartPoint),
  })).sort((a, b) => a.distance - b.distance)[0];

  const end = points.map(p => ({
    ...p,
    distance: distance(location(p.index), desiredEndPoint),
  })).sort((a, b) => a.distance - b.distance)[0];
  
  console.log(`${points.length} blue / ${gridSize.width * gridSize.height} total pixels`);
  console.log(`${JSON.stringify(location(start.index))} => ${JSON.stringify(location(end.index))}`);
  
  const route = navigate({
    points,
    start,
    end,
    heuristicCostEstimate,
    gridSize,
    jumpSize: 2 * 40 * Math.sqrt(2),
  });
  
  if (route) {
    writeImage({
      route,
      filename: config.routeImagePath,
      bluePixels: allPoints,
      width: gridSize.width,
      height: gridSize.height,
      toConsole: false,
      toFile: true,
    });
  } else {
    console.log('No route found');
  }

  const used = process.memoryUsage();
  for (let key in used) {
    console.log(`${key}\t${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  
  return route;
};

const readInput = () => ({
  start: parseCoordinateArgument('start'),
  end: parseCoordinateArgument('end'),
  precision: parseInt(parseArgument('precision')),
});

(async () => {
  const input = readInput();

  const desiredStartPoint = convertToGridPoint(input.start);
  const desiredEndPoint = convertToGridPoint(input.end);

  const image = PNG.load(config.imagePath);

  return await findPath({
    desiredStartPoint,
    desiredEndPoint,
    gridSize: {
      width: image.width,
      height: image.height,
    },
    precision: input.precision,
    mapPath: config.imagePath,
  });
})();

module.exports = findPath;