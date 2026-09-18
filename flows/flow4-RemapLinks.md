# Flow 4 — RemapLinks

Drugi przebieg po migracji. Jeden flow, ktory dla kazdej zmigrowanej strony:
- podmienia placeholdery `{{CONF:<id>}}` i linki absolutne do starego Confluence na adresy stron w SharePoint
- dodaje sciezke (breadcrumb) na gorze i blok "Podstrony" na dole
- wypelnia kolumny `ParentPageId`, `Category`, `SortOrder`, `TreePath`, `TreeSort`, `DocStatus=Published`
- wypelnia strone "Mapa dokumentacji" (5 web partow tekstowych: korzen + 4 galezie)

UWAGA: tresc kazdej strony jest BUDOWANA OD NOWA ze zrodel HTML (ten sam parser co w Flow 3,
plus mapowanie linkow). Reczne edycje stron wykonane przed tym flow zostana nadpisane.
Po tym flow edycja jest juz wolna.

## PODMIEN PRZED UZYCIEM

| Placeholder | Na co podmienic |
|---|---|
| `<SCIEZKA-WITRYNY>` | pelna sciezka server-relative witryny, np. `/teams/Dzial/podwitryna` (bez domeny, bez ukosnika na koncu) |
| `<FOLDER-EKSPORTU>` | sciezka do rozpakowanego eksportu w bibliotece plikow |
| `<PLIK-MAPY>` | nazwa pliku strony mapy, np. `Mapa-dokumentacji.aspx` (z paska adresu) |

## SKRYPTY (Excel Online -> Automate -> New Script, skopiowac z repo)

| Skrypt | Parametry | Rola |
|---|---|---|
| `planujDrzewo` | `dane`, `witryna` | liczy hierarchie, sciezki, podstrony, mapowanie linkow, fragmenty mapy |
| `parseTresc` (aktualny) | `html`, `base`, `tytul`, `linki`, `nag`, `pod` | parser z 3 nowymi parametrami |
| `wstawMape` | `canvas`, `fragmenty` | wstrzykuje fragmenty do web partow strony mapy |

Po podmianie `parseTresc` w Flow 3 pojawia sie trzy nowe pola (`linki`, `nag`, `pod`) — tam zostawic PUSTE.

## ZASADY (jak w Flow 3)

- nazwy akcji DOKLADNIE jak nizej (Rename przez trzy kropki)
- **[fx]** = panel wyrazen, w polu ma byc zeton; **[tekst]** = zwykle wpisanie

---

## 1. Trigger

`Manually trigger a flow`

## 2. Akcja: GetAll   (SharePoint -> Get items)

- List Name: `DT_MigrationMap`
- Advanced -> Top Count **[tekst]**: `5000`
- BEZ Filter Query (potrzebne wszystkie wiersze do policzenia hierarchii)

## 3. Akcja: Planuj   (Excel Online -> Run script)

- Script: `planujDrzewo`
- `dane` **[fx]**:

```
string(body('GetAll')?['value'])
```

- `witryna` **[tekst]** — z ukosnikiem na koncu:

```
<SCIEZKA-WITRYNY>/
```

## 4. Akcja: Plan   (Data Operation -> Compose)

- Inputs **[fx]**:

```
json(body('Planuj')?['result'])
```

## 5. Apply to each   (nazwa: `Apply_to_each`)

- Select an output **[fx]**:

```
outputs('Plan')?['pages']
```

Wszystko ponizej (6–11) jest WEWNATRZ petli.

## 6. Akcja: GetHtml   (SharePoint -> Get file content using path)

- File Path **[fx]**:

```
concat('/Dashboard_Team/<FOLDER-EKSPORTU>/', items('Apply_to_each')?['file'])
```

## 7. Akcja: ParsujTresc   (Excel Online -> Run script)

- Script: `parseTresc`
- `html`: dynamic content **File Content** z GetHtml
- `base` **[tekst]**: `<SCIEZKA-WITRYNY>/SiteAssets/DocMedia/attachments/`
- `tytul` **[fx]**: `items('Apply_to_each')?['title']`
- `linki` **[fx]**: `outputs('Plan')?['linki']`
- `nag` **[fx]**: `items('Apply_to_each')?['nag']`
- `pod` **[fx]**: `items('Apply_to_each')?['pod']`

## 8. Akcja: SaveDraft   (Send an HTTP request to SharePoint)

- Method: `POST`
- Uri **[fx]**:

```
concat('_api/sitepages/pages(', items('Apply_to_each')?['pageId'], ')/savepageasdraft')
```

- Headers: `Accept` = `application/json;odata=verbose`, `Content-Type` = `application/json;odata=verbose`
- Body — CALE pole **[fx]**:

```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',items('Apply_to_each')?['title']),'CanvasContent1',body('ParsujTresc')?['result']))
```

## 9. Akcja: UstawMetadane   (SharePoint -> Update file properties)

- Library Name: `Site Pages` (Enter custom value)
- Id **[fx]**: `items('Apply_to_each')?['pageId']`
- ParentPageId **[fx]**: `items('Apply_to_each')?['parentPageId']`
- SortOrder **[fx]**: `items('Apply_to_each')?['sortOrder']`
- TreePath **[fx]**: `items('Apply_to_each')?['treePath']`
- TreeSort **[fx]**: `items('Apply_to_each')?['treeSort']`
- Category Value — Enter custom value, potem **[fx]** (pusta kategoria = brak wartosci, nie pusty tekst):

```
if(equals(items('Apply_to_each')?['category'], ''), null, items('Apply_to_each')?['category'])
```

- DocStatus Value: wybierz z listy `Published`

UWAGA: wartosc `category` musi istniec w wyborach kolumny `Category` (Site Pages).
Galezie z eksportu: Standard Operating Procedures, Standard Service Procedure, Projects, WIP SOP.

## 10. Akcja: Publish   (Send an HTTP request to SharePoint)

- Method: `POST`
- Uri **[fx]**: `concat('_api/sitepages/pages(', items('Apply_to_each')?['pageId'], ')/publish')`
- Headers: `Accept` = `application/json;odata=verbose`
- Body: PUSTE

## 11. Akcja: OdhaczWMapie   (SharePoint -> Update item)

- List Name: `DT_MigrationMap`
- Id **[fx]**: `items('Apply_to_each')?['id']`
- Title **[fx]**: `items('Apply_to_each')?['title']`
- MigrationStatus Value: `LinksRemapped`

---

## 12. Akcja: GetMapa   (Send an HTTP request to SharePoint) — PO petli

- Method: `GET`
- Uri **[tekst]**:

```
_api/web/getfilebyserverrelativeurl('<SCIEZKA-WITRYNY>/SitePages/<PLIK-MAPY>')/ListItemAllFields?$select=Id,CanvasContent1
```

- Headers: `Accept` = `application/json;odata=verbose`

## 13. Akcja: WstawMape   (Excel Online -> Run script)

- Script: `wstawMape`
- `canvas` **[fx]**: `body('GetMapa')?['d']?['CanvasContent1']`
- `fragmenty` **[fx]**: `string(outputs('Plan')?['mapa'])`

Jesli wynik zaczyna sie od `ERR:` — liczba web partow tekstowych na stronie mapy nie zgadza sie
z liczba fragmentow (korzen + galezie). Popraw strone mapy (patrz sekcja "Strona mapy").

## 14. Akcja: SaveMapa   (Send an HTTP request to SharePoint)

- Method: `POST`
- Uri **[fx]**: `concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/savepageasdraft')`
- Headers: oba jak w SaveDraft
- Body — CALE pole **[fx]**:

```
string(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'CanvasContent1',body('WstawMape')?['result']))
```

## 15. Akcja: PublishMapa   (Send an HTTP request to SharePoint)

- Method: `POST`
- Uri **[fx]**: `concat('_api/sitepages/pages(', body('GetMapa')?['d']?['Id'], ')/publish')`
- Headers: `Accept` = `application/json;odata=verbose`

---

## Strona mapy — wymagana struktura

Strona utworzona recznie w edytorze, w tej kolejnosci od gory:
1. zwykla sekcja + web part Tekst (korzen)
2. sekcja ZWIJANA + web part Tekst (galaz 1)
3. sekcja ZWIJANA + web part Tekst (galaz 2)
4. sekcja ZWIJANA + web part Tekst (galaz 3)
5. sekcja ZWIJANA + web part Tekst (galaz 4)

Kazdy web part musi miec jakas tresc tymczasowa (pusty SharePoint potrafi usunac przy zapisie).
Flow podmienia WYLACZNIE tresc web partow; ustawienia sekcji (zwijanie, nazwy) zostaja.

## Test

1. Zapisz. Na pierwszy bieg ustaw w petli ograniczenie: Apply to each -> Settings -> brak;
   zamiast tego w akcji `Plan` nic nie zmieniaj, a w petli tymczasowo dodaj na poczatku
   warunek `equals(items('Apply_to_each')?['confId'], <ID JEDNEJ STRONY>)` — albo po prostu
   uruchom calosc: petla to 60 x (odczyt + skrypt + 3 wywolania API + 2 update) ~ 30–40 min.
2. Po biegu: strona z linkami (klikalne, prowadza do wlasciwych stron), sciezka na gorze,
   Podstrony na dole; kolumny wypelnione; mapa z lista.
3. `DT_MigrationMap`: wszystkie `LinksRemapped`.

## Ponowne uruchomienie

Flow jest idempotentny — mozna uruchamiac wielokrotnie (np. po dodaniu stron przez Flow 6
albo po poprawce parsera). Kazdy bieg przebudowuje tresc ze zrodel i odswieza mape.
