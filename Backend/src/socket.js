const { Server } = require('socket.io');
const Messenger = require('./models/messengerModel');

let ioInstance;

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    'http://localhost:5174',
                    process.env.FRONTEND_URL,
                ].filter(Boolean).map(url => url.trim().replace(/\/$/, ""));

                if (!origin) return callback(null, true);
                
                const cleanedOrigin = origin.trim().replace(/\/$/, "");
                const isAllowed = allowedOrigins.includes(cleanedOrigin);

                if (isAllowed || process.env.NODE_ENV === 'development') {
                    callback(null, true);
                } else {
                    console.error(`Socket CORS Error: Origin ${origin} is not allowed.`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    ioInstance = io;

    // Map to track online users: { userId_type: socketId }
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('setup', async (userData) => {
            console.log('Socket Setup with Data:', userData);
            if (userData && userData.id) {
                const userKey = `${userData.id}_${userData.type}`;
                socket.join(userKey);
                onlineUsers.set(userKey, socket.id);
                console.log(`User joined notification room: ${userKey}`);

                // If it's an admin (type 'user'), join the admin room for campaign updates
                if (userData.type === 'user') {
                    const adminRoom = `user_${userData.id}_admin`;
                    socket.join(adminRoom);
                    console.log('Admin joined campaign room:', adminRoom);
                }

                // Mark all messages for this user as delivered
                await Messenger.markAllAsDeliveredForUser(userData.id, userData.type);
                
                socket.emit('connected');
            }
        });

        socket.on('join_chat', (room) => {
            socket.join(room);
            console.log('User joined chat room:', room);
        });

        socket.on('typing', (room) => socket.in(room).emit('typing', room));
        socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing', room));

        socket.on('new_message', async (newMessage) => {
            if (!newMessage) return;

            const chat = newMessage.conversationId || newMessage.conversation_id;
            const participants = newMessage.participants;

            if (!participants || !chat) {
                return console.error('Invalid message: missing participants or conversation ID', newMessage);
            }

            const senderId = newMessage.sender?.id || newMessage.sender_id;
            const senderType = newMessage.sender?.type || newMessage.sender_type;

            if (!senderId || !senderType) {
                return console.error('Invalid message: missing sender info', newMessage);
            }

            // Persist message if not already saved via REST
            if (!newMessage.id) {
                try {
                    const messageId = await Messenger.saveMessage({
                        conversation_id: chat,
                        sender_id: senderId,
                        sender_type: senderType,
                        text: newMessage.text,
                        message_type: newMessage.messageType || 'text',
                        attachments: newMessage.attachments ? JSON.stringify(newMessage.attachments) : null,
                        reply_to_id: newMessage.replyToId
                    });
                    newMessage.id = messageId;
                } catch (saveError) {
                    return console.error('Error saving socket message:', saveError);
                }
            }

            // Broadcast to other participants
            participants.forEach(p => {
                if (Number(p.id) === Number(senderId) && p.type === senderType) return;

                const userKey = `${p.id}_${p.type}`;
                const isOnline = onlineUsers.has(userKey);

                if (isOnline) {
                    Messenger.markAsDelivered(newMessage.id);
                    newMessage.is_delivered = true;
                }

                socket.in(userKey).emit('message_received', newMessage);
                socket.in(chat).emit('message_received', newMessage);

                // Notify sender if delivered
                if (isOnline) {
                    const senderKey = `${senderId}_${senderType}`;
                    socket.in(senderKey).emit('message_delivered', {
                        messageId: newMessage.id,
                        conversationId: chat
                    });
                }
            });
        });

        socket.on('mark_as_read', async (data) => {
            const { conversationId, userId, userType, otherId, otherType } = data;
            await Messenger.markAsRead(conversationId, userId, userType);

            // Notify the sender that their messages were read
            const otherKey = `${otherId}_${otherType}`;
            socket.in(otherKey).emit('messages_read', {
                conversationId,
                readBy: userId,
                readByType: userType
            });

            // Also notify other devices of the reader (sync)
            const myKey = `${userId}_${userType}`;
            socket.in(myKey).emit('messages_read', {
                conversationId,
                readBy: userId,
                readByType: userType
            });
        });

        socket.on('reaction', async (data) => {
            const { messageId, emoji, conversationId, userId, userType } = data;
            try {
                if (userId && userType) {
                    await Messenger.addReaction(messageId, userId, userType, emoji);
                }
                // Broadcast to everyone in the chat room
                io.to(conversationId).emit('reaction_received', { messageId, emoji, conversationId });
            } catch (err) {
                console.error('Error handling reaction:', err);
            }
        });

        socket.on('delete_message', (data) => {
            const { messageId, conversationId } = data;
            io.to(conversationId).emit('message_deleted', { messageId, conversationId });
        });

        socket.on('message_edited', (data) => {
            const { messageId, text, conversationId } = data;
            io.to(conversationId).emit('message_edited', { messageId, text, conversationId });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Cleanup onlineUsers map (requires iterating or a reverse map)
            for (const [key, value] of onlineUsers.entries()) {
                if (value === socket.id) {
                    onlineUsers.delete(key);
                    break;
                }
            }
        });
    });

    return io;
};

const getIO = () => ioInstance;

module.exports = { initializeSocket, getIO };
