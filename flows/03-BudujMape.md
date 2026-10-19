# 3 — BudujMape

Tworzy strone-mape od zera: korzen w sekcji zwyklej, kazda galaz jako natywna
sekcja zwijana SharePointa. Ta sama droga co tworzenie stron w kroku 1,
wiec format jest sprawdzony.

Zrodlem jest `DT_MigrationMap`. Po migracji do odswiezania mapy sluzy
[04-OdswiezDrzewo.md](04-OdswiezDrzewo.md), ktory czyta biblioteke Site Pages
i obejmuje takze strony zalozone recznie.

---
## PODMIEN

| Placeholder | Na co |
|---|---|
| `<WITRYNA>` | pelna sciezka witryny, np. `/teams/Dzial/podwitryna` — bez domeny, bez ukosnika na koncu |
| `<MAPA>` | docelowa nazwa pliku strony, np. `Documentation-Map.aspx` |

## Uwaga

Istniejacej strony `<MAPA>` nie trzeba kasowac — akcja RenamePage nadpisuje ja
w miejscu (`flags=1`), wiec link w lewym panelu caly czas dziala.

Nazwy akcji DOKLADNIE jak w naglowkach — wyrazenia od nich zaleza.

---

## 1. Trigger — Manually trigger a flow

## 2. GetAll — SharePoint → Get items

List Name (lista): `DT_MigrationMap` · Top Count (tekst): `5000` · Filter Query: PUSTE

## 3. Planuj — Excel Online → Run script

Script (lista):
```
planujDrzewo
```
dane (fx):
```
string(body('GetAll')?['value'])
```
witryna (tekst) — Z UKOSNIKIEM NA KONCU:
```
<WITRYNA>/
```

## 4. Plan — Data Operation → Compose

Inputs (fx):
```
json(body('Planuj')?['result'])
```

## 5. BudujMape — Excel Online → Run script

Script (lista):
```
budujMape
```
fragmenty (fx):
```
string(outputs('Plan')?['mapa'])
```

## 6. StopGdyERR — Control → Condition

Lewa strona (fx):
```
startsWith(body('BudujMape')?['result'], 'ERR')
```
is equal to: `true`

If yes: Control → **Terminate**, Status `Failed`, Message (fx):
```
body('BudujMape')?['result']
```
If no: pusta. Akcje 7–10 PONIZEJ warunku.

## 7. CreatePage — Send an HTTP request to SharePoint

Method: POST

Uri (tekst):
```
_api/sitepages/pages
```
Headers — dwa wiersze:
```
Accept
```
```
application/json;odata=verbose
```
```
Content-Type
```
```
application/json;odata=verbose
```
Body (tekst) — dokladnie tak:
```
{"__metadata":{"type":"SP.Publishing.SitePage"},"Title":"Mapa dokumentacji","PageLayoutType":"Article","PromotedState":0}
```

## 8. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```
Headers: te same dwa co w 7.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title','Mapa dokumentacji'),'CanvasContent1',body('BudujMape')?['result']))
```

## 9. RenamePage — Send an HTTP request to SharePoint

Method: POST

Uri (fx) — podmien `<WITRYNA>` w DWOCH miejscach i `<MAPA>`; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''<WITRYNA>/SitePages/<MAPA>'',flags=1)')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 10. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Sprawdzenie

- `BudujMape` → result zaczyna sie od `[{"controlType":4,"id":"c5f0a545` i zawiera `<h1>Mapa dokumentacji</h1>`
- `CreatePage` → body `d.Id` (liczba) i `d.Url` (losowa nazwa `SitePages/xxxx.aspx`)
- `SaveDraft` → 200, `RenamePage` → 200, `Publish` → 200
- strona `<MAPA>` (Ctrl+F5): link do strony glownej, pod nim 4 ZWIJANE sekcje z nazwami galezi;
  po rozwinieciu - zagniezdzone listy stron

## Zasady

- Kazdy bieg tworzy NOWA strone i nadpisuje `<MAPA>` (flags=1). Reczne edycje mapy przepadaja.
- Galezie sa natywnymi sekcjami zwijanymi SharePointa (zwiniete). Korzen zostaje widoczny.
  Nic nie trzeba klikac po biegu - format potwierdzony testem A/B/C/D z 2026-09-23.
