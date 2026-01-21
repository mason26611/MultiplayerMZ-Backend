const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        allowRequest: (req, callback) => {
            callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const users = new Map();

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    const username = `Player_${socket.id.substring(0, 5)}`;
    users.set(socket.id, { username });

    socket.emit('current_players', Array.from(users.entries()).map(([id, user]) => ({ id, username: user.username, x: 1, y: 1 }))); // temp data
    socket.emit('connected', { id: socket.id, username });


    // Emit that the new player has connected to all other clients
    for (const [id, user] of users) {
        if (id !== socket.id) {
            io.to(id).emit('player_connected', { id: socket.id, username, x: 1, y: 1 }); // temp data
        }
    }

    socket.on('move_player', (data) => {
        const user = users.get(socket.id);
        if (!user) {
            console.log("Invalid movement");
            socket.emit('error', "Invalid movement: User not found")
        }

        if (!data || typeof data.x !== 'number' || typeof data.y !== 'number') {
            console.log("Invalid movement data");
            socket.emit('error', "Invalid movement data");
            return;
        }

        console.log(`User ${user.username} moved to (${data.x}, ${data.y})`);
        socket.emit('Moved', { x: data.x, y: data.y });
    })
});

io.on("disconnect", (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});