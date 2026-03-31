const { parentPort, threadId } = require("worker_threads");
const { handle } = require('../build/Release/handle.node');

parentPort.on("message", m => {
  const data = handle(m.a, m.b, m.s, m.e, m.l, m.op);
  parentPort.postMessage({ id: threadId, workerIdx: m.workerIdx, data });
});
