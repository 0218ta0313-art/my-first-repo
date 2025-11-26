// script.js - simple animation to move a shape across the playground

const playground = document.getElementById('playground');
const shape = document.getElementById('shape');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');

// Eyes: pupils follow pointer/touch position
const eyes = document.querySelectorAll('.eye');
const pupils = document.querySelectorAll('.eye .pupil');

function centerPupils() {
  pupils.forEach((pupil) => {
    pupil.style.transform = 'translate(-50%, -50%)';
  });
}

function movePupils(clientX, clientY) {
  if (!eyes.length) return;
  eyes.forEach((eye) => {
    const pupil = eye.querySelector('.pupil');
    if (!pupil) return;
    const rect = eye.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const angle = Math.atan2(dy, dx);
    const maxOffset = rect.width * 0.22; // keep pupil inside eye
    const dist = Math.min(maxOffset, Math.hypot(dx, dy));
    const offsetX = Math.cos(angle) * dist;
    const offsetY = Math.sin(angle) * dist;
    pupil.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
  });
}

if (eyes.length) {
  window.addEventListener('pointermove', (ev) => movePupils(ev.clientX, ev.clientY));
  window.addEventListener('pointerleave', () => centerPupils());
  window.addEventListener('touchstart', (ev) => {
    const touch = ev.touches[0];
    if (touch) movePupils(touch.clientX, touch.clientY);
  }, { passive: true });
}

// particle / confetti setup — guard against missing DOM nodes so script doesn't crash
let pctx = null;
let particles = [];
let confettis = [];
if (playground && shape) {
  // create a canvas overlay inside playground for particles/confetti
  const particleCanvas = document.createElement('canvas');
  particleCanvas.className = 'playground-canvas';
  playground.appendChild(particleCanvas);
  pctx = particleCanvas.getContext('2d');

  function resizeParticleCanvas() {
    particleCanvas.width = playground.clientWidth;
    particleCanvas.height = playground.clientHeight;
  }

  window.addEventListener('resize', () => {
    resizeParticleCanvas();
  });

  // initialize canvas size
  resizeParticleCanvas();

  // create some background floating particles
  function spawnBackgroundParticles(count = 18) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        r: 2 + Math.random() * 5,
        alpha: 0.12 + Math.random() * 0.18,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.1 - Math.random() * 0.3
      });
    }
  }
  spawnBackgroundParticles(28);

  function createConfettiBurst(x, y, count = 18) {
    const colors = ['#e74c3c','#f39c12','#f1c40f','#2ecc71','#3498db','#9b59b6'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 3.6;
      confettis.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        life: 60 + Math.random() * 40
      });
    }
  }

  // click on the shape to trigger confetti
  shape.addEventListener('click', (ev) => {
    const rect = shape.getBoundingClientRect();
    const px = rect.left - playground.getBoundingClientRect().left + rect.width/2;
    const py = rect.top - playground.getBoundingClientRect().top + rect.height/2;
    createConfettiBurst(px, py, 26);
  });

  // particle animation loop (runs independently)
  function particleLoop() {
    if (!pctx) return;
    pctx.clearRect(0,0,particleCanvas.width, particleCanvas.height);

    // update background particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= 0.999;
      if (p.y + p.r < 0 || p.x < -20 || p.x > particleCanvas.width + 20) {
        // respawn at bottom
        particles.splice(i,1);
        particles.push({
          x: Math.random() * particleCanvas.width,
          y: particleCanvas.height + 8 + Math.random()*40,
          r: 2 + Math.random() * 5,
          alpha: 0.12 + Math.random() * 0.18,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.1 - Math.random() * 0.3
        });
        continue;
      }
      pctx.beginPath();
      pctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      pctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      pctx.fill();
    }

    // update confetti
    for (let i = confettis.length - 1; i >= 0; i--) {
      const c = confettis[i];
      c.vy += 0.12; // gravity
      c.vx *= 0.99;
      c.x += c.vx;
      c.y += c.vy;
      c.rot += 0.2;
      c.life--;
      pctx.save();
      pctx.translate(c.x, c.y);
      pctx.rotate(c.rot);
      pctx.fillStyle = c.color;
      pctx.fillRect(-c.size/2, -c.size/2, c.size, c.size*0.6);
      pctx.restore();
      if (c.life <= 0 || c.y > particleCanvas.height + 40) confettis.splice(i,1);
    }

    requestAnimationFrame(particleLoop);
  }
  requestAnimationFrame(particleLoop);
} else {
  console.warn('playground or shape element not found — skipping particle setup');
}

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
  shape.style.setProperty('--tx', `${posX}px`);
  shape.style.setProperty('--ty', `${posY}px`);
  shape.style.setProperty('--s', String(scale));
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
