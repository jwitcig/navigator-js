const config = require('./config');
const mapToPoints = require('./map-to-points');
const navigate = require('./navigation');
const {
  distance
} = require('./helpers');
const { writeImage } = require('./path-printer');
const PNG = require('png-js');

const image = PNG.load(config.imagePath);

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

(async () => {
  const input = readInput();

  const desiredStartPoint = coordinatesToGrid(input.start);
  const desiredEndPoint = coordinatesToGrid(input.end);
  
  const heuristicCostEstimate = (point, dest) => distance(point.location, dest.location);
  
  const allPoints = await mapToPoints({
    imageWidth: image.width,
    imageHeight: image.height,
    imagePath: config.imagePath,
  });

  const points = allPoints.filter(p => p.location.x % config.pixelSkipCount == 0 && p.location.y % config.pixelSkipCount == 0)
                          .map((x, i) => ({
                            ...x,
                            blueIndex: i + 1,
                          }));

  const start = points.map(p => ({
    ...p,
    distance: distance(p.location, desiredStartPoint),
  })).sort((a, b) => a.distance - b.distance)[0];

  const end = points.map(p => ({
    ...p,
    distance: distance(p.location, desiredEndPoint),
  })).sort((a, b) => a.distance - b.distance)[0];
  
  console.log(`${points.length} blue / ${image.width * image.height} total pixels`);
  console.log(`${JSON.stringify(start.location)} => ${JSON.stringify(end.location)}`);
  
  const route = navigate({
    points,
    start,
    end,
    heuristicCostEstimate,
  });
  
  if (route) {
    writeImage({
      route,
      filename: config.routeImagePath,
      bluePixels: allPoints,
      width: image.width,
      height: image.height,
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
})();