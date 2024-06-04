const { getCompanyData, lerp, getFinishIndex } = require('../helpers');

require('events').EventEmitter.defaultMaxListeners = 100;

let numConnections = 0;
let intervalId = null;
let angleIntervalId = null;
let negativeAngleIntervalId = null;
let startTime = Date.now();

function handleConnection(socket) {
  function startRotation() {
    startTime = Date.now();
    angleIntervalId = setInterval(() => {
      const timeElapsed = Date.now() - startTime;
      positiveAngle = lerp(0, 360, timeElapsed / 1000);
      socket.emit('wheelRotation', positiveAngle);
    }, 20);

    negativeAngleIntervalId = setInterval(() => {
      const timeElapsed = Date.now() - startTime;
      negativeAngle = 0 - lerp(0, 360, timeElapsed / 1200);
      socket.emit('negativeWheelRotation', negativeAngle);
    }, 20);
  }

  function pauseRotation() {
    clearInterval(intervalId);
    clearInterval(negativeAngleIntervalId);
  }

  numConnections++;

  socket.on('ping', (callback) => {
    callback();
  });

  const initialData = getCompanyData();
  socket.emit('getData', initialData);

  let gridData = initialData;
  let positiveAngle = 0;
  let negativeAngle = 0;

  if (numConnections === 1) {
    intervalId = setInterval(() => {
      gridData = getCompanyData();
      socket.emit('getData', gridData);
      startTime = Date.now();
    }, 5000);

    socket.on('updateData', () => {
      gridData = getCompanyData();
      socket.emit('getData', gridData);
    });

    startRotation();

    socket.on('startRotation', startRotation);

    socket.on('pauseRotation', pauseRotation);

    socket.on('getFirstFinishIndex', (data) => {
      const { rotateDeg } = data;
      const finishIndex = getFinishIndex(true, rotateDeg, gridData.gridRotate);
      socket.emit('firstFinishIndex', finishIndex);
    });

    socket.on('getSecondFinishIndex', (data) => {
      const { rotateDeg } = data;
      const finishIndex = getFinishIndex(false, rotateDeg, gridData.gridRotate);
      socket.emit('secondFinishIndex', finishIndex);
    });
  }

  socket.once('disconnect', () => {
    numConnections--;
    if (numConnections === 0) {
      clearInterval(intervalId);
      clearInterval(angleIntervalId);
      clearInterval(negativeAngleIntervalId);
      angleIntervalId = null;
      intervalId = null;
      negativeAngleIntervalId = null;
    }
  });
}

module.exports = { handleConnection };
