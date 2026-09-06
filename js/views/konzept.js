// js/views/konzept.js — Interactive Handover v2 Concept Viewer

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.biasKonzeptView = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  class KonzeptView {
    render(container) {
      container.innerHTML = `
        <div class="view-konzept">
          <div class="view-header">
            <div>
              <div class="pill-row">
                <span class="pill pill-accent">Handover v2</span>
                <span class="pill pill-muted">Stand: 28. August 2026 · Konzept-/Planungsphase</span>
              </div>
              <h1 class="view-title">bias.fm Konzept &amp; Produktdokumentation</h1>
              <p class="view-subtitle">Die vollständige Architektur, Datenquellen-Strategie und Begründungen aus handover.md.</p>
            </div>
          </div>

          <div class="konzept-layout-grid">
            <!-- Sidebar Table of Contents -->
            <nav class="konzept-toc-col">
              <div class="toc-sticky-box">
                <span class="toc-heading">Inhaltsverzeichnis</span>
                <ul class="toc-list">
                  <li><a href="#s-1">1. In einem Satz</a></li>
                  <li><a href="#s-2">2. Was das Produkt ist — und was nicht</a></li>
                  <li><a href="#s-3">3. Kritische Korrektur: Datenquellen 2026</a></li>
                  <li><a href="#s-4">4. Positionierung</a></li>
                  <li><a href="#s-5">5. Überarbeitete Roadmap</a></li>
                  <li><a href="#s-6">6. Infrastruktur &amp; Tags</a></li>
                  <li><a href="#s-7">7. Verbesserungen am Originalplan</a></li>
                  <li><a href="#s-8">8. Weitere Optionen</a></li>
                  <li><a href="#s-9">9. Seitenstruktur &amp; UI</a></li>
                  <li><a href="#s-10">10. Recht &amp; Betrieb (DE)</a></li>
                  <li><a href="#s-14">14. Was sich gegenüber v1 geändert hat</a></li>
                </ul>
              </div>
            </nav>

            <!-- Main Reading Body -->
            <article class="konzept-body-col">
              <section id="s-1" class="doc-section">
                <h2>1. In einem Satz</h2>
                <p>
                  Web-App, die Hörstatistik (Last.fm-/Stats.fm-Stil), Discovery und leichte Community für <b>koreanische Musik aller Genres</b> verbindet — <b>ohne eigenen Player</b>. 
                  Wiedergabe läuft über Deep-Links zu Spotify, Apple Music, YouTube Music, MelOn und Bandcamp. Die App ist die Schicht <i>darüber</i>: Kalender, Stats, Profile, Tags, Kuratierung.
                </p>
              </section>

              <section id="s-2" class="doc-section">
                <h2>2. Was das Produkt ist — und was nicht</h2>
                <div class="notlist" style="margin:16px 0">
                  <ul>
                    <li class="yes"><span>ist</span><b>Entdeckungs-, Stats- und Community-Ebene</b> über bestehenden Streaming-Diensten.</li>
                    <li class="yes"><span>ist</span><b>Kuratierter Katalog</b> koreanischer Musik (Idols, Hiphop, R&amp;B, Indie, Ballade, OST, Produzenten), über Tags organisiert.</li>
                    <li class="yes"><span>ist</span><b>Identitäts-Objekt</b> für Fans: Bias, Hörzahlen, Comebacks, Fandom-Farben.</li>
                  </ul>
                  <ul>
                    <li><span>nicht</span><b>Kein Spotify-Klon</b>, kein Web-Player, kein Audio-Hosting (GEMA/VR-OD 10 vermieden).</li>
                    <li><span>nicht</span><b>Kein Photocard-Marktplatz</b> (Markt übersättigt).</li>
                    <li><span>nicht</span><b>Kein All-Asia-Portal</b> und kein reines K-Pop-Idol-Wiki (kpopping besetzt Bios).</li>
                    <li><span>nicht</span><b>Kein Chartmetric/Songstats</b> für Labels.</li>
                  </ul>
                </div>
              </section>

              <section id="s-3" class="doc-section">
                <h2>3. Kritische Korrektur: Datenquellen 2026</h2>
                <p>Der Originalplan machte Spotify-OAuth zum Login- und Daten-Herz. Das ist für eine neue App 2026 eine Sackgasse:</p>
                <div class="note-box" style="border-left:4px solid #ef4444;background:var(--bg-card);padding:14px;border-radius:4px;margin:12px 0">
                  <h4 style="color:#ef4444;margin:0 0 6px">Spotify Web API Fakten 2026</h4>
                  <ul style="padding-left:18px;margin:0;font-size:13px;color:var(--fg-mid)">
                    <li>Seit Nov 2024 tot: Audio Features, Audio Analysis, Recommendations, Previews.</li>
                    <li>Seit März 2025: Extended Quota verlangt registrierte Firma &amp; 250.000 MAU.</li>
                    <li>Dev Mode: Maximal 5 bis 25 autorisierte Nutzer, kein Batch-Fetch, kein Follower-Feld.</li>
                    <li><code>/recently-played</code> liefert nur ein 50-Play-Fenster, keine Lebenshistorie!</li>
                  </ul>
                </div>
                <p><b>Architektur-Konsequenz:</b> Hördaten und Login entkoppeln. Primäre Quellen sind Last.fm OAuth &amp; API, ListenBrainz sowie manueller CSV-Import.</p>
              </section>

              <section id="s-7" class="doc-section">
                <h2>7. Wesentliche Kernverbesserungen</h2>
                <div class="doc-grid-2">
                  <div class="doc-item">
                    <h4>Produzenten als First-Class-Entities</h4>
                    <p>In koreanischem Hiphop/R&amp;B/Indie ist der Beatmaker oft der primäre Hörgrund. Relationen: produced, written, arranged, featured.</p>
                  </div>
                  <div class="doc-item">
                    <h4>Hangul-first Suche &amp; Anzeige</h4>
                    <p>Sortierung, Autocomplete und Transliteration. 수민 und SUMIN bilden ein identisches Objekt.</p>
                  </div>
                  <div class="doc-item">
                    <h4>Bias auch für Solos</h4>
                    <p>Ult-Sprache der Szene kennt Bias als Person oder Act. Gedeckelt auf 1 Ult + 3 Bias-Line.</p>
                  </div>
                  <div class="doc-item">
                    <h4>Templates vor freier KI</h4>
                    <p>Beschreibungen entstehen aus verifizierten Metadaten. Keine erfundenen Halluzinationen.</p>
                  </div>
                </div>
              </section>

              <section id="s-14" class="doc-section">
                <h2>14. Vergleich: Was sich gegenüber v1 geändert hat</h2>
                <div class="table-scroll-wrap">
                  <table class="doc-table">
                    <thead>
                      <tr>
                        <th>Thema</th>
                        <th>v1 (Alter Plan)</th>
                        <th>v2 (Aktuell implementiert)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>Login &amp; Daten</b></td>
                        <td>Spotify-OAuth zuerst</td>
                        <td>Last.fm / ListenBrainz zuerst, Spotify optional</td>
                      </tr>
                      <tr>
                        <td><b>Bias</b></td>
                        <td>Nur Gruppenmitglieder</td>
                        <td>Act + optionales Mitglied, Solos erlaubt, Ult + Line gedeckelt</td>
                      </tr>
                      <tr>
                        <td><b>Fokus-Artists</b></td>
                        <td>15–30 unspezifisch</td>
                        <td>Ausgewogener Launch-Mix aus Idol, Indie, R&amp;B und Produzenten</td>
                      </tr>
                      <tr>
                        <td><b>Produzenten</b></td>
                        <td>Nicht erwähnt</td>
                        <td>First-Class-Entities mit eigenem Credits-Graph</td>
                      </tr>
                      <tr>
                        <td><b>Validierung &amp; Hook</b></td>
                        <td>Nur Hero-Claim</td>
                        <td>Rätsel des Tages + „Korea-Anteil am Hören“ Rechner</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </article>
          </div>
        </div>
      `;
    }
  }

  return new KonzeptView();
});
