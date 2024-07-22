// messages.js

const moment = require('moment');

function formatMessage(username, text, messageId) {
  return {
    username,
    text,
    time: moment().format('h:mm a'),
    messageId
  };
}

module.exports = formatMessage;
