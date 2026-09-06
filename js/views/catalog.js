// js/views/catalog.js — Curated Directory of Focus Artists & First-Class Producers

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasCatalogView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class CatalogView {
    constructor() {
      this.activeTab = 'all';
      this.searchQuery = '';
    }

    render(container) {
      container.innerHTML = `
        <div class="view-catalog">
          <div class="view-header">
            <div>
              <h1 class="view-title">Katalog &amp; Produzenten-Graph</h1>
              <p class="view-subtitle">Fokus-A Kuration · Ausgewogene Mischung aus Idol, Indie, R&amp;B und Beatmakern</p>
            </div>
            <div class="chart-controls">
              <input type="text" id="cat-search-input" placeholder="Artist, Hangul, Beatmaker, Label..." value="${esc(this.searchQuery)}" class="chart-search-input">
            </div>
          </div>

          <!-- Category Tabs -->
          <div class="filter-bar">
            <div class="tag-tabs" id="cat-tabs">
              <button class="tag-tab ${this.activeTab === 'all' ? 'is-active' : ''}" data-tab="all">Alle (${(BIAS_DATA.artists.length + BIAS_DATA.producers.length)})</button>
              <button class="tag-tab ${this.activeTab === 'producers' ? 'is-active' : ''}" data-tab="producers">Produzenten (${BIAS_DATA.producers.length})</button>
              <button class="tag-tab ${this.activeTab === 'indie' ? 'is-active' : ''}" data-tab="indie">Indie &amp; Rock</button>
              <button class="tag-tab ${this.activeTab === 'idol' ? 'is-active' : ''}" data-tab="idol">Idol Acts</button>
              <button class="tag-tab ${this.activeTab === 'rnb' ? 'is-active' : ''}" data-tab="rnb">R&amp;B &amp; Hiphop</button>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="catalog-grid" id="catalog-grid"></div>
        </div>
      `;

      this.attachEvents(container);
      this.updateGrid();
    }

    attachEvents(container) {
      const tabs = container.querySelectorAll('.tag-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          this.activeTab = tab.dataset.tab;
          this.updateGrid();
        });
      });

      const searchInput = container.querySelector('#cat-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.updateGrid();
        });
      }
    }

    updateGrid() {
      const grid = document.getElementById('catalog-grid');
      if (!grid) return;

      const q = this.searchQuery;
      let items = [];

      // 1. Gather Artists
      if (this.activeTab !== 'producers') {
        BIAS_DATA.artists.forEach(a => {
          let matchesTab = true;
          if (this.activeTab === 'indie') {
            matchesTab = (a.genres || []).some(g => g === 'Indie' || g === 'Rock' || g === 'Post-Punk');
          } else if (this.activeTab === 'idol') {
            matchesTab = (a.genres || []).includes('Idol');
          } else if (this.activeTab === 'rnb') {
            matchesTab = (a.genres || []).some(g => g === 'R&B' || g === 'Hiphop');
          }

          if (matchesTab) {
            const matchesQuery = !q ||
              a.name.toLowerCase().includes(q) ||
              a.hangul.toLowerCase().includes(q) ||
              a.romanized.toLowerCase().includes(q) ||
              (a.agency || '').toLowerCase().includes(q);

            if (matchesQuery) {
              items.push({ type: 'artist', data: a });
            }
          }
        });
      }

      // 2. Gather Producers
      if (this.activeTab === 'all' || this.activeTab === 'producers') {
        BIAS_DATA.producers.forEach(p => {
          const matchesQuery = !q ||
            p.name.toLowerCase().includes(q) ||
            p.hangul.toLowerCase().includes(q) ||
            p.realName.toLowerCase().includes(q) ||
            p.agency.toLowerCase().includes(q);

          if (matchesQuery) {
            items.push({ type: 'producer', data: p });
          }
        });
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="catalog-empty">
            <p>Keine Einträge für diese Suche gefunden.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(item => {
        if (item.type === 'producer') {
          const p = item.data;
          return `
            <div role="button" tabindex="0" class="catalog-card producer-card" onclick="biasModals.openProducerModal('${p.id}')">
              <div class="card-head-meta">
                <span class="pill pill-prod">Produzent</span>
                <span class="pill pill-muted">${esc(p.agency)}</span>
              </div>
              <h3 class="entity-name">${esc(p.name)} <span class="entity-hangul">${esc(p.hangul)}</span></h3>
              <p class="real-name">Bürgerlich: <b>${esc(p.realName)}</b></p>
              <p class="entity-bio">${esc(p.bio.slice(0, 110))}…</p>
              
              <div class="roles-chips">
                ${(p.roles || []).map(r => `<span class="tag accent">${esc(r)}</span>`).join('')}
              </div>

              <div class="card-footer-stats">
                <span><b>${(p.keyWorks || []).length}</b> ausgewählte Werke</span>
                <span>Profil öffnen →</span>
              </div>
            </div>
          `;
        } else {
          const a = item.data;
          const memberBadge = a.members ? `${a.members.length} Mitglieder` : 'Solo-Act';
          return `
            <div role="button" tabindex="0" class="catalog-card artist-card" onclick="biasModals.openArtistModal('${a.id}')">
              <div class="card-head-meta">
                <span class="pill pill-artist">${memberBadge}</span>
                <span class="pill pill-muted">${esc(a.agency || 'Independent')}</span>
              </div>
              <h3 class="entity-name">${esc(a.name)} <span class="entity-hangul">${esc(a.hangul)}</span></h3>
              <p class="real-name">Debüt: <b>${a.debutYear}</b> · <i>${esc(a.romanized)}</i></p>
              <p class="entity-bio">${esc(a.bio.slice(0, 110))}…</p>

              <div class="roles-chips">
                ${(a.genres || []).slice(0, 3).map(g => `<span class="tag">${esc(g)}</span>`).join('')}
              </div>

              <div class="card-footer-stats">
                <span style="color:${a.fandomColor}">● ${esc(a.fandomName || 'Fandom')}</span>
                <span>Profil öffnen →</span>
              </div>
            </div>
          `;
        }
      }).join('');
    }
  }

  return new CatalogView();
});
