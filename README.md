# ReiseKompass – Hotelvergleich

Eine responsive, deutschsprachige Web-App für den persönlichen Vergleich von Pauschalreise-Hotels ab Nürnberg (NUE). Die App arbeitet ohne Server und speichert Gewichtungen sowie manuell übernommene Preisstände ausschließlich lokal im Browser.

**Online-App:** <https://vnarinski-ship-it.github.io/reise-hotelvergleich/>

## Funktionen

- 8 vorausgefüllte Hotels in Makadi Bay, Sahl Hasheesh und Hurghada
- individuelle Gewichtung von 11 Hotelkriterien (0–5)
- transparente Rangliste: gewichtete Hotelbewertung (90 %) + Preiswert (10 %)
- Filter für Reisezeitraum (von/bis), Flugzeiten, Gesamtpreis und Veranstalter
- manuelle Erfassung von Angeboten inklusive Preisquelle, Flugdaten, Transfer, Veranstalter und Erfassungsdatum
- Suchlinks für CHECK24 und ab-in-den-urlaub – ohne automatisiertes Scraping
- Detailansicht mit Kriterienprofil und Preisverlauf
- eigene Hotelnotizen mit automatischer lokaler Speicherung, direkt bei den Hotelinformationen auf Karten und in den Details sichtbar
- einfache deutsche Grammatik- und Rechtschreibprüfung ohne eigenen API-Schlüssel, mit Vorschau und wiederherstellbarer vorheriger Fassung
- deutsches Diktat am Cursor mit Vorschau, Stopp/Abbruch und Erkennungsalternativen (bei Browser-Unterstützung)
- lokale Speicherung per `localStorage`
- responsive Darstellung und PWA-Grundlage mit Manifest und Offline-Cache

Die hinterlegten Hotelbewertungen sind redaktionelle Startwerte und keine Live-Daten. Die App zeigt erst dann einen Reisepreis, wenn dieser manuell eingetragen wurde.

## Lokal starten

Voraussetzung: Node.js 18 oder neuer.

```bash
npm start
```

Danach die angezeigte lokale Adresse im Browser öffnen. Alternativ kann jeder einfache statische Webserver verwendet werden. Ein direktes Öffnen der `index.html` als Datei ist wegen der PWA-Funktionen nicht empfohlen.

## Prüfen

```bash
npm test
npm run check
```

Die Tests prüfen die Gewichtung, Preisfilterung und den Einfluss des Preises auf die Rangliste.

Browserprüfungen für Hotelnotizen und den Offline-Cache (Node.js 20 oder neuer):

```bash
npm ci
npx playwright install chromium
npm run test:browser
```

Der Browsertest startet seinen lokalen Webserver selbst. Ein vorhandenes Chromium unter `/usr/bin/chromium` wird verwendet; alternativ lässt sich `CHROMIUM_PATH` setzen. Die Spracherkennung wird für wiederholbare Prüfungen simuliert. Echte Aufnahmequalität und Mikrofonfreigaben müssen im jeweiligen Browser getestet werden.

## Daten & Datenschutz

Alle persönlichen Einstellungen und Preisstände liegen unter dem Schlüssel `reisekompass-v1` im lokalen Browserspeicher. Hotelnotizen liegen getrennt unter `reisekompass-hotel-notes-v1` und bleiben beim Zurücksetzen der Gewichtungen und Preise erhalten. Notizen werden nur im verwendeten Browser gespeichert. Bei fehlendem Speicherplatz bleibt der ungespeicherte Text im Editor und kann kopiert werden.

Der Diktierknopf fordert `de-DE` beim verfügbaren Browser-Sprachdienst an. Die Unterstützung hängt von Browser und Gerät ab; je nach Dienst kann Audio online verarbeitet werden. Alternativ kann das Mikrofon der Handy-Tastatur verwendet werden. Es gibt keine eigene Audioablage und keine eigene API-Anbindung für das Diktat.

„Sprache korrigieren“ öffnet eine Vorschau. Erst „Grammatik prüfen“ sendet ausschließlich den aktuellen Notiztext an die öffentliche LanguageTool-API (`https://api.languagetool.org/v2/check`) mit `language=de-DE`; es werden weder Hotel-Stammdaten, Preisstände noch Tauchdaten mitgesendet. Die Prüfung braucht Internet, aber keinen eigenen Schlüssel. Zeitlimits, Ausfälle und Nutzungslimits werden angezeigt. Korrekturen sind einzeln abwählbar und der Vorschlag ist bearbeitbar. Hotelbezeichnungen werden nicht automatisch ersetzt. Übernommen wird erst nach Bestätigung; die unmittelbar vorherige Textfassung bleibt im Notizdatensatz erhalten und wiederherstellbar. Dies ist eine einfache Grammatikprüfung, keine freie KI-Neuformulierung.

Notiztexte erscheinen als reiner Text mit erhaltenen Zeilenumbrüchen bei den Hotelinformationen. HTML in einer Notiz wird nicht ausgeführt. Browserprüfungen simulieren LanguageTool-Antworten einschließlich Fehlern, Abbruch, Zeitlimit und Speicherfehlern; der Dienst wurde zusätzlich mit einem synthetischen Beispielsatz auf Erreichbarkeit und CORS geprüft.

Es werden keine Nutzerdaten an einen eigenen Server übertragen. Externe Reiseportale öffnen sich nur nach einem bewussten Klick. Da sich URL-Strukturen externer Anbieter ändern können, sind die Links als Suchhilfe und nicht als garantierte Buchungs-Deeplinks zu verstehen.

## Projektstruktur

```text
├── index.html             Oberfläche und Dialoge
├── styles.css            responsives Design
├── app.js                UI, Filter und lokale Speicherung
├── core.js               testbare Ranking- und Preislogik
├── data.js               Hotel-Stammdaten und Startbewertungen
├── manifest.webmanifest  PWA-Metadaten
├── sw.js                 Offline-Cache
└── test/                 automatisierte Logiktests
```

## Roadmap

1. Export und Import der Preisstände als JSON/CSV
2. editierbare Hotelbewertungen mit Quellen
3. Vergleich mehrerer Reiseprofile und Zeiträume
4. installierbare 192/512-Pixel-PWA-Icons und Update-Hinweis
5. optionale, offiziell lizenzierte Reiseanbieter-API, falls verfügbar
6. Barrierefreiheits- und Browser-End-to-End-Tests

## Rechtlicher Hinweis

Die App umgeht keine Schutzmaßnahmen und liest keine Preise automatisiert von Reiseportalen aus. Für eine spätere Live-Preisanbindung dürfen ausschließlich freigegebene APIs, Partnerprogramme oder vertraglich erlaubte Datenfeeds verwendet werden.

