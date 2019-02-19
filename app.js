const config = require('./config');
const mapToPoints = require('./map-to-points');
const navigate = require('./navigation');
const {
  writeImage,
  pixelForLocation,
  distance
} = require('./helpers');
const PNG = require('png-js');

const image = PNG.load(config.imagePath);

const IMAGE_WIDTH = image.width;
const IMAGE_HEIGHT = image.height;

(async () => {
  const startLocation = { x: 840, y: 80 };
  const endLocation = { x: 360, y: 640 };
  
  const heuristicCostEstimate = (point, dest) => distance(point.location, dest.location);
  
  const allPixels = await mapToPoints({
    imageWidth: image.width,
    imageHeight: image.height,
    imagePath: config.imagePath,
  });
  
  const pixels = allPixels.filter(p => p.location.x % config.pixelSkipCount == 0 && p.location.y % config.pixelSkipCount == 0);
  
  const bluePixels = pixels.filter(p => p.isBlue).map((x, i) => ({
    ...x,
    blueIndex: i + 1,
  }));
  
  const start = pixelForLocation(bluePixels, startLocation);
  const end = pixelForLocation(bluePixels, endLocation);
  
  console.log('BLUE PIXELS:', bluePixels.length);
  console.log('TOTAL PIXELS:', pixels.length / 4);
  console.log('START:', `[${start.index}]`, start.location);
  console.log('END:', `[${end.index}]`, end.location);
  
  const route = navigate({
    points: bluePixels,
    start,
    end,
    heuristicCostEstimate,
  });
  
  if (route) {
    writeImage({
      route,
      filename: config.routeImagePath,
      pixels: allPixels,
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      toConsole: true,
      toFile: false,
    });
  } else {
    console.log('No route found');
  }
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
})();