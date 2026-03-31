const { Worker } = require("worker_threads");
const { cpus } = require("os");
const { join, basename } = require("path");
const fs = require("fs");

const createCalculator = (msize, ts) => {
    if (!ts) ts = 2;
    if (msize < ts) throw Error("The dataset count can’t be less than the thread count.");

    // initialize workers
    const workers = [];
    let on_message = () => null;
    for (let i = 0; i < ts; i++) {
        const worker = new Worker(join(__dirname, "worker.js"));
        worker.on("message", m => on_message(m));
        worker.on("error", err => {
            console.error("Err: There was a problem with the worker during counting");
            console.error(err.message);
            process.exit(1);
        });
        worker.on("exit", code => {
            if (code > 0) console.warn("Warn: worker exited with code:", code);
        });
        workers[i] = worker;
    }

    return function calculateMatrix(a, b, op = "mul") {
        if (!msize) msize = a.length;
        const cl = Math.ceil(msize / ts);

        return new Promise(resolve => {
            const result = [];
            let finished = 0;
            on_message = (m) => {
                result[m.workerIdx] = m.data;
                if (++finished === ts) {
                    resolve(result.flat());
                }
            };

            for (let i = 0; i < ts; i++) {
                const s = i * cl;
                const e = Math.min(s + cl, msize);
                workers[i].postMessage({ a, b, s, e, l: msize, op, workerIdx: i });
            }
        });
    };
};

/**
 * The first function to be executed at runtime
 *
 * @param {number} [args[0]] - The size of the matrix
 * @param {number} [args[1]] - The number of threads to use
 */
async function start(...args) {
    const calculateMatrix = createCalculator(args[0], args[1]);
    console.log(`Using ${args[1]} threads, matrix size: ${args[0]}`);

    // generate matrix
    const matrix = [[], []];
    for (let y = 0; y < args[0]; y++) {
        matrix[0][y] = [];
        matrix[1][y] = [];
        for (let x = 0; x < args[0]; x++) {
            matrix[0][y][x] = Math.round(Math.random() * 5);
            matrix[1][y][x] = Math.round(Math.random() * 5);
        }
    }

    process.stdout.write('Delaying 5 seconds before starting');
    await new Promise(async(resolve) => {
        let stop = false;
        setTimeout(() => {
            stop = true;
            console.log(); 
            resolve();
        }, 5000);
        while (!stop) {
            process.stdout.write('.');
            await new Promise((resolve) => setTimeout(resolve, 1880));
        }
    });

    const operations = ['mul', 'add', 'sub', 'trans', 'inv'];
    const benchmarks = {};

    for (const op of operations) {
        process.stdout.write(`Running operation: ${op}... `);
        const startTime = Date.now();
        const res = await calculateMatrix(matrix[0], matrix[1], op);
        const endTime = Date.now();
        const duration = endTime - startTime;
        benchmarks[op] = duration;
        console.log(`${duration}ms`);
        if (print) console.log(res);
    }

    if (output_file) {
        if (!fs.existsSync(join(process.cwd(), "results"))) {
            fs.mkdirSync(join(process.cwd(), "results"));
        }

        let filename = typeof output_file === "string" ? output_file : `benchmark_${Date.now()}.json`;
        if (!filename.endsWith(".json")) filename += ".json";
        
        const filePath = (filename.includes("/") || filename.includes("\\")) ? filename : join(process.cwd(), "results", filename);
        const data = {
            matrix_size: args[0],
            threads: args[1],
            benchmarks,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Results saved to ${filePath}`);
    }

    process.exit(0);
}

var matrix_size = 256;
var threads = cpus().length || 2;
var print = false;
var output_file = null;

if (process.argv.length > 2) for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "-t" && process.argv[i + 1]) {
        threads = parseInt(process.argv[i + 1]);
        i++;
    } else
    if (process.argv[i] === "-s" && process.argv[i + 1]) {
        matrix_size = parseInt(process.argv[i + 1]);
        i++;
    } else
    if (process.argv[i] === "-o") {
        if (process.argv[i + 1] && !process.argv[i + 1].startsWith("-")) {
            output_file = process.argv[i + 1];
            i++;
        } else {
            output_file = true;
        }
    } else
    if (process.argv[i].match(/^-[h?]$/)) {
        console.log(`Usage: ${basename(process.argv[1])} [options]\n\nOptions:\n  -t num\tThe number of threads to use.\n  -s num\tThe size of the matrix.\n  -o [file]\tSave results to a JSON file in results/ directory.\n  -h\t\tPrint help & exit.\n  -p\t\tPrint calculation results.`);
        process.exit();
    } else
    if (process.argv[i] === "-p") print = true;
}

if (isNaN(matrix_size)) {
    console.error(`Err: received matrix_size is ${matrix_size}`);
    process.exit(1);
}
if (isNaN(threads)) {
    console.error(`Err: received threads is ${threads}`);
    process.exit(1);
}

start(matrix_size, threads);
