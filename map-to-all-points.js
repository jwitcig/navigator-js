const PNG = require('png-js');

const { isBlue } = require('./helpers');
 
const processPixels = ({ data }) => {
  for (let i=0; i<data.length; i+=4) {
    const pixel = {
      r: data[i    ],
      g: data[i + 1],
      b: data[i + 2],
      a: data[i + 3],
    };

    const index = i / 4;

    data[index] = isBlue(pixel);
  }

  return data;
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