# bias.fm — Prototyp

Statische Website zum Konzept „bias.fm" (Handover v2): eine Entdeckungs-, Stats- und
Community-Ebene für koreanische Musik aller Genres, ohne eigenen Player.

Zwei Seiten:

| Datei | Inhalt |
|---|---|
| `index.html` | Stufe-0-Landingpage: Comeback-Kalender, Charts, Korea-Anteil-Hook, Rätsel, Warteliste |
| `konzept.html` | Das Handover-Dokument als navigierbare Seite (generiert aus `handover.md`) |

**Alle Daten auf der Landingpage sind Platzhalter.** Es ist keine API angebunden,
es gibt kein Backend, die Formulare speichern nichts.

## Aufbau

```
index.html          Landing (Daten in assets/app.js)
konzept.html        generiert — nicht von Hand bearbeiten
handover.md         Quelle für konzept.html
build.js            Generator (marked)
assets/style.css    Design: Mono + Bias-Akzent
assets/app.js       Kalender-, Chart- und Formularlogik
```

## Konzeptseite neu bauen

Nach jeder Änderung an `handover.md`:

```bash
npm install
node build.js
```

`konzept.html` ist bewusst eingecheckt, damit Cloudflare Pages ohne Build-Step deployen kann.

## Deployment

Cloudflare Pages, statisch:

- Build command: *(leer)*
- Build output directory: `/`

Custom Domain: `biasfm.genshinmeta.org`

## Design

Palette „Mono + Bias-Farbe als Akzent" aus Abschnitt 9 des Handovers. Die Akzentfarbe
ist über CSS-Variable `--bias` gesetzt und auf der Landing über acht feste Fandom-Farben
umschaltbar — kein freier Colorpicker, wie im Konzept festgelegt. Hell/Dunkel folgt dem
System und lässt sich manuell überschreiben.
