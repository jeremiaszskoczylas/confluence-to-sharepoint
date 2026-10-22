# 2 — RemapLinks

Przebudowuje tresc WSZYSTKICH zmigrowanych stron: podmienia linki wewnetrzne na
adresy w SharePoincie, dokłada sciezke nadrzedna i blok podstron, wypelnia metadane
drzewa (`ParentPageId`, `TreePath`, `TreeSort`, `SortOrder`, `Category`).

Uruchamiasz po kroku 1 oraz za kazdym razem, gdy zmieni sie `parseTresc`.
Podmien tylko `<WITRYNA>` i `<BIBLIOTEKA>` (patrz [README.md](README.md)).
Liste, serwis i folder eksportu podajesz przy uruchomieniu.

Flow przetwarza **jeden serwis na raz**. Drzewo, mapowanie linkow i sciezki
liczone sa tylko z jego stron, wiec linki nie przeciekaja miedzy serwisami,
a strona glowna jednej przestrzeni nie staje sie rodzicem drugiej.
Nazwy akcji dokladnie jak w naglowkach.

---
## 1. Trigger — Manually trigger a flow

Trzy wejscia tekstowe, **w tej samej kolejnosci co w kroku 1**
(**Add an input → Text**):

```
lista
```
```
serwis
```
```
eksport
```

> **Jak odwolywac sie do pol triggera.** Power Automate nadaje im wlasne klucze
> (`text`, `text_1`, `text_2`) i nie zawsze sa to nazwy, ktore wpisales. Dlatego
> **wszedzie ponizej wstawiaj tokeny z dynamic content**, zamiast przepisywac
> wyrazenia recznie. Podane wyrazenia to wariant awaryjny.

> Zeby zobaczyc prawdziwe klucze: uruchom flow raz, w historii biegu kliknij
> trigger i **Show raw outputs**.


---

## 2. GetAll — SharePoint → Get items

List Name — **Enter custom value**, potem token **lista** z dynamic content.
Awaryjnie (fx):
```
triggerBody()?['text']
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
serwis — token **serwis** z dynamic content. Awaryjnie (fx):
```
triggerBody()?['text_1']
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
concat('/<BIBLIOTEKA>/', triggerBody()?['text_2'], '/', items('Apply_to_each')?['file'])
```
Folder eksportu bierze sie z pola `eksport` w triggerze.

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
**Pozostale pola PUSTE.**

> **Uwaga.** Akcja `Update file properties` wysyla komplet kolumn z formularza,
> a puste pole liczbowe bywa zapisane jako **zero**. Jesli po biegu zobaczysz
> `ConfluencePageId` albo `ParentPageId` rowne zero tam, gdzie mialy byc liczby,
> odtworz je flow [97-NaprawMetadaneStron](97-NaprawMetadaneStron.md)
> i rozwaz przejscie na `ValidateUpdateListItem`, jak w kroku 4.

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

List Name — **Enter custom value**, token **lista** (ten sam co w kroku 2).
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
