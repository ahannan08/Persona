const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers, getAllUsers } = require ("./utils/users");

const app = express();

const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatBot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit(
      'message',
      formatMessage(botName, `${user.username} has joined the chat`)
    );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    io.emit('allUsers', getAllUsers());
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Listen for private messages
  socket.on('privateMessage', ({ to, msg }) => {
    const fromUser = getCurrentUser(socket.id);
    const toUser = getCurrentUser(to);
    if (fromUser && toUser) {
      io.to(toUser.id).emit('privateMessage', {
        username: fromUser.username,
        text: msg,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  // Listen for typing indicator
  socket.on('typing', ({ to }) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(to).emit('typing', { username: user.username });
    }
  });

  socket.on('stopTyping', ({ to }) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(to).emit('stopTyping', { username: user.username });
    }
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });

      io.emit('allUsers', getAllUsers());
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
