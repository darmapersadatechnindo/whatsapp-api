const SocketManager = require('./SocketManager');

const EmitToClient = ( sessionId,action,message) => {
    try {
        const io = SocketManager.getInstance();
        io.emit('client', { sessionId,action,message });
        io.emit('chats', sessionId);
    } catch (error) {
        console.error('Error emitting event:', error.message);
    }
};

module.exports = EmitToClient;
