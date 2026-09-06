// js/views/home.js — Home / Spotlight View with Spotify & Tidal Level Polish

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasHomeView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }

  class HomeView {
    render(container) {
      const profile = biasStore.profile;
      const todayRiddle = biasCore.daily();
      const topSong = BIAS_DATA.songs[0];
      const nextComeback = biasStore.customComebacks.filter(cb => cb.date >= biasCore.koreaDate()).sort((a,b)=>a.date.localeCompare(b.date))[0] || {date:'Dein Kalender',act:'Dein nächster Release',actHangul:'',title:'Noch keine Termine gespeichert',type:'Termin hinzufügen',status:'Sammlung öffnen'};
      const greeting = getGreeting();

      // 6 Top Tracks for Spotify-style Quick Access
      const sixPackSongs = (BIAS_DATA.songs || []).slice(0, 6);

      container.innerHTML = `
        <div class="view-home">
          <!-- Hero Section -->
          <section class="hero-section">
            <div class="hero-eyebrow">
              <span class="live-dot"></span>
              <span>Koreanische Musik · Alle Genres · Kein eigener Player</span>
            </div>
            <h1 class="hero-headline">Deine Hördaten, <em>koreanisch</em> kuratiert.</h1>
            <p class="hero-desc">
              Dein Comeback-Radar, persönliche Hörstatistiken und Fan-Profil für Idol, Indie, R&amp;B, Hiphop und die Produzenten dahinter. Gestreamt wird da, wo du ohnehin bist — wir sind die intelligente Ebene darüber.
            </p>

            <div class="hero-actions">
              <button class="btn btn-accent btn-lg" onclick="biasApp.navigateTo('stats')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                Korea-Anteil berechnen
              </button>
              <button class="btn btn-ghost btn-lg" onclick="biasApp.navigateTo('kalender')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Comeback-Radar öffnen
              </button>
              <button class="btn btn-ghost btn-lg" onclick="biasApp.navigateTo('game')">
                <span>🎯</span> Rätsel des Tages <span>#${todayRiddle.dayNumber}</span>
              </button>
            </div>

            <!-- Fandom Color Swatches -->
            <div class="hero-fandom-bar">
              <span class="bar-label">Aktive Bias-Farbe:</span>
              <div class="swatches-list">
                ${BIAS_DATA.fandomColors.map(fc => `
                  <button class="swatch-btn ${fc.color === biasStore.accentColor ? 'is-active' : ''}" 
                          data-color="${fc.color}" 
                          data-name="${esc(fc.name)}"
                          style="background:${fc.color}" 
                          title="${esc(fc.name)} (${esc(fc.fandom)})"
                          onclick="biasApp.changeAccentColor('${fc.color}', '${esc(fc.name)}')">
                  </button>
                `).join('')}
              </div>
              <span class="bar-current-name" id="current-fandom-name">${esc(profile.fandomName || 'Tokki Sky Blue')}</span>
            </div>
          </section>

          <!-- Spotify-style Quick Access 6-Pack -->
          <section class="home-section" style="margin-top: 10px;">
            <div class="sec-head" style="margin-bottom:14px">
              <div>
                <h2>${greeting}, ${esc(profile.username)}</h2>
                <span class="sub">Schnellzugriff · Songs aus dem Katalog</span>
              </div>
            </div>

            <div class="quick-sixpack">
              ${sixPackSongs.map(song => `
                <div role="button" tabindex="0" class="sixpack-tile" onclick="biasApp.loadTrackToDock('${song.id}')">
                  <div class="sixpack-thumb" style="background:${song.coverGradient || 'linear-gradient(135deg, #1e3a8a, #38bdf8)'}">
                    <span class="sixpack-thumb-icon">♪</span>
                  </div>
                  <div class="sixpack-info">
                    <div class="sixpack-title">${esc(song.title)}</div>
                    <div class="sixpack-artist">${esc(song.artistName)}</div>
                  </div>
                  <div class="sixpack-play-btn">
                    <div class="play-fab" style="width:34px;height:34px;font-size:12px">▶</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- Spotlight 3-Cards Grid -->
          <section class="spotlight-grid">
            <!-- 1. Next Comeback Card -->
            <div role="button" tabindex="0" class="spotlight-card" onclick="biasApp.navigateTo('kalender')">
              <div class="card-tag">Nächstes Comeback</div>
              <div class="card-content">
                <span class="card-date-badge">${nextComeback.date}</span>
                <h3 class="card-title">${esc(nextComeback.act)} <span class="sub">${esc(nextComeback.actHangul)}</span></h3>
                <p class="card-subtitle">„${esc(nextComeback.title)}“ · ${esc(nextComeback.type)}</p>
                <div class="pipeline-pill">
                  <span class="dot"></span> Status: <b>${esc(nextComeback.status)}</b>
                </div>
              </div>
              <div class="card-footer-link">Zum Comeback-Radar →</div>
            </div>

            <!-- 2. Korea-Share Donut Card -->
            <div role="button" tabindex="0" class="spotlight-card spotlight-donut-card" onclick="biasApp.navigateTo('stats')">
              <div class="card-tag">Korea-Anteil am Hören</div>
              <div class="donut-flex">
                <div class="donut-visual">
                  <svg width="76" height="76" viewBox="0 0 76 76">
                    <circle cx="38" cy="38" r="30" fill="none" stroke="var(--line)" stroke-width="8"></circle>
                    <circle cx="38" cy="38" r="30" fill="none" stroke="var(--bias)" stroke-width="8"
                            stroke-linecap="round" stroke-dasharray="188.5" stroke-dashoffset="188.5"></circle>
                  </svg>
                  <span class="donut-number">–</span>
                </div>
                <div class="donut-text">
                  <h4>Plattformunabhängig</h4>
                  <p>Öffentliches Musikprofil laden und deinen Korea-Anteil entdecken.</p>
                </div>
              </div>
              <div class="card-footer-link">Rechner &amp; Share-Card →</div>
            </div>

            <!-- 3. Daily Riddle Teaser -->
            <div role="button" tabindex="0" class="spotlight-card" onclick="biasApp.navigateTo('game')">
              <div class="card-tag">Tägliches Song-Rätsel #${todayRiddle.dayNumber}</div>
              <div class="card-content">
                <h3 class="card-title">Erkennst du den Song?</h3>
                <p class="card-subtitle">${todayRiddle.hintGenre} · Release ${todayRiddle.hintYear}</p>
                <p class="card-quote">${todayRiddle.hintLyricHangul}</p>
              </div>
              <div class="card-footer-link">Jetzt mitraten →</div>
            </div>
          </section>

          <!-- Top Track Spotlight Banner -->
          <section class="home-section" style="margin-bottom:48px">
            <div class="sec-head">
              <div>
                <h2>Aus dem Katalog</h2>
                <span class="sub">Song entdecken · Credits ansehen · Beim Anbieter hören</span>
              </div>
              <button class="btn btn-ghost" onclick="biasApp.navigateTo('charts')">Alle Charts ansehen →</button>
            </div>

            <div role="button" tabindex="0" class="spotlight-track-banner" onclick="biasApp.loadTrackToDock('${topSong.id}')">
              <div class="track-rank-badge">♪</div>
              <div class="track-details">
                <h3>${esc(topSong.title)} <span class="hangul">${esc(topSong.hangulTitle)}</span></h3>
                <p class="artist-sub">${esc(topSong.artistName)} · Album: <b>${esc(topSong.album)}</b> (${topSong.releaseYear})</p>
                <div class="track-credits-summary">
                  <span>Produziert von: <b>${esc(topSong.credits.producers.join(', '))}</b></span>
                  <span>·</span>
                  <span>In deiner Sammlung merken</span>
                </div>
              </div>
              <div class="track-actions">
                <button class="btn btn-accent" onclick="event.stopPropagation(); biasModals.openSongModal('${topSong.id}')">
                  Inspector &amp; Credits
                </button>
              </div>
            </div>
          </section>

        </div>
      `;
    }
  }

  return new HomeView();
});
