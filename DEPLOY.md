# Deployment Guide for Guess Who? Multiplayer

This game requires two deployments:
1. **Socket.IO Server** → Railway (handles real-time connections)
2. **Next.js Frontend** → Vercel (hosts the game UI)

---

## Step 1: Deploy Socket.IO Server to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### 1.2 Deploy the Socket Server
1. In your terminal, navigate to the socket-server folder:
   ```bash
   cd socket-server
   ```

2. Initialize a new Git repository for the socket server:
   ```bash
   git init
   git add .
   git commit -m "Initial socket server"
   ```

3. Create a new project on Railway:
   - Go to [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Or use Railway CLI:
     ```bash
     npm install -g @railway/cli
     railway login
     railway init
     railway up
     ```

4. After deployment, Railway will give you a URL like:
   ```
   https://guess-who-socket-server-production.up.railway.app
   ```
   **Save this URL!** You'll need it for Vercel.

### 1.3 Verify Socket Server
Visit your Railway URL + `/health`:
```
https://your-railway-url.up.railway.app/health
```
You should see: `{"status":"ok","rooms":0}`

---

## Step 2: Deploy Next.js to Vercel

### 2.1 Push to GitHub
First, make sure your main project is on GitHub:

```bash
# In the guess_who folder (not socket-server)
cd ..
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/guess-who.git
git push -u origin main
```

### 2.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `guess-who` repository
5. **IMPORTANT**: Add the environment variable:
   - Click "Environment Variables"
   - Add:
     - **Name**: `NEXT_PUBLIC_SOCKET_URL`
     - **Value**: Your Railway URL (e.g., `https://guess-who-socket-server-production.up.railway.app`)
6. Click "Deploy"

### 2.3 Verify Deployment
1. Visit your Vercel URL
2. Create a room - you should see a room code
3. Open another browser/incognito window
4. Join with the room code
5. Both players should see each other!

---

## Environment Variables Summary

### Vercel (Next.js Frontend)
| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_SOCKET_URL` | Your Railway socket server URL | `https://guess-who-socket.up.railway.app` |

### Railway (Socket Server)
No environment variables needed - it uses the PORT automatically provided by Railway.

---

## Troubleshooting

### "Socket connection error"
- Check that `NEXT_PUBLIC_SOCKET_URL` is set correctly in Vercel
- Make sure the Railway server is running (check the health endpoint)
- Verify CORS is working (the socket server allows all origins)

### "Room not found"
- Rooms are stored in memory - they reset when the server restarts
- Make sure both players are connecting to the same socket server

### Players can't see each other
- Verify both players are using the same room code
- Check browser console for socket connection status

---

## Local Development

To run locally after deployment setup:

1. Start the socket server:
   ```bash
   cd socket-server
   npm install
   npm start
   ```

2. In another terminal, start Next.js:
   ```bash
   cd ..
   npm install
   npm run dev
   ```

3. Open http://localhost:3001

---

## Cost

Both services have free tiers:
- **Railway**: 500 hours/month free (enough for hobby projects)
- **Vercel**: Unlimited for hobby projects

For production use, consider:
- Railway Pro: $5/month
- Vercel Pro: $20/month

