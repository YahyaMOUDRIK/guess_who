const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Load characters from JSON
const charactersData = JSON.parse(fs.readFileSync(path.join(__dirname, "characters.json"), "utf8"));
const allCharacters = Object.entries(charactersData).map(([filename, name]) => ({
  id: filename,
  name: name,
  image: `/characters/${filename}`,
}));

// In-memory game state
const rooms = new Map();
const socketToPlayer = new Map(); // socket.id -> { roomCode, persistentId }

// Helpers
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Room logic
function createRoom(persistentId) {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();

  const room = {
    code,
    players: [{ id: persistentId, ready: false, choice: null, eliminated: [], finalized: false }],
    status: "waiting",
    characters: [],
    turn: null,
    winner: null,
    createdAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

function joinRoom(code, persistentId) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };

  const existingPlayer = room.players.find(p => p.id === persistentId);
  if (existingPlayer) return { room }; // Rejoin

  if (room.players.length >= 2) return { error: "Room is full" };

  room.players.push({ id: persistentId, ready: false, choice: null, eliminated: [], finalized: false });

  if (room.players.length === 2) {
    room.status = "picking";
    room.characters = shuffle(allCharacters).slice(0, 25);
  }

  return { room };
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("create-room", (persistentId, callback) => {
      const room = createRoom(persistentId);
      socket.join(room.code);
      socketToPlayer.set(socket.id, { roomCode: room.code, persistentId });
      if (typeof callback === "function") callback({ success: true, room });
    });

    socket.on("join-room", (code, persistentId, callback) => {
      const result = joinRoom(code.toUpperCase(), persistentId);
      if (result.error) {
        if (typeof callback === "function") callback({ success: false, error: result.error });
        return;
      }
      socket.join(code.toUpperCase());
      socketToPlayer.set(socket.id, { roomCode: code.toUpperCase(), persistentId });
      io.to(code.toUpperCase()).emit("room-update", result.room);
      if (typeof callback === "function") callback({ success: true, room: result.room });
    });

    socket.on("pick-character", ({ roomCode, characterId }) => {
      const room = rooms.get(roomCode.toUpperCase());
      const playerInfo = socketToPlayer.get(socket.id);
      if (room && room.status === "picking" && playerInfo) {
        const player = room.players.find(p => p.id === playerInfo.persistentId);
        if (player) {
          player.choice = characterId;
          if (room.players.every(p => p.choice !== null)) {
            room.status = "playing";
            room.turn = room.players[Math.floor(Math.random() * 2)].id;
          }
          io.to(roomCode.toUpperCase()).emit("room-update", room);
        }
      }
    });

    socket.on("toggle-elimination", ({ roomCode, characterId }) => {
      const room = rooms.get(roomCode.toUpperCase());
      const playerInfo = socketToPlayer.get(socket.id);
      if (room && room.status === "playing" && playerInfo) {
        if (room.turn !== playerInfo.persistentId) return;
        const player = room.players.find(p => p.id === playerInfo.persistentId);
        if (player) {
          if (player.eliminated.includes(characterId)) {
            player.eliminated = player.eliminated.filter(id => id !== characterId);
          } else {
            player.eliminated.push(characterId);
          }
          io.to(roomCode.toUpperCase()).emit("room-update", room);
        }
      }
    });

    socket.on("validate-turn", ({ roomCode }) => {
      const room = rooms.get(roomCode.toUpperCase());
      const playerInfo = socketToPlayer.get(socket.id);
      if (room && room.status === "playing" && playerInfo && room.turn === playerInfo.persistentId) {
        const nextPlayer = room.players.find(p => p.id !== playerInfo.persistentId);
        room.turn = nextPlayer.id;
        io.to(roomCode.toUpperCase()).emit("room-update", room);
      }
    });

    socket.on("lock-guess", ({ roomCode, characterId }) => {
      const room = rooms.get(roomCode.toUpperCase());
      const playerInfo = socketToPlayer.get(socket.id);
      if (room && room.status === "playing" && playerInfo) {
        const opponent = room.players.find(p => p.id !== playerInfo.persistentId);
        if (opponent.choice === characterId) {
          room.status = "finished";
          room.winner = playerInfo.persistentId;
        } else {
          room.status = "finished";
          room.winner = opponent.id;
        }
        io.to(roomCode.toUpperCase()).emit("room-update", room);
      }
    });

    socket.on("leave-room", (callback) => {
      const info = socketToPlayer.get(socket.id);
      if (info) {
        const room = rooms.get(info.roomCode);
        if (room) {
          room.players = room.players.filter(p => p.id !== info.persistentId);
          if (room.players.length === 0) {
            rooms.delete(info.roomCode);
          } else {
            room.status = "waiting";
            room.characters = [];
            room.turn = null;
            io.to(info.roomCode).emit("room-update", room);
          }
        }
        socket.leave(info.roomCode);
        socketToPlayer.delete(socket.id);
      }
      if (typeof callback === "function") callback({ success: true });
    });

    socket.on("disconnect", () => {
      socketToPlayer.delete(socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
