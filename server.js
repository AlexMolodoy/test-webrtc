import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();

const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3001

io.on('connection', socket => {
    console.log('socket connected ')
})

server.listen(PORT, () => {
    console.log("SERVER STARTED")
})