const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");

// associations

// this creates a junction tables UserConversations with a mapping of users to conversations
User.belongsToMany(Conversation, { through: "UserConversations" });
Conversation.belongsToMany(User, { through: "UserConversations" });

Message.belongsTo(Conversation);
Conversation.hasMany(Message);

// sets up a field readByUser that references a table mapping messages to users
Message.belongsToMany(User, { as: "readByUser", through: "UserReadMessages" });

module.exports = {
  User,
  Conversation,
  Message,
};
