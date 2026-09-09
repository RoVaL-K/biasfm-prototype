// js/views/charts.js — Spotify Top 50 & Tidal Hi-Fi Charts Table

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasChartsView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const LIVE_GENRE_OPTIONS = [
    ['k-pop', 'K-Pop / Idol Pop'],
    ['k-rnb', 'K-R&B / Soul'],
    ['k-hiphop', 'K-Hiphop'],
    ['k-indie', 'Indie / Rock / Band'],
    ['k-electronic', 'Electronic / Club'],
    ['k-ballad', 'Ballad / OST'],
    ['k-folk', 'Folk / Acoustic'],
    ['k-jazz', 'Jazz / Experimental'],
    ['trot', 'Trot / Traditional']
  ];

  class ChartsView {
    constructor() {
      this.activeTag = 'Alle';
      this.activeGen = 'Alle';
      this.activeType = 'Alle';
      this.searchQuery = '';
      this.source='community';
      this.pageSize=25;
      this.koreaSource='circle';
      this.liveTag='k-pop';
      this.liveResult=null;
      this.liveError='';
      this.liveLoading=false;
    }

    render(container) {
      const routeSource=location.hash.split('/')[1]?.split('?')[0];
      if(['community','korea','live','catalog'].includes(routeSource))this.source=routeSource;
      if(['community','korea'].includes(this.source)){this.renderOverview(container);return;}
      if(this.source === 'live') {this.renderLive(container);if(!this.liveResult&&!this.liveLoading&&!this.liveError&&typeof fetch==='function')this.loadLive();return;}
      container.innerHTML = `
        <div class="view-charts">
          <!-- Clean View Header without floating search input -->
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Katalog entdecken</span>
                <span class="pill pill-muted">Idol · Indie · R&B · Hiphop</span>
              </div>
              <h1 class="view-title">Songs für deine Sammlung</h1>
              <p class="view-subtitle">Kuratierte Songs, keine Rangliste. Filtere nach Szene und entdecke die Credits.</p>
            </div>
          </div>

          ${this.sourceTabs()}
          <!-- Unified Spotify/Tidal Style Toolbar (Tabs + Search + Generation in one row) -->
          <div class="charts-toolbar-bar">
            <div class="tag-tabs" id="chart-tag-tabs">
              <button class="tag-tab ${this.activeTag === 'Alle' ? 'is-active' : ''}" data-tag="Alle">Alle Genres</button>
              <button class="tag-tab ${this.activeTag === 'Idol' ? 'is-active' : ''}" data-tag="Idol">Idol Pop</button>
              <button class="tag-tab ${this.activeTag === 'Indie' ? 'is-active' : ''}" data-tag="Indie">Indie &amp; Rock</button>
              <button class="tag-tab ${this.activeTag === 'Hiphop / R&B' ? 'is-active' : ''}" data-tag="Hiphop / R&B">Hiphop &amp; R&amp;B</button>
              <button class="tag-tab ${this.activeTag === 'Ballade' ? 'is-active' : ''}" data-tag="Ballade">Ballade &amp; OST</button>
            </div>

            <div class="toolbar-right-controls">
              <div class="chart-search-wrap">
                <input type="text" id="chart-filter-input" placeholder="Titel, Hangul, Artist filtern..." value="${esc(this.searchQuery)}" class="chart-search-input">
              </div>

              <div class="gen-select-wrap" id="gen-wrap" ${this.activeTag==='Idol'?'':'hidden'}>
                <select id="gen-filter" class="select-input chart-gen-select" title="Nach Generation filtern">
                  <option value="Alle" ${this.activeGen === 'Alle' ? 'selected' : ''}>Alle Generationen</option>
                  <option value="4th Gen" ${this.activeGen === '4th Gen' ? 'selected' : ''}>4th Gen (2018–2022)</option>
                  <option value="3rd Gen" ${this.activeGen === '3rd Gen' ? 'selected' : ''}>3rd Gen (2012–2017)</option>
                  <option value="2nd Gen" ${this.activeGen === '2nd Gen' ? 'selected' : ''}>2nd Gen (&lt;2012)</option>

                </select>
              </div>
              <div class="type-select-wrap">
                <label class="sr-only" for="artist-type-filter">Artist-Typ</label>
                <select id="artist-type-filter" class="select-input chart-gen-select" title="Nach Artist-Typ filtern">
                  ${[['Alle','Alle Artists'],['group','Gruppen'],['solo','Solo-Acts'],['band','Bands'],['producer','Producer']].map(([id,label])=>`<option value="${id}" ${this.activeType===id?'selected':''}>${label}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Chart Table List (Spotify / Tidal Style) -->
          <div class="chart-table-wrap">
            <div class="chart-table-head">
              <span class="col-rank">#</span>
              <span>Cover</span>
              <span class="col-title">Titel &amp; Artist</span>
              <span class="col-tags">Tags</span>
              <span class="col-producers">Credits</span>
              <span class="col-plays">Jahr</span>
              <span class="col-actions">Links &amp; Credits</span>
            </div>
            <div id="chart-rows-container" class="chart-rows"></div>
          </div>
        </div>
      `;

      this.attachEvents(container);
      this.updateRows();
    }

    switchSource(source) {
      this.source=source;history.replaceState(null,'',`#charts/${source}`);this.render(document.getElementById('main-content'));
      if(source==='live'&&!this.liveResult)this.loadLive();
    }

    sourceTabs() {return `<div class="source-tabs" aria-label="Chart-Perspektive">${[['community','Community'],['korea','Korea Charts'],['live','Last.fm Signals'],['catalog','Songs']].map(([id,label])=>`<button class="source-tab ${this.source===id?'is-active':''}" aria-pressed="${this.source===id}" onclick="biasChartsView.switchSource('${id}')">${label}</button>`).join('')}</div>`;}
    renderOverview(container) {
      container.innerHTML=`<div class="view-charts"><div class="view-header"><div><p class="hero-eyebrow">Zwei Perspektiven. Klare Quellen.</p><h1 class="view-title">Charts</h1><p class="view-subtitle">Unsere Community und externe Musikcharts bleiben getrennt.</p></div></div>${this.sourceTabs()}<section class="chart-preview"><h2>${this.source==='community'?'Community Charts':'Korea Charts'}</h2>${biasUI.chartEmpty(this.source)}${this.source==='korea'?`<div class="form-group"><label for="korea-chart-source">Quelle</label><select id="korea-chart-source" class="select-input"><option value="circle" ${this.koreaSource==='circle'?'selected':''}>Circle Chart</option><option value="melon" ${this.koreaSource==='melon'?'selected':''}>Melon TOP100</option></select><a id="korea-chart-link" class="btn btn-ghost" target="_blank" rel="noopener">Original-Rangliste öffnen ↗</a></div>`:'<details><summary>Wie die Community Charts entstehen sollen</summary><p>Nur ausdrücklich freigegebene Hörverläufe bestätigter Konten zählen. Doppelte Plays werden bereinigt; Zeitraum, Teilnehmerzahl und Aktualisierung werden je Liste ausgewiesen. Bis diese Daten vorliegen, wird kein Ranking angezeigt.</p></details>'}</section></div>`;
      const select=container.querySelector('#korea-chart-source');if(select){const update=()=>{this.koreaSource=select.value;container.querySelector('#korea-chart-link').href=select.value==='melon'?'https://www.melon.com/chart/index.htm':'https://circlechart.kr/';};select.onchange=update;update();}
    }
    renderLive(container) {
      container.innerHTML=`<div class="view-charts"><div class="view-header"><div><span class="pill pill-accent">Last.fm · Tag-Charts</span><h1 class="view-title">Last.fm Signals</h1><p class="view-subtitle">Die von Last.fm gelieferten Top-Titel pro Genre-Tag. Kein persönliches Ranking und keine Wochenchart.</p></div></div>${this.sourceTabs()}<div class="charts-toolbar-bar"><label>Genre <select id="live-chart-tag" class="select-input">${LIVE_GENRE_OPTIONS.map(([value,label])=>`<option value="${esc(value)}" ${value===this.liveTag?'selected':''}>${esc(label)}</option>`).join('')}</select></label><button id="refresh-live-chart" class="btn btn-ghost" ${this.liveLoading?'disabled':''}>Aktualisieren</button></div>${this.liveLoading?'<div class="stats-empty" role="status"><h2>Charts werden geladen …</h2></div>':this.liveError?`<div class="stats-empty"><h2>Charts gerade nicht verfügbar</h2><p role="alert">${esc(this.liveError)}</p><button class="btn btn-accent" onclick="biasChartsView.loadLive()">Erneut versuchen</button><button class="btn btn-ghost" onclick="biasChartsView.switchSource('catalog')">Katalog entdecken</button></div>`:this.liveResult?`<p class="section-note">Abgerufen ${new Date(this.liveResult.fetchedAt).toLocaleString('de-DE')} · <a href="${esc(this.liveResult.sourceUrl)}" target="_blank" rel="noopener">Quelle: Last.fm ↗</a></p><div class="live-chart-list">${this.liveResult.items.slice(0,this.pageSize).map(song=>`<a class="live-chart-row" href="${esc(song.url)}" target="_blank" rel="noopener"><b class="mono">${song.rank}</b><span class="live-chart-cover-slot" aria-hidden="true"></span><span class="live-chart-copy"><strong>${esc(song.title)}</strong><small class="live-chart-artist">${esc(song.artist)}</small><small class="live-chart-genre">${esc(song.genre || 'Weitere Signale')}</small></span><span>Spotify öffnen ↗</span></a>`).join('') || '<p>Keine Titel für diesen Tag vorhanden.</p>'}</div>${this.liveResult.items.length>this.pageSize?'<button class="btn btn-ghost" id="load-chart-more">25 weitere laden</button>':''}`:''}</div>`;
      container.querySelector('#load-chart-more')?.addEventListener('click',()=>{this.pageSize=Math.min(100,this.pageSize+25);this.renderLive(container);});
      container.querySelector('#live-chart-tag').onchange=e=>{this.liveTag=e.target.value;this.pageSize=25;this.loadLive();};
      container.querySelector('#refresh-live-chart').onclick=()=>this.loadLive();
    }

    async loadLive() {
      if(this.liveLoading)return;this.liveLoading=true;this.liveError='';this.renderLive(document.getElementById('main-content'));
      try{this.liveResult=await biasApi.request('api/charts?tag='+encodeURIComponent(this.liveTag));}
      catch(error){this.liveError=error.message;}
      finally{this.liveLoading=false;if(biasApp.currentRoute==='charts'&&this.source==='live')this.renderLive(document.getElementById('main-content'));}
    }

    attachEvents(container) {
      const tabs = container.querySelectorAll('.tag-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          this.activeTag = tab.dataset.tag;
          if(this.activeTag!=='Idol')this.activeGen='Alle';
          container.querySelector('#gen-wrap').hidden=this.activeTag!=='Idol';
          container.querySelector('#gen-filter').value=this.activeGen;
          this.updateRows();
        });
      });

      const genSelect = container.querySelector('#gen-filter');
      if (genSelect) {
        genSelect.addEventListener('change', (e) => {
          this.activeGen = e.target.value;
          this.updateRows();
        });
      }

      const typeSelect=container.querySelector('#artist-type-filter');
      typeSelect?.addEventListener('change',e=>{this.activeType=e.target.value;this.updateRows();});

      const searchInput = container.querySelector('#chart-filter-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.updateRows();
        });
      }
    }

    updateRows() {
      const container = document.getElementById('chart-rows-container');
      if (!container) return;

      let filtered = [...(BIAS_DATA.songs || [])];

      // Filter by genre tag
      if (this.activeTag !== 'Alle') {
        filtered = filtered.filter(s => {
          if (this.activeTag === 'Hiphop / R&B') {
            return s.genres.includes('R&B') || s.genres.includes('Hiphop');
          }
          if (this.activeTag === 'Indie') return s.genres.some(g => /Indie|Rock/.test(g));
          if (this.activeTag === 'Ballade') return s.genres.some(g => /Ballade|OST/.test(g));
          return s.genres.includes(this.activeTag);
        });
      }

      // Filter by Generation
      if (this.activeGen !== 'Alle') {
        filtered = filtered.filter(s => (s.generation || '').toLowerCase().includes(this.activeGen.toLowerCase()));
      }

      if (this.activeType !== 'Alle') {
        filtered = filtered.filter(s => {
          const artist=(BIAS_DATA.artists || []).find(a=>a.id===s.artistId);
          if (this.activeType === 'producer') return (s.credits?.producers || []).length > 0;
          return artist?.type === this.activeType;
        });
      }

      // Filter by Search Query
      if (this.searchQuery) {
        filtered = filtered.filter(s => 
          s.title.toLowerCase().includes(this.searchQuery) ||
          (s.hangulTitle || '').toLowerCase().includes(this.searchQuery) ||
          s.artistName.toLowerCase().includes(this.searchQuery) ||
          s.album.toLowerCase().includes(this.searchQuery)
        );
      }

      // Sort by plays descending
      filtered.sort((a, b) => b.releaseYear - a.releaseYear || a.title.localeCompare(b.title));

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="chart-empty" style="padding:40px;text-align:center">
            <p>Keine Titel für diesen Filter gefunden.</p>
            <button class="btn btn-ghost btn-sm" onclick="biasChartsView.resetFilters()" style="margin-top:10px">Filter zurücksetzen</button>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map((s, idx) => {
        const deltaHtml = s.rankDelta === null
          ? '<span class="delta-badge is-new">NEU</span>'
          : s.rankDelta === 0
            ? '<span class="delta-badge is-same">–</span>'
            : s.rankDelta > 0
              ? `<span class="delta-badge is-up">▲${s.rankDelta}</span>`
              : `<span class="delta-badge is-down">▼${Math.abs(s.rankDelta)}</span>`;

        const prods = (s.credits.producers || []).join(', ');
        return `
          <article data-song-id="${esc(s.id)}" class="chart-row-item">
            <div class="col-rank">
              <span class="rank-num">${idx + 1}</span>

            </div>

            ${biasUI.cover(s.title,s.artistName)}

            <div class="col-title">
              <div class="track-names">
                <span class="t-main">${esc(s.title)} <span class="t-hangul">${esc(s.hangulTitle)}</span></span>
                <span class="t-sub">
                  <a href="javascript:void(0)" onclick="event.stopPropagation(); biasModals.openArtistModal('${s.artistId}')" class="artist-anchor">
                    ${esc(s.artistName)}
                  </a>
                  <span>·</span>
                  <span>${esc(s.album)}</span>
                </span>
              </div>
            </div>

            <div class="col-tags">
              <div class="pills-stack" style="display:flex;gap:4px;flex-wrap:wrap">
                ${(s.genres || []).slice(0, 2).map(g => `<span class="pill pill-muted">${esc(g)}</span>`).join('')}
              </div>
            </div>

            <div class="col-producers">
              <span class="prod-text" title="Produzent: ${esc(prods)}">Prod. ${esc(prods || '—')}</span>
            </div>

            <div class="col-plays">
              <span class="mono plays-val">${s.releaseYear}</span>
            </div>

            <div class="col-actions">
              <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); biasModals.openSongModal('${s.id}')" title="Song Inspector">
                Credits
              </button>
              ${s.links.spotify ? `
                <a href="${s.links.spotify}" target="_blank" rel="noopener" class="quick-link-btn" title="Auf Spotify öffnen" onclick="event.stopPropagation()">
                  ●
                </a>` : ''}
              ${s.links.apple ? `
                <a href="${s.links.apple}" target="_blank" rel="noopener" class="quick-link-btn" title="Auf Apple Music öffnen" onclick="event.stopPropagation()">
                  
                </a>` : ''}
            </div>
          </article>
        `;
      }).join('');
    }

    resetFilters() {
      this.activeTag = 'Alle';
      this.activeGen = 'Alle';
      this.activeType = 'Alle';
      this.searchQuery = '';
      const input = document.getElementById('chart-filter-input');
      if (input) input.value = '';
      const genSelect = document.getElementById('gen-filter');
      if (genSelect) genSelect.value = 'Alle';
      const typeSelect=document.getElementById('artist-type-filter');
      if(typeSelect)typeSelect.value='Alle';
      const tabs = document.querySelectorAll('.tag-tab');
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tag === 'Alle'));
      this.updateRows();
    }
  }

  return new ChartsView();
});
