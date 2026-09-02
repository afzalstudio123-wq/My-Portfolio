// Lightbox Video Player Modal Component - Zero Preload / On-Demand Creation

export class VideoPlayerModal {
  constructor() {
    this.modalEl = null;
    this.wrapperEl = null;
    this.init();
  }

  init() {
    if (document.getElementById('video-player-modal')) return;

    const modalHTML = `
      <div id="video-player-modal" class="lightbox-modal">
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-container">
          <button id="close-lightbox" class="lightbox-close-btn" aria-label="Close Video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <!-- Video Container (Empty until user clicks play) -->
          <div id="lightbox-video-wrapper" class="lightbox-video-wrapper"></div>
          
          <div class="lightbox-details">
            <span id="lightbox-tag" class="lightbox-tag">VIDEO SHOWCASE</span>
            <h3 id="lightbox-title" class="lightbox-title">Video Title</h3>
            <p id="lightbox-desc" class="lightbox-desc">Video Description</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('video-player-modal');
    this.wrapperEl = document.getElementById('lightbox-video-wrapper');
    this.tagEl = document.getElementById('lightbox-tag');
    this.titleEl = document.getElementById('lightbox-title');
    this.descEl = document.getElementById('lightbox-desc');

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = document.getElementById('close-lightbox');
    const backdrop = this.modalEl.querySelector('.lightbox-backdrop');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('active')) {
        this.close();
      }
    });
  }

  open(project) {
    if (!this.modalEl || !project) return;

    const videoSrc = project.videoUrl || project.src;
    if (!videoSrc) return;

    this.tagEl.innerText = project.tag || 'VIDEO EDITING';
    this.titleEl.innerText = project.title;
    this.descEl.innerText = project.description || '';
    
    // Clear previous video
    this.wrapperEl.innerHTML = '';

    // Dynamically create video element ONLY on explicit click
    const videoEl = document.createElement('video');
    videoEl.id = 'lightbox-video';
    videoEl.controls = true;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.src = videoSrc;

    this.wrapperEl.appendChild(videoEl);
    
    this.modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';

    videoEl.play().catch(err => console.log('Autoplay prevented:', err));
  }

  close() {
    if (!this.modalEl) return;

    // Destroy video element completely on close
    if (this.wrapperEl) {
      const videoEl = this.wrapperEl.querySelector('video');
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
      }
      this.wrapperEl.innerHTML = '';
    }

    this.modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }
}
