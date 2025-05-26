// src/sockets/socketManager.ts
import { Server as SocketIOServer, Socket } from 'socket.io';

export const configureSockets = (io: SocketIOServer) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected via Socket.IO: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`User disconnected via Socket.IO: ${socket.id}`);
            // Here you might want to remove the socket from any rooms it was in,
            // though Socket.IO handles this automatically for 'disconnect'.
        });

        socket.on('client_message_event', (data) => {
            console.log(`Message from client ${socket.id}:`, data);
            socket.emit('server_message_event', { text: 'Message received by server!', originalData: data });
        });

        // Handle client joining a game room
        socket.on('join_game_room', (gameId: string | number) => {
            const roomName = `game-${gameId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room: ${roomName}`);
            // You can emit a confirmation back to the client if needed
            socket.emit('joined_room_ack', { room: roomName, message: `Successfully joined game ${gameId}` });
            
            // Optionally, send current game state to the user who just joined
            // This would require fetching game state, e.g., from GameService
            // Example:
            // const gameService = new GameService(); // Or get instance differently
            // gameService.getGameById(Number(gameId)).then(game => {
            //     if (game) {
            //         socket.emit('current_game_state', game);
            //     }
            // });
        });

        // Handle client leaving a game room
        socket.on('leave_game_room', (gameId: string | number) => {
            const roomName = `game-${gameId}`;
            socket.leave(roomName);
            console.log(`Socket ${socket.id} left room: ${roomName}`);
            socket.emit('left_room_ack', { room: roomName, message: `Successfully left game ${gameId}` });
        });

    });
};
