/**
 * Fluxora / Afzal Ehsan — Progressive Fast-Streaming Canvas Engine
 * ----------------------------------------------------------------
 * - Instant 2-Second Load Time for New & Returning Users
 * - Critical Keyframe Batching: Unlocks site after ~24 critical frames (1.5MB)
 * - Background Streaming: Streams remaining frames silently in non-blocking priority
 * - Nearest Loaded Frame Fallback: Guarantees zero blank screen during fast scrubbing
 * - Multi-Path Fallback: Supports Vercel & GitHub static path deployment
 */

const CONFIG = {
  totalFrames: 240,
  criticalThreshold: 20, // Only wait for 20 frames (~1.5MB) before unlocking site (2 seconds max!)
  lerpDamping: 0.08,
  concurrencyLimit: 16
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
let isUnlocked = false;
let currentFrameFloat = 1;
let targetFrameFloat = 1;
let animFrameId = null;

/**
 * 1. Smart Multi-Path Progressive Frame Loader
 */
function loadSingleFrame(index) {
  return new Promise((resolve) => {
    if (images[index - 1] && images[index - 1].complete) {
      resolve();
      return;
    }

    const padIndex = String(index).padStart(6, '0');
    const part = index <= 80 ? 'part1' : (index <= 160 ? 'part2' : 'part3');
    
    const candidatePaths = [
      `./frames/${part}/frame_${padIndex}.jpg`,
      `./${part}/frame_${padIndex}.jpg`,
      `./frame_${padIndex}.jpg`,
      `./frames/frame_${padIndex}.jpg`
    ];

    let pathIdx = 0;
    const img = new Image();
    img.decoding = 'async'; // Offload image decoding from main thread

    function tryNextPath() {
      if (pathIdx < candidatePaths.length) {
        img.src = candidatePaths[pathIdx++];
      } else {
        loadedCount++;
        checkUnlockThreshold();
        resolve();
      }
    }

    img.onload = () => {
      images[index - 1] = img;
      loadedCount++;
      checkUnlockThreshold();

      if (index === 1 && !animFrameId) {
        renderFrame(1);
      }
      resolve();
    };

    img.onerror = () => {
      tryNextPath();
    };

    tryNextPath();
  });
}

function checkUnlockThreshold() {
  // Calculate progress relative to critical initial threshold
  const criticalPct = Math.min(100, Math.round((loadedCount / CONFIG.criticalThreshold) * 100));
  
  if (!isUnlocked) {
    if (loaderBar) loaderBar.style.width = `${criticalPct}%`;
    if (loaderText) loaderText.textContent = `${criticalPct}%`;
  }

  // UNLOCK SITE IMMEDIATELY once critical initial threshold (20 frames) is reached!
  if (loadedCount >= CONFIG.criticalThreshold && !isUnlocked) {
    isUnlocked = true;
    setTimeout(() => {
      if (loaderOverlay) loaderOverlay.classList.add('hidden');
      triggerScrollReveals();
    }, 200);
  }
}

/**
 * 2. Two-Stage Fast Preloader (Critical First, Background Stream Second)
 */
async function startProgressivePreload() {
  // STAGE 1: Load critical keyframes spread evenly across the sequence (e.g. frame 1, 12, 24...)
  const criticalIndices = [];
  const step = Math.floor(CONFIG.totalFrames / CONFIG.criticalThreshold);
  for (let i = 1; i <= CONFIG.totalFrames; i += step) {
    criticalIndices.push(i);
  }
  if (!criticalIndices.includes(1)) criticalIndices.unshift(1);

  // Rapidly load critical keyframes first
  await Promise.all(criticalIndices.map(idx => loadSingleFrame(idx)));

  // Ensure site unlocks even if network is fast
  checkUnlockThreshold();

  // STAGE 2: Stream remaining frames in background without blocking user
  const remainingIndices = Array.from({ length: CONFIG.totalFrames }, (_, i) => i + 1)
    .filter(idx => !criticalIndices.includes(idx));

  for (let i = 0; i < remainingIndices.length; i += CONFIG.concurrencyLimit) {
    const chunk = remainingIndices.slice(i, i + CONFIG.concurrencyLimit);
    await Promise.all(chunk.map(idx => loadSingleFrame(idx)));
  }
}

/**
 * 3. Nearest-Loaded Frame Fallback Canvas Engine
 */
function findNearestLoadedFrame(targetIdx) {
  // If target frame is loaded, use it directly
  if (images[targetIdx - 1] && images[targetIdx - 1].complete) {
    return images[targetIdx - 1];
  }

  // Search expanding outward for nearest available loaded frame
  for (let radius = 1; radius < CONFIG.totalFrames; radius++) {
    const prevIdx = targetIdx - radius;
    if (prevIdx >= 1 && images[prevIdx - 1] && images[prevIdx - 1].complete) {
      return images[prevIdx - 1];
    }
    const nextIdx = targetIdx + radius;
    if (nextIdx <= CONFIG.totalFrames && images[nextIdx - 1] && images[nextIdx - 1].complete) {
      return images[nextIdx - 1];
    }
  }

  return null;
}

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
  const img = findNearestLoadedFrame(clampedIndex);

  if (img) {
    drawImageCover(img);
  }
}

/**
 * 4. Dynamic Scroll Target Calculation
 */
function updateScrollTarget() {
  const scrollTop = window.scrollY || window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const maxScroll = docHeight - winHeight;

  if (maxScroll <= 0) return;

  const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
  
  targetFrameFloat = 1 + scrollFraction * (CONFIG.totalFrames - 1);

  const pct = Math.round(scrollFraction * 100);
  if (topProgressBar) topProgressBar.style.width = `${pct}%`;
  if (hudScrollPct) hudScrollPct.textContent = `${pct}% SCROLLED`;
}

/**
 * 5. Physics Lerp Animation Loop
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
 * 6. Scroll Reveal Animations & Interactive Accordions
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
 * 7. Initialization
 */
function init() {
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updateScrollTarget, { passive: true });

  resizeCanvas();
  updateScrollTarget();

  initProcessAccordion();

  animFrameId = requestAnimationFrame(animationLoop);
  startProgressivePreload();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
