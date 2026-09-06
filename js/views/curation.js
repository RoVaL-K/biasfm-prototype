// js/views/curation.js — Editorial & Curation Studio (V1-Infrastruktur nach handover.md)
// Ermöglicht das Einreichen von Comebacks, Alias-Pflege und Auflösung von Scrobble-Duplikaten.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasCurationView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class CurationView {
    constructor() {
      this.activeTab = 'comebacks';
    }

    render(container) {
      container.innerHTML = `
        <div class="view-curation">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">V1-Infrastruktur</span>
                <span class="pill pill-muted">handover.md § 7 #15</span>
              </div>
              <h1 class="view-title">Redaktions- &amp; Curation Studio</h1>
              <p class="view-subtitle">Qualität entsteht durch Pflege: Comebacks eintragen, Hangul-Aliasse matchen und Scrobble-Duplikate bereinigen.</p>
            </div>
          </div>

          <!-- Studio Tabs -->
          <div class="filter-bar">
            <div class="tag-tabs" id="curation-tabs">
              <button class="tag-tab ${this.activeTab === 'comebacks' ? 'is-active' : ''}" data-tab="comebacks">
                Comeback einreichen (${biasStore.customComebacks.length + BIAS_DATA.comebacks.length})
              </button>
              <button class="tag-tab ${this.activeTab === 'aliases' ? 'is-active' : ''}" data-tab="aliases">
                Hangul- &amp; Alias-Pflege (${biasStore.curationAliases.length})
              </button>
              <button class="tag-tab ${this.activeTab === 'duplicates' ? 'is-active' : ''}" data-tab="duplicates">
                Scrobble-Duplikate Queue
              </button>
            </div>
          </div>

          <!-- Studio Content Container -->
          <div id="curation-content-area" class="curation-content"></div>
        </div>
      `;

      this.attachEvents(container);
      this.renderActiveTabContent();
    }

    attachEvents(container) {
      const tabs = container.querySelectorAll('.tag-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          this.activeTab = tab.dataset.tab;
          this.renderActiveTabContent();
        });
      });
    }

    renderActiveTabContent() {
      const area = document.getElementById('curation-content-area');
      if (!area) return;

      if (this.activeTab === 'comebacks') {
        this.renderComebackEditor(area);
      } else if (this.activeTab === 'aliases') {
        this.renderAliasEditor(area);
      } else if (this.activeTab === 'duplicates') {
        this.renderDuplicatesQueue(area);
      }
    }

    // 1. Comeback Submissions Form & List
    renderComebackEditor(area) {
      const customList = biasStore.customComebacks || [];

      area.innerHTML = `
        <div class="curation-split-grid">
          <!-- Form -->
          <div class="curation-box">
            <h3 class="box-title">+ Neues Comeback im Radar erfassen</h3>
            <p class="box-sub">Einträge erscheinen nach dem Speichern sofort im Comeback-Radar und werden in iCal-Exporte integriert.</p>

            <form id="new-comeback-form" class="studio-form" onsubmit="biasCurationView.handleSubmitComeback(event)">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Künstler / Act (Englisch/Romanisiert) *</label>
                  <input type="text" id="cb-act" placeholder="z. B. BIBI, aespa, Zion.T" required class="text-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Name auf Hangul</label>
                  <input type="text" id="cb-hangul" placeholder="z. B. 비비, 에스파" class="text-input">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Release-Titel / Song / Album *</label>
                  <input type="text" id="cb-title" placeholder="Titel TBA oder konkreter Name" required class="text-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Release-Datum *</label>
                  <input type="date" id="cb-date" required class="text-input" value="${new Date().toISOString().slice(0, 10)}">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Release-Typ *</label>
                  <select id="cb-type" class="select-input" required>
                    <option value="Single">Single</option>
                    <option value="Single Album">Single Album</option>
                    <option value="Mini-Album (EP)" selected>Mini-Album (EP)</option>
                    <option value="Studio Album">Studio Album (Full-length)</option>
                    <option value="Repackage">Repackage Album</option>
                    <option value="OST">K-Drama OST</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Genre-Tags (kommagetrennt)</label>
                  <input type="text" id="cb-genres" placeholder="Idol, R&B, Indie, Rock" value="Idol, Pop" class="text-input">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Teaser / Video-Link (optional)</label>
                <input type="url" id="cb-teaser" placeholder="https://youtube.com/watch?v=..." class="text-input">
              </div>

              <div class="form-group">
                <label class="form-label">Redaktionelle Notiz / Beschreibung</label>
                <textarea id="cb-desc" rows="2" placeholder="Besonderheiten, beteiligte Produzenten, Formate..." class="text-input"></textarea>
              </div>

              <button type="submit" class="btn btn-accent btn-lg" style="margin-top:10px">
                Im Comeback-Radar veröffentlichen
              </button>
            </form>
          </div>

          <!-- Custom Submissions List -->
          <div class="curation-box">
            <h3 class="box-title">Eigene eingereichte Comebacks (${customList.length})</h3>
            <p class="box-sub">Lokal persistiert in deinem Workspace.</p>

            <div class="custom-cb-list">
              ${customList.length === 0 ? `
                <div class="empty-state-box">
                  <p>Noch keine eigenen Einträge eingereicht. Fülle das Formular links aus, um einen Termin zu adden!</p>
                </div>
              ` : customList.map(cb => `
                <div class="custom-cb-card">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div>
                      <span class="cb-type-badge">${esc(cb.type)}</span>
                      <h4 style="margin:6px 0 2px;font-size:16px">${esc(cb.act)} — ${esc(cb.title)}</h4>
                      <span style="font-size:12px;color:var(--fg-dim)">Datum: <b>${cb.date}</b></span>
                    </div>
                    <span class="pill pill-accent">Live im Radar</span>
                  </div>
                  <p style="font-size:13px;color:var(--fg-mid);margin:8px 0 0">${esc(cb.description || 'Keine Notiz')}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    handleSubmitComeback(e) {
      e.preventDefault();
      const act = document.getElementById('cb-act').value.trim();
      const actHangul = document.getElementById('cb-hangul').value.trim();
      const title = document.getElementById('cb-title').value.trim();
      const date = document.getElementById('cb-date').value;
      const type = document.getElementById('cb-type').value;
      const genresInput = document.getElementById('cb-genres').value;
      const teaserUrl = document.getElementById('cb-teaser').value.trim();
      const description = document.getElementById('cb-desc').value.trim();

      const genres = genresInput.split(',').map(g => g.trim()).filter(Boolean);

      const newCb = {
        id: `custom-cb-${Date.now()}`,
        act,
        actHangul,
        title,
        date,
        type,
        genres,
        teaserUrl,
        description,
        status: 'Community Announced',
        pipelineStep: 1,
        isTracked: true
      };

      biasStore.addCustomComeback(newCb);
      biasApp.showToast(`Comeback für ${act} erfolgreich angelegt!`);
      this.renderActiveTabContent();
    }

    // 2. Alias Editor
    renderAliasEditor(area) {
      const aliases = biasStore.curationAliases || [];

      area.innerHTML = `
        <div class="curation-split-grid">
          <div class="curation-box">
            <h3 class="box-title">+ Neuen Hangul- oder Umschriften-Alias anlegen</h3>
            <p class="box-sub">Sichert ab, dass Suchanfragen auf Hangul, Romanisierung und Spitznamen dieselbe Entität treffen.</p>

            <form id="alias-form" class="studio-form" onsubmit="biasCurationView.handleSubmitAlias(event)">
              <div class="form-group">
                <label class="form-label">Kanonischer Artist / Entität *</label>
                <select id="alias-target-artist" class="select-input" required>
                  ${BIAS_DATA.artists.map(a => `
                    <option value="${a.id}">${esc(a.name)} (${esc(a.hangul)})</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Neuer Alias / Schreibweise *</label>
                <input type="text" id="alias-value" placeholder="z. B. Soomin, Geomjeongchima, BlackSkirts..." required class="text-input">
              </div>

              <div class="form-group">
                <label class="form-label">Typ des Alias</label>
                <select id="alias-type" class="select-input">
                  <option value="Romanisierung">Revidierte Romanisierung</option>
                  <option value="Spitzname">Fandom-Spitzname / Akronym</option>
                  <option value="Hangul">Alternative Hangul-Schreibweise</option>
                  <option value="International">Export- / JP-Schreibweise</option>
                </select>
              </div>

              <button type="submit" class="btn btn-accent btn-lg" style="margin-top:10px">
                Alias im Suchindex speichern
              </button>
            </form>
          </div>

          <div class="curation-box">
            <h3 class="box-title">Gepflegte Aliasse (${aliases.length})</h3>
            <p class="box-sub">Werden sofort von der Omnisearch (Cmd+K) berücksichtigt.</p>

            <div class="custom-cb-list">
              ${aliases.length === 0 ? `
                <div class="empty-state-box">
                  <p>Noch keine benutzerdefinierten Aliasse hinterlegt.</p>
                </div>
              ` : aliases.map(al => `
                <div class="custom-cb-card">
                  <div style="display:flex;justify-content:space-between">
                    <div>
                      <span class="pill pill-muted">${esc(al.type)}</span>
                      <h4 style="margin:6px 0 2px">„${esc(al.alias)}“ → <b>${esc(al.artistName)}</b></h4>
                    </div>
                    <span class="pill pill-accent">Aktiv</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    handleSubmitAlias(e) {
      e.preventDefault();
      const artistId = document.getElementById('alias-target-artist').value;
      const alias = document.getElementById('alias-value').value.trim();
      const type = document.getElementById('alias-type').value;

      const artist = (BIAS_DATA.artists || []).find(a => a.id === artistId);
      if (!artist) return;

      if (!artist.aliases) artist.aliases = [];
      artist.aliases.push(alias);

      biasStore.addCurationAlias({
        id: `alias-${Date.now()}`,
        artistId,
        artistName: artist.name,
        alias,
        type
      });

      biasApp.showToast(`Alias „${alias}“ für ${artist.name} hinzugefügt!`);
      this.renderActiveTabContent();
    }

    // 3. Duplicates Queue
    renderDuplicatesQueue(area) {
      area.innerHTML = `
        <div class="curation-box">
          <h3 class="box-title">Scrobble-Duplikate Queue (Kanonisierung)</h3>
          <p class="box-sub">
            handover.md § 6: Ohne Auflösung werden Instrumental-, Remix-, Speed-up- und JP-Versionen zu Fake-Stats. 
            Hier werden Scrobble-Varianten mit dem Original-ISRC zusammengeführt.
          </p>

          <div class="duplicates-table-wrap" style="margin-top:18px">
            <div class="duplicates-card-row">
              <div class="dup-info">
                <span class="pill pill-song">Eingehender Scrobble</span>
                <h4>„Ditto - Instrumental Version“ (NewJeans)</h4>
                <span style="font-size:12px;color:var(--fg-dim)">Erkannt von: Last.fm · 342 Plays diesen Monat</span>
              </div>
              <div class="dup-arrow">➔</div>
              <div class="dup-target">
                <span class="pill pill-accent">Kanonisches Ziel</span>
                <h4>„Ditto“ (ISRC KRA382201948)</h4>
                <span style="font-size:12px;color:var(--fg-dim)">Original Album Track · Prod. 250</span>
              </div>
              <div class="dup-action">
                <button class="btn btn-accent btn-sm" onclick="biasApp.showToast('Erfolgreich mit kanonischem ISRC zusammengeführt!')">
                  Zusammenführen ✓
                </button>
              </div>
            </div>

            <div class="duplicates-card-row">
              <div class="dup-info">
                <span class="pill pill-song">Eingehender Scrobble</span>
                <h4>„밤양갱 (Bam Yang Gang) - Sped Up“ (BIBI)</h4>
                <span style="font-size:12px;color:var(--fg-dim)">Erkannt von: Spotify Scrobble · 812 Plays</span>
              </div>
              <div class="dup-arrow">➔</div>
              <div class="dup-target">
                <span class="pill pill-accent">Kanonisches Ziel</span>
                <h4>„밤양갱 Bam Yanggaeng“ (ISRC KRB432400012)</h4>
                <span style="font-size:12px;color:var(--fg-dim)">Original Single · Prod. Jang Ki-ha</span>
              </div>
              <div class="dup-action">
                <button class="btn btn-accent btn-sm" onclick="biasApp.showToast('Erfolgreich mit kanonischem ISRC zusammengeführt!')">
                  Zusammenführen ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  return new CurationView();
});
