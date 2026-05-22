# Chain Reaction - Multiplayer Game

A real-time multiplayer implementation of the classic Chain Reaction game where players compete to dominate the grid through strategic orb placement and chain reactions.

## Game Rules

- **Grid**: 8x6 grid of cells
- **Players**: 2-4 players can play simultaneously
- **Objective**: Be the last player with orbs on the board

### How to Play

1. Players take turns placing orbs in cells
2. Each cell has a critical mass based on its position:
   - **Corner cells**: 2 orbs
   - **Edge cells**: 3 orbs
   - **Center cells**: 4 orbs
3. When a cell reaches critical mass, it explodes:
   - All orbs are distributed to adjacent cells
   - Adjacent cells become yours
   - This can trigger chain reactions!
4. You can only place orbs in empty cells or cells you own
5. Last player with orbs on the board wins!

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and go to:
```
http://localhost:3000
```

## 🎮 Unique ID System - Play with Anyone!

### ✅ Built-in Game ID Sharing System

**How it works:**
1. **Create Game**: Click "Create New Game" → Get unique 6-character ID (e.g., "X7K9M2")
2. **Share ID**: Click "Copy" button and share with friends via text/chat
3. **Friends Join**: They enter the Game ID and click "Join Game"
4. **Play Together**: Everyone in the same game, real-time!

### 🚀 Deploy to Play from Anywhere

**Quick Deploy (FREE):**
- **Render.com**: [render.com](https://render.com) - Deploy in 3 minutes
- **Railway.app**: [railway.app](https://railway.app) - Auto-deploy in 1 minute
- **Glitch.com**: [glitch.com](https://glitch.com) - Instant deployment

See `DEPLOYMENT.md` for detailed instructions!

### 🏠 Local Network Play

1. Start server: `npm start`
2. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Share: `http://YOUR_IP:3000`
4. Create game and share the Game ID

### 🌐 Quick Internet Test

```bash
npm start
npx ngrok http 3000
```
Share the ngrok URL with friends!

## Game Features

- ✨ Real-time multiplayer using WebSockets
- 🎨 Beautiful gradient UI with smooth animations
- 🎮 Support for 2-4 players
- 🔗 Easy game sharing with Game ID system
- 💥 Chain reaction explosions with visual effects
- 📱 Responsive design (works on mobile)
- 🎯 Turn-based gameplay with clear indicators

## Technology Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Real-time Communication**: WebSocket (Socket.IO)

## Game Controls

- Click on any cell to place an orb
- You can only place orbs on your turn
- You can only place orbs in empty cells or cells you already own

## Tips & Strategy

- Corner and edge cells explode faster (lower critical mass)
- Plan chain reactions to capture multiple cells
- Control the corners early in the game
- Watch out for opponent's potential chain reactions
- Sometimes defensive play is better than aggressive expansion

## Troubleshooting

**Can't connect to game:**
- Make sure the server is running
- Check firewall settings
- Verify the correct IP address and port

**Game ID not working:**
- Game IDs are case-sensitive
- Make sure the game hasn't been deleted (host left)

**Lag or disconnection:**
- Check your internet connection
- Try refreshing the page
- Restart the server if needed

## License

MIT License - Feel free to modify and share!

Enjoy playing Chain Reaction! 🎮⚛️
