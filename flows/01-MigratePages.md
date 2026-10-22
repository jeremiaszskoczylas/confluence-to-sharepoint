# 1 — MigratePages

Tworzy w Site Pages po jednej stronie na kazdy wiersz `Pending` w `DT_MigrationMap`.
Tresc jest juz wtedy sparsowana, ale bez linkow wewnetrznych, sciezki i podstron —
te dokłada krok 2.

Podmien tylko `<WITRYNA>` i `<BIBLIOTEKA>` (patrz [README.md](README.md)).
Liste, serwis i folder eksportu podajesz przy kazdym uruchomieniu.
Nazwy akcji dokladnie jak w naglowkach.

**Ten sam zbudowany flow migruje kazdy serwis.** Przy kolejnej przestrzeni
zakladasz dla niej osobna liste migracyjna, rozpakowujesz eksport do osobnego
folderu i uruchamiasz ten flow z innymi wartosciami w trzech polach.
Nic sie nie nadpisze: nazwy plikow stron dostaja prefiks serwisu, a kazdy serwis
ma wlasna liste roboczca.

---

## 1. Trigger — Manually trigger a flow

Dodaj trzy wejscia tekstowe, **w tej kolejnosci**, przyciskiem
**Add an input → Text**:

```
lista
```
```
serwis
```
```
eksport
```

- `lista` — nazwa listy migracyjnej tego serwisu, np. `DT_MigrationMap`
  albo `DT_MigrationMap_Switchboard`
- `serwis` — kod z `DT_Services`, np. `GMSC` albo `SWB`
- `eksport` — folder eksportu w bibliotece, np. `confluence-export/SWB`

Dzieki nim **jeden zbudowany flow migruje kazdy serwis**. Przy kolejnej
przestrzeni nie przepisujesz zadnej akcji — wpisujesz inne wartosci przy starcie.

> **Jak odwolywac sie do pol triggera.** Power Automate nadaje im wlasne klucze
> (`text`, `text_1`, `text_2`) i nie zawsze sa to nazwy, ktore wpisales. Dlatego
> **wszedzie ponizej wstawiaj tokeny z dynamic content**, zamiast przepisywac
> wyrazenia recznie. Podane wyrazenia to wariant awaryjny.

> Zeby zobaczyc prawdziwe klucze: uruchom flow raz, w historii biegu kliknij
> trigger i **Show raw outputs**.


## 2. GetPending — SharePoint → Get items

List Name — **Enter custom value**, potem token **lista** z dynamic content.
Awaryjnie (fx):
```
triggerBody()?['text']
```
Filter Query (tekst) — lista jest juz per serwis, wiec wystarczy status:
```
MigrationStatus eq 'Pending'
```
Top Count (tekst) — na pierwszy bieg `1`, potem `5000`:
```
1
```

## 3. Apply to each — Control

Select an output (dyn): **value** z GetPending.
Akcje 4–11 WEWNATRZ petli. **Takze akcja 11 OdhaczWMapie** — odwoluje sie do
`items('Apply_to_each')`, wiec poza petla flow sie nie zapisze.

## 4. GetHtml — SharePoint → Get file content using path

File Path (fx):
```
concat('/<BIBLIOTEKA>/', triggerBody()?['text_2'], '/', items('Apply_to_each')?['SourceFile'])
```

## 5. ParsujTresc — Excel Online → Run script

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
items('Apply_to_each')?['Title']
```
linki, nag, pod — **PUSTE** (wypelnia je krok 2).

## 6. CreatePage — Send an HTTP request to SharePoint

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
Body (fx) — CALE pole:
```
string(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"},"PageLayoutType":"Article","PromotedState":0}'),'Title',items('Apply_to_each')?['Title']))
```

## 7. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```
Headers: te same dwa co w 6.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',items('Apply_to_each')?['Title']),'CanvasContent1',body('ParsujTresc')?['result']))
```

## 8. UstawMetadane — SharePoint → Update file properties

Library Name (Enter custom value):
```
Site Pages
```
Id (fx):
```
body('CreatePage')?['d']?['Id']
```
ConfluencePageId (fx):
```
items('Apply_to_each')?['ConfluenceId']
```
Service Value — **Enter custom value**, potem token **serwis**. Awaryjnie (fx):
```
triggerBody()?['text_1']
```
DocStatus Value (lista):
```
Draft
```
**Pozostale pola PUSTE.**

> **Uwaga.** Akcja `Update file properties` wysyla komplet kolumn z formularza,
> a puste pole liczbowe bywa zapisane jako **zero**. Jesli po biegu zobaczysz
> `ConfluencePageId` albo `ParentPageId` rowne zero tam, gdzie mialy byc liczby,
> odtworz je flow [97-NaprawMetadaneStron](97-NaprawMetadaneStron.md)
> i rozwaz przejscie na `ValidateUpdateListItem`, jak w kroku 4. `ParentPageId`, `SortOrder`, `TreePath`, `TreeSort`
i `Category` wypelnia krok 2 — wpisane tu zero zepsuje drzewo.

## 9. RenamePage — Send an HTTP request to SharePoint

Endpoint tworzacy strony nadaje losowa nazwe pliku. Ta akcja zmienia ja na nazwe
z eksportu, dzieki czemu adresy sa czytelne i powtarzalne.

Method: POST

Uri (fx) — podmien `<WITRYNA>` w DWOCH miejscach; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''<WITRYNA>/SitePages/', triggerBody()?['text_1'], '-', replace(items('Apply_to_each')?['SourceFile'], '.html', '.aspx'), ''',flags=1)')
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

## 11. OdhaczWMapie — SharePoint → Update item

List Name — **Enter custom value**, token **lista** (ten sam co w kroku 2).
Id (fx):
```
items('Apply_to_each')?['ID']
```
Title (fx):
```
items('Apply_to_each')?['Title']
```
MigrationStatus Value (lista):
```
PageCreated
```
TargetPageId (fx):
```
body('CreatePage')?['d']?['Id']
```
TargetUrl (fx) — ta sama nazwa co w RenamePage, z prefiksem serwisu:
```
concat('SitePages/', triggerBody()?['text_1'], '-', replace(items('Apply_to_each')?['SourceFile'], '.html', '.aspx'))
```
MigratedOn (fx):
```
utcNow()
```
**WSZYSTKIE pozostale pola PUSTE** — w szczegolnosci `ConfluenceId`,
`ParentConfluenceId` i `Depth`. Wpisane `0` kasuje hierarchie przy kazdej iteracji.

---

## Bieg

1. Top Count `1` → Run. Obejrzyj utworzona strone: naglowki, ramki, obrazy.
2. Jesli dobrze: Top Count `5000` → Run. Okolo 10 sekund na strone.
3. Kontrola: wszystkie wiersze maja `PageCreated`, `TargetPageId` i `TargetUrl`.

## Znane ograniczenia

- Cudzyslow w tytule rozbija JSON w `CreatePage`. Przejrzyj tytuly przed biegiem.
- Dwie strony o tym samym `SourceFile` **w tym samym serwisie** nadpisza sie
  nawzajem. Miedzy serwisami kolizji nie ma, bo nazwa pliku zaczyna sie od kodu
  serwisu: `GMSC-Home-Page.aspx` i `SRV2-Home-Page.aspx` to dwa rozne pliki.
