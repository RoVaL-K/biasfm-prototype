// js/views/curation.js — Editorial & Curation Studio (Deine Sammlung nach handover.md)
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
                <span class="pill pill-accent">Deine Sammlung</span>
                <span class="pill pill-muted">In diesem Browser gespeichert</span>
              </div>
              <h1 class="view-title">Deine Termine &amp; Suchaliase</h1>
              <p class="view-subtitle">Verwalte eigene Release-Termine und ergänze die Suche um Namen, die du verwendest.</p>
            </div>
          </div>

          <!-- Studio Tabs -->
          <div class="filter-bar">
            <div class="tag-tabs" id="curation-tabs">
              <button class="tag-tab ${this.activeTab === 'comebacks' ? 'is-active' : ''}" data-tab="comebacks">
                Comeback einreichen (${biasStore.customComebacks.length})
              </button>
              <button class="tag-tab ${this.activeTab === 'aliases' ? 'is-active' : ''}" data-tab="aliases">
                Hangul- &amp; Alias-Pflege (${biasStore.curationAliases.length})
              </button>
              <button class="tag-tab ${this.activeTab === 'editorial' ? 'is-active' : ''}" data-tab="editorial">Öffentliche Redaktion</button>
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
      container.addEventListener('click', e => {
        const edit=e.target.closest('[data-edit-comeback]'), del=e.target.closest('[data-delete-comeback]');
        if(edit) this.editComeback(edit.dataset.editComeback);
        if(del) this.deleteComeback(del.dataset.deleteComeback);
      });
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

      if (this.activeTab === 'editorial') {biasEditorial.render(area);return;}
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
                Termin speichern
              </button>
            </form>
          </div>

          <!-- Custom Submissions List -->
          <div class="curation-box">
            <h3 class="box-title">Eigene eingereichte Comebacks (${customList.length})</h3>
            <p class="box-sub">Nur in diesem Browser gespeichert.</p>

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
                    <span class="pill pill-accent">Persönlicher Termin</span>
                  </div>
                  <p style="font-size:13px;color:var(--fg-mid);margin:8px 0 0">${esc(cb.description || 'Keine Notiz')}</p>
                  <div class="import-actions"><button class="btn btn-ghost btn-sm" data-edit-comeback="${esc(cb.id)}">Bearbeiten</button><button class="btn btn-ghost btn-sm" data-delete-comeback="${esc(cb.id)}">Löschen</button></div>
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

      if (!act || !title || act.length > 120 || title.length > 200 || description.length > 2000 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {biasApp.showToast('Bitte Titel, Künstler und ein gültiges Datum prüfen.');return;}
      if (teaserUrl && !/^https?:\/\//i.test(teaserUrl)) {biasApp.showToast('Bitte einen Link mit https:// oder http:// eingeben.');return;}
      if (biasStore.customComebacks.some(cb => cb.id !== this.editingId && cb.act.toLowerCase() === act.toLowerCase() && cb.title.toLowerCase() === title.toLowerCase() && cb.date === date)) {biasApp.showToast('Dieser Termin ist bereits gespeichert.');return;}
      const genres = genresInput.split(',').map(g => g.trim()).filter(Boolean);

      const newCb = {
        id: this.editingId || `custom-cb-${crypto.randomUUID()}`,
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

      if(this.editingId) {
        const updated = biasStore.customComebacks.map(cb => cb.id === this.editingId ? newCb : cb);
        localStorage.setItem('biasfm_custom_comebacks', JSON.stringify(updated));
        biasStore.customComebacks = updated;
      } else {biasStore.addCustomComeback(newCb);biasStore.toggleTrackComeback(newCb.id);}
      this.editingId = null;
      biasApp.showToast(`Comeback für ${act} erfolgreich angelegt!`);
      this.renderActiveTabContent();
    }

    editComeback(id) {
      const cb = biasStore.customComebacks.find(c => c.id === id);if(!cb) return;
      this.editingId = id;
      const fields = {'cb-act':'act','cb-hangul':'actHangul','cb-title':'title','cb-date':'date','cb-type':'type','cb-teaser':'teaserUrl','cb-desc':'description'};
      for(const [field,key] of Object.entries(fields)) document.getElementById(field).value = cb[key] || '';
      document.getElementById('cb-genres').value = cb.genres.join(', ');
      document.getElementById('cb-act').focus();
      document.getElementById('new-comeback-form').scrollIntoView({block:'center',behavior:'smooth'});
    }

    deleteComeback(id) {
      const cb = biasStore.customComebacks.find(c => c.id === id);if(!cb) return;
      const modal = biasModals.createModalContainer(`<div class="modal-header"><h2>Termin löschen?</h2><p>${esc(cb.act)} — ${esc(cb.title)} wird aus deiner Sammlung und Merkliste entfernt.</p></div><div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Behalten</button><button class="btn btn-accent" id="confirm-delete">Termin löschen</button></div>`);
      modal.querySelector('#confirm-delete').onclick = () => {
        const updated = biasStore.customComebacks.filter(c => c.id !== id);
        localStorage.setItem('biasfm_custom_comebacks', JSON.stringify(updated));
        biasStore.customComebacks = updated;
        if(biasStore.isTracked(id)) biasStore.toggleTrackComeback(id);
        this.editingId = null;biasModals.closeCurrentModal();this.renderActiveTabContent();biasApp.showToast('Termin gelöscht.');
      };
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

      if (!alias || alias.length > 120) {biasApp.showToast('Bitte einen Alias mit 1 bis 120 Zeichen eingeben.');return;}
      if (biasStore.curationAliases.some(a => a.artistId === artistId && biasCore.normalize(a.alias) === biasCore.normalize(alias))) {biasApp.showToast('Dieser Alias ist bereits hinterlegt.');return;}

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
      area.innerHTML = `<div class="curation-box"><h3 class="box-title">Keine offenen Duplikate</h3><p class="box-sub">Die Hörstatistik zählt Plays anhand der vom Dienst gelieferten Künstlerdaten. Aktuell liegen keine geprüften Vorschläge zur Zusammenführung einzelner Aufnahmen vor.</p><p>Instrumentals, Remixe und Sprachversionen bleiben eigenständige Aufnahmen. Ohne geprüfte Zuordnung wird nichts zusammengeführt.</p><a class="btn btn-ghost" href="#stats">Zur Hörstatistik →</a></div>`;
    }
  }

  return new CurationView();
});
