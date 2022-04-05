import React from 'react';
import { Box, Typography, Badge } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: 20,
    flexGrow: 1,
    alignItems: 'center',
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
  boldPreviewText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: 'inherit',
    letterSpacing: -0.17,
  },
  unreadMessages: {
    backgroundColor: '#3A8DFF',
    color: '#FFFFFF',
    marginRight: 15,
  },
}));

const ChatContent = ({ conversation }) => {
  const classes = useStyles();

  const { otherUser, unreadMessagesCount } = conversation;
  const latestMessageText = conversation.id && conversation.latestMessageText;

  // if unread messages count is over 0, change the styling of preview text
  // and render an unread message count

  return (
    <Box className={classes.root}>
      <Box>
        <Typography className={classes.username}>
          {otherUser.username}
        </Typography>
        <Typography
          className={
            unreadMessagesCount ? classes.boldPreviewText : classes.previewText
          }
        >
          {latestMessageText}
        </Typography>
      </Box>
      <Box>
        <Badge
          badgeContent={unreadMessagesCount ? unreadMessagesCount : null}
          classes={{ badge: classes.unreadMessages }}
        />
      </Box>
    </Box>
  );
};

export default ChatContent;
