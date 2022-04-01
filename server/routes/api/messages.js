const router = require("express").Router();
const { Conversation, Message, User } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");

// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    let conversation;
    // if we already know conversation id, we can save time and just add it to message and return
    if (conversationId) {
      conversation = await Conversation.findOne({
        where: {
          id: conversationId,
        },
      });
      if (!conversation) {
        return res.sendStatus(404);
      }
    } else {
      // create conversation
      conversation = await Conversation.create({});

      // associate the users with the conversation
      await conversation.addUsers([sender.id, recipientId]);
      await conversation.save();

      if (onlineUsers.includes(sender.id)) {
        sender.online = true;
      }
    }
    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
    });
    res.json({ message, sender });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const { id } = req.params;

    const message = await Message.findOne({
      where: {
        id,
      },
    });
    for (const key in req.body) {
      message[key] = req.body[key];
    }
    await message.save();
    res.json(message.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
