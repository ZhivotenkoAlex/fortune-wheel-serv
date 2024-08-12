const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { handleConnection } = require('./socket');

const app = express();
app.use(cors({ origin: '*' }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
app.set('io', io);

io.on('connection', handleConnection);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(
    `The container started successfully and is listening for HTTP requests on ${PORT}`
  );
});
