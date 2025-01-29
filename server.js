const app = require('./src/app')
const { baseWebhookURL } = require('./src/config')
require('dotenv').config()

const SocketManager = require('./src/SocketManager')
const http = require('http');
const server = http.createServer(app);

const io = SocketManager.initialize(server);

// Start the server
const port = process.env.PORT || 3000
const { setupSession, sessions } = require('./src/sessions')
// Check if BASE_WEBHOOK_URL environment variable is available
if (!baseWebhookURL) {
  console.error('BASE_WEBHOOK_URL environment variable is not available. Exiting...')
  process.exit(1) // Terminate the application with an error code
}
const showDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
};
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on("start", (sessionId) => {
    setupSession(sessionId)
  })
  socket.on("chats", async (sessionId) => {
    const client = sessions.get(sessionId)
    if (client) {
      const chats = await client.getChats()
      const updatedChats = await Promise.all(
        chats.map(async (chat) => {
          const profilePicUrl = await client.getProfilePicUrl(chat.id._serialized).catch(() => null);
          return {
            id: chat.id._serialized,
            new: chat.unreadCount,
            name: chat.name || "Unknown User",
            message: chat.lastMessage?.body || "No messages yet.",
            date: showDate(chat.lastMessage?.timestamp),
            img: profilePicUrl || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
          };
        })
      );
      socket.emit("client", { sessionId, action: "list-chats", chat: updatedChats })
    }

  })
  socket.on("showchats", async ({ sessionId, chatId }) => {
    const client = sessions.get(sessionId);
    if (client) {
      const chat = await client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: 1000 });

      socket.emit("client", {
        sessionId,
        action: "get-chats",
        count: messages.length,
        chat: messages,
      });
    }
  });

  // Event untuk mendownload media berdasarkan ID pesan
  socket.on("getMedia", async ({ sessionId, remote, messageId }) => {
    
    const client = sessions.get(sessionId);
    if (client) {
      try {
        const chat = await client.getChatById(remote);
        const messages  = await chat.fetchMessages({ limit: 50 });
        const message = messages.find(msg => msg.id.id === messageId);
        if (message && message.hasMedia) {
          const media = await message.downloadMedia();
          if (media && media.data) {
            const mediaUrl = `data:${media.mimetype};base64,${media.data}`;
            socket.emit("show-media", { messageId, mediaUrl });
          } else {
            console.error("Media data is undefined or empty");
            socket.emit("show-media", { messageId, mediaUrl: null });
          }
        } else {
          socket.emit("show-media", { messageId, mediaUrl: null });
        }
      } catch (error) {
        console.error("Error downloading media:", error);
        socket.emit("show-media", { messageId, mediaUrl: null });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
