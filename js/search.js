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
      this.searchShell = null;
      this.searchPanel = null;
      this.searchPlaceholder = null;
      this.searchTriggerTemplate = null;
      this.searchCluster = null;
      this.returningTrigger = null;
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

      // Delegate the trigger and close the inline surface when focus moves elsewhere.
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-action="open-search"]');
        if (trigger && !trigger.hasAttribute('data-search-shell')) {
          e.preventDefault();
          this.openOmnisearch();
          return;
        }
        if (this.isModalOpen && !e.target.closest('[data-search-shell], #omnisearch-dialog')) {
          this.closeOmnisearch();
        }
      });
    }

    positionOmnisearch(panel = this.searchPanel, anchor = this.searchPlaceholder || this.searchShell || document.querySelector('[data-action="open-search"]')) {
      if (!panel || !anchor) return;
      const cluster = this.searchCluster || anchor.closest('.brand-search-cluster');
      if (!cluster) return;
      const rect = anchor.getBoundingClientRect();
      const clusterRect = cluster.getBoundingClientRect();
      // On mobile the browser's visual viewport can be narrower than the
      // layout viewport (especially while the keyboard is open). Measure from
      // the actual viewport edge and calculate the available width from the
      // absolute anchor position. The previous calculation could use the
      // trigger width as a fallback and let the in-place surface run past the
      // right edge on narrow devices.
      const visualViewportWidth = Number(window.visualViewport?.width) || 0;
      const layoutViewportWidth = Number(document.documentElement?.clientWidth) || Number(window.innerWidth) || 0;
      const viewportWidth = Math.max(1, Math.round(visualViewportWidth || layoutViewportWidth));
      const viewportPadding = 16;
      const rawLeft = Math.round(rect.left - clusterRect.left);
      const triggerWidth = Math.max(1, Math.round(rect.width || 112));
      const maxLeft = Math.max(0, Math.floor(viewportWidth - clusterRect.left - viewportPadding - Math.min(triggerWidth, viewportWidth)));
      const left = Math.max(0, Math.min(rawLeft, maxLeft));
      const absoluteLeft = clusterRect.left + left;
      const availableWidth = Math.max(1, Math.floor(viewportWidth - absoluteLeft - viewportPadding));
      const panelWidth = Math.min(720, availableWidth);
      const startWidth = Math.min(triggerWidth, panelWidth);
      const height = Math.max(40, Math.round(rect.height || 44));
      const widthValue = `${Math.round(panelWidth)}px`;
      const leftValue = `${left}px`;
      const startValue = `${startWidth}px`;
      const heightValue = `${height}px`;
      this.searchShell?.style.setProperty('--search-shell-left', leftValue);
      this.searchShell?.style.setProperty('--search-start-width', startValue);
      this.searchShell?.style.setProperty('--search-panel-width', widthValue);
      this.searchShell?.style.setProperty('--search-surface-width', widthValue);
      this.searchShell?.style.setProperty('--search-available-width', widthValue);
      this.searchShell?.style.setProperty('--search-shell-height', heightValue);
      panel.style.setProperty('--search-shell-left', leftValue);
      panel.style.setProperty('--search-start-width', startValue);
      panel.style.setProperty('--search-panel-width', widthValue);
      panel.style.setProperty('--search-surface-width', widthValue);
      panel.style.setProperty('--search-available-width', widthValue);
      panel.style.setProperty('--search-shell-height', heightValue);
    }

    createSearchSurface(trigger) {
      if (this.searchShell && this.searchPanel && this.searchPlaceholder) {
        return { shell: this.searchShell, panel: this.searchPanel };
      }
      const cluster = trigger?.closest('.brand-search-cluster') || document.querySelector('.brand-search-cluster');
      if (!trigger || !cluster) return {};
      const rect = trigger.getBoundingClientRect();
      this.searchCluster = cluster;
      this.searchTriggerTemplate = trigger.cloneNode(true);

      const placeholder = document.createElement('span');
      placeholder.className = 'search-trigger-spacer';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.width = `${Math.round(rect.width || 112)}px`;
      placeholder.style.height = `${Math.round(rect.height || 44)}px`;
      placeholder.style.flex = `0 0 ${Math.round(rect.width || 112)}px`;
      trigger.replaceWith(placeholder);

      const shell = document.createElement('div');
      shell.className = 'search-trigger-btn search-input-shell';
      shell.dataset.searchShell = 'true';
      shell.setAttribute('role', 'search');
      shell.setAttribute('aria-label', 'Search');
      shell.setAttribute('aria-expanded', 'false');
      shell.innerHTML = `
        <svg class="search-shell-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="search" id="omnisearch-input" placeholder="Suche nach Artist, Track oder Produzent …" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Suche nach Artists, Tracks und Credits" aria-controls="omnisearch-results" aria-autocomplete="list">
        <span class="search-shell-esc" aria-hidden="true">ESC</span>
      `;

      const panel = document.createElement('div');
      panel.id = 'omnisearch-dialog';
      panel.className = 'omnisearch-dialog';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Suchvorschläge');
      panel.setAttribute('aria-hidden', 'true');
      panel.innerHTML = `
        <div class="omnisearch-body">
          <div id="omnisearch-results" class="omnisearch-results" role="listbox" aria-label="Suchergebnisse"></div>
          <div class="omnisearch-footer">
            <span><b>↑↓</b> Navigieren</span>
            <span><b>↵</b> Öffnen</span>
            <span><b>Hangul / Choseong (초성)</b> unterstützt</span>
          </div>
        </div>
      `;

      cluster.append(shell, panel);
      this.searchShell = shell;
      this.searchPanel = panel;
      this.searchPlaceholder = placeholder;

      const input = shell.querySelector('#omnisearch-input');
      const resultsEl = panel.querySelector('#omnisearch-results');
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
      panel.addEventListener('click', (e) => {
        const quickChip = e.target.closest('[data-search-query]');
        if (quickChip) {
          this.quickQuery(quickChip.dataset.searchQuery);
          return;
        }
        const itemEl = e.target.closest('.search-item');
        if (itemEl) {
          this.selectedIndex = parseInt(itemEl.dataset.index, 10);
          this.selectCurrentResult();
        }
      });
      return { shell, panel };
    }

    prepareTriggerHandoff() {
      if (this.returningTrigger || !this.searchCluster || !this.searchPlaceholder || !this.searchTriggerTemplate) return;
      const trigger = this.searchTriggerTemplate.cloneNode(true);
      trigger.classList.remove('is-active');
      trigger.classList.add('search-trigger-returning');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.style.setProperty('--search-shell-left', this.searchShell?.style.getPropertyValue('--search-shell-left') || '0px');
      trigger.style.setProperty('--search-start-width', this.searchShell?.style.getPropertyValue('--search-start-width') || '112px');
      trigger.style.setProperty('--search-shell-height', this.searchShell?.style.getPropertyValue('--search-shell-height') || '44px');
      this.searchCluster.appendChild(trigger);
      this.returningTrigger = trigger;
      requestAnimationFrame(() => {
        if (!this.returningTrigger || this.isModalOpen) return;
        trigger.classList.add('is-visible');
        this.searchShell?.classList.add('is-handing-off');
      });
    }

    restoreSearchTrigger() {
      const placeholder = this.searchPlaceholder;
      const template = this.searchTriggerTemplate;
      const returning = this.returningTrigger;
      let restored = null;
      this.searchPanel?.remove();
      this.searchShell?.remove();
      if (placeholder && template && placeholder.isConnected) {
        const trigger = returning || template.cloneNode(true);
        trigger.classList.remove('is-active', 'search-trigger-returning', 'is-visible');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.style.removeProperty('--search-shell-left');
        trigger.style.removeProperty('--search-start-width');
        trigger.style.removeProperty('--search-shell-height');
        placeholder.replaceWith(trigger);
        restored = trigger;
      }
      if (returning && returning !== restored) returning.remove();
      this.returningTrigger = null;
      this.searchShell = null;
      this.searchPanel = null;
      this.searchPlaceholder = null;
      this.searchTriggerTemplate = null;
      this.searchCluster = null;
    }

    openOmnisearch() {
      const trigger = document.querySelector('[data-action="open-search"]:not([data-search-shell])');
      const surface = this.createSearchSurface(trigger);
      const shell = surface.shell || this.searchShell;
      const panel = surface.panel || this.searchPanel;
      if (!shell || !panel) return;
      if (this.closeTimer) {
        clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
      this.returningTrigger?.remove();
      this.returningTrigger = null;
      this.positionOmnisearch(panel, this.searchPlaceholder || shell);
      shell.classList.remove('is-closing', 'is-handing-off');
      panel.classList.remove('is-closing');
      shell.classList.add('is-opening');
      panel.classList.add('is-opening');
      this.isModalOpen = true;
      shell.setAttribute('aria-expanded', 'true');
      panel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('search-is-open');
      if (!this._resizeBound) {
        this._refreshSearchPosition = () => {
          if (this.isModalOpen) this.positionOmnisearch(this.searchPanel, this.searchPlaceholder || this.searchShell);
        };
        window.addEventListener('resize', this._refreshSearchPosition, { passive: true });
        // visualViewport resize fires when the mobile keyboard changes the
        // usable viewport without changing window.innerWidth.
        window.visualViewport?.addEventListener('resize', this._refreshSearchPosition, { passive: true });
        this._resizeBound = true;
      }
      requestAnimationFrame(() => {
        if (!this.isModalOpen) return;
        shell.classList.remove('is-opening');
        shell.classList.add('is-expanded', 'is-open');
        panel.classList.remove('is-opening');
        panel.classList.add('is-open');
      });
      const input = shell.querySelector('#omnisearch-input');
      input.value = '';
      input.focus();
      this.renderResults('', panel.querySelector('#omnisearch-results'));
    }

    closeOmnisearch(animate = true) {
      const shell = this.searchShell;
      const panel = this.searchPanel;
      this.isModalOpen = false;
      if (shell) shell.setAttribute('aria-expanded', 'false');
      if (panel) panel.setAttribute('aria-hidden', 'true');
      if (this.closeTimer) clearTimeout(this.closeTimer);
      if (!shell || !panel) {
        document.body.classList.remove('search-is-open');
        return;
      }

      // Let the navigation return as soon as the closing motion starts. The
      // shell remains above it during the short contraction, so there is no
      // visible jump or late menu re-entry.
      document.body.classList.remove('search-is-open');

      const finish = () => {
        this.restoreSearchTrigger();
        document.body.classList.remove('search-is-open');
        this.closeTimer = null;
      };
      if (!animate) {
        finish();
        return;
      }
      shell.classList.remove('is-open', 'is-expanded', 'is-opening');
      shell.classList.add('is-closing');
      panel.classList.remove('is-open', 'is-opening');
      panel.classList.add('is-closing');
      this.prepareTriggerHandoff();
      this.closeTimer = setTimeout(finish, 300);
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
