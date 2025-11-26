// script.js - simple animation to move a shape across the playground

const playground = document.getElementById('playground');
const shape = document.getElementById('shape');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');

let posX = 0; // in px
let direction = 1; // 1: right, -1: left
let baseSpeed = 60; // px per second for speed=1
let running = false;
let lastTimestamp = null;

function updateBounds() {
  // ensure posX is not out of bounds after resize
  const maxX = playground.clientWidth - shape.clientWidth;
  posX = Math.max(0, Math.min(posX, maxX));
}

function draw() {
  shape.style.transform = `translateX(${posX}px)`;
}

function loop(timestamp) {
  if (!running) {
    lastTimestamp = null;
    return;
  }

  if (lastTimestamp == null) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 1000; // seconds
  lastTimestamp = timestamp;

  const speedMultiplier = Number(speedRange.value);
  const velocity = baseSpeed * speedMultiplier * direction; // px/sec
  posX += velocity * dt;

  const maxX = playground.clientWidth - shape.clientWidth;
  if (posX <= 0) {
    posX = 0;
    direction = 1;
  } else if (posX >= maxX) {
    posX = maxX;
    direction = -1;
  }

  draw();
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click', () => {
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
});

pauseBtn.addEventListener('click', () => {
  running = false;
});

resetBtn.addEventListener('click', () => {
  running = false;
  posX = 0;
  direction = 1;
  draw();
});

// speed control updates base velocity view
speedRange.addEventListener('input', () => {
  // nothing special needed here; loop reads speedRange value directly
});

// keyboard support: arrow keys nudge behavior
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'ArrowRight') {
    direction = 1;
    posX = Math.min(playground.clientWidth - shape.clientWidth, posX + 10);
    draw();
  } else if (ev.key === 'ArrowLeft') {
    direction = -1;
    posX = Math.max(0, posX - 10);
    draw();
  } else if (ev.key === ' ' || ev.code === 'Space') {
    // toggle running on space
    running = !running;
    if (running) requestAnimationFrame(loop);
  }
});

// keep position inside bounds after resize
window.addEventListener('resize', () => {
  updateBounds();
  draw();
});

// initialize layout
updateBounds();
draw();

// optional: auto-start animation
// running = true; requestAnimationFrame(loop);
