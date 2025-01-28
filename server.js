const app = require('./src/app')
const { baseWebhookURL } = require('./src/config')
require('dotenv').config()

const SocketManager = require('./src/SocketManager')
const http = require('http');
const server = http.createServer(app);

const io = SocketManager.initialize(server);

// Start the server
const port = process.env.PORT || 3000
const { setupSession} = require('./src/sessions')
// Check if BASE_WEBHOOK_URL environment variable is available
if (!baseWebhookURL) {
  console.error('BASE_WEBHOOK_URL environment variable is not available. Exiting...')
  process.exit(1) // Terminate the application with an error code
}
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on("start",(sessionId)=>{
    setupSession(sessionId)
  })
  socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
