class SocketManager {
    constructor() {
        this.io = null; // Instance Socket.IO
    }

    initialize(server) {
        if (!this.io) {
            const socketIo = require('socket.io');
            this.io = socketIo(server, {
                cors: {
                    origin: '*', // Sesuaikan dengan kebutuhan CORS
                },
            });
            console.log('Socket.IO initialized');
        }
        return this.io;
    }

    getInstance() {
        if (!this.io) {
            throw new Error('Socket.IO is not initialized. Call initialize() first.');
        }
        return this.io;
    }
}

module.exports = new SocketManager();
