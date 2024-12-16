function handle(a, b, s, e, l) {
  const result = [];
  for (let y = s; y < e; y++) {
    result[y - s] = [];
    for (let x = 0; x < l; x++) {
      let sum = 0;
      for (let i = 0; i < l; i++) sum += a[y][i] * b[i][x];
      result[y - s][x] = sum;
    }
  }
  return result;
}

module.exports = { handle };
