const { createServer } = require("http");
const { Server } = require("socket.io");
const charactersData = require("./characters.json");

const port = parseInt(process.env.PORT || "3001", 10);

// Transform characters to the expected format (Limit to 25 to match 5x5 UI grid)
const ALL_CHARACTERS = Object.entries(charactersData)
  .slice(0, 25)
  .map(([img, name], index) => ({
    id: index.toString(),
    name,
    image: `/characters/${img}`,
  }));

console.log(`Loaded ${ALL_CHARACTERS.length} characters.`);

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
function createRoom(hostPlayerId, hostSocketId) {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room = {
    code,
    players: [{
      id: hostPlayerId,
      socketId: hostSocketId,
      ready: false,
      choice: null,
      eliminated: [],
      finalized: false
    }],
    status: "waiting",
    characters: ALL_CHARACTERS,
    turn: null,
    winner: null,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

// Join an existing room
function joinRoom(code, playerPlayerId, playerSocketId) {
  const room = rooms.get(code);
  if (!room) {
    return { error: "Room not found" };
  }

  // Check if player already in room (reconnection)
  const existingPlayerIndex = room.players.findIndex(p => p.id === playerPlayerId);
  if (existingPlayerIndex !== -1) {
    console.log(`Player ${playerPlayerId} already in room ${code}, updating socketId.`);
    room.players[existingPlayerIndex].socketId = playerSocketId;

    // Safety check: if there are 2 players but status is stuck in waiting
    if (room.players.length === 2 && room.status === "waiting") {
      room.status = "picking";
      console.log(`Room ${code} status forced to picking on reconnection.`);
    }

    return { room };
  }

  if (room.players.length >= 2) {
    console.log(`Room ${code} is full. Current players: ${room.players.map(p => p.id)}`);
    return { error: "Room is full" };
  }

  console.log(`Adding player ${playerPlayerId} to room ${code}`);
  room.players.push({
    id: playerPlayerId,
    socketId: playerSocketId,
    ready: false,
    choice: null,
    eliminated: [],
    finalized: false
  });

  // If room becomes full, move to picking phase
  if (room.players.length === 2) {
    room.status = "picking";
    console.log(`Room ${code} status changed to picking.`);
  }

  return { room };
}

// Clean up old rooms (older than 24 hours)
function cleanupOldRooms() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000;
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > maxAge) {
      rooms.delete(code);
    }
  }
}
setInterval(cleanupOldRooms, 60 * 60 * 1000);

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", rooms: rooms.size }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Guess Who Socket Server");
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("create-room", (playerId, callback) => {
    if (typeof playerId === "function") {
      callback = playerId;
      playerId = socket.id;
    }
    const room = createRoom(playerId || socket.id, socket.id);
    socket.join(room.code);
    console.log(`Room created: ${room.code} by ${playerId}`);
    if (typeof callback === "function") callback({ success: true, room });
  });

  socket.on("join-room", async (code, playerId, callback) => {
    if (typeof playerId === "function") {
      callback = playerId;
      playerId = socket.id;
    }
    const safeCode = (code || "").toString().toUpperCase();
    const result = joinRoom(safeCode, playerId || socket.id, socket.id);

    if (result.error) {
      if (typeof callback === "function") callback({ success: false, error: result.error });
      return;
    }

    await socket.join(safeCode);
    console.log(`Socket ${socket.id} joined room ${safeCode}. Status: ${result.room.status}`);

    // Broadcast update to EVERYONE in the room
    io.to(safeCode).emit("room-update", result.room);

    if (typeof callback === "function") callback({ success: true, room: result.room });
  });

  socket.on("pick-character", ({ roomCode, characterId }) => {
    const safeCode = (roomCode || "").toString().toUpperCase();
    const room = rooms.get(safeCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    player.choice = characterId;
    console.log(`Player ${player.id} picked ${characterId} in ${safeCode}`);

    if (room.players.length === 2 && room.players.every(p => p.choice !== null)) {
      room.status = "playing";
      room.turn = room.players[Math.floor(Math.random() * 2)].id;
      console.log(`Game started in ${safeCode}. Turn: ${room.turn}`);
    }

    io.to(safeCode).emit("room-update", room);
  });

  socket.on("toggle-elimination", ({ roomCode, characterId }) => {
    const safeCode = (roomCode || "").toString().toUpperCase();
    const room = rooms.get(safeCode);
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const index = player.eliminated.indexOf(characterId);
    if (index === -1) player.eliminated.push(characterId);
    else player.eliminated.splice(index, 1);

    io.to(safeCode).emit("room-update", room);
  });

  socket.on("validate-turn", ({ roomCode }) => {
    const safeCode = (roomCode || "").toString().toUpperCase();
    const room = rooms.get(safeCode);
    if (!room || room.status !== "playing") return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || room.turn !== player.id) return;

    const otherPlayer = room.players.find(p => p.id !== player.id);
    if (otherPlayer) room.turn = otherPlayer.id;

    io.to(safeCode).emit("room-update", room);
  });

  socket.on("lock-guess", ({ roomCode, characterId }) => {
    const safeCode = (roomCode || "").toString().toUpperCase();
    const room = rooms.get(safeCode);
    if (!room || room.status !== "playing") return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || room.turn !== player.id) return;
    const opponent = room.players.find(p => p.id !== player.id);
    if (!opponent) return;

    if (opponent.choice === characterId) {
      room.status = "finished";
      room.winner = player.id;
    } else {
      room.status = "finished";
      room.winner = opponent.id;
    }

    io.to(safeCode).emit("room-update", room);
  });

  socket.on("get-room", (code, callback) => {
    const safeCode = (code || "").toString().toUpperCase();
    const room = rooms.get(safeCode);
    if (!room) {
      if (typeof callback === "function") callback({ success: false, error: "Room not found" });
      return;
    }
    if (typeof callback === "function") callback({ success: true, room });
  });

  socket.on("leave-room", (callback) => {
    for (const [code, room] of rooms.entries()) {
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        socket.leave(code);
        if (room.players.length === 0) rooms.delete(code);
        else {
          room.status = "waiting";
          io.to(code).emit("room-update", room);
        }
        break;
      }
    }
    if (typeof callback === "function") callback({ success: true });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    for (const [code, room] of rooms.entries()) {
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) {
        // We don't remove the player immediately on disconnect to allow reconnection
        // but for now, let's keep it simple as before or just log it
        console.log(`Player ${room.players[idx].id} disconnected from room ${code}`);
      }
    }
  });

  socket.on("ping", (callback) => {
    if (typeof callback === "function") callback({ pong: true, timestamp: Date.now() });
  });
});

httpServer.listen(port, () => {
  console.log(`> Socket.IO server running on port ${port}`);
});
