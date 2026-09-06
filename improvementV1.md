# bias.fm — Verbesserungsplan V1

Stand: 6. September 2026

## Ziel und Einordnung

bias.fm soll sich wie ein verlässliches, professionelles Musikprodukt anfühlen. Die bereits vorhandene Auswahl an Funktionen trifft die Vorstellung des Auftraggebers und seines Bruders grundsätzlich gut. Die nächste Entwicklungsphase konzentriert sich deshalb auf funktionierende Abläufe, echte Daten und nachvollziehbare Ergebnisse. Ein umfassendes Redesign und zusätzliche Funktionen folgen, sobald diese Grundlage trägt.

Dieser Plan ergänzt den bisherigen Auftrag: „Die Funktionalität komplett ordentlich umsetzen, nicht nur Konzepte; das Produkt soll sich wie das Angebot einer erstklassigen Firma anfühlen.“ Er ersetzt ihn nicht.

## Aus dem Gespräch abgeleitete Anforderungen

### Bestätigte Richtung

- Die vorhandenen Features bilden eine gute Grundlage. Sie werden vervollständigt und sinnvoll verbunden.
- Zunächst haben Funktionalität, Datenanbindung und API-Integration Vorrang gegenüber einem großen Redesign.
- Feedback zu fehlenden Funktionen und abweichenden Vorstellungen wird an einer zentralen Stelle gesammelt und in umsetzbare Aufgaben übersetzt.
- Spotify ist eine mögliche Referenz für eine vertraute Musikoberfläche: verständliche Navigation, schnelle Songauswahl, persönliche Sammlung und gut erreichbare Aktionen.

### Wünsche, die noch konkretisiert werden müssen

- Eine farbigere Gestaltung ist interessant; eine endgültige Farbwelt wurde noch nicht ausgewählt.
- Ein Spotify-Profil könnte im persönlichen bias.fm-Profil sichtbar oder verlinkt sein.
- Eigene Spotify-Playlists könnten gegebenenfalls angezeigt werden.

Die Spotify-Wünsche sind Kandidaten für eine spätere Integration, keine bereits bestätigte Zusage über verfügbare API-Funktionen. Ein einfacher Profil-Link, ein tatsächlich verifiziertes Konto und der Zugriff auf Playlists sind drei unterschiedliche Ausbaustufen.

### Was noch keine Produktentscheidung ist

Die Diskussion über Claude, Grok und Perplexity betrifft Werkzeuge zur Ideenfindung. Sie begründet weder eine technische Abhängigkeit noch einen Auftrag, weitere Modelle einzubinden. Ideen und Designs werden nach ihrem Nutzen für das Produkt beurteilt. Der dritte Punkt der ursprünglichen Nachricht enthält keine ausgeführte Anforderung und wird deshalb nicht interpretiert.

## Phase 1 — Bestehende Funktionen zuverlässig machen

**Priorität: jetzt.**

1. Alle vorhandenen Aktionen auf echte Wirkung prüfen. Erfolgsmeldungen dürfen nur nach erfolgreicher Ausführung erscheinen. Simulierte Wiedergabe und erfundene Importergebnisse beseitigen.
2. Songauswahl, Streaminglinks, Favoriten, Suche und Detailansichten zu einem konsistenten Ablauf verbinden.
3. Kalender und persönliche Einträge vervollständigen: Filter, Merken, Bearbeiten, Löschen und brauchbare Kalenderexporte.
4. Das Tagesrätsel an den tatsächlichen Tag in Korea koppeln und Antworten korrekt auswerten. Ergebnisse müssen nach einem Neuladen erhalten bleiben.
5. Das Profil zuverlässig speichern, Eingaben prüfen und die persönliche Sammlung zugänglich machen.
6. Leere Ergebnisse, ungültige Eingaben, Verbindungsfehler und fehlenden Speicher verständlich behandeln.
7. Interne Konzept- und Entwicklungsnotizen aus den normalen Nutzerwegen entfernen. Technische Dokumentation bleibt im Projekt erhalten.

**Abnahme:** Die vorhandenen Hauptwege funktionieren ohne vorgetäuschte Ergebnisse. Nutzereingaben bleiben erhalten, soweit dies im jeweiligen Ablauf zugesagt wird. Tastaturbedienung und Darstellung auf kleinen Bildschirmen werden bei den betroffenen Komponenten mit berücksichtigt.

## Phase 2 — Echte Daten und API-Anbindungen

**Priorität: zusammen mit Phase 1, soweit für deren Funktionen erforderlich.**

1. Öffentliche Hörhistorien über geeignete Dienste importieren. Last.fm und ListenBrainz sind die bestehenden Ausgangspunkte.
2. Datenquelle, betrachteten Zeitraum, Umfang und Aktualisierungszeit sichtbar machen.
3. Koreanische Künstler nachvollziehbar zuordnen. Nicht erkannte Künstler als ungeklärt behandeln; eine unvollständige Zuordnung darf nicht als exakter Korea-Gesamtanteil ausgegeben werden.
4. Statische Beispieldaten weder als aktuelle Community-Charts noch als verifizierte Veröffentlichungsankündigungen darstellen.
5. Zugangsdaten auf dem Server halten. Zeitlimits, wiederholte Anfragen, Fehlerfälle und Dienstlimits berücksichtigen.
6. Für gemeinsam gepflegte Inhalte später ein verbindliches Datenmodell, dauerhafte Speicherung sowie Redaktionsrechte festlegen. Lokale persönliche Einträge dürfen nicht als öffentliche Veröffentlichung bezeichnet werden.

**Abnahme:** Ergebnisse stammen aus der angegebenen Quelle. Fehlende Zugänge, unvollständige Daten und externe Ausfälle werden ehrlich angezeigt. Für eine Veröffentlichung müssen Datenversorgung und Hosting die benötigten Serverfunktionen unterstützen.

## Phase 3 — Spotify-Verknüpfung prüfen und gezielt ausbauen

**Priorität: nach Stabilisierung der Kernabläufe.**

Vor der Umsetzung werden die dann gültigen offiziellen Spotify-Unterlagen und der tatsächlich verfügbare App-Zugang geprüft. Die Aussagen aus dem Gespräch zu API-Einschränkungen gelten als Prüfhinweis, nicht als bereits verifizierte technische Spezifikation.

| Ausbaustufe | Gewünschter Nutzen | Voraussetzung |
| --- | --- | --- |
| Profil-Link | Spotify-Profil im bias.fm-Profil öffnen | Eingabe und Prüfung einer Spotify-Profil-URL |
| Kontoverknüpfung | Ein Spotify-Konto nachweisbar dem eigenen Profil zuordnen | Verfügbarer OAuth-Zugang, passende Berechtigungen und sicherer Umgang mit Tokens |
| Playlist-Anzeige | Zugängliche eigene Playlists im Profil entdecken und beim Anbieter öffnen | Zulässige Endpunkte, passende Berechtigungen und geklärte Sichtbarkeit |

**Abnahme:** Die gewählte Stufe funktioniert mit dem vorgesehenen Nutzerkreis. Verbindung trennen, widerrufene Berechtigungen und leere/private Playlists sind berücksichtigt. Keine Oberfläche verspricht Zugriff, den die tatsächliche Freigabe nicht erlaubt.

## Phase 4 — Visuelle Weiterentwicklung

**Priorität: später; notwendige Bedienungsverbesserungen bereits in Phase 1.**

- Die bestehende Musikoberfläche und ihre Orientierung bleiben Ausgangspunkt.
- Spotify liefert Anregungen für Übersichtlichkeit und vertraute Bedienung. bias.fm behält eine eigene Identität.
- Eine farbigere Richtung mit Fandom-Akzenten wird anhand weniger konkreter Ansichten entwickelt: Startseite, Songliste, Profil.
- Kontrast, Lesbarkeit, mobile Nutzung und konsistente Zustände haben Vorrang vor dekorativen Effekten.
- Erst nach Auswahl einer Richtung wird die gesamte Oberfläche überarbeitet.

**Abnahme:** Die ausgewählte Gestaltung trägt durch die wichtigsten Ansichten und Zustände. „Mehr Farbe“ ist dann durch konkrete Beispiele und Gestaltungsregeln definiert.

## Phase 5 — Betrieb und Veröffentlichung

- Tatsächliche Betreiber- und Kontaktangaben ergänzen; vorhandene Platzhalter sind kein fertiges Impressum.
- Hosting passend zu den benötigten Datenabfragen und Speicherfunktionen festlegen.
- Externe Zugänge konfigurieren und mit echten Testkonten verifizieren.
- Hauptabläufe auf Desktop und Mobilgerät einschließlich Fehlerfällen durchspielen.
- Bekannte Einschränkungen und offene Datenquellen dokumentieren.

## Feedback sammeln

Weitere Gedanken werden hier ergänzt. Eine kurze Beschreibung pro Punkt genügt:

- **Bereich:** Auf welcher Seite oder bei welcher Aktion?
- **Beobachtung:** Was passiert derzeit oder was fehlt?
- **Wunsch:** Was soll stattdessen möglich sein?
- **Wichtigkeit:** Muss vor dem Start funktionieren / später sinnvoll / reine Idee.
- **Referenz, falls vorhanden:** Beispiel, Link oder Screenshot.

Die Umsetzung darf mit den bestätigten Prioritäten fortgesetzt werden. Offene Designwünsche und zusätzliche Integrationen werden erst konkretisiert, wenn ihre Phase ansteht.

## Ursprünglicher Arbeitsauftrag (durch die Fortsetzung erweitert)

Die laufende Arbeit setzt Phase 1 und die dafür notwendigen Teile von Phase 2 um. Ein umfassendes Redesign, zusätzliche Spotify-Kontoverknüpfungen und neue Community-Funktionen werden durch dieses Gespräch noch nicht als sofortige Umsetzung vorgezogen.

## Zwischenstand vor der Fortsetzung

- **Umgesetzt:** echte Songaktionen, Favoritensammlung, persistente Suchaliase, persönliche Kalenderpflege mit Bearbeiten/Löschen und Export, täglicher Rätselwechsel nach koreanischer Zeit, genauer Antwortabgleich, tatsächlicher Hördatenimport, Fehlerzustände und Statistikexport als PNG/Text.
- **Geprüft:** automatisierte Prüfungen der Kernabläufe und des HTTP-Servers; zusätzlicher Liveimport von ListenBrainz erfolgreich.
- **Noch Voraussetzung:** Last.fm-Schlüssel, serverfähiges Hosting, verifizierte Datenquelle für öffentliche Comebacks und Community-Charts, vollständige Betreiberangaben.
- **Weiterhin später:** Spotify-Kontoverknüpfung, Playlist-Anzeige, gemeinsame Redaktion und umfassendes farbigeres Redesign.

Die Umsetzung ist damit eine funktionierende Grundlage für persönliche Nutzung. Die noch fehlenden externen Zugänge und die gemeinsame Datenversorgung werden nicht als bereits fertig dargestellt.


## Fortsetzung: Umsetzung des gesamten besprochenen Ausbaus

Der anschließende Auftrag „alles umsetzen“ zieht die besprochenen Spotify-Funktionen und die farbigere Gestaltung jetzt in die aktive Umsetzung. Er erweitert damit den zuvor engeren Arbeitsauftrag.

| Bereich | Stand |
| --- | --- |
| Bestehende Hauptabläufe | Umgesetzt und automatisiert geprüft |
| Spotify-Profil-/Playlist-Links | Umgesetzt, validiert und lokal gespeichert |
| Spotify-Anmeldung und Benutzer-Playlists | PKCE, Session, Token-Erneuerung, Seiten und Trennen implementiert; Live-Freischaltung benötigt eigene Client-ID |
| Release-Daten | MusicBrainz angebunden; eindeutige IDs aller 14 Katalog-Künstler geprüft; Quellen sichtbar |
| Last.fm-Charts | Tag-Charts implementiert; API-Schlüssel noch erforderlich |
| Öffentliche Redaktion | Geschützter Zugang, Entwürfe, öffentliche Einträge, Quellen, Versionskonflikte und dauerhafter Speicher umgesetzt |
| Farben und mobile Bedienung | Bestehende Musikoberfläche um farbigere Flächen und Playlist-Karten erweitert; mobile Abstände und Navigation korrigiert |
| Betreiberangaben | Aus Konfiguration anzeigbar; tatsächliche Angaben müssen noch geliefert werden |
| Hosting | Node-Server, Dockerfile, Healthcheck, Build und bereinigte Pages-Veröffentlichung vorbereitet; kein neuer öffentlicher Server bereitgestellt |

**Prüfung:** 15 automatisierte Tests erfolgreich; reale ListenBrainz- und MusicBrainz-Abfragen; zusätzliche Browserprüfung auf Desktop und Mobilgerät. Die geprüften Spotify- und Last.fm-Abläufe ersetzen keine abschließende Verifikation mit den tatsächlichen Anbieterzugängen.

**Verbleibende Freischaltungen:** Spotify-App registrieren/Client-ID hinterlegen, Last.fm-Schlüssel hinterlegen, HTTPS-Hosting mit dauerhaftem Speicher wählen und Betreiberangaben ergänzen. Die Anwendung zeigt fehlende Zugänge als solche an.

## Überarbeitung nach dem Feedback-Dokument (7. September 2026)

Die vollständige, unveränderte Entscheidungsvorlage liegt unter `docs/improvementV1-feedback.md`. Sie unterscheidet V1-Aufgaben, optionale Varianten und ausdrücklich spätere P2-Ideen. Die folgende Übersicht ersetzt frühere Designentscheidungen dieses Arbeitsstands.

### Umgesetzt

- **Navigation:** Entdecken, Charts, Radar, Rätsel; Suche und persönliches Menü. Profil, Stats, Gemerkt und Einstellungen liegen im persönlichen Bereich. Konzept und Redaktion sind keine öffentlichen Navigationspunkte; der geschützte Redaktionszugang bleibt unter `#admin` erreichbar.
- **Startseite:** zentrierter Hero mit einer Hauptaktion, Drei-Schritte-Erklärung, zwei getrennte Chart-Perspektiven, kompakte Radar-/Daily-Einstiege. Kein Begrüßungsdashboard, keine Farbwahl im Hero, keine Song-Schnellzugriffs-Doppelung und keine Player-Leiste.
- **Charts:** getrennte Community-, Korea- und Last.fm-Perspektiven. Circle und Melon sind Original-Quellenlinks, keine kopierten Rankings. Last.fm zeigt Quelle und Abrufzeit und lädt zunächst 25 Zeilen. Der vorhandene Songkatalog ist ausdrücklich keine Rangliste; Generation wird nur im Idol-Filter angezeigt. Links auf `#charts/community` und `#charts/korea` öffnen die jeweilige Perspektive.
- **Entdecken:** Artists/Credits, Releases, Labels, Genres sowie bestehende Szene-Einstiege; Hangul, Romanisierung und eigene Suchaliase bleiben nutzbar.
- **Radar:** kompakte Agenda und Monatsraster, Monatswechsel über Jahresgrenzen, Auswahl einzelner Tage, Merken und Export. Details enthalten tatsächliche vorhandene Ereignisse und das Veröffentlichungsdatum. Keine erfundene Vier-Schritt-Pipeline. Originalquelle und Anbieterlinks liegen in den Details; im Monatsmodus exportiert der Kalender die Auswahl des angezeigten Monats.
- **Profil:** eigenständige Fan-Karte mit gestaltetem Hintergrund, Bio, optionalem Lieblingsact, Favoriten und Wildcard. Einstellungen liegen separat. Neue Profile starten ohne vorgegebene Lieblingskünstler. Verbindungen werden im Profil angezeigt und in den Einstellungen bearbeitet. Benutzernamen werden lokal auf 3–20 Kleinbuchstaben/Zahlen/Bindestrich/Unterstrich geprüft; keine globale Reservierung wird behauptet.
- **Erscheinungsbild:** Mono Mint, Seoul Night Market und Warm Paper. Der Profil-Akzent verändert weder Produktpalette noch Hauptbuttons. Eine Farbauswahl im Editor wird erst mit Speichern übernommen.
- **Rätsel:** drei unabhängige tägliche Modi (Release/Song, Artist, Credits), sechs Versuche, schrittweise Hinweise, Autocomplete, Aliasabgleich, Spielhilfe und spoilerfreies Ergebnis. Persistenz je Modus, konsistenter Tageswechsel um 00:00 KST. Keine Lyrics oder Audio-Clips.
- **Stats:** zuerst öffentliche Hörhistorie abfragen, erst danach echte Diagramme. „Dein Korea-Mix“, explizit nicht zugeordnete Plays, Top 10/20/50 und tatsächliche Last.fm-Zeiträume (7 Tage, 1/3 Monate, 1 Jahr, gesamter Verlauf). ListenBrainz bleibt ausdrücklich eine Stichprobe bis 1.000 zuletzt übermittelter Plays. Eine öffentliche Namensabfrage wird nicht als bestätigte Kontoverknüpfung bezeichnet.
- **Bedienung:** Favoriten direkt im Songdialog, auf Mobile Details als Bottom Sheet, sichtbare Fokuszustände, reduzierbare Animationen, mehr Platz ohne unteren Player. Favoriten und gemerkte Termine melden fehlgeschlagenes Speichern nicht als Erfolg.

### Voraussetzungen und bewusst offene Teile

- **Echte Benutzerkonten, Follow und öffentliche Profile:** benötigen eine zentrale Identitäts- und Datenverwaltung. Es gibt weiter lokale Profile. Deshalb werden Login, Rollen, 180-Tage-Namenswechsel und Namensquarantäne nicht simuliert.
- **Community Top 10:** benötigt bestätigte Konten, Einwilligung, Deduplizierung und reale gemeinsame Listens. Bis dahin wird ein ausdrücklich benannter Leerzustand gezeigt. Keine lokalen Likes oder Katalogdaten werden als Charts ausgegeben.
- **Eingebundene Korea Top 10/100:** benötigt eine erlaubte Datenquelle. Aktuell führen Quellenlinks zu den Originalranglisten. Last.fm-Tag-Charts sind eine getrennte Quelle, keine koreanische Markt- oder Wochenchart.
- **Release-Vorschläge:** der Radar erklärt die Kontovoraussetzung und ermöglicht als nutzbaren Ersatz persönliche Termine mit Quellenlink. Diese werden ausdrücklich nicht als öffentlich eingereicht oder in Prüfung dargestellt. Öffentliche Submission-Queue, eigene Einreichungsstatus und Kontorollen bleiben an das Kontosystem gebunden.
- **Originalcover/Artistfotos:** keine ungeprüften Fanbilder übernommen. Eigene gestaltete Ersatzmotive werden als solche bezeichnet. Lizenzierte Originalbilder können später ergänzt werden.
- **Öffentliches Backend:** Spotify-Anmeldung, Hördatenimport und Redaktion brauchen weiter Serverhosting und Anbieterzugänge. GitHub Pages allein betreibt diese Funktionen nicht.
- **P2:** Audio-Clips, Spotify-Dateiimport, Fan Spaces, Reviews, freier Hex-Editor, Sammlung/Crowdfunding und Monetarisierung bleiben wie im Dokument vorgesehen spätere Arbeit.

### Prüfung

21 automatisierte Tests decken bestehende Funktionen und die neuen Profil-, Theme-, Daily-, Monatskalender-, Quellen- und Zeitraumabläufe ab. Ergänzend wurden Startseite, Profil/Editor, helles Theme und mobile Kalender-/Rätselansichten im Browser geprüft. Quellenlinks zu Circle Chart und Melon sowie die unterstützten Last.fm-Zeiträume wurden an den Originalseiten abgeglichen.
