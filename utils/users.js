// users.js

const users = [];

// Join user to chat
function userJoin(id, username, room, admin = false) {
  const user = { id, username, room, admin,readReceipts: {} };
  users.push(user);
  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

// Get all users
function getAllUsers() {
  return users;
}

// Transfer admin
function transferAdmin(room) {
  const roomUsers = getRoomUsers(room);
  const newAdmin = roomUsers.find((user) => !user.admin);

  if (newAdmin) {
    newAdmin.admin = true;
  }
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUsers,
  transferAdmin,
};
