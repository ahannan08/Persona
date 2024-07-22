const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const allUsersList = document.getElementById('all-users');
const leaveBtn = document.getElementById('leave-btn');
const leavePrivateBtn = document.getElementById('leave-private-btn');
const recipientField = document.getElementById('recipient');
const tabs = document.getElementById('tabs');
let activeChat = 'group';
let privateChats = {}; // Declare privateChats her
// Get username and room from URL using qs library
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');
leavePrivateBtn.addEventListener('click', leavePrivateChat);


console.log('Attempting to connect to Socket.IO server...');
const socket = io();


// Join chatroom with username and room
socket.emit('joinRoom', { username, room });

// Handle room and users information
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
  chatMessages.className = `chat-messages chatbox-${room.toLowerCase()}`;

});

socket.on('allUsers', (users) => {
  outputAllUsers(users);
});

// Handle general chat message
socket.on('message', (message) => {
  console.log('Received message:', message); // Log received messages
  outputMessage(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// // Handle private message
// socket.on('privateMessage', (message) => {
//   console.log('Received private message:', message); // Log received private messages
//   outputPrivateMessage(message);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// });
// Listen for privateMessage event from server
// socket.on('privateMessage', ({ username, text, time }) => {
//   console.log(`Received private message from ${username}: ${text}`);
//   const chatMessagesDiv = document.getElementById(`messages-${activeChat}`);
//   if (chatMessagesDiv) {
//     chatMessagesDiv.innerHTML += `<p><strong>${username}:</strong> ${text} <em>${time}</em></p>`;
//     chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to the bottom
//   }
// });

function outputPrivateMessage({ username, text, time }) {
  // Ensure activeChat is set to the correct chat
  const chatMessagesDiv = document.getElementById(`messages-${activeChat}`);
  if (chatMessagesDiv) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
      <p class="meta">${username} <span>${time}</span></p>
      <p class="text">
        ${text}
      </p>
    `;
    chatMessagesDiv.appendChild(div);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to the bottom
  }
}


// Function to send private message
//this works in backend..and frontend too...
function sendPrivateMessage() {
  const message = document.getElementById('messageInput').value;
  const to = recipientField.value;
  socket.emit('privateMessage', { to, msg: message });
  document.getElementById('messageInput').value = ''; // Clear the input field
  console.log(`Sent private message to ${to}: ${message}`);

}


// Handle typing indicator
let typingTimeout;
const TYPING_TIMER_LENGTH = 1000;

//server side
socket.on('typing', ({ username }) => {
  addTypingIndicator(username);
});

socket.on('stopTyping', ({ username }) => {
  removeTypingIndicator(username);
});

// Handle messageSeen event to update read receipt status
// socket.on('messageSeen', ({ messageId, msg }) => {
//   console.log(`MessageId received and seen: ${messageId}`); 
//   console.log(`Recipient has seen the message:`, msg); // Log message content
  
//   // Log messageId for debugging
//   const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
//   if (messageElement) {
//     messageElement.classList.add('seen');
//   }
// });

// Function to emit typing event
function emitTyping() {
  const recipient = recipientField.value;
  socket.emit('typing', { username, to: recipient });
}

// Function to emit stop typing event
function emitStopTyping() {
  const recipient = recipientField.value;
  socket.emit('stopTyping', { username, to: recipient });
}

// Function to output messages to DOM
// function outputMessage(message) {
//   console.log("the message is ",message)
//   const div = document.createElement('div');
//   div.classList.add('message');
  
//   const p = document.createElement('p');
//   p.classList.add('meta');
//   // p.innerText = `${message.username}`;
//   p.innerHTML = `<strong>${message.username}</strong>  <span>${message.time}</span>`;

//   console.log("gc user msg", message.username)
//   // p.innerHTML += `<span>${message.time}</span>`;
//   div.appendChild(p);

//   const para = document.createElement('p');
//   para.classList.add('text');
//   para.innerText = message.text;
//   div.appendChild(para);

  
//   const chatMessages = document.getElementById('chat-messages');
//   chatMessages.appendChild(div);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// }
function outputMessage({ username, text, time }) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
    <p class="meta">${username} <span>${time}</span></p>
    <p class="text">
      ${text}
    </p>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
// Function to output private messages to DOM
// function outputMessage(message) {
//   console.log("Received message:", message); // Log received messages

//   const chatMessages = document.getElementById('chat-messages');
//   if (!chatMessages) {
//     console.error("chat-messages element not found in DOM.");
//     return;
//   }

//   const div = document.createElement('div');
//   div.classList.add('message');

//   const p = document.createElement('p');
//   p.classList.add('meta');
//   p.innerHTML = `<strong>${message.username}</strong> <span>${message.time}</span>`;
//   div.appendChild(p);

//   const para = document.createElement('p');
//   para.classList.add('text');
//   para.innerText = message.text;
//   div.appendChild(para);

//   chatMessages.appendChild(div);

//   // Ensure chatMessages scrolls to the bottom
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// }


// Function to output room name
function outputRoomName(room) {
  roomName.innerText = room;
}

// Function to output users in the room
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    if (user.admin) {
      li.innerHTML += ' <span>(Admin)</span>';
    }
    userList.appendChild(li);
  });
}

// Function to output all users
function outputAllUsers(users) {
  allUsersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    li.dataset.id = user.id;
    li.addEventListener('click', () => {
      openUserChat(user.id, user.username);
    });
    if (user.id === recipientField.value) {
      li.classList.add('active');
    }
    allUsersList.appendChild(li);
  });
}

// Example: Create private chat tab dynamically
function openPrivateChat(user) {
  // Assuming `privateChatContainer` is the container for private chats
  const privateTab = document.createElement('div');
  privateTab.classList.add('private-chat-tab');
  privateTab.innerHTML = `
      <h3>${user.username}</h3>
      <div class="private-chat-messages"></div>
      <form id="private-chat-form">
          <input type="text" id="private-message-input" placeholder="Type a message...">
          <button type="submit">Send</button>
      </form>
  `;
  privateChatContainer.appendChild(privateTab);

  // Add event listener for sending private messages
  const privateForm = privateTab.querySelector('#private-chat-form');
  privateForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const messageInput = privateForm.querySelector('#private-message-input').value;
      // Emit the private message to the server
      socket.emit('privateMessage', {
          to: user.username,
          message: messageInput
      });
      // Optionally, add the message to the UI immediately
      appendMessageToPrivateChat(privateTab.querySelector('.private-chat-messages'), messageInput, 'You');
      // Clear input field
      privateForm.querySelector('#private-message-input').value = '';
  });
}

// Function to start private chat
function startPrivateChat(userId) {
  recipientField.value = userId;
  console.log("start pvt chat from frontend.", username, room),
  socket.emit('joinPrivateRoom', { username, room, to: userId });

  // Show the leave private chat button
  leavePrivateBtn.style.display = 'block';
}

// // Function to leave private chat
// function leavePrivateChat() {
//   const recipient = recipientField.value;
//   if (recipient) {
//     socket.emit('leavePrivateRoom', {
//       username,
//       room,
//       from: socket.id,
//       to: recipient,
//     });
//     recipientField.value = '';

//     // Hide the leave private chat button
//     leavePrivateBtn.style.display = 'none';
//   }
// }
function leavePrivateChat() {
  // Hide the current private chat
  if (activeChat) {
    const privateChatMessages = document.getElementById(`messages-${activeChat}`);
    if (privateChatMessages) {
      privateChatMessages.style.display = 'none';
    }
    const privateChatTab = document.getElementById(`chat-tab-${activeChat}`);
    if (privateChatTab) {
      privateChatTab.classList.remove('active');
    }
    activeChat = null;
  }
 // Show the group chat
 groupChatMessages.style.display = 'block';
 groupChatTab.classList.add('active');

 // Hide the leave private chat button
 leavePrivateBtn.style.display = 'none';

 // Clear the recipient field
 recipientField.value = '';
}

// Function to generate unique message ID
function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Receiving private messages
socket.on('privateMessage', ({ username, text, time }) => {
  console.log(`Received private message from ${username}: ${text}`);
  outputPrivateMessage({ username, text, time });
});

// Handle chat form submission
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = e.target.elements.msg.value.trim();
  const recipient = document.getElementById('recipient').value;

  if (msg) {
    if (activeChat === 'group') {
      socket.emit('chatMessage', msg);
    } else {
      socket.emit('privateMessage', { to: activeChat, msg });
      outputPrivateMessage({ username: 'You', text: msg, time: new Date().toLocaleTimeString() });
    }
  }

  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});


// Handle chat form submission
// chatForm.addEventListener('submit', (e) => {
//   e.preventDefault();
//   const msg = e.target.elements.msg.value.trim();
//   const recipient = recipientField.value;
//   const messageId = generateMessageId(); // Generate unique message ID

//   if (msg) {
//     if (recipient) {
//       console.log('Sent private message:', msg, "by username",username); // Ensure `msg.text` is defined here before emitting `privateMessage`
//       socket.emit('privateMessage', { to: recipient, msg, messageId });
//     } else {
//       socket.emit('chatMessage', msg);
//     }
//   }

//   e.target.elements.msg.value = '';
//   e.target.elements.msg.focus();
// });

// Handle leaving the room
leaveBtn.addEventListener('click', () => {
  socket.emit('leaveRoom');
  window.location.replace('/'); // Redirect to the join page
});

// Handle leaving private chat
// leavePrivateBtn.addEventListener('click', leavePrivateChat);

// Handle typing indication
const msgInput = chatForm.elements.msg;
msgInput.addEventListener('input', () => {
  const recipient = recipientField.value;
  clearTimeout(typingTimeout);
  if (msgInput.value.trim() !== '') {
    typingTimeout = setTimeout(() => {
      emitTyping(); // Emit typing event after TYPING_TIMER_LENGTH
    }, TYPING_TIMER_LENGTH);
  } else {
    emitStopTyping(); // Emit stop typing event if input is empty
  }
});

// Ensure the leave private chat button is hidden on page load
document.addEventListener('DOMContentLoaded', () => {
  leavePrivateBtn.style.display = 'none';
});

// Function to add typing indicator
function addTypingIndicator(username) {
  const typingIndicator = document.createElement('p');
  typingIndicator.classList.add('typing-indicator');
  typingIndicator.textContent = `${username} is typing...`;
  chatMessages.appendChild(typingIndicator);
}

// Function to remove typing indicator
function removeTypingIndicator(username) {
  const typingIndicators = document.querySelectorAll('.typing-indicator');
  typingIndicators.forEach((indicator) => {
    if (indicator.textContent.includes(username)) {
      indicator.remove();
    }
  });
}

// Function to switch to group chat
function switchToGroupChat() {
  activeChat = 'group';
  document.getElementById('chat-messages').style.display = 'block';
  leavePrivateBtn.style.display = 'none';
  for (const chat in privateChats) {
    privateChats[chat].style.display = 'none';
  }
}
// Function to open a user chat
// function openUserChat(userId, username) {
//   let chatTab = document.getElementById(`chat-tab-${userId}`);
//   if (!chatTab) {
//     chatTab = document.createElement('div');
//     chatTab.id = `chat-tab-${userId}`;
//     chatTab.className = 'tab';
//     chatTab.textContent = username;
//     chatTab.addEventListener('click', () => switchToPrivateChat(userId, username));
//     console.log("pvt chat int ", username)
//     tabs.appendChild(chatTab);

//     const messagesDiv = document.createElement('div');
//     messagesDiv.id = `messages-${userId}`;
//     messagesDiv.className = 'chat-messages';
//     messagesDiv.style.display = 'none';
//     document.body.appendChild(messagesDiv);
//   }
//   switchToPrivateChat(userId, username);
// }
// Example: Setting currentUser when the user logs in or session is initialized
let currentUser = ''; // Initialize with an empty string or default value

// Assuming you have a function or event that sets currentUser
function setCurrentUser(username) {
  currentUser = username;
}
// Function to switch to private chat
// function switchToPrivateChat(userId, username) {
//   activeChat = userId;
//   recipientField.value = userId;
//   document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
//   document.getElementById(`chat-tab-${userId}`).classList.add('active');
//   document.querySelectorAll('.chat-messages').forEach(msgDiv => msgDiv.style.display = 'none');
//   document.getElementById(`messages-${userId}`).style.display = 'block';
//   leavePrivateBtn.style.display = 'inline-block';

//   // Emit joinPrivateRoom event to the server
//   socket.emit('joinPrivateRoom', { username: currentUser, room: 'private', to: userId });
// }

// function switchToPrivateChat(userId, username) {
//   activeChat = userId;
//   recipientField.value = userId;
  
//   // Remove active class from all tabs and add it to the selected private chat tab
//   document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
//   document.getElementById(`chat-tab-${userId}`).classList.add('active');

//   // Hide all chat messages divs and show the selected private chat messages
//   document.querySelectorAll('.chat-messages').forEach(msgDiv => msgDiv.style.display = 'none');
//   const privateMessagesDiv = document.getElementById(`messages-${userId}`);
//   if (privateMessagesDiv) {
//     privateMessagesDiv.style.display = 'block';
//   } else {
//     // Create new messages div for private chat if it doesn't exist (though it should exist already)
//     console.error(`Private messages container not found for user ${userId}`);
//   }

//   // Show the leave private chat button
//   leavePrivateBtn.style.display = 'inline-block';

//   // Emit joinPrivateRoom event to the server via Socket.IO
//   socket.emit('joinPrivateRoom', { username: currentUser, room: 'private', to: userId });
// }


// function switchToPrivateChat(userId, username) {
//   activeChat = userId;
//   recipientField.value = userId;
  
//   // Remove active class from all tabs and add it to the selected private chat tab
//   document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
//   document.getElementById(`chat-tab-${userId}`).classList.add('active');

//   // Hide all chat messages divs and show the selected private chat messages
//   document.querySelectorAll('.chat-messages').forEach(msgDiv => msgDiv.style.display = 'none');
  
//   // Find or create the private messages container
//   let privateMessagesDiv = document.getElementById(`messages-${userId}`);
//   if (!privateMessagesDiv) {
//     // Create the messages container if it doesn't exist
//     privateMessagesDiv = document.createElement('div');
//     privateMessagesDiv.id = `messages-${userId}`;
//     privateMessagesDiv.className = 'chat-messages';
//     document.getElementById('chat-main').appendChild(privateMessagesDiv);
//   }
  
//   // Show the private messages container
//   privateMessagesDiv.style.display = 'block';

//   // Show the leave private chat button
//   leavePrivateBtn.style.display = 'inline-block';

//   // Emit joinPrivateRoom event to the server via Socket.IO
//   socket.emit('joinPrivateRoom', { username: currentUser, room: 'private', to: userId });
// }

// function switchToPrivateChat(userId, username) {
//   activeChat = userId;
//   recipientField.value = userId;
  
//   // Remove active class from all tabs and add it to the selected private chat tab
//   document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
//   document.getElementById(`chat-tab-${userId}`).classList.add('active');

//   // Hide all chat messages divs and show the selected private chat messages
//   document.querySelectorAll('.chat-messages').forEach(msgDiv => msgDiv.style.display = 'none');
  
//   // Find or create the private messages container
//   let privateMessagesDiv = document.getElementById(`messages-${userId}`);
//   if (!privateMessagesDiv) {
//     // Create the messages container if it doesn't exist
//     privateMessagesDiv = document.createElement('div');
//     privateMessagesDiv.id = `messages-${userId}`;
//     privateMessagesDiv.className = 'chat-messages';
//     document.querySelector('.chat-main-content').appendChild(privateMessagesDiv);
//   }
  
//   // Show the private messages container
//   privateMessagesDiv.style.display = 'block';

//   // Show the leave private chat button
//   leavePrivateBtn.style.display = 'inline-block';

//   // Emit joinPrivateRoom event to the server via Socket.IO
//   socket.emit('joinPrivateRoom', { username: currentUser, room: 'private', to: userId });
// }
// Switch to private chat

// // Switch to private chat
// function switchToPrivateChat(userId, username) {
//   if (!privateChats[userId]) {
//     // Create a new tab and chat messages container for the private chat
//     const tab = document.createElement('div');
//     tab.id = `tab-${userId}`;
//     tab.classList.add('tab');
//     tab.textContent = username;
//     tab.onclick = () => switchToPrivateChat(userId, username);
//     tabs.appendChild(tab);

//     const chatMessagesDiv = document.createElement('div');
//     chatMessagesDiv.id = `messages-${userId}`;
//     chatMessagesDiv.classList.add('chat-messages');
//     chatMessagesDiv.style.display = 'none';
//     document.querySelector('.chat-main-content').appendChild(chatMessagesDiv);

//     privateChats[userId] = chatMessagesDiv;
//   }

//   activeChat = userId;
//   document.getElementById('chat-messages').style.display = 'none';
//   leavePrivateBtn.style.display = 'block';
//   for (const chat in privateChats) {
//     privateChats[chat].style.display = chat === userId ? 'block' : 'none';
//   }
// }
// Function to open a user chat
function openUserChat(userId, username) {
  let chatTab = document.getElementById(`chat-tab-${userId}`);
  if (!chatTab) {
    chatTab = document.createElement('div');
    chatTab.id = `chat-tab-${userId}`;
    chatTab.className = 'tab';
    chatTab.textContent = username;
    chatTab.addEventListener('click', () => switchToPrivateChat(userId, username));
    tabs.appendChild(chatTab);

    const messagesDiv = document.createElement('div');
    messagesDiv.id = `messages-${userId}`;
    messagesDiv.className = 'chat-messages';
    messagesDiv.style.display = 'none';
    document.querySelector('.chat-main-content').appendChild(messagesDiv);

    privateChats[userId] = messagesDiv;
  }
  switchToPrivateChat(userId, username);
}

// Function to switch to private chat
function switchToPrivateChat(userId, username) {
  activeChat = userId;
  recipientField.value = userId;
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(`chat-tab-${userId}`).classList.add('active');
  document.querySelectorAll('.chat-messages').forEach(msgDiv => msgDiv.style.display = 'none');
  privateChats[userId].style.display = 'block';
  leavePrivateBtn.style.display = 'inline-block';

  // Emit joinPrivateRoom event to the server
  socket.emit('joinPrivateRoom', { username: currentUser, room: 'private', to: userId });
}

// Initial setup for group chat tab
// const groupTab = document.createElement('div');
// groupTab.id = 'group-tab';
// groupTab.className = 'tab active';
// groupTab.textContent = 'Group Chat';
// groupTab.addEventListener('click', switchToGroupChat);
// tabs.appendChild(groupTab);


