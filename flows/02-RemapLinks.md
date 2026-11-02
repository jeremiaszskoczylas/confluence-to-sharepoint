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

Cztery wejscia tekstowe, **w tej samej kolejnosci co w kroku 1**
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
```
zalaczniki
```

Znaczenie pol: [01-MigratePages](01-MigratePages.md), punkt 1. Wartosci przy
uruchomieniu musza byc **te same co w kroku 1** — inaczej tresc stron
wskaze na inny folder zalacznikow niz pierwszy bieg.

> **Jak odwolywac sie do pol triggera.** Power Automate nadaje im wlasne klucze
> (`text`, `text_1`, `text_2`, `text_3`) i nie zawsze sa to nazwy, ktore wpisales. Dlatego
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


> Wiersze ze statusem `Manual` zostaja w danych drzewa (mapowanie linkow, ramka
> podstron u rodzica, mapa), ale **nie wchodza do petli** — ich tresci krok 2 nie
> nadpisuje. Szczegoly: [00-przygotowanie](00-przygotowanie.md), sekcja B,
> „Strony utrzymywane recznie".

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

> `<BIBLIOTEKA>` to sama nazwa biblioteki, bez folderu eksportu — ten idzie
> w polu `eksport`. Szczegoly: [01-MigratePages](01-MigratePages.md), punkt 4.
Folder eksportu bierze sie z pola `eksport` w triggerze.

---

## 7. ParsujTresc — Excel Online → Run script

Script (lista):
```
parseTresc
```
html (dyn): File Content z GetHtml

base — **token `zalaczniki`** z dynamic content. Awaryjnie (fx):
```
triggerBody()?['text_3']
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

## 9. UstawMetadane — Send an HTTP request to SharePoint

> **Dlaczego nie „Update file properties".** Tamta akcja wysyla komplet kolumn
> z formularza. Pole zostawione puste bywa zapisane jako **zero** w kolumnie
> liczbowej i jako **pusta wartosc** w tekstowej — a ta akcja nie wymienia
> `ConfluencePageId` ani `Service`. Efekt: po biegu wszystkie strony mialy
> `ConfluencePageId` rowne zero i **pusta kolumne `Service`**, przez co krok 4
> nie znajdowal zadnej strony serwisu. Tak bylo przy migracji GMSC.
> `ValidateUpdateListItem` zmienia **wylacznie** pola wymienione w tresci zadania.

Method: POST

Uri (fx):
```
concat('_api/web/lists/getbytitle(''Site Pages'')/items(', items('Apply_to_each')?['pageId'], ')/validateUpdateListItem')
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
Body (fx) — CALE pole, jedna linia:
```
concat('{"formValues":[{"FieldName":"ParentPageId","FieldValue":"', items('Apply_to_each')?['parentPageId'], '"},{"FieldName":"SortOrder","FieldValue":"', items('Apply_to_each')?['sortOrder'], '"},{"FieldName":"TreePath","FieldValue":"', items('Apply_to_each')?['treePath'], '"},{"FieldName":"TreeSort","FieldValue":"', items('Apply_to_each')?['treeSort'], '"},{"FieldName":"Category","FieldValue":"', items('Apply_to_each')?['category'], '"},{"FieldName":"DocStatus","FieldValue":"Published"}],"bNewDocumentUpdate":true}')
```

Zapisywane jest **szesc kolumn**. `ConfluencePageId` i `Service`, ustawione
w kroku 1, pozostaja nietkniete — i o to tu chodzi.

`Category` puste czysci kolumne, nie wywoluje bledu. Pusta zostaje korzeniowi
serwisu, ktory nie nalezy do zadnej galezi.

`bNewDocumentUpdate` ustawione na `true` zapisuje bez tworzenia nowej wersji
strony.

> Gdyby ktorys tytul galezi zawieral znak cudzyslowu, rozbilby tresc zadania.
> W nazwach galezi Confluence sie to nie zdarza, ale jesli akcja nagle zwroci
> `400 Bad Request`, sprawdz wlasnie to.

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
- `Category` w Site Pages jest kolumna **tekstowa**, wiec przyjmuje kazdy tytul galezi.
- Flow jest idempotentny — mozna uruchamiac wielokrotnie.
- Czas: okolo 30 s na strone, czyli 30–40 min dla 60 stron.
