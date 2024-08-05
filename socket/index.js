const { lerp, getFinishIndex, getGameResult } = require('../helpers');
const { verifyToken, getGameConfigs, getCompany } = require('../firebase');
const { setStoreKey } = require('../store');
require('events').EventEmitter.defaultMaxListeners = 100;

let numConnections = 0;
let intervalId = null;
let angleIntervalId = null;
let negativeAngleIntervalId = null;
let startTime = Date.now();
let positiveAngle = 0;
let negativeAngle = 0;
let companyId = null;

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

  socket.on("ping", async (callback) => {
    try {
      callback();
    } catch (error) {
      socket.emit('error', 'An error occurred while pinging the server');
    }
  });

  let gridData;

  socket.on('requestData', async (gameId) => {
    try {
      const document = await getGameConfigs(gameId);
      companyId = document.companyId;
      gridData = document;
      socket.emit('responseData', document);
    } catch (error) {
      console.error(error);
      socket.emit('error', `An error occurred while fetching game data: ${error.message}`);
    }
  });

  socket.on('requestCompany', async () => {
    try {
      const document = await getCompany(companyId);
      socket.emit('responseCompany', document);
    } catch (error) {
      console.error(error);
      socket.emit('error', `An error occurred while fetching game data: ${error.message}`);
    }
  });

  socket.on('startRotation', async () => {
    try {
      startRotation(socket, gridData?.firstWheelSpeed || 1, gridData?.secondWheelSpeed || 1.5)
    } catch (error) {
      socket.emit('error', 'An error occurred with the wheel rotation data');
    }
  }
  )

  socket.on('pauseRotation', async () => {
    try {
      pauseRotation(intervalId, negativeAngleIntervalId)
    } catch (error) {
      socket.emit('error', 'An error occurred with the wheel rotation pause data');
    }
  })

  socket.on('getFirstFinishIndex', async (data) => {
    try {
      const { rotateDeg } = data;
      const finishIndex = getFinishIndex(true, rotateDeg, gridData.gridRotate);
      socket.emit('firstFinishIndex', finishIndex);
    } catch (error) {
      socket.emit('error', 'An error occurred with data to get results of the first wheel rotation');
    }
  });

  socket.on('getSecondFinishIndex', async (data) => {
    try {
      const { rotateDeg } = data;
      const finishIndex = getFinishIndex(false, rotateDeg, gridData.gridRotate);
      socket.emit('secondFinishIndex', finishIndex);
    } catch (error) {
      socket.emit('error', 'An error occurred with data to get results of the second wheel rotation');
    }
  });

  socket.on('gameResultRequest', async (firstAngle, secondAngle) => {
    try {
      const result = getGameResult(firstAngle, secondAngle, gridData);
      socket.emit('gameResultResponse', result);
    } catch (error) {
      socket.emit('error', 'An error occurred with data to get results of the game');
    }
  });

  socket.on('requestTokenVerification', async (accessToken) => {
    try {
      const result = await verifyToken(accessToken);
      socket.emit('responseTokenVerification', result);
    } catch (error) {
      socket.emit('error', `An error occurred while user verification: ${error.message}`);
    }
  })

  socket.once('disconnect', async () => {
    try {
      numConnections--;
      if (numConnections === 0) {
        clearInterval(intervalId);
        clearInterval(angleIntervalId);
        clearInterval(negativeAngleIntervalId);
        angleIntervalId = null;
        intervalId = null;
        negativeAngleIntervalId = null;
      }
    } catch (error) {
      socket.emit('error', 'An error occurred with disconnecting the user');
    }
  });

}

module.exports = { handleConnection };
