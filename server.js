const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory game state
const rooms = new Map();

// Generate a random 6-character room code
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
function createRoom(hostSocketId) {
  let code = generateRoomCode();
  // Ensure unique code
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room = {
    code,
    players: [{ id: hostSocketId, ready: false }],
    status: "waiting", // waiting, playing, finished
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

// Join an existing room
function joinRoom(code, playerSocketId) {
  const room = rooms.get(code);
  if (!room) {
    return { error: "Room not found" };
  }
  if (room.players.length >= 2) {
    return { error: "Room is full" };
  }
  if (room.players.some((p) => p.id === playerSocketId)) {
    return { error: "Already in room" };
  }

  room.players.push({ id: playerSocketId, ready: false });
  return { room };
}

// Remove player from room
function leaveRoom(socketId) {
  for (const [code, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex((p) => p.id === socketId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      if (room.players.length === 0) {
        rooms.delete(code);
        return { code, deleted: true };
      }
      return { code, room, deleted: false };
    }
  }
  return null;
}

// Get room by player socket id
function getRoomByPlayer(socketId) {
  for (const [code, room] of rooms.entries()) {
    if (room.players.some((p) => p.id === socketId)) {
      return { code, room };
    }
  }
  return null;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a new room
    socket.on("create-room", (callback) => {
      const room = createRoom(socket.id);
      socket.join(room.code);
      console.log(`Room created: ${room.code} by ${socket.id}`);
      callback({ success: true, room });
    });

    // Join an existing room
    socket.on("join-room", (code, callback) => {
      const result = joinRoom(code.toUpperCase(), socket.id);
      if (result.error) {
        callback({ success: false, error: result.error });
        return;
      }

      socket.join(code.toUpperCase());
      console.log(`Player ${socket.id} joined room: ${code}`);

      // Notify other players in the room
      socket.to(code.toUpperCase()).emit("player-joined", {
        playerId: socket.id,
        room: result.room,
      });

      callback({ success: true, room: result.room });
    });

    // Get room info
    socket.on("get-room", (code, callback) => {
      const room = rooms.get(code.toUpperCase());
      if (!room) {
        callback({ success: false, error: "Room not found" });
        return;
      }
      callback({ success: true, room });
    });

    // Leave room
    socket.on("leave-room", (callback) => {
      const result = leaveRoom(socket.id);
      if (result) {
        socket.leave(result.code);
        if (!result.deleted) {
          socket.to(result.code).emit("player-left", {
            playerId: socket.id,
            room: result.room,
          });
        }
        console.log(`Player ${socket.id} left room: ${result.code}`);
      }
      if (callback) callback({ success: true });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      const result = leaveRoom(socket.id);
      if (result && !result.deleted) {
        io.to(result.code).emit("player-left", {
          playerId: socket.id,
          room: result.room,
        });
      }
    });

    // Player is ready (game board loaded)
    socket.on("player-ready", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (room) {
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          player.ready = true;
          // Notify opponent that this player is ready
          socket.to(roomCode).emit("opponent-ready", { playerId: socket.id });
          console.log(`Player ${socket.id} is ready in room ${roomCode}`);
        }
      }
    });

    // Ping for connection testing
    socket.on("ping", (callback) => {
      callback({ pong: true, timestamp: Date.now() });
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running`);
  });
});

