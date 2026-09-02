// Interactive Projects Gallery Modal Component (100% Image Based)

import { projectsData } from './projectsData.js';
import { ImageViewerModal } from './ImageViewerModal.js';

export class ProjectsModal {
  constructor() {
    this.imageViewer = new ImageViewerModal();
    this.currentFilter = 'all';
    this.modalEl = null;
    this.init();
  }

  init() {
    if (document.getElementById('all-projects-modal')) return;

    const modalHTML = `
      <div id="all-projects-modal" class="projects-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-content-container">
          
          <!-- Header -->
          <div class="modal-header">
            <div>
              <span class="modal-label">AFZAL EHSAN PORTFOLIO</span>
              <h2 class="modal-title">ALL PROJECTS, POSTS & CREATIVE ASSETS</h2>
            </div>
            <button id="close-projects-modal" class="modal-close-btn" aria-label="Close Modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Category Filter Bar -->
          <div class="filter-bar">
            <button class="filter-btn active" data-filter="all">🔥 ALL WORK (40+)</button>
            <button class="filter-btn" data-filter="wedding">💍 DIGITAL WEDDING CARDS</button>
            <button class="filter-btn" data-filter="graphics">🎨 BRAND & SOCIAL POSTS</button>
            <button class="filter-btn" data-filter="branding">🏡 REAL ESTATE & LOGOS</button>
            <button class="filter-btn" data-filter="client">💼 CLIENT PORTFOLIO (12)</button>
            <button class="filter-btn" data-filter="ai_post">🤖 AI CREATIVE DESIGNS</button>
            <button class="filter-btn" data-filter="web">💻 WEB & APP PRODUCTS</button>
          </div>

          <!-- Projects Grid Container -->
          <div id="modal-projects-grid" class="modal-projects-grid"></div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalEl = document.getElementById('all-projects-modal');
    this.gridEl = document.getElementById('modal-projects-grid');

    this.bindEvents();
    this.renderGrid('all');
  }

  bindEvents() {
    // Trigger elements
    const triggerButtons = document.querySelectorAll('.section-link, [href="#projects"], .view-all-trigger, .clients-view-trigger');
    triggerButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = btn.getAttribute('data-filter') || 'all';
        this.open(filter);
      });
    });

    // Close button & backdrop
    const closeBtn = document.getElementById('close-projects-modal');
    const backdrop = this.modalEl.querySelector('.modal-backdrop');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());

    // Filter Buttons
    const filterBtns = this.modalEl.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        this.renderGrid(filter);
      });
    });

    // ESC key close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl.classList.contains('active')) {
        this.close();
      }
    });
  }

  renderGrid(filterCategory = 'all') {
    this.currentFilter = filterCategory;
    const filtered = filterCategory === 'all'
      ? projectsData
      : projectsData.filter(p => p.category === filterCategory);

    if (filtered.length === 0) {
      this.gridEl.innerHTML = `<div class="empty-state">No items found in this category.</div>`;
      return;
    }

    this.gridEl.innerHTML = filtered.map(item => this.createCardHTML(item)).join('');

    // Attach click listeners
    const cards = this.gridEl.querySelectorAll('.gallery-card');
    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      const project = projectsData.find(p => p.id === id);

      card.addEventListener('click', () => {
        this.imageViewer.open({
          ...project,
          src: project.thumbnail
        });
      });
    });
  }

  createCardHTML(item) {
    const isContain = item.aspectRatio === 'contain';

    return `
      <div class="gallery-card ${isContain ? 'contain-card' : ''}" data-id="${item.id}">
        <div class="card-media-box ${isContain ? 'media-contain' : ''}">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" class="card-img ${isContain ? 'img-contain' : ''}" />
        </div>

        <div class="card-body">
          <span class="card-tag">${item.tag || item.category.toUpperCase()}</span>
          <h4 class="card-title">${item.title}</h4>
          <p class="card-desc">${item.description || ''}</p>
        </div>
      </div>
    `;
  }

  open(filter = 'all') {
    if (!this.modalEl) return;
    
    // Select filter button
    const filterBtns = this.modalEl.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      if (btn.getAttribute('data-filter') === filter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderGrid(filter);
    this.modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }
}
