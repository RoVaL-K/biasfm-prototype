# bias.fm

Musik entdecken, Songs merken, persönliche Release-Termine verwalten und öffentliche Hörhistorien auswerten. Das bestehende Projekt verwendet HTML, CSS und JavaScript sowie einen Node-Server ohne Laufzeitabhängigkeiten.

## Start

Node.js 22 oder neuer:

```sh
npm install
npm start
```

Website: http://localhost:3000. Ein anderer Port kann über `PORT` gesetzt werden.

Für Last.fm `.env.example` nach `.env` kopieren und den eigenen Schlüssel eintragen. Start mit:

```sh
node --env-file=.env server.js
```

Ohne Last.fm-Schlüssel funktioniert der öffentliche ListenBrainz-Import; Last.fm zeigt eine verständliche Meldung statt erfundener Ergebnisse.

## Umgesetzte Abläufe

- Songauswahl, vorheriger/nächster Song und Links zur Titelsuche bei Musikdiensten. Es gibt keine simulierte Musikwiedergabe.
- Favoriten mit Sammlung im Profil und Entfernen gespeicherter Songs.
- Profil, fünf Produkt-Themes, separater Profil-Akzent, Termine, Merkliste, Suchaliase und Tagesrätsel werden lokal im jeweiligen Browser gespeichert.
- Persönliche Termine anlegen, bearbeiten und mit Bestätigung löschen; Filter nach Genre, Merkliste und vergangenen Terminen; Export der sichtbaren Auswahl als korrekt maskierte und gefaltete iCalendar-Datei.
- Suchaliase bleiben nach einem Neuladen wirksam.
- Tagesrätsel wechselt um Mitternacht in Korea. Antworten müssen einen vollständigen hinterlegten Titel treffen. Zusätzliche Hinweise nach dem ersten und dritten Versuch ersetzen das vorherige unechte Cover-Rätsel.
- Echter Import öffentlicher Hördaten mit Lade-, Abbruch-, Leer- und Fehlerzuständen. Ergebnisse bleiben nur für die Sitzung verfügbar; der Server hält Antworten höchstens fünf Minuten im Arbeitsspeicher vor.
- Spotify Extended History kann als JSON oder ZIP lokal eingelesen werden. Duplikate, fehlende Abspielwerte und nicht zugeordnete Artists werden transparent behandelt; die Dateien verlassen den Browser nicht.
- Statistik als PNG herunterladen oder als Text kopieren.
- Verbesserte Tastaturaktionen, Dialogfokus, reduzierte Bewegung und sichere Anzeige von Nutzereingaben.

## Bedeutung der Hörstatistik

ListenBrainz liefert bis zu 1.000 zuletzt übermittelte Plays. Last.fm liefert Künstlerstatistiken für zwölf Monate mit vollständiger Seitennavigation bis maximal 10.000 Künstlern; größere Profile werden ausdrücklich abgelehnt und nicht als vollständig ausgegeben.

Der Abgleich verwendet Namen und im Katalog hinterlegte Aliase. Nicht zugeordnete Plays können weitere koreanische Musik enthalten. Der angezeigte Wert ist daher eine katalogbasierte Schätzung innerhalb der geladenen Daten, kein vollständig ermittelter Korea-Gesamtanteil. Nutzerdefinierte Suchaliase sind nur Teil der persönlichen Suche, nicht des serverseitigen Statistik-Abgleichs.

Offizielle Schnittstellenbeschreibung: [Last.fm user.getTopArtists](https://www.last.fm/api/show/user.getTopArtists) und [ListenBrainz listens](https://listenbrainz.readthedocs.io/en/latest/users/api/core.html).

## Daten und offene Voraussetzungen

- Der übernommene Song-/Künstlerkatalog ist Referenzinhalt. Seine Credits und Aufnahme-IDs sind nicht unabhängig verifiziert. Erfunden wirkende Track-IDs werden nicht als verifizierte Abspielziele verwendet; Streaminglinks öffnen eine passende Titelsuche.
- Die übernommenen Beispiel-Scrobblezahlen werden nicht als Live-Charts gezeigt. Eine tatsächliche Community-Chart benötigt erst eine belastbare Datenquelle und Aggregation.
- Unbestätigte Beispiel-Comebacks sind nicht als echte Veröffentlichungsankündigungen sichtbar. Der Radar verwendet persönliche Termine, MusicBrainz und öffentliche Redaktionseinträge.
- Persönliche Einträge bleiben lokal. Mit einem bias.fm-Konto werden Profil, Follows und Benachrichtigungen zusätzlich über Geräte synchronisiert; der Server speichert dabei nur die für den Account nötigen Daten.
- Last.fm benötigt einen Betreiber-API-Schlüssel. Spotify-Profil- und Playlist-Links funktionieren ohne API; die zusätzliche Kontoverknüpfung benötigt eine eigene Spotify-App.
- Betreiber- und Kontaktangaben sind vor einer Veröffentlichung zu vervollständigen.

## Hosting

Der vorhandene GitHub-Pages-Workflow veröffentlicht nur statische Dateien. Er kann den Node-Endpunkt `/api/listening` nicht ausführen. Die GitHub-Seite bleibt deshalb der statische Frontend-Mirror; für serverseitige Anbieterabfragen, Spotify-OAuth und öffentliche Redaktion verwendet sie automatisch die Cloudflare-API.

Der Server liefert ausschließlich öffentliche HTML-, CSS- und JavaScript-Dateien und den definierten API-Endpunkt aus. Projektdateien, `.env`, Git-Metadaten und Serverquelltext sind darüber nicht erreichbar.

### Cloudflare Pages (Produktion)

Das Projekt ist zusätzlich als Cloudflare-Pages-Projekt `biasfm-prototype` veröffentlicht: [biasfm-prototype.pages.dev](https://biasfm-prototype.pages.dev/). Die Dateien unter `functions/` werden bei jedem GitHub-Push als Pages Functions bereitgestellt. Dadurch laufen die dynamischen Abläufe am selben Ursprung wie die Produktionsseite:

- `functions/api/listening.js` importiert öffentliche ListenBrainz- und Last.fm-Daten.
- `functions/api/releases.js` lädt den Live-Radar aus MusicBrainz und ergänzt veröffentlichte Redaktionseinträge.
- `functions/api/spotify/*` übernimmt PKCE, sichere Sitzungen und Playlist-Abfragen, sobald eine Spotify-Client-ID hinterlegt ist.
- `functions/api/editorial/*` speichert und verwaltet veröffentlichte Einträge in der D1-Datenbank `biasfm-production`.
- KV `BIASFM_CACHE` hält zeitlich begrenzte Provider-Antworten; KV `BIASFM_SESSIONS` hält die kurzlebigen Spotify-Sitzungen.

Die Bindings sind in [wrangler.jsonc](wrangler.jsonc) dokumentiert. Anbieter- und Redaktionsschlüssel werden ausschließlich als Cloudflare-Umgebungsvariablen gesetzt und nie in Git committed. Ohne `LASTFM_API_KEY`, `SPOTIFY_CLIENT_ID` und `EDITORIAL_TOKEN` bleiben die jeweiligen optionalen Funktionen abgeschaltet, während Gesundheitstest, MusicBrainz-Radar und das statische Frontend weiter funktionieren.

## Prüfen

```sh
npm test
```

Die Tests verwenden den echten HTTP-Handler und die tatsächlichen Oberflächenmodule in einer DOM-Testumgebung. Sie prüfen Datum/Uhrzeit, Ergebnisberechnung, Provider-Fehler, Seitenwechsel, Favoriten, persistente Aliase, Rätsel, Kalenderpflege und -export, Dialogwechsel sowie Speicherfehler. Die Schnittstellentests sind deterministisch; ein ListenBrainz-Liveimport wurde zusätzlich durchgeführt. Eine zusätzliche Desktop- und Mobilprüfung der neuen Ansichten wurde durchgeführt.

## Planung

[improvementV1.md](improvementV1.md) enthält die zusammengefassten Gedanken aus dem Gespräch, Prioritäten, Abnahmekriterien, offene Designideen und die nächsten Ausbaustufen.

## Ausbau V1: Spotify, Live-Radar und öffentliche Redaktion

Die Funktionen aus `improvementV1.md` wurden weiter umgesetzt:

- **Spotify-Profil und Playlist-Links:** geprüfte `open.spotify.com`-URLs, persistente Sammlung, Duplikatprüfung und Entfernen.
- **Spotify-Anmeldung:** Authorization Code mit PKCE, einmaliger State, HttpOnly-/SameSite-Cookie, serverseitige Tokens, Token-Erneuerung, aktuelle Benutzer-Playlists mit Seitennavigation, Fehlermeldungen bei fehlender Freigabe sowie Verbindung trennen. Keine Anforderung von E-Mail, Wiedergabe- oder Schreibrechten. Sitzungen liegen im Arbeitsspeicher und enden spätestens nach sieben Tagen oder bei einem Serverneustart.
- **Live-Radar:** MusicBrainz-Veröffentlichungen im Zeitraum von 90 Tagen vor bis 90 Tagen nach dem Abruf. Alle 14 Katalog-Künstler sind mit geprüften MusicBrainz-IDs zugeordnet; namensgleiche ausländische Künstler werden nicht übernommen. Jeder Release verweist auf die Quelle. Unvollständige Datumsangaben werden ausgelassen. MusicBrainz-Inhalte sind gemeinschaftlich gepflegte Metadaten, keine Zusage einer vollständigen Comeback-Liste.
- **Last.fm-Tag-Charts:** Top-Titel für k-pop, k-indie, k-hiphop und k-rnb, mit Quelle und Abrufdatum. Es handelt sich nicht um eine Wochenchart oder eine eigene bias.fm-Community-Aggregation. Benötigt Last.fm-Schlüssel.
- **Öffentliche Redaktion:** Entwurf/Veröffentlichung, Quellenpflicht, Release-Phasen, Bearbeiten und Löschen. Speicherung als atomar aktualisierte JSON-Datei unter `DATA_DIR`; Versionen verhindern das Überschreiben fremder zwischenzeitlicher Änderungen. Ein gemeinsamer Redaktionsschlüssel schützt Schreibzugriffe; dies ist keine individuelle Mitarbeiterkontenverwaltung.
- **Gestaltung:** farbigere Fandom-Flächen, konsistente Formulare, Playlist-Karten, korrigierte mobile Abstände und kompakte mobile Songleiste. Das geschlossene Mobilmenü ist nicht mehr per Tastatur erreichbar.

### Einrichten

```sh
npm run setup
npm start
```

`setup` legt nur dann eine private `.env` an, wenn noch keine existiert, und erzeugt dabei einen zufälligen Redaktionsschlüssel. Vorhandene Konfiguration wird nicht überschrieben. Der Schlüssel wird nie ausgegeben. Er steht unter `EDITORIAL_TOKEN` in der lokalen `.env` und öffnet in „Sammlung → Öffentliche Redaktion“ die Redaktion. Die Datei ist von Git und Docker-Build-Kontext ausgeschlossen.

Weitere Werte in `.env`:

- `LASTFM_API_KEY`: Betreiber-Schlüssel für Hörstatistik und Charts.
- `SPOTIFY_CLIENT_ID`: Client-ID der eigenen Spotify-App. Im Spotify-Dashboard muss `<APP_ORIGIN>/api/spotify/callback` als Rücksprungadresse registriert sein. Lokal `http://127.0.0.1:3000/api/spotify/callback`, nicht `localhost`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth-Client für Google. Als autorisierte Rücksprungadresse `https://biasfm-prototype.pages.dev/api/auth/google/callback` und für den GitHub-Pages-Mirror ebenfalls dieselbe Cloudflare-Adresse verwenden. Der Login fordert nur `openid email profile` an.
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`: OAuth-Client für Discord. Als Rücksprungadresse `https://biasfm-prototype.pages.dev/api/auth/discord/callback` eintragen und die Scopes `identify` und `email` erlauben. Discord muss eine bestätigte E-Mail-Adresse liefern, damit ein Account sicher mit einem bestehenden E-Mail-Konto zusammengeführt werden kann.
- `APP_ORIGIN`: tatsächlicher Ursprung der Website. Produktion: HTTPS; lokal: Loopback-IP. Bei einer anderen lokalen Portnummer beide Angaben entsprechend setzen.
- `DATA_DIR`: dauerhafter Datenträger für Redaktionseinträge.
- `OPERATOR_NAME`, `OPERATOR_ADDRESS`, `OPERATOR_EMAIL`: öffentliche Betreiberangaben für die Informationsseite. Ohne diese Angaben gibt es kein fertiges Impressum.

Die Anwendung lädt eine vorhandene `.env` beim Start selbst. Extern gesetzte Umgebungsvariablen haben Vorrang. E-Mail/Passwort-Accounts sind sofort verfügbar. Google- und Discord-Login erscheinen nach dem Setzen der vier OAuth-Werte als aktive Buttons; ohne diese Werte zeigen sie bewusst einen ehrlichen Status.

### Server-Hosting

Ein `Dockerfile` für Node 22 mit einem unprivilegierten Benutzer, Healthcheck und persistentem Volume liegt bei. `npm run build` prüft JavaScript und erstellt ausschließlich öffentliche statische Dateien unter `dist/`. Der GitHub-Pages-Workflow veröffentlicht nur dieses Verzeichnis und führt zuvor Tests aus. Für die produktiven dynamischen Funktionen wird Cloudflare Pages verwendet; der Node-Server bleibt für lokale Entwicklung und alternative Deployments verfügbar.

Für Docker einen dauerhaften Datenträger nach `/app/.data` einbinden, `APP_ORIGIN` auf die HTTPS-Adresse setzen und Konfigurationswerte als Umgebungsvariablen übergeben. Der Container benötigt einen vorgeschalteten HTTPS-Endpunkt. Ein Container-Build wurde in diesem Durchgang nicht ausgeführt; der lokale Node-Server und der statische Build wurden geprüft.

### Nachweise und Grenzen

26 automatisierte Tests prüfen die Hauptabläufe, Spotify-PKCE und Session-Isolation, Playlist-Daten, Redaktionsrechte, Speicherung über Serverneustarts, Versionskonflikte, Themes, lokalen Spotify-Import und eindeutige Release-Zuordnung. Der MusicBrainz-Liveabruf lieferte im Test acht passende Einträge. Home, Charts, Radar, Katalog, Daily-Modi, Stats-Connect/Import, Profil, Themes und Curation wurden zusätzlich im Browser geprüft. Die Namenszuordnung in Hörstatistiken nutzt MusicBrainz-IDs, wenn der Dienst sie mitliefert; andernfalls bleibt sie eine offengelegte Schätzung anhand der Namen.

Verwendete Primärdokumentation: [Spotify PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [Benutzer-Playlists](https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists), [Spotify-Änderungen 2026](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [Rücksprungadressen](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [MusicBrainz-Suchfelder](https://musicbrainz.org/doc/Indexed_Search_Syntax), [Last.fm-Tag-Charts](https://www.last.fm/api/show/tag.getTopTracks).

## Produktüberarbeitung: Improvement V1

Das Feedback unter `docs/improvementV1-feedback.md` ist als priorisierte Produktvorlage übernommen. Der genaue Implementierungsstand und die noch erforderlichen Daten-/Kontovoraussetzungen stehen am Ende von `improvementV1.md`.

Öffentliche Navigation: Entdecken, Charts, Radar, Rätsel. Persönliche Bereiche: `#profile`, `#settings`, `#saved`, `#stats`. Redaktion: `#admin` (bestehender serverseitiger Schlüssel erforderlich). Die Player-Leiste ist entfernt; Songdetails enthalten Merken und direkte Anbieterlinks. Drei unabhängige Daily-Modi wechseln gemeinsam um 00:00 KST. Fünf Produkt-Themes bleiben unabhängig vom Profil-Akzent.

Charts unterscheiden Community (noch keine gemeinsamen Hördaten), Korea-Originalquellen und Last.fm-Tag-Signale. Externe Rankings werden nicht kopiert oder aus Katalogdaten erfunden. Original-Referenzen: [Circle Chart](https://circlechart.kr/), [Melon](https://www.melon.com/chart/index.htm). Die Last.fm-Zeitraumauswahl verwendet die [dokumentierten Perioden](https://www.last.fm/api/show/user.getTopArtists), mit gesonderten Cache-Einträgen pro Zeitraum.
