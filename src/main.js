import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ProjectsModal } from './components/ProjectsModal.js';
import { ImageViewerModal } from './components/ImageViewerModal.js';
import { projectsData } from './components/projectsData.js';

gsap.registerPlugin(ScrollTrigger);

// Project Configuration
const TOTAL_FRAMES = 240;
const images = [];
const sequence = { frame: 0 };

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const preloader = document.getElementById('preloader');

// Global Component Instances
let projectsModalInstance = null;
let imageViewerInstance = null;

// Helper to construct zero-padded frame paths across subfolders
function getFramePath(index) {
  const frameNum = index + 1; // 1-indexed
  const padded = String(frameNum).padStart(6, '0');
  
  let folder = 'part1';
  if (frameNum > 80 && frameNum <= 160) {
    folder = 'part2';
  } else if (frameNum > 160) {
    folder = 'part3';
  }
  
  return `/${folder}/frame_${padded}.jpg`;
}

// Canvas Sizing and High-DPI Crisp Rendering
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(dpr, dpr);
  render();
}

// Frame Drawing Logic (Cover Aspect-Ratio Fit)
function render() {
  const currentImg = images[sequence.frame];
  if (!currentImg || !currentImg.complete) return;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const imgWidth = currentImg.naturalWidth || currentImg.width;
  const imgHeight = currentImg.naturalHeight || currentImg.height;

  const scale = Math.max(viewportWidth / imgWidth, viewportHeight / imgHeight);
  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;
  const offsetX = (viewportWidth - drawWidth) / 2;
  const offsetY = (viewportHeight - drawHeight) / 2;

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  ctx.drawImage(currentImg, offsetX, offsetY, drawWidth, drawHeight);
}

// Image Preloader with Progress Callback
let loadedCount = 0;

function preloadFrames() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    
    img.onload = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.innerText = `${progress}%`;

      if (loadedCount === 1) {
        // Draw first frame immediately when ready
        render();
      }

      if (loadedCount === TOTAL_FRAMES) {
        onAllFramesLoaded();
      }
    };

    img.onerror = () => {
      loadedCount++;
      console.warn(`Failed to load frame at ${getFramePath(i)}`);
      if (loadedCount === TOTAL_FRAMES) {
        onAllFramesLoaded();
      }
    };

    images.push(img);
  }
}

function onAllFramesLoaded() {
  // Hide preloader smoothly
  setTimeout(() => {
    if (preloader) preloader.classList.add('fade-out');
    initScrollAnimation();
    initUIAnimations();
    
    // Initialize Components
    imageViewerInstance = new ImageViewerModal();
    projectsModalInstance = new ProjectsModal();

    bindHomepageClientClicks();
  }, 400);
}

// Bind Client Card Clicks on Homepage
function bindHomepageClientClicks() {
  const clientCards = document.querySelectorAll('.client-card');
  clientCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-client-id');
      const clientItem = projectsData.find(p => p.id === id);
      if (clientItem && imageViewerInstance) {
        imageViewerInstance.open({
          ...clientItem,
          src: clientItem.thumbnail
        });
      }
    });
  });
}

// Lenis Smooth Scroll + GSAP ScrollTrigger Integration
function initScrollAnimation() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Bind frame scrubbing to document scroll height
  gsap.to(sequence, {
    frame: TOTAL_FRAMES - 1,
    snap: 'frame',
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: () => render(),
    },
  });
}

// UI Entrance Animations
function initUIAnimations() {
  // Hero Elements Fade & Rise
  gsap.from('.hero-intro > *', {
    y: 40,
    opacity: 0,
    duration: 1,
    stagger: 0.1,
    ease: 'power3.out',
  });

  gsap.from('.hero-photo-wrapper', {
    scale: 0.9,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    delay: 0.2,
  });

  gsap.from('.hero-stats .stat-card', {
    x: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
    delay: 0.3,
  });

  // Clients Section Scroll Reveal
  gsap.from('.client-card', {
    scrollTrigger: {
      trigger: '#clients-section',
      start: 'top 80%',
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
  });

  // Project Cards Scroll Reveal
  gsap.from('.project-card', {
    scrollTrigger: {
      trigger: '#projects',
      start: 'top 80%',
    },
    y: 60,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
  });

  // Grid Section Reveal
  gsap.from('.grid-card', {
    scrollTrigger: {
      trigger: '#experience-process',
      start: 'top 80%',
    },
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
  });
}

// Window Listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  preloadFrames();
});
