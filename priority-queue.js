const SIZE = 0;
const parent = i => Math.floor(i / 2);
const left = i => i * 2;
const right = i => i * 2 + 1;

module.exports = class {

  constructor(queueSize, existing=[], getId = x => x, compare = (l, r) => l < r) {
    this.queue = new Array(queueSize - existing.length);
    this.indexes = new Array(queueSize + 1);
    this.indexes.fill(-1);
    this.compare = compare;
    this.getId = getId;

    this.queue.unshift(...existing);
    this.queue.unshift(existing.length);

    existing.forEach(e => {
      const index = this.getId(e);
      this.indexes[index] = index;
    });
    
    for (let i = Math.floor(queueSize / 2); i >= 1; i--) {
      this.heapify(i);
    }
  }

  size() {
    return this.queue[SIZE];
  }

  indexOf(i) {
    return this.indexes[i];
  }

  includes(i) {
    return this.indexOf(i) >= 0;
  }

  hasIncluded(i) {
    return this.indexOf(i) === -2;
  }

  heapify(i) {
    const l = left(i);
    const r = right(i);
    let target = i;
  
    if (l <= this.queue[SIZE] && this.compare(this.queue[l], this.queue[target])) {
      target = l;
    }
    if (r <= this.queue[SIZE] && this.compare(this.queue[r], this.queue[target])) {
      target = r;
    }
    if (target !== i) {
      this.exchange(i, target);
      this.heapify(target);
    }
  }

  insert(x) {
    const size = this.queue[SIZE] + 1;
    this.queue[SIZE] = size;
    this.queue[size] = x;
    this.indexes[this.getId(x)] = size;
    this.update(size, x);
  }
  
  min() {
    return this.queue[1];
  }
  
  extractMin() {
    if (this.queue[SIZE] < 1) return;
  
    let target = this.queue[1];
    this.indexes[this.getId(target)] = -2;
    this.exchange(1, this.queue[SIZE]);
    this.queue[SIZE] -= 1;
    this.heapify(1);
    return target;
  }

  exchange(xIndex, yIndex) {
    const x = this.queue[xIndex];
    const y = this.queue[yIndex];

    this.queue[xIndex] = y;
    this.queue[yIndex] = x;
    
    this.indexes[this.getId(x)] = yIndex;
    this.indexes[this.getId(y)] = xIndex;
  }

  update(i, x) {
    if (this.compare(this.queue[i], x)) return;

    this.queue[i] = x;

    while (i > 1 && this.compare(this.queue[i], this.queue[parent(i)])) {
      this.exchange(i, parent(i));
      i = parent(i);
    }
  }
};