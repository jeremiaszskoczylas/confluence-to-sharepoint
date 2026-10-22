# 4 — OdswiezDrzewo: strona mapy serwisu

Buduje strone z drzewem dokumentacji dla **wybranego serwisu**.

To **ten sam flow, ktory zbudowal dzialajaca mape GMSC** — ta sama kolejnosc
akcji i te same wyrazenia. Dodane sa tylko dwa pola przy starcie: kod serwisu
i nazwa strony mapy.

Dziesiec akcji, okolo minuty biegu.

| serwis | stronaMapy | Efekt |
|---|---|---|
| `GMSC` | `Documentation-Map.aspx` | drzewo GMSC na stronie GMSC |
| `SWB` | `Documentation-Map-Switchboard.aspx` | drzewo Switchboarda na jego stronie |

**Ten flow nie zapisuje niczego na stronach dokumentacji.** Nie dotyka
`ParentPageId`, `ConfluencePageId`, `Service` ani `DocStatus` — tylko je czyta.
Kolumny `TreePath`, `TreeSort`, `SortOrder` i `Category` wypelnia krok 2 przy
migracji, a dla stron zakladanych recznie
[04b-PrzeliczDrzewo](04b-PrzeliczDrzewo.md).

Podmien tylko `<WITRYNA>`. Nazwy akcji dokladnie jak w naglowkach.

## Kiedy uruchomic

- po migracji serwisu, zeby powstala jego strona mapy
- po dodaniu, usunieciu albo przeniesieniu strony
- po zalozeniu strony mapy dla nowego serwisu

---

## 1. Trigger — Manually trigger a flow

Dodaj dwa wejscia tekstowe, **w tej kolejnosci**, przyciskiem
**Add an input → Text**:

```
serwis
```
```
stronaMapy
```

- `serwis` — kod z kolumny `Code` listy `DT_Services`, np. `GMSC` albo `SWB`
- `stronaMapy` — nazwa pliku strony, np. `Documentation-Map.aspx`

> **Jak odwolywac sie do tych pol.** Power Automate nadaje im wlasne klucze
> (`text`, `text_1`) i nie zawsze sa to nazwy, ktore wpisales. **Wszedzie ponizej
> wstawiaj tokeny z dynamic content**; podane wyrazenia to wariant awaryjny.
> Prawdziwe klucze zobaczysz w historii biegu: kliknij trigger → **Show raw outputs**.

## 2. GetStrony — Send an HTTP request to SharePoint

Method: GET

Uri (tekst) — CALE pole, jedna linia:
```
_api/web/lists/getbytitle('Site Pages')/items?$select=Id,Title,ParentPageId,SortOrder,FileRef,FileLeafRef,Service&$filter=FSObjType eq 0&$top=5000
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

## 3. Planuj — Excel Online → Run script

Script (lista):
```
planujMape
```
dane (fx):
```
string(body('GetStrony')?['d']?['results'])
```
pomin — **token `stronaMapy`** (zeby mapa nie liczyla sama siebie). Awaryjnie (fx):
```
triggerBody()?['text_1']
```
serwisMapy — **token `serwis`**. Awaryjnie (fx):
```
triggerBody()?['text']
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

Bezpiecznik. Bez niego komunikat bledu zostalby zapisany jako tresc mapy,
a zmiana nazwy nadpisalaby dzialajaca strone.

Lewa strona (fx):
```
startsWith(body('BudujMape')?['result'], 'ERR')
```
is equal to: `true`

W galezi **If yes**: Control → **Terminate**, Status `Failed`, Message (fx):
```
body('BudujMape')?['result']
```
Galaz If no: pusta. Akcje 7–10 dodaj PONIZEJ warunku.

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
Body (fx) — tytul powstaje z nazwy pliku: bez rozszerzenia, myslniki na spacje:
```
string(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"},"PageLayoutType":"Article","PromotedState":0}'),'Title',replace(replace(triggerBody()?['text_1'], '.aspx', ''), '-', ' ')))
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
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',replace(replace(triggerBody()?['text_1'], '.aspx', ''), '-', ' ')),'CanvasContent1',body('BudujMape')?['result']))
```

## 9. RenamePage — Send an HTTP request to SharePoint

Method: POST

Uri (fx) — podmien `<WITRYNA>` w DWOCH miejscach; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''<WITRYNA>/SitePages/', triggerBody()?['text_1'], ''',flags=1)')
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

- `BudujMape` → `result` zaczyna sie od `[{"controlType":4,"id":"c5f0a545`
- `CreatePage` → w body jest `d.Id` (liczba) i `d.Url` (losowa nazwa pliku)
- `SaveDraft`, `RenamePage`, `Publish` → 200
- strona z pola `stronaMapy` (Ctrl+F5): link do korzenia serwisu, pod nim
  zwijane galezie z zagniezdzonymi listami

W wyniku akcji `Planuj` (rozwin `Plan`) sa liczniki:

| Pole | Co znaczy |
|---|---|
| `serwisy` | ile serwisow ma poprawny korzen |
| `wMapie` | ile trafilo na te strone (przy wybranym serwisie: 1) |
| `sieroty` | strony tego serwisu majace `Service`, ale bez rodzica |
| `pozaDokumentacja` | strony bez `Service`, pominiete (strony witryny i strony map) |

Gdy `wMapie` to zero, kod serwisu nie pasuje do zadnej strony — sprawdz pisownie.

## Nowa strona mapy dla kolejnego serwisu

1. Site Pages → **New** → **Page** → pusty szablon → tytul
   `Documentation Map Switchboard` → **Publish**. Tresci nie pisz, flow ja nadpisze.
2. **Nie ustawiaj** kolumny `Service` na stronie mapy. Strony map nie naleza
   do drzewa; puste `Service` trzyma je poza nim.
3. Uruchom flow: `serwis` = `SWB`, `stronaMapy` = `Documentation-Map-Switchboard.aspx`

Strony nie musisz zakladac wczesniej — flow utworzy ja sam. Robisz to recznie
tylko po to, zeby od razu dodac link w lewym panelu witryny.

## Zasady

- Kazdy bieg tworzy nowa strone i nadpisuje wskazana (`flags=1`). Reczne zmiany
  w mapie przepadaja — to strona generowana.
- Flow **tylko czyta** biblioteke. Nie zapisuje metadanych, wiec nie ma jak
  zepsuc hierarchii ani zapetlic sie na setkach stron.
- Strony map nie moga miec wypelnionej kolumny `Service`.
