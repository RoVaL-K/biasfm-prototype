# Handover v2: Musik-Plattform für koreanische Musik (Arbeitstitel „bias.fm“)

Stand: 28. August 2026. Konzept-/Planungsphase. Nichts gebaut, nichts validiert. Dieses Dokument ersetzt die Kurzfassung und erklärt *warum* die Entscheidungen so liegen, wo der Originalplan bricht, und welche Optionen bewusst später oder gar nicht kommen.

---

## 1. In einem Satz

Web-App, die Hörstatistik (Last.fm-/Stats.fm-Stil), Discovery und leichte Community für **koreanische Musik aller Genres** verbindet — ohne eigenen Player. Wiedergabe läuft über Deep-Links zu Spotify, Apple Music, YouTube Music, ggf. Melon/Bandcamp. Die App ist die Schicht *darüber*: Kalender, Stats, Profile, Tags, Kuratierung.

Aktueller Stand: Design-/Konzeptphase abgeschlossen, Schritt 1 des Rollouts (Commitment der Mitstreiter) noch nicht begonnen.

---

## 2. Was das Produkt ist — und was nicht

### Ist

- Eine **Entdeckungs-, Stats- und Community-Ebene** über bestehenden Streaming-Diensten.
- Ein **kuratierter Katalog** koreanischer Musik (Idols, Hiphop, R&B, Indie, Ballade, Trot, ost, Produzenten), der über Tags statt über hartcodierte Genre-Silos organisiert ist.
- Ein **Identitäts-Objekt** für Fans: Bias, Hörzahlen, Comebacks, später Kosmetik — näher an einem Fandom-Profil als an einem Player.

### Ist nicht

- Kein Spotify-Klon, kein Web-Player, kein Audio-Hosting (GEMA/VR-OD 10 wird damit vermieden).
- Kein Photocard-Marktplatz (Bias Room, KollectPop, Pocamarket, PICKIT, Bibliocards, K-Collect sind dicht).
- Kein All-Asia-Portal und kein reines K-Pop-Idol-Wiki (kpopping, kprofiles, fandom.com/kpop besetzen Bios/Line-ups).
- Kein Chartmetric/Songstats für Labels.

### Warum diese Lücke real ist

Bestehende Tools decken jeweils nur eine Kante ab:

| Produkt | Stärke | Lücke für diese Zielgruppe |
|---|---|---|
| Last.fm / ListenBrainz / stats.fm | Scrobbles, Stats | Kein Korea-Fokus, kein Comeback-Kalender, keine Bias-Identität, schwache Credits/Line-ups |
| kprofiles / kpopping | Bios, Fotos, Line-ups | Kaum Hördaten, kaum Indie/Hiphop, keine persönliche Stats-Schicht |
| Soompi / Reddit / Discord | Community | Kein Katalog, keine Stats, keine persistente Identity |
| Mubeat | Voting | Enger Use-Case |
| RateYourMusic / AOTY | Reviews | Westlich, langsam, wenig Comeback-Rhythmus |
| Melon/Genie/Bugs | Koreanische Charts | Geschlossen, kaum global nutzbar, keine Fan-Identity |

Die Wette: **Korea-Katalog + persönliche Hördaten + Fandom-Identität** in einem Produkt, das Indie *und* Idol ernst nimmt. Genre-Grenzen in der Szene sind fließend (Idols mit Hiphop-/R&B-Solos, Underground-Produzenten an Idol-Tracks). Landesgrenze ist die sauberere Klammer.

Architektur bleibt genre-/länder-agnostisch (Tags statt hartcodierter Filter). Kuration bleibt vorerst Korea. Expansion später eher als eigene Marke/Subdomain, nicht als entkernte selbe Seite.

Web zuerst, keine native App.

---

## 3. Kritische Korrektur: Datenquellen 2026

Der Originalplan macht **Spotify-OAuth zum Login- und Daten-Herz**. Das ist für eine *neue* App 2026 ein Sackgasse-Fundament.

### 3.1 Spotify Web API — was wirklich gilt

Seit November 2024 sind für neue Apps u. a. tot: Audio Features, Audio Analysis, Recommendations, Related Artists, 30-Sekunden-Previews.

Seit März 2025 braucht Extended Quota eine **registrierte Firma**, einen **bereits live laufenden Dienst** und **250.000 MAU** in Kernmärkten. Einzelentwickler können das nicht beantragen.

Februar/März 2026 (Development Mode):

- App-Owner braucht **Spotify Premium**; ohne Abo stirbt die App.
- Ursprünglich 1 Client-ID und **max. 5 autorisierte Nutzer**. (Juli 2026: Client-ID-Limit auf 25 angehoben, Quota zählt pro Developer-Account — das 5-User- und Extended-Quota-Problem bleibt.)
- Spotify sagt ausdrücklich: Development Mode ist Sandbox für Lernen, **kein Fundament für ein Business**.
- Batch-Fetches (`GET /tracks?ids=…`) weg — nur noch Einzelabrufe.
- Weg u. a.: New Releases, Artist Top Tracks, fremde User-Profile/Playlists, Label-Feld, Popularity, Follower-Zahlen, Available Markets.
- Search-Limit in Dev Mode: max. 10 Ergebnisse pro Request.
- Playlist-Inhalte nur noch für Playlists, die der User besitzt/collaborated.
- Weiter verfügbar (aber im 5-User-Käfig nutzlos für Launch): `/me`, `/me/top/{type}`, `/me/player/recently-played`, Currently Playing, eigene Playlists erstellen/füllen.

Zusätzlich: `/me/player/recently-played` liefert nur ein Fenster von ca. **50 Plays**, keine Lebenshistorie. Es gibt **keinen** Spotify-Endpunkt für die volle Hörgeschichte.

Folge: Spotify-first Login „verbindet Account + Hördaten in einem Schritt“ **skaliert nicht**. Man kann weder intern mit mehr als einer Handvoll Testern scrobblen noch öffentlich launchen, ohne Extended Quota — die man ohne 250k MAU nicht bekommt.

### 3.2 Konsequenz für die Architektur

**Hördaten und Login entkoppeln.** Spotify wird optionales Deep-Link-/Playlist-Ziel, nicht das Rückgrat.

Empfohlene Quellen-Hierarchie:

1. **Last.fm OAuth + API** — plattformübergreifende Scrobbles, echte Historie, Charts. Kostenlos nicht-kommerziell; kommerziell Partnerschaft über partners@last.fm **vor** Monetarisierung klären.
2. **ListenBrainz** (MetaBrainz, wie MusicBrainz) — offene Alternative, Last.fm-Import, CC0-Hördaten, keine Paywall. Gut als Zweitquelle und für nutzer-opt-in Community-Charts.
3. **Manueller CSV/JSON-Import** (Last.fm-Export, Spotify-Datendownload „Extended streaming history“) — löst Cold-Start und den 50-Play-Deckel, ohne Live-API.
4. **MusicBrainz** — kanonische IDs (MBID), Credits, Relationen (Mitglied-von, Produzent, Remix, Label), Aliasse inkl. Hangul/Latn.
5. **Spotify OAuth erst nach Quota oder nur für den eingeloggten User selbst**: Playlist schreiben, optional Currently Playing, Deep-Links. Nie als Pflicht-Login für V1.
6. **Tunebat/Songstats** — nur für Streaming-Performance/Charts, nicht als Drop-in für Audio Features. BPM/Key/Energy brauchen eine andere Quelle (offizielle Partner-API, eigener DSP später, oder Feature weglassen bis es sauber ist).
7. **YouTube Data API** — MV-IDs, Viewcounts, Kommentare; Dislikes seit Nov 2021 tot. Quota ist knapp, cachen.
8. **Discogs API** — Collection/Wantlist, Release-IDs. Später, aber echte offene API.
9. **Apple MusicKit** — teurer Developer-Account; Apple verbietet, den Dienst indirekt zu monetarisieren (Werbung um Player). Nur Deep-Links, kein eingebetteter Player mit Ads.
10. **Keine inoffiziellen Melon/Genie/Bugs-Scraper als Kern.** Chart-Seiten öffentlich verlinken oder, falls es eine lizenzierte Quelle gibt (Circle Chart), die nutzen. Scraping als Produktfund ist fragil und rechtlich dünn.

### 3.3 Identitäten im Katalog

Ein Song ist nicht „die Spotify-ID“. Kanonische Schicht:

- **ISRC** (Aufnahme) + **MusicBrainz Recording/Release-Group** als Primärschlüssel.
- Spotify/Apple/YouTube/Melon/Bandcamp als *externe IDs* am selben Objekt.
- Credits (Performer, Feature, Producer, Writer) als Relationen, nicht als Freitext im Titel („SUMIN, Slom“ vs. „수민 (Feat. …)“).
- Aliasse: Hangul, revidierte Romanisierung, gängige Export-Schreibweisen, alte Gruppennamen, Solo-vs-Gruppe.

Ohne diese Schicht zerfällt alles an koreanischen Namensvarianten.

---

## 4. Positionierung — geschärft

- **Fokus:** koreanische Musik, alle Genres. Nicht „ganz Asien“, nicht „nur K-Pop“.
- **Differenzierung gegen Idol-Wikis:** Indie, Hiphop, R&B, Produzenten, Credits, Hördaten. Ein SUMIN- oder Slom-Profil muss erstklassig sein, nicht Fußnote hinter einem Boygroup-Stub.
- **Differenzierung gegen Last.fm:** Comeback-Rhythmus, Bias, Fandom-Farben, kuratierte Tiefe, Korea-Charts, Hangul-Suche.
- **Kuration ist das Produkt.** Software skaliert Stubs; Vertrauen kommt von 15–30 bewusst tiefen Fokus-Artists plus einem sichtbaren Editorial-Prozess, der die Liste erweitern kann.

Risiko der Originalzahl 15–30: zu klein, um „alle Genres“ glaubwürdig zu machen. Besser:

- **Fokus-A (Launch, ~20):** bewusst gemischt (z. B. 8 Idol-Acts, 8 Indie/Hiphop/R&B, 4 Produzenten/Kollab-Projekte). Qualität > Vollständigkeit.
- **Fokus-B (90 Tage):** auf ~50, sobald der Editorial-Workflow sitzt.
- **Long Tail:** automatische Stubs für alles, was Nutzer hören oder das Credits hat.

---

## 5. Überarbeitete Roadmap

Prinzip: Jede Stufe muss **ohne Spotify Extended Quota** funktionieren. Features mit Missbrauchsfläche bleiben hinten.

### Stufe 0 — Validierung (1–2 Wochen Signal, bevor Code der App)

Ziel: herausfinden, ob Leute das *wollen*, nicht ob das Dashboard hübsch ist.

- Statische/leicht dynamische Landingpage, Daten-first: echter Comeback-Kalender (manuell gepflegt, 20–40 Einträge) + eine Trending-Liste (Last.fm-Tag `k-pop` / manuell / Circle-Chart-Verlinkung).
- Warteisten-Signup (E-Mail/Discord).
- Optional der stärkste Hook: „Last.fm verbinden → Anteil deines Hörens, der Korea ist“. Das ist in Stunden baubar, beweist den Stats-Kern, braucht kein Spotify.
- Ein tägliches Song-Rätsel (Heardle-artig, nur Deep-Link oder  kurze lizensierte Preview später — am Anfang: Cover/Blur, Albumjahr, Zeile als Text, kein Audio).
- In 2–3 echten Communities tragen (Discord-Server, r/kpop, r/khiphop, indie-koreanische Discords). Nicht Broad-Twitter zuerst.
- Erfolg: E-Mails, wiederkehrende Rätsel-Spieler, qualitative Aussagen „das würde ich nutzen wenn…“.

Wenn Stufe 0 tot ist: nicht V1 bauen.

### V1 — nutzbares Kernprodukt

Login:

- E-Mail/Passkey oder Google.
- **Last.fm verbinden** als primäre Stats-Quelle (nicht Spotify).
- ListenBrainz optional.
- Spotify optional und ehrlich beschriftet: „Playlists und Deep-Links“ — nicht „deine ganze Hörgeschichte“, solange Dev Mode gilt.

Katalog:

- Automatische Stubs sobald ein verbundener Nutzer etwas Neues scrobbelt oder ein Credit existiert (Last.fm/MusicBrainz, nicht distributor-gespeist).
- Kuratierte Tiefe nur für Fokus-A: Mitglieder, kurze Bio (selbst geschrieben), offizielle Fandom-Farbe, Diskografie-Überblick, Comeback-Historie.
- Song-Seiten: Titel (Hangul + Romanisierung + EN), Credits, Release-Datum, Deep-Links, Album, Dauer. Keine KI-Texte, keine BPM.
- Artist-Seiten auch für globale Feature-Artists, sobald Credit auf einem Korea-Release existiert. Keine manuelle Aufnahmepolitik.

Identität:

- Bias: **Gruppe oder Solo-Act**. Originalplan („nur Gruppen, weil Solos kein Mitglied haben“) ist falsch. Ult/Bias *ist* bei Solos der Act. Bei Gruppen: Act-Bias plus optionales Mitglied.
- Optionales Feld Bias Wrecker.
- Profil: Scrobbles (aus Last.fm), Top-Artists mit Zeitraum, sichtbarer Bias, Avatar-Ring in 6–8 echten Fandom-Farben, kein Colorpicker.

Entdeckung:

- Comeback-Kalender (manuell vorbefüllt — Termine sind in der Szene öffentlich).
- Eine Trending-Liste (community-scrobbles + editorial, nicht „Spotify Popularity“ — Feld existiert in Dev Mode sowieso nicht).
- Suche, die Hangul, Romanisierung und Aliasse gleichberechtigt matcht.

Social, bewusst dünn:

- Follow (kein Freundschafts-Request), Block, öffentliches Profil.
- Kein Chat, keine DMs, keine Reviews, keine Guides, kein Level.

Öffentlich ohne Account (SEO):

- Charts, Artist, Song, Kalender, Landing. Crawlbar.
- Footer: Status, Kontakt, Impressum, Datenschutz, Legal.

Bewusst nicht in V1: Level/Achievements, Chat, Guides, Playlist-Sync, Theming, Abo/Werbung, KI-Texte, Song-Stats, YouTube-Einbettung als Kern.

### V1.1 — Discovery & Katalog-Tiefe

- Chart-Tabs nach Tags (Genre, Sprache, Release-Typ, Generation — Generation nur automatisch aus Debüt, nie als Fan-Streit-Feld).
- Empfehlungen Stufe 1: Tag-Filter gegen eigene Hörhistorie (kein LLM, kein Spotify Recommendations-Endpunkt).
- Song-Beschreibungen: erst **Templates aus verifizierten Metadaten** („2024, R&B, Prod. Slom, Feature …“). LLM erst danach, und nur gegen eine vorgegebene Kandidatenliste / Faktenliste, nie frei halluzinierte Bios.
- YouTube-MV: Embed + gecachte Views. Community-Reaktionen statt Dislikes.
- Namuwiki nur als Link (CC BY-NC-SA 2.0 KR). Bios selbst schreiben, Quellen: MusicBrainz, Interviews, Namuwiki *lesen*, Genius *lesen*.
- Producer-/Songwriter-Seiten (siehe Abschnitt 7) — das ist der größte inhaltliche Hebel gegen Idol-Wikis.

### V1.2 — Social

- Reviews (Sterne + Text), Report, Rate-Limit, Shadow-Ban-Werkzeug *bevor* Launch dieses Moduls.
- Guides wiki-artig mit Versionierung. Voting-Guide: lieber zu Mubeat verlinken als Voting nachbauen.
- „Follows hören gerade“ nur mit explizitem Opt-in (Last.fm/ListenBrainz now-playing), nie stilles Auslesen fremder Spotify-Accounts (API kann das für Fremde sowieso nicht mehr).
- Share-Karten (Profil, Song, Wrapping). Chat/Gruppen weiter hinten — Moderationskosten explodieren.

### V1.3 — Playlists

- Im eigenen UI zusammenstellen, auch kollaborativ, **nicht abspielbar**.
- Sync in die Spotify-Bibliothek des Users (`POST /me/playlists`, Items hinzufügen — das ist einer der wenigen Endpunkte, die für den eigenen Account weitergehen). Apple später, wenn überhaupt, ohne Ads am Player.

### V1.4 — Progression & Kosmetik

Nur wenn V1.2 nicht toxisch wurde.

- XP aus Engagement, abnehmender Ertrag auf Scrobbles (sonst gewinnt nur wer 24/7 läuft).
- Freischaltungen: Kosmetik-Slots, höhere Follow-/Gruppengrenzen, öffentliche Guides, Leaderboard, gedeckeltes Stimmgewicht, Beta-Zugriff.
- Geld kauft nie XP, Level, Stimmgewicht, Ranglistenplatz — nur Kosmetik.
- Fan-Rang *pro Artist* zusätzlich zum Account-Level.
- Achievements + Leaderboards (global / Artist / Follows; all-time + saisonal).
- Tägliches Song-Rätsel + Album-Ratespiel (kann schon in Stufe 0 leben).

Anpassung:

- V1: 6–8 Fandom-Farben.
- Danach: Banner, Layout, Titel (Filter), limitierte/monatliche Kosmetik (Discord-Vorbild).
- Community-Themes nur CSS/Design-Tokens, Review vor Publish. Kein JS.

Monetarisierung (nicht vor nutzbarer V1, nicht vor Last.fm-kommerzieller Klärung):

- Frei: Kern + sehr dezente, **nicht an Player/Deep-Link-Buttons klebende** Werbung (Apple- und Spotify-TOS, auch ohne eigenen Player).
- Plus: werbefrei, monatliche Kosmetik, mehr Chart-Historie.
- Supporter: Beta, saisonale Kosmetik.

---

## 6. Infrastruktur, die V1 schon denken muss

### Tags (Song-Ebene, feste Listen, kein Freitext)

Dimensionen: Genre, Mood, Generation (aus Debüt ableitbar), Konzept, Sprache, Release-Typ.

- Genre/Generation automatisch vorschlagbar.
- Mood/Konzept editorial, im selben Rhythmus wie Comeback-Tracking.
- Community-Tagging **nicht** in V1.1 — Vote-Brigading in K-Fandoms ist vorhersehbar.

Versorgt: Chart-Filter, Empfehlungen Stufe 1, Beschreibungs-Templates, Bias-Vorschläge.

### Bias-Eligibility

Nicht per Nationalität automatisch (gemischte Line-ups, koreanisch-amerikanische Acts, globale Features). Pipeline: Vorschlag aus Label, MusicBrainz-Area, Genre-Tags, Sprache der Releases → manuelle Bestätigung.

Zusätzlich klären, was „koreanische Musik“ operational heißt, sonst driftet der Katalog:

- Primär: Artist hat Korea als Hauptwirkungsort **oder** Majority der Releases ist koreanischsprachig **oder** Act ist in koreanischer Industrie groß geworden.
- Features globaler Stars auf Korea-Releases → Stub ja, Bias-Eligibility nein.
- K-Pop-nahe japanische/chinesische Acts → raus, bis es eine zweite Marke gibt.

### Comeback-Cold-Start

Editorial füllt 3–7 Tage vorher: Titel (falls bekannt), Datum, Act, Typ (Single/EP/Album/Mixtape), Teaser-Links. Sobald ISRC/Spotify/YouTube existieren, matcht ein Job die externen IDs automatisch. Das ist Alltagsarbeit in der Szene, kein Sonderfall.

### Duplikate

Eigene Queue: „Dieser Scrobble matcht 3 Recordings“. Ohne menschliche Auflösung (oder strikte ISRC-Regel) werden Remix, Inst, JP-Ver, Live und Speed-up zu Fake-Stats.

---

## 7. Verbesserungen am Originalplan

1. **Spotify-first streichen** — siehe Abschnitt 3. Sonst ist V1 tot vor dem Launch.
2. **Bias auch für Solos.** Ult-Sprache der Szene kennt Bias als Person *oder* Act.
3. **Mehrere Biases / Bias-Line, hart gedeckelt** (z. B. 1 Ult + 3 Bias). Ein einzelner Slot fühlt sich in Multi-Fandom-Realität falsch an; unbegrenzt wird zu Spam.
4. **Produzenten als First-Class-Entities.** In koreanischem Hiphop/R&B/Indie *ist* der Beatmaker oft der Grund zum Hören. Relationen: produced, written, arranged, featured. MusicBrainz kann das tragen.
5. **Hangul-first Suche und Anzeige.** Sortierung, Autocomplete, Transliterationstabelle. Ohne das wirkt die Seite westlich-schief.
6. **Fokus-Mix Idol/Indie erzwingen**, sonst wird das Produkt unfreiwillig kprofiles 2.0.
7. **„Freunde hören gerade“ an Follow+Opt-in binden**, nicht an Spotify-Fremdprofile (API tot, Privatsphäre).
8. **KI-Bios nach hinten.** Halluzinierte Mitgliederlisten sind Vertrauensgift. Templates > LLM.
9. **BPM/Energy nicht über tote Spotify-Audio-Features und nicht über unklare Tunebat-Lage.** Entweder lizenzierte Metadata-API mit Vertrag, oder Feature streichen.
10. **Generation-Tag nicht community-editierbar.** 4th/5th-Gen-Streit ist Moderationsfalle.
11. **Impressum/Datenschutz/AV-Verträge in Stufe 0**, nicht „Footer irgendwann“. Betrieb aus DE: DDG-Impressum, DSGVO, TTDSG/TDDDG-Cookies, DSA-Transparenz sobald öffentlich.
12. **Last.fm-kommerziell klären bevor Plus-Abo.** Sonst steht Monetarisierung auf fremder ToS-Verletzung.
13. **Werbung nie an Deep-Link-Play-Buttons.** Auch ohne eigenen Player können Plattform-ToS greifen.
14. **Validierung vor Branding.** Name, Palette, Socials erst nach Signal. Original-Rollout ist hier richtig — beibehalten.
15. **Curation-Tooling ist V1-Infrastruktur**, kein Afterthought: Queue, Kalender-Editor, Alias-Pflege, Duplicate-Merge, Fokus-Flag. Ohne Admin-UI stirbt die Qualität in Woche 2.
16. **Öffentliches Changelog/Roadmap** wie geplant — gut für Vertrauen, schlecht wenn es Features verspricht, die an APIs kleben, die ihr nicht habt.

---

## 8. Weitere Optionen — priorisiert

Nicht alles bauen. Alles *bewusst* entscheiden.

### A. Hoher Fit, relativ früher Mehrwert

- **Producer/Writer-Graph** — „Songs, an denen Slom beteiligt war“, Filter nach Rolle. Alleinstellung gegen Idol-Wikis und gegen Last.fm.
- **Credit-Spotlight auf Song-Seiten** — Features, Hooks, Chorus-Writer. Standard in KR-Hiphop-Rezeption.
- **Korea-Anteil am Hören** als Profilzahl und Share-Karte. Sofort verständlich, viral, unique.
- **Comeback-Pipeline visuell:** Teaser → MV → Album → Music-Show-Cycle als Timeline, nicht nur ein Datum.
- **Alias- und Schreibweisen-Guide** pro Artist (수민 / SUMIN / Sumin). Kleine Sache, große Glaubwürdigkeit.
- **Setlist.fm-Link + eigene „gehörte Live-Version“ später.** Konzerte sind starke Fan-Momente.
- **Bandcamp- und SoundCloud-Deep-Links** für Indie/Underground, nicht nur Spotify/Apple/YouTube.
- **Yearly/Monthly Wrap** (eigene Karten, kein Spotify-Wrapped-Klon in Lila). Korea-gefiltert.

### B. Starker Fit zur Zielgruppe, aber bewusst Phase 2

- **Physische Sammlung auf Release-Ebene** (CD/Vinyl/Cassette), Discogs-OAuth-Import, „welche Edition habe ich“ an *eurer* Album-DB. Keine Photocards. Für Vinyl-/CD-Sammler (Crowdfunding-Pressungen, Indie-Runs) ist das ein echter Grund zur Wiederkehr — früher als Merch-Shop.
- **Crowdfunding-Tracker** (Makestar, Wadiz, Kickstarter, Bandcamp-Vorkasse): Status, Versandwellen, „ich habe pledged“. Fast niemand macht das sauber für KR-Indie.
- **Label-/Crew-Seiten** (KQ, AOMG, H1ghr, Independent, Woolim … plus Mini-Labels). Navigation über Industrie-Graph statt nur Artist-Inseln.
- **Music-Show-Wins / Circle Digital+Album** als editorial gepflegte Zahlen, Quellenverlinkung, keine Scraper-Garantie.
- **Kompatibilitäts-Score** zwischen zwei Profilen (gemeinsame Artists, nicht „ihr seid 87% Ot5“-Nonsens).
- **Listen-along / Status** auf Basis Last.fm now-playing, opt-in, Follow-only.

### C. Reizvoll, aber teuer oder rechtlich dünn — hinten oder nie

- Chat/DMs/Gruppen: Moderationsbudget, DSA, Jugendschutz.
- Lyrics + Romanisierung + Sprachlern-Modus: Lizenz (LyricFind o. ä.) oder bleiben lassen. Genius ist keine Lizenz.
- Melon-Lyric-/Chart-Scraper als Produktkern: nein.
- Eigenes Audio/Preview-Hosting: GEMA, Hosting, ToS.
- Photocard-Inventar: Markt voll, Support-Hölle.
- B2B-Label-Insights: Chartmetric/Songstats/Soundcharts/Viberate besetzen das. Nur sinnvoll mit Fandom-Stimmungsdaten, und die hat man erst mit Masse.
- Weißmarke an Afrobeats/Latin/Anime: Architektur erlaubt es, Marke und Kuration tun es nicht nebenbei.
- Native App: nach Web-PMF.
- Community-Themes mit Code: Sicherheitsrisiko, nur Tokens.
- Affiliate/Creator-Programm, Merch: nach zahlender Nutzerbasis.
- Fan-Events-Kalender (Cup-Sleeve, Fanmeet): rechtlich leichter, spam-anfällig, als Community-Einreichung mit Review denkbar.
- Discord-Bot als Satellit (Comeback-Ping, Rätsel des Tages): gute Distribution, nicht das Kernprodukt.

### D. Kleine UX-Optionen, die sich lohnen sobald V1 steht

- Zeitraum-Tabs + Auto/Manuell-Top-Artist (stand schon im Original — behalten).
- Private Profile / „Stats verstecken, Bias zeigen“.
- Export der eigenen Stats (DSGVO-Auskunft wird sowieso Pflicht).
- Report-Button an jedem User-Content von Tag 1 des Social-Moduls.
- „Wrong artist? Suggest merge“ für den Long Tail.
- Offline-fähiger Kalender (PWA), weil Web-first.

---

## 9. Seitenstruktur & UI (unverändert im Kern, geschärft)

- Eine Navigationsleiste überall: Logo, Charts, Kalender, Suche, Login. Guides/Pricing erst wenn die Seiten existieren — keine toten Links.
- Öffentlich: Charts, Artist, Song, Kalender, Guides (lesen).
- Account: Profilaktionen, Follow, später Playlists/Reviews.
- Landing: Daten-first (osu.ppy.sh-Logik). Kalender + ein Chart + ein Rätsel schlagen jeden Hero-Claim.
- Eingeloggt, oben nach unten: Bias-Spotlight/aktuelles Comeback → Korea-gefilterte Charts → Follow-Aktivität (falls Opt-in) → Rest über Navigation.
- Profil: Identität (Banner später, Avatar, Bias/Wrecker) → harte Zahlen → durchstöberbare Inhalte als Tabs.
- Footer: Status, Kontakt, Legal, Impressum, Datenschutz.
- Visuelle Referenzen existieren aus dem vorherigen Chat: Mobile Dashboard/Profil, zwei Desktop-Landings, Charts/Suche/Preis, 4 Paletten. Favorit bisher: **Mono + Bias-Farbe als Akzent**.

Barrierefreiheit und Lesbarkeit mitdenken (hohe Kontraste bei Neon-Dusk prüfen). Hell/Dunkel kann V1.1 sein, sollte aber nicht gegen die Bias-Akzent-Idee kämpfen.

---

## 10. Recht & Betrieb (DE)

- **Impressum** (DDG) ab öffentlicher Seite, auch Warteiste.
- **Datenschutzerklärung:** Hörverlauf ist hochpersönlich. Zweck, Rechtsgrundlage (Vertrag/Einwilligung), Aufbewahrung, Löschen, Export, Auftragsverarbeitung (Hoster, Analytics, Last.fm).
- **Cookies/Tracking:** TDDDG, Einwilligung vor nicht-essentiellen Trackern. Für Validierung: möglichst kein Marketing-Pixel.
- **Mindestalter:** in DE faktisch 16 für Informationsdienste mit Einwilligung; Community-Features eher 16+ und keine Kinder-Accounts.
- **DSA:** sobald öffentlich in der EU, Meldeweg für illegale Inhalte, Impressum der Moderationsregeln.
- **Namuwiki:** nur verlinken.
- **GEMA:** bei reinen Deep-Links i. d. R. nicht einschlägig; ändert sich sofort bei Audio-Hosting/Preview-Files.
- **Last.fm commercial / YouTube ToS / Spotify Developer Policy / Apple MusicKit** vor jedem Abo oder Ad-Experiment schriftlich prüfen.
- **KI-Texte:** Quellenangabe, keine erfundenen Credits, Review-Flag für Fokus-Artists.
- **Marken/Domain:** bias.fm und Alternativen (comeback radar, stanboard, wave.fm, stan.fm, ult.fm, mybias.app, charted.fm, …) auf Domain, EUIPO/DPMA und Kollisionen (z. B. Bias Room) prüfen *nach* Validierung, nicht davor. fancam.fm weckt Video-Erwartung — schlecht.

---

## 11. Naming, Branding, Team

- Arbeitstitel bias.fm, nicht final.
- Palette: Neon Dusk, Warm Paper, Mono+Bias (Favorit), Deep Jewel.
- Drei Rollen, ehrlich benannt:
  1. **Produkt/Editorial** — Kalender, Fokus-Bios, Tags, Merges. Ohne diese Person ist die App leer.
  2. **Engineering** — Katalog-Matcher, Last.fm, Admin-UI, öffentliches Web.
  3. **Moderation/Community** — kann anfangs dieselbe Person wie 1 sein, ab Reviews nicht mehr.
- Commitment-Gespräch *vor* Landingpage-Feinschliff. Wenn Editorial nicht wirklich Zeit hat, V1 auf Kalender+Rätsel+Last.fm-Stats reduzieren und Katalog-Tiefe streichen.

---

## 12. Rollout (angepasst)

1. Mitstreiter: Stunden/Woche Editorial + Coding verbindlich machen. Wenn unklar: Solo nur Stufe 0.
2. Last.fm API-Key (non-commercial) + MusicBrainz User-Agent. Spotify-App höchstens als optionales Experiment mit Premium-Owner und 5 Testern.
3. Stufe-0-Landing: Kalender, ein Chart, Waitlist, optional Last.fm-Korea-Anteil, optionales Rätsel.
4. In konkrete Communities, 1–2 Wochen Signal.
5. Wenn Signal da: V1 laut Abschnitt 5. Curation-Admin zuerst, öffentliches UI zweite.
6. Name/Branding/Socials nach V1, nicht davor.
7. V1.1+ inkrementell, öffentliches Changelog, keine API-abhängigen Versprechen.

Aktueller Stand: Schritt 1 nicht begonnen. Alles Konzept.

---

## 13. Offene Entscheidungen

- Operationalisierung „koreanische Musik“ (Abschnitt 6) schriftlich festziehen.
- Last.fm-kommerziell: Timeline, wer partners@last.fm anschreibt.
- Fokus-A-Liste: 20 Namen, Genre-Mix, wer die Bios schreibt.
- Ob physische Sammlung in V1.x vor Social gezogen wird (für Sammler-Zielgruppe oft ja).
- Ob das Rätsel Audio braucht (Lizenz) oder bewusst text/cover-basiert startet.
- Hosting/EU-Datensitz.
- Domain erst nach Signal kaufen oder jetzt günstige .app parken.

---

## 14. Kurz: was sich gegenüber v1 geändert hat

| Thema | v1 | v2 |
|---|---|---|
| Login/Daten | Spotify-OAuth zuerst | Last.fm/ListenBrainz zuerst, Spotify optional |
| Bias | nur Gruppenmitglieder | Act + optionales Mitglied, Solo erlaubt, Ult+Line gedeckelt |
| Song-Stats | Tunebat/Songstats in V1.1 | erst mit klarem Vertrag; Audio Features nicht über Spotify |
| KI | relativ früh | Templates zuerst |
| Fokus-Artists | 15–30 unspezifisch | Launch-Mix ~20 inkl. Indie/Produzenten, dann 50 |
| Validierung | Landing, dann V1 | Rätsel + Korea-Anteil-Hook, sonst kein V1 |
| Produzenten | nicht erwähnt | First-Class-Option mit höchstem Fit |
| Physisch/Crowdfunding | „später, nicht Kern“ | Phase-2-Kandidat mit echtem Fit zur Sammler-Szene |
| Social-Now-Playing | implizit | nur Follow + Opt-in, nie fremde Spotify-IDs |
