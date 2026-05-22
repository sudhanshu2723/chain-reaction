const socket = io();

// Game state
let gameState = {
  gameId: null,
  players: [],
  currentPlayer: 0,
  grid: [],
  started: false,
  myPlayerId: null,
  winner: null
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_ROWS = 8;
const GRID_COLS = 6;
const CELL_SIZE = 80;
canvas.width = GRID_COLS * CELL_SIZE;
canvas.height = GRID_ROWS * CELL_SIZE;

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

function showMessage(text, type = 'info') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  setTimeout(() => {
    messageEl.textContent = '';
    messageEl.className = 'message';
  }, 3000);
}

// Menu handlers
document.getElementById('createGameBtn').addEventListener('click', () => {
  const playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Please enter your name');
    return;
  }
  socket.emit('createGame', playerName);
});

document.getElementById('joinGameBtn').addEventListener('click', () => {
  const playerName = document.getElementById('playerName').value.trim();
  const gameId = document.getElementById('gameIdInput').value.trim().toUpperCase();
  
  if (!playerName) {
    alert('Please enter your name');
    return;
  }
  
  if (!gameId) {
    alert('Please enter a game ID');
    return;
  }
  
  console.log('Attempting to join game:', gameId, 'as', playerName);
  socket.emit('joinGame', { gameId, playerName });
});

document.getElementById('copyGameId').addEventListener('click', () => {
  const gameId = document.getElementById('displayGameId').textContent;
  navigator.clipboard.writeText(gameId).then(() => {
    showMessage('Game ID copied to clipboard!', 'success');
  });
});

document.getElementById('startGameBtn').addEventListener('click', () => {
  socket.emit('startGame', gameState.gameId);
});

document.getElementById('leaveLobbyBtn').addEventListener('click', () => {
  location.reload();
});

document.getElementById('leaveGameBtn').addEventListener('click', () => {
  location.reload();
});

// Socket event handlers
socket.on('gameCreated', ({ gameId, gameState: state }) => {
  gameState.gameId = gameId;
  gameState.myPlayerId = socket.id;
  updateGameState(state);
  document.getElementById('displayGameId').textContent = gameId;
  showScreen('lobby');
});

socket.on('joinedGame', ({ gameId, gameState: state }) => {
  console.log('Successfully joined game:', gameId);
  gameState.gameId = gameId;
  gameState.myPlayerId = socket.id;
  updateGameState(state);
  document.getElementById('displayGameId').textContent = gameId;
  showScreen('lobby');
  updateLobby();
});

socket.on('playerJoined', (state) => {
  console.log('Player joined event received', state);
  updateGameState(state);
  updateLobby();
});

socket.on('playerLeft', (state) => {
  updateGameState(state);
  if (gameState.started) {
    showMessage('A player left the game', 'info');
  } else {
    updateLobby();
  }
});

socket.on('gameStarted', (state) => {
  updateGameState(state);
  document.getElementById('gameIdTop').textContent = `Game: ${gameState.gameId}`;
  showScreen('game');
  drawGame();
});

socket.on('moveMade', (state) => {
  updateGameState(state);
  drawGame();
});

socket.on('gameOver', (winner) => {
  gameState.winner = winner;
  drawGame();
  showMessage(`🎉 ${winner.name} wins!`, 'success');
});

socket.on('error', (message) => {
  showMessage(message, 'error');
});

// Update game state
function updateGameState(state) {
  gameState.players = state.players;
  gameState.currentPlayer = state.currentPlayer;
  gameState.grid = state.grid;
  gameState.started = state.started;
  gameState.winner = state.winner;
}

// Update lobby
function updateLobby() {
  const playersList = document.getElementById('playersList');
  playersList.innerHTML = '';
  
  gameState.players.forEach(player => {
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    playerItem.style.background = player.color + '33';
    playerItem.innerHTML = `
      <div class="player-color" style="background: ${player.color}"></div>
      <span>${player.name}</span>
    `;
    playersList.appendChild(playerItem);
  });
  
  const startBtn = document.getElementById('startGameBtn');
  startBtn.disabled = gameState.players.length < 2;
}

// Canvas click handler
canvas.addEventListener('click', (e) => {
  if (!gameState.started || gameState.winner) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    socket.emit('makeMove', { gameId: gameState.gameId, row, col });
  }
});

// Draw game
function drawGame() {
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      
      // Draw cell border
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      
      // Draw orbs
      const cell = gameState.grid[row][col];
      if (cell.orbs > 0 && cell.player !== null) {
        const player = gameState.players[cell.player];
        drawOrbs(x, y, cell.orbs, player.color);
      }
    }
  }
  
  // Update players info
  updatePlayersInfo();
}

function drawOrbs(x, y, count, color) {
  const centerX = x + CELL_SIZE / 2;
  const centerY = y + CELL_SIZE / 2;
  const radius = 12;
  
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  
  if (count === 1) {
    drawOrb(centerX, centerY, radius);
  } else if (count === 2) {
    drawOrb(centerX - 15, centerY, radius);
    drawOrb(centerX + 15, centerY, radius);
  } else if (count === 3) {
    drawOrb(centerX, centerY - 15, radius);
    drawOrb(centerX - 15, centerY + 10, radius);
    drawOrb(centerX + 15, centerY + 10, radius);
  } else if (count >= 4) {
    drawOrb(centerX - 15, centerY - 15, radius);
    drawOrb(centerX + 15, centerY - 15, radius);
    drawOrb(centerX - 15, centerY + 15, radius);
    drawOrb(centerX + 15, centerY + 15, radius);
  }
  
  ctx.shadowBlur = 0;
}

function drawOrb(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Add highlight
  const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fill();
}

function updatePlayersInfo() {
  const playersInfo = document.getElementById('playersInfo');
  playersInfo.innerHTML = '';
  
  gameState.players.forEach((player, index) => {
    const playerInfo = document.createElement('div');
    playerInfo.className = 'player-info';
    if (index === gameState.currentPlayer) {
      playerInfo.classList.add('active');
    }
    playerInfo.innerHTML = `
      <div class="player-color" style="background: ${player.color}"></div>
      <span>${player.name}</span>
    `;
    playersInfo.appendChild(playerInfo);
  });
  
  // Update turn indicator
  const currentTurn = document.getElementById('currentTurn');
  if (gameState.winner) {
    currentTurn.textContent = `Winner: ${gameState.winner.name}! 🎉`;
  } else {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const isMyTurn = currentPlayer.id === socket.id;
    currentTurn.textContent = isMyTurn ? "Your turn!" : `${currentPlayer.name}'s turn`;
  }
}
