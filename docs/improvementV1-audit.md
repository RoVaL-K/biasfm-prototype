# Improvement V1 – Umsetzungs- und Prüfprotokoll

**Prüfdatum:** 7. September 2026  
**Quelle:** `/Users/ketaminerush/Downloads/improvementV1.md` (1.224 Zeilen)  
**Produkt:** bias.fm auf GitHub Pages und der vollständige Node-Server

Dieses Protokoll trennt die umgesetzte Produktlogik von Punkten, die laut der Vorlage selbst ein Konto, eine lizenzierte Datenquelle oder Moderation voraussetzen. Solche Punkte werden nicht mit erfundenen Daten freigeschaltet. Die Oberfläche zeigt den Zustand, die Quelle und den nächsten gültigen Schritt.

## Abgleich der Prioritäten

| Punkt aus der Vorlage | Status | Nachweis im Produkt |
| --- | --- | --- |
| Öffentliche Navigation Entdecken · Charts · Radar · Rätsel · Suche | Umgesetzt | `index.html`, Desktop-Nav und Mobile-Drawer |
| Konzept und Curation aus der öffentlichen Topbar entfernen | Umgesetzt | Konzeptseite entfernt; Curation nur über persönliche Wege bzw. geschützte Redaktion |
| Zentrierter Hero mit genau einer Hauptaktion | Umgesetzt | `js/views/home.js`, ein Korea-Mix-CTA und „So funktioniert’s“ als Sekundäraktion |
| Bias-Farbe aus dem Hero verschieben | Umgesetzt | Profil-Editor unter Einstellungen |
| Community Top 10 mit echter Quelle | Implementiert mit Datenvoraussetzung | Benannter Leerzustand; lokale Likes und Katalogsongs werden nicht als Community-Charts ausgegeben |
| Korea Charts Top 10 mit externer Quelle | Implementiert mit Datenvoraussetzung | Circle-/Melon-Originalquellen, kein Scraping und keine künstliche Mischung |
| Player-Leiste entfernen | Umgesetzt | Kein Dock, keine Playback-Steuerung, Songaktionen öffnen Details und Anbieterlinks |
| Radar kompakt, tatsächliche Events, kein starres Vier-Schritt-Modell | Umgesetzt | Nur vorhandene `events`, Release als Pflichttermin, Details als progressive Disclosure |
| Profil-Display und separater Edit-Flow | Umgesetzt | `#profile` und `#settings`, optionaler Lieblingsact, Favoriten, Wildcard, Bio |
| Stats-Connect vor Grafiken | Umgesetzt | Last.fm zuerst, ListenBrainz sekundär, Quelle/Zeitraum/Unsicherheit sichtbar |
| 3–5 Produktpaletten, Profilakzent getrennt | Umgesetzt | Mono Mint, Seoul Night Market, Holographic Pop, Warm Paper, Deep Jewel |
| Radar Agenda plus Monatskalender | Umgesetzt | Agenda standardmäßig 14 Tage, Vor-/Zurück-/Heute-Steuerung, Monatsraster und Tag-Details |
| Chart-Quelle, Methodik und Aktualisierung | Umgesetzt | Community/Korea/Last.fm/Songs getrennt; Quellen- und Abrufhinweise |
| Release, Artist, Credits als Daily-Modi | Umgesetzt | Je sechs Versuche, Hinweise, Autocomplete, KST-Tageswechsel, spoilerfreies Teilen |
| Release-Vorschlag mit Prüfstatus | Implementiert mit Kontovoraussetzung | Radar erklärt `Eingereicht → Wird geprüft → Veröffentlicht / Rückfrage / abgelehnt`; persönliche Termine funktionieren lokal |
| Streaming-Links als Deep Links | Umgesetzt | Spotify, Apple Music, YouTube; kein Audio im Produkt |
| Stats Top 10/20/50 und Zeiträume | Umgesetzt | 7 Tage, 1/3 Monate, 1 Jahr, Gesamt; unbekannte Plays separat |
| `Dein Korea-Mix` | Umgesetzt | Mapping, nicht zugeordnete Plays und katalogbasierte Schätzung klar beschriftet |

## Daten- und Integritätsregeln

- MusicBrainz-Releases werden nur mit vollständigem Datum, gültiger Katalog-Artist-ID und sichtbarer Quelle übernommen.
- Last.fm und ListenBrainz werden serverseitig abgefragt; API-Schlüssel bleiben außerhalb des Browsers. Timeouts, Rate-Limits, Dienstfehler und fehlende Schlüssel führen zu erklärten Zuständen.
- Spotify OAuth nutzt PKCE; Tokens bleiben serverseitig. Profil- und Playlist-Links werden als Links validiert und lokal gespeichert.
- Spotify Extended History kann als `.json` oder `.zip` lokal gelesen werden. Einträge mit `ms_played <= 0` oder fehlendem Abspielwert werden ausgelassen, identische Einträge mit Zeitstempel dedupliziert; der Import zeigt einen laufenden Status und bleibt lokal. Unbekannte Artists bleiben ungeklärt.
- Redaktionelle Entwürfe bleiben verborgen. Veröffentlichte Einträge benötigen Quelle, Version und geschützten Redaktionszugang.
- Eigene Termine sind als persönlich markiert und werden nicht als öffentliche Vorschläge ausgegeben.

## Browser-Testplan aus Abschnitt 16

| Bereich | Ergebnis |
| --- | --- |
| Home: Zweck und ein CTA verständlich | Bestanden; Hero, Drei-Schritte-Erklärung und getrennte Chartkarten geprüft |
| Home: Radar/Rätsel erreichbar, kein Player | Bestanden |
| Charts: Rang, Cover, Titel, Artist, Credits und Anbieterlinks | Bestanden; Katalog zeigt Covers und Rangfolge der kuratierten Liste, Last.fm zeigt externe Ränge |
| Charts: Szene getrennt von Artist-Typ und Generation | Bestanden; Artist-Typ ist unabhängig, Generation erscheint nur bei Idol |
| Charts: Top 100 performant | Bestanden; Last.fm liefert bis zu 100, initial 25 und „weitere laden“ bis 100 |
| Radar: Agenda und Kalender | Bestanden; 14-Tage-Agenda, Monatswechsel über Jahresgrenzen und Tag-Details |
| Radar: nur echte Events, Links statt Player | Bestanden |
| Radar: Export | Bestanden; Google Calendar sowie Apple/Outlook-`.ics`-Download im Modal |
| Entdecken: Artist, Release, Producer, Label, Genre, Hangul und Aliase | Bestanden |
| Rätsel: drei Modi, Hilfe, Alias-Suche, sechs Versuche | Bestanden |
| Rätsel: keine Lyrics oder Audio ohne Rechte | Bestanden; dritter Modus heißt sicher „Credits“ |
| Stats: Connect/Import vor Zahlen | Bestanden; zusätzlich lokaler Spotify-JSON/ZIP-Import |
| Stats: Mapping-Unsicherheit, Zeiträume, Top 10/20/50 | Bestanden |
| Profil: screenshotfähiges Display, separater Edit-Flow, Solo/Gruppe/kein Act | Bestanden |
| Profil: Fandom-/Profilakzent unabhängig vom Theme | Bestanden; Kontrastprüfung für eigene Hex-Farbe |
| Mobile: 44px-Ziele, sichtbarer Fokus, keine Hover-Pflicht | Bestanden; CSS- und Browserprüfung |
| Recht: Betreiber-, Datenschutz- und Quellenbereiche | Bestanden; tatsächliche Betreiberangaben bleiben Konfiguration des Betreibers |

## Punkte mit echter externer Voraussetzung

Die Vorlage verschiebt diese Funktionen ausdrücklich hinter ein Signal bzw. eine technische Voraussetzung. Die Anwendung behandelt sie deshalb produktionssicher:

- Eine zentrale Identität, Follow, öffentliche Profile, 180-Tage-Namenswechsel und Namensquarantäne brauchen Authentifizierung und dauerhafte Datenhaltung. Der lokale Edit-Flow behauptet diese Eigenschaften nicht.
- Community-Rankings brauchen bestätigte Konten, Einwilligung, Deduplizierung und gemeinsame Listens. Bis dahin bleibt die Community Top 10 leer.
- Eine eingebettete Korea-Markt-Top-10 braucht eine erlaubte/lizenzierte Quelle. Circle und Melon bleiben direkte Referenzen.
- Öffentliche User-Submissions brauchen Login, Quellenpflicht, Statusspeicher und Moderation. Der öffentliche Vorschlagsdialog beschreibt den Prüfstatus; der lokale Termin ist davon getrennt.
- Originalcover und Artistfotos werden nicht ohne Webrechte geladen. Das Produkt nutzt gekennzeichnete Ersatzmotive mit `Cover: … von …`-Label.
- Audio-Clip-Rätsel bleiben bis zur Rechteklärung durch den Credits-Modus ersetzt.
- Fan Spaces, Reviews/Guides, physische Sammlung/Crowdfunding und Monetarisierung sind in der Vorlage als P2 nach Produkt- und Moderationssignal eingeordnet und daher nicht als unfertige öffentliche Versprechen aktiviert.

## Automatisierte Abnahme

- **26 von 26 Tests bestanden** mit `npm test`.
- `npm run build` erfolgreich; der Build prüft alle JavaScript-Dateien und kopiert nur öffentliche Assets nach `dist/`.
- `git diff --check` ohne Whitespace-Fehler.
- Zusätzliche lokale Browserprüfung für Home, Charts, Artist-Typ-Filter, Radar-Agenda, Monatskalender, Stats-Connect, Spotify-Import-UI, Profil, fünf Themes, Curation-Gate und alle drei Daily-Modi.
- Der lokale Server liefert `200` für die Anwendung, `404` für private Dateien und für die entfernte Konzeptseite.
