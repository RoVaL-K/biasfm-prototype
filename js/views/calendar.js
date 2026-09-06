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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
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
    }

    render(container) {
      const allComebacks = this.getAllComebacks();

      container.innerHTML = `
        <div class="view-calendar">
          <div class="view-header">
            <div>
              <h1 class="view-title">Comeback Radar</h1>
              <p class="view-subtitle">Redaktionell gepflegte Pipeline · Teaser, MV-Drops, Release &amp; Promotions</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-ghost" onclick="biasCalendarView.exportAllIcal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Alle als .ics exportieren
              </button>
              <button class="btn btn-accent" onclick="biasApp.navigateTo('curation')">
                + Comeback vorschlagen
              </button>
            </div>
          </div>

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
                <input type="checkbox" id="cal-tracked-only" ${this.filterTrackedOnly ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
              <span class="filter-label">Nur getrackte Biases (${biasStore.trackedComebacks.size})</span>
            </div>
          </div>

          <!-- Timeline Container -->
          <div class="timeline-container" id="timeline-container"></div>
        </div>
      `;

      this.attachEvents(container);
      this.updateTimeline();
    }

    getAllComebacks() {
      const standard = BIAS_DATA.comebacks || [];
      const custom = biasStore.customComebacks || [];
      return [...custom, ...standard].sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    attachEvents(container) {
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

    updateTimeline() {
      const container = document.getElementById('timeline-container');
      if (!container) return;

      let list = this.getAllComebacks();

      if (this.filterTrackedOnly) {
        list = list.filter(cb => biasStore.isTracked(cb.id));
      }

      if (this.activeGenre !== 'Alle') {
        list = list.filter(cb => (cb.genres || []).some(g => g.includes(this.activeGenre)));
      }

      if (list.length === 0) {
        container.innerHTML = `
          <div class="timeline-empty">
            <p>Keine anstehenden Comebacks für diese Filterkombination.</p>
            <button class="btn btn-ghost btn-sm" onclick="biasCalendarView.resetFilters()">Filter zurücksetzen</button>
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
                  <span class="cb-type-badge">${esc(cb.type)}</span>
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
              <div class="pipeline-stepper">
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

              <p class="cb-desc">${esc(cb.description || '')}</p>

              <div class="cb-footer">
                <div class="cb-tags">
                  ${(cb.genres || []).map(g => `<span class="tag">${esc(g)}</span>`).join('')}
                </div>
                <div class="cb-actions">
                  <button class="btn btn-ghost btn-sm" onclick="biasCalendarView.downloadSingleIcal('${cb.id}')">
                    .ics Kalender
                  </button>
                  ${cb.teaserUrl ? `
                    <a href="${cb.teaserUrl}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
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
          `DTSTAMP:${dt}T000000Z`,
          `DTSTART;VALUE=DATE:${dt}`,
          `SUMMARY:[Comeback] ${cb.act} - ${cb.title} (${cb.type})`,
          `DESCRIPTION:${cb.description || ''}\\nTyp: ${cb.type}\\nGenres: ${(cb.genres || []).join(', ')}`,
          'URL:https://bias.fm',
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });

      ics.push('END:VCALENDAR');
      return ics.join('\r\n');
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
      const all = this.getAllComebacks();
      const ics = this.generateIcsContent(all);
      this.downloadIcs(ics, 'biasfm_comeback_radar.ics');
    }
  }

  return new CalendarView();
});
