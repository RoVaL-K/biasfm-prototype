// js/views/legal.js — Rechtliche Pflichtangaben (DE): Impressum (DDG), Datenschutz (DSGVO), TDDDG & DSA
// Gemäß handover.md § 10: DDG-Impressum, DSGVO, TDDDG-Einwilligung, DSA-Kontakt.

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasLegalView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  class LegalView {
    constructor() {
      this.activeTab = 'impressum';
    }

    render(container) {
      container.innerHTML = `
        <div class="view-legal">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Compliance Deutschland</span>
                <span class="pill pill-muted">DDG § 5 · DSGVO · TDDDG · DSA</span>
              </div>
              <h1 class="view-title">Rechtliche Hinweise &amp; Datenschutz</h1>
              <p class="view-subtitle">Transparenz für Nutzer und Plattform-Partner nach deutschem und europäischem Recht.</p>
            </div>
          </div>

          <!-- Legal Tabs -->
          <div class="filter-bar">
            <div class="tag-tabs" id="legal-tabs">
              <button class="tag-tab ${this.activeTab === 'impressum' ? 'is-active' : ''}" data-tab="impressum">
                Impressum (§ 5 DDG)
              </button>
              <button class="tag-tab ${this.activeTab === 'datenschutz' ? 'is-active' : ''}" data-tab="datenschutz">
                Datenschutzerklärung (DSGVO)
              </button>
              <button class="tag-tab ${this.activeTab === 'tdddg' ? 'is-active' : ''}" data-tab="tdddg">
                Cookies &amp; Lokaler Speicher (TDDDG)
              </button>
              <button class="tag-tab ${this.activeTab === 'urheberrecht' ? 'is-active' : ''}" data-tab="urheberrecht">
                Urheberrecht &amp; Deep-Links (GEMA)
              </button>
            </div>
          </div>

          <div id="legal-content-area" class="legal-content-card"></div>
        </div>
      `;

      this.attachEvents(container);
      this.renderTab();
    }

    attachEvents(container) {
      const tabs = container.querySelectorAll('.tag-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          this.activeTab = tab.dataset.tab;
          this.renderTab();
        });
      });
    }

    renderTab() {
      const area = document.getElementById('legal-content-area');
      if (!area) return;

      if (this.activeTab === 'impressum') {
        area.innerHTML = `
          <h2>Impressum</h2>
          <p class="sub-lead">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>

          <div class="legal-section">
            <h3>Diensteanbieter</h3>
            <p>
              bias.fm — Plattform für koreanische Musikkuratierung &amp; Hörstatistik<br>
              Vertreten durch das Projektteam bias.fm<br>
              E-Mail: <a href="mailto:kontakt@bias.fm" style="color:var(--bias)">kontakt@bias.fm</a><br>
              Website: <a href="https://bias.fm" style="color:var(--bias)">https://bias.fm</a>
            </p>
          </div>

          <div class="legal-section">
            <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
            <p>
              Redaktion bias.fm<br>
              E-Mail: redaktion@bias.fm
            </p>
          </div>

          <div class="legal-section">
            <h3>Zentrale Kontaktstelle nach Digital Services Act (DSA)</h3>
            <p>
              Gemäß Artikel 11 und 12 des DSA erreichen Sie unsere zentrale Kontaktstelle für Behörden der Mitgliedstaaten, die Europäische Kommission sowie Nutzer unter:<br>
              <b>dsa@bias.fm</b> (Sprachen: Deutsch, Englisch, Koreanisch).
            </p>
          </div>
        `;
      } else if (this.activeTab === 'datenschutz') {
        area.innerHTML = `
          <h2>Datenschutzerklärung</h2>
          <p class="sub-lead">Information über die Erhebung personenbezogener Daten nach Art. 13 DSGVO</p>

          <div class="legal-section">
            <h3>1. Grundsatz: Privacy by Design</h3>
            <p>
              Der Schutz Ihrer Privatsphäre steht an erster Stelle. bias.fm setzt bewusst keine invasiven Drittanbieter-Tracker, Werbe-Pixel oder Fingerprinting-Skripte ein.
            </p>
          </div>

          <div class="legal-section">
            <h3>2. Lokale Speicherung im Browser (LocalStorage)</h3>
            <p>
              Ihre Präferenzen (gewählte Bias-Farbe, Ult Bias, Bias-Line, getrackte Comebacks und Rätsel-Fortschritte) werden ausschließlich lokal in Ihrem Webbrowser gespeichert. Es findet keine serverseitige Profilbildung ohne Ihre explizite Einwilligung statt.
            </p>
          </div>

          <div class="legal-section">
            <h3>3. Hördaten &amp; Last.fm / ListenBrainz</h3>
            <p>
              Sofern Sie Ihren Last.fm-Nutzernamen angeben, ruft bias.fm öffentlich zugängliche Scrobble-Listen ausschließlich zur Berechnung Ihres Korea-Höranteils ab. Diese Daten werden nicht an Werbenetzwerke weiterverkauft.
            </p>
          </div>

          <div class="legal-section">
            <h3>4. Ihre Rechte nach DSGVO</h3>
            <p>
              Sie haben jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17) sowie Datenübertragbarkeit (Art. 20 DSGVO).
            </p>
          </div>
        `;
      } else if (this.activeTab === 'tdddg') {
        area.innerHTML = `
          <h2>Cookies &amp; Lokaler Speicher (TDDDG)</h2>
          <p class="sub-lead">Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz</p>

          <div class="legal-section">
            <h3>Technisch erforderliche Speicherungen</h3>
            <p>
              bias.fm speichert im Browser (LocalStorage):
            </p>
            <ul>
              <li><code>biasfm_theme</code>: Gewähltes Theme (Hell / Dunkel)</li>
              <li><code>biasfm_color</code>: Gewählte offizielle Fandom-Akzentfarbe</li>
              <li><code>biasfm_profile</code>: Bias-Zusammenstellung (Ult, Line, Wrecker)</li>
              <li><code>biasfm_tracked_comebacks</code>: Merkliste für Comeback-Radar</li>
              <li><code>biasfm_riddle_state</code>: Heutiger Spielstand des Song-Rätsels</li>
            </ul>
            <p>
              Diese Speicherelemente sind nach § 25 Abs. 2 Nr. 2 TDDDG technisch erforderlich, um die von Ihnen ausdrücklich gewünschten Funktionen der Web-App bereitzustellen.
            </p>
          </div>

          <div class="legal-section">
            <button class="btn btn-ghost" onclick="biasStore.profile = null; localStorage.clear(); biasApp.showToast('Lokaler Speicher gelöscht.'); location.reload();">
              Lokalen Speicher vollständig leeren
            </button>
          </div>
        `;
      } else if (this.activeTab === 'urheberrecht') {
        area.innerHTML = `
          <h2>Urheberrecht, Musikrechte &amp; Deep-Links</h2>
          <p class="sub-lead">Rechtliche Einordnung gemäß handover.md v2</p>

          <div class="legal-section">
            <h3>Kein Web-Player, kein Audio-Hosting</h3>
            <p>
              bias.fm hostet keine Musikdateien, Audio-Previews oder MP3s auf eigenen Servern. Die Wiedergabe erfolgt ausschließlich über standardkonforme Deep-Links zu lizenzierten Streaming-Diensten (Spotify, Apple Music, YouTube Music, MelOn, Bandcamp).
            </p>
          </div>

          <div class="legal-section">
            <h3>GEMA &amp; Urheberrechtsabgaben</h3>
            <p>
              Da bias.fm reine Metadaten (Titel, ISRC, Credits) bereitstellt und auf externe, lizenzerfüllende Plattformen verlinkt, ist eine GEMA-Lizenzierung für Web-Audio-Streaming (VR-OD 10) für diese Präsentation nicht einschlägig.
            </p>
          </div>
        `;
      }
    }
  }

  return new LegalView();
});
