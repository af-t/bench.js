# Bench.js
A tool to test how fast your computer's CPU is to process simple matrix multiplication.

## installation
```bash
git clone --depth=1 https://github.com/af-t/bench.js bench
cd bench
npm install

# test
npm test
```

## usage
```bash
# basic usage
node .

# custom threads
node . -t 5

# custom dataset size
node . -s 512

# print output
node . -p

# save results to JSON file
node . -o benchmark_results.json
```

## features
- Multi-threaded matrix multiplication, addition, subtraction, transpose, and inverse.
- Sequential benchmark of all operations.
- Save benchmark results to JSON for analysis.
- High-performance C++ core using `node-addon-api`.

## output example
```ascii
> node .
Using 8 threads, matrix size: 256
Delaying 5 seconds before starting...
calculate time: 185.785ms
```
