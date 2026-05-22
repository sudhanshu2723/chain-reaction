const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Game state
const games = new Map();

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = [];
    this.currentPlayerIndex = 0;
    this.grid = Array(8).fill(null).map(() => 
      Array(6).fill(null).map(() => ({ orbs: 0, player: null }))
    );
    this.gridSize = { rows: 8, cols: 6 };
    this.started = false;
    this.winner = null;
  }

  addPlayer(playerId, playerName) {
    if (this.players.length < 4) {
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
      this.players.push({
        id: playerId,
        name: playerName,
        color: colors[this.players.length],
        alive: true
      });
      return true;
    }
    return false;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  start() {
    if (this.players.length >= 2) {
      this.started = true;
      return true;
    }
    return false;
  }

  getMaxOrbs(row, col) {
    const isCorner = (row === 0 || row === this.gridSize.rows - 1) && 
                     (col === 0 || col === this.gridSize.cols - 1);
    const isEdge = row === 0 || row === this.gridSize.rows - 1 || 
                   col === 0 || col === this.gridSize.cols - 1;
    
    if (isCorner) return 2;
    if (isEdge) return 3;
    return 4;
  }

  makeMove(row, col, playerId) {
    if (!this.started || this.winner) return { success: false, message: 'Game not active' };
    
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { success: false, message: 'Not your turn' };
    }

    const cell = this.grid[row][col];
    if (cell.player !== null && cell.player !== this.currentPlayerIndex) {
      return { success: false, message: 'Cell owned by another player' };
    }

    // Place orb
    this.grid[row][col] = {
      orbs: cell.orbs + 1,
      player: this.currentPlayerIndex
    };

    // Check for explosions
    const explosions = this.checkExplosions();
    
    // Check for winner
    this.checkWinner();

    // Move to next player
    if (!this.winner) {
      this.nextPlayer();
    }

    return { 
      success: true, 
      grid: this.grid, 
      explosions,
      currentPlayer: this.currentPlayerIndex,
      winner: this.winner
    };
  }

  checkExplosions() {
    const explosions = [];
    let hasExplosion = true;

    while (hasExplosion) {
      hasExplosion = false;
      const newGrid = JSON.parse(JSON.stringify(this.grid));

      for (let row = 0; row < this.gridSize.rows; row++) {
        for (let col = 0; col < this.gridSize.cols; col++) {
          const cell = this.grid[row][col];
          const maxOrbs = this.getMaxOrbs(row, col);

          if (cell.orbs >= maxOrbs) {
            hasExplosion = true;
            explosions.push({ row, col });

            // Remove orbs from current cell
            newGrid[row][col] = { orbs: 0, player: null };

            // Add orbs to adjacent cells
            const neighbors = [
              [row - 1, col], [row + 1, col],
              [row, col - 1], [row, col + 1]
            ];

            neighbors.forEach(([r, c]) => {
              if (r >= 0 && r < this.gridSize.rows && c >= 0 && c < this.gridSize.cols) {
                newGrid[r][c] = {
                  orbs: newGrid[r][c].orbs + 1,
                  player: cell.player
                };
              }
            });
          }
        }
      }

      this.grid = newGrid;
    }

    return explosions;
  }

  checkWinner() {
    // Count how many players have cells
    const playersWithCells = new Set();
    let totalCells = 0;

    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.gridSize.cols; col++) {
        const cell = this.grid[row][col];
        if (cell.player !== null) {
          playersWithCells.add(cell.player);
          totalCells++;
        }
      }
    }

    // Winner is determined after at least 2 moves per player
    if (totalCells > this.players.length * 2 && playersWithCells.size === 1) {
      const winnerIndex = Array.from(playersWithCells)[0];
      this.winner = this.players[winnerIndex];
    }
  }

  nextPlayer() {
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (!this.isPlayerAlive(this.currentPlayerIndex) && !this.winner);
  }

  isPlayerAlive(playerIndex) {
    // Check if player has any cells
    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.gridSize.cols; col++) {
        if (this.grid[row][col].player === playerIndex) {
          return true;
        }
      }
    }
    return false;
  }

  getState() {
    return {
      players: this.players,
      currentPlayer: this.currentPlayerIndex,
      grid: this.grid,
      started: this.started,
      winner: this.winner
    };
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGame', (playerName) => {
    const gameId = Math.random().toString(36).substring(7).toUpperCase();
    const game = new Game(gameId);
    game.addPlayer(socket.id, playerName);
    games.set(gameId, game);
    
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, gameState: game.getState() });
    console.log(`Game ${gameId} created by ${playerName}`);
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    console.log(`Join attempt - Game ID: ${gameId}, Player: ${playerName}`);
    console.log(`Available games:`, Array.from(games.keys()));
    
    const game = games.get(gameId);
    
    if (!game) {
      console.log(`Game ${gameId} not found`);
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.started) {
      console.log(`Game ${gameId} already started`);
      socket.emit('error', 'Game already started');
      return;
    }

    if (game.addPlayer(socket.id, playerName)) {
      socket.join(gameId);
      
      // Send confirmation to the joining player
      socket.emit('joinedGame', { gameId, gameState: game.getState() });
      
      // Notify all players in the game
      io.to(gameId).emit('playerJoined', game.getState());
      console.log(`${playerName} joined game ${gameId}. Total players: ${game.players.length}`);
    } else {
      console.log(`Game ${gameId} is full`);
      socket.emit('error', 'Game is full');
    }
  });

  socket.on('startGame', (gameId) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.start()) {
      io.to(gameId).emit('gameStarted', game.getState());
      console.log(`Game ${gameId} started`);
    } else {
      socket.emit('error', 'Need at least 2 players to start');
    }
  });

  socket.on('makeMove', ({ gameId, row, col }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    const result = game.makeMove(row, col, socket.id);
    
    if (result.success) {
      io.to(gameId).emit('moveMade', game.getState());
      
      if (result.winner) {
        io.to(gameId).emit('gameOver', result.winner);
      }
    } else {
      socket.emit('error', result.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all games
    games.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.removePlayer(socket.id);
        
        if (game.players.length === 0) {
          games.delete(gameId);
          console.log(`Game ${gameId} deleted (no players)`);
        } else {
          io.to(gameId).emit('playerLeft', game.getState());
        }
      }
    });
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Share this address with other players to join!`);
});
