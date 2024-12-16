const { parentPort, threadId } = require("worker_threads");
const { handle } = require('../build/Release/handle.node');
//const { handle } = require('./handle.js');

parentPort.on("message", m => {
  const data = handle(m.a, m.b, m.s, m.e, m.l);
  parentPort.postMessage({ id: threadId, data });
  process.exit();
});
