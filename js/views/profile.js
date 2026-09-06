// js/views/profile.js — Fan Profile, Ult Bias, Bias-Line & Fandom Accent Settings
// Handover v2: 1 Ult + 3 Bias-Line (Solos oder Gruppen + Mitglied), Bias Wrecker, Fandom-Farben.

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
      const profile = biasStore.profile;
      const ultArtist = (BIAS_DATA.artists || []).find(a => a.id === profile.ultBiasArtist) || BIAS_DATA.artists[0];
      const wreckerArtist = (BIAS_DATA.artists || []).find(a => a.id === profile.biasWrecker);

      container.innerHTML = `
        <div class="view-profile">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Fandom Identity</span>
                <span class="pill pill-muted">Gedeckelt auf 1 Ult + 3 Bias-Line</span>
              </div>
              <h1 class="view-title">Dein Fan-Profil &amp; Bias-Einstellungen</h1>
              <p class="view-subtitle">Deine persönliche Identität für Charts, Comeback-Tracking und die Community.</p>
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
                    <span class="field-k">Ult Bias:</span>
                    <span class="field-v"><b>${esc(ultArtist.name)}</b> ${profile.ultBiasMember ? `(${esc(profile.ultBiasMember)})` : ''}</span>
                  </div>
                  <div class="bias-field-row">
                    <span class="field-k">Bias Wrecker:</span>
                    <span class="field-v">${wreckerArtist ? esc(wreckerArtist.name) : 'Keiner'}</span>
                  </div>
                  <div class="bias-field-row">
                    <span class="field-k">Bias-Line:</span>
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
                  <span class="mono">VERIFIED STAN</span>
                </div>
              </div>
            </div>

            <!-- Right Settings Form Column -->
            <div class="profile-settings-col">
              <div class="settings-card">
                <h3 class="settings-section-title">1. Profil-Details</h3>
                <div class="form-group">
                  <label for="prof-username" class="form-label">Nutzername / Handle</label>
                  <input type="text" id="prof-username" value="${esc(profile.username)}" class="text-input">
                </div>

                <h3 class="settings-section-title" style="margin-top:24px">2. Ult Bias auswählen</h3>
                <p class="section-note">Solos sind als ganzer Act wählbar; Gruppen bieten zusätzlich eine optionale Mitgliederauswahl.</p>
                
                <div class="form-grid-2">
                  <div class="form-group">
                    <label for="prof-ult-artist" class="form-label">Künstler / Act</label>
                    <select id="prof-ult-artist" class="select-input">
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

                <h3 class="settings-section-title" style="margin-top:24px">3. Bias-Line &amp; Wrecker</h3>
                <div class="form-group">
                  <label class="form-label">Bias-Line (Maximal 3 weitere Künstler)</label>
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
                  <label for="prof-wrecker" class="form-label">Bias Wrecker</label>
                  <select id="prof-wrecker" class="select-input">
                    <option value="">Keiner gewählt</option>
                    ${BIAS_DATA.artists.filter(a => a.id !== profile.ultBiasArtist).map(a => `
                      <option value="${a.id}" ${a.id === profile.biasWrecker ? 'selected' : ''}>
                        ${esc(a.name)} (${esc(a.hangul)})
                      </option>
                    `).join('')}
                  </select>
                </div>

                <h3 class="settings-section-title" style="margin-top:24px">4. Offizielle Fandom-Akzentfarbe</h3>
                <p class="section-note">Wähle eine der 8 kuratierten Fandom-Farben — kein freier Colorpicker (nach handover.md).</p>
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

      this.attachEvents(container);
    }

    attachEvents(container) {
      const artistSelect = container.querySelector('#prof-ult-artist');
      const memberGroup = container.querySelector('#member-select-group');
      const memberSelect = container.querySelector('#prof-ult-member');

      if (artistSelect && memberSelect) {
        artistSelect.addEventListener('change', () => {
          const art = (BIAS_DATA.artists || []).find(a => a.id === artistSelect.value);
          if (art && art.members && art.members.length > 0) {
            memberGroup.style.display = 'block';
            memberSelect.innerHTML = `<option value="">Ganze Gruppe (OT)</option>` +
              art.members.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(m.hangul)})</option>`).join('');
          } else {
            memberGroup.style.display = 'none';
            memberSelect.innerHTML = `<option value="">Solo-Act</option>`;
          }
        });
      }

      // Toggle Bias-Line selection (max 3)
      const chips = container.querySelectorAll('.bias-select-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const selected = container.querySelectorAll('.bias-select-chip.is-selected');
          if (chip.classList.contains('is-selected')) {
            chip.classList.remove('is-selected');
          } else {
            if (selected.length >= 3) {
              biasApp.showToast('Maximal 3 Künstler in der Bias-Line erlaubt!');
              return;
            }
            chip.classList.add('is-selected');
          }
        });
      });
    }

    selectColor(colorHex, fandomName) {
      biasStore.setAccentColor(colorHex, fandomName);
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
      const biasLine = Array.from(selectedChips).map(c => c.dataset.artistId);

      const username = usernameInput ? usernameInput.value.trim() : 'Stan';
      const ultBiasArtist = ultArtistSelect ? ultArtistSelect.value : 'newjeans';
      const ultBiasMember = ultMemberSelect ? ultMemberSelect.value : '';
      const biasWrecker = wreckerSelect ? wreckerSelect.value : '';

      biasStore.updateProfile({
        username,
        ultBiasArtist,
        ultBiasMember,
        biasLine,
        biasWrecker
      });

      biasApp.showToast('Profil erfolgreich gespeichert!');
      
      const appContainer = document.getElementById('main-content');
      if (appContainer) {
        this.render(appContainer);
      }
    }
  }

  return new ProfileView();
});
