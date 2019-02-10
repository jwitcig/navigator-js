const PNG = require('png-js');

// 3.15 sec

const config = require('./config');

const png = PNG.load(config.imagePath);

const {
  isBlue,
  pixelForLocation,
  distance,
  calculateNeighbors,
  reconstructPath,
  writeImage
} = require('./helpers');

const IMAGE_WIDTH = png.width;
const IMAGE_HEIGHT = png.height;

const heuristicCostEstimate = (point, dest) => distance(point.location, dest.location);

const navigate = (points, start, end) => {
  console.log('calculating route...');

  let closedSet = {};

  let openSet = {
    [start.index]: start,
  };

  let cameFrom = {};

  let pixels = points;

  const gScore = point => pixels[point.index].gScore;
  const fScore = point => pixels[point.index].fScore;

  pixels[start.index] = { ...start, gScore: 0, fScore: heuristicCostEstimate(start, end) };

  let current;
  while (Object.keys(openSet).length != 0) {
    let ordered = Object.keys(openSet).map(k => openSet[k]);
    ordered.sort((a, b) => fScore(a) < fScore(b));

    current = ordered[0];

    if (current.index === end.index) {
      return reconstructPath(cameFrom, current);
    }

    delete openSet[current.index];
    closedSet[current.index] = current;
    
    const neighbors = calculateNeighbors(current.location, points);
    for (const neighbor of neighbors) {
      if (closedSet[neighbor.index]) continue;

      const tentativeGScore = gScore(current) + 1;

      if (openSet[neighbor.index] === null || openSet[neighbor.index] === undefined) {
        openSet[neighbor.index] = neighbor;
      } else if (tentativeGScore >= gScore(neighbor)) {
        continue;
      }

      cameFrom[neighbor.index] = current;
      pixels[neighbor.index] = {
        ...neighbor,
        gScore: tentativeGScore,
        fScore: tentativeGScore + heuristicCostEstimate(neighbor, end),
      };
    }
  }
};

PNG.decode(config.imagePath, data => {
  let allPixels = [];

  const startLocation = { x: 840, y: 80 };
  const endLocation = { x: 360, y: 640 };

  for (let i=0; i<data.length; i+=4) {      
    const pixel = {
      r: data[i],
      g: data[i+1],
      b: data[i+2],
      a: data[i+3],
    };

    const index = i / 4;

    const location = {
      x: index % IMAGE_WIDTH,
      y: Math.floor(index / IMAGE_WIDTH),
    };

    allPixels.push({
      index,
      data: pixel,
      isBlue: isBlue(pixel),
      location,
      gScore: 999999999,
      fScore: 999999999,
    });
  }

  pixels = allPixels.filter(p => p.location.x % config.pixelSkipCount == 0 && p.location.y % config.pixelSkipCount == 0);
  
  const bluePixels = pixels.filter(p => p.isBlue);

  // lake
  // const start = pixelForLocation(pixels, {x:840,y:100});
  // const end = pixelForLocation(pixels, {x:540,y:760});

  // lake2
  const start = pixelForLocation(pixels, startLocation);
  const end = pixelForLocation(pixels, endLocation);

  console.log('BLUE PIXELS:', bluePixels.length);
  console.log('TOTAL PIXELS:', data.length / 4);
  console.log('START:', `[${start.index}]`, start.location);
  console.log('END:', `[${end.index}]`, end.location);

  const route = navigate(bluePixels, start, end);

return

  if (route) {
    console.log('ROUTE:', route);
    
    writeImage({
      filename: config.routeImagePath,
      pixels: allPixels,
      route,
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      toConsole: true,
      toFile: false,
    });

  } else {
    console.log('No route found');
  }
});