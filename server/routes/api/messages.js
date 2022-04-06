const router = require("express").Router();
const { Conversation, Message } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");

// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    // if we already know conversation id, we can save time and just add it to message and return
    if (conversationId) {
      const conversation = await Conversation.findOne({
        where: {
          id: conversationId,
        },
      });
      // forbidden if user id is not in the users for this convo
      if (
        !conversation ||
        ![conversation.user1Id, conversation.user2Id].includes(senderId)
      ) {
        return res.sendStatus(403);
      }
      const message = await Message.create({
        senderId,
        text,
        conversationId,
        read: false,
      });
      return res.json({ message, sender });
    }
    // if we don't have conversation id, find a conversation to make sure it doesn't already exist
    let conversation = await Conversation.findConversation(
      senderId,
      recipientId
    );

    if (!conversation) {
      // create conversation
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
      });
      if (onlineUsers.includes(sender.id)) {
        sender.online = true;
      }
    }
    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
      read: false,
    });
    res.json({ message, sender });
  } catch (error) {
    next(error);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const { messages } = req.body;
    const messageIds = messages.map((message) => message.id);
    const { conversationId } = messages[0];

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
      },
    });

    // forbidden if user is not part of this conversation
    // or if the conversationId is not the same across all messages
    if (
      !conversation ||
      ![conversation.user1Id, conversation.user2Id].includes(req.user.id) ||
      !messages.every((message) => message.conversationId === conversationId)
    ) {
      return res.sendStatus(403);
    }

    await Message.update(
      { read: true },
      {
        where: {
          id: messageIds,
        },
      }
    );
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
