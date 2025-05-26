// src/server.ts
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app'; // app will now need io
import { configureSockets } from './sockets/socketManager';
import { PORT, DATABASE_URL } from './config';
import pool from './config/db';

const server = http.createServer(app);

// Initialize Socket.IO server
export const io = new SocketIOServer(server, { // <--- EXPORT io
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

configureSockets(io); // Configure basic socket connection events

// Pass io to app for middleware setup (app.ts will handle this)
app.set('socketio', io); // <--- Make io available to app via app.set / app.get

if (pool) {
    console.log('Database pool object is available in server.ts (though primarily used via db.ts import).');
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    const dbUrlLog = DATABASE_URL ? DATABASE_URL.replace(/:(.*)@/, ':********@') : 'DATABASE_URL not set';
    console.log(`Database URL (masked): ${dbUrlLog}`);
});
