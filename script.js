// script.js - simple animation to move a shape across the playground

const playground = document.getElementById('playground');
const shape = document.getElementById('shape');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');

let posX = 0; // in px
let posY = 0; // vertical position in px, 0 top
let vy = 0; // vertical velocity px/sec
let scale = 1; // visual scale for the shape
let scaleTarget = 1;
let direction = 1; // 1: right, -1: left
let baseSpeed = 60; // px per second for speed=1
let running = false;
let lastTimestamp = null;
const gravity = 1400; // px/sec^2
const bounceFactor = 0.6; // energy loss on bounce
const jumpPower = 520; // initial vy when clicked
let forceRunUntilSettled = false; // when clicked while paused, temporarily run until bounce settle
let resumeRunning = null;
let tempLockHorizontal = false; // when showing bounce while paused, suspend horizontal movement

function updateBounds() {
  // ensure posX is not out of bounds after resize
  const maxX = playground.clientWidth - shape.clientWidth;
  posX = Math.max(0, Math.min(posX, maxX));
  // ensure vertical: put on floor if necessary
  const floorY = playground.clientHeight - shape.clientHeight;
  posY = Math.max(0, Math.min(posY, floorY));
}

function draw() {
  shape.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
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
  if (!tempLockHorizontal) posX += velocity * dt;

  const maxX = playground.clientWidth - shape.clientWidth;
  if (posX <= 0) {
    posX = 0;
    direction = 1;
  } else if (posX >= maxX) {
    posX = maxX;
    direction = -1;
  }

  // vertical physics
  // compute floor
  const floorY = playground.clientHeight - shape.clientHeight;
  vy += gravity * dt;
  posY += vy * dt;
  if (posY >= floorY) {
    posY = floorY;
    if (Math.abs(vy) > 80) {
      vy = -vy * bounceFactor; // bounce up
    } else {
      vy = 0;
    }
  }

  // if we are in a forced run mode and we have settled back on the floor, stop if originally paused
  if (forceRunUntilSettled && posY === floorY && Math.abs(vy) === 0) {
    if (resumeRunning === false) {
      running = false;
    }
    forceRunUntilSettled = false;
    resumeRunning = null;
    tempLockHorizontal = false;
  }

  // scale easing
  const scaleSpeed = 10; // larger => faster return to 1
  scale += (scaleTarget - scale) * Math.min(1, scaleSpeed * dt);

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
  // reset vertical to floor
  posY = playground.clientHeight - shape.clientHeight;
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
// place on floor initially
posY = playground.clientHeight - shape.clientHeight;
draw();

// add click handler for bounce behavior (also supports touch)
shape.addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  // If not running, temporarily start loop until bounce finishes so we can show trajectory
  if (!running) {
    resumeRunning = false;
    running = true;
    forceRunUntilSettled = true;
    tempLockHorizontal = true;
    requestAnimationFrame(loop);
  } else {
    resumeRunning = true;
  }
  // give upward velocity and a little horizontal reversal for fun
  vy = -jumpPower;
  direction *= -1;
  // small visual feedback: scale up briefly (handled by scale variables and loop)
  scale = 1.08;
  scaleTarget = 1;
});

// optional: auto-start animation
// running = true; requestAnimationFrame(loop);
