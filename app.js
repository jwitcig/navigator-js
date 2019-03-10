const PNG = require('png-js');
const config = require('./config');
const mapToPoints = require('./map-to-points');
const navigate = require('./navigation');
const {
  distance,
  isBlue,
  enumeratePoints,
} = require('./helpers');
const { writeImage } = require('./path-printer');
const { calculateAverageWidth, rotateImageRight } = require('./channel-estimator');

// pelican bay - origin
// 38.125583, -92.715390
// 3485, 2747

// bagnell dam
// 38.203645, -92.624705
// 4543, 1586

// x: 11,666.75855985
// y: -14,872.7934206144

const coordinatesToGrid = ({ lat, long }) => ({
  x: (-92.715390 - long) * -11666.75855985 + 3485,
  y: (38.125583 - lat) * 14872.7934206144 + 2747,
});

const gridToCoordinates = ({ x, y }) => ({
  lat: (x - 3485) / 13546.4747796137 + 38.125583,
  long: (y - 2747) / -12802.5583062248 + -92.715390,
});

const snap = ({ x, y }) => {
  const roundX = Math.round(x);
  const roundY = Math.round(y);

  return { x: roundX - (roundX % config.pixelSkipCount), y: roundY - (roundY % config.pixelSkipCount) };
};

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

const readInput = () => ({
  start: parseCoordinateArgument('start'),
  end: parseCoordinateArgument('end'),
});

const findPath = async ({
  desiredStartPoint,
  desiredEndPoint,
  gridWidth,
  gridHeight,
  precision,
  mapPath
  }) => {

  const location = index => ({
    x: index % gridWidth,
    y: Math.floor(index / gridWidth),
  });

  const index = position => position.y * gridWidth + position.x;
  
  const heuristicCostEstimate = (point, dest) => distance(location(point.index), location(dest.index));
  
  const results = await mapToPoints({
    imagePath: mapPath,
    filter: ({ pixel }) => {
      return isBlue(pixel);
    },
    populatePoint: ({ index, pixel }) => ({
      index,
      gScore: 999999999,
      fScore: 999999999,
    }),
  });

  const allPoints = results.points;

  console.log('loading points...')

  const resultsForWidthAverage = await mapToPoints({
    imagePath: mapPath,
    populatePoint: ({ pixel }) => isBlue(pixel),
  });
  console.log('rotating points...')
  const rotated = rotateImageRight({
    pixels: resultsForWidthAverage.points,
    gridSize: { width: gridWidth, height: gridHeight },
  });

  const channelWidthCache = {};
  const channelWindowSize = 500;
  const channelWindowTranslation = 200;

  let c = 0
  for (let y=0; y<gridHeight; y+=channelWindowTranslation) {
    for (let x=0; x<gridWidth; x+=channelWindowTranslation) {
      channelWidthCache[`${x}${y}`] = calculateAverageWidth({
        gridSize: { width: gridWidth, height: gridHeight },
        pixels: [resultsForWidthAverage.points, rotated],
        start: { x, y },
        end: { x: x + channelWindowSize, y: y + channelWindowSize },
      });
      if (c % 100 === 0)
        console.log(c)
      c ++
    }
  }

  const points = allPoints.filter(p => location(p.index).x % precision === 0 && location(p.index).y % precision === 0)
                          .filter(p => {
                            const pLocation = location(p.index);

                            const x = (pLocation.x / (channelWindowTranslation / 2)) % 0 === 0
                                      ? pLocation.x - (pLocation.x % channelWindowTranslation)
                                      : pLocation.x + (channelWindowTranslation - (pLocation.x % channelWindowTranslation));
                            const y = (pLocation.y / (channelWindowTranslation / 2)) % 0 === 0
                                      ? pLocation.y - (pLocation.y % channelWindowTranslation)
                                      : pLocation.y + (channelWindowTranslation - (pLocation.y % channelWindowTranslation));

                            const channelWidth = isNaN(channelWidthCache[`${x}${y}`]) ? 1000000 : channelWidthCache[`${x}${y}`];
                            if (isNaN(channelWidth)) console.log(channelWidthCache['35003000'])
                            const desiredWidth = channelWidth / 8;
                            
                            const neighborhood = enumeratePoints((channelWidth - desiredWidth) / 2, location(p.index), 500);
                            // const neighborhood = enumeratePoints(1, location(p.index));

                            return neighborhood.length - neighborhood.filter(n => results.blues[index(n)]).length < 50;
                          })
                          .map((x, i) => ({
                            ...x,
                            blueIndex: i + 1,
                          }));

  writeImage({
    route: points.map(p => p.index),
    filename: config.routeImagePath,
    bluePixels: allPoints,
    width: gridWidth,
    height: gridHeight,
    toConsole: false,
    toFile: true,
  });
  return
                          
  console.log('HOW MANY IN CHANNEL:', points.length)

  const start = points.map(p => ({
    ...p,
    distance: distance(location(p.index), desiredStartPoint),
  })).sort((a, b) => a.distance - b.distance)[0];

  const end = points.map(p => ({
    ...p,
    distance: distance(location(p.index), desiredEndPoint),
  })).sort((a, b) => a.distance - b.distance)[0];
  
  console.log(`${points.length} blue / ${gridWidth * gridHeight} total pixels`);
  console.log(`${JSON.stringify(location(start.index))} => ${JSON.stringify(location(end.index))}`);
  
  const route = navigate({
    points,
    start,
    end,
    heuristicCostEstimate,
    gridSize: {
      width: gridWidth,
      height: gridHeight,
    },
  });
  
  if (route) {
    writeImage({
      route,
      filename: config.routeImagePath,
      bluePixels: allPoints,
      width: gridWidth,
      height: gridHeight,
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

(async () => {
  const input = readInput();

  const desiredStartPoint = coordinatesToGrid(input.start);
  const desiredEndPoint = coordinatesToGrid(input.end);

  const image = PNG.load(config.imagePath);

  return await findPath({
    desiredStartPoint,
    desiredEndPoint,
    gridWidth: image.width,
    gridHeight: image.height,
    precision: 10,
    mapPath: config.imagePath,
  });
})();

module.exports = findPath;