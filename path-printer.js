const Jimp = require('jimp');
const terminalImage = require('terminal-image');

const config = require('./config');

exports.writeImage = async ({ filename, bluePixels, route, width, height, toFile, toConsole }) => {
  if (!toConsole && !toFile) return;

  console.log('writing image...')
  
  const image = new Jimp(width, height);

  for (let i=0; i<bluePixels.length; i++) {
    const pixel = bluePixels[i];

    const { r, g, b, a } = route.includes(pixel.index) ? { r: 0, g: 0, b: 0, a: 255 } : config.blue;
      
    const offset = pixel.index * 4;

    image.bitmap.data[offset    ] = r;
    image.bitmap.data[offset + 1] = g;
    image.bitmap.data[offset + 2] = b;
    image.bitmap.data[offset + 3] = a;
  }

  if (toConsole) {
    console.log(await terminalImage.buffer(await image.getBufferAsync(Jimp.MIME_PNG)));
  }
  
  if (toFile) {
    image.write(filename);
  }
};