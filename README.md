# Gruppeneinteilung

Eigenständige Vue-Seite zum Einteilen von Teilnehmern (TN) und Mitarbeitern (MA) in Gruppen.
Alles läuft lokal im Browser – es gibt kein Backend, die Daten verlassen den Rechner nicht.

## Ablauf

1. **Daten laden** – Personen-CSV (Pflicht) und Gruppen-CSV (optional) auswählen oder hineinziehen.
   Mit „Mit Beispieldaten ausprobieren“ lässt sich die Seite sofort testen.
2. **Einteilung** – Per Drag & Drop Mitarbeiter zwischen Gruppen, Teilnehmer zwischen Blöcken und ganze Blöcke zwischen Gruppen verschieben.
   „Wunschblöcke vorsortieren“ fasst nicht zugeordnete Teilnehmer, die sich (auch über Ecken) wünschen, zu Blöcken zusammen.
3. **Exportieren** – Personen-CSV und Gruppen-CSV (wieder importierbar) oder eine druckbare Gruppenübersicht.

Über **⚙ Spalten** legst du fest, welche Spalten deine CSV hat (Reihenfolge, Bedeutung, Werte, Skalen wie „Gitarre“),
und kannst Muster-Dateien herunterladen. Die Konfiguration wird im Browser gespeichert und lässt sich als JSON sichern.
Oben rechts wechselt ☾/☀ zwischen dunklem und hellem Design (Standard: Systemeinstellung).

Alle Felder sind optional: Fehlt eine Spalte, wird das zugehörige Element nicht angezeigt.
Unbekannte Spalten der Personen-CSV werden beim Export unverändert durchgereicht.

## Zwei Dateien: Personen und Gruppen

Die Personen-CSV verweist nur auf die Gruppe, Name und Farbe stehen einmal in der Gruppen-CSV:

- **Zeltgruppe** = Zahl, z. B. `3`
- **Infrastruktur** = Name, z. B. `Küche` (der Name ist zugleich die Gruppen-ID)

Die Gruppen-CSV hat eine Zeile pro Gruppe (Spalten `Gruppe`, `Name`, `Farbe`; die Namen sind konfigurierbar).
Sie ist optional: ohne sie entstehen die Gruppen aus den IDs mit Standardfarben. Leere Gruppen bleiben nur über die Gruppen-CSV erhalten.

## Felder der Personen-CSV

| Feld | Bedeutung |
| --- | --- |
| Typ | `TN` oder `MA` (Werte konfigurierbar). Ohne Spalte gelten alle als TN. |
| Vorname, Nachname, Geschlecht, Geburtstag, Ort | Anzeige und Statistik. Geburtstag als `TT.MM.JJJJ` oder `JJJJ-MM-TT`. |
| Wunsch 1–5 | Freitext mit Name; wird mit den anderen TN abgeglichen (Ampel `erfüllt/gesamt`). |
| Gitarre, Zusatzinfo (Skala) | Zahlenwerte mit konfigurierbarer Bedeutung, z. B. `2` = „Ja, ich bin fortgeschritten“. |
| Zusatzinfo (Text) | Beliebig oft verwendbar, wird auf der Karte angezeigt. |
| Gruppe | Nummer (Zeltgruppe) oder Name (Infrastruktur), siehe oben. |
| Block | Blockkennung innerhalb einer Gruppe (nur TN). Ohne Gruppe: Wunschblock aus der Vorsortierung. |
| Gruppenleiter (GL) | `ja`/`1`/`x` … (konfigurierbar, nur MA). |
| Ignorierte Wünsche | z. B. `1-3`. |

Leere Blöcke stehen nicht in der CSV.

## Entwicklung

```sh
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm test         # Roundtrip-Test der CSV-Logik
```

## Deployment

`docker build -t einteilung . && docker run -p 8080:80 einteilung`

Die Build-Dateien unter `assets/` haben Hash-Namen und werden ein Jahr gecacht.
`index.html` wird nie gecacht, damit Updates sofort wirksam werden. Es gibt bewusst keinen Service Worker.
