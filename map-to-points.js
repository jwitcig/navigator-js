const PNG = require('png-js');

const config = require('./config');

const { isBlue } = require('./helpers');

const processPixels = ({ imageWidth, imageHeight, data }) => {
  let allPixels = [];

  for (let i=0; i<data.length; i+=4) {
    const isBlue = isBlue({
      r: data[i    ],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    });

    const index = i / 4;

    allPixels.push({
      index,
      isBlue,
      location: {
        x: index % imageWidth,
        y: Math.floor(index / imageWidth),
      },
      gScore: 999999999,
      fScore: 999999999,
    });
  }

  return allPixels;
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