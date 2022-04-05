const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");

// associations

// this creates a junction tables UserConversations with a mapping of users to conversations
User.belongsToMany(Conversation, { through: "UserConversations" });
Conversation.belongsToMany(User, { through: "UserConversations" });

Message.belongsTo(Conversation);
Conversation.hasMany(Message);

module.exports = {
  User,
  Conversation,
  Message,
};
