const PriorityQueue = require('./priority-queue');

const { calculateNeighbors, distance } = require('./helpers');

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
    heuristicCostEstimate
  } = args;

  let cameFrom = {};

  let pixels = points;
  
  let closedSet = new Array(pixels.length + 1);

  const startPoint = { ...start, gScore: 0, fScore: heuristicCostEstimate(start, end) };

  pixels[startPoint.blueIndex] = startPoint;

  let openSet = new PriorityQueue(pixels.length, [startPoint], point => point.blueIndex, (l, r) => l.fScore < r.fScore);
  let isInOpenSet = new Array(pixels.length + 1);
  isInOpenSet[startPoint.index] = true;

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