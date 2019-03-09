const PNG = require('png-js');
 
const processPixels = ({ data, filter, populatePoint }) => {
  let pixels = [];

  let blues = {};

  for (let i=0; i<data.length; i+=4) {
    const pixel = {
      r: data[i    ],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    };

    const index = i / 4;

    if (filter && !filter({ pixel, index })) {
      continue;
    }

    blues[index] = true;

    const point = populatePoint({ index, pixel });

    pixels.push(point);
  }

  return {
    points: pixels,
    blues,
  };
};

module.exports = args => new Promise((resolve, reject) => {
  PNG.decode(args.imagePath, data => {
    const points = processPixels({
      ...args,
      data
    });
    resolve(points);
  });
});