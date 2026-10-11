# ReiseKompass – Hotelvergleich

Eine responsive, deutschsprachige Web-App für den persönlichen Vergleich von Pauschalreise-Hotels ab Nürnberg (NUE). Die App arbeitet ohne Server und speichert Gewichtungen sowie manuell übernommene Preisstände ausschließlich lokal im Browser.

## Funktionen

- 7 vorausgefüllte Hotels in Makadi Bay und Hurghada
- individuelle Gewichtung von 11 Hotelkriterien (0–5)
- transparente Rangliste: gewichtete Hotelbewertung (75 %) + Preiswert (25 %)
- Filter für Zeitraum, Flugzeiten, Reisedauer, Gesamtpreis und Veranstalter
- manuelle Erfassung von Angeboten inklusive Preisquelle, Flugdaten, Transfer, Veranstalter und Erfassungsdatum
- Suchlinks für CHECK24 und ab-in-den-urlaub – ohne automatisiertes Scraping
- Detailansicht mit Kriterienprofil und Preisverlauf
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

## Daten & Datenschutz

Alle persönlichen Einstellungen und Preisstände liegen unter dem Schlüssel `reisekompass-v1` im lokalen Browserspeicher. Es werden keine Nutzerdaten an einen eigenen Server übertragen. Externe Reiseportale öffnen sich nur nach einem bewussten Klick. Da sich URL-Strukturen externer Anbieter ändern können, sind die Links als Suchhilfe und nicht als garantierte Buchungs-Deeplinks zu verstehen.

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
2. editierbare Hotelbewertungen mit Notizen und Quellen
3. Vergleich mehrerer Reiseprofile und Zeiträume
4. installierbare 192/512-Pixel-PWA-Icons und Update-Hinweis
5. optionale, offiziell lizenzierte Reiseanbieter-API, falls verfügbar
6. Barrierefreiheits- und Browser-End-to-End-Tests

## Rechtlicher Hinweis

Die App umgeht keine Schutzmaßnahmen und liest keine Preise automatisiert von Reiseportalen aus. Für eine spätere Live-Preisanbindung dürfen ausschließlich freigegebene APIs, Partnerprogramme oder vertraglich erlaubte Datenfeeds verwendet werden.
