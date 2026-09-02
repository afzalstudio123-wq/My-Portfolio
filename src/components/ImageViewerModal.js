// Lightbox Image Viewer Modal Component

export class ImageViewerModal {
  constructor() {
    this.modalEl = null;
    this.init();
  }

  init() {
    if (document.getElementById('image-viewer-modal')) return;

    const modalHTML = `
      <div id="image-viewer-modal" class="lightbox-modal">
        <div class="lightbox-backdrop"></div>
        <div class="lightbox-container image-lightbox-container">
          <button id="close-image-lightbox" class="lightbox-close-btn" aria-label="Close Image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div class="lightbox-image-wrapper">
            <img id="lightbox-img" src="" alt="Client Showcase" />
          </div>
          
          <div class="lightbox-details">
            <span id="lightbox-img-tag" class="lightbox-tag">CLIENT PORTFOLIO</span>
            <h3 id="lightbox-img-title" class="lightbox-title">Client Name</h3>
            <p id="lightbox-img-desc" class="lightbox-desc">Description</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('image-viewer-modal');
    this.imgEl = document.getElementById('lightbox-img');
    this.tagEl = document.getElementById('lightbox-img-tag');
    this.titleEl = document.getElementById('lightbox-img-title');
    this.descEl = document.getElementById('lightbox-img-desc');

    this.bindEvents();
  }

  bindEvents() {
    const closeBtn = document.getElementById('close-image-lightbox');
    const backdrop = this.modalEl.querySelector('.lightbox-backdrop');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('active')) {
        this.close();
      }
    });
  }

  open(item) {
    if (!this.modalEl || !item) return;

    this.tagEl.innerText = item.tag || 'CLIENT SHOWCASE';
    this.titleEl.innerText = item.title;
    this.descEl.innerText = item.description || '';
    this.imgEl.src = item.src || item.thumbnail;

    this.modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }
}
