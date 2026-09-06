// js/views/calendar.js — Comeback Radar & Pipeline Timeline with iCal Export

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasCalendarView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getDaysUntil(dateStr) {
    const today = new Date(biasCore.koreaDate());
    const target = new Date(dateStr);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Heute!';
    if (diffDays === 1) return 'Morgen!';
    if (diffDays > 1) return `In ${diffDays} Tagen`;
    return 'Bereits erschienen';
  }

  class CalendarView {
    constructor() {
      this.filterTrackedOnly = false;
      this.activeGenre = 'Alle';
      this.showArchive = false;
      this.remoteReleases=[];
      this.releaseLoaded=false;
      this.loadingReleases=false;
    }

    render(container) {
      const allComebacks = this.getAllComebacks();

      container.innerHTML = `
        <div class="view-calendar">
          <div class="view-header">
            <div>
              <h1 class="view-title">Comeback Radar</h1>
              <p class="view-subtitle">Neue Releases deiner Katalog-Künstler, öffentliche Ankündigungen und deine eigenen Termine.</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-ghost" onclick="biasCalendarView.exportAllIcal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Auswahl als .ics exportieren
              </button>
              <button class="btn btn-accent" onclick="biasApp.navigateTo('curation')">
                + Comeback vorschlagen
              </button>
            </div>
          </div>

          <div id="release-source-status" class="release-source-bar"></div>
          <!-- Filter Controls -->
          <div class="filter-bar">
            <div class="tag-tabs" id="cal-genre-tabs">
              <button class="tag-tab ${this.activeGenre === 'Alle' ? 'is-active' : ''}" data-genre="Alle">Alle Genres</button>
              <button class="tag-tab ${this.activeGenre === 'Idol' ? 'is-active' : ''}" data-genre="Idol">Idol</button>
              <button class="tag-tab ${this.activeGenre === 'Indie' ? 'is-active' : ''}" data-genre="Indie">Indie &amp; Rock</button>
              <button class="tag-tab ${this.activeGenre === 'R&B' ? 'is-active' : ''}" data-genre="R&B">R&amp;B &amp; Hiphop</button>
            </div>

            <div class="filter-toggle-wrap">
              <label class="toggle-switch">
                <input aria-label="Nur gemerkte Termine" type="checkbox" id="cal-tracked-only" ${this.filterTrackedOnly ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <span class="filter-label">Nur gemerkte Termine (${biasStore.trackedComebacks.size})</span>
            </div>
          </div>

          <label class="archive-filter"><input type="checkbox" id="cal-archive" ${this.showArchive ? 'checked' : ''}> Vergangene Termine anzeigen</label>
          <!-- Timeline Container -->
          <div class="timeline-container" id="timeline-container"></div>
        </div>
      `;

      this.attachEvents(container);
      this.updateTimeline();
      this.renderSourceStatus();
      if (!this.releaseLoaded && typeof fetch === "function") this.loadReleases();
    }

    renderSourceStatus() {
      const box=document.getElementById('release-source-status');if(!box)return;
      box.innerHTML=`<div><b>${this.loadingReleases?'Releases werden geladen …':'Release-Quellen'}</b><p>${this.releaseWarning?esc(this.releaseWarning):this.releaseLoaded?`${this.remoteReleases.length} externe Einträge · ${this.releaseFetchedAt ? 'MusicBrainz abgerufen '+new Date(this.releaseFetchedAt).toLocaleString('de-DE') : 'Öffentliche Redaktion'}`:'MusicBrainz & öffentliche Redaktion'}</p><small>MusicBrainz: Katalog-Künstler, letzte und nächste 90 Tage. Keine vollständige Liste aller Comebacks.${this.releaseLimited?' Die Quelle liefert nur die ersten 100 Suchtreffer.':''}</small></div><button class="btn btn-ghost btn-sm" id="refresh-releases" ${this.loadingReleases?'disabled':''}>Aktualisieren</button>`;
      box.querySelector('button').onclick=()=>this.loadReleases();
    }

    async loadReleases() {
      if(this.loadingReleases)return;this.loadingReleases=true;this.renderSourceStatus();
      try{const result=await biasApi.request('api/releases',{signal:AbortSignal.timeout(30000)});this.remoteReleases=result.items;this.releaseWarning=result.warning || '';this.releaseFetchedAt=result.fetchedAt;this.releaseLimited=result.limited;this.releaseLoaded=true;}
      catch(error){this.releaseWarning=error.message;}
      finally{this.loadingReleases=false;if(biasApp.currentRoute==='kalender'){this.renderSourceStatus();this.updateTimeline();}}
    }

    getAllComebacks() {
      const standard = this.remoteReleases;
      const custom = biasStore.customComebacks || [];
      return [...custom, ...standard].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    attachEvents(container) {
      container.querySelector('#cal-archive').addEventListener('change', e => {this.showArchive = e.target.checked;this.updateTimeline();});
      const tabs = container.querySelectorAll('.tag-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          this.activeGenre = tab.dataset.genre;
          this.updateTimeline();
        });
      });

      const trackedCheckbox = container.querySelector('#cal-tracked-only');
      if (trackedCheckbox) {
        trackedCheckbox.addEventListener('change', (e) => {
          this.filterTrackedOnly = e.target.checked;
          this.updateTimeline();
        });
      }
    }

    filteredComebacks() {
      return this.getAllComebacks().filter(cb =>
        (this.showArchive || cb.date >= biasCore.koreaDate()) &&
        (!this.filterTrackedOnly || biasStore.isTracked(cb.id)) &&
        (this.activeGenre === 'Alle' || (cb.genres || []).some(g => this.activeGenre === 'R&B' ? /R&B|Hiphop/i.test(g) : this.activeGenre === 'Indie' ? /Indie|Rock/i.test(g) : g.includes(this.activeGenre))));
    }

    updateTimeline() {
      const container = document.getElementById('timeline-container');
      if (!container) return;

      const list = this.filteredComebacks();

      if (list.length === 0) {
        container.innerHTML = `
          <div class="timeline-empty">
            <p>Keine Termine für diese Auswahl. Trage einen bestätigten Release in deiner Sammlung ein.</p>
            <button class="btn btn-ghost btn-sm" onclick="biasCalendarView.resetFilters()">Filter zurücksetzen</button><a class="btn btn-accent btn-sm" href="#curation">Termin hinzufügen</a>
          </div>
        `;
        return;
      }

      // Group comebacks by Date
      const grouped = {};
      list.forEach(cb => {
        if (!grouped[cb.date]) grouped[cb.date] = [];
        grouped[cb.date].push(cb);
      });

      const dates = Object.keys(grouped).sort();

      container.innerHTML = dates.map(dateStr => {
        const dt = new Date(dateStr + 'T12:00:00');
        const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][dt.getDay()];
        const monthName = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][dt.getMonth()];
        const daysUntil = getDaysUntil(dateStr);
        const isToday = daysUntil === 'Heute!';

        const itemsHtml = grouped[dateStr].map(cb => {
          const isTracked = biasStore.isTracked(cb.id);
          const pipelineStep = cb.pipelineStep || 1;

          return `
            <div class="comeback-card ${isTracked ? 'is-tracked' : ''}">
              <div class="cb-card-header">
                <div class="cb-act-info">
                  <span class="cb-type-badge">${esc(cb.type)}</span> <span class="pill pill-muted">${esc(cb.sourceName || "Persönlicher Termin")}</span>
                  <h3 class="cb-act-name">
                    ${esc(cb.act)} <span class="cb-hangul">${esc(cb.actHangul || '')}</span>
                  </h3>
                  <span class="cb-song-title">„${esc(cb.title)}“</span>
                </div>
                <button class="track-btn ${isTracked ? 'is-active' : ''}" 
                        onclick="biasCalendarView.toggleTrack('${cb.id}')" 
                        title="${isTracked ? 'Entfolgen' : 'Auf Radar merken'}">
                  ${isTracked ? '★ Gemerkt' : '☆ Merken'}
                </button>
              </div>

              <!-- Pipeline Stepper -->
              ${cb.sourceName === 'MusicBrainz' ? `<p class="section-note">${esc(getDaysUntil(cb.date))} · Veröffentlichungsdatum laut Quelle</p>` : `<div class="pipeline-stepper">
                <div class="step ${pipelineStep >= 1 ? 'is-done' : ''}">
                  <span class="step-dot"></span>
                  <span class="step-label">Ankündigung</span>
                </div>
                <div class="step-line ${pipelineStep >= 2 ? 'is-done' : ''}"></div>
                <div class="step ${pipelineStep >= 2 ? 'is-done' : ''}">
                  <span class="step-dot"></span>
                  <span class="step-label">Konzept-Fotos</span>
                </div>
                <div class="step-line ${pipelineStep >= 3 ? 'is-done' : ''}"></div>
                <div class="step ${pipelineStep >= 3 ? 'is-done' : ''}">
                  <span class="step-dot"></span>
                  <span class="step-label">MV-Teaser</span>
                </div>
                <div class="step-line ${pipelineStep >= 4 ? 'is-done' : ''}"></div>
                <div class="step ${pipelineStep >= 4 ? 'is-done' : ''}">
                  <span class="step-dot"></span>
                  <span class="step-label">Release</span>
                </div>
              </div>

              `}
              <p class="cb-desc">${esc(cb.description || '')}</p>

              <div class="cb-footer">
                <div class="cb-tags">
                  ${(cb.genres || []).map(g => `<span class="tag">${esc(g)}</span>`).join('')}
                </div>
                <div class="cb-actions">
                  <button class="btn btn-ghost btn-sm" onclick="biasCalendarView.downloadSingleIcal('${cb.id}')">
                    .ics Kalender
                  </button>
                  ${cb.sourceUrl ? `<a href="${esc(cb.sourceUrl)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Quelle ↗</a>` : ''}
                  ${cb.teaserUrl ? `
                    <a href="${esc(cb.teaserUrl)}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
                      Teaser ↗
                    </a>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="timeline-day-block ${isToday ? 'is-today' : ''}">
            <div class="date-column">
              <span class="day-num">${dt.getDate()}</span>
              <span class="day-meta">${dayName}</span>
              <span class="month-meta">${monthName}</span>
              <span class="countdown-pill">${daysUntil}</span>
            </div>
            <div class="items-column">
              ${itemsHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    toggleTrack(comebackId) {
      biasStore.toggleTrackComeback(comebackId);
      this.updateTimeline();
      const label = document.querySelector('.filter-label');
      if (label) label.textContent = `Nur gemerkte Termine (${biasStore.trackedComebacks.size})`;
    }

    resetFilters() {
      this.activeGenre = 'Alle';
      this.filterTrackedOnly = false;
      const trackedCheckbox = document.getElementById('cal-tracked-only');
      if (trackedCheckbox) trackedCheckbox.checked = false;
      const tabs = document.querySelectorAll('#cal-genre-tabs .tag-tab');
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.genre === 'Alle'));
      this.updateTimeline();
    }

    generateIcsContent(comebacks) {
      const escapeIcs = text => String(text || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
      let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//bias.fm//Korean Music Comeback Radar//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:bias.fm Comeback Radar'
      ];

      comebacks.forEach(cb => {
        const dt = cb.date.replace(/-/g, '');
        ics.push(
          'BEGIN:VEVENT',
          `UID:${cb.id}@bias.fm`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
          `DTSTART;VALUE=DATE:${dt}`,
          `SUMMARY:${escapeIcs(`[Comeback] ${cb.act} - ${cb.title} (${cb.type})`)}`,
          `DESCRIPTION:${escapeIcs(`${cb.description || ''}\nTyp: ${cb.type}\nGenres: ${(cb.genres || []).join(', ')}`)}`,
          'URL:https://bias.fm',
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });

      ics.push('END:VCALENDAR');
      return ics.map(line => {let parts=[],part='';for(const char of line){if(new TextEncoder().encode(part+char).length>73){parts.push(part);part=' '+char;}else part+=char;}parts.push(part);return parts.join('\r\n');}).join('\r\n') + '\r\n';
    }

    downloadIcs(content, filename) {
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    downloadSingleIcal(comebackId) {
      const cb = this.getAllComebacks().find(c => c.id === comebackId);
      if (!cb) return;
      const ics = this.generateIcsContent([cb]);
      this.downloadIcs(ics, `biasfm_${cb.act.toLowerCase().replace(/\s+/g, '_')}_comeback.ics`);
    }

    exportAllIcal() {
      const all = this.filteredComebacks();
      if (!all.length) {biasApp.showToast('Keine Termine für den Export vorhanden.');return;}
      const ics = this.generateIcsContent(all);
      this.downloadIcs(ics, 'biasfm_comeback_radar.ics');
    }
  }

  return new CalendarView();
});
