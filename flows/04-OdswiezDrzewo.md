# 4 — OdswiezDrzewo (utrzymanie)

Jedyny flow, ktory uruchamiasz po zakonczeniu migracji. Przy starcie **wybierasz
serwis i strone mapy**, wiec jeden flow obsluguje wszystkie serwisy i wszystkie
strony map.

Przyklady uzycia:

| Serwis | Strona mapy | Efekt |
|---|---|---|
| `GMSC` | `Documentation-Map.aspx` | drzewo GMSC na stronie mapy GMSC |
| `SWB` | `Documentation-Map-Switchboard.aspx` | drzewo Switchboarda na jego stronie |
| `GMSC` | *(puste)* | tylko przeliczenie metadanych, bez ruszania map |

**Dwie rzeczy naraz, o roznym zasiegu:**

- **metadane drzewa** (`TreePath`, `TreeSort`, `SortOrder`, `Category`) przelicza
  dla **wszystkich** serwisow — potrzebuje ich aplikacja do zakladek
- **strone-mape** buduje dla **jednego** serwisu, tego wybranego przy starcie

Czyta biblioteke **Site Pages**, a nie mape migracji, wiec obejmuje takze strony
zalozone recznie.

Podmien tylko `<WITRYNA>` (patrz [README.md](README.md)) — serwis i strone mapy
podajesz przy kazdym uruchomieniu. Nazwy akcji dokladnie jak w naglowkach.

## Kiedy uruchomic

- doszla nowa strona albo zostala usunieta
- strona zmienila rodzica albo tytul
- zalozyles strone mapy dla nowego serwisu
- chcesz sprawdzic, czy nic nie wypadlo z drzewa

---

## 1. Trigger — Power Apps (V2)

Ten trigger daje pola do wypelnienia przy kazdym uruchomieniu, a jednoczesnie
pozwala wywolac flow z aplikacji. Recznie uruchamiasz go przez
**Test → Manually → Run**, i wtedy Power Automate zapyta o wartosci.

Dodaj dwa wejscia tekstowe, **w tej kolejnosci**, przyciskiem
**Add an input → Text**:

```
serwis
```
```
stronaMapy
```

- `serwis` — kod z kolumny `Code` listy `DT_Services`, np. `GMSC` albo `SWB`
- `stronaMapy` — nazwa pliku strony, np. `Documentation-Map.aspx`.
  **Zostaw puste, jesli chcesz tylko przeliczyc metadane** bez budowania mapy

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
pomin (fx) — nazwa strony mapy z triggera, zeby nie liczyla sama siebie:
```
triggerBody()?['text_1']
```
serwisMapy (fx) — kod serwisu z triggera:
```
triggerBody()?['text']
```

Jesli podpowiedzi pokazuja inne nazwy pol, wstaw tokeny **serwis** i **stronaMapy**
z dynamic content zamiast wpisywac wyrazenia recznie.

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
Galaz If no: pusta. Akcje 6–13 dodaj PONIZEJ warunku.

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

## 8. CzyBudowacMape — Control → Condition   (PONIZEJ petli)

Gdy `stronaMapy` jest puste, flow konczy sie tutaj: metadane sa przeliczone,
zadna strona nie zostaje ruszona. Tak wola go aplikacja po dodaniu strony.

Lewa strona (fx):
```
empty(triggerBody()?['text_1'])
```
is equal to: `false`

**Akcje 9–13 wstaw w galezi If yes.** Galaz If no: pusta.

## 9. BudujMape — Excel Online → Run script

Script (lista):
```
budujMape
```
fragmenty (fx):
```
string(outputs('Plan')?['mapa'])
```

## 10. StopGdyERR — Control → Condition

Drugi bezpiecznik, na wynik `budujMape`. Bez niego komunikat bledu zostalby
zapisany jako tresc mapy, a zmiana nazwy nadpisalaby dzialajaca strone.

Lewa strona (fx):
```
startsWith(body('BudujMape')?['result'], 'ERR')
```
is equal to: `true`

W galezi **If yes**: Control → **Terminate**, Status `Failed`, Message (fx):
```
body('BudujMape')?['result']
```
Galaz If no: pusta. Akcje 11–13 dodaj ponizej tego warunku, nadal wewnatrz
galezi If yes z punktu 8.

## 11. CreatePage — Send an HTTP request to SharePoint

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
Body (fx) — tytul strony bierzemy z nazwy pliku, bez rozszerzenia i z myslnikami
zamienionymi na spacje:
```
string(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"},"PageLayoutType":"Article","PromotedState":0}'),'Title',replace(replace(triggerBody()?['text_1'], '.aspx', ''), '-', ' ')))
```

## 12. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```
Headers: te same dwa co w 11.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',replace(replace(triggerBody()?['text_1'], '.aspx', ''), '-', ' ')),'CanvasContent1',body('BudujMape')?['result']))
```

## 13. RenamePage — Send an HTTP request to SharePoint

Method: POST

Uri (fx) — podmien `<WITRYNA>` w DWOCH miejscach; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''<WITRYNA>/SitePages/', triggerBody()?['text_1'], ''',flags=1)')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 14. PublishMapa — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Jak tego uzywac

### Odswiezenie mapy GMSC

**Test → Manually → Run** → `serwis` = `GMSC`, `stronaMapy` = `Documentation-Map.aspx`

### Nowy serwis, nowa strona mapy

1. Zaloz strone recznie: Site Pages → **New** → **Page** → pusty szablon →
   tytul `Documentation Map Switchboard` → **Publish**.
   Nie wpisuj tresci, flow i tak ja nadpisze.
2. **Nie ustawiaj** kolumny `Service` na tej stronie. Strony map nie naleza do
   drzewa; puste `Service` trzyma je poza nim.
3. Uruchom flow: `serwis` = `SWB`, `stronaMapy` = `Documentation-Map-Switchboard.aspx`

Nazwe pliku sprawdzisz w pasku adresu po otwarciu strony. Tytul `Documentation Map
Switchboard` daje zwykle plik `Documentation-Map-Switchboard.aspx`.

Strony nie musisz nawet zakladac wczesniej — flow tworzy ja sam, jesli nie
istnieje. Zakladasz ja recznie tylko po to, zeby od razu dodac link w lewym panelu
witryny.

### Samo przeliczenie metadanych, bez map

`serwis` = dowolny, `stronaMapy` = **puste**. Przydaje sie po dodaniu strony,
gdy nie chcesz czekac na przebudowe mapy. Tak wola ten flow aplikacja.

---

## Sprawdzenie po biegu

W wyniku akcji `Planuj` (rozwin `Plan`) znajdziesz liczniki:

| Pole | Co znaczy |
|---|---|
| `serwisy` | ile serwisow ma poprawny korzen |
| `wMapie` | ile z nich trafilo na strone-mape (przy wybranym serwisie: 1) |
| `sieroty` | strony z `Service`, ale bez rodzica — do uzupelnienia |
| `pozaDokumentacja` | strony bez `Service`, pominiete (strony witryny i strony map) |

Jesli `sieroty` rosna, ktoras strona zgubila `ParentPageId`.
Jesli `wMapie` to zero, kod serwisu nie pasuje do zadnej strony — sprawdz pisownie.

## Co zobaczysz na stronie mapy

Korzen wybranego serwisu, pod nim zwijane galezie z zagniezdzonymi listami.
Sekcja **„Bez przypisania"** na koncu dotyczy tylko tego serwisu.

## Jak dodac nowa strone do dokumentacji

1. Site Pages → New → Page, napisz tresc, Publish.
2. Page details → ustaw:
   - `ParentPageId` = **Id strony nadrzednej** (kolumna `ID` w widoku listy)
   - `Service` = kod serwisu
   - `DocStatus` = `Published`
   - `ConfluencePageId` = `0` — oznacza strone spoza migracji
3. Uruchom ten flow dla serwisu tej strony. Reszta kolumn i mapa uzupelnia sie same.

## Zasady

- Kazdy bieg tworzy nowa strone mapy i nadpisuje wskazana (`flags=1`). Reczne
  zmiany w mapie przepadaja — to strona generowana.
- `Category` musi istniec w wyborach kolumny w Site Pages, inaczej zapis metadanych padnie.
- Flow nie rusza tresci stron dokumentacji. Bezpieczny do uruchamiania w dowolnym momencie.
- Strony map **nie moga miec** wypelnionej kolumny `Service` — inaczej wejda
  do wlasnego drzewa.
