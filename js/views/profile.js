// js/views/profile.js — Fan Profile, Ult / Lieblingsact, Favoriten & Fandom Accent Settings
// Handover v2: 1 Ult + 3 Favoriten (Solos oder Gruppen + Mitglied), Wildcard, Fandom-Farben.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasProfileView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  class ProfileView {
    render(container) {
      const {cover}=biasUI,p=biasStore.profile;
      const ult=BIAS_DATA.artists.find(a=>a.id===p.ultBiasArtist),wild=BIAS_DATA.artists.find(a=>a.id===p.biasWrecker);
      container.innerHTML=`<div class="view-profile"><div class="view-header"><div><p class="hero-eyebrow">Deine Musik-Identität</p><h1 class="view-title">Mein Profil</h1></div><a href="#settings" class="btn btn-ghost">Profil bearbeiten ✎</a></div><section class="profile-display"><div class="profile-art" aria-hidden="true">${cover(ult?.name || p.username,'bias.fm',true)}</div><div class="profile-display-copy"><div class="profile-avatar">${esc(p.username.slice(0,2).toUpperCase())}</div><h2>${esc(p.username)}</h2><p>${esc(p.bio || 'Musik, die bleibt. Dein Geschmack hat hier Platz.')}</p><dl><div><dt>Ult / Lieblingsact</dt><dd>${esc(ult?.name || 'Noch offen')}${ult&&p.ultBiasMember?' · '+esc(p.ultBiasMember):''}</dd></div><div><dt>Favoriten</dt><dd>${p.biasLine.map(id=>BIAS_DATA.artists.find(a=>a.id===id)?.name).filter(Boolean).map(esc).join(' · ') || 'Noch keine ausgewählt'}</dd></div>${wild?`<div><dt>Wildcard</dt><dd>${esc(wild.name)}</dd></div>`:''}</dl></div></section><p class="section-note">Dein Profil ist lokal auf diesem Gerät gespeichert. Es ist noch kein öffentliches Konto.</p><div class="import-actions"><a class="btn btn-ghost" href="#stats">Meine Stats →</a><a class="btn btn-ghost" href="#saved">Gemerkt (${biasApp.likedSongs.size}) →</a></div><section id="profile-favorites" class="settings-card"></section></div>`;
      this.favorites(container.querySelector('#profile-favorites'),6);
      if(window.biasConnections)biasConnections.mount(container,false);
    }
    favorites(section,limit=Infinity) {
      const songs=BIAS_DATA.songs.filter(s=>biasApp.likedSongs.has(s.id));
      section.innerHTML=`<h2>Deine gespeicherten Songs <span class="pill pill-muted">${songs.length}</span></h2>${songs.length?songs.slice(0,limit).map(song=>`<div class="favorite-row">${biasUI.cover(song.title,song.artistName)}<button class="text-action" data-favorite-open="${song.id}">${esc(song.title)}<small>${esc(song.artistName)}</small></button><button class="btn btn-ghost" data-favorite-remove="${song.id}" aria-label="${esc(song.title)} aus Favoriten entfernen">Entfernen</button></div>`).join(''):'<p>Noch keine Favoriten. Öffne einen Song und wähle Merken.</p><a href="#catalog">Musik entdecken →</a>'}`;
      section.onclick=e=>{const open=e.target.closest('[data-favorite-open]'),remove=e.target.closest('[data-favorite-remove]');if(open)biasModals.openSongModal(open.dataset.favoriteOpen);if(remove){biasApp.toggleLike(remove.dataset.favoriteRemove);this.favorites(section,limit);}};
    }
    renderSaved(container) {
      container.innerHTML='<div class="view-header"><h1 class="view-title">Gemerkt</h1><a href="#curation" class="btn btn-ghost">Eigene Termine & Suchaliase →</a></div><section class="settings-card" id="saved-songs"></section><a href="#kalender" class="btn btn-ghost">Gemerkte Releases im Radar →</a>';
      this.favorites(container.querySelector('#saved-songs'));
    }
    renderEdit(container) {
      const profile = biasStore.profile;
      this.draftColor=profile.accentColor;this.draftFandom=profile.fandomName;
      const ultArtist = (BIAS_DATA.artists || []).find(a => a.id === profile.ultBiasArtist) || BIAS_DATA.artists[0];
      const wreckerArtist = (BIAS_DATA.artists || []).find(a => a.id === profile.biasWrecker);

      container.innerHTML = `
        <div class="view-profile">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Fandom Identity</span>
                <span class="pill pill-muted">Lokal auf diesem Gerät</span>
              </div>
              <h1 class="view-title">Profil bearbeiten</h1>
              <p class="view-subtitle">Dein Lieblingsact, deine Favoriten und dein Erscheinungsbild.</p>
            </div>
          </div>

          <div class="profile-layout-grid">
            <!-- Left Public Fan Card Preview -->
            <div class="profile-card-col">
              <div class="fan-id-card">
                <div class="card-glow-bg"></div>
                <div class="fan-avatar-wrap">
                  <div class="fan-avatar-ring" style="border-color:var(--bias)">
                    <span class="avatar-initials">${esc(profile.username.slice(0, 2).toUpperCase())}</span>
                  </div>
                  <span class="avatar-badge" style="background:var(--bias)">★</span>
                </div>

                <h3 class="fan-username">${esc(profile.username)}</h3>
                <span class="fan-fandom-title" style="color:var(--bias)">
                  ● ${esc(profile.fandomName || 'Tokki Sky Blue')}
                </span>

                <div class="fan-bias-summary">
                  <div class="bias-field-row">
                    <span class="field-k">Ult / Lieblingsact:</span>
                    <span class="field-v"><b>${esc(ultArtist.name)}</b> ${profile.ultBiasMember ? `(${esc(profile.ultBiasMember)})` : ''}</span>
                  </div>
                  <div class="bias-field-row">
                    <span class="field-k">Wildcard:</span>
                    <span class="field-v">${wreckerArtist ? esc(wreckerArtist.name) : 'Keiner'}</span>
                  </div>
                  <div class="bias-field-row">
                    <span class="field-k">Favoriten:</span>
                    <div class="bias-line-chips">
                      ${(profile.biasLine || []).map(bId => {
                        const bArt = (BIAS_DATA.artists || []).find(a => a.id === bId);
                        return bArt ? `<span class="tag accent">${esc(bArt.name)}</span>` : '';
                      }).join('')}
                    </div>
                  </div>
                </div>

                <div class="card-footer-info">
                  <span>Plattform: <b>bias.fm</b></span>
                  <span class="mono">MEIN MUSIKPROFIL</span>
                </div>
              </div>
            </div>

            <!-- Right Settings Form Column -->
            <div class="profile-settings-col">
              <div class="settings-card">
                <h3 class="settings-section-title">1. Profil-Details</h3>
                <div class="form-group">
                  <label for="prof-username" class="form-label">Nutzername / Handle</label>
                  <input type="text" id="prof-username" value="${esc(profile.username.toLowerCase())}" class="text-input" minlength="3" maxlength="20" pattern="[a-z0-9_-]{3,20}"><p class="section-note">3–20 Kleinbuchstaben, Zahlen, - oder _. Lokal gespeichert; kein global reservierter Benutzername.</p><label for="prof-bio" class="form-label">Bio (optional)</label><textarea id="prof-bio" class="text-input" maxlength="280">${esc(profile.bio || '')}</textarea>
                </div>

                <h3 class="settings-section-title" style="margin-top:24px">2. Ult / Lieblingsact auswählen</h3>
                <p class="section-note">Du musst keinen Bias wählen. Solo-Acts, Bands und Producer sind willkommen.</p>
                
                <div class="form-grid-2">
                  <div class="form-group">
                    <label for="prof-ult-artist" class="form-label">Künstler / Act</label>
                    <select id="prof-ult-artist" class="select-input"><option value="">Kein Lieblingsact gewählt</option>
                      ${BIAS_DATA.artists.map(a => `
                        <option value="${a.id}" ${a.id === profile.ultBiasArtist ? 'selected' : ''}>
                          ${esc(a.name)} (${esc(a.hangul)})
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <div class="form-group" id="member-select-group">
                    <label for="prof-ult-member" class="form-label">Mitglied (optional bei Gruppen)</label>
                    <select id="prof-ult-member" class="select-input">
                      <option value="">Ganze Gruppe (OT)</option>
                      ${ultArtist.members ? ultArtist.members.map(m => `
                        <option value="${esc(m.name)}" ${m.name === profile.ultBiasMember ? 'selected' : ''}>
                          ${esc(m.name)} (${esc(m.hangul)})
                        </option>
                      `).join('') : ''}
                    </select>
                  </div>
                </div>

                <h3 class="settings-section-title" style="margin-top:24px">3. Favoriten &amp; Wrecker</h3>
                <div class="form-group">
                  <label class="form-label">Favoriten (Maximal 3 weitere Künstler)</label>
                  <div class="bias-line-selector">
                    ${BIAS_DATA.artists.filter(a => a.id !== profile.ultBiasArtist).map(a => {
                      const isSelected = (profile.biasLine || []).includes(a.id);
                      return `
                        <button type="button" class="bias-select-chip ${isSelected ? 'is-selected' : ''}" 
                                data-artist-id="${a.id}">
                          ${esc(a.name)}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div class="form-group" style="margin-top:16px">
                  <label for="prof-wrecker" class="form-label">Wildcard</label>
                  <select id="prof-wrecker" class="select-input">
                    <option value="">Keiner gewählt</option>
                    ${BIAS_DATA.artists.filter(a => a.id !== profile.ultBiasArtist).map(a => `
                      <option value="${a.id}" ${a.id === profile.biasWrecker ? 'selected' : ''}>
                        ${esc(a.name)} (${esc(a.hangul)})
                      </option>
                    `).join('')}
                  </select>
                </div>

                <h3 class="settings-section-title" style="margin-top:24px">4. Dein Profil-Akzent</h3>
                <p class="section-note">Wähle eine der 8 kuratierten Fandom-Farben — passend zu deinem Musikgeschmack.</p>
                <div class="fandom-swatches-grid">
                  ${BIAS_DATA.fandomColors.map(fc => `
                    <button type="button" class="fandom-swatch-card ${fc.color === biasStore.accentColor ? 'is-active' : ''}" 
                            data-color="${fc.color}" 
                            data-name="${esc(fc.name)}"
                            onclick="biasProfileView.selectColor('${fc.color}', '${esc(fc.name)}')">
                      <span class="color-preview-circle" style="background:${fc.color}"></span>
                      <div class="swatch-meta">
                        <span class="swatch-title">${esc(fc.name)}</span>
                        <span class="swatch-fandom">${esc(fc.fandom)}</span>
                      </div>
                    </button>
                  `).join('')}
                </div>

                <div class="form-save-bar" style="margin-top:28px">
                  <button type="button" class="btn btn-accent btn-lg" onclick="biasProfileView.saveProfile()">
                    Einstellungen speichern ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      container.querySelector('.profile-card-col')?.remove();
      container.querySelector('.profile-layout-grid').classList.add('profile-edit-layout');
      container.querySelector('.view-header').insertAdjacentHTML('beforeend','<a href="#profile" class="btn btn-ghost">Zurück zum Profil</a>');
      container.querySelector('.form-save-bar').insertAdjacentHTML('beforebegin',`<h3 class="settings-section-title">Produkt-Theme</h3><p class="section-note">Die Produktpalette bleibt unabhängig von deinem Profil-Akzent.</p><label for="profile-theme">Erscheinungsbild</label><select id="profile-theme" class="select-input">${[['dark','Mono Mint'],['night','Seoul Night Market'],['light','Warm Paper']].map(([id,label])=>`<option value="${id}" ${biasStore.theme===id?'selected':''}>${label}</option>`).join('')}</select>`);
      this.attachEvents(container);
      if(window.biasConnections)biasConnections.mount(container,true);
      const memberGroup=container.querySelector('#member-select-group');
      if(memberGroup)memberGroup.hidden=!BIAS_DATA.artists.find(a=>a.id===profile.ultBiasArtist)?.members?.length;
    }

    attachEvents(container) {
      const artistSelect = container.querySelector('#prof-ult-artist');
      const memberGroup = container.querySelector('#member-select-group');
      const memberSelect = container.querySelector('#prof-ult-member');

      if (artistSelect && memberSelect) {
        artistSelect.addEventListener('change', () => {
          const art = (BIAS_DATA.artists || []).find(a => a.id === artistSelect.value);
          if (art && art.members && art.members.length > 0) {
            memberGroup.hidden=false;memberGroup.style.display = 'block';
            memberSelect.innerHTML = `<option value="">Ganze Gruppe (OT)</option>` +
              art.members.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(m.hangul)})</option>`).join('');
          } else {
            memberGroup.hidden=true;memberGroup.style.display = 'none';
            memberSelect.innerHTML = `<option value="">Solo-Act</option>`;
          }
        });
      }

      // Toggle Favoriten selection (max 3)
      const chips = container.querySelectorAll('.bias-select-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const selected = container.querySelectorAll('.bias-select-chip.is-selected');
          if (chip.classList.contains('is-selected')) {
            chip.classList.remove('is-selected');
          } else {
            if (selected.length >= 3) {
              biasApp.showToast('Maximal 3 Künstler in der Favoriten erlaubt!');
              return;
            }
            chip.classList.add('is-selected');
          }
        });
      });
    }

    selectColor(colorHex, fandomName) {
      this.draftColor=colorHex;this.draftFandom=fandomName;
      const cards = document.querySelectorAll('.fandom-swatch-card');
      cards.forEach(c => c.classList.toggle('is-active', c.dataset.color === colorHex));
      const ring = document.querySelector('.fan-avatar-ring');
      if (ring) ring.style.borderColor = colorHex;
      const title = document.querySelector('.fan-fandom-title');
      if (title) {
        title.style.color = colorHex;
        title.textContent = `● ${fandomName}`;
      }
    }

    saveProfile() {
      const usernameInput = document.getElementById('prof-username');
      const ultArtistSelect = document.getElementById('prof-ult-artist');
      const ultMemberSelect = document.getElementById('prof-ult-member');
      const wreckerSelect = document.getElementById('prof-wrecker');

      const selectedChips = document.querySelectorAll('.bias-select-chip.is-selected');
      const biasLine = Array.from(selectedChips).map(c => c.dataset.artistId).filter(id => id !== ultArtistSelect.value).slice(0,3);

      const username = usernameInput ? usernameInput.value.trim() : 'Stan';
      const ultBiasArtist = ultArtistSelect ? ultArtistSelect.value : 'newjeans';
      const ultBiasMember = ultMemberSelect ? ultMemberSelect.value : '';
      const biasWrecker = wreckerSelect ? wreckerSelect.value : '';

      if (!/^[a-z0-9_-]{3,20}$/.test(username)) {biasApp.showToast('Bitte 3–20 Kleinbuchstaben, Zahlen, - oder _ verwenden.');usernameInput.focus();return;}
      biasStore.updateProfile({
        username,
        bio: document.getElementById('prof-bio').value.trim().slice(0,280),
        accentColor:this.draftColor,
        fandomName:this.draftFandom,
        ultBiasArtist,
        ultBiasMember,
        biasLine,
        biasWrecker: biasWrecker === ultBiasArtist ? "" : biasWrecker
      });

      biasStore.setTheme(document.getElementById('profile-theme').value);
      biasApp.showToast('Profil erfolgreich gespeichert!');
      
      const appContainer = document.getElementById('main-content');
      if (appContainer) {
        biasApp.navigateTo('profile');
      }
    }
  }

  return new ProfileView();
});
