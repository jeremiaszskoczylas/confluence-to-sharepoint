# Flow 4 — RemapLinks (sciaga do kopiowania)

Kazda wartosc do wklejenia jest w osobnym bloku. W widoku raw: potrojne klikniecie
w linie = zaznaczona cala, Ctrl+C.

Oznaczenia: **fx** = panel wyrazen (w polu ma byc zeton) · **tekst** = wpisz zwykle ·
**dyn** = dynamic content · **lista** = wybierz z rozwijanej

## PODMIEN (3 placeholdery)

| Placeholder | Na co |
|---|---|
| `<WITRYNA>` | pelna sciezka witryny, np. `/teams/Dzial/podwitryna` — bez domeny, bez ukosnika na koncu |
| `<EKSPORT>` | folder rozpakowanego eksportu w bibliotece, np. `confluence-export/NAZWA` |
| `<MAPA>` | nazwa pliku strony mapy z paska adresu, np. `Documentation-Map.aspx` |

Nazwy akcji DOKLADNIE jak w naglowkach (⋯ → Rename) — wyrazenia od nich zaleza.

---

## 1. Trigger — Manually trigger a flow

---

## 2. GetAll — SharePoint → Get items

List Name (lista):
```
DT_MigrationMap
```
Top Count (tekst):
```
5000
```
Filter Query: PUSTE

---

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

---

## 4. Plan — Data Operation → Compose

Inputs (fx):
```
json(body('Planuj')?['result'])
```

---

## 5. Apply to each — Control

Select an output (fx):
```
outputs('Plan')?['pages']
```
Akcje 6–11 WEWNATRZ petli.

---

## 6. GetHtml — SharePoint → Get file content using path

File Path (fx):
```
concat('/Dashboard_Team/<EKSPORT>/', items('Apply_to_each')?['file'])
```

---

## 7. ParsujTresc — Excel Online → Run script

Script (lista):
```
parseTresc
```
html (dyn): File Content z GetHtml

base (tekst):
```
<WITRYNA>/SiteAssets/DocMedia/attachments/
```
tytul (fx):
```
items('Apply_to_each')?['title']
```
linki (fx):
```
outputs('Plan')?['linki']
```
nag (fx):
```
items('Apply_to_each')?['nag']
```
pod (fx):
```
items('Apply_to_each')?['pod']
```

---

## 7b. Checkout — Send an HTTP request to SharePoint (PRZED SaveDraft)

Strony sa opublikowane — bez wypozyczenia zapis szkicu konczy sie 409 Conflict.

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', items('Apply_to_each')?['pageId'], ')/checkoutpage')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## 8. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', items('Apply_to_each')?['pageId'], ')/savepageasdraft')
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
Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',items('Apply_to_each')?['title']),'CanvasContent1',body('ParsujTresc')?['result']))
```

---

## 9. UstawMetadane — SharePoint → Update file properties

Library Name (Enter custom value):
```
Site Pages
```
Id (fx):
```
items('Apply_to_each')?['pageId']
```
ParentPageId (fx):
```
items('Apply_to_each')?['parentPageId']
```
SortOrder (fx):
```
items('Apply_to_each')?['sortOrder']
```
TreePath (fx):
```
items('Apply_to_each')?['treePath']
```
TreeSort (fx):
```
items('Apply_to_each')?['treeSort']
```
Category Value (Enter custom value, potem fx):
```
if(equals(items('Apply_to_each')?['category'], ''), null, items('Apply_to_each')?['category'])
```
DocStatus Value (lista):
```
Published
```
Pozostale pola PUSTE.

---

## 10. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', items('Apply_to_each')?['pageId'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## 11. OdhaczWMapie — SharePoint → Update item

List Name (lista):
```
DT_MigrationMap
```
Id (fx):
```
items('Apply_to_each')?['id']
```
Title (fx):
```
items('Apply_to_each')?['title']
```
MigrationStatus Value (lista):
```
LinksRemapped
```
**WSZYSTKIE pozostale pola tej akcji PUSTE** — w szczegolnosci ParentConfluenceId, Depth,
ConfluenceId, TargetPageId. Wpisane 0 nadpisze hierarchie w mapie przy kazdym biegu
(tak stracilismy ParentConfluenceId 2026-09-18; naprawa: flow4b-NaprawHierarchie).

---

## 12. GetMapa — Send an HTTP request to SharePoint — POZA PETLA, pod nia

Method: GET

Uri (tekst):
```
_api/web/getfilebyserverrelativeurl('<WITRYNA>/SitePages/<MAPA>')/ListItemAllFields?$select=Id,CanvasContent1
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

---

## 13. WstawMape — Excel Online → Run script

Skrypt (v3) buduje kanwe mapy OD ZERA z fragmentow — w tym samym minimalnym formacie,
ktorym SaveDraft zapisuje strony (jedyny format o potwierdzonym renderowaniu).
Kazdy fragment trafia do osobnej sekcji. Parametr canvas jest ignorowany, ale zostaje,
zeby nie przebudowywac akcji; GetMapa jest nadal potrzebne (Id strony).

Script (lista):
```
wstawMape
```
canvas (fx):
```
body('GetMapa')?['d']?['CanvasContent1']
```
fragmenty (fx):
```
string(outputs('Plan')?['mapa'])
```

---

### 13-test. Gdy mapa jest pusta mimo poprawnego result i 200 w SaveMapa

Test 1 — NOWA strona: Site Pages → New → Page → pusty szablon, nazwij np. `Mapa-test`,
Publish. W `GetMapa` podmien `<MAPA>` na `Mapa-test.aspx`, uruchom flow.
Renderuje → stara strona byla uszkodzona: usun ja, zmien nazwe nowej (Rename) i wroc do `<MAPA>`.

Test 2 — jesli nowa strona tez pusta: do skryptu `wstawMape` wklej kod
`scripts/wstawMapeJedenWebPart.ts` (1 web part, fragmenty rozdzielone `<hr>`), uruchom flow.
Renderuje → problemem sa wielokrotne sekcje w tablicy JSON; mapa zostaje w jednym web parcie.

## 13a. StopGdyERR — Control → Condition (PRZED CheckoutMapa)

Bezpiecznik: jesli skrypt zwrocil ERR, flow ma sie ZATRZYMAC, a nie zapisac komunikat
jako tresc strony (to dawalo pusta mape).

Lewa strona (fx):
```
startsWith(body('WstawMape')?['result'], 'ERR')
```
is equal to: `true`

W galezi **If yes**: Control → **Terminate**, Status: `Failed`, Message (fx):
```
body('WstawMape')?['result']
```
Galaz If no: pusta. Akcje 13b–15 dodaj PONIZEJ warunku (nie w galezi).

## 13b. CheckoutMapa — Send an HTTP request to SharePoint (PRZED SaveMapa)

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/checkoutpage')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## 14. SaveMapa — Send an HTTP request to SharePoint

`wstawMape` zwraca kanwe jako TABLICE JSON kontrolek w formacie SaveDraft — ta sama droga:
savepageasdraft.

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/savepageasdraft')
```
Headers: Accept i Content-Type jak w 8.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title','Mapa dokumentacji'),'CanvasContent1',body('WstawMape')?['result']))
```

---

## 15. PublishMapa — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

---

## Zasady

- Tresc kazdej strony jest BUDOWANA OD NOWA ze zrodel (parser + mapowanie linkow).
  Reczne edycje stron sprzed tego flow zostana nadpisane. Po nim edycja jest wolna.
- Strona mapy: flow BUDUJE KANWE OD NOWA — 5 sekcji (korzen + 4 galezie), kazda z jednym
  web partem tekstowym. Ustawienia sekcji (zwijanie, tytul) NIE sa zachowywane — po biegu
  wlacz zwijanie recznie: Edit → sekcja → Edit section → Make this section collapsible
  (4 razy). Kolejny bieg flow to resetuje.
  Dlaczego nie automatycznie: tablica JSON z `zoneGroupMetadata` (zarowno zgadywana, jak
  i przepisana ze strony) daje w savepageasdraft pusta strone — sprawdzone dwa razy
  (parser v3, wstawMape v2). Pusty fragment lub bledny JSON = `WstawMape` zwraca `ERR:`
  i bezpiecznik 13a zatrzymuje flow.
- `category` musi istniec w wyborach kolumny `Category` w Site Pages.
- Flow jest idempotentny — mozna uruchamiac wielokrotnie.
- Czas: ~60 x 30 s = 30–40 min.
