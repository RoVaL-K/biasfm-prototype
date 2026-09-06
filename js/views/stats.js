(function(root) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  class StatsView {
    constructor() { this.result = null; this.period='12month';this.topLimit=10; this.provider = 'lastfm'; this.username = ''; this.error = ''; this.loading = false; }
    render(container) {
      const r = this.result;
      container.innerHTML = `<div class="view-stats">
        <div class="view-header"><div><div class="pill-row"><span class="pill pill-accent">Deine Musik in Zahlen</span></div><h1 class="view-title">Dein Korea-Mix</h1><p class="view-subtitle">Deine Musik, eingeordnet. Sieh dir eine öffentliche Hörhistorie an und entdecke ihre koreanischen Artists.</p></div>${r?.totalScrobbles ? '<button class="btn btn-accent" id="share-stats">Ergebnis teilen</button>' : ''}</div>
        <div class="stats-card import-card">${!r?'<h2>Mit einer Hörhistorie anfangen</h2><p class="section-note">Eine öffentliche Profilabfrage bestätigt nicht, dass dir das Konto gehört. Die Daten werden nicht als deine öffentliche Identität übernommen.</p>':''}<form id="listening-form" class="studio-form">
          <div class="form-grid-2"><div class="form-group"><label for="listening-provider" class="form-label">Musikprofil</label><select id="listening-provider" class="select-input"><option value="lastfm" ${this.provider === 'lastfm' ? 'selected' : ''}>Last.fm (empfohlen)</option><option value="listenbrainz" ${this.provider === 'listenbrainz' ? 'selected' : ''}>ListenBrainz</option></select></div><div class="form-group"><label for="listening-username" class="form-label">Öffentlicher Nutzername</label><input id="listening-username" class="text-input" value="${esc(this.username)}" maxlength="64" required autocomplete="username" placeholder="Dein Nutzername"></div></div>
          <p class="section-note">ListenBrainz: bis zu 1.000 zuletzt übermittelte Plays. Last.fm: gewählter Zeitraum, sobald der Betreiber den Zugang eingerichtet hat.</p>
          ${this.provider==='lastfm'?`<div class="form-group"><label for="listening-period">Zeitraum</label><select id="listening-period" class="select-input">${[['7day','7 Tage'],['1month','1 Monat'],['3month','3 Monate'],['12month','1 Jahr'],['overall','Gesamter Verlauf']].map(([id,label])=>`<option value="${id}" ${this.period===id?'selected':''}>${label}</option>`).join('')}</select></div>`:''}<div class="import-actions"><button class="btn btn-accent" type="submit" ${this.loading ? 'disabled' : ''}>${this.loading ? 'Hörhistorie wird geladen …' : r ? 'Daten aktualisieren' : 'Öffentliche Historie ansehen'}</button>${this.loading ? '<button type="button" class="btn btn-ghost" id="cancel-import">Abbrechen</button>' : ''}${r ? '<button type="button" class="btn btn-ghost" id="clear-stats">Ergebnis entfernen</button>' : ''}</div>
          <p role="status" class="section-note">${this.loading ? 'Deine Daten werden beim ausgewählten Dienst abgefragt. Das kann einen Moment dauern.' : 'Das Ergebnis bleibt nur für diese Sitzung geöffnet. Deine Zugangsdaten werden nicht benötigt.'}</p>
          ${this.error ? `<div role="alert" class="inline-error">${esc(this.error)}</div>` : ''}
        </form><details class="section-note"><summary>Warum kein Spotify-Pflichtlogin?</summary><p>Eine Spotify-Anmeldung liefert nicht automatisch deinen vollständigen Hörverlauf. Für die Statistik nutzen wir öffentliche Scrobbles von Last.fm oder ListenBrainz. Die Spotify-Verbindung in deinen Einstellungen ist für Profil und Playlists gedacht.</p></details><section class="history-file-import" aria-labelledby="history-import-title"><h3 id="history-import-title">Spotify-Hörhistorie importieren</h3><p class="section-note">Wähle JSON-Dateien oder ein ZIP aus dem Spotify-Privacy-Export. Die Datei wird nur lokal verarbeitet und nicht hochgeladen.</p><div class="inline-form"><input type="file" id="history-file" accept=".json,.zip,application/json,application/zip" class="text-input"><button type="button" class="btn btn-ghost" id="history-import-btn">Datei auswerten</button></div><progress id="history-import-progress" class="history-import-progress" max="1" hidden aria-label="Spotify-Datei wird ausgewertet"></progress><p id="history-import-status" class="section-note" role="status">Unterstützt Spotify Extended History mit <code>master_metadata_…</code>-Feldern.</p></section></div>
        ${r ? this.renderResult(r) : `<div class="stats-empty"><span class="stats-empty-icon">◌</span><h2>Dein Hörprofil wartet auf dich.</h2><p>Nach dem Import siehst du erkannte koreanische Künstler, ihre Plays und die Genre-Verteilung.</p><a class="btn btn-ghost" href="#catalog">Den Katalog entdecken →</a></div>`}
      </div>`;
      container.querySelector('#listening-form').addEventListener('submit', e => this.handleConnect(e));
      container.querySelector('#listening-provider').addEventListener('change', e => {this.provider = e.target.value;this.render(container);});
      container.querySelector('#listening-username').addEventListener('input', e => {this.username = e.target.value;});
      container.querySelector('#listening-period')?.addEventListener('change',e=>{this.period=e.target.value;});
      container.querySelector('#stats-top-limit')?.addEventListener('change',e=>{this.topLimit=Number(e.target.value);this.render(container);});
      container.querySelector('#share-stats')?.addEventListener('click', () => this.openShareCard());
      container.querySelector('#clear-stats')?.addEventListener('click', () => {this.result = null; this.error = ''; this.render(container);});
      container.querySelector('#cancel-import')?.addEventListener('click', () => this.controller?.abort());
      container.querySelector('#history-import-btn')?.addEventListener('click', () => this.handleFileImport(container));
    }
    renderResult(r) {
      if (!r.totalScrobbles) return '<div class="stats-empty"><h2>Noch keine Plays vorhanden.</h2><p>Für dieses Profil liefert der Dienst im ausgewählten Zeitraum keine Hörhistorie.</p></div>';
      const providerLabel=r.provider==='lastfm'?'Last.fm':r.provider==='listenbrainz'?'ListenBrainz':'Spotify-Dateiimport';
      return `<div class="view-header"><div><h2>@${esc(r.username)}</h2><p class="view-subtitle">${providerLabel} · ${esc(r.periodLabel)} · Geladen ${new Date(r.fetchedAt).toLocaleString('de-DE')}${r.importedRows?` · ${r.importedRows.toLocaleString('de-DE')} lokale Einträge`:''}</p></div></div>
        <div class="stats-dashboard-grid"><div class="stats-card main-donut-card"><h3 class="stats-card-title">Dein Korea-Mix</h3><div class="donut-presentation"><div class="donut-graphic"><svg width="140" height="140" viewBox="0 0 140 140" aria-label="${r.koreaShare} Prozent erkannt" role="img"><circle cx="70" cy="70" r="54" fill="none" stroke="var(--line)" stroke-width="14"/><circle cx="70" cy="70" r="54" fill="none" stroke="var(--bias)" stroke-width="14" stroke-dasharray="339.3" stroke-dashoffset="${339.3*(1-r.koreaShare/100)}" transform="rotate(-90 70 70)"/></svg><div class="donut-center-text"><span class="pct-val">${r.koreaShare}%</span><span class="pct-lbl">Erkannt</span></div></div><div class="donut-legend"><div class="legend-row">Koreanisch zugeordnet <b>${r.koreaScrobbles.toLocaleString('de-DE')}</b></div><div class="legend-row">Nicht zugeordnet <b>${r.unmatchedScrobbles.toLocaleString('de-DE')}</b></div><div class="legend-row total-row">Analysierte Plays <b>${r.totalScrobbles.toLocaleString('de-DE')}</b></div></div></div><p class="section-note">Abgleich mit ${BIAS_DATA.artists.length} Künstlern im bias.fm-Katalog anhand von Namen und Aliasen. Nicht zugeordnete Plays können weitere koreanische Musik enthalten. Der Wert ist eine katalogbasierte Schätzung innerhalb der geladenen Daten. Soweit verfügbar werden eindeutige MusicBrainz-IDs genutzt; Zuordnungen nur anhand von Namen können bei Namensgleichheit ungenau sein.</p></div>
        <div class="stats-side-col"><div class="stats-card"><h3 class="stats-card-title">Erkannte Top Artists</h3><label for="stats-top-limit" class="section-note">Anzahl</label><select id="stats-top-limit" class="select-input">${[10,20,50].map(n=>`<option ${n===this.topLimit?'selected':''}>${n}</option>`).join('')}</select>${r.topArtists.length ? r.topArtists.slice(0,this.topLimit).map((a,i) => `<div class="art-bar-row"><div class="art-bar-meta"><button class="text-action" data-stats-artist="${esc(a.id)}">${i+1}. ${esc(a.name)}</button><span>${a.plays.toLocaleString('de-DE')} Plays</span></div><div class="progress-track"><div class="progress-fill" title="${Math.round(a.plays/r.topArtists[0].plays*100)} % der Plays deines meistgehörten erkannten Artists" style="width:${a.plays/r.topArtists[0].plays*100}%;background:var(--bias)"></div></div></div>`).join('') : '<p>Kein Künstler aus dem Katalog erkannt.</p>'}</div><div class="stats-card"><h3 class="stats-card-title">Genres der zugeordneten Plays</h3>${r.topKoreanGenres.map(g => `<div class="legend-row"><span>${esc(g.label)}</span><b>${g.pct}%</b></div>`).join('') || '<p>Noch keine Zuordnung möglich.</p>'}</div></div></div>`;
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
        this.result = await biasApi.request(`api/listening?${new URLSearchParams({provider:this.provider,username:this.username,period:this.period})}`,{signal:this.controller.signal});
      } catch(err) { this.error = err.name === 'AbortError' ? 'Import abgebrochen. Du kannst ihn jederzeit neu starten.' : err.message; }
      finally {clearTimeout(timeout);this.loading = false;if (biasApp.currentRoute === 'stats') this.render(container);}
    }
    async handleFileImport(container) {
      const input=container.querySelector('#history-file'),status=container.querySelector('#history-import-status'),button=container.querySelector('#history-import-btn'),progress=container.querySelector('#history-import-progress');
      const file=input?.files?.[0];
      if(!file){status.textContent='Bitte zuerst eine .json- oder .zip-Datei auswählen.';status.classList.add('inline-error');return;}
      button.disabled=true;progress.hidden=false;progress.removeAttribute('value');status.classList.remove('inline-error');status.textContent='Datei wird lokal gelesen …';
      try {
        const parsed=await biasSpotifyImport.read(file);
        const result=biasCore.summarizeListening(parsed.rows,{provider:'spotify-import',username:'Lokaler Spotify-Import',periodLabel:'Spotify Extended History',sample:false,importedFile:file.name,importedRows:parsed.rows.length,skippedRows:parsed.skipped});
        if(!result.totalScrobbles)throw new Error('In der Datei wurden keine abspielbaren Titel gefunden.');
        this.result=result;this.error='';this.username='';
        biasApp.showToast(`${parsed.rows.length.toLocaleString('de-DE')} Spotify-Einträge lokal ausgewertet.`);
        this.render(container);
      } catch(error) {status.textContent=error.message;status.classList.add('inline-error');}
      finally {button.disabled=false;if(progress?.isConnected)progress.hidden=true;}
    }
    openShareCard() {if(this.result?.totalScrobbles) biasModals.openShareCardModal(this.result);}
  }
  root.biasStatsView = new StatsView();
  document.addEventListener('click', e => {const button=e.target.closest('[data-stats-artist]');if(button) biasModals.openArtistModal(button.dataset.statsArtist);});
})(window);
