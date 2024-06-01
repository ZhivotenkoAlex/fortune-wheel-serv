const express = require('express');
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');
const {
  getCompanyData,
  getAdjustedAngle,
  lerp,
  getFinishIndex,
} = require('./helpers/helpers');
// const fs = require('fs');

const app = express();
app.use(cors({origin: '*'}));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
app.set('io', io);

let numConnections = 0;
let intervalId = null;
let angleIntervalId = null;
let negativeAngleIntervalId = null;
const startTime = Date.now();

io.on('connection', (socket) => {
  numConnections++;

  const initialData = getCompanyData();
  socket.emit('message', initialData);

  let gridData = initialData;

  if (numConnections === 1) {
    intervalId = setInterval(() => {
      gridData = getCompanyData();
      io.emit('message', gridData);
    }, 5000);

    angleIntervalId = setInterval(() => {
      const timeElapsed = Date.now() - startTime;
      const wheelRotationAngle = lerp(0, 360, timeElapsed / 500);
      io.emit('wheelRotation', wheelRotationAngle);
    }, 50);

    negativeAngleIntervalId = setInterval(() => {
      const timeElapsed = Date.now() - startTime;
      const wheelRotationAngle = lerp(0, 360, timeElapsed / 300);
      const oppositeRotationAngle = 0 - wheelRotationAngle;
      io.emit('negativeWheelRotation', oppositeRotationAngle);
    }, 50);

    socket.on('getAdjustedAngle', (data) => {
      const {angle, greedRotate} = data;

      let adjustedData = getAdjustedAngle(angle, greedRotate, true);

      // Send the modified data back to the client
      socket.emit('adjustedAngle', adjustedData);
      adjustedData = null;
    });
    socket.on('getAdjustedNegativeAngle', (data) => {
      const {angle, greedRotate} = data;
      let adjustedData = getAdjustedAngle(angle, greedRotate, false);

      // Send the modified data back to the client
      socket.emit('adjustedNegativeAngle', adjustedData);
      adjustedData = null;
    });

    socket.on('getFirstFinishIndex', (data) => {
      const {isClockwise, rotateDeg, gridRotate} = data;
      const finishIndex = getFinishIndex(isClockwise, rotateDeg, gridRotate);
      socket.emit('firstFinishIndex', finishIndex);
    });

    socket.on('getSecondFinishIndex', (data) => {
      const {isClockwise, rotateDeg, gridRotate} = data;
      const finishIndex = getFinishIndex(isClockwise, rotateDeg, gridRotate);
      socket.emit('secondFinishIndex', finishIndex);
    });
  }

  socket.on('disconnect', () => {
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
});

const PORT = process.env.PORT || 5001;

// if (fs.existsSync('/tmp/app.lock')) {
//   console.log('Another instance of the app is already running.');
//   // eslint-disable-next-line no-process-exit
//   process.exit(1);
// } else {
//   // Create lock file
//   fs.writeFileSync('/tmp/app.lock', '');
// }

server.listen(PORT, () => {
  console.log(
    `The container started successfully and is listening for HTTP requests on ${PORT}`
  );
});
