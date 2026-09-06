# bias.fm — Koreanische Musik, deine Zahlen

Kuratierte Entdeckungs-, Stats- und Community-Ebene für **koreanische Musik aller Genres** (Idol, Indie, R&B, Hiphop, Rock, Ballade, OST) und die Produzenten dahinter — **ohne eigenen Web-Player** (Vermeidung von GEMA / VR-OD 10).

Entwickelt auf Basis der Spezifikation in `handover.md` v2.

---

## 🌟 Funktionsumfang der Plattform

### 1. Comeback Radar & Pipeline (`#kalender`)
- Redaktionell gepflegter Zeitstrahl aller anstehenden koreanischen Releases.
- Visuelle Comeback-Pipeline: Ankündigung → Konzept-Fotos → MV-Teaser → Release.
- Filterbar nach Genres (Idol, Indie, R&B/Hiphop) und persönlichen Biases.
- **iCal-Export:** Direkter Download von `.ics`-Kalenderdateien für einzelne Comebacks oder den gesamten Monatskalender.
- Lokale Merkliste für Favoriten.

### 2. Scrobble-Charts (`#charts`)
- Echte Last.fm- und ListenBrainz-Scrobbles statt manipulierbarer Popularity-Scores.
- Multi-Tag-Filter: Alle, Idol, Indie & Rock, Hiphop / R&B, Ballade & OST.
- Automatische Generationen-Filterung (4th Gen, 3rd Gen, 2nd Gen, Indie Legend).
- Rang-Deltas (▲2, ▼1, –, NEU).
- Quick-Deep-Links zu Spotify, Apple Music, MelOn und YouTube Music.

### 3. Song Inspector & Kanonische Metadaten (Modals)
- ISRC-Code und MusicBrainz Recording-ID als Primärschlüssel.
- Detaillierte Credits: Performer, Feat, Produzenten, Komponisten, Arrangeure, Textdichter.
- Direkte Deep-Links zu allen lizenzierten Streaming-Diensten.
- Optionaler YouTube-Musikvideo-/Teaser-Player (datenschutzfreundlich via nocookie).

### 4. Katalog & Produzenten-Graph (`#catalog`)
- **Produzenten als First-Class-Entities:** Eigene Profilseiten für Hitmaker wie Slom, 250, GRAY, FRNK, Cha Cha Malone und GroovyRoom mit verifizierten Credits und Kollaborations-Graphen.
- Fokus-A Kuration (~20 Kern-Acts) mit ausgewogenem Genre-Mix zwischen Idol, Indie und R&B.

### 5. Hangul-First Omnisearch (`Cmd+K` oder `/`)
- Sucht simultan über Choseong-Konsonanten (초성: z. B. `ㄴㅈㅅ` → NewJeans), Hangul-Volltext, revidierte Romanisierung und englische Fandom-Aliasse.
- Tastaturnavigation mit Pfeiltasten und Enter.

### 6. Korea-Anteil Rechner (`#stats`)
- Der virale Hook: Last.fm-Scrobbles verbinden und den prozentualen Anteil koreanischer Musik am Gesamtkonsum berechnen.
- Interaktiver animierter SVG-Donut.
- Simulation mit 4 realistischen Personas (K-Indie Explorer, Multi-Stan, R&B Fiend, Global Casual).
- **Social Share-Card Generator:** Generiert teilbare Grafiken und formatierte Text-Ergebnisse für Instagram, Discord und X.

### 7. Rätsel des Tages (`#game`)
- Tägliches Song-Ratespiel ohne GEMA- oder Lizenzkosten.
- 5 Versuche mit progressivem Albumcover-Unblur (Schärfung pro Versuch um 5px).
- Hinweise zu Release-Jahr, Genre, Beatmaker und maskierter Textzeile (Hangul + Übersetzung).
- Autocomplete-Titeleingabe und teilbare Emoji-Ergebnis-Matrix.

### 8. Fandom Identity & Profil (`#profile`)
- Ult Bias wählbar als Solo-Act oder Gruppe mit individuellem Mitglied.
- Bias-Line (maximal 3 weitere Acts) und Bias Wrecker.
- **8 offizielle Fandom-Farben** (Blink Pink, Borahae Purple, Tokki Sky Blue, Neo Mint, Coral Gold, Tangerine, Pearl Red, Minimalist Steel), die das gesamte App-Theme dynamisch einfärben.

### 9. Curation Studio (`#curation`)
- Redaktions-Infrastruktur zur Pflege des Katalogs.
- Neues Comeback direkt erfassen (erscheint sofort im Radar).
- Hangul- und Umschriften-Aliasse einreichen.
- Scrobble-Duplikate-Queue zur Bereinigung von Instrumental-, Speed-Up- und Remix-Versionen.

### 10. Rechtliche Compliance (DE) (`#legal`)
- Impressum nach § 5 DDG.
- Datenschutzerklärung nach Art. 13 DSGVO.
- Lokale Speicher-Information nach § 25 TDDDG.
- Transparenzhinweis nach EU Digital Services Act (DSA).
- Urheberrechts- und GEMA-Erklärung.

---

## 🚀 Lokaler Start

Der Server benötigt keine externen npm-Abhängigkeiten und läuft mit nativem Node.js:

```bash
# Server starten
npm start
# oder
node server.js
```

Öffne anschließend:
**http://localhost:3000**
