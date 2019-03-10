const PriorityQueue = require('./priority-queue');

const {
  calculateNeighbors,
  distance,
  calculateLocation
} = require('./helpers');

const reconstructPath = (cameFrom, current) => {
  let totalPath = [current.index];

  let p = current;
  while (cameFrom[p.index]) {
    p = cameFrom[p.index];
    totalPath.push(p.index);
  }
  return totalPath;
};

module.exports = args => {
  console.log('calculating route...');
  const startTime = new Date();

  const {
    points,
    start,
    end,
    heuristicCostEstimate,
    gridSize,
    jumpSize,
  } = args;

  const findNeighbors = calculateNeighbors(gridSize);

  const location = calculateLocation(gridSize);

  let cameFrom = {};

  let pixels = points;
  
  const startPoint = { ...start, gScore: 0, fScore: heuristicCostEstimate(start, end) };

  pixels[startPoint.blueIndex] = startPoint;

  let openSet = new PriorityQueue(pixels.length, [startPoint], point => point.blueIndex, (l, r) => l.fScore < r.fScore);

  let current;
  while (openSet.size() != 0) {
    current = openSet.extractMin();

    if (current.index === end.index) {
      console.log('elapsed time:', (new Date() - startTime) / 1000, 'sec');
      return reconstructPath(cameFrom, current);
    }
    
    const neighbors = findNeighbors(location(current.index), pixels, jumpSize);
    for (const neighbor of neighbors) {
      if (openSet.hasIncluded(neighbor.blueIndex) || openSet.includes(neighbor.blueIndex)) continue;

      const tentativeGScore = current.gScore + distance(location(current.index), location(neighbor.index));

      if (!openSet.includes(neighbor.blueIndex)) {
        openSet.insert(neighbor);
      } else if (tentativeGScore >= neighbor.gScore) {
        continue;
      }

      cameFrom[neighbor.index] = current;
      openSet.update(openSet.indexOf(neighbor.blueIndex), {
        ...neighbor,
        gScore: tentativeGScore,
        fScore: tentativeGScore + heuristicCostEstimate(neighbor, end),
      });
    }
  }
};