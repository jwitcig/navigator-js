const resourcesDir = '../map-resources';

// const precision = parseInt(process.argv.filter(a => a.includes('precision='))[0].split('=')[1]);

module.exports = {
  pixelSkipCount: precision || 10,
  // blue: { r: 0, g: 63, b: 255, a: 255 },
  blue: { r: 185, g: 185, b: 185, a: 255 },
  imagePath: `${resourcesDir}/loz.png`,
  routeImagePath: `${resourcesDir}/path.png`,
};