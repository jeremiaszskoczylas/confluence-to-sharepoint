# 4 — OdswiezDrzewo: strona mapy serwisu

Wpisuje drzewo dokumentacji **wybranego serwisu** do **istniejacej strony**,
ktorej nazwe podajesz przy starcie. Nie tworzy nowych stron.

Dziesiec akcji, okolo minuty biegu.

| serwis | stronaMapy | Efekt |
|---|---|---|
| `GMSC` | `Documentation-Map.aspx` | drzewo GMSC wpisane w te strone |
| `SWB` | `Documentation-Map-Switchboard.aspx` | drzewo Switchboarda w jego strone |

**Strona musi istniec przed uruchomieniem.** Zakladasz ja raz, recznie
(Site Pages → New → Page → pusty szablon → Publish), potem flow tylko podmienia
jej tresc. Jesli strony nie ma, akcja `GetMapa` konczy sie bledem 404.

**Ten flow nie zapisuje niczego na stronach dokumentacji.** Nie dotyka
`ParentPageId`, `ConfluencePageId`, `Service` ani `DocStatus` — tylko je czyta.
Kolumny `TreePath`, `TreeSort`, `SortOrder` i `Category` wypelnia krok 2 przy
migracji, a dla stron zakladanych recznie
[04b-PrzeliczDrzewo](04b-PrzeliczDrzewo.md).

Podmien tylko `<WITRYNA>`. Nazwy akcji dokladnie jak w naglowkach.

## Kiedy uruchomic

- po migracji serwisu, zeby na jego stronie mapy pojawilo sie drzewo
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
- `stronaMapy` — nazwa pliku istniejacej strony, np. `Documentation-Map.aspx`

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

Bezpiecznik. Bez niego komunikat bledu zostalby zapisany jako tresc mapy
i skasowalby dzialajace drzewo.

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

## 7. GetMapa — Send an HTTP request to SharePoint

Odnajduje strone, ktora mamy nadpisac, i jej `Id` w bibliotece.

Method: GET

Uri (fx) — podmien `<WITRYNA>`; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/SitePages/', triggerBody()?['text_1'], ''')/ListItemAllFields?$select=Id,Title')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Jesli ta akcja zwroci **404**, strony o tej nazwie nie ma. Sprawdz pisownie
i rozszerzenie `.aspx`, albo zaloz strone recznie.

## 8. CheckoutMapa — Send an HTTP request to SharePoint

Opublikowanej strony nie da sie zapisac bez wypozyczenia — bez tej akcji
nastepna konczy sie bledem **409 Conflict**.

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/checkoutpage')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 9. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/savepageasdraft')
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

Body (fx) — CALE pole. Tytul przepisujemy ten, ktory strona juz ma, zeby flow
nie zmienial nazwy nadanej recznie:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',body('GetMapa')?['d']?['Title']),'CanvasContent1',body('BudujMape')?['result']))
```

## 10. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Sprawdzenie

- `BudujMape` → `result` zaczyna sie od `[{"controlType":4,"id":"c5f0a545`
- `GetMapa` → w body jest `d.Id` (liczba) i `d.Title`
- `CheckoutMapa`, `SaveDraft`, `Publish` → 200
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

Krok 1 jest obowiazkowy — flow nie zaklada stron, tylko wypelnia istniejace.

## Zasady

- Kazdy bieg podmienia **cala** tresc wskazanej strony. Reczne zmiany w mapie
  przepadaja — to strona generowana.
- Flow **tylko czyta** biblioteke stron dokumentacji. Nie zapisuje metadanych,
  wiec nie ma jak zepsuc hierarchii ani zapetlic sie na setkach stron.
- Strony map nie moga miec wypelnionej kolumny `Service`.

## Jesli strona wyjdzie pusta

Zdarzylo sie to raz, we wrzesniu, i powodem nie byl ten sposob zapisu, tylko
stary skrypt budujacy kanwe. Jesli mimo zielonego biegu strona jest pusta:

1. sprawdz w `BudujMape`, czy `result` zaczyna sie od `[{"controlType":4`
2. jesli tak, a strona nadal pusta — ta konkretna strona jest uszkodzona.
   Usun ja, zaloz od nowa pod ta sama nazwa i uruchom flow jeszcze raz.
