const { Op } = require("sequelize");
const db = require("../db");
const Message = require("./message");

const Conversation = db.define("conversation", {});

// find conversation given all user Ids

Conversation.findConversation = async function (users) {
  const conversation = await Conversation.findOne({
    where: {
      users: {
        [Op.and]: [...users],
      },
    },
  });

  // return conversation or null if it doesn't exist
  return conversation;
};

module.exports = Conversation;
