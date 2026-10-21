# 4 — OdswiezDrzewo (utrzymanie)

Jedyny flow, ktory uruchamiasz po zakonczeniu migracji.

Obsluguje wszystkie serwisy naraz: strony grupowane sa po kolumnie `Service`,
kazdy serwis dostaje wlasny korzen i wlasne sekcje mapy.

Czyta biblioteke **Site Pages**, a nie mape migracji — dzieki temu obejmuje takze
strony zalozone recznie. Przelicza `TreePath`, `TreeSort`, `SortOrder` i `Category`
na podstawie kolumny `ParentPageId`, po czym buduje strone-mape od nowa.

Podmien `<WITRYNA>` i `<MAPA>` (patrz [README.md](README.md)).
Nazwy akcji dokladnie jak w naglowkach.

## Kiedy uruchomic

- doszla nowa strona
- strona zostala usunieta
- strona zmienila rodzica albo tytul
- chcesz sprawdzic, czy nic nie wypadlo z drzewa

---

## 1. Trigger — Manually trigger a flow

Mozesz dodac drugi trigger `Recurrence`, np. raz na dobe w nocy.

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
pomin (tekst):
```
<MAPA>
```

## 4. Plan — Data Operation → Compose

Inputs (fx):
```
json(body('Planuj')?['result'])
```

## 5. StopGdyBlad — Control → Condition

Bezpiecznik: gdy skrypt nie znalazl korzenia drzewa, flow ma stanac, a nie zapisac
pustej mapy.

Lewa strona (fx):
```
empty(coalesce(outputs('Plan')?['blad'], ''))
```
is equal to: `false`

W galezi **If yes**: Control → **Terminate**, Status `Failed`, Message (fx):
```
outputs('Plan')?['blad']
```
Galaz If no: pusta. Akcje 6–11 dodaj PONIZEJ warunku.

## 6. Apply to each — Control

Select an output (fx):
```
outputs('Plan')?['pages']
```

Wewnatrz petli jedna akcja:

## 7. UstawMetadane — SharePoint → Update file properties

Library Name (Enter custom value):
```
Site Pages
```
Id (fx):
```
items('Apply_to_each')?['id']
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
**WSZYSTKIE pozostale pola PUSTE** — zwlaszcza `ParentPageId`. To twoje zrodlo prawdy,
flow ma je czytac, nigdy nadpisywac.

## 8. BudujMape — Excel Online → Run script   (PONIZEJ petli)

Script (lista):
```
budujMape
```
fragmenty (fx):
```
string(outputs('Plan')?['mapa'])
```

## 9. CreatePage — Send an HTTP request to SharePoint

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
Body (tekst):
```
{"__metadata":{"type":"SP.Publishing.SitePage"},"Title":"Mapa dokumentacji","PageLayoutType":"Article","PromotedState":0}
```

## 10. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```
Headers: te same dwa co w 9.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title','Mapa dokumentacji'),'CanvasContent1',body('BudujMape')?['result']))
```

## 11. RenamePage — Send an HTTP request to SharePoint

Method: POST

Uri (fx) — podmien `<WITRYNA>` w DWOCH miejscach i `<MAPA>`; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''<WITRYNA>/SitePages/<MAPA>'',flags=1)')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 12. PublishMapa — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Jak dodac nowa strone do dokumentacji

1. Site Pages → New → Page, napisz tresc, Publish.
2. Page details (albo widok listy Site Pages) → ustaw:
   - `ParentPageId` = **Id strony nadrzednej** (kolumna `ID` w widoku listy)
   - `DocStatus` = `Published`
   - `ConfluencePageId` zostaw puste — to nie jest strona z migracji
3. Uruchom ten flow. Reszta kolumn i mapa uzupelnia sie same.

Sciezka nadrzedna i blok „Podstrony" w TRESCI stron pochodza z kroku 2 i dotycza
tylko stron zmigrowanych. Na stronach pisanych recznie dodaj je sam albo pomin —
nawigacje zapewnia mapa.

## Co zobaczysz w mapie

Korzen, pod nim zwijane galezie z zagniezdzonymi listami. Przy kilku serwisach
kazdy ma wlasny korzen poprzedzony nazwa serwisu. Jesli jakas strona nie ma
`ParentPageId`, trafia na koniec mapy do sekcji **„Bez przypisania"** — to sygnal,
ze trzeba uzupelnic kolumne, a nie blad.

## Zasady

- Kazdy bieg tworzy nowa strone mapy i nadpisuje `<MAPA>` (flags=1). Reczne zmiany
  w mapie przepadaja — to strona generowana.
- `Category` musi istniec w wyborach kolumny w Site Pages, inaczej zapis metadanych padnie.
- Flow nie rusza tresci stron. Bezpieczny do uruchamiania w dowolnym momencie.
