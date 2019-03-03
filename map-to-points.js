const PNG = require('png-js');

const { isBlue } = require('./helpers');
 
const processPixels = ({ data }) => {
  let pixels = [];

  for (let i=0; i<data.length; i+=4) {
    const pixel = {
      r: data[i    ],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    };

    if (!isBlue(pixel)) continue;

    const index = i / 4;

    pixels.push({
      index,
      gScore: 999999999,
      fScore: 999999999,
    });
  }

  return pixels;
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