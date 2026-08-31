/**
 * Fluxora — Smooth Scroll Video Canvas Engine & Interactive Web Logic
 * -------------------------------------------------------------------
 * - Preloads 240 video frames in parallel batches
 * - Smooth lerp interpolated canvas video playback synchronized with page scroll
 * - IntersectionObserver scroll-reveal animations for glass cards & sections
 * - Interactive accordion step handlers for process section
 */

const CONFIG = {
  totalFrames: 240,
  framePath: (index) => `./frames/frame_${String(index).padStart(6, '0')}.jpg`,
  lerpDamping: 0.08, // Smooth lerp coefficient
  concurrencyLimit: 12
};

// DOM References
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const loaderOverlay = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderText = document.getElementById('loader-text');
const topProgressBar = document.getElementById('scroll-progress-bar');
const hudFrameCounter = document.getElementById('hud-frame-counter');
const hudScrollPct = document.getElementById('hud-scroll-pct');

// State Variables
const images = new Array(CONFIG.totalFrames);
let loadedCount = 0;
let currentFrameFloat = 1;
let targetFrameFloat = 1;
let animFrameId = null;

/**
 * 1. Image Preloader Engine
 */
function loadSingleFrame(index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images[index - 1] = img;
      loadedCount++;
      updateLoaderProgress();
      
      if (index === 1 && !animFrameId) {
        renderFrame(1);
      }
      resolve();
    };
    img.onerror = () => {
      console.error(`Failed to load frame ${index}`);
      loadedCount++;
      updateLoaderProgress();
      resolve();
    };
    img.src = CONFIG.framePath(index);
  });
}

function updateLoaderProgress() {
  const pct = Math.round((loadedCount / CONFIG.totalFrames) * 100);
  if (loaderBar) loaderBar.style.width = `${pct}%`;
  if (loaderText) loaderText.textContent = `${pct}%`;
}

async function preloadAllFrames() {
  const indices = Array.from({ length: CONFIG.totalFrames }, (_, i) => i + 1);
  
  for (let i = 0; i < indices.length; i += CONFIG.concurrencyLimit) {
    const chunk = indices.slice(i, i + CONFIG.concurrencyLimit);
    await Promise.all(chunk.map((idx) => loadSingleFrame(idx)));
  }

  // Preloading complete - hide loader
  setTimeout(() => {
    if (loaderOverlay) loaderOverlay.classList.add('hidden');
    triggerScrollReveals();
  }, 300);
}

/**
 * 2. Canvas Cover ("object-fit: cover") Sizing & Rendering
 */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  ctx.scale(dpr, dpr);
  renderFrame(Math.round(currentFrameFloat));
}

function drawImageCover(img) {
  if (!img) return;

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const imgWidth = img.naturalWidth || 1280;
  const imgHeight = img.naturalHeight || 720;

  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function renderFrame(frameIndex) {
  const clampedIndex = Math.min(CONFIG.totalFrames, Math.max(1, frameIndex));
  const img = images[clampedIndex - 1];

  if (img) {
    drawImageCover(img);
  }
}

/**
 * 3. Dynamic Scroll Target Calculation
 */
function updateScrollTarget() {
  const scrollTop = window.scrollY || window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const maxScroll = docHeight - winHeight;

  if (maxScroll <= 0) return;

  const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
  
  // Map scroll fraction 0..1 to 1..240 frames
  targetFrameFloat = 1 + scrollFraction * (CONFIG.totalFrames - 1);

  // Update Top Progress Bar & HUD
  const pct = Math.round(scrollFraction * 100);
  if (topProgressBar) topProgressBar.style.width = `${pct}%`;
  if (hudScrollPct) hudScrollPct.textContent = `${pct}% SCROLLED`;
}

/**
 * 4. Physics Lerp Animation Loop
 */
function animationLoop() {
  const diff = targetFrameFloat - currentFrameFloat;

  if (Math.abs(diff) > 0.001) {
    currentFrameFloat += diff * CONFIG.lerpDamping;
    const currentFrameInt = Math.round(currentFrameFloat);
    
    renderFrame(currentFrameInt);
    
    if (hudFrameCounter) {
      const paddedCurrent = String(currentFrameInt).padStart(3, '0');
      hudFrameCounter.textContent = `FRAME ${paddedCurrent} / ${CONFIG.totalFrames}`;
    }
  }

  animFrameId = requestAnimationFrame(animationLoop);
}

/**
 * 5. Scroll Reveal Animations & Interactive Accordions
 */
function triggerScrollReveals() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach((el) => observer.observe(el));
}

function initProcessAccordion() {
  const steps = document.querySelectorAll('.process-step');
  steps.forEach((step) => {
    step.addEventListener('click', () => {
      steps.forEach((s) => s.classList.remove('active'));
      step.classList.add('active');
    });
  });
}

/**
 * 6. Initialization
 */
function init() {
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updateScrollTarget, { passive: true });

  resizeCanvas();
  updateScrollTarget();

  initProcessAccordion();

  animFrameId = requestAnimationFrame(animationLoop);
  preloadAllFrames();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
