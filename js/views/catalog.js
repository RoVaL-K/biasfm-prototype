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
              <h1 class="view-title">Entdecken</h1>
              <p class="view-subtitle">Artists, Releases und die Menschen hinter der Musik.</p>
            </div>
            <div class="chart-controls">
              <input type="text" id="cat-search-input" placeholder="Artist, Hangul, Beatmaker, Label..." value="${esc(this.searchQuery)}" class="chart-search-input">
            </div>
          </div>

          <!-- Category Tabs -->
          <div class="filter-bar">
            <div class="tag-tabs" id="cat-tabs">
              <button class="tag-tab ${this.activeTab === 'all' ? 'is-active' : ''}" data-tab="all">Artists &amp; Credits</button>
              <button class="tag-tab ${this.activeTab === 'producers' ? 'is-active' : ''}" data-tab="producers">Produzenten (${BIAS_DATA.producers.length})</button>
              ${[['releases','Releases'],['labels','Labels'],['genres','Genres']].map(([id,label])=>`<button class="tag-tab ${this.activeTab===id?'is-active':''}" data-tab="${id}">${label}</button>`).join('')}
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

      const q = biasCore.normalize(this.searchQuery);
      const matches=(...values)=>!q||values.flat().some(v=>biasCore.normalize(v).includes(q));
      if(this.activeTab==='releases'){
        grid.innerHTML=BIAS_DATA.songs.filter(s=>matches(s.title,s.hangulTitle,s.artistName,s.album)).map(s=>`<button class="release-discovery" onclick="biasModals.openSongModal('${s.id}')">${biasUI.cover(s.album,s.artistName,true)}<strong>${esc(s.album)}</strong><span>${esc(s.artistName)} · ${s.releaseYear}</span><small>${esc(s.title)} · Credits & Links →</small></button>`).join('') || '<p>Keine Releases gefunden.</p>';return;
      }
      if(['labels','genres'].includes(this.activeTab)){
        const groups=new Map();for(const a of BIAS_DATA.artists){for(const key of this.activeTab==='labels'?[a.agency || 'Independent']:a.genres){if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}}
        grid.innerHTML=[...groups].filter(([key,artists])=>matches(key,artists.map(a=>a.name))).map(([key,artists])=>`<article class="catalog-card"><h2>${esc(key)}</h2><p class="section-note">${artists.length} Acts im Katalog</p>${artists.map(a=>`<button class="text-action" onclick="biasModals.openArtistModal('${a.id}')">${esc(a.name)} →</button>`).join('<br>')}</article>`).join('') || '<p>Keine Einträge gefunden.</p>';return;
      }
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
            const matchesQuery = matches(a.name,a.hangul,a.romanized,a.aliases || [],biasStore.curationAliases.filter(x=>x.artistId===a.id).map(x=>x.alias),a.agency) || !q ||
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
