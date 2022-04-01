import React, { useCallback, useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { Grid, CssBaseline, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { SidebarContainer } from '../components/Sidebar';
import { ActiveChat } from '../components/ActiveChat';
import { SocketContext } from '../context/socket';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
}));

const Home = ({ user, logout }) => {
  const history = useHistory();

  const socket = useContext(SocketContext);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const classes = useStyles();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const addSearchedUsers = (users) => {
    const currentUsers = {};

    // make table of current users so we can lookup faster
    conversations.forEach((convo) => {
      currentUsers[convo.otherUser.id] = true;
    });

    const newState = [...conversations];
    users.forEach((user) => {
      // only create a fake convo if we don't already have a convo with this user
      if (!currentUsers[user.id]) {
        let fakeConvo = { otherUser: user, messages: [] };
        newState.push(fakeConvo);
      }
    });

    setConversations(newState);
  };

  const clearSearchedUsers = () => {
    setConversations((prev) => prev.filter((convo) => convo.id));
  };

  const saveMessage = async (body) => {
    const { data } = await axios.post('/api/messages', body);
    return data;
  };

  const sendMessage = (data, body) => {
    socket.emit('new-message', {
      message: data.message,
      recipientId: body.recipientId,
      sender: data.sender,
    });
  };

  const postMessage = async (body) => {
    try {
      // saveMessage must be awaited to resolve the data
      const data = await saveMessage(body);
      addNewMessage(data, body.recipientId);
      sendMessage(data, body);
    } catch (error) {
      console.error(error);
    }
  };

  const setLastReadMessage = useCallback((lastReadMessage) => {
    setConversations((prev) => {
      // find the conversation, then find the new last read message
      // update lastReadMessage to true
      // update old last read message to false
      console.log(lastReadMessage);
      return prev.map((convo) => {
        if (convo.id === lastReadMessage.conversationId) {
          const convoCopy = { ...convo };
          convoCopy.messages = convo.messages.map((message) => {
            if (message.id === lastReadMessage.id) {
              console.log(message);
              return { ...message, lastRead: true };
            } else if (message.lastRead) {
              return { ...message, lastRead: false };
            } else {
              return message;
            }
          });
          return convoCopy;
        } else {
          return convo;
        }
      });
    });
  }, []);

  const updateMessagesAsRead = useCallback(async (messages) => {
    // api call takes an array of messages and updates all their
    // statuses to read
    const messageIds = messages.map((message) => message.id);
    try {
      await axios.patch('/api/messages', {
        messageIds,
      });
      // emit an object updating the other user about the most recent read messages
      const lastReadMessage = messages[messages.length - 1];
      return messages.map((message) => {
        return { ...message, read: true };
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const addNewConvo = useCallback(
    (otherUserId, data) => {
      const { sender, message } = data;

      setConversations((prev) => {
        let existingConvoFound = false;
        const dataToAddToConvo = {
          id: message.conversationId,
          latestMessageText: message.text,
          messages: [message],
        };

        // if sent by this user, the other user will be in
        // the list of fake convo
        const conversationsCopy = prev.map((convo) => {
          if (convo.otherUser.id === otherUserId) {
            const convoCopy = {
              ...convo,
              ...dataToAddToConvo,
            };
            existingConvoFound = true;
            return convoCopy;
          } else {
            return convo;
          }
        });
        // if sent by other user, fake user may not exist
        // so we will get otheruser data from sender
        // and add convo to conversations
        if (!existingConvoFound) {
          conversationsCopy.push({
            otherUser: sender,
            ...dataToAddToConvo,
          });
        }
        return conversationsCopy;
      });
    },
    [setConversations]
  );

  const addMessageToConversation = useCallback(
    async (data) => {
      let { message } = data;
      // if this is the active convo, mark as read immediately
      if (activeConversation) {
        const fullActiveConvo = conversations.find(
          (convo) => convo.otherUser.username === activeConversation
        );
        if (
          fullActiveConvo &&
          data.message.senderId === fullActiveConvo.otherUser.id
        ) {
          [message] = await updateMessagesAsRead([message]);
        }
      }

      // map over conversations and modify this conversation
      setConversations((prev) =>
        prev.map((convo) => {
          if (convo.id === message.conversationId) {
            // add message to existing conversation
            const convoCopy = {
              ...convo,
              latestMessageText: message.text,
              messages: [...convo.messages, message],
            };
            return convoCopy;
          } else {
            return convo;
          }
        })
      );
    },
    [conversations, activeConversation, updateMessagesAsRead]
  );

  const addNewMessage = useCallback(
    (data, recipientId = null) => {
      const { sender } = data;
      console.log(data);
      // if sender, it's a new convo
      // if there's a recipient id, that means it was
      // passed here by the postMessage function
      // otherwise it came from a remote user
      if (sender) {
        recipientId
          ? addNewConvo(recipientId, data)
          : addNewConvo(sender.id, data);
      } else {
        addMessageToConversation(data);
      }
    },
    [addNewConvo, addMessageToConversation]
  );

  const setActiveChat = useCallback(
    async (username) => {
      const activeConvo = conversations.find(
        (convo) => convo.otherUser.username === username
      );
      if (activeConvo) {
        // when a conversation becomes active, modify the read attribute
        // for any unread messages
        const unreadMessages = activeConvo.messages.filter(
          (message) => !message.read && message.senderId !== user.id
        );
        if (unreadMessages.length) {
          const updatedMessages = await updateMessagesAsRead(unreadMessages);
          setConversations((prev) => {
            const convoCopy = { ...activeConvo, messages: updatedMessages };
            return prev.map((convo) => {
              if (convo === activeConvo) {
                return convoCopy;
              } else {
                return convo;
              }
            });
          });
        }
      }

      setActiveConversation(username);
    },
    [conversations, updateMessagesAsRead, user]
  );

  const addOnlineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: true };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  const removeOfflineUser = useCallback((id) => {
    setConversations((prev) =>
      prev.map((convo) => {
        if (convo.otherUser.id === id) {
          const convoCopy = { ...convo };
          convoCopy.otherUser = { ...convoCopy.otherUser, online: false };
          return convoCopy;
        } else {
          return convo;
        }
      })
    );
  }, []);

  // Lifecycle

  useEffect(() => {
    // Socket init
    socket.on('add-online-user', addOnlineUser);
    socket.on('remove-offline-user', removeOfflineUser);
    socket.on('new-message', addNewMessage);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('add-online-user', addOnlineUser);
      socket.off('remove-offline-user', removeOfflineUser);
      socket.off('new-message', addNewMessage);
    };
  }, [addNewMessage, addOnlineUser, removeOfflineUser, socket]);

  useEffect(() => {
    // when fetching, prevent redirect
    if (user?.isFetching) return;

    if (user && user.id) {
      setIsLoggedIn(true);
    } else {
      // If we were previously logged in, redirect to login instead of register
      if (isLoggedIn) history.push('/login');
      else history.push('/register');
    }
  }, [user, history, isLoggedIn]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get('/api/conversations');
        data.forEach((convo) => {
          convo.messages.sort((a, b) => {
            return new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1;
          });
          const userMessages = convo.messages.filter(
            (message) => message.senderId === user.id
          );
          const anyRead = userMessages.find((message) => message.read);
          if (anyRead) {
            const firstUnread = userMessages.findIndex(
              (message) => !message.read
            );
            if (firstUnread !== -1) {
              userMessages[firstUnread - 1].lastRead = true;
            } else {
              userMessages[userMessages.length - 1].lastRead = true;
            }
          }
        });
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    };
    if (!user.isFetching) {
      fetchConversations();
    }
  }, [user]);

  const handleLogout = async () => {
    if (user && user.id) {
      await logout(user.id);
    }
  };

  return (
    <>
      <Button onClick={handleLogout}>Logout</Button>
      <Grid container component="main" className={classes.root}>
        <CssBaseline />
        <SidebarContainer
          conversations={conversations}
          user={user}
          clearSearchedUsers={clearSearchedUsers}
          addSearchedUsers={addSearchedUsers}
          setActiveChat={setActiveChat}
        />
        <ActiveChat
          activeConversation={activeConversation}
          conversations={conversations}
          user={user}
          postMessage={postMessage}
        />
      </Grid>
    </>
  );
};

export default Home;
