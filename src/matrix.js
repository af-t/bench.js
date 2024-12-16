const { Worker } = require("worker_threads");
const { cpus } = require("os");
const { join, basename } = require("path");

const createCalculator = (msize, ts) => {
    if (!ts) ts = 2;
    if (msize < ts) throw Error("The dataset count can’t be less than the thread count.");

    // initialize workers
    const workers = [];
    let on_message = () => null;
    let on_exit = () => null;
    let done = 0;
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
            if (++done === ts) on_exit();
        });
        workers[i] = worker;
    }

    return function calculateMatrix(a, b) {
        if (!msize) msize = a.length;
        const cl = Math.ceil(msize / ts);

        const promise = new Promise(resolve => {
            const result = [];
            on_message = (m) => result[m.id] = m.data;
            on_exit = () => {
                // simple method (in testing, the average was slower)
                resolve(result.flat());

                // advanced method (currently fastest method)
                const merged = [];
                let i = 0;
                for (let j = 1; j < result.length; j++) {
                    merged[i] = result[j];
                    i++;
                }
                resolve(merged);
            };
        });
        for (let i = 0; i < ts; i++) {
            const s = i * cl;
            const e = Math.min(s + cl, msize);
            workers[i].postMessage({ a, b, s, e, l: msize });
        }

        return promise;
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
            console.log(); // process.stdout.write('\n');
            resolve();
        }, 5000);
        while (!stop) {
            process.stdout.write('.');
            await new Promise((resolve) => setTimeout(resolve, 1880));
        }
    });

    console.time("calculate time");
    const res = await calculateMatrix(matrix[0], matrix[1]);
    console.timeEnd("calculate time");

    if (print) console.log(res);
}

var matrix_size = 256;
var threads = cpus().length || 2;
var print = false;

if (process.argv.length > 2) for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "-t" && process.argv[i + 1]) {
        threads = parseInt(process.argv[i + 1]);
        i++;
    } else
    if (process.argv[i] === "-s" && process.argv[i + 1]) {
        matrix_size = parseInt(process.argv[i + 1]);
        i++;
    } else
    if (process.argv[i].match(/^-[h?]$/)) {
        console.log(`Usage: ${basename(process.argv[1])} [options]\n\nOptions:\n  -t num\tThe number of threads to use.\n  -s num\tThe size of the matrix.\n  -h\t\tPrint help & exit.\n  -p\t\tPrint calculation results.`);
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
