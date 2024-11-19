import express from "express";
import http from "http";
import { Server } from "socket.io";
import { validate, version } from "uuid";
// import { ACTIONS } from "./src/socket/actions";

const ACTIONS = {
  JOIN: "join",
  LEAVE: "leave",
  SHARE_ROOMS: "share-rooms",
  ADD_PEER: "add-peer",
  REMOVE_PEER: "remove-peer",
  RELAY_SDP: "relay-sdp",
  RELAY_ICE: "relay-ice",
  ICE_CANDIDATE: "ice-candidate",
  SESSION_DESCRIPTION: "session-description",
};
const app = express();

const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3001;

function getClientRooms() {
  const { rooms } = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(
    (roomID) => validate(roomID) && version(roomID) === 4,
  );
}

function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: getClientRooms(),
  });
}

io.on("connection", (socket) => {
  shareRoomsInfo();
  socket.on(ACTIONS.JOIN, (config) => {
    const { room: roomID } = config;
    const { rooms: joinedRooms } = socket;

    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
    clients.forEach((clientID) => {
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false,
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });
    socket.join(roomID);
    shareRoomsInfo();
  });

  function leaveRoom() {
    const { rooms } = socket;

    Array.from(rooms).forEach((roomID) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

      clients.forEach((clientID) => {
        io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
          peerID: socket.id,
        });

        socket.emit(ACTIONS.REMOVE_PEER, {
          peerID: clientID,
        });
      });
      socket.leave(roomID);
    });

    shareRoomsInfo();
  }

  socket.on(ACTIONS.LEAVE_ROOM, leaveRoom);
  socket.on("disconnecting", leaveRoom);
  console.log("socket connected ");
});

server.listen(PORT, () => {
  console.log("SERVER STARTED");
});
