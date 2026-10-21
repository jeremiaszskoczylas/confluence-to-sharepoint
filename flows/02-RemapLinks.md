# 2 — RemapLinks

Przebudowuje tresc WSZYSTKICH zmigrowanych stron: podmienia linki wewnetrzne na
adresy w SharePoincie, dokłada sciezke nadrzedna i blok podstron, wypelnia metadane
drzewa (`ParentPageId`, `TreePath`, `TreeSort`, `SortOrder`, `Category`).

Uruchamiasz po kroku 1 oraz za kazdym razem, gdy zmieni sie `parseTresc`.
Podmien `<WITRYNA>`, `<EKSPORT>` i `<SERWIS>` (patrz [README.md](README.md)).

Flow przetwarza **jeden serwis na raz**. Drzewo, mapowanie linkow i sciezki
liczone sa tylko z jego stron, wiec linki nie przeciekaja miedzy serwisami,
a strona glowna jednej przestrzeni nie staje sie rodzicem drugiej.
Nazwy akcji dokladnie jak w naglowkach.

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
serwis (tekst) — kod serwisu; puste = wszystkie strony (stare zachowanie):
```
<SERWIS>
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
Przy kolejnym serwisie `<EKSPORT>` wskazuje jego folder eksportu.

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
(tak stracilismy ParentConfluenceId 2026-09-18; naprawa: 99-NaprawHierarchie.md).

---

## 12. Mapa dokumentacji — OSOBNY FLOW

Mapy ten flow nie dotyka. Buduje ja [03-BudujMape.md](03-BudujMape.md).
Jesli masz w RemapLinks akcje GetMapa, WstawMape, CheckoutMapa, SaveMapa
lub PublishMapa z wczesniejszych wersji — skasuj je.

---

## Zasady

- Strony z cloakami i zakladkami maja teraz kanwe z WIELU sekcji (sekcje zwijane).
  To ten sam format, ktory zdal test A/B/C/D - SaveDraft przyjmuje go bez zmian w akcjach.

- Tresc kazdej strony jest BUDOWANA OD NOWA ze zrodel (parser + mapowanie linkow).
  Reczne edycje stron sprzed tego flow zostana nadpisane. Po nim edycja jest wolna.
- Strona mapy: osobny flow, krok 3.
- `category` musi istniec w wyborach kolumny `Category` w Site Pages.
- Flow jest idempotentny — mozna uruchamiac wielokrotnie.
- Czas: okolo 30 s na strone, czyli 30–40 min dla 60 stron.
