# 🎭 Guess Who? - Multiplayer Web Game

A web-based multiplayer version of the classic Guess Who? game where two players try to guess each other's hidden character by asking yes-or-no questions.

## 🚀 Features

- **Real-time multiplayer** using Socket.IO
- **Private game rooms** with shareable room codes
- **Beautiful UI** with animations and responsive design
- **No authentication required** - just create/join a room!

## 🛠️ Tech Stack

- **Frontend**: React with Next.js 14
- **Backend**: Node.js with Express
- **Real-time**: Socket.IO
- **Styling**: CSS Modules

## 📦 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd guess-who
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser (or 3001 if 3000 is in use)

## 🎮 How to Play

1. **Create a Room**: Click "Create Room" to start a new game
2. **Share the Code**: Send the 6-character room code to your friend
3. **Join a Room**: Enter a room code to join an existing game
4. **Play!**: Once both players are connected, the game begins

## 🚀 Deployment

### Local Development

The app runs with a custom Node.js server that includes Socket.IO:

```bash
npm run dev
```

### Production on Vercel

Since Vercel's serverless functions don't support persistent WebSocket connections, you need to:

1. **Deploy the Socket.IO server separately** on a platform that supports long-running processes:
   - [Railway](https://railway.app)
   - [Render](https://render.com)
   - [Fly.io](https://fly.io)
   - [Heroku](https://heroku.com)

2. **Create a separate socket server**:
   
   Create a new project with just the Socket.IO server (extract from `server.js`):
   
   ```javascript
   // socket-server/index.js
   const { Server } = require("socket.io");
   const http = require("http");
   
   const server = http.createServer();
   const io = new Server(server, {
     cors: { origin: "*" }
   });
   
   // ... room management logic from server.js
   
   server.listen(process.env.PORT || 3001);
   ```

3. **Set the environment variable** on Vercel:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```

### Alternative: Full-Stack Deployment

For simpler deployment, you can use platforms that support both Next.js and WebSockets:
- Railway
- Render
- DigitalOcean App Platform

## 📁 Project Structure

```
guess-who/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with fonts and metadata
│   │   ├── page.tsx        # Main lobby page
│   │   ├── globals.css     # Global styles and CSS variables
│   │   └── page.module.css # Lobby page styles
│   ├── components/
│   │   ├── ConnectionStatus.tsx   # Socket connection indicator
│   │   ├── GameRoom.tsx           # Game room UI
│   │   └── RoomLobby.tsx          # Lobby features display
│   ├── hooks/
│   │   └── useSocket.ts    # Socket.IO React hook
│   └── lib/
│       └── socket.ts       # Socket.IO client singleton
├── server.js               # Custom server with Socket.IO
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

## 🔧 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create-room` | Client → Server | Create a new game room |
| `join-room` | Client → Server | Join an existing room by code |
| `leave-room` | Client → Server | Leave current room |
| `player-joined` | Server → Client | Notifies when a player joins |
| `player-left` | Server → Client | Notifies when a player leaves |

## 🎨 Design Features

- **Dark theme** with vibrant accent colors
- **Glassmorphism** effects with backdrop blur
- **Smooth animations** for all interactions
- **Responsive** design for mobile and desktop
- **Custom fonts**: Fredoka (display) + Space Mono (code)

## 📝 Next Steps (Game Logic)

This setup includes only the project structure and real-time connection. To complete the game:

1. Add character data (JSON with attributes)
2. Implement character selection phase
3. Add question system with predefined questions
4. Build character elimination logic
5. Implement win/loss conditions
6. Add game state synchronization

## 📄 License

MIT License - feel free to use this project for learning or your own games!

