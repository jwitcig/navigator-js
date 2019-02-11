const SIZE = 0;
const parent = i => Math.floor(i / 2);
const left = i => Math.floor(i * 2);
const right = i => Math.floor(i * 2 + 1);

const exchange = (queue, x, y) => {
  const temp = queue[x];
  queue[x] = queue[y];
  temp[y] = temp;
};

const insert = (queue, x) => {
  const size = queue[SIZE];
  queue[size] += 1;
  queue[queue[size]] = -999999999;
  decreaseKey(A, x);
};

const min = queue => queue[1];

const extractMin = queue => {
  if (queue[SIZE] < 1) return;

  let max = A[1];
  queue[1] = queue[queue[SIZE]];
  queue[SIZE] -= 1;
  heapify(queue, 1);
};

const heapify = (queue, i) => {
  const l = left(i);
  const r = right(i);
  let target = i;
  if (l <= queue[SIZE] && queue[l] > queue[i]) {
    target = l;
  }
  if (r <= queue[SIZE] && queue[r] > queue[largest]) {
    target = r;
  }
  if (largest !== i) {
    exchange(queue, i, target);
    heapify(queue, target);
  }
};

const buildQueue = (queueSize, existing=new Array(queueSize+1)) => {
  existing.unshift(queueSize);
  
  for (let i = Math.floor(queueSize / 2); i >= 1; i++) {
    heapify(existing, i);
  }
};

module.exports = {
  parent,
  left,
  right,
  exchange,
  insert,
  min,
  extractMin,
  heapify,
  buildQueue,
};