const { getCompanyData, lerp, getFinishIndex, getGameResult } = require('../helpers');
const { verifyToken, getGameConfigs } = require('../firebase');
const { setStoreKey } = require('../store');
require('events').EventEmitter.defaultMaxListeners = 100;

let numConnections = 0;
let intervalId = null;
let angleIntervalId = null;
let negativeAngleIntervalId = null;
let startTime = Date.now();
let positiveAngle = 0;
let negativeAngle = 0;

function startRotation(socket, positiveSpeed, negativeSpeed) {
  startTime = Date.now();
  setStoreKey('startAt', startTime);
  angleIntervalId = setInterval(() => {
    const timeElapsed = Date.now() - startTime;
    positiveAngle = lerp(0, 360, (timeElapsed / 1000)) * positiveSpeed;
    socket.emit('wheelRotation', positiveAngle);
  }, 20);

  negativeAngleIntervalId = setInterval(() => {
    const timeElapsed = Date.now() - startTime;
    negativeAngle = 0 - lerp(0, 360, (timeElapsed / 1000)) * negativeSpeed;
    socket.emit('negativeWheelRotation', negativeAngle);
  }, 20);
}

function pauseRotation(intervalId, negativeAngleIntervalId) {
  setStoreKey('finishAt', Date.now());
  clearInterval(intervalId);
  clearInterval(negativeAngleIntervalId);
}


function handleConnection(socket) {
  numConnections++;

  socket.on("ping", (callback) => {
    callback();
  });

  let gridData;

  socket.on('requestData', async (gameId) => {
    try {
      const document = await getGameConfigs(gameId);
      gridData = document;
      socket.emit('responseData', document);
    } catch (error) {
      console.error(error);
      socket.emit('error', 'An error occurred while fetching data');
    }
  });

  socket.on('startRotation', () =>
    startRotation(socket, gridData?.firstWheelSpeed || 1, gridData?.secondWheelSpeed || 1.5)
  )

  socket.on('pauseRotation', () => pauseRotation(intervalId, negativeAngleIntervalId))

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

  socket.on('gameResultRequest', (firstAngle, secondAngle) => {
    const result = getGameResult(firstAngle, secondAngle, gridData);
    socket.emit('gameResultResponse', result);
  });

  socket.on('requestTokenVerification', async (accessToken) => {
    const result = await verifyToken(accessToken);
    socket.emit('responseTokenVerification', result);
  })

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
