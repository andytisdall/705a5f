import React from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: 20,
    flexGrow: 1,
  },
  username: {
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  previewText: {
    fontSize: 12,
    color: '#9CADC8',
    letterSpacing: -0.17,
  },
  unreadMessages: {
    fontSize: 12,
    backgroundColor: '#3A8DFF',
    color: 'white',
    borderRadius: '50px',
    paddingRight: '5px',
    paddingLeft: '5px',
  },
}));

const ChatContent = ({ conversation }) => {
  const classes = useStyles();

  const { otherUser } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;

  // get a count of unread messages, not counting ones from this user
  const unreadMessagesCount = conversation.messages.filter(
    (message) => otherUser.id === message.senderId && !message.messageRead
  ).length;

  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>
        <Typography className={classes.previewText}>
          {latestMessageText}
        </Typography>
      </Box>
      <Box>
        <Typography className={classes.unreadMessages}>
          {unreadMessagesCount ? unreadMessagesCount : null}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatContent;
