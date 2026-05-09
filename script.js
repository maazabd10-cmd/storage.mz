const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const startButton = document.getElementById('start-button');
const message = document.getElementById('message');

const laneCount = 3;
const laneWidth = canvas.width / laneCount;
const carWidth = 48;
const carHeight = 84;
const playerY = canvas.height - carHeight - 28;
const keys = new Set();

let player;
let traffic;
let roadLines;
let score;
let speed;
let frame;
let animationId;
let running = false;

function resetGame() {
  player = {
    x: laneWidth + (laneWidth - carWidth) / 2,
    y: playerY,
    targetLane: 1,
  };
  traffic = [];
  roadLines = Array.from({ length: 8 }, (_, index) => index * 100 - 60);
  score = 0;
  speed = 4;
  frame = 0;
  updateHud();
}

function updateHud() {
  scoreElement.textContent = score.toString();
  speedElement.textContent = Math.max(1, Math.floor(speed - 3)).toString();
}

function laneCenter(lane) {
  return lane * laneWidth + (laneWidth - carWidth) / 2;
}

function drawRoad() {
  context.fillStyle = '#283044';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#1b2133';
  context.fillRect(0, 0, 22, canvas.height);
  context.fillRect(canvas.width - 22, 0, 22, canvas.height);

  context.strokeStyle = '#f6f7fb';
  context.lineWidth = 6;
  context.setLineDash([34, 28]);
  context.lineDashOffset = -frame * speed;
  for (let lane = 1; lane < laneCount; lane += 1) {
    const x = lane * laneWidth;
    context.beginPath();
    context.moveTo(x, -20);
    context.lineTo(x, canvas.height + 20);
    context.stroke();
  }
  context.setLineDash([]);

  context.fillStyle = '#36d174';
  roadLines.forEach((lineY) => {
    context.fillRect(8, lineY, 8, 42);
    context.fillRect(canvas.width - 16, lineY, 8, 42);
  });
}

function drawCar(car, color, accent = '#ffffff') {
  context.save();
  context.translate(car.x, car.y);

  context.fillStyle = color;
  roundRect(0, 0, carWidth, carHeight, 12);
  context.fill();

  context.fillStyle = accent;
  roundRect(9, 12, carWidth - 18, 18, 7);
  context.fill();
  roundRect(9, carHeight - 32, carWidth - 18, 18, 7);
  context.fill();

  context.fillStyle = 'rgba(0, 0, 0, 0.32)';
  context.fillRect(6, 28, 8, 28);
  context.fillRect(carWidth - 14, 28, 8, 28);

  context.restore();
}

function roundRect(x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function spawnTraffic() {
  const lane = Math.floor(Math.random() * laneCount);
  const recentSameLane = traffic.some((car) => car.lane === lane && car.y < 120);

  if (!recentSameLane) {
    traffic.push({
      lane,
      x: laneCenter(lane),
      y: -carHeight - 20,
      color: ['#f95d6a', '#845ec2', '#00c9a7', '#ffc75f'][Math.floor(Math.random() * 4)],
    });
  }
}

function movePlayer() {
  if ((keys.has('ArrowLeft') || keys.has('KeyA')) && player.targetLane > 0) {
    player.targetLane -= 1;
    keys.delete('ArrowLeft');
    keys.delete('KeyA');
  }

  if ((keys.has('ArrowRight') || keys.has('KeyD')) && player.targetLane < laneCount - 1) {
    player.targetLane += 1;
    keys.delete('ArrowRight');
    keys.delete('KeyD');
  }

  const targetX = laneCenter(player.targetLane);
  player.x += (targetX - player.x) * 0.24;
}

function updateTraffic() {
  if (frame % Math.max(32, 84 - Math.floor(speed * 7)) === 0) {
    spawnTraffic();
  }

  traffic.forEach((car) => {
    car.y += speed;
  });

  traffic = traffic.filter((car) => {
    if (car.y > canvas.height + carHeight) {
      score += 10;
      speed = Math.min(11, speed + 0.12);
      updateHud();
      return false;
    }
    return true;
  });
}

function updateRoadLines() {
  roadLines = roadLines.map((lineY) => {
    const nextY = lineY + speed;
    return nextY > canvas.height ? -80 : nextY;
  });
}

function isColliding(a, b) {
  return a.x < b.x + carWidth - 8
    && a.x + carWidth - 8 > b.x
    && a.y < b.y + carHeight - 10
    && a.y + carHeight - 10 > b.y;
}

function gameOver() {
  running = false;
  cancelAnimationFrame(animationId);
  startButton.textContent = 'Race Again';
  message.innerHTML = `
    <h1>Crash!</h1>
    <p>Your final score was <strong>${score}</strong>.</p>
    <p class="controls">Press Space or Race Again to restart.</p>
  `;
  message.classList.remove('hidden');
}

function loop() {
  frame += 1;
  movePlayer();
  updateTraffic();
  updateRoadLines();

  drawRoad();
  traffic.forEach((car) => drawCar(car, car.color, '#f8fbff'));
  drawCar(player, '#37e0ff', '#101523');

  if (traffic.some((car) => isColliding(player, car))) {
    gameOver();
    return;
  }

  score += 1;
  if (frame % 12 === 0) {
    updateHud();
  }

  animationId = requestAnimationFrame(loop);
}

function startGame() {
  resetGame();
  running = true;
  startButton.textContent = 'Restart';
  message.classList.add('hidden');
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === 'Space' && !running) {
    startGame();
    return;
  }

  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

startButton.addEventListener('click', startGame);

resetGame();
drawRoad();
drawCar(player, '#37e0ff', '#101523');
