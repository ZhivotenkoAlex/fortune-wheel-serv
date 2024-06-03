const {getCompanyData, lerp, getFinishIndex} = require('../helpers/helpers');
require('events').EventEmitter.defaultMaxListeners = 100;
let numConnections = 0;
let intervalId = null;
let angleIntervalId = null;
let negativeAngleIntervalId = null;
const startTime = Date.now();

function handleConnection(socket) {
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

      socket.on('ping', (callback) => {
        callback();
      });
    }, 5000);

    angleIntervalId = setInterval(() => {
      const timeElapsed = Date.now() - startTime;
      const wheelRotationAngle = lerp(0, 360, timeElapsed / 1000);
      positiveAngle = wheelRotationAngle;
      socket.emit('wheelRotation', wheelRotationAngle);
    }, 20);

    negativeAngleIntervalId = setInterval(() => {
      const timeElapsed = Date.now() - startTime;
      const wheelRotationAngle = lerp(0, 360, timeElapsed / 1200);
      const oppositeRotationAngle = 0 - wheelRotationAngle;
      negativeAngle = oppositeRotationAngle;
      socket.emit('negativeWheelRotation', oppositeRotationAngle);
    }, 20);

    socket.on('getFirstFinishIndex', () => {
      const finishIndex = getFinishIndex(
        true,
        positiveAngle,
        gridData.gridRotate
      );
      socket.emit('firstFinishIndex', finishIndex);
    });

    socket.on('getSecondFinishIndex', () => {
      const finishIndex = getFinishIndex(
        false,
        negativeAngle,
        gridData.gridRotate
      );
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

module.exports = {handleConnection};
