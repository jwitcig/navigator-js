const getPixels = require('./map-to-points');
const { isBlue } = require('./helpers');

const locationForIndex = gridSize => index => ({
  x: index % gridSize.width,
  y: index / gridSize.width,
});

const indexForLocation = gridSize => location => location.y * gridSize.width + location.x;

const calculateWidthsForRow = ({ row, points, gridSize }) => {
  const gridLocationForIndex = locationForIndex(gridSize);
  const gridIndexForLocation = indexForLocation(gridSize);

  let widths = [];
  let minX = null;
  for (let x=0; x<gridSize.width; x++) {
    const cursorLocation = { x, y: row };
    const cursorIndex = gridIndexForLocation(cursorLocation);
  
    const cursorIsBlue = points[cursorIndex];
    
    if (!minX && cursorIsBlue) {
      minX = x;
    } else if (!minX) {
      continue;
    }
    
    if (cursorIsBlue) {
      continue;
    } else {
      widths.push(cursorLocation.x - minX);
    }

    minX = null;
  }
  return widths;
};

const rotateImageRight = ({ pixels, gridSize }) => {
  const output = new Array(gridSize.width * gridSize.height);

  for (let y=0; y<gridSize.height; y++) {
    for (let x=0; x<gridSize.width; x++) {
      const pixel = pixels[y * gridSize.width + x];

      const newLocation = {
        x: gridSize.width - y,
        y: x,
      };

      const newIndex = indexForLocation(gridSize)(newLocation);

      output[newIndex] = pixel;
    }
  }
  return output;
};

const calculateAverageWidth = async ({ gridSize, mapPath }) => {
  console.log('loading pixels...');
  const pixels = await getPixels({
    imagePath: mapPath,
    populatePoint: ({ pixel }) => isBlue(pixel),
  });
  console.log('taking measurements...');

  let sum = 0;
  let samples = 0;
  let all = [];
  for (let y=0; y<gridSize.height; y++) {
    const widths = calculateWidthsForRow({ row: y, points: pixels, gridSize })
                    .filter(w => w > 10);

    all = all.concat(widths);

    sum += widths.reduce((acc, width) => acc + width, 0);
    samples += widths.length;
  }

  console.log('adjusting the map...');
  const rotated = rotateImageRight({
    pixels,
    gridSize,
  });
  console.log('taking some more measurements...');

  for (let y=0; y<gridSize.height; y++) {
    const widths = calculateWidthsForRow({ row: y, points: rotated, gridSize })
                    .filter(w => w > 10);

    all = all.concat(widths);

    sum += widths.reduce((acc, width) => acc + width, 0);
    samples += widths.length;
  }

  return sum / samples;
};

const pointsInRadius = r => {
  const lambda = Math.floor(r * Math.sin(3.14159265/4));

  let sum = 0;
  for (let y=1; y<=lambda; y++) {
    sum += Math.floor(Math.sqrt(r*r - y*y)) - y;
  }

  return 4*Math.floor(r) + 8*sum + 4*lambda + 1;
};

(async () => {
  // const gridSize = { width: 6000, height: 6000 };
  // const gridSize = { width: 1000, height: 858 };
  
  // const average = await calculateAverageWidth({
  //   gridSize,
  //   mapPath: '../map-resources/loz.png',
  // });

  // console.log('average width:', average);

  const radii = [...Array(500).keys()];
  for (const radius of radii) {
    console.log('radius:', radius, ':', pointsInRadius(radius));
  }
})();

exports.calculateAverageWidth = calculateAverageWidth;