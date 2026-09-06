(function(root) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  class StatsView {
    constructor() { this.result = null; this.provider = 'listenbrainz'; this.username = ''; this.error = ''; this.loading = false; }
    render(container) {
      const r = this.result;
      container.innerHTML = `<div class="view-stats">
        <div class="view-header"><div><div class="pill-row"><span class="pill pill-accent">Deine Musik in Zahlen</span></div><h1 class="view-title">Wie viel Korea steckt in deinem Hören?</h1><p class="view-subtitle">Lade die öffentliche Hörhistorie deines Profils. Ohne Passwort.</p></div>${r?.totalScrobbles ? '<button class="btn btn-accent" id="share-stats">Ergebnis teilen</button>' : ''}</div>
        <div class="stats-card import-card"><form id="listening-form" class="studio-form">
          <div class="form-grid-2"><div class="form-group"><label for="listening-provider" class="form-label">Musikprofil</label><select id="listening-provider" class="select-input"><option value="listenbrainz" ${this.provider === 'listenbrainz' ? 'selected' : ''}>ListenBrainz</option><option value="lastfm" ${this.provider === 'lastfm' ? 'selected' : ''}>Last.fm</option></select></div><div class="form-group"><label for="listening-username" class="form-label">Öffentlicher Nutzername</label><input id="listening-username" class="text-input" value="${esc(this.username)}" maxlength="64" required autocomplete="username" placeholder="Dein Nutzername"></div></div>
          <p class="section-note">ListenBrainz: bis zu 1.000 zuletzt übermittelte Plays. Last.fm: letzte 12 Monate, sobald der Betreiber den Zugang eingerichtet hat.</p>
          <div class="import-actions"><button class="btn btn-accent" type="submit" ${this.loading ? 'disabled' : ''}>${this.loading ? 'Hörhistorie wird geladen …' : r ? 'Daten aktualisieren' : 'Hörhistorie laden'}</button>${this.loading ? '<button type="button" class="btn btn-ghost" id="cancel-import">Abbrechen</button>' : ''}${r ? '<button type="button" class="btn btn-ghost" id="clear-stats">Ergebnis entfernen</button>' : ''}</div>
          <p role="status" class="section-note">${this.loading ? 'Deine Daten werden beim ausgewählten Dienst abgefragt. Das kann einen Moment dauern.' : 'Das Ergebnis bleibt nur für diese Sitzung geöffnet. Deine Zugangsdaten werden nicht benötigt.'}</p>
          ${this.error ? `<div role="alert" class="inline-error">${esc(this.error)}</div>` : ''}
        </form></div>
        ${r ? this.renderResult(r) : `<div class="stats-empty"><span class="stats-empty-icon">◌</span><h2>Dein Hörprofil wartet auf dich.</h2><p>Nach dem Import siehst du erkannte koreanische Künstler, ihre Plays und die Genre-Verteilung.</p><a class="btn btn-ghost" href="#catalog">Den Katalog entdecken →</a></div>`}
      </div>`;
      container.querySelector('#listening-form').addEventListener('submit', e => this.handleConnect(e));
      container.querySelector('#listening-provider').addEventListener('change', e => {this.provider = e.target.value;});
      container.querySelector('#listening-username').addEventListener('input', e => {this.username = e.target.value;});
      container.querySelector('#share-stats')?.addEventListener('click', () => this.openShareCard());
      container.querySelector('#clear-stats')?.addEventListener('click', () => {this.result = null; this.error = ''; this.render(container);});
      container.querySelector('#cancel-import')?.addEventListener('click', () => this.controller?.abort());
    }
    renderResult(r) {
      if (!r.totalScrobbles) return '<div class="stats-empty"><h2>Noch keine Plays vorhanden.</h2><p>Für dieses Profil liefert der Dienst im ausgewählten Zeitraum keine Hörhistorie.</p></div>';
      return `<div class="view-header"><div><h2>@${esc(r.username)}</h2><p class="view-subtitle">${esc(r.provider === 'lastfm' ? 'Last.fm' : 'ListenBrainz')} · ${esc(r.periodLabel)} · Geladen ${new Date(r.fetchedAt).toLocaleString('de-DE')}</p></div></div>
        <div class="stats-dashboard-grid"><div class="stats-card main-donut-card"><h3 class="stats-card-title">Katalogbasierter Korea-Anteil</h3><div class="donut-presentation"><div class="donut-graphic"><svg width="140" height="140" viewBox="0 0 140 140" aria-label="${r.koreaShare} Prozent erkannt" role="img"><circle cx="70" cy="70" r="54" fill="none" stroke="var(--line)" stroke-width="14"/><circle cx="70" cy="70" r="54" fill="none" stroke="var(--bias)" stroke-width="14" stroke-dasharray="339.3" stroke-dashoffset="${339.3*(1-r.koreaShare/100)}" transform="rotate(-90 70 70)"/></svg><div class="donut-center-text"><span class="pct-val">${r.koreaShare}%</span><span class="pct-lbl">Erkannt</span></div></div><div class="donut-legend"><div class="legend-row">Koreanisch zugeordnet <b>${r.koreaScrobbles.toLocaleString('de-DE')}</b></div><div class="legend-row">Nicht zugeordnet <b>${r.unmatchedScrobbles.toLocaleString('de-DE')}</b></div><div class="legend-row total-row">Analysierte Plays <b>${r.totalScrobbles.toLocaleString('de-DE')}</b></div></div></div><p class="section-note">Abgleich mit ${BIAS_DATA.artists.length} Künstlern im bias.fm-Katalog anhand von Namen und Aliasen. Nicht zugeordnete Plays können weitere koreanische Musik enthalten. Der Wert ist eine katalogbasierte Schätzung innerhalb der geladenen Daten. Soweit verfügbar werden eindeutige MusicBrainz-IDs genutzt; Zuordnungen nur anhand von Namen können bei Namensgleichheit ungenau sein.</p></div>
        <div class="stats-side-col"><div class="stats-card"><h3 class="stats-card-title">Deine erkannten Top Artists</h3>${r.topArtists.length ? r.topArtists.slice(0,10).map((a,i) => `<div class="art-bar-row"><div class="art-bar-meta"><button class="text-action" data-stats-artist="${esc(a.id)}">${i+1}. ${esc(a.name)}</button><span>${a.plays.toLocaleString('de-DE')} Plays</span></div><div class="progress-track"><div class="progress-fill" style="width:${a.plays/r.topArtists[0].plays*100}%;background:var(--bias)"></div></div></div>`).join('') : '<p>Kein Künstler aus dem Katalog erkannt.</p>'}</div><div class="stats-card"><h3 class="stats-card-title">Genres der zugeordneten Plays</h3>${r.topKoreanGenres.map(g => `<div class="legend-row"><span>${esc(g.label)}</span><b>${g.pct}%</b></div>`).join('') || '<p>Noch keine Zuordnung möglich.</p>'}</div></div></div>`;
    }
    async handleConnect(e) {
      e.preventDefault();
      if (this.loading) return;
      this.username = document.getElementById('listening-username').value.trim();
      this.provider = document.getElementById('listening-provider').value;
      if (!this.username) return;
      this.loading = true; this.error = ''; this.controller = new AbortController();
      const container = document.getElementById('main-content');
      this.render(container);
      const timeout = setTimeout(() => this.controller.abort(), 120000);
      try {
        const response = await fetch(`api/listening?${new URLSearchParams({provider:this.provider,username:this.username})}`,{signal:this.controller.signal});
        if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Der Datenimport ist auf diesem Hosting noch nicht eingerichtet. Bitte öffne die Website über den bias.fm-Server.');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Import fehlgeschlagen. Bitte erneut versuchen.');
        this.result = result;
      } catch(err) { this.error = err.name === 'AbortError' ? 'Import abgebrochen. Du kannst ihn jederzeit neu starten.' : err.message; }
      finally {clearTimeout(timeout);this.loading = false;if (biasApp.currentRoute === 'stats') this.render(container);}
    }
    openShareCard() {if(this.result?.totalScrobbles) biasModals.openShareCardModal(this.result);}
  }
  root.biasStatsView = new StatsView();
  document.addEventListener('click', e => {const button=e.target.closest('[data-stats-artist]');if(button) biasModals.openArtistModal(button.dataset.statsArtist);});
})(window);
