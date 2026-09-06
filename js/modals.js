// js/modals.js — Premium Inspector Modals (Song, Artist, Producer, Share-Card)
// Basiert auf handover.md: ISRC, MBID, Credits-Graph, Deep-Links (Spotify/Apple/Melon), YouTube-Embed.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasModals = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class BiasModals {
    constructor() {
      this.activeModal = null;
      this.initEvents();
    }

    initEvents() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeModal) {
          this.closeCurrentModal();
        }
      });

      document.addEventListener('click', (e) => {
        // Close modal when clicking backdrop or close buttons
        if (e.target.dataset.action === 'close-modal' || e.target.classList.contains('modal-backdrop')) {
          this.closeCurrentModal();
        }

        // Open Song Modal trigger
        const songTrigger = e.target.closest('[data-song-id]');
        if (songTrigger && !e.target.closest('a') && !e.target.closest('button')) {
          const songId = songTrigger.dataset.songId;
          this.openSongModal(songId);
        }

        // Open Artist Modal trigger
        const artistTrigger = e.target.closest('[data-artist-id]');
        if (artistTrigger && !e.target.closest('a') && !e.target.closest('button')) {
          const artistId = artistTrigger.dataset.artistId;
          this.openArtistModal(artistId);
        }

        // Open Producer Modal trigger
        const prodTrigger = e.target.closest('[data-producer-id]');
        if (prodTrigger && !e.target.closest('a') && !e.target.closest('button')) {
          const prodId = prodTrigger.dataset.producerId;
          this.openProducerModal(prodId);
        }
      });
    }

    closeCurrentModal() {
      if (!this.activeModal) return;
      this.activeModal.remove();
      this.activeModal = null;
      document.body.style.overflow = '';
      this.previousFocus?.focus();
    }

    createModalContainer(contentHtml) {
      this.closeCurrentModal();
      this.previousFocus = document.activeElement;
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop is-active';
      wrap.innerHTML = `
        <div class="modal-card" role="dialog" aria-modal="true">
          <button class="modal-close-btn" data-action="close-modal" aria-label="Schließen">✕</button>
          ${contentHtml}
        </div>
      `;
      document.body.appendChild(wrap);
      document.body.style.overflow = 'hidden';
      this.activeModal = wrap;
      wrap.querySelector('.modal-close-btn').focus();
      wrap.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        const focusable = [...wrap.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
        const first = focusable[0], last = focusable[focusable.length-1];
        if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
        else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
      });
      return wrap;
    }

    // 1. Song Inspector Modal
    openSongModal(songId) {
      const song = (BIAS_DATA.songs || []).find(s => s.id === songId);
      if (!song) return;

      const artist = (BIAS_DATA.artists || []).find(a => a.id === song.artistId);
      const isrc = 'Noch nicht unabhängig geprüft';
      const mbid = 'Noch nicht unabhängig geprüft';

      const producersHtml = (song.credits.producers || []).map(p => 
        `<span class="credit-pill credit-prod"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg> ${esc(p)}</span>`
      ).join('');

      const composersHtml = (song.credits.composers || []).map(c => 
        `<span class="credit-pill">${esc(c)}</span>`
      ).join('');

      const lyricistsHtml = (song.credits.lyricists || []).map(l => 
        `<span class="credit-pill">${esc(l)}</span>`
      ).join('');

      const content = `
        <div class="modal-header">
          <div class="modal-badges">
            <span class="pill pill-song">Song Inspector</span>
            <span class="pill pill-muted">${esc(song.generation || 'Korea')}</span>
            <span class="pill pill-accent">${esc(song.duration)}</span>
          </div>
          <h2 class="modal-title">${esc(song.title)} <span class="modal-hangul">${esc(song.hangulTitle)}</span></h2>
          <div class="modal-subtitle">
            <a href="javascript:void(0)" onclick="biasModals.openArtistModal('${song.artistId}')" class="artist-link">
              ${esc(song.artistName)}
            </a>
            <span>·</span>
            <span>Album: <b>${esc(song.album)}</b></span>
            <span>·</span>
            <span>${esc(song.releaseYear)}</span>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="section-label">Bei deinem Streamingdienst suchen</h4>
          <div class="deeplinks-grid">
            ${song.links.spotify ? `
              <a href="${song.links.spotify}" target="_blank" rel="noopener" class="deeplink-btn spotify">
                <span class="icon">●</span> Spotify
              </a>` : ''}
            ${song.links.apple ? `
              <a href="${song.links.apple}" target="_blank" rel="noopener" class="deeplink-btn apple">
                <span class="icon"></span> Apple Music
              </a>` : ''}
            ${song.links.youtubeMusic ? `
              <a href="${song.links.youtubeMusic}" target="_blank" rel="noopener" class="deeplink-btn youtube">
                <span class="icon">▶</span> YouTube Music
              </a>` : ''}
            ${song.links.melon ? `
              <a href="${song.links.melon}" target="_blank" rel="noopener" class="deeplink-btn melon">
                <span class="icon">🍈</span> MelOn (KR)
              </a>` : ''}
            ${song.links.bandcamp ? `
              <a href="${song.links.bandcamp}" target="_blank" rel="noopener" class="deeplink-btn bandcamp">
                <span class="icon">BC</span> Bandcamp
              </a>` : ''}
          </div>
        </div>

        ${song.youtubeId ? `
          <div class="modal-section">
            <details class="yt-preview-box">
              <summary class="btn btn-ghost btn-sm" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">
                <span>▶ Offizielles Musikvideo / Audio Teaser laden</span>
              </summary>
              <div class="yt-embed-wrap" style="margin-top:12px;position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;border:1px solid var(--line)">
                <iframe src="https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=0&rel=0" 
                        title="${esc(song.title)} Video"
                        style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
              </div>
            </details>
          </div>
        ` : ''}

        <div class="modal-section">
          <h4 class="section-label">Kanonische Metadaten & Credits (MusicBrainz / ISRC)</h4>
          <div class="canonical-box">
            <div class="meta-field">
              <span class="meta-k">ISRC</span>
              <span class="meta-v mono">${esc(isrc)}</span>
            </div>
            <div class="meta-field">
              <span class="meta-k">MusicBrainz ID</span>
              <span class="meta-v mono">${esc(mbid)}</span>
            </div>
            <div class="meta-field">
              <span class="meta-k">Release-Datum</span>
              <span class="meta-v">${esc(song.releaseDate)}</span>
            </div>
            <div class="meta-field">
              <span class="meta-k">Performer</span>
              <span class="meta-v">${esc(song.credits.performer)}</span>
            </div>
            <div class="meta-field">
              <span class="meta-k">Produzenten</span>
              <div class="meta-v credits-list">${producersHtml || '—'}</div>
            </div>
            <div class="meta-field">
              <span class="meta-k">Komponisten</span>
              <div class="meta-v credits-list">${composersHtml || '—'}</div>
            </div>
            <div class="meta-field">
              <span class="meta-k">Textdichter</span>
              <div class="meta-v credits-list">${lyricistsHtml || '—'}</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="close-modal">Schließen</button>
          <button class="btn btn-accent" onclick="biasApp.setAsBiasPrompt('${song.artistId}')">
            ${song.artistName} als Bias wählen
          </button>
        </div>
      `;

      this.createModalContainer(content);
    }

    // 2. Artist Detail Modal
    openArtistModal(artistId) {
      const artist = (BIAS_DATA.artists || []).find(a => a.id === artistId);
      if (!artist) return;

      const membersHtml = artist.members ? `
        <div class="modal-section">
          <h4 class="section-label">Mitglieder (${artist.members.length})</h4>
          <div class="members-grid">
            ${artist.members.map(m => `
              <div class="member-chip">
                <span class="member-name">${esc(m.name)}</span>
                <span class="member-hangul">${esc(m.hangul)}</span>
                <span class="member-role">${esc(m.role)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      const songs = (BIAS_DATA.songs || []).filter(s => s.artistId === artist.id);
      const songsHtml = songs.length > 0 ? `
        <div class="modal-section">
          <h4 class="section-label">Katalog & Top Tracks (${songs.length})</h4>
          <div class="artist-songs-list">
            ${songs.map((s, idx) => `
              <div role="button" tabindex="0" class="artist-song-row" onclick="biasModals.openSongModal('${s.id}')">
                <span class="song-idx">${idx + 1}</span>
                <div class="song-meta">
                  <span class="song-t">${esc(s.title)} <span class="song-h">${esc(s.hangulTitle)}</span></span>
                  <span class="song-alb">${esc(s.album)} (${s.releaseYear})</span>
                </div>
                <span class="song-plays">Credits ansehen</span>
                <span class="song-dur">${esc(s.duration)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      const content = `
        <div class="modal-header">
          <div class="modal-badges">
            <span class="pill pill-artist">${artist.type === 'group' ? 'Gruppe' : 'Solo-Act'}</span>
            <span class="pill pill-accent" style="border-color:${artist.fandomColor};color:${artist.fandomColor}">
              ● ${esc(artist.fandomName || 'Fandom')}
            </span>
            <span class="pill pill-muted">Debüt: ${artist.debutYear}</span>
            <span class="pill pill-muted">${esc(artist.generation)}</span>
          </div>
          <h2 class="modal-title">${esc(artist.name)} <span class="modal-hangul">${esc(artist.hangul)}</span></h2>
          <div class="modal-subtitle">
            <span>Agentur / Label: <b>${esc(artist.agency || 'Independent')}</b></span>
            <span>·</span>
            <span>Romanisiert: <i>${esc(artist.romanized)}</i></span>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="section-label">Redaktionelle Einordnung</h4>
          <p class="artist-bio-text">${esc(artist.bio)}</p>
          <div class="artist-genres-wrap">
            ${(artist.genres || []).map(g => `<span class="tag accent">${esc(g)}</span>`).join('')}
          </div>
        </div>

        ${membersHtml}
        ${songsHtml}

        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="close-modal">Schließen</button>
          <button class="btn btn-accent" onclick="biasApp.setAsBiasPrompt('${artist.id}')">
            ★ Als Ult Bias wählen
          </button>
        </div>
      `;

      this.createModalContainer(content);
    }

    // 3. Producer Detail Modal
    openProducerModal(producerId) {
      const prod = (BIAS_DATA.producers || []).find(p => p.id === producerId);
      if (!prod) return;

      const rolesHtml = (prod.roles || []).map(r => `<span class="pill pill-accent">${esc(r)}</span>`).join('');
      const keyWorksHtml = (prod.keyWorks || []).map(w => `<li class="key-work-item">♪ ${esc(w)}</li>`).join('');

      const content = `
        <div class="modal-header">
          <div class="modal-badges">
            <span class="pill pill-prod">Produzent / Beatmaker</span>
            <span class="pill pill-muted">${esc(prod.agency)}</span>
            <span class="pill pill-accent">${prod.creditsCount} Hinterlegte Credits</span>
          </div>
          <h2 class="modal-title">${esc(prod.name)} <span class="modal-hangul">${esc(prod.hangul)}</span></h2>
          <div class="modal-subtitle">
            <span>Bürgerlicher Name: <b>${esc(prod.realName)}</b></span>
          </div>
        </div>

        <div class="modal-section">
          <h4 class="section-label">Kreditierte Rollen</h4>
          <div class="roles-wrap" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${rolesHtml}</div>
          <h4 class="section-label">Profil & Klangsignatur</h4>
          <p class="artist-bio-text">${esc(prod.bio)}</p>
        </div>

        <div class="modal-section">
          <h4 class="section-label">Wichtigste Produktionen & Meilensteine</h4>
          <ul class="key-works-list" style="list-style:none;padding:0;margin:0;display:grid;gap:8px">
            ${keyWorksHtml}
          </ul>
        </div>

        <div class="modal-section">
          <h4 class="section-label">Häufige Kollaborationspartner</h4>
          <div class="collaborators-grid" style="display:flex;gap:8px;flex-wrap:wrap">
            ${(prod.collaborators || []).map(cId => {
              const partner = (BIAS_DATA.artists || []).find(a => a.id === cId);
              return partner ? `
                <button class="btn btn-ghost btn-sm" onclick="biasModals.openArtistModal('${partner.id}')">
                  ${esc(partner.name)} (${esc(partner.hangul)})
                </button>
              ` : '';
            }).join('')}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="close-modal">Schließen</button>
        </div>
      `;

      this.createModalContainer(content);
    }

    // 4. Share Card Modal
    openShareCardModal(statsData) {
      const profile = biasStore.profile;
      const pct = statsData.koreaShare ?? 0;
      this.shareData = statsData;
      const username = statsData.username || profile.username || 'Musikfan';
      const ultArtist = (BIAS_DATA.artists || []).find(a => a.id === profile.ultBiasArtist);
      const ultName = ultArtist ? `${ultArtist.name} (${profile.ultBiasMember || 'All'})` : 'NewJeans (Hanni)';

      const content = `
        <div class="modal-header">
          <span class="pill pill-accent">Social Share-Card</span>
          <h2 class="modal-title">Dein Korea-Hörprofil teilen</h2>
          <p class="modal-subtitle">Deine erkannten Künstler und Plays als Bild oder Text.</p>
        </div>

        <div class="modal-section">
          <div id="share-card-canvas-wrap" class="share-card-visual" style="border:2px solid var(--bias);background:var(--bg-card);border-radius:14px;padding:24px;position:relative;overflow:hidden">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--bias)">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--bias)"></span>
                  bias.fm · Stats
                </span>
                <h3 style="font-size:22px;margin:8px 0 2px;letter-spacing:-0.03em">${esc(username)}</h3>
                <p style="font-size:13px;color:var(--fg-dim);margin:0">Ult: <b>${esc(ultName)}</b></p>
              </div>
              <div style="text-align:right">
                <div style="font-size:38px;font-weight:800;font-family:var(--font-mono);color:var(--bias);line-height:1">${pct}%</div>
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--fg-dim)">Katalogbasierte Schätzung</div>
              </div>
            </div>

            <div style="margin:20px 0;padding:12px;border-radius:8px;background:var(--bg);border:1px solid var(--line)">
              <div style="font-size:11px;font-family:var(--font-mono);text-transform:uppercase;color:var(--fg-dim);margin-bottom:8px">Top Korean Artists</div>
              <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
                ${(statsData.topArtists || []).slice(0, 3).map((a, i) => `
                  <div style="display:flex;justify-content:space-between">
                    <span><b>${i + 1}.</b> ${esc(a.name)}</span>
                    <span style="font-family:var(--font-mono);color:var(--bias)">${a.plays.toLocaleString('de-DE')} plays</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--fg-dim);border-top:1px solid var(--line);padding-top:12px">
              <span>${esc(statsData.periodLabel || "Hörstatistik")} · ${esc(statsData.provider || "")}</span>
              <span>bias.fm</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="close-modal">Schließen</button>
          <button class="btn btn-ghost" id="download-card-btn">Als PNG speichern</button>
          <button class="btn btn-accent" id="copy-card-btn">
            Text & Emoji kopieren
          </button>
        </div>
      `;

      const modal = this.createModalContainer(content);
      modal.querySelector('#copy-card-btn').onclick = async () => {
        const text = `@${username} · bias.fm\n${pct}% zugeordnete koreanische Musik (Schätzung)\n${statsData.periodLabel} · ${statsData.totalScrobbles} analysierte Plays\nTop Artists: ${statsData.topArtists.slice(0,3).map(a => a.name).join(', ') || 'Noch keine erkannt'}\nAbgleich mit dem bias.fm-Katalog; übrige Plays nicht zugeordnet.`;
        try {await navigator.clipboard.writeText(text);biasApp.showToast('Ergebnis kopiert.');}
        catch {prompt('Ergebnis zum Kopieren:', text);}
      };
      modal.querySelector('#download-card-btn').onclick = () => {
        const canvas = document.createElement('canvas'); canvas.width=1080;canvas.height=1080;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle='#10141e';ctx.fillRect(0,0,1080,1080);
        ctx.fillStyle=biasStore.accentColor;ctx.fillRect(64,64,56,8);
        ctx.font='bold 36px sans-serif';ctx.fillText('bias.fm / YOUR LISTENING ID',64,132);
        ctx.fillStyle='#ffffff';ctx.font='bold 48px sans-serif';ctx.fillText('@'+username,64,226,950);
        ctx.fillStyle=biasStore.accentColor;ctx.font='bold 172px sans-serif';ctx.fillText(pct+'%',64,440);
        ctx.fillStyle='#ffffff';ctx.font='32px sans-serif';ctx.fillText('Katalogbasierter Korea-Anteil',64,502);
        ctx.font='26px sans-serif';ctx.fillStyle='#bbc4d2';ctx.fillText(statsData.periodLabel,64,558);
        statsData.topArtists.slice(0,3).forEach((a,i) => {ctx.fillStyle='#ffffff';ctx.font='32px sans-serif';ctx.fillText(`${i+1}. ${a.name}`,64,666+i*68,740);ctx.fillStyle=biasStore.accentColor;ctx.fillText(String(a.plays),865,666+i*68,150);});
        ctx.fillStyle='#bbc4d2';ctx.font='24px sans-serif';ctx.fillText(`${statsData.totalScrobbles} Plays · ${statsData.provider} · Katalogabgleich`,64,922,950);ctx.fillText('Nicht zugeordnete Plays können weitere K-Music enthalten.',64,970,950);
        canvas.toBlob(blob => {if(!blob) return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='biasfm-hoerprofil.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
      };
    }
  }

  return new BiasModals();
});
