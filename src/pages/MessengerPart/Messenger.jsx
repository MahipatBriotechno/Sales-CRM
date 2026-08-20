import React, { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, Search, Users, User, X } from "lucide-react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  ChatHeader,
  ChatMessages,
  ChatInput,
  ChatInfoSidebar,
  ContactsList,
  EmptyState,
  ForwardModal,
} from "../../pages/MessengerPart/MessengerComponents";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOCKET_URL = API_BASE_URL;

export default function MessengerPage() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserType, setCurrentUserType] = useState('employee');

  // State Management
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);

  const [teamMembers, setTeamMembers] = useState([]);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' or 'team'
  const [chatMessages, setChatMessages] = useState({}); // { conversationId: [messages] }
  const [currentConversationId, setCurrentConversationId] = useState(null);

  const [typingIndicator, setTypingIndicator] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState({});
  const [notifications, setNotifications] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [starredMessages, setStarredMessages] = useState(new Set());
  const [forwardingMessage, setForwardingMessage] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachmentMenuRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const selectedChatRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Sync editor with message state for clearing/resetting
  useEffect(() => {
    if (textareaRef.current) {
      if (message === "" && textareaRef.current.innerText !== "") {
        textareaRef.current.innerText = "";
      } else if (editingMessage && message === editingMessage.text && textareaRef.current.innerText === "") {
        textareaRef.current.innerText = message;
      }
    }
  }, [message, editingMessage]);

  // Handle click outside to close menus robustly
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close message menu if click is outside the menu container
      if (showMessageMenu && !event.target.closest('.message-menu-container')) {
        setShowMessageMenu(null);
      }
      // Close reaction picker if click is outside the picker container
      if (showReactionPicker && !event.target.closest('.reaction-picker-container')) {
        setShowReactionPicker(null);
      }
      // Close emoji picker if click is outside
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMessageMenu, showReactionPicker, showEmojiPicker]);

  // Data fetching and Socket setup
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}messenger/contacts`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setTeamMembers(data.team);
          setClients(data.clients);
          setGroups(data.groups || []);
          console.log('Loaded contacts:', { team: data.team.length, clients: data.clients.length, groups: data.groups?.length });
        } else {
          console.error('Failed to fetch contacts:', data);
          toast.error(data.message || "Failed to load contacts");
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
      }
    };

    fetchContacts();

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, [currentUser]);

  useEffect(() => {
    if (socket && currentUser) {
      // Fetch current employee ID
      fetch(`${API_BASE_URL}users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log('Profile API response:', data);

          if (data.id) {
            const userId = data.id;
            const type = currentUser.role === 'Admin' ? 'user' : 'employee';
            setCurrentUserId(userId);
            setCurrentUserType(type);
            socket.emit("setup", { id: userId, type: type });
            console.log('Socket setup with ID:', userId, 'type:', type);
          } else {
            console.error('No ID in profile response:', data);
            toast.error('Failed to load user profile');
          }
        })
        .catch(err => {
          console.error("Error fetching user profile:", err);
          toast.error('Failed to load profile. Please refresh.');
        });

      socket.on("connected", () => {
        setSocketConnected(true);
        console.log('Socket connected successfully');
      });

      socket.on("message_received", (newMessage) => {
        console.log('Real-time message received:', newMessage);
        const convId = newMessage.conversationId || newMessage.conversation_id;
        const senderId = newMessage.sender_id || newMessage.sender?.id;
        const senderType = newMessage.sender_type || newMessage.sender?.type;

        setChatMessages((prev) => {
          const messages = prev[convId] || [];
          // Deduplicate: Don't add if message ID already exists (prevents sender double-messages)
          if (messages.find(m => m.id === newMessage.id)) return prev;

          return {
            ...prev,
            [convId]: [...messages, newMessage],
          };
        });

        // Update unread count and last message in contact lists
        const updateList = (list) => {
          const isFromCurrentChat = selectedChatRef.current &&
            (
              (selectedChatRef.current.type !== 'team' && Number(selectedChatRef.current.id) === Number(senderId) && selectedChatRef.current.type === senderType) ||
              (selectedChatRef.current.type === 'team' && (
                (newMessage.team_id && Number(selectedChatRef.current.id) === Number(newMessage.team_id)) ||
                (selectedChatRef.current.conversationId && Number(selectedChatRef.current.conversationId) === Number(convId))
              ))
            );

          return list.map(item => {
            const isMatch = (item.type === 'team' && (
              (newMessage.team_id && Number(item.id) === Number(newMessage.team_id)) ||
              (item.conversationId && Number(item.conversationId) === Number(convId))
            )) ||
              (item.type !== 'team' && Number(item.id) === Number(senderId) && item.type === senderType) ||
              (item.conversationId && convId && Number(item.conversationId) === Number(convId));

            if (isMatch) {
              return {
                ...item,
                unread: isFromCurrentChat ? 0 : (item.unread || 0) + 1,
                lastMessage: newMessage.text,
                time: 'Just now',
                lastMessageTime: new Date().toISOString()
              };
            }
            return item;
          }).sort((a, b) => {
            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
            return timeB - timeA;
          });
        };

        setTeamMembers(prev => updateList(prev));
        setClients(prev => updateList(prev));
        setGroups(prev => updateList(prev));

        // Improved notification logic
        const isFromSelected = selectedChatRef.current && (
          (selectedChatRef.current.type === 'team' && (Number(selectedChatRef.current.id) === Number(newMessage.team_id) || Number(selectedChatRef.current.conversationId) === Number(convId))) ||
          (selectedChatRef.current.type !== 'team' && Number(selectedChatRef.current.id) === Number(senderId) && selectedChatRef.current.type === senderType)
        );

        if (!isFromSelected && Number(senderId) !== Number(currentUserId)) {
          const fromName = newMessage.sender_name || 'Someone';
          const teamName = newMessage.team_id ? (groups.find(g => Number(g.id) === Number(newMessage.team_id))?.name || 'Team') : null;

          if (teamName) {
            toast.success(`New message in ${teamName} from ${fromName}`);
          } else {
            toast.success(`New message from ${fromName}`);
          }
        }
      });

      socket.on("typing", (room) => setTypingIndicator(room));
      socket.on("stop_typing", () => setTypingIndicator(null));

      socket.on("reaction_received", ({ messageId, emoji, conversationId }) => {
        setChatMessages((prev) => {
          const messages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: messages.map((msg) =>
              msg.id === messageId
                ? {
                  ...msg,
                  reactions: {
                    ...msg.reactions,
                    [emoji]: (msg.reactions?.[emoji] || 0) + 1,
                  },
                }
                : msg
            ),
          };
        });
      });

      socket.on("message_delivered", ({ messageId, conversationId }) => {
        setChatMessages(prev => {
          const msgs = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: msgs.map(m => m.id === messageId ? { ...m, is_delivered: true } : m)
          };
        });
      });

      socket.on("messages_read", ({ conversationId, readBy, readByType }) => {
        setChatMessages(prev => {
          const msgs = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: msgs.map(m => (Number(m.sender_id) !== Number(readBy) || m.sender_type !== readByType) ? { ...m, is_read: true, is_delivered: true } : m)
          };
        });
      });

      socket.on("message_deleted", ({ messageId, conversationId }) => {
        setChatMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter((msg) => msg.id !== messageId),
        }));
      });

      socket.on("message_edited", ({ messageId, text, conversationId }) => {
        setChatMessages((prev) => {
          const messages = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: messages.map((msg) =>
              msg.id === messageId ? { ...msg, text, is_edited: true } : msg
            ),
          };
        });
      });
    }
  }, [socket, currentUser]);

  // Join group rooms once connected and groups are loaded
  useEffect(() => {
    if (socket && socketConnected && groups.length > 0) {
      groups.forEach(group => {
        if (group.conversationId) {
          socket.emit("join_chat", group.conversationId);
          console.log('Auto-joined team room:', group.conversation_id);
        }
      });
    }
  }, [socket, socketConnected, groups]);

  // Fetch history when chat is selected
  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedChat) {
        try {
          const response = await fetch(
            `${API_BASE_URL}messenger/history/${selectedChat.id}/${selectedChat.type}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await response.json();
          if (data.success) {
            setCurrentConversationId(data.conversationId);
            setChatMessages((prev) => ({
              ...prev,
              [data.conversationId]: data.messages,
            }));

            // Enrich selectedChat with members if they exist (for teams)
            if (data.members) {
              console.log('Received team members:', data.members.length);
              setSelectedChat(prev => ({ ...prev, members: data.members }));
            }

            // Sync starred messages state
            const starredIds = new Set();
            data.messages.forEach(m => {
              if (m.is_starred) starredIds.add(m.id);
            });
            setStarredMessages(starredIds);

            // Sync pinned message state
            const pinnedMsg = data.messages.find(m => m.is_pinned);
            setPinnedMessages(prev => ({
              ...prev,
              [selectedChat.id]: pinnedMsg ? pinnedMsg.id : null
            }));

            if (socket) {
              socket.emit("join_chat", data.conversationId);
            }
            console.log('Loaded conversation:', data.conversationId, 'with', data.messages.length, 'messages');
          }
        } catch (error) {
          console.error("Error fetching history:", error);
          toast.error("Failed to load chat history");
        }
      }
    };

    fetchHistory();
  }, [selectedChat?.id, selectedChat?.type, socket]);

  // Mark as read when messages change or chat is selected
  useEffect(() => {
    if (socket && socketConnected && selectedChat && currentConversationId) {
      const messages = chatMessages[currentConversationId] || [];
      const hasUnread = messages.some(m => !m.is_read && (Number(m.sender_id) === Number(selectedChat.id) && m.sender_type === selectedChat.type));

      if (hasUnread) {
        socket.emit("mark_as_read", {
          conversationId: currentConversationId,
          userId: currentUserId,
          userType: currentUserType,
          otherId: selectedChat.id,
          otherType: selectedChat.type
        });
      }
    }
  }, [chatMessages, selectedChat, currentConversationId, socket, socketConnected]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, selectedChat]);


  // Handlers
  const handleSend = async () => {
    console.log('handleSend called', {
      message: message.trim(),
      selectedChat,
      currentConversationId,
      currentUserId,
      currentUserType,
      socketConnected
    });

    if (!message.trim() && attachedFiles.length === 0) {
      console.log('No message or files to send');
      return;
    }

    if (!selectedChat) {
      toast.error('Please select a chat first');
      return;
    }

    if (!currentUserId) {
      toast.error('User information not loaded. Please refresh the page.');
      return;
    }

    try {
      if (editingMessage) {
        // Edit logic
        const response = await fetch(`${API_BASE_URL}messenger/edit/${editingMessage.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ text: message.trim() })
        });

        const data = await response.json();
        if (data.success) {
          // Update local state
          setChatMessages(prev => {
            const msgs = prev[currentConversationId] || [];
            return {
              ...prev,
              [currentConversationId]: msgs.map(m => m.id === editingMessage.id ? { ...m, text: message.trim(), is_edited: true, edited: true } : m)
            };
          });

          // Emit via socket
          if (socket && socketConnected) {
            socket.emit("message_edited", {
              messageId: editingMessage.id,
              text: message.trim(),
              conversationId: currentConversationId
            });
          }

          toast.success("Message updated");
          setEditingMessage(null);
          setMessage("");
          if (textareaRef.current) textareaRef.current.innerText = "";
        } else {
          toast.error(data.message || "Failed to update message");
        }
      } else {
        // 1. Prepare temp message for optimistic UI
        const tempId = Date.now();
        const curMsgs = [];

        let attachments = null;
        if (attachedFiles.length > 0) {
          attachments = attachedFiles.map((file, idx) => ({
            id: tempId + idx + 1,
            file_url: file.url,
            file_name: file.name,
            file_size: file.size,
            message_type: file.type?.startsWith('image/') ? 'image' :
              file.type?.startsWith('video/') ? 'video' : 'document'
          }));
        }

        const tempMessage = {
          id: tempId,
          conversation_id: currentConversationId || 'temp',
          sender_id: currentUserId,
          sender_type: currentUserType,
          sender_name: currentUser.role === 'Admin' ? `${currentUser.firstName} ${currentUser.lastName}` : (currentUser.employee_name || currentUser.name),
          text: message.trim() || null,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          participants: [
            { id: currentUserId, type: currentUserType },
            { id: selectedChat.id, type: selectedChat.type }
          ],
          message_type: attachments ? attachments[0].message_type : 'text',
          file_url: attachments ? attachments[0].file_url : null,
          file_name: attachments ? attachments[0].file_name : null,
          file_size: attachments ? attachments[0].file_size : null,
          attachments: attachments,
          reply_to_id: replyingTo ? replyingTo.id : null,
          replyTo: replyingTo ? { text: replyingTo.text, sender_name: replyingTo.sender_name } : null,
          isTemp: true
        };

        curMsgs.push(tempMessage);

        // Close UI elements
        setShowEmojiPicker(false);
        setEditingMessage(null);
        setReplyingTo(null);

        // Update local state immediately
        setChatMessages(prev => ({
          ...prev,
          [currentConversationId || 'temp']: [...(prev[currentConversationId || 'temp'] || []), ...curMsgs]
        }));

        const originalFiles = [...attachedFiles];
        const originalMessage = message;
        setMessage("");
        if (textareaRef.current) textareaRef.current.innerText = "";
        setAttachedFiles([]);

        // 2. Save via REST API
        try {
          const formData = new FormData();
          if (currentConversationId && currentConversationId !== 'temp') {
            formData.append('conversationId', currentConversationId);
          } else {
            formData.append('otherId', selectedChat.id);
            formData.append('otherType', selectedChat.type);
          }
          formData.append('text', originalMessage.trim());
          if (replyingTo) {
            formData.append('replyToId', replyingTo.id);
          }

          if (originalFiles.length > 0) {
            originalFiles.forEach(file => formData.append('file', file.file));
          }

          const response = await fetch(`${API_BASE_URL}messenger/send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          const data = await response.json();

          if (data.success && data.messages) {
            const savedMsgs = data.messages;
            const targetConvId = savedMsgs[0].conversation_id;

            // Update conversation ID if it was a first message
            if (!currentConversationId || currentConversationId === 'temp') {
              setCurrentConversationId(targetConvId);
            }

            // Replace temp messages with real ones
            setChatMessages(prev => {
              const currentList = prev[targetConvId] || prev['temp'] || [];
              const tempIds = curMsgs.map(m => m.id);

              // Filter out temp messages and add real ones
              const filteredList = currentList.filter(m => !tempIds.includes(m.id));
              const newList = [...filteredList, ...savedMsgs];

              const newState = { ...prev };
              if (prev['temp']) delete newState['temp'];
              newState[targetConvId] = newList;
              return newState;
            });

            // 3. Emit via socket
            if (socket && socketConnected) {
              savedMsgs.forEach(savedMsg => {
                socket.emit("new_message", {
                  ...savedMsg,
                  conversationId: savedMsg.conversation_id,
                  participants: [
                    { id: currentUserId, type: currentUserType },
                    { id: selectedChat.id, type: selectedChat.type }
                  ]
                });
              });
            }
          } else if (data.success && data.message) {
            // Support for single message return
            const savedMsg = data.message;
            if (!currentConversationId || currentConversationId === 'temp') {
              setCurrentConversationId(savedMsg.conversation_id);
            }
            setChatMessages(prev => {
              const convId = savedMsg.conversation_id;
              const currentMsgs = prev[convId] || prev['temp'] || [];
              const updatedMsgs = currentMsgs.map(m => m.id === curMsgs[0].id ? savedMsg : m);
              const newState = { ...prev };
              if (prev['temp']) delete newState['temp'];
              newState[convId] = updatedMsgs;
              return newState;
            });
            if (socket && socketConnected) {
              socket.emit("new_message", {
                ...savedMsg,
                conversationId: savedMsg.conversation_id,
                participants: [
                  { id: currentUserId, type: currentUserType },
                  { id: selectedChat.id, type: selectedChat.type }
                ]
              });
            }
          } else {
            toast.error(data.message || 'Failed to send message');
            // Remove temp messages on failure
            setChatMessages(prev => ({
              ...prev,
              [currentConversationId || 'temp']: (prev[currentConversationId || 'temp'] || []).filter(m => !curMsgs.some(tm => tm.id === m.id))
            }));
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          toast.error('Failed to save message');
          setChatMessages(prev => ({
            ...prev,
            [currentConversationId || 'temp']: (prev[currentConversationId || 'temp'] || []).filter(m => !curMsgs.some(tm => tm.id === m.id))
          }));
        }
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      toast.error('Failed to send message');
    } finally {
      setReplyingTo(null);
    }
  };
  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target)
      ) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleChatSelect = (contact) => {
    setSelectedChat(contact);
    // Reset unread for this contact
    const resetUnread = (list) => list.map(item => (Number(item.id) === Number(contact.id) && item.type === contact.type) ? { ...item, unread: 0 } : item);
    setTeamMembers(prev => resetUnread(prev));
    setClients(prev => resetUnread(prev));
    setGroups(prev => resetUnread(prev));

    setShowChatInfo(false);
    setChatSearchQuery("");
    setReplyingTo(null);
    setEditingMessage(null);
    setMessage("");
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileData = files.map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
      url: URL.createObjectURL(file),
      file: file
    }));
    setAttachedFiles((prev) => [...prev, ...fileData]);
    e.target.value = null;
    setShowAttachmentMenu(false);
  };

  const handleVoiceMessage = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      // Voice message sending logic would go here
    }
  };

  const handleReaction = (messageId, emoji) => {
    if (socket && currentConversationId) {
      socket.emit("reaction", {
        messageId,
        emoji,
        conversationId: currentConversationId,
        userId: currentUserId,
        userType: currentUserType
      });
    }

    setChatMessages((prev) => {
      const messages = prev[currentConversationId] || [];
      return {
        ...prev,
        [currentConversationId]: messages.map((msg) =>
          msg.id === messageId
            ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [emoji]: (msg.reactions?.[emoji] || 0) + 1,
              },
            }
            : msg
        ),
      };
    });
    setShowReactionPicker(null);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}messenger/delete/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages((prev) => ({
          ...prev,
          [currentConversationId]: (prev[currentConversationId] || []).filter(
            (msg) => msg.id !== messageId
          ),
        }));
        if (socket && socketConnected) {
          socket.emit("delete_message", { messageId, conversationId: currentConversationId });
        }
        toast.success("Message deleted");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
    setShowMessageMenu(null);
  };

  const handlePinMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}messenger/pin/${messageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ conversationId: currentConversationId })
      });
      const data = await response.json();
      if (data.success) {
        setPinnedMessages((prev) => ({
          ...prev,
          [selectedChat.id]: data.isPinned ? messageId : null,
        }));
        toast.success(data.isPinned ? "Message pinned" : "Message unpinned");
      }
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error("Failed to pin message");
    }
    setShowMessageMenu(null);
  };

  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setReplyingTo(null);
    setMessage(msg.text);
    if (textareaRef.current) {
      textareaRef.current.innerText = msg.text;
      textareaRef.current.focus();
    }
    setShowMessageMenu(null);
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    setShowMessageMenu(null);
    setEditingMessage(null);
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setShowMessageMenu(null);
    toast.success("Message copied to clipboard");
  };

  const handleStarMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}messenger/star/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStarredMessages((prev) => {
          const newSet = new Set(prev);
          if (data.isStarred) {
            newSet.add(messageId);
          } else {
            newSet.delete(messageId);
          }
          return newSet;
        });
        toast.success(data.isStarred ? "Message starred" : "Message unstarred");
      }
    } catch (error) {
      console.error("Error starring message:", error);
      toast.error("Failed to star message");
    }
    setShowMessageMenu(null);
  };

  const handleForwardMessage = (msg) => {
    setForwardingMessage(msg);
    setShowMessageMenu(null);
  };

  const handleConfirmForward = async (contacts) => {
    if (!forwardingMessage) return;

    try {
      for (const contact of contacts) {
        const payload = {
          otherId: contact.id,
          otherType: contact.type,
          text: forwardingMessage.text,
          messageType: forwardingMessage.message_type || 'text',
          file_url: forwardingMessage.file_url,
          file_name: forwardingMessage.file_name,
          file_size: forwardingMessage.file_size,
          is_forwarded: true
        };

        const response = await fetch(`${API_BASE_URL}messenger/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success && socket && socketConnected) {
          socket.emit("new_message", {
            ...data.message,
            conversationId: data.message.conversation_id,
            participants: [
              { id: currentUserId, type: currentUserType },
              { id: contact.id, type: contact.type }
            ]
          });
        }
      }
      toast.success(`Message forwarded to ${contacts.length} contact(s)`);
      setForwardingMessage(null);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("Failed to forward message");
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessage("");
  };

  const currentTabContacts = activeTab === 'employee' ? teamMembers : groups;

  const filteredContacts = currentTabContacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const messages = currentConversationId ? chatMessages[currentConversationId] || [] : [];
  const filteredMessages = chatSearchQuery
    ? messages.filter((msg) =>
      msg.text?.toLowerCase().includes(chatSearchQuery.toLowerCase())
    )
    : messages;

  const employeeUnread = teamMembers.reduce((acc, curr) => acc + (curr.unread || 0), 0);
  const teamUnread = groups.reduce((acc, curr) => acc + (curr.unread || 0), 0);

  return (
    <>
      <div className="flex-1 min-h-0 m-5 bg-white overflow-hidden border-2 border-[#FF7B1D]/20 rounded-xl flex flex-col font-primary shadow-[0_32px_64px_-16px_rgba(255,123,29,0.08)]">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-[380px] bg-gray-50/10 flex flex-col min-h-0 border-r-2 border-orange-50/80">
            {/* Header */}
            <div className="px-6 pt-8 pb-4 bg-white shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF7B1D] to-[#E66A0D] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF7B1D]/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <MessageCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-black tracking-tight leading-none">Chats</h1>
                    <p className="text-[10px] font-medium text-[#FF7B1D] uppercase tracking-widest mt-1 opacity-80">Messenger Pro</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#FF7B1D] hover:bg-[#FF7B1D] hover:text-white transition-all cursor-pointer group shadow-sm border border-orange-100/50">
                  <Users size={18} className="transition-transform group-hover:scale-110" />
                </div>
              </div>

              {/* Search */}
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF7B1D] transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-xs bg-white border-2 border-orange-50 rounded-xl focus:outline-none focus:border-[#FF7B1D] focus:ring-4 focus:ring-[#FF7B1D]/10 transition-all placeholder:text-gray-400 font-semibold text-black"
                />
              </div>
            </div>

            <div className="w-full h-px bg-orange-50/50" />

            {/* Navigation Tabs */}
            <div className="px-6 pb-4 bg-white shrink-0">
              <div className="flex bg-gray-50 p-1 rounded-lg gap-1 shadow-inner relative overflow-hidden">
                <div
                  className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-md shadow-sm transition-all duration-300 ease-out z-0`}
                  style={{ transform: activeTab === 'team' ? 'translateX(100%)' : 'translateX(0)' }}
                ></div>

                <button
                  onClick={() => setActiveTab('employee')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all duration-300 relative z-10 ${activeTab === 'employee' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {employeeUnread > 0 && activeTab !== 'employee' && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#FF7B1D] rounded-full border border-white shadow-sm" />
                  )}
                  <User size={14} className={activeTab === 'employee' ? 'text-[#FF7B1D]' : ''} />
                  Employees
                </button>

                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-all duration-300 relative z-10 ${activeTab === 'team' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  {teamUnread > 0 && activeTab !== 'team' && (
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#FF7B1D] rounded-full border border-white shadow-sm" />
                  )}
                  <Users size={14} className={activeTab === 'team' ? 'text-[#FF7B1D]' : ''} />
                  Teams
                </button>
              </div>
            </div>

            {/* Contacts List — flex-1 + min-h-0 so it scrolls within sidebar */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ContactsList
                contacts={filteredContacts}
                selectedChat={selectedChat}
                onChatSelect={handleChatSelect}
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white min-h-0">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex-shrink-0">
                  <ChatHeader
                    selectedChat={selectedChat}
                    showChatInfo={showChatInfo}
                    onToggleChatInfo={() => setShowChatInfo(!showChatInfo)}
                    notifications={notifications}
                    setNotifications={setNotifications}
                    chatSearchQuery={chatSearchQuery}
                    setChatSearchQuery={setChatSearchQuery}
                    pinnedMessage={
                      pinnedMessages[selectedChat.id]
                        ? messages.find(
                          (m) => m.id === pinnedMessages[selectedChat.id]
                        )
                        : null
                    }
                  />
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <ChatMessages
                      messages={filteredMessages}
                      typingIndicator={typingIndicator}
                      selectedChatId={selectedChat.id}
                      selectedChatType={selectedChat.type}
                      currentUserId={currentUserId}
                      currentUserType={currentUserType}
                      messagesEndRef={messagesEndRef}
                      showMessageMenu={showMessageMenu}
                      setShowMessageMenu={setShowMessageMenu}
                      showReactionPicker={showReactionPicker}
                      setShowReactionPicker={setShowReactionPicker}
                      onReaction={handleReaction}
                      onReply={handleReply}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                      onCopy={handleCopyMessage}
                      onStar={handleStarMessage}
                      onPin={handlePinMessage}
                      onForward={handleForwardMessage}
                      starredMessages={starredMessages}
                    />
                  </div>

                  {showChatInfo && (
                    <div className="flex-shrink-0 overflow-y-auto custom-scrollbar">
                      <ChatInfoSidebar
                        selectedChat={selectedChat}
                        messages={messages}
                        starredMessages={starredMessages}
                      />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex-shrink-0">
                  <ChatInput
                    message={message}
                    setMessage={setMessage}
                    attachedFiles={attachedFiles}
                    setAttachedFiles={setAttachedFiles}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    showAttachmentMenu={showAttachmentMenu}
                    setShowAttachmentMenu={setShowAttachmentMenu}
                    onSend={handleSend}
                    onFileSelect={handleFileSelect}
                    fileInputRef={fileInputRef}
                    emojiPickerRef={emojiPickerRef}
                    textareaRef={textareaRef}
                    attachmentMenuRef={attachmentMenuRef}
                    isRecording={isRecording}
                    recordingDuration={recordingDuration}
                    handleVoiceMessage={handleVoiceMessage}
                    cancelRecording={cancelRecording}
                    replyingTo={replyingTo}
                    cancelReply={cancelReply}
                    editingMessage={editingMessage}
                    cancelEdit={cancelEdit}
                  />
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {forwardingMessage && (
        <ForwardModal
          contacts={{ team: teamMembers, clients: clients }}
          onClose={() => setForwardingMessage(null)}
          onForward={handleConfirmForward}
        />
      )}

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #FF7B1D transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #FF7B1D;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #E66A0D;
        }
      `}</style>
    </>
  );
}
