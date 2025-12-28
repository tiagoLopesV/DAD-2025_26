const { Server } = require('socket.io');
const io = new Server(6001, { cors: { origin: '*' } });

io.on('connection', socket => {
  console.log('Client connected', socket.id);

  socket.on('join', (channel) => {
    socket.join(channel);
  });

  // You can listen for Laravel broadcast events via Redis here if using laravel-echo-server
  // Or handle emitting manually
});

module.exports = io;
