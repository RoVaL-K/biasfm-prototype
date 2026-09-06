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
