//  fixed
//  5: 3.95

// 20: 8.5 -> 5
// 10: 30.35 -> 13

const PNG = require('png-js');

const config = require('./config');
const PriorityQueue = require('./priority-queue');

const image = PNG.load(config.imagePath);

const {
  isBlue,
  pixelForLocation,
  distance,
  calculateNeighbors,
  reconstructPath,
  writeImage
} = require('./helpers');

const IMAGE_WIDTH = image.width;
const IMAGE_HEIGHT = image.height;

const heuristicCostEstimate = (point, dest) => distance(point.location, dest.location);

const navigate = (points, start, end) => {
  console.log('calculating route...');
  const startTime = new Date();

  let cameFrom = {};

  let pixels = points;
  
  let closedSet = new Array(pixels.length + 1);

  start = { ...start, gScore: 0, fScore: heuristicCostEstimate(start, end) };

  pixels[start.blueIndex] = start;

  let openSet = new PriorityQueue(pixels.length, [start], point => point.blueIndex, (l, r) => l.fScore < r.fScore);
  let isInOpenSet = new Array(pixels.length + 1);
  isInOpenSet[start.index] = true;

  let current;
  while (openSet.size() != 0) {
    current = openSet.extractMin();

    delete isInOpenSet[current.index];

    if (current.index === end.index) {
      console.log('elapsed time:', (new Date() - startTime) / 1000, 'sec');
      return reconstructPath(cameFrom, current);
    }

    closedSet[current.index] = true;
    
    const neighbors = calculateNeighbors(current.location, pixels);
    for (const neighbor of neighbors) {
      if (closedSet[neighbor.index]) continue;

      const tentativeGScore = current.gScore + distance(current.location, neighbor.location);

      if (isInOpenSet[neighbor.index] === undefined) {
        openSet.insert(neighbor);
        isInOpenSet[neighbor.index] = true;
      } else if (tentativeGScore >= neighbor.gScore) {
        continue;
      }

      cameFrom[neighbor.index] = current;
      pixels[neighbor.blueIndex - 1] = {
        ...neighbor,
        gScore: tentativeGScore,
        fScore: tentativeGScore + heuristicCostEstimate(neighbor, end),
      };
      openSet.update(openSet.indexOf(neighbor.blueIndex), {
        ...neighbor,
        gScore: tentativeGScore,
        fScore: tentativeGScore + heuristicCostEstimate(neighbor, end),
      });
    }
  }
};

PNG.decode(config.imagePath, data => {
  let allPixels = [];

  const startLocation = { x: 840, y: 80 };
  const endLocation = { x: 360, y: 640 };

  for (let i=0; i<data.length; i+=4) {
    const pixel = {
      r: data[i   ],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    };

    const index = i / 4;

    const location = {
      x: index % IMAGE_WIDTH,
      y: Math.floor(index / IMAGE_WIDTH),
    };

    allPixels.push({
      index,
      isBlue: isBlue(pixel),
      location,
      gScore: 999999999,
      fScore: 999999999,
    });
  }

  const pixels = allPixels.filter(p => p.location.x % config.pixelSkipCount == 0 && p.location.y % config.pixelSkipCount == 0);
  
  const bluePixels = pixels.filter(p => p.isBlue).map((x, i) => ({
    ...x,
    blueIndex: i + 1,
  }));

  const start = pixelForLocation(bluePixels, startLocation);
  const end = pixelForLocation(bluePixels, endLocation);

  console.log('BLUE PIXELS:', bluePixels.length);
  console.log('TOTAL PIXELS:', data.length / 4);
  console.log('START:', `[${start.index}]`, start.location);
  console.log('END:', `[${end.index}]`, end.location);

  const route = navigate(bluePixels, start, end);

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
});