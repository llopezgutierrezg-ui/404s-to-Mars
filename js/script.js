<script>
/* ---------------------------
   Mensajes dinámicos
   --------------------------- */
const messages = [
  "Error 404 — Sector 9-A vacío",
  "Error 404 — Coordenadas borradas por tormenta solar",
  "Error 404 — Señal desviada por cráter",
  "Error 404 — Registro borrado: tiempo fuera",
  "Error 404 — Punto no cartografiado",
  "Error 404 — Comunicación interrumpida entre satélites",
  "Error 404 — Paquete perdido en la atmósfera",
];
const dyn = document.getElementById('dynamic');
function pickMessage(){
  dyn.textContent = messages[Math.floor(Math.random()*messages.length)];
}
/* show a new message every time and on load */
pickMessage();

/* ---------------------------
   Buttons
   --------------------------- */
document.getElementById('homeBtn').addEventListener('click', ()=> {
  // Simula volver a home - redirige a raíz
  window.location.href = '/';
});
document.getElementById('retryBtn').addEventListener('click', ()=> {
  // Reintentar: muestra animación de transmisión y "recarga" parcialmente
  showTransmission();
});

/* ---------------------------
   Transmission animation
   --------------------------- */
const transmission = document.getElementById('transmission');
function showTransmission(){
  transmission.style.display = 'flex';
  transmission.setAttribute('aria-hidden','false');
  // pulse the hud text
  const hudText = document.getElementById('hudText');
  hudText.textContent = 'TRANSMISIÓN: restableciendo…';
  setTimeout(()=> {
    transmission.style.display = 'none';
    transmission.setAttribute('aria-hidden','true');
    // pick new message and occasionally update content
    pickMessage();
    hudText.textContent = 'TRANSMISIÓN: perdida';
    // small feedback: flash eye
    flashEye();
  }, 1600);
}

/* ---------------------------
   Rover: mira hacia el cursor
   --------------------------- */
const rover = document.getElementById('rover');
const head = document.getElementById('head');
const eye = document.getElementById('eye');
const scene = document.getElementById('scene');

scene.addEventListener('mousemove', (e)=>{
  const rect = rover.getBoundingClientRect();
  const cx = rect.left + rect.width*0.5;
  const cy = rect.top + rect.height*0.45;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const angle = Math.atan2(dy,dx) * 180/Math.PI;
  head.style.transform = translate(110px,18px) rotate(${angle*0.25}deg);
  // move the "eye" to simulate looking
  const ex = Math.max(-4, Math.min(4, dx/50));
  const ey = Math.max(-2, Math.min(4, dy/50));
  eye.setAttribute('cx', ex);
  eye.setAttribute('cy', 10 + ey);
});
scene.addEventListener('mouseleave', ()=>{
  head.style.transform = 'translate(110px,18px) rotate(0deg)';
  eye.setAttribute('cx', 0);
  eye.setAttribute('cy', 10);
});

/* occasional eye blink */
function flashEye(){
  eye.style.transition = 'r 120ms linear';
  eye.setAttribute('r', 4.5);
  setTimeout(()=> eye.setAttribute('r', 8), 160);
}
setInterval(()=> {
  if(Math.random() < 0.08) flashEye();
}, 2200);


/* ---------------------------
   Partículas: polvo marciano en canvas
   --------------------------- */
const canvas = document.getElementById('dust');
const ctx = canvas.getContext('2d');
let DPR = window.devicePixelRatio || 1;
function resizeCanvas(){
  DPR = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * DPR);
  canvas.height = Math.floor(window.innerHeight * DPR);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const N = Math.floor((window.innerWidth * window.innerHeight) / 40000) + 30;
const particles = [];
for(let i=0;i<N;i++){
  particles.push({
    x: Math.random()*window.innerWidth,
    y: Math.random()*window.innerHeight,
    vx: (Math.random()*0.4 - 0.2),
    vy: (Math.random()*0.6 - 0.1),
    s: Math.random()*2 + 0.4,
    alpha: 0.08 + Math.random()*0.18
  });
}
function animateParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const p of particles){
    p.x += p.vx;
    p.y += p.vy;
    if(p.x < -20) p.x = window.innerWidth + 20;
    if(p.x > window.innerWidth + 20) p.x = -20;
    if(p.y < -20) p.y = window.innerHeight + 20;
    if(p.y > window.innerHeight + 20) p.y = -20;
    // draw as soft dot
    ctx.beginPath();
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s*8);
    g.addColorStop(0, rgba(255,210,170,${p.alpha*0.9}));
    g.addColorStop(1, rgba(255,210,170,0));
    ctx.fillStyle = g;
    ctx.arc(p.x, p.y, p.s*6, 0, Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(animateParticles);
}
requestAnimationFrame(animateParticles);

/* ---------------------------
   Sonido ambiente con WebAudio (mute por defecto)
   genera viento/interferencia leve
   --------------------------- */
let audioCtx = null;
let masterGain = null;
let noiseNode = null;
let lfo = null;
let isMuted = true;
const soundBtn = document.getElementById('soundToggle');

function initAudio(){
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.0; // start muted
  masterGain.connect(audioCtx.destination);

  // create noise (brownish)
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // increase volume a bit
  }
  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  // lowpass filter to make it wind-like
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;

  // LFO to modulate filter freq for movement
  lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08 + Math.random()*0.1;
  lfoGain.gain.value = 500;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  noiseNode.connect(filter);
  filter.connect(masterGain);
  noiseNode.start();
  lfo.start();
  // gentle breathing with master gain
  const now = audioCtx.currentTime;
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.018, now + 1);
}

soundBtn.addEventListener('click', async () => {
  if(!audioCtx) initAudio();
  if(isMuted){
    // unmute
    isMuted = false;
    masterGain.gain.exponentialRampToValueAtTime(0.018, audioCtx.currentTime + 0.6);
    soundBtn.textContent = '🔊 Sonido';
    soundBtn.setAttribute('aria-pressed','true');
  } else {
    isMuted = true;
    masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    soundBtn.textContent = '🔇 Sonido';
    soundBtn.setAttribute('aria-pressed','false');
  }
});

/* ---------------------------
   Easter egg: click sequence on tiny invisible dot
   --------------------------- */
const easter = document.getElementById('easter');
const eggModal = document.getElementById('eggModal');
const eggClose = document.getElementById('eggClose');
let clicks = 0;
easter.addEventListener('click', ()=>{
  clicks++;
  if(clicks >= 6){
    eggModal.style.display = 'flex';
    clicks = 0;
  }
});
// also allow double-clicking the rover
rover.addEventListener('dblclick', ()=> {
  eggModal.style.display = 'flex';
});
eggClose.addEventListener('click', ()=> eggModal.style.display = 'none');

/* ---------------------------
   Accessibility: keyboard shortcuts
   - H: volver a home
   - R: reintentar
   - M: activar/desactivar sonido
   --------------------------- */
window.addEventListener('keydown', (e)=>{
  if(e.key.toLowerCase() === 'h') window.location.href = '/';
  if(e.key.toLowerCase() === 'r') showTransmission();
  if(e.key.toLowerCase() === 'm') soundBtn.click();
});

/* ---------------------------
   small polish: micro interactions
   --------------------------- */
document.getElementById('homeBtn').addEventListener('mouseenter', ()=> {
  // tiny effect: change dynamic text
  dyn.style.transform = 'translateY(-2px)';
  dyn.style.transition = 'transform .12s ease';
});
document.getElementById('homeBtn').addEventListener('mouseleave', ()=> {
  dyn.style.transform = '';
});

/* on load small randomization */
window.addEventListener('load', ()=>{
  // small chance to change subtitle/title pair
  const alt = Math.random();
  if(alt < 0.35){
    document.getElementById('title').textContent = '404 — Página fuera de órbita';
    document.getElementById('subtitle').textContent = 'Este enlace se desvió de su trayectoria.';
  } else if (alt > 0.85){
    document.getElementById('title').textContent = '404 — Comunicación interrumpida';
    document.getElementById('subtitle').textContent = 'La señal se ha perdido entre las dunas rojas.';
  }
});

/* ensure canvas resizes correctly */
window.addEventListener('orientationchange', resizeCanvas);

</script>