# bias.fm — Improvement V1

**Stand:** 6. September 2026  
**Grundlage:** Handover v1–v3, sichtbarer GitHub-Pages-Prototyp, die neun bereitgestellten Screenshots und die Punkte 1–11.  
**Zweck:** Produkt-, Informationsarchitektur- und UI-Überarbeitung vor dem nächsten Prototype-Pass. Dies ist keine Build-Spezifikation im Code-Sinn, sondern eine priorisierte Entscheidungsvorlage.

> **Wichtige Transparenz:** Der veröffentlichte GitHub-Pages-Link konnte nicht automatisch vollständig geladen bzw. durchgeklickt werden. Diese Analyse bewertet daher alle in den bereitgestellten Screenshots sichtbaren Seiten, Tabs und Interaktionen (Home, Charts, Radar, Katalog & Produzenten, Rätsel, Stats, Profil, Curation, Konzept) sowie den bisherigen Handover. Vor dem Implementieren sollte die Checkliste in Abschnitt 16 einmal direkt im Browser gegen jede Route geprüft werden.

---

## 1. Kurzfazit: was bereits sehr gut funktioniert

Der Prototyp besitzt bereits eine erkennbare Identität: dunkler, moderner Data-first-Look; Korea-Fokus ohne kitschige K-Pop-Standardoptik; eine gute Typografie-Hierarchie; klare Karten; und vor allem die richtige Kernidee in der Hero-Zeile: **„Deine Hördaten, koreanisch kuratiert.“**

Das Grundproblem ist nicht, dass zu wenig Funktionen existieren. Im Gegenteil: Der Header und die erste View zeigen bereits sehr viele Konzepte gleichzeitig — Korea-Anteil, Radar, Rätsel, Bias-Farbe, sechs Schnellzugriffe, Teaser für drei weitere Module, Charts, Player, Katalog, Curation und Konzept. Dadurch fühlt sich ein Produkt, das eigentlich sehr klar sein könnte, momentan eher wie ein internes Konzept-Dashboard an.

### Die drei wichtigsten Entscheidungen

1. **Landing Page radikal entschlacken.** Sie soll sofort erklären, beweisen und zum ersten sinnvollen Klick führen — nicht jede Produktidee gleichzeitig ausstellen.
2. **Der eigene Player muss weg.** Das bisherige Produktversprechen „kein eigener Player“ ist richtig und schützt vor Lizenz-/GEMA-/Plattformproblemen. Die untere Player-Leiste im Radar-Screenshot macht den Kern unklar und sollte durch Deep-Link-Aktionen ersetzt werden.
3. **Farbe als System einsetzen, nicht als Dauerbeleuchtung.** Eine klare neutrale Basis plus eine kontrollierte Akzentpalette ist stärker als jeder User baut sich eine komplett eigene Website-Farbwelt.

---

## 2. Neue Informationsarchitektur

Die sichtbare Navigation enthält derzeit sehr viele gleichwertige Punkte: `Home · Charts · Radar · Katalog & Produzenten · Rätsel · Stats · Profil · Curation · Konzept`.

Das ist für ein internes Prototype-Board verständlich, für eine öffentliche Seite aber zu breit. Es mischt Nutzerfunktionen, öffentliche Discovery, Administration und Dokumentation in derselben Ebene.

### 2.1 Empfohlene Navigation vor Login

```text
[Logo]     Entdecken     Charts     Radar     Rätsel     Suche
                                     
                              Anmelden / Konto erstellen
```

| Navigation | Zweck | Warum hier |
|---|---|---|
| Entdecken | Ein kuratierter Stream: Releases, Artists, Produzenten, ggf. Editorial Picks | Ersetzt den unklaren Begriff „Katalog & Produzenten“ als Hauptpunkt |
| Charts | Community-, externe und später Genre-Charts | Öffentlicher Discovery- und SEO-Kern |
| Radar | Kommende und gerade erschienene Releases | Eigenständiger, klarer Haupt-Use-Case |
| Rätsel | Tägliche drei Minigames | Gute Rückkehrschleife, auch ohne Account spielbar |
| Suche | Artist, Release, Song, Producer | Immer sichtbar als Icon oder Feld |
| Anmelden | Erklärt beim Klick die Vorteile: Profil, Stats, Merken, eigene Charts | Erst dann Konto-Features |

**Nicht in die öffentliche Hauptnavigation:** Profil, Stats, Curation und Konzept.

### 2.2 Navigation nach Login

```text
[Logo]  Entdecken  Charts  Radar  Rätsel  Suche

                         [Avatar / Username ▾]
                         ├─ Mein Profil
                         ├─ Meine Stats
                         ├─ Gemerkt
                         ├─ Einstellungen
                         └─ Abmelden
```

`Stats` soll nicht mehr als gleichwertiger öffentlicher Nav-Punkt wirken. Es ist ein persönlicher Bereich und gehört unter das Avatar-Menü bzw. zum Profil. Wer noch keine Quelle verbunden hat, landet dort auf der Verbindungs-/Import-Seite.

### 2.3 Curation und Konzept entfernen

- **Curation:** kein öffentlicher Standardtab. Später entweder ein kleiner `+ Release vorschlagen`-Button im Radar oder ein Editor-/Moderator-Bereich hinter Berechtigung.
- **Konzept:** vom Produkt entfernen. Es gehört maximal auf eine temporäre öffentliche Build-in-Public-Seite, GitHub-Readme, Notion oder `/about`. Auf der Landing Page reicht eine kurze Erklärung, nicht ein Link zu interner Produktstrategie.

### 2.4 „Katalog & Produzenten“ neu denken

Der aktuelle Begriff ist sachlich korrekt, aber sperrig und wie eine Datenbankverwaltung. Es gibt drei brauchbare Varianten:

| Variante | Label | Inhalt | Bewertung |
|---|---|---|---|
| A — empfohlen | **Entdecken** | Artists, Songs, Releases, Producers, Labels, Genre-Einstiege, Editorial Picks | Emotional, verständlich, erweitert sich gut |
| B | Katalog | Komplette durchsuchbare Datenbank | Klar, aber trocken; eher ein Unterbereich der Suche |
| C | Künstler & Credits | Artists, Mitglieder, Producer, Writer | Sehr präzise, aber zu eng für Releases und Discovery |

Empfehlung: Haupttab **Entdecken**. Auf der Seite Tabs oder Filter: `Artists · Releases · Producer & Credits · Labels · Genres`.

**Nicht** in einen „Community/Groups join“-Tab umwandeln, zumindest nicht in V1. Community-Join, Chatrooms und Kommentare erzeugen sofort Moderations-, Missbrauchs- und Datenschutzaufwand. Sie lösen außerdem nicht das primäre Problem der Seite: gute Musik finden und einordnen. Community kann später als **Fan Spaces** innerhalb einzelner Artist-Seiten entstehen, erst mit Follow, Block, Report, Regeln und aktiver Moderation.

---

## 3. Landing Page: weniger Module, klarere Reihenfolge

### 3.1 Diagnose des jetzigen Hero-Bereichs

Gut:

- Claim und Unterzeile erklären das Produkt nachvollziehbar.
- „Korea-Anteil berechnen“ ist der beste potenzielle Erst-CTA.
- Der eine grüne Akzent funktioniert als Blickfänger.
- Die sichtbaren Track-Karten beweisen: Hier geht es wirklich um Musikdaten.

Zu viel bzw. falsch platziert:

- `Comeback-Radar öffnen` dupliziert einen bereits sichtbaren Haupttab.
- `Rätsel des Tages #42` wirkt als dritter gleichlauter CTA, obwohl nur ein primärer Klick nötig ist.
- Die Bias-Farbenauswahl ist in der Hero-Zone ein Einstellungsdetail; ohne Account suggeriert sie eine Funktion, die noch gar nicht personalisiert sein kann.
- „Guten Tag, meista-“ plus Community-Schnellzugriffe sieht nach eingeloggtem Dashboard aus, während der Hero wie eine Landing Page aussieht. Beide Zustände sollten nicht in derselben ersten View konkurrieren.
- Der sichtbare „#1 Song“ wäre redundant, wenn direkt darunter eine Top-10-Chart steht.

### 3.2 Eine Landing Page für Besucher ohne Konto

Diese Reihenfolge hält die Seite einfach, aber nicht leer:

```text
[Navigation]

    Koreanische Musik · alle Genres · kein eigener Player

    Deine Hördaten, koreanisch kuratiert.
    Koreanische Releases entdecken, Credits verstehen und sehen,
    wie viel Korea bereits in deinem Hörverlauf steckt.

    [ Korea-Anteil berechnen ]   [ So funktioniert's ]

    Kein Spotify-Pflichtlogin · Last.fm verbinden oder Historie importieren

────────────────────────────────────────────────────────────

    Community-Charts                    Koreanische Charts
    [Top 10, Toggle]                    [Top 10, Toggle]

────────────────────────────────────────────────────────────

    Diese Woche im Radar                Rätsel des Tages
    [3 kompakte Release-Karten]         [eine Karte, drei Modi]

────────────────────────────────────────────────────────────

    Idol, Indie, R&B, Hiphop — und die Menschen hinter den Credits.
    [Entdecken] [Wie bias.fm funktioniert]

[Footer]
```

Der CTA `So funktioniert's` scrollt auf eine kurze Drei-Schritte-Erklärung weiter unten. Er ist **kein** Link zum langen Konzeptdokument.

### 3.3 Zentrierter Hero: ja, aber nicht alles zentrieren

Dein Eindruck stimmt: Die bestehende linksbündige Hero-Kopie ist solide, ein zentrierter Landing-Hero wirkt für dieses Produkt aber einladender und weniger wie ein B2B-Analytics-Tool. Die Charts und der restliche Content darunter bleiben linksbündig bzw. grid-basiert — nur der Einstieg bekommt eine zentrale Bühne.

#### Skizze: empfohlene Hero-Variante

```text
                         [ Koreanische Musik · Alle Genres · Kein Player ]

                  Deine Hördaten, **koreanisch kuratiert.**

       Entdecke Releases, Credits und Community-Charts —
       gestreamt wird dort, wo du ohnehin hörst.

             [ ◔ Korea-Anteil berechnen ]

       Last.fm verbinden oder später Hörhistorie importieren.
       Kein eigener Player. Kein Spotify-Pflichtlogin.
```

**Breite:** Textblock maximal etwa 720–800 px.  
**H1:** groß, zwei Zeilen maximal.  
**Unterzeile:** maximal zwei Zeilen am Desktop, drei auf Mobile.  
**CTA:** nur einer in voller Akzentfarbe. Ein sekundärer Textlink reicht, falls nötig.

### 3.4 Landing Page nach Login

Die personalisierte Startseite darf anders aussehen als die öffentliche Landing Page:

```text
Guten Abend, meista-

[ Bias-Spotlight: NewJeans — nächster Release in 2 Tagen ]

Deine letzten Korea-Listens      Deine Top-Artists (30 Tage)
[kompakte Karte]                 [kompakte Karte]

Trending in der Community       Im Radar diese Woche
[Top 5]                          [3 Karten]
```

Wichtig: **Die Charts bleiben auch hier nicht doppelt als Hero und als Dashboard-Widget.** Eine Vorschau Top 5 ist genug; „Alle Charts“ führt zur Chart-Seite.

---

## 4. Charts: zwei Ebenen, nicht ein künstlicher Vergleich

Deine Idee mit einer Community-Chart und einer externen Chart ist stark. Sie zeigt genau die Differenzierung von bias.fm: „Was hören wir?“ versus „Was passiert außerhalb unserer Bubble?“

### 4.1 Benennung

Nicht „Nutzer Charts“ und nicht zwingend „Spotify Charts“. Besser:

| Ebene | Empfohlenes Label | Was zählt hinein |
|---|---|---|
| Eigene Plattform | **Community Charts** | anonymisierte, deduplizierte Listens verbundener bias.fm-Nutzer, nur Korea-Core-Katalog |
| Extern | **Korea Charts** | lizenzierte/erlaubte Referenzen, z. B. Circle Chart; später klar ausgewählte Plattformen |
| Optional später | **Global Signals** | YouTube/MV-Signale und ggf. globale Plattformreferenz, klar als extern markiert |

„Spotify Charts“ als Standard ist aus drei Gründen nicht ideal: Es klingt nach dem gleichen universellen Produkt wie Spotify, ist für Korea nicht automatisch der aussagekräftigste heimische Indikator, und Spotifys API-/Quota-Lage darf nicht zum Kernversprechen werden. Spotify kann ein *Linkziel* und eine *optionale Referenzquelle* sein, nicht das Fundament.

### 4.2 Landing Page: Top 10, nicht sechs

Ja: Top 10 ist die bessere Zahl. Der aktuelle 3×2-Schnellzugriff sieht eher nach „zuletzt angeklickt“ als nach Chart aus. Die Chart braucht Rang, Bewegung und Cover.

#### Desktop-Anordnung: empfohlen

```text
     Community Charts                         Korea Charts

  01  [Cover] Ditto                 ▲2     01  [Cover] ...                —
  02  [Cover] Bam Yanggang          ▼1     02  [Cover] ...               ▲4
  03  [Cover] Your Home             NEW    03  [Cover] ...               ▼2
  04  [Cover] ...                           04  [Cover] ...
  05  [Cover] ...                           05  [Cover] ...

  06  [Cover] ...                           06  [Cover] ...
  07  [Cover] ...                           07  [Cover] ...
  08  [Cover] ...                           08  [Cover] ...
  09  [Cover] ...                           09  [Cover] ...
  10  [Cover] ...                           10  [Cover] ...

  Aktualisiert … · Methodik                 Quelle: … · Aktualisiert …
  [ Alle Community Charts → ]               [ Alle Korea Charts → ]
```

Das entspricht deiner Skizze 1–5 links / 6–10 rechts **innerhalb einer einzelnen Chart-Karte**. Auf der Landing Page sollten aber nicht vier Spalten entstehen. Deshalb:

- **Desktop:** zwei gleich breite Chart-Karten untereinander oder nebeneinander, je Karte 2 Spalten à 5 Einträge.
- **Tablet:** beide Karten untereinander; die innere 2×5-Anordnung bleibt, wenn Platz.
- **Mobile:** pro Karte eine Liste 1–10, nicht zwei Mini-Spalten.

### 4.3 Umschalten: Toggle oder zwei Karten?

Es gibt drei Optionen:

| Option | Vorteile | Nachteile | Urteil |
|---|---|---|---|
| Zwei Karten nebeneinander | Unterschied sofort verständlich, kein versteckter Inhalt | Mehr vertikale Fläche | **Beste Landing-Lösung** |
| Ein Segment-Toggle | Kompakt, ruhig | Nutzer sehen eine Ebene nie; Vergleich geht verloren | Gut auf Mobile oder in engem Modul |
| Dropdown für Quellen | Skalierbar | Versteckt den Kern, wirkt datenbankartig | Nur auf voller Chart-Seite |

**Empfehlung:** Auf der Landing Page zwei sichtbare Karten. Auf der großen Charts-Seite ein Segment-Control oben: `Community · Korea Charts · Global Signals`. Darunter bei `Korea Charts` ein Quell-Dropdown.

Wenn du trotzdem die smooth Transition möchtest: sie ist gut, aber als visuelles Detail, nicht als Informationsarchitektur. Beim Segmentwechsel sollten Cover/Zeilen kurz überblenden und leicht vertikal versetzen (150–220 ms); keine aufwendige Karte-Flip-Animation. Die Rangnummern sollen nicht wie ein Slotmachine-Effekt springen.

### 4.4 Inhalte einer Chart-Zeile

**Empfohlene Reihenfolge:**

```text
01    [40×40 Cover]    Titel
                         Artist / Hauptcredits
                         ▲ 4    [☆ Merken]  [Spotify] [Apple] [YouTube]
```

- Rang und Bewegungsanzeige links.
- Cover sichtbar und quadratisch, nicht nur ein blaues Musik-Placeholder-Feld.
- Titel + Artist zentral.
- Rechts im Hover (Desktop) bzw. kebab/Sheet (Mobile): `Credits`, `Merken`, Deep Links.
- **Nicht** drei große Streaming-Buttons permanent pro Eintrag auf Landing Page; das wird zu voll. Zeige dort ein diskretes „Anhören“-Icon/Overflow. Auf der großen Chart-Seite dürfen Plattform-Chips sichtbar sein.
- `Credits` macht auf einer Top-10-Liste Sinn, aber nur als dezenter Icon/Button. Es öffnet ein Bottom Sheet/Popover, keine neue überladene Spalte.

### 4.5 Welche externe Chart ist sinnvoll?

Es gibt nicht die eine objektiv richtige Liste. Darum muss die Produktentscheidung transparent statt scheinbar neutral sein.

**Empfohlene Reihenfolge der Reiter/Quellen:**

1. **Community Charts** — Default auf der bias.fm-Chartseite für eingeloggte Nutzer; das ist euer Alleinstellungsmerkmal.
2. **Circle Chart** — wenn eine erlaubte/lizenzierte Datenquelle verfügbar ist: Koreanischer Industrie-/Marktbezug, als „Korea Charts“ Standard sinnvoller als Spotify.
3. **Melon / Genie / Bugs** — nur wenn es eine zulässige, belastbare Datenquelle gibt. Nicht über Scraping als Geschäftsgrundlage. Wenn nur Links möglich sind, die Charts referenzieren statt Rankings kopieren.
4. **Spotify Korea / Spotify Global** — optional als internationale Vergleichsebene und Deep-Link, aber nicht als Plattformkern.
5. **YouTube / MV** — eher als „MV Momentum“ mit Views-/Wachstumssignal, nicht als Songchart-Mix.

Auf der UI sollte die Quellenwahl so aussehen:

```text
Korea Charts  [ Circle Chart ▾ ]   Woche: [ Aktuell ▾ ]

Quelle: Circle Chart. Externe Rangliste; nicht aus bias.fm-Listens berechnet.
```

Keine „universelle Mischung“ aus Melon + Spotify + Bugs + Apple + YouTube zu einer einzigen Zahl. Unterschiedliche Märkte, Gewichtungen und Update-Zyklen würden eine künstliche Rangliste erzeugen, die niemand nachvollziehen kann.

### 4.6 Top 100: richtige Seite, falscher erster Render

Die große Chart-Seite darf Top 100 sein, die Landing Page nicht. Empfehlung:

- Landing: jeweils Top 10.
- Chart-Seite: initial Top 25 laden/zeigen; `25 weitere laden` bis 100, oder Virtualisierung bei endlosem Scrollen.
- Sticky Filterbar: Quelle, Zeitraum, Genre, ggf. Artist-Typ.
- URL-Shares erhalten Filter: `/charts/community?genre=rnb&period=30d`.

### 4.7 Genres und Generationen

Dein Bauchgefühl ist korrekt: **„Alle Generationen“ gehört nicht als gleichwertiger Filter neben „Alle Genres / Idol / Indie & Rock / R&B & Hiphop“.** Genre, Szene-Typ und Idol-Generation sind drei verschiedene Achsen.

Empfohlenes Filtermodell:

```text
[ Alle Musik ] [ Idol ] [ Indie & Bands ] [ Hiphop & R&B ] [ Electronic ]

weitere Filter ▾
  Genre:        All / Pop / Rock / R&B / Hiphop / …
  Artist-Typ:   All / Gruppen / Solo / Bands / Producer
  Generation:   All / Gen 1 / Gen 2 / Gen 3 / Gen 4 / Gen 5
```

- **Default:** kein Generationenfilter.
- **Sichtbar erst, wenn `Idol` oder `Gruppen` gewählt wurde.**
- Für Solos nicht automatisch eine Generation vorgeben. Ein Solo-Act kann zwar einer Idol-Gruppe angehören, aber ein generischer Generationenfilter wird dann streitbar und unklar.
- Falls ihr „Generation“ unbedingt für Solo-Idols zeigen wollt: label es `Idol-Generation` und dokumentiert die Regel.
- Indie-Acts erhalten `n/a`, nicht künstlich „Gen 4“.

Das gibt zahleninteressierten Fans den Filter, ohne dass er die normale Discovery dominieren muss.

---

## 5. Farbe: mehr Freude, aber ein kontrolliertes System

Die Analyse „zu viel Schwarz/dunkles Grau kann sad wirken“ ist richtig. Das aktuelle Schwarz ist als Basis hochwertig und passend für Stats, darf aber nicht die **einzige** emotionale Ebene sein.

### 5.1 Grundsatz: Farbe hat drei Rollen

1. **Produktpalette:** definiert Hintergrund, Text, Oberflächen, Primäraktion. Sie gilt für alle und erzeugt Markenwiedererkennung.
2. **Fandom-Akzent:** persönliche, kleine Identitätsfarbe (Profilring, 1–2 Chips, Marker, Highlights). Sie darf nicht die Lesbarkeit oder alle Buttons umdefinieren.
3. **Inhaltsfarbe:** Cover-Art, Artist-Bilder, Genre-/Statusfarben. Sie kommt aus dem Content und darf sich nicht mit User-Theming beißen.

Deshalb ist eine komplette frei definierte Website über zwei Hexcodes als Standard **nicht** empfehlenswert. Zwei Nutzer können dadurch z. B. neon-gelb auf weiß oder dunkelrot auf schwarz wählen; die Seite verliert Kontrast, Community-Screenshots verlieren Markenidentität, und Charts/Statusfarben werden unzuverlässig.

### 5.2 Empfohlenes Modell

| Ebene | V1 | Später |
|---|---|---|
| Produktpalette | 4–5 geprüfte Themes, User wählt eines | weitere saisonale/kuratierte Themes |
| Fandom-Farbe | 6–8 offizielle/kuratiere Farben, nur Akzent | Palette/Hex nur für **Profil-Akzent**, mit automatischer Kontrastkorrektur |
| Ganzes UI per Hex | nein | höchstens Accessibility-/Power-User-Modus, kein monetisiertes Kernfeature |

**Wichtig:** Fandom-Farbe ist nicht zwingend die gesamte UI-Farbe. Wenn jemand NewJeans als Ult hat, soll nicht die ganze Seite türkis sein. Sie soll die Person subtil markieren.

### 5.3 Fünf Paletten

Alle Werte sind Ausgangspunkte und müssen im echten UI auf WCAG-Kontrast getestet werden.

#### Palette A — Mono Mint (empfohlen als Standard)

Modern, neutral, passend zu deinem aktuellen Entwurf; Cover und User-Akzente bekommen Raum.

| Rolle | Hex | Einsatz |
|---|---:|---|
| Hintergrund | `#0B0D0F` | Seitenhintergrund |
| Oberfläche | `#15181C` | Karten, Header, Inputs |
| erhöhte Oberfläche | `#1C2126` | Hover, aktive Panels |
| Primär/Mint | `#37D9A5` | Haupt-CTA, aktive Controls |
| Sekundär/Cyan | `#40B9F5` | Charts, Links, Info |
| Text primär | `#F4F6F8` | Überschriften |
| Text sekundär | `#9AA4B2` | Meta |

#### Palette B — Seoul Night Market

Dunkel, aber lebendiger: Mint plus Koralle und kräftiges Blau. Gut für Radar und Interaktionen, ohne Neon-Cyberpunk zu werden.

| Rolle | Hex | Einsatz |
|---|---:|---|
| Hintergrund | `#101114` | Grund |
| Oberfläche | `#1A1C22` | Karten |
| Mint | `#2ED6A1` | Primär |
| Koralle | `#FF6B6B` | Neu, Releases, sekundärer CTA |
| Indigo | `#6676F7` | Charts / Filter |
| Creme | `#FFF4E8` | einzelne helle Panele / Text |
| Text sekundär | `#ABB1C0` | Meta |

Regel: Koralle nur für Status/sekundäre Actions, nicht für Fehlermeldungen gleichzeitig.

#### Palette C — Holographic Pop

Mehr K-Pop-Energie, aber kontrolliert. Gut als optionales Theme, nicht zwingend Standard.

| Rolle | Hex | Einsatz |
|---|---:|---|
| Hintergrund | `#101018` | Grund |
| Oberfläche | `#1B1A27` | Karten |
| Magenta | `#F05CB9` | Akzent A |
| Electric Blue | `#5FA8FF` | Akzent B |
| Lime | `#A9E85E` | positive Zustände / CTA sparsam |
| Lavender | `#BBA8FF` | Charts / dekorative Linie |
| Text | `#FBFAFF` | Text |

Regel: pro Screen höchstens **zwei** der Akzentfarben aktiv, sonst wird es Gaming-UI statt Musikprodukt.

#### Palette D — Warm Paper / Vinyl Sleeve

Helle Alternative. Besonders passend, wenn die Plattform später Collection/Vinyl/Crowdfunding stärker aufnimmt.

| Rolle | Hex | Einsatz |
|---|---:|---|
| Hintergrund | `#F5F0E8` | Grund |
| Oberfläche | `#FFFCF7` | Karten |
| Text | `#1D2328` | Primärtext |
| Terracotta | `#D9654F` | CTA / Releases |
| Petrol | `#167D78` | Charts / Links |
| Mustard | `#D9A52C` | Marker |
| Meta | `#687078` | Sekundärtext |

Das ist die stärkste Alternative, wenn „sad dark“ wirklich ein Problem wird. Nicht jede K-Music-App muss schwarz sein.

#### Palette E — Deep Jewel

Erwachsener, sammlerischer und weniger Standard-K-Pop; gut für Indie/R&B/Collection.

| Rolle | Hex | Einsatz |
|---|---:|---|
| Hintergrund | `#0D1517` | Grund |
| Oberfläche | `#152225` | Karten |
| Emerald | `#2EC48D` | Primär |
| Jade | `#51D6C1` | Links / Charts |
| Gold | `#DAB864` | Prestige, Streak, Collection |
| Burgundy | `#C85A6A` | Radar / neue Releases |
| Text | `#F0F3EE` | Primärtext |

### 5.4 Wo Farbe konkret hin soll

- **Header:** bleibt neutral; aktive Nav als dezente Pill/Unterstreichung in Primärfarbe.
- **Hero:** sehr subtiler radialer Farbverlauf hinter H1, keine Regenbogenfläche.
- **Primärbutton:** Palette-Primärfarbe. Sekundärbuttons nur Outline/Surface.
- **Chart-Ränge:** nicht jeder Rank bunt; `NEW`, Aufstieg, Fall und eigene Favoriten haben semantische Farben.
- **Radar:** Release-Typ/Timeline-Status bekommen kleine Akzentstreifen oder Dots, nicht den ganzen Kartenhintergrund.
- **Profile:** Fandom-/Profil-Akzent am Avatar-Ring, einer dünnen Rahmenlinie und ggf. im rechten Artist-Bild-Gradient.
- **Covers:** bleiben die farbigste Fläche; darum brauchen Flächen drum herum Ruhe.

---

## 6. Radar: kompakter, kalenderfähiger, kein Fake-Player

### 6.1 Was am aktuellen Radar gut ist

- Datumsblock links ist sehr scannbar.
- `Gemarkt`/`Merken` löst einen wichtigen Fan-Job.
- Release-Typ, Artist, Titel, Genre und Teaser sind richtige Daten.
- Die horizontale Ereignisidee kann für sehr gut dokumentierte Comebacks attraktiv sein.

### 6.2 Was zu viel Raum nimmt

- Zwei Releases füllen fast die ganze Seite, obwohl sie inhaltlich jeweils nur ein Event darstellen.
- Die komplette Schrittleiste (`Ankündigung → Konzept-Fotos → MV-Teaser → Release`) ist zu dominant und produziert falsche leere Schritte, wenn Acts keine Fotos oder keinen MV-Teaser veröffentlichen.
- Lange Copy unter jedem Release dupliziert häufig Daten, die auf der Artist-/Release-Seite besser aufgehoben sind.
- Die sichtbare untere Player-Leiste macht die Plattform fälschlich wie einen Streaming-Player. Das kollidiert mit der bisherigen Architektur und eröffnet sofort Lizenz-/ToS-Fragen.

### 6.3 Empfohlene Release-Karte: Compact Mode

```text
[08]  Di Sep   in 2 Tagen       [☆ Merken]

[Cover]  NewJeans · 뉴진스                         SINGLE ALBUM
         “Supernatural (KR Extended Edition)”     [Teaser ↗] [Links ▾]
         2 neue B-Sides · Prod. 250, Ylva Dimberg
         Idol  ·  Pop  ·  New Jack Swing

         ● 3 Updates                 [Details →]
```

- **Höhe:** ca. 150–180 px statt 300+.
- Cover 88–112 px; macht die Seite sofort farbiger.
- Details sind progressive disclosure, kein Pflichttext für alle.
- `3 Updates` öffnet Timeline/Details statt eine permanent volle Linie zu zeigen.
- Teaser-Link nur bei existierendem Teaser.
- Streaming/Pre-save-Links verstecken sich in `Links ▾` bis Release; nach Release: `Anhören ▾` mit Spotify/Apple/YouTube/Bandcamp.

### 6.4 Die Timeline ersetzen, nicht komplett streichen

Nicht jeder Release hat die gleichen Promotionschritte. Deshalb:

**Keine feste Four-Step-Pipeline auf jeder Karte.**

Stattdessen ein datengetriebener Event-Strip:

```text
● Ankündigung · 30 Aug     ● Tracklist · 02 Sep     ● MV Teaser · 06 Sep     ○ Release · 08 Sep
```

- Es erscheinen nur Ereignisse, die wirklich existieren.
- Auf der Liste als `3 Updates`/kleiner Dot-Count.
- Auf der Detailseite als vollständige Timeline.
- `Release` ist der einzige Pflichtpunkt.
- Eine fehlende Konzept-Fotostufe ist kein grauer „nicht erledigt“-Fehler.

### 6.5 Radar als Kalender: ja, aber mit zwei Ansichten

Deine Google-Kalender-Referenz ist sinnvoll. Ein Kalender hilft besonders, wenn mehrere Releases am selben Tag erscheinen und Fans Wochen voraus planen.

**Nicht** nur Kalender: Bei Musik braucht man Cover, Artist-Namen und Kontext. Deshalb zweigleisig:

| Ansicht | Default / Einsatz | Warum |
|---|---|---|
| **Agenda / Woche** — empfohlen als Default | 7 oder 14 Tage; große, kompakte Release-Zeilen | Beste Scanbarkeit; mobile-freundlich; Details bleiben sichtbar |
| Kalender / Monat | Monatsplanung, viele Releases, „was passiert am Freitag?“ | Gute Übersicht, aber keine langen Details |

#### Header der Radar-Seite

```text
Radar                         [Agenda] [Kalender]
08–14 September 2026          [‹] [Heute] [›]

[ Alle Musik ] [ Idol ] [ Indie & Bands ] [ Hiphop & R&B ]    [☆ Nur gemerkt]
```

#### Kalender-Tag: sinnvoller Inhalt

```text
12 Sa
[mini cover] Black Skirts — Teen Troubles
[mini cover] Artist B — Album
+3 weitere
```

Klick auf einen Tag öffnet rechts ein Detailpanel oder auf Mobile ein Bottom Sheet. Nicht versuchen, alle Release-Beschreibungen in ein Monatsraster zu zwängen.

### 6.6 iCal

`.ics Kalender` ist gut, aber als kleine Sekundäraktion:

- `In meinen Kalender` statt technischem `.ics Kalender`.
- Modal: Google Calendar, Apple Calendar, Outlook, Datei herunterladen.
- Ein Event enthält Artist, Release, Link zur bias.fm-Release-Seite und optional Teaser-Link.

### 6.7 Keine Audio-Leiste

Ersetze die gesamte untere Leiste durch eine Release-/Song-Detailleiste, falls du diesen Bereich behalten willst:

```text
Jetzt entdecken: Supernova — aespa
[ Credits ]   [ Spotify ↗ ] [ Apple Music ↗ ] [ YouTube ↗ ] [ Merken ]
```

Oder entferne sie vollständig. Ein klebender Player nimmt Mobile-Platz, täuscht Playback vor und ist im Konzept ausdrücklich nicht notwendig.

---

## 7. Rätsel: drei klare Daily-Formate, ohne Lyrics-Lizenzrisiko

Die Idee mit drei Tabs ist sehr gut. Sie gibt Leuten einen Grund, jeden Tag wiederzukommen, ohne dass daraus ein großes Social-System werden muss.

### 7.1 Seite und Tabs

```text
Tägliche Rätsel                         Dein Streak: 4 🔥
Ein neues Set täglich um 00:00 Uhr Ortszeit.

[ Release ]    [ Artist ]    [ Clip ]
```

Nicht `Song / EP / Album` als separaten Tab. Das sind Varianten **innerhalb** von `Release`.

| Tab | Aufgabe | Visuelles Material | Maximale Versuche |
|---|---|---|---:|
| **Release** | Song, Single, EP oder Album erraten | zunehmend schärferes/vergrößertes Cover; Jahr, Typ, Genre | 6 |
| **Artist** | Artist/Gruppe erraten | verpixeltes/farbreduziertes offizielles Bild oder stilisierte Discography-Kachel; Debüt-Jahr, Szene/Genre | 6 |
| **Clip** | Aufnahme anhand eines extrem kurzen Ausschnitts erraten | kein Cover am Anfang; nach Lösung Cover/Credits | 6 |

`Clip` ist rechtlich/technisch der schwierige Modus. 10 Sekunden Musik sind nicht automatisch frei nutzbar. Deshalb nur bauen, wenn es eine saubere lizenzierte Preview-Quelle oder eine explizite Rechtefreigabe gibt. Bis dahin kann der dritte Modus **Credits** heißen:

```text
Wer hat diesen Song produziert?
[Credit-Chain / verschleierte Artist-Relationen / Release-Jahr]
```

Das wäre sogar eigener und passt perfekt zur Producer-Differenzierung.

### 7.2 Empfohlene sichere V1-Kombination

1. **Cover Decode** — Release erraten.
2. **Artist Grid** — Artist anhand veränderter Visuals, Debüt-/Genre-Hinweisen und Diskografie-Form erraten.
3. **Credits Chain** — Song/Artist über Credits, Features und Release-Zusammenhang erraten.

Später `Clip` nur mit rechtlicher Freigabe. So kopiert ihr Songless nicht, habt keine Lyrics-Problematik und macht die Credits zu eurem eigenen Markenzeichen.

### 7.3 Hinweise, die zu bias.fm passen

Nicht Lyrics/Übersetzungen als Standard. Sie sind lizenzrechtlich heikel und machen den Modus sprachlastig. Besser pro Fehlversuch eine der folgenden Informationsstufen:

**Release Decode:**

1. Cover stark geblurrt / dominante Farben.
2. Release-Jahr + Format (Single/EP/Album).
3. Genre-Tag.
4. Anzahl Tracks oder „Title Track“.
5. ein weiterer Credit-Hinweis.
6. Cover lesbar / Lösung.

**Artist Grid:**

1. Debütjahr oder Dekade.
2. Gruppe/Solo/Band (ohne Namen).
3. zwei Genre-Tags.
4. Anzahl der Releases (grob).
5. bekannter Feature-/Producer-Zusammenhang.
6. Bild klar / Lösung.

**Credits Chain:**

1. „Dieser Song hat einen Producer, der auch an … beteiligt war.“
2. Release-Jahr.
3. Artist-Typ.
4. Feature-Hinweis.
5. Genre.
6. Lösung.

### 7.4 UX-Details

- `Wie spielt man?` als `?`-Button oben rechts öffnet kleines Modal/Popover — nicht dauerhaft auf der Seite.
- Suche mit Autocomplete nach Artist/Release, damit niemand exakt romanisieren muss.
- Nach Gewinn: Share-Karte **ohne Spoiler**: `bias.fm Daily #42 · 4/6 · ⬛🟩🟩…`.
- Nach Ablauf: Lösung, Cover, Credits, Links und `Zum Release`.
- Streak erst später gamifizieren; keine harte FOMO. Ein „Streak Freeze“ oder Bezahlmechanismus wäre nicht passend.
- Daily-Wortsetzung in einer festen Zeitzone kommunizieren; für internationale Community besser UTC oder „deine lokale Zeit“, aber konsistent.

---

## 8. Stats: persönlicher Bereich mit gutem Onboarding

### 8.1 Stats gehören in Profilnähe, aber nicht in die öffentliche Profilkarte

Die beste Struktur ist:

```text
Avatar-Menü → Mein Profil
             ├─ Übersicht (öffentlich/freundlich teilbar)
             └─ Meine Stats (privat bzw. eigene Detailansicht)
```

Die öffentliche Profilseite zeigt ausgewählte Highlights. Die Stats-Seite ist tiefer, einstellbar und nur primär für den Eigentümer. Dadurch muss ein Screenshot des Profils nicht wie ein Analytics-Backend aussehen.

### 8.2 Einstieg ohne verbundenes Konto

Vor jeder Stats-Grafik steht kein leeres Dashboard, sondern ein **Connect Screen**:

```text
Deine Musik, eingeordnet.

Verbinde deine Hörhistorie, um persönliche Korea-Stats,
Top-Artists und Empfehlungen zu sehen.

[ Mit Last.fm verbinden ]     ← primär
[ ListenBrainz verbinden ]    ← sekundär

oder
[ Hörhistorie importieren ]
Spotify Extended Streaming History (.json / .zip) — optional

Warum nicht einfach Spotify?  [Kurz erklärt]
```

Wichtige Copy:

- `Last.fm verbinden` ist Standard, weil die Historie und plattformübergreifende Scrobbles bringt.
- Spotify darf **nicht** versprechen, dass eine einfache Anmeldung die volle Vergangenheit mitbringt.
- Für Spotify-Nutzer ohne Last.fm: Dateien aus dem Spotify-Privacy-Export importieren ist technisch machbar, aber als eigener Import-Flow mit Validierung, Fortschritt, Duplikatvermeidung und klarer Privatsphäre-Erklärung. Es ist kein kleines „später mal“-Feature.
- Es sollte keine Möglichkeit geben, beliebige fremde Last.fm-Namen als „mein Profil“ zu übernehmen. Man darf einen öffentlichen Last.fm-Namen eventuell *ansehen*, aber zur Verknüpfung ist OAuth/Account-Bestätigung erforderlich.

### 8.3 Nach dem Connect: bessere Begriffe

`Korea-Anteil am Hören` ist inhaltlich verständlich, aber etwas technisch und klingt wertend („wie koreanisch bist du?“). Drei bessere Optionen:

| Label | Ton | Empfehlung |
|---|---|---|
| **Dein Korea-Mix** | freundlich, musikalisch | **Beste Standardbezeichnung** |
| Korea in deinem Hörverlauf | sehr klar, länger | Gute erklärende Unterzeile |
| Korean Music Share | international, analytisch | Gut für EN-UI |
| Korea-Anteil | präzise, aber trocken | Nicht falsch, eher Tooltip/Methodik |

Empfohlenes Modul:

```text
Dein Korea-Mix
42 % deiner gematchten Listens in den letzten 90 Tagen

[Koreanische Musik 42 %] [Andere Musik 51 %] [Noch nicht zugeordnet 7 %]

Was zählt als koreanische Musik? [i]
```

Der „unmapped“-Anteil ist wichtig. Sonst wirkt die Prozentzahl mathematisch genauer, als euer Matching wirklich ist.

### 8.4 Layout der Stats-Seite

```text
Meine Stats                         Quelle: Last.fm · zuletzt synchronisiert 4 Min. [↻]

[7 Tage] [30 Tage] [90 Tage] [1 Jahr] [All time]                  [Teilen]

Dein Korea-Mix                   Top Artists                      Deine zuletzt gehörten
[großer, ruhiger Ring/Bar]       [Top 10/20/50 ▾]                 [kompakte Timeline]

Top Releases                     Genre-Stimmung                   Top Songs
[Liste mit Covers]               [gestapelte Balken]              [Liste]

Korea-Deep Dive
[Top Korean Artists] [Koreanische Releases] [Neue Entdeckungen]
```

### 8.5 Top Artists: Länge und Darstellung

Ja, anpassbar machen, aber nicht mit einem großen Settings-Problem.

```text
Top Artists             [10 ▾]
                         10 / 20 / 50

01 [Artistbild] SUMIN                         1,284 Listens
   ━━━━━━━━━━━━━━━━━━━━                       100 %
02 [Artistbild] Slom                            962 Listens
   ━━━━━━━━━━━━━━━                             75 %
```

Die Bar muss nicht weg. Sie sollte aber nicht aussehen wie ein generischer Fortschrittsbalken. Besser:

- ein dünner, leicht transparenter Verlauf in der **Produkt- oder Artist-Akzentfarbe**;
- Länge relativ zum #1-Artist, Tooltip `75 % der Listens deines #1 Artists`;
- Count bleibt wichtiger als die Bar;
- auf Mobile: Bar unter Titel, nicht rechts gequetscht.

Alternative ohne Bars: kleine Sparkline der letzten 30 Tage pro Artist. Das ist interessanter, aber erst sinnvoll, wenn Daten stabil und UI nicht überladen ist.

### 8.6 Genre-Verteilung

Nicht als klassisches pie chart bauen. Pies sind bei 8+ Genres schlecht lesbar.

Besser:

```text
Deine Klangräume
R&B & Soul        31 %  ━━━━━━━━━━━
K-Pop             24 %  ━━━━━━━━━
Indie & Rock      18 %  ━━━━━━━━
Hiphop            15 %  ━━━━━━
Electronic         7 %  ━━━
Andere             5 %  ━━

[Alle Genres anzeigen]
```

- Top 5 sichtbar, Rest unter Drawer.
- Zeitfilter wird von der globalen Stats-Zeitraumleiste übernommen.
- Bei unzuverlässigen Last.fm-Tags immer labeln: `Genre aus bias.fm-Katalog, nicht aus jedem einzelnen Scrobble`.

### 8.7 Persönliche Discovery aus Stats

Später, nicht V1-Pflicht: ein Modul `Dein blinder Fleck`:

```text
Du hörst viel Korean R&B, aber kaum 2010er Indie.
[3 Releases entdecken]
```

Das macht die Stats zu Discovery, statt nur Zahlen zu zeigen.

---

## 9. Profil: Identität zeigen, Bearbeitung separat halten

### 9.1 Deine Kritik ist richtig

`Verified stan` und `Plattform: bias.fm` entfernen. Sie sagen nichts Nützliches aus und wirken wie künstliche Gamification bzw. ein Discord-Bot-Badge.

Auch richtig: Die aktuelle Form mit Username, Ult-Setup, Bias-Line und Auswahl-Chips auf einer sichtbaren Seite ist eher **Settings** als Profil. Ein Profil muss screenshotfähig, klar und stolz zeigbar sein. Bearbeitung soll erst nach explizitem Klick erscheinen.

### 9.2 Öffentliche Profilseite: Vorschlag

```text
──────────────────────────────────────────────────────────────────────
[ subtiler Artist-/Farb-Backdrop, kein fremdes Bild ohne Rechte ]

 [Avatar]    meista-                                      [···]
             Bonn, DE · hört seit 2026                    [Folgen]
             12.486 Listens · 42 % Korea-Mix

 Ult: NewJeans (OT5)             Wrecker: BIBI
 Bias-Line: SUMIN · The Black Skirts · (G)I-DLE

 [30 Tage]  Top Artists / Releases / aktuelle Favorites

 [Edit profile ✎]  ← nur für Eigentümer; sonst nicht sichtbar
──────────────────────────────────────────────────────────────────────
```

Für das eigene Profil kann `Edit profile` sichtbar sein. Für Besucher gibt es `Folgen`, später `Blockieren` im Drei-Punkte-Menü.

### 9.3 Der rechte Artist-Bildbereich: gute Idee, aber mit Rechte- und Fallback-Regeln

Das Beispielbild mit rechter Hälfte „Favourite Artist Bild“, nach links ausgefadet, hat eine starke Sammelkarten-/Profilkarten-Wirkung. Es passt besonders gut zu diesem Produkt.

**Umsetzung:**

- Bild wird nicht als beliebiges Fan-/Pressefoto von Google geladen.
- Nur ein Bild verwenden, wenn Lizenz/Quelle für Webdarstellung klar ist; sonst ein eigenes kuratiertes Cover-/Gradient-System.
- Über dem Bild liegt ein starker Gradient zur neutralen Kartenfläche, damit Text nicht leidet.
- Das Bild ist immer dekorativ, nie die einzige Trägerin von Information.
- Bei Solo-Ult: offizielles Artist-/Releasebild.
- Bei Gruppen-Ult mit Member-Bias: optional Member-Portrait, sonst Gruppen-/aktuelles Releasebild.
- Bei keinem Ult: dynamisches Farbfeld aus Profilpalette plus abstrakte Discography-Formen, nicht ein leerer grauer Bereich.

### 9.4 Karte oder ganze Seite?

Nutze beides in abgestufter Form:

| Ort | Darstellung |
|---|---|
| Profilseite | große Header-/Hero-Karte mit Artist-Backdrop |
| Chart/Follow-Liste | kompakte Mini-Profilkarte mit Avatar, Name, Ult-Farbe |
| Share-Karte | freistehende „Fan Card“, exportierbar als Bild |

Das macht die Fan-Identity nützlich, ohne dass jede Seite wie eine Trading Card aussieht.

### 9.5 Ult, Bias, Wrecker: behalten, aber inklusiv formulieren

Der Name `bias.fm` und diese Begriffe funktionieren sehr gut für Idol-Fandom, können Indie-/Hiphop-Hörer aber ausschließen. Das Produkt sollte sie daher anbieten, nicht aufzwingen.

Empfohlen im UI:

| Interner/Community-Begriff | Neutrale, sichtbare Option |
|---|---|
| Ult Bias | **Ult / Lieblingsact** |
| Bias Line | **Deine Favoriten** |
| Bias Wrecker | **Wildcard** oder `Wrecker (optional)` |

Beim Setup:

```text
Dein Ult / Lieblingsact
Du musst keinen Bias wählen. Auch Solo-Acts, Bands und Producer sind willkommen.
```

Das verhindert, dass sich jemand, der SUMIN, Slom oder ein Indie-Label hört, wie ein „falscher“ Nutzer fühlt.

### 9.6 Profil bearbeiten

`Edit profile` führt zu einer separaten Settings-Ansicht bzw. Modalroute:

```text
Profil bearbeiten

[Profilbild] [Username] [Bio, optional]

Musik-Identität
Ult / Lieblingsact      [Suche …]
Member (optional)       [OT / Mitglied]
Favoriten (max. 3)      [Chips]
Wildcard (optional)     [Suche …]

Erscheinungsbild
[Profil-Akzent] [Produkt-Theme]

[Speichern]
```

Keine Auswahl-Chips direkt auf der öffentlichen Profilkarte.

### 9.7 Username-Regeln

Der Vorschlag ist gut, mit kleinen Anpassungen:

- Eindeutig, ohne `#1234`.
- 3–20 Zeichen, Kleinbuchstaben/Digits/Bindestrich/Unterstrich; keine unsichtbaren Unicode-Zeichen.
- Änderung alle **180 Tage** ist ein brauchbarer Anti-Squatting-/Identitätsschutz.
- Für 1,99 € früher zu wechseln wirkt unnötig pay-to-edit und kann Namenshopping sowie Supportfälle fördern.
- Besser: einmaliger Kulanzwechsel beim frühen Beta-/Onboarding-Fehler, danach 180 Tage. Oder Plus-Mitgliedschaft erhält **maximal eine** zusätzliche Änderung pro 180 Tage, nicht stapelbar.
- Gelöschte Namen nicht sofort wieder freigeben: 30–90 Tage Quarantäne gegen Impersonation; danach wiederverwendbar, sofern nicht moderativ gesperrt/markenrechtlich heikel.
- Alte URL: temporärer Redirect 30 Tage, dann frei/404 nach Policy.

---

## 10. Fandom-Farbe, Themes und Hex-Tool: klare Priorität

### 10.1 Was wichtiger ist

**Reihenfolge:**

1. geprüfte globale Produktpaletten;
2. Fandom-/Profil-Akzent;
3. erst viel später freier Hex-Editor für Profilkarten.

Ein Hex-Tool für die gesamte Website ist keine V1-Priorität. Es ist technisch nicht schwer, aber design- und accessibility-teuer: man braucht Kontrastprüfungen, Dark/Light-Ableitungen, Disabled-/Error-/Success-Zustände, Filterzustände und Screenshot-Konsistenz.

### 10.2 Beste Kompromisslösung

```text
Erscheinungsbild

Produkt-Theme
(●) Mono Mint     ( ) Seoul Night Market     ( ) Warm Paper

Profil-Akzent
(●) Offizielle Fandom-Farbe: Neo Mint Champagne
( ) Eine andere kuratierte Farbe
( ) Eigene Farbe  [#37D9A5]  ✓ Kontrast geprüft

Vorschau: [Profil-Minikarte]
```

Regeln für eigene Farbe:

- Nur Profil-Akzent / eventuell ein lokaler Kartenrand, nie Seiten-Hintergrund.
- System erzeugt automatisch dunkle/helle Tints und verweigert unlesbare Kombinationen.
- Falls keine offizielle Fandom-Farbe sicher ist: `Artist-inspired` statt „official“ behaupten.
- Für Multi-Fandom-User ist die Farbe **ihre** Wahl, nicht automatisch die ihres Ults.

### 10.3 Offizielle Fandom-Farben als Datenproblem

Nicht jede Gruppe hat eine eindeutige offizielle Hex-Farbe; manche haben Lichtstick-Farben, manche mehrere Ären, manche gar keine. Daher:

- UI-Label nicht absolut `offizielle Fandom-Farbe`, sondern `Fandom-/Profil-Akzent`.
- Im Admin kann Quelle/Begründung hinterlegt werden.
- Kein Anspruch, jede Fanfarbe perfekt abzubilden.

---

## 11. Curation: Community-Vorschlag statt offener Redaktion

Dein Gedanke `+ Add upcoming release` ist viel verständlicher als ein sichtbarer Tab namens „Curation“. Die Funktion sollte die Community einladen, aber nicht jedem ungeprüft Publish-Rechte geben.

### 11.1 Sichtbares Produkt-Pattern

Im Radar:

```text
Fehlt ein angekündigtes Release?
[ + Release vorschlagen ]
```

Button nur für eingeloggte Accounts. Auf Mobile als kleine Plus-Schaltfläche im Radar-Header.

### 11.2 Einreichungsformular

```text
Release vorschlagen

Artist / Act*                  [Suche im Katalog …]
Noch nicht gelistet?           [+ Artist vorschlagen]

Release-Titel                  [Text]
Datum / Uhrzeit                [Datum] [optional Uhrzeit]
Typ                            [Single / EP / Album / Mixtape / OST]
Genre (optional)               [bis zu 3]

Offizielle Quelle*             [URL]
Teaser / MV (optional)         [YouTube-URL]
Streaming- / Pre-save-Link     [URL]
Zusatzhinweis (optional)       [Text]

[Zur Prüfung einreichen]
```

Kein Feld für freie „Beschreibung“, das zu Fandom-PR oder Gerüchten einlädt. Quellenlink ist Pflicht.

### 11.3 Status für Einreicher

```text
Eingereicht → wird geprüft → veröffentlicht / Rückfrage / abgelehnt
```

- Keine öffentliche „Rejected by moderator“-Blamage.
- Einreichungen mit zu wenig Quelle landen nicht im Radar.
- Repeat-Submitter mit korrekten Angaben können später einen Vertrauensstatus erhalten, aber nicht automatisch ungeprüft posten.

### 11.4 Wer darf bearbeiten?

| Rolle | Darf |
|---|---|
| Besucher | nichts |
| User | Release vorschlagen, eigene Vorschläge sehen |
| Vertrauens-Submitter | Vorschläge mit weniger Reibung, trotzdem Review |
| Editor | prüfen, bearbeiten, publizieren, verlinken, Tags setzen |
| Admin | Merges, Rechte, Moderation, Datenpolitik |

Die eigentliche `Curation Studio`-Oberfläche bleibt Editor/Admin-only unter Avatar-Menü oder `/admin`, nicht als Landing-Tab.

### 11.5 Automatisierung: Assistenz, nicht Autopublishing

Eine verlässliche Vollautomatisierung aus offiziellen Twitter/X-Accounts ist nicht der richtige Kern:

- Posts sind unstrukturiert, mehrsprachig, verspätet oder werden gelöscht.
- X-API/ToS und Kosten ändern sich, und viele Labels nutzen mehrere Kanäle.
- Ein Modell kann Ankündigungen falsch lesen; falsche Release-Daten zerstören gerade beim Radar Vertrauen.

Sinnvolle Assistenz-Pipeline:

1. Editorial pflegt eine **Watchlist offizieller Artist-/Label-Quellen**.
2. Beobachte zuerst stabile Quellen: offizielle YouTube-Channels/Uploads, RSS wo möglich, offizielle Websites/Newsrooms und freiwillige Release-Submissions.
3. Ein Worker legt bei neuen Signalen einen **internen Draft** an: möglicher Act, Link, möglicher Termin.
4. Editor bestätigt Artist, Datum, Release-Typ und Quellenlink.
5. Erst danach `public`.

Automatisierung kann die Recherchezeit senken. Sie darf keine Release-Termine ohne menschliche Freigabe auf der öffentlichen Seite veröffentlichen.

### 11.6 Teaser / MV

- Wenn ein offizieller YouTube-Teaser existiert: in der Event-Detailansicht eingebettet oder als klarer `Teaser ansehen ↗`-Link.
- Auf der kompakten Radar-Karte nur Icon/Link, nicht ein großer Embed unter jedem Release.
- Nach Release: `Anhören` öffnet Plattform-Auswahl; die App spielt nicht selbst ab.

---

## 12. Naming: „bias.fm“ behalten oder öffnen?

### 12.1 Einschätzung zu bias.fm

**Stärken:** extrem kurz; merkbar; für K-Pop-Fandom sofort lesbar; `.fm` signalisiert Musik; passt zu Ult/Bias-Profilen.

**Schwächen:** wirkt für Nicht-Idol-Hörer möglicherweise enger als das tatsächliche Produkt; „Bias“ kann außerhalb von K-Pop auch negativ/unklar gelesen werden; Producer, Labels, K-Indie und R&B erscheinen nicht automatisch darin.

Das ist kein zwingender Grund zum Wechsel. Die Lösung kann im **Claim** liegen:

```text
bias.fm
Korean music, beyond the bias.

oder
Korean music — artists, credits, and the listening behind it.
```

In DE-UI:

```text
bias.fm
Koreanische Musik, über den Bias hinaus.
```

### 12.2 Namensrichtungen, falls offen gehalten wird

Nicht sofort umbenennen; nach Stufe-0-Signal und Markencheck entscheiden.

| Name | Wirkung | Risiko / Hinweis |
|---|---|---|
| **bias.fm** | Fandom, kurz, klar für K-Pop | enger für Indie, Markencheck nötig |
| **seoulside** | Ort/Community, genreoffen | nicht nur Musik, vermutlich viele Kollisionen |
| **hangang.fm** | Korea-Atmosphäre, elegant | geografisch/romanisiert, Aussprache |
| **hanwave** | Hallyu/Wave-Anklang, breit | kann generisch wirken |
| **trackseoul** | Musik + Ort, Discovery | etwas länger |
| **seoulstacks** | Stats/Sammlung/Charts | weniger emotional |
| **kimchi?** | nicht verwenden | klischeehaft und verengt Korea kulturell |
| **wave.fm** | musikalisch, breit | sehr generisch, Domain/Marke wahrscheinlich schwer |
| **comeback radar** | Funktion sofort klar | zu eng; kein Stats-/Indie-Produktname |
| **stanboard** | Community/Stats | klar Idol-Fandom; weniger Indie |
| **hallyustats** | klar inhaltlich | beschreibend, wenig elegant |
| **ult.fm** | kurz, Fandom | ähnlich Idol-eng |

Der Name sollte nicht versuchen, in einem Wort Korea, Charts, Stats, Community, Credits und Fandom zu erklären. Das löst der Claim.

---

## 13. Was aus dem Prototyp konkret entfernt, verschoben oder ergänzt wird

### Entfernen aus der Landing-First-View

- Großer `Comeback-Radar öffnen`-CTA.
- Großer `Rätsel des Tages`-CTA.
- Bias-Farbenauswahl.
- `Guten Tag, [Name]` auf der nicht eingeloggten Landing Page.
- Sechs ungerankte Track-Schnellzugriffe als Ersatz für Chart.
- Doppelung „#1 Community Song“, falls eine Top-10 direkt sichtbar ist.
- Jeder scheinbare Audioplayer bzw. Playback-Steuerung.
- Konzept-Link aus Topbar/Produktnavigation.

### Verschieben

| Element | Neuer Ort |
|---|---|
| Bias-Farbe | Profil bearbeiten → Erscheinungsbild |
| Stats | Avatar-Menü → Meine Stats; Teilübersicht im Profil |
| Curation Studio | Editor/Admin-only |
| Release einreichen | Radar-Header als `+ Release vorschlagen` |
| Concept/Handover | About/Build-in-public/GitHub, nicht Hauptprodukt |
| Credits | Chart-Zeilen als Icon/Overflow; volle Credits auf Songseite |
| Streaming-Plattformen | Song/Release/Chart-Row via kompakte Links, nicht als Player |

### Ergänzen

- Sichtbare Cover in Charts und Radar.
- Chart-Methodik/Quelle/Updatezeit.
- `Community Charts` plus `Korea Charts`, klar getrennt.
- Unmapped-Anteil in Stats.
- Connect-/Import-Onboarding vor Stats.
- Artist-/Releasebilder mit Rechte-/Fallback-Konzept.
- Radar: Agenda- und Kalenderansicht.
- Mobile Bottom Sheet für Credits/Links/Details.
- Dark/Light oder 3–5 kuratierte Produktpaletten.

---

## 14. Mobile und Accessibility

Die Screenshots sind Desktop-zentriert. Mobile ist für Music-Communitys und Kalender vermutlich mindestens genauso wichtig.

### Mobile-Regeln

- Hauptnav nicht als 9 Items quetschen. Logo, Suche, Avatar; darunter ggf. horizontale Section-Nav oder Drawer.
- Chart: eine Spalte 1–10; Credits/Links als Bottom Sheet.
- Radar: Agenda als Default; Monatskalender mit Tag-Drawer.
- Sticky Bottom Bar **nicht** als Player; höchstens `Entdecken · Charts · Radar · Profil` für eingeloggte User, falls nach Tests nötig.
- Touch targets mindestens ca. 44×44 px.
- Hover-only `Credits` muss auf Mobile immer erreichbar sein.

### Accessibility-Regeln

- Nie Information nur über Farbe ausdrücken: Auf/Ab/Neu zusätzlich Text/Icon.
- Kontrast für Text, Chips, dünne Linien testen.
- User-Hex wird automatisch kontrastrichtig abgeleitet.
- Cover erhalten Alt-Text `Cover: [Release] von [Artist]`; reine dekorative Backdrops haben leeren Alt-Text.
- Hangul wird nicht als Bildtext gerendert; echte Textknoten für Suche/Screenreader.
- Fokuszustände bei Keyboard-Navigation sichtbar.

---

## 15. Priorisierung: was zuerst in den Prototype-Pass gehört

### P0 — vor externem Test / Landing-Validierung

1. Navigation auf `Entdecken · Charts · Radar · Rätsel · Suche` reduzieren.
2. Konzept und Curation aus der öffentlichen Topbar entfernen.
3. Landing-Hero zentralisieren und nur einen Primär-CTA behalten: `Korea-Anteil berechnen`.
4. Bias-Farb-Auswahl aus Hero in Profile Settings verschieben.
5. Sechs Schnellzugriffs-Tracks durch eine echte **Community Top 10** mit Rank/Cover ersetzen.
6. Zweite **Korea Charts Top 10** daneben/unterhalb ergänzen oder klar als zukünftigen Platzhalter bezeichnen.
7. Player-Leiste entfernen; durch Deep Links oder nichts ersetzen.
8. Radar-Karten verdichten; feste Four-Step-Timeline auf der Liste entfernen.
9. Profil in Display View und separaten Edit Flow trennen.
10. Stats-Connect-Screen bauen, bevor Stats-Grafiken gezeigt werden.

### P1 — nach erstem Feedback

1. Theme-Auswahl (3 geprüfte Paletten), Profil-Akzent getrennt.
2. Radar Agenda + Monatskalender.
3. Chart-Quellen-Dropdown und Methode/Refresh.
4. Rätsel drei sichere Modi: Release, Artist, Credits.
5. `+ Release vorschlagen` mit Prüfstatus.
6. Deep-Link-Buttons zu Spotify, Apple Music, YouTube, Bandcamp/SoundCloud wo vorhanden.
7. Top 10/20/50 Controls in Stats.
8. `Dein Korea-Mix` statt „Korea-Anteil“.

### P2 — erst nach Produkt- und Moderationssignal

1. Audio-Clip-Rätsel mit Rechteklärung.
2. Spotify-Dateiimport.
3. Community-/Fan-Spaces.
4. Reviews/Guides.
5. Freier Hex-Profilakzent mit Kontrastprüfung.
6. Physische Sammlung, Crowdfunding-Tracker.
7. Progression, kosmetische Items, Abo/Werbung.

---

## 16. Browser-Testplan für alle anklickbaren Bereiche

Der nächste direkte Test im Browser soll nicht nur „sieht schön aus“ prüfen, sondern Informationswege.

### Home

- [ ] Weiß ein neuer Besucher nach 5 Sekunden, was bias.fm macht?
- [ ] Gibt es exakt einen eindeutigen Haupt-CTA?
- [ ] Versteht er ohne Klick den Unterschied Community Charts vs. Korea Charts?
- [ ] Kann er Radar/Rätsel erreichen, ohne dass sie Hero-CTAs duplizieren?
- [ ] Ist kein Player sichtbar, der eigenes Streaming verspricht?

### Charts

- [ ] Sind Rang, Cover, Titel, Artist, Quelle und Zeitraum sichtbar?
- [ ] Kann man Credits und Plattformlinks ohne Seitenüberladung erreichen?
- [ ] Funktioniert Filterlogik: Szene/Genre getrennt von Artist-Typ und Generation?
- [ ] Wird klar erklärt, ob eine Liste Community-Listens oder externe Chartdaten nutzt?
- [ ] Top 100 lädt performant und ist mobil scannbar?

### Radar

- [ ] Sind Agenda und Kalender sinnvoll nutzbar?
- [ ] Hat jeder Release nur wirklich vorhandene Events statt leerer Timeline-Slots?
- [ ] Ist Merken verständlich und muss ggf. zum Login führen?
- [ ] Teaser/Streaming sind Links, nicht unklare Player?
- [ ] Ist eine Release-Einreichung eindeutig als „wird geprüft“ markiert?

### Entdecken

- [ ] Findet Suche Hangul, Romanisierung und Aliasse?
- [ ] Können User Artist, Release und Producer getrennt entdecken?
- [ ] Sind Stubs sichtbar als unkuratiert markiert, ohne kaputt auszusehen?

### Rätsel

- [ ] Versteht man die drei Modi ohne lange Erklärung?
- [ ] Ist `Wie spielt man?` erreichbar?
- [ ] Funktioniert Suche ohne exakte Romanisierung?
- [ ] Gibt es keinen Lyrics-/Audio-Content ohne rechte Grundlage?

### Stats

- [ ] Sieht ein nicht verbundener User zuerst Connect/Import, nicht Fake-Zahlen?
- [ ] Braucht Last.fm-Verknüpfung Ownership/OAuth?
- [ ] Zeigt der Korea-Mix Mapping-Unsicherheit?
- [ ] Sind Top 10/20/50 und Zeiträume verständlich?

### Profil / Settings

- [ ] Ist ein Profil screenshotfähig ohne Edit-Control-Chaos?
- [ ] Kann der Eigentümer eindeutig in den Edit Flow gehen?
- [ ] Funktioniert Solo-Act als Ult ohne Gruppen-/Member-Zwang?
- [ ] Sind Ult/Bias-Begriffe optional bzw. als „Lieblingsact/Favoriten“ verständlich?
- [ ] Ist Fandom-Akzent getrennt vom globalen Produkt-Theme?

### Mobile / Legal

- [ ] Sind Touch-Ziele groß genug und Credits/Links nicht hover-only?
- [ ] Kommt keine Navigation in zwei Reihen zustande?
- [ ] Existieren Impressum und Datenschutz auf erster öffentlicher Testversion?

---

## 17. Endempfehlung als Entscheidungssatz

**bias.fm sollte sich auf der ersten öffentlichen Seite wie eine farbige, ruhige Musik-Discovery-Plattform mit echten Daten anfühlen — nicht wie ein voll ausgestattetes Admin-Dashboard, ein K-Pop-Wiki oder ein Spotify-Player.**

Der beste konkrete nächste Prototype-Pass ist daher nicht, noch mehr Tabs hinzuzufügen. Er ist: Navigation halbieren; Hero auf einen CTA reduzieren; zwei saubere Top-10-Listen mit Covers und eindeutiger Methodik zeigen; Radar als kompakte Agenda/Kalender-Ansicht bauen; Profil zu einer schönen, nicht-editierbaren Fan Card machen; und Stats erst nach echter Last.fm-/Import-Verbindung zeigen.

Die stärkste individuelle Differenzierung bleibt dabei nicht „jede Farbe frei wählen“ und nicht „Chatrooms für alles“, sondern **Korea-Discovery über Comebacks, Hördaten und Credits — einschließlich Produzenten und Indie-Musik.**
