// --- Penalty Shootout Game (3D/Isometric Theater View, Realistic Layout) ---
const TEAMS = {
  real_madrid:    { name: 'Real Madrid', color: '#ffffff', shorts: '#ffffff' },
  barcelona:      { name: 'Barcelona', color: '#004d98', shorts: '#a50044' },
  atletico:       { name: 'Atlético de Madrid', color: '#ee2c2c', shorts: '#2e2e2e' },
  ac_milan:       { name: 'AC Milan', color: '#000000', shorts: '#ff0000' },
  inter:          { name: 'Inter Milan', color: '#00529f', shorts: '#000000' },
  liverpool:      { name: 'Liverpool', color: '#c8102e', shorts: '#c8102e' }
};

let selectedTeam = 'real_madrid';
let gameStarted = false;
let isShooting = true;
let round = 1;
let playerScore = 0;
let aiScore = 0;
let shotInProgress = false;
let ball = { x: 350, y: 420, vx: 0, vy: 0, moving: false };
let keeper = { x: 350, y: 170, vx: 0, vy: 0, diveDir: 0, diving: false };
let shotResult = '';
let playerShots = [];
let aiShots = [];
let swipeStart = null;
let aiTarget = null;
let aiDiveDir = 0;
let playerDiveDir = 0;
let waitingForDive = false;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function drawStadium() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 3D field gradient
  let grad = ctx.createLinearGradient(0, 100, 0, 500);
  grad.addColorStop(0, '#4caf50');
  grad.addColorStop(1, '#205c20');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(100, 500); // bottom left
  ctx.lineTo(600, 500); // bottom right
  ctx.lineTo(700, 120); // top right
  ctx.lineTo(0, 120);   // top left
  ctx.closePath();
  ctx.fill();
  // Penalty arc (ellipse for 3D effect)
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(350, 320, 60, 18, 0, 0, Math.PI, true);
  ctx.stroke();
  ctx.restore();
  // Penalty spot
  ctx.beginPath();
  ctx.arc(350, 420, 6, 0, Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  // Goal (3D effect)
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(170, 120);
  ctx.lineTo(530, 120);
  ctx.lineTo(530, 170);
  ctx.lineTo(170, 170);
  ctx.closePath();
  ctx.stroke();
  // Goal posts (side bars)
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(170, 120);
  ctx.lineTo(170, 170);
  ctx.moveTo(530, 120);
  ctx.lineTo(530, 170);
  ctx.stroke();
  // Net (mesh)
  ctx.save();
  ctx.strokeStyle = '#fff7';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 9; i++) {
    ctx.beginPath();
    ctx.moveTo(170 + i*40, 120);
    ctx.lineTo(170 + i*40, 170);
    ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(170, 120 + i*10);
    ctx.lineTo(530, 120 + i*10);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  // Crowd (cartoon dots, 3D perspective)
  for (let i = 0; i < 100; i++) {
    ctx.beginPath();
    let x = Math.random()*700;
    let y = 80 + Math.random()*30;
    ctx.arc(x, y, 7, 0, Math.PI*2);
    ctx.fillStyle = `hsl(${Math.random()*360},80%,70%)`;
    ctx.fill();
  }
}

function drawKeeper(x, y, color, diving, diveDir) {
  ctx.save();
  ctx.translate(x, y);
  if (diving) ctx.rotate(diveDir * Math.PI/6);
  ctx.beginPath();
  ctx.arc(0, -16, 28, 0, Math.PI*2); // head
  ctx.fillStyle = '#ffe082';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 30, 40, 60, 0, 0, Math.PI*2); // body
  ctx.fillStyle = color;
  ctx.fill();
  // Arms
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-60, 10);
  ctx.lineTo(60, 10);
  ctx.stroke();
  ctx.restore();
}

function drawSoccerBall(x, y, r) {
  // Draw a cartoon soccer ball (black/white pentagons)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#2228';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Draw pentagons (approximate)
  ctx.fillStyle = '#222';
  for (let i = 0; i < 6; i++) {
    let angle = Math.PI/6 + i * Math.PI/3;
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      let a = angle + j * 2*Math.PI/5;
      let px = x + Math.cos(a) * r * 0.45;
      let py = y + Math.sin(a) * r * 0.45;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawScoreCircles() {
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(80 + i*40, 40, 14, 0, Math.PI*2);
    ctx.fillStyle = playerShots[i] === true ? '#43ea43' : (playerShots[i] === false ? '#e74c3c' : '#fff');
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(620 - i*40, 40, 14, 0, Math.PI*2);
    ctx.fillStyle = aiShots[i] === true ? '#43ea43' : (aiShots[i] === false ? '#e74c3c' : '#fff');
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawGame() {
  drawStadium();
  drawKeeper(keeper.x, keeper.y, '#ffd600', keeper.diving, keeper.diveDir);
  drawSoccerBall(ball.x, ball.y, 28);
  drawScoreCircles();
  ctx.save();
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`Round: ${round}  You: ${playerScore}  Opponent: ${aiScore}`, 350, 85);
  if (shotResult) {
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffd600';
    ctx.fillText(shotResult, 350, 250);
  }
  ctx.restore();
}

function resetBallAndKeeper() {
  ball.x = 350; ball.y = 420; ball.vx = 0; ball.vy = 0; ball.moving = false;
  keeper.x = 350; keeper.y = 170; keeper.vx = 0; keeper.vy = 0; keeper.diveDir = 0; keeper.diving = false;
  shotResult = '';
  aiTarget = null;
  aiDiveDir = 0;
  playerDiveDir = 0;
  waitingForDive = false;
}

function shootTo(targetX, targetY, power) {
  let dx = targetX - ball.x;
  let dy = targetY - ball.y;
  let dist = Math.sqrt(dx*dx + dy*dy);
  ball.vx = dx / dist * power;
  ball.vy = dy / dist * power;
  ball.moving = true;
  shotInProgress = true;
}

function updateBallAndKeeper() {
  if (isShooting) {
    if (ball.moving) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      // AI keeper dives
      if (shotInProgress && keeper.diving) {
        keeper.x += keeper.diveDir * 18;
        if (keeper.x < 170) keeper.x = 170;
        if (keeper.x > 530) keeper.x = 530;
      }
      if (ball.y < 170) {
        ball.moving = false;
        shotInProgress = false;
        if (keeper.diving && Math.abs(ball.x - keeper.x) < 60) {
          shotResult = 'Saved!';
          playerShots[round-1] = false;
        } else if (ball.x > 170 && ball.x < 530) {
          shotResult = 'GOAL!';
          playerScore++;
          playerShots[round-1] = true;
        } else {
          shotResult = 'Missed!';
          playerShots[round-1] = false;
        }
        setTimeout(nextRound, 1200);
      }
    }
  } else {
    // Player is keeper, must swipe to dive, then AI shoots
    if (waitingForDive) return;
    if (!ball.moving && !shotInProgress && !waitingForDive) {
      // Wait for player swipe
      waitingForDive = true;
      return;
    }
    if (ball.moving) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      // Keeper dives
      if (keeper.diving) {
        keeper.x += keeper.diveDir * 18;
        if (keeper.x < 170) keeper.x = 170;
        if (keeper.x > 530) keeper.x = 530;
      }
      if (ball.y < 170) {
        ball.moving = false;
        shotInProgress = false;
        if (keeper.diving && Math.abs(ball.x - keeper.x) < 60) {
          shotResult = 'Saved!';
          aiShots[round-1] = false;
        } else if (ball.x > 170 && ball.x < 530) {
          shotResult = 'GOAL!';
          aiScore++;
          aiShots[round-1] = true;
        } else {
          shotResult = 'Missed!';
          aiShots[round-1] = false;
        }
        setTimeout(nextRound, 1200);
      }
    }
  }
}

function nextRound() {
  if (round > 5) {
    shotResult = playerScore > aiScore ? 'You Win!' : (playerScore < aiScore ? 'You Lose!' : 'Draw!');
    setTimeout(() => {
      document.getElementById('team-select').style.display = 'flex';
      document.getElementById('game-canvas').style.display = 'none';
      document.getElementById('controls').style.display = 'none';
      round = 1; playerScore = 0; aiScore = 0; isShooting = true;
      playerShots = [];
      aiShots = [];
      resetBallAndKeeper();
      drawGame();
    }, 2500);
    return;
  }
  round++;
  isShooting = !isShooting;
  resetBallAndKeeper();
  drawGame();
}

function gameLoop() {
  if (!gameStarted) return;
  updateBallAndKeeper();
  drawGame();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousedown', e => {
  if (isShooting && !ball.moving && !shotInProgress) {
    const rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    swipeStart = { x: mx, y: my };
  } else if (!isShooting && waitingForDive) {
    const rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    swipeStart = { x: mx, y: my };
  }
});

canvas.addEventListener('mouseup', e => {
  if (isShooting && !ball.moving && !shotInProgress && swipeStart) {
    const rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    if (swipeStart.y < 120 || swipeStart.y > 420 || swipeStart.x < 170 || swipeStart.x > 530) { swipeStart = null; return; }
    let dx = mx - swipeStart.x;
    let dy = my - swipeStart.y;
    if (dy > -10) { swipeStart = null; return; }
    let targetX = Math.max(170, Math.min(530, swipeStart.x + dx * 2));
    let targetY = 120 + Math.max(-60, Math.min(0, dy * 0.3));
    let power = Math.min(22, Math.max(14, -dy * 0.25));
    shootTo(targetX, targetY, power);
    // AI keeper picks a dive direction
    keeper.diving = true;
    keeper.diveDir = Math.random() < 0.33 ? -1 : (Math.random() > 0.66 ? 1 : 0);
    swipeStart = null;
  } else if (!isShooting && waitingForDive && swipeStart) {
    const rect = canvas.getBoundingClientRect();
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;
    let dx = mx - swipeStart.x;
    // Only allow left/right swipes
    if (Math.abs(dx) < 20) { swipeStart = null; return; }
    playerDiveDir = dx > 0 ? 1 : -1;
    keeper.diving = true;
    keeper.diveDir = playerDiveDir;
    waitingForDive = false;
    // AI shoots after player swipes
    setTimeout(() => {
      aiTarget = { x: 170 + Math.random()*360, y: 120 + Math.random()*20 };
      let dx = aiTarget.x - ball.x;
      let dy = aiTarget.y - ball.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      ball.vx = dx / dist * (14 + Math.random()*6);
      ball.vy = dy / dist * (14 + Math.random()*6);
      ball.moving = true;
      shotInProgress = true;
    }, 200);
    swipeStart = null;
  }
});

document.getElementById('start-btn').onclick = () => {
  selectedTeam = document.getElementById('team').value;
  document.getElementById('team-select').style.display = 'none';
  canvas.style.display = 'block';
  document.getElementById('controls').style.display = 'block';
  gameStarted = true;
  isShooting = true;
  round = 1;
  playerScore = 0;
  aiScore = 0;
  playerShots = [];
  aiShots = [];
  resetBallAndKeeper();
  drawGame();
  requestAnimationFrame(gameLoop);
};
// ...end of file...
