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
      this.viewMode="agenda";
      this.month=biasCore.koreaDate().slice(0,7);
      this.selectedDay=biasCore.koreaDate();
      this.agendaStart=biasCore.koreaDate();
      this.agendaDays=14;
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
                In meinen Kalender
              </button>
              <button class="btn btn-accent" onclick="biasCalendarView.proposeRelease()">
                + Release vorschlagen
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

          <div class="source-tabs" aria-label="Radar-Ansicht"><button class="source-tab ${this.viewMode==='agenda'?'is-active':''}" aria-pressed="${this.viewMode==='agenda'}" onclick="biasCalendarView.setView('agenda')">Agenda</button><button class="source-tab ${this.viewMode==='calendar'?'is-active':''}" aria-pressed="${this.viewMode==='calendar'}" onclick="biasCalendarView.setView('calendar')">Kalender</button></div><label class="archive-filter" ${this.viewMode==='calendar'?'hidden':''}><input type="checkbox" id="cal-archive" ${this.showArchive ? 'checked' : ''}> Vergangene Termine anzeigen</label>
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
      box.innerHTML=`<div><b>${this.loadingReleases?'Releases werden geladen …':`${this.remoteReleases.length} Releases · MusicBrainz & Redaktion`}</b>${this.releaseWarning?`<p role="status">${esc(this.releaseWarning)}</p>`:''}<details><summary>Quelle & Abdeckung</summary><p>MusicBrainz: Katalog-Künstler, letzte und nächste 90 Tage. Keine vollständige Liste aller Comebacks.${this.releaseLimited?' Die Quelle liefert nur die ersten 100 Suchtreffer.':''}</p><small>${this.releaseFetchedAt?'Abgerufen '+new Date(this.releaseFetchedAt).toLocaleString('de-DE'):'Noch keine externen Daten geladen.'}</small></details></div><button class="btn btn-ghost btn-sm" id="refresh-releases" ${this.loadingReleases?'disabled':''}>Aktualisieren</button>`;
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

    agendaComebacks() {
      const agendaEnd=this.addDays(this.agendaStart,this.agendaDays-1);
      return this.filteredComebacks().filter(cb=>cb.date<=agendaEnd && (this.showArchive || cb.date>=this.agendaStart));
    }

    setView(mode) {this.viewMode=mode;this.render(document.getElementById('main-content'));}
    addDays(dateString,amount) {const d=new Date(`${dateString}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
    moveAgenda(delta) {this.agendaStart=this.addDays(this.agendaStart,delta*7);this.updateTimeline();}
    agendaToday() {this.agendaStart=biasCore.koreaDate();this.showArchive=false;const archive=document.getElementById('cal-archive');if(archive)archive.checked=false;this.updateTimeline();}
    moveMonth(delta) {const [y,m]=this.month.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));this.month=d.toISOString().slice(0,7);this.selectedDay=this.month+'-01';this.updateTimeline();}
    card(cb) {
      const tracked=biasStore.isTracked(cb.id);
      const updateCount=(cb.events || []).filter(e=>e.date&&e.title).length;
      return `<article class="comeback-card compact-release"><div class="release-main">${biasUI.cover(cb.title,cb.act)}<div class="release-copy"><span class="pill pill-muted">${esc(cb.type)}</span><h3>${esc(cb.act)} <span class="section-note">${esc(cb.actHangul || '')}</span></h3><p>„${esc(cb.title)}“</p><small>${esc(cb.sourceName || 'Persönlicher Termin')} · ${(cb.genres || []).map(esc).join(' · ')}</small>${updateCount?`<span class="event-count">${updateCount} bestätigte Updates</span>`:''}</div><button class="track-btn ${tracked?'is-active':''}" aria-pressed="${tracked}" onclick="biasCalendarView.toggleTrack('${cb.id}')">${tracked?'★ Gemerkt':'☆ Merken'}</button></div><div class="release-actions"><button class="btn btn-ghost" onclick="biasCalendarView.openDetails('${cb.id}')">Details & Links →</button><button class="btn btn-ghost" onclick="biasCalendarView.openSingleExport('${cb.id}')">In meinen Kalender</button></div></article>`;
    }
    openDetails(id) {
      const cb=this.getAllComebacks().find(c=>c.id===id);if(!cb)return;
      const events=(cb.events || []).filter(e=>e.date&&e.title);
      const query=encodeURIComponent(cb.act+' '+cb.title);
      const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):'';}catch{return '';}};
      const source=safeLink(cb.sourceUrl),teaser=safeLink(cb.teaserUrl);
      biasModals.createModalContainer(`<div class="modal-header"><p class="hero-eyebrow">${esc(cb.type)} · ${esc(cb.date)}</p><h2>${esc(cb.act)} — ${esc(cb.title)}</h2></div><div class="modal-section"><p>${esc(cb.description || '')}</p><h3>Bestätigte Termine</h3><ul>${events.map(e=>`<li>${esc(e.date)} · ${esc(e.title)}</li>`).join('')}<li>${esc(cb.date)} · Release</li></ul>${source?`<a href="${source}" target="_blank" rel="noopener">Quelle öffnen ↗</a>`:'<p class="section-note">Persönlicher Termin – keine öffentliche Bestätigung hinterlegt.</p>'}${teaser?`<p><a href="${teaser}" target="_blank" rel="noopener">Teaser ansehen ↗</a></p>`:''}</div><div class="modal-section"><h3>Beim Anbieter suchen</h3><div class="import-actions"><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://open.spotify.com/search/${query}">Spotify ↗</a><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://music.apple.com/search?term=${query}">Apple Music ↗</a><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${query}">YouTube ↗</a></div></div>`);
    }
    proposeRelease() {
      biasModals.createModalContainer('<div class="modal-header"><h2>Ein Release vorschlagen</h2><p>Öffentliche Vorschläge benötigen ein bestätigtes Konto und werden vor der Veröffentlichung geprüft. Die Konto-Einreichung ist noch nicht freigeschaltet.</p></div><div class="modal-section"><p>Du kannst schon jetzt einen persönlichen Termin mit Quellenlink speichern. Er bleibt auf deinem Gerät und wird nicht öffentlich eingereicht.</p><button class="btn btn-accent" id="personal-release">Persönlichen Termin anlegen</button></div>');
      document.getElementById('personal-release').onclick=()=>{biasModals.closeCurrentModal();biasApp.navigateTo('curation');};
    }
    calendarEntries() {return this.getAllComebacks().filter(cb=>(!this.filterTrackedOnly||biasStore.isTracked(cb.id))&&(this.activeGenre==='Alle'||(cb.genres||[]).some(g=>this.activeGenre==='R&B'?/R&B|Hiphop/i.test(g):this.activeGenre==='Indie'?/Indie|Rock/i.test(g):g.includes(this.activeGenre))));}
    updateTimeline() {
      const container=document.getElementById('timeline-container');if(!container)return;
      const list=this.viewMode==='agenda' ? this.agendaComebacks() : this.filteredComebacks();
      if(this.viewMode==='calendar') {
        // A calendar must also expose past days of its selected month; all other filters still apply.
        const entries=this.calendarEntries();
        const [y,m]=this.month.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1)),offset=(first.getUTCDay()+6)%7;
        const label=first.toLocaleDateString('de-DE',{month:'long',year:'numeric',timeZone:'UTC'});
        container.innerHTML=`<div class="calendar-controls"><button class="btn btn-ghost" aria-label="Vorheriger Monat" onclick="biasCalendarView.moveMonth(-1)">‹</button><h2>${label}</h2><button class="btn btn-ghost" onclick="biasCalendarView.month=biasCore.koreaDate().slice(0,7);biasCalendarView.selectedDay=biasCore.koreaDate();biasCalendarView.updateTimeline()">Heute</button><button class="btn btn-ghost" aria-label="Nächster Monat" onclick="biasCalendarView.moveMonth(1)">›</button></div><div class="month-grid">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>`<span class="weekday">${d}</span>`).join('')}${Array.from({length:42},(_,i)=>{const day=new Date(Date.UTC(y,m-1,1-offset+i)).toISOString().slice(0,10),items=entries.filter(cb=>cb.date===day);return `<button class="calendar-day ${day.startsWith(this.month)?'':'outside-month'} ${day===this.selectedDay?'is-selected':''}" aria-pressed="${day===this.selectedDay}" aria-label="${day}, ${items.length} Releases" data-day="${day}"><b>${Number(day.slice(-2))}</b>${items.slice(0,2).map(cb=>`<span>${esc(cb.act)}</span>`).join('')}${items.length>2?`<small>+${items.length-2} weitere</small>`:''}</button>`;}).join('')}</div><section class="calendar-day-detail" aria-live="polite"><h2>${new Date(this.selectedDay+'T12:00:00').toLocaleDateString('de-DE',{day:'numeric',month:'long'})}</h2>${entries.filter(cb=>cb.date===this.selectedDay).map(cb=>this.card(cb)).join('') || '<p>Keine Releases für diesen Tag.</p>'}</section>`;
        container.querySelectorAll('[data-day]').forEach(button=>button.onclick=()=>{this.selectedDay=button.dataset.day;this.updateTimeline();container.querySelector(`[data-day="${this.selectedDay}"]`)?.focus({preventScroll:true});container.querySelector('.calendar-day-detail').scrollIntoView({block:'nearest'});});return;
      }
      const agendaEnd=this.addDays(this.agendaStart,this.agendaDays-1);
      const startLabel=new Date(`${this.agendaStart}T12:00:00Z`).toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'});
      const endLabel=new Date(`${agendaEnd}T12:00:00Z`).toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'});
      const controls=`<div class="agenda-controls"><button class="btn btn-ghost" aria-label="Vorherige Agenda-Woche" onclick="biasCalendarView.moveAgenda(-1)">‹</button><h2>${startLabel} – ${endLabel}</h2><button class="btn btn-ghost" onclick="biasCalendarView.agendaToday()">Heute</button><button class="btn btn-ghost" aria-label="Nächste Agenda-Woche" onclick="biasCalendarView.moveAgenda(1)">›</button></div>`;
      if(!list.length){container.innerHTML=controls+'<div class="timeline-empty"><h2>Hier ist noch Platz für Vorfreude.</h2><p>Keine Termine in diesen 14 Tagen. Vergangene Releases und persönliche Termine kannst du ebenfalls ansehen.</p><button class="btn btn-ghost" onclick="biasCalendarView.resetFilters()">Filter zurücksetzen</button><a class="btn btn-ghost" href="#curation">Persönlichen Termin hinzufügen</a></div>';return;}
      const dates=[...new Set(list.map(cb=>cb.date))];
      container.innerHTML=controls+dates.map(date=>`<section class="timeline-day-block"><div class="date-column"><span class="day-num">${Number(date.slice(-2))}</span><span class="month-meta">${new Date(date+'T12:00:00').toLocaleDateString('de-DE',{weekday:'short',month:'short',year:'numeric'})}</span><small>${getDaysUntil(date)}</small></div><div class="items-column">${list.filter(cb=>cb.date===date).map(cb=>this.card(cb)).join('')}</div></section>`).join('');
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
          `DESCRIPTION:${escapeIcs(`${cb.description || ''}\nTyp: ${cb.type}\nGenres: ${(cb.genres || []).join(', ')}${cb.sourceUrl?`\nQuelle: ${cb.sourceUrl}`:''}${cb.teaserUrl?`\nTeaser: ${cb.teaserUrl}`:''}`)}`,
          `URL:${location.origin}${location.pathname}#kalender`,
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
      const all = this.viewMode==='calendar'?this.calendarEntries().filter(cb=>cb.date.startsWith(this.month)):this.agendaComebacks();
      if (!all.length) {biasApp.showToast('Keine Termine für den Export vorhanden.');return;}
      this.openCalendarExport(all);
    }

    openSingleExport(id) {
      const cb=this.getAllComebacks().find(item=>item.id===id);if(cb)this.openCalendarExport([cb]);
    }

    openCalendarExport(items) {
      this.exportItems=items;
      const first=items[0];
      const query=encodeURIComponent(`${first.act} – ${first.title}`);
      const details=encodeURIComponent(`${first.description || ''}\nQuelle: ${first.sourceUrl || 'bias.fm'}\n${location.origin}${location.pathname}#kalender`);
      const date=String(first.date).replace(/-/g,'');
      const endDate=this.addDays(first.date,1).replace(/-/g,'');
      const google=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${query}&dates=${date}/${endDate}&details=${details}`;
      const modal=biasModals.createModalContainer(`<div class="modal-header"><h2>In meinen Kalender</h2><p>${items.length===1?`${esc(first.act)} — ${esc(first.title)}`:`${items.length} Radar-Termine`} als Kalendertermin übernehmen.</p></div><div class="modal-section"><div class="import-actions"><a class="btn btn-ghost" href="${google}" target="_blank" rel="noopener">Google Calendar ↗</a><button class="btn btn-ghost" id="export-ics-file">Apple / Outlook · Datei</button></div><p class="section-note">Apple Calendar und Outlook öffnen die heruntergeladene .ics-Datei. Quelle und bias.fm-Detailseite sind im Termin vermerkt.</p></div>`);
      modal.querySelector('#export-ics-file').onclick=()=>{this.downloadIcs(this.generateIcsContent(items),items.length===1?`biasfm_${first.act.toLowerCase().replace(/\s+/g,'_')}_comeback.ics`:'biasfm_comeback_radar.ics');biasModals.closeCurrentModal();};
    }
  }

  return new CalendarView();
});
