// js/search.js — Hangul-First Fuzzy Omnisearch Engine & Modal (Cmd+K)
// Unterstützt Choseong (초성), Revidierte Romanisierung, englische Aliasse und Credits.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasSearch = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Hangul Jamo Choseong breakdown table
  const CHOSEONG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
    'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];

  function getChoseong(str) {
    if (!str) return '';
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) - 0xac00;
      if (code >= 0 && code <= 11171) {
        result += CHOSEONG[Math.floor(code / 588)];
      } else {
        result += str.charAt(i);
      }
    }
    return result.toLowerCase();
  }

  function cleanString(str) {
    return String(str || '').toLowerCase().trim();
  }

  class BiasSearchEngine {
    constructor() {
      this.isModalOpen = false;
      this.selectedIndex = 0;
      this.currentResults = [];
      this.closeTimer = null;
    }

    search(query, options = {}) {
      const q = cleanString(query);
      if (!q) return [];

      const qChoseong = getChoseong(q);
      const results = [];

      // 1. Search Artists
      if (BIAS_DATA && BIAS_DATA.artists) {
        BIAS_DATA.artists.forEach(artist => {
          const matchHangul = cleanString(artist.hangul).includes(q);
          const matchChoseong = getChoseong(artist.hangul).includes(qChoseong);
          const matchName = cleanString(artist.name).includes(q);
          const matchRom = cleanString(artist.romanized).includes(q);
          const matchAliases = [...(artist.aliases || []), ...(biasStore.curationAliases || []).filter(a => a.artistId === artist.id).map(a => a.alias)].some(a => cleanString(a).includes(q));
          const matchGenres = (artist.genres || []).some(g => cleanString(g).includes(q));

          let score = 0;
          if (cleanString(artist.name) === q || cleanString(artist.hangul) === q) score += 100;
          else if (matchName || matchHangul) score += 60;
          else if (matchChoseong) score += 50;
          else if (matchRom || matchAliases) score += 40;
          else if (matchGenres) score += 20;

          if (score > 0) {
            results.push({
              type: 'artist',
              id: artist.id,
              title: artist.name,
              subtitle: `${artist.hangul} · ${artist.agency || 'Independent'} · ${artist.genres.join(', ')}`,
              item: artist,
              score
            });
          }
        });
      }

      // 2. Search Producers
      if (BIAS_DATA && BIAS_DATA.producers) {
        BIAS_DATA.producers.forEach(prod => {
          const matchHangul = cleanString(prod.hangul).includes(q);
          const matchChoseong = getChoseong(prod.hangul).includes(qChoseong);
          const matchName = cleanString(prod.name).includes(q);
          const matchReal = cleanString(prod.realName).includes(q);
          const matchWorks = (prod.keyWorks || []).some(w => cleanString(w).includes(q));

          let score = 0;
          if (cleanString(prod.name) === q || cleanString(prod.hangul) === q) score += 95;
          else if (matchName || matchHangul) score += 55;
          else if (matchChoseong || matchReal) score += 45;
          else if (matchWorks) score += 25;

          if (score > 0) {
            results.push({
              type: 'producer',
              id: prod.id,
              title: `${prod.name} (Produzent)`,
              subtitle: `${prod.hangul} · ${prod.agency} · ${prod.creditsCount} Credits`,
              item: prod,
              score
            });
          }
        });
      }

      // 3. Search Songs
      if (BIAS_DATA && BIAS_DATA.songs) {
        BIAS_DATA.songs.forEach(song => {
          const matchTitle = cleanString(song.title).includes(q);
          const matchHangul = cleanString(song.hangulTitle).includes(q);
          const matchChoseong = getChoseong(song.hangulTitle).includes(qChoseong);
          const matchArtist = cleanString(song.artistName).includes(q);
          const matchAlbum = cleanString(song.album).includes(q);
          const matchCredits = Object.values(song.credits || {}).flat().some(c => cleanString(c).includes(q));

          let score = 0;
          if (cleanString(song.title) === q || cleanString(song.hangulTitle) === q) score += 90;
          else if (matchTitle || matchHangul) score += 50;
          else if (matchChoseong) score += 40;
          else if (matchArtist || matchAlbum) score += 30;
          else if (matchCredits) score += 25;

          if (score > 0) {
            results.push({
              type: 'song',
              id: song.id,
              title: `${song.title} ${song.hangulTitle ? '(' + song.hangulTitle + ')' : ''}`,
              subtitle: `${song.artistName} · ${song.album} (${song.releaseYear})`,
              item: song,
              score
            });
          }
        });
      }

      // 4. Search Comebacks
      const allComebacks = [
        ...(biasStore ? biasStore.customComebacks : []),
        ...(typeof biasCalendarView !== "undefined" ? biasCalendarView.remoteReleases || [] : [])
      ];

      allComebacks.forEach(cb => {
        const matchAct = cleanString(cb.act).includes(q);
        const matchHangul = cleanString(cb.actHangul).includes(q);
        const matchTitle = cleanString(cb.title).includes(q);
        const matchType = cleanString(cb.type).includes(q);

        let score = 0;
        if (matchTitle) score += 45;
        else if (matchAct || matchHangul) score += 40;
        else if (matchType) score += 15;

        if (score > 0) {
          results.push({
            type: 'comeback',
            id: cb.id,
            title: `${cb.act} — ${cb.title}`,
            subtitle: `Comeback: ${cb.date} · ${cb.type} · ${cb.status}`,
            item: cb,
            score
          });
        }
      });

      // Sort by descending score
      return results.sort((a, b) => b.score - a.score).slice(0, 12);
    }

    initOmnisearchUI() {
      // Global shortcut: Cmd+K / Ctrl+K / /
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.openOmnisearch();
        } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
          e.preventDefault();
          this.openOmnisearch();
        } else if (e.key === 'Escape' && this.isModalOpen) {
          this.closeOmnisearch();
        }
      });

      // Delegate click on search buttons/inputs
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-action="open-search"]');
        if (trigger) {
          e.preventDefault();
          this.openOmnisearch();
        }
      });
    }

    positionOmnisearch(modal, trigger = document.querySelector('[data-action="open-search"]')) {
      if (!modal || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = window.innerWidth <= 600 ? 10 : 16;
      const panelWidth = Math.min(720, Math.max(rect.width, window.innerWidth - rect.left - viewportPadding));
      const left = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - panelWidth - viewportPadding));
      const top = Math.max(viewportPadding, rect.top);
      modal.style.setProperty('--search-anchor-left', `${Math.round(left)}px`);
      modal.style.setProperty('--search-anchor-top', `${Math.round(top)}px`);
      modal.style.setProperty('--search-start-width', `${Math.round(rect.width)}px`);
      modal.style.setProperty('--search-panel-width', `${Math.round(panelWidth)}px`);
    }

    openOmnisearch() {
      let modal = document.getElementById('omnisearch-dialog');
      if (!modal) {
        modal = document.createElement('dialog');
        modal.id = 'omnisearch-dialog';
        modal.className = 'omnisearch-dialog';
        modal.innerHTML = `
          <div class="omnisearch-backdrop" data-action="close-search"></div>
          <div class="omnisearch-container">
            <div class="omnisearch-header">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="search" id="omnisearch-input" placeholder="Suche nach Hangul (뉴진스), Romanisierung (Sumin), Track, Produzent …" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Suche nach Artists, Tracks und Credits" aria-controls="omnisearch-results" aria-autocomplete="list">
              <span class="kbd-badge">ESC</span>
            </div>
            <div class="omnisearch-body">
              <div id="omnisearch-results" class="omnisearch-results" role="listbox" aria-label="Suchergebnisse"></div>
              <div class="omnisearch-footer">
                <span><b>↑↓</b> Navigieren</span>
                <span><b>↵</b> Öffnen</span>
                <span><b>Hangul / Choseong (초성)</b> unterstützt</span>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        const input = modal.querySelector('#omnisearch-input');
        const resultsEl = modal.querySelector('#omnisearch-results');

        input.addEventListener('input', () => {
          this.selectedIndex = 0;
          this.renderResults(input.value, resultsEl);
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateResults(1, resultsEl);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.navigateResults(-1, resultsEl);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            this.selectCurrentResult();
          }
        });

        modal.addEventListener('click', (e) => {
          if (e.target.dataset.action === 'close-search' || e.target === modal) {
            this.closeOmnisearch();
          }
          const quickChip = e.target.closest('[data-search-query]');
          if (quickChip) {
            this.quickQuery(quickChip.dataset.searchQuery);
            return;
          }
          const itemEl = e.target.closest('.search-item');
          if (itemEl) {
            const idx = parseInt(itemEl.dataset.index, 10);
            this.selectedIndex = idx;
            this.selectCurrentResult();
          }
        });
      }

      if (this.closeTimer) {
        clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
      const trigger = document.querySelector('[data-action="open-search"]');
      this.positionOmnisearch(modal, trigger);
      modal.classList.remove('is-closing');
      modal.classList.add('is-opening');
      this.isModalOpen = true;
      if (typeof modal.show === 'function' && !modal.open) {
        modal.show();
      } else if (!modal.open) {
        modal.setAttribute('open', '');
      }

      trigger?.classList.add('is-active');
      trigger?.setAttribute('aria-expanded', 'true');
      document.body.classList.add('search-is-open');
      if (!this._resizeBound) {
        window.addEventListener('resize', () => {
          if (this.isModalOpen) this.positionOmnisearch(document.getElementById('omnisearch-dialog'));
        }, {passive: true});
        this._resizeBound = true;
      }
      requestAnimationFrame(() => {
        if (modal.open) modal.classList.add('is-open');
      });

      const input = modal.querySelector('#omnisearch-input');
      input.value = '';
      input.focus();
      this.renderResults('', modal.querySelector('#omnisearch-results'));
    }

    closeOmnisearch(animate = true) {
      const modal = document.getElementById('omnisearch-dialog');
      this.isModalOpen = false;
      const trigger = document.querySelector('[data-action="open-search"]');
      trigger?.classList.remove('is-active');
      trigger?.setAttribute('aria-expanded', 'false');
      if (!modal) { document.body.classList.remove('search-is-open'); return; }
      if (this.closeTimer) clearTimeout(this.closeTimer);
      modal.classList.remove('is-open', 'is-opening');
      if (!modal.open) {
        modal.classList.remove('is-closing');
        document.body.classList.remove('search-is-open');
        return;
      }
      if (!animate) {
        modal.classList.remove('is-closing', 'has-query', 'has-results');
        if (typeof modal.close === 'function') modal.close();
        else modal.removeAttribute('open');
        document.body.classList.remove('search-is-open');
        return;
      }
      modal.classList.add('is-closing');
      const finish = () => {
        modal.classList.remove('is-closing', 'has-query', 'has-results');
        if (typeof modal.close === 'function' && modal.open) modal.close();
        else modal.removeAttribute('open');
        document.body.classList.remove('search-is-open');
        this.closeTimer = null;
      };
      this.closeTimer = setTimeout(finish, 240);
    }

    renderResults(query, resultsEl) {
      const modal = document.getElementById('omnisearch-dialog');
      const hasQuery = Boolean(String(query || '').trim());
      modal?.classList.toggle('has-query', hasQuery);
      if (!query.trim()) {
        resultsEl.innerHTML = `
          <div class="search-empty">
            <p class="search-tip-title">Direkte Entdeckungs-Suche</p>
            <p class="search-tip-sub">Tippe z. B. <b>„수민“</b>, <b>„slom“</b>, <b>„ditto“</b>, <b>„prod“</b> oder <b>„indie“</b>.</p>
            <div class="search-quick-tags">
              <button type="button" class="quick-chip" data-search-query="NewJeans">NewJeans</button>
              <button type="button" class="quick-chip" data-search-query="Slom">Slom</button>
              <button type="button" class="quick-chip" data-search-query="검정치마">검정치마</button>
              <button type="button" class="quick-chip" data-search-query="BIBI">BIBI</button>
              <button type="button" class="quick-chip" data-search-query="R&amp;B">R&amp;B</button>
            </div>
          </div>
        `;
        this.currentResults = [];
        return;
      }

      const results = this.search(query);
      this.currentResults = results;
      modal?.classList.toggle('has-results', results.length > 0);

      if (results.length === 0) {
        resultsEl.innerHTML = `
          <div class="search-empty">
            <p>Keine Einträge für „<b>${this.escapeHtml(query)}</b>“ gefunden.</p>
            <p class="search-tip-sub">Versuche es mit Hangul, englischer Umschrift oder dem Produzenten-Namen.</p>
          </div>
        `;
        return;
      }

      this.selectedIndex = Math.min(Math.max(this.selectedIndex, 0), results.length - 1);
      resultsEl.innerHTML = results.map((r, i) => {
        const isSelected = i === this.selectedIndex;
        const typeBadge = {
          artist: '<span class="pill pill-artist">Artist</span>',
          producer: '<span class="pill pill-prod">Produzent</span>',
          song: '<span class="pill pill-song">Track</span>',
          comeback: '<span class="pill pill-cb">Comeback</span>'
        }[r.type] || '';

        return `
          <button type="button" class="search-item ${isSelected ? 'is-selected' : ''}" data-index="${i}" role="option" aria-selected="${isSelected}" id="omnisearch-result-${i}">
            <div class="search-item-info">
              <div class="search-item-title">${this.escapeHtml(r.title)} ${typeBadge}</div>
              <div class="search-item-sub">${this.escapeHtml(r.subtitle)}</div>
            </div>
            <span class="search-item-arrow">→</span>
          </button>
        `;
      }).join('');
    }

    navigateResults(direction, resultsEl) {
      if (!this.currentResults.length) return;
      this.selectedIndex = (this.selectedIndex + direction + this.currentResults.length) % this.currentResults.length;
      
      const items = resultsEl.querySelectorAll('.search-item');
      items.forEach((item, idx) => {
        if (idx === this.selectedIndex) {
          item.classList.add('is-selected');
          item.setAttribute('aria-selected', 'true');
          item.scrollIntoView?.({ block: 'nearest' });
        } else {
          item.classList.remove('is-selected');
          item.setAttribute('aria-selected', 'false');
        }
      });
    }

    selectCurrentResult() {
      const selected = this.currentResults[this.selectedIndex];
      if (!selected) return;

      this.closeOmnisearch(false);

      if (selected.type === 'song' && window.biasModals) {
        window.biasModals.openSongModal(selected.item.id);
      } else if (selected.type === 'artist' && window.biasModals) {
        window.biasModals.openArtistModal(selected.item.id);
      } else if (selected.type === 'producer' && window.biasModals) {
        window.biasModals.openProducerModal(selected.item.id);
      } else if (selected.type === 'comeback') {
        if (window.biasApp) {
          window.biasApp.navigateTo('kalender');
        }
      }
    }

    quickQuery(val) {
      const input = document.getElementById('omnisearch-input');
      const resultsEl = document.getElementById('omnisearch-results');
      if (input && resultsEl) {
        input.value = val;
        this.selectedIndex = 0;
        this.renderResults(val, resultsEl);
        input.focus();
      }
    }

    escapeHtml(str) {
      return String(str || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }
  }

  return new BiasSearchEngine();
});
