// js/views/stats.js — Korea-Share Calculator & Last.fm/ListenBrainz Integration

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasStatsView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class StatsView {
    constructor() {
      this.selectedPersonaId = biasStore.activePersonaId || 'persona-indie';
    }

    render(container) {
      const personas = BIAS_DATA.demoPersonas || [];
      const currentPersona = personas.find(p => p.id === this.selectedPersonaId) || personas[0];
      const otherScrobbles = currentPersona.totalScrobbles - currentPersona.koreaScrobbles;

      container.innerHTML = `
        <div class="view-stats">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Der virale Hook</span>
                <span class="pill pill-muted">Last.fm · ListenBrainz · Plattformunabhängig</span>
              </div>
              <h1 class="view-title">Wie viel von deinem Hören ist Korea?</h1>
              <p class="view-subtitle">Echte Historie statt des 50-Play-Spotify-Käfigs. Verbinde Last.fm oder wähle ein Hörprofil zum Testen.</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-accent" onclick="biasStatsView.openShareCard()">
                Share-Karte generieren 🎨
              </button>
            </div>
          </div>

          <!-- Persona Selector Bar -->
          <div class="persona-selector-box">
            <span class="selector-label">Hörprofil-Simulation wählen:</span>
            <div class="persona-chips">
              ${personas.map(p => `
                <button class="persona-chip ${p.id === this.selectedPersonaId ? 'is-active' : ''}" 
                        onclick="biasStatsView.selectPersona('${p.id}')">
                  <span class="chip-name">${esc(p.name)}</span>
                  <span class="chip-pct mono">${p.koreaShare}%</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Stats Dashboard Layout -->
          <div class="stats-dashboard-grid">
            <!-- Left Donut & Main Ratio Card -->
            <div class="stats-card main-donut-card">
              <h3 class="stats-card-title">Korea-Höranteil (Letzte 12 Monate)</h3>
              
              <div class="donut-presentation">
                <div class="donut-graphic">
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="54" fill="none" stroke="var(--line)" stroke-width="14"></circle>
                    <circle id="animated-korea-donut" cx="70" cy="70" r="54" fill="none" stroke="var(--bias)" stroke-width="14"
                            stroke-linecap="round" stroke-dasharray="339.3" stroke-dashoffset="339.3"
                            style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)"></circle>
                  </svg>
                  <div class="donut-center-text">
                    <span class="pct-val" id="stats-pct-display">0%</span>
                    <span class="pct-lbl">K-Music</span>
                  </div>
                </div>

                <div class="donut-legend">
                  <div class="legend-row">
                    <span class="color-dot" style="background:var(--bias)"></span>
                    <span class="legend-label">Koreanische Musik</span>
                    <span class="legend-val mono"><b>${currentPersona.koreaScrobbles.toLocaleString('de-DE')}</b> Plays</span>
                  </div>
                  <div class="legend-row">
                    <span class="color-dot" style="background:var(--line)"></span>
                    <span class="legend-label">Übrige Musik</span>
                    <span class="legend-val mono">${otherScrobbles.toLocaleString('de-DE')} Plays</span>
                  </div>
                  <div class="legend-row total-row">
                    <span class="legend-label">Gesamte Scrobbles</span>
                    <span class="legend-val mono">${currentPersona.totalScrobbles.toLocaleString('de-DE')}</span>
                  </div>
                </div>
              </div>

              <!-- Last.fm Connect Simulator -->
              <div class="lastfm-connect-box">
                <h4>Eigenen Last.fm Account verbinden</h4>
                <form id="lastfm-form" class="connect-form" onsubmit="biasStatsView.handleConnect(event)">
                  <input type="text" id="lastfm-username" placeholder="Dein Last.fm Nutzername..." required>
                  <button type="submit" class="btn btn-ghost">Scrobbles laden</button>
                </form>
                <span class="help-text">Kein Passwort nötig · Öffentliche Last.fm Scrobble-API &amp; ISRC-Matching</span>
              </div>
            </div>

            <!-- Right Breakdown & Top Artists -->
            <div class="stats-side-col">
              <!-- Top Korean Artists -->
              <div class="stats-card">
                <h3 class="stats-card-title">Top Korean Artists</h3>
                <div class="top-artists-bars">
                  ${(currentPersona.topArtists || []).map((art, i) => {
                    const maxPlays = currentPersona.topArtists[0].plays;
                    const barPct = Math.round((art.plays / maxPlays) * 100);
                    return `
                      <div class="art-bar-row">
                        <div class="art-bar-meta">
                          <span><b>${i + 1}.</b> ${esc(art.name)}</span>
                          <span class="mono">${art.plays.toLocaleString('de-DE')} plays</span>
                        </div>
                        <div class="progress-track">
                          <div class="progress-fill" style="width:${barPct}%; background:var(--bias)"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Genre Distribution -->
              <div class="stats-card">
                <h3 class="stats-card-title">Koreanische Genre-Verteilung</h3>
                <div class="genre-bars">
                  ${(currentPersona.topKoreanGenres || []).map(g => `
                    <div class="art-bar-row">
                      <div class="art-bar-meta">
                        <span>${esc(g.label)}</span>
                        <span class="mono">${g.pct}%</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-fill" style="width:${g.pct}%; background:var(--bias)"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.animateDonut(currentPersona.koreaShare);
    }

    animateDonut(targetPct) {
      setTimeout(() => {
        const circle = document.getElementById('animated-korea-donut');
        const display = document.getElementById('stats-pct-display');
        if (!circle || !display) return;

        const circumference = 2 * Math.PI * 54; // ~339.29
        const offset = circumference - (circumference * targetPct / 100);
        circle.style.strokeDashoffset = offset;
        display.textContent = `${targetPct}%`;
      }, 50);
    }

    selectPersona(personaId) {
      this.selectedPersonaId = personaId;
      biasStore.setActivePersona(personaId);
      const appContainer = document.getElementById('main-content');
      if (appContainer) {
        this.render(appContainer);
      }
    }

    handleConnect(e) {
      e.preventDefault();
      const input = document.getElementById('lastfm-username');
      const username = input.value.trim();
      if (!username) return;

      biasApp.showToast(`Verbinde mit Last.fm für @${username}...`);
      
      // Simulate live fetch & calculation
      setTimeout(() => {
        biasApp.showToast(`6.840 Scrobbles für @${username} erfolgreich analysiert!`);
        biasStore.updateProfile({ username });
        this.selectPersona('persona-indie');
      }, 700);
    }

    openShareCard() {
      const personas = BIAS_DATA.demoPersonas || [];
      const currentPersona = personas.find(p => p.id === this.selectedPersonaId) || personas[0];
      if (window.biasModals) {
        window.biasModals.openShareCardModal(currentPersona);
      }
    }
  }

  return new StatsView();
});
