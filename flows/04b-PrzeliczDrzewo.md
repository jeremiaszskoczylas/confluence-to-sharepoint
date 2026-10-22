# 4b — PrzeliczDrzewo (metadane stron)

Wypelnia na stronach kolumny `TreePath`, `TreeSort`, `SortOrder` i `Category`
na podstawie `ParentPageId`. Nie buduje mapy i nie rusza tresci.

**Kiedy to potrzebne**

- zalozyles strony recznie ([07-RecznySerwis](07-RecznySerwis.md)) i trzeba
  im policzyc miejsce w drzewie
- przeniosles strone pod innego rodzica
- drzewo w aplikacji pokazuje same korzenie

**Kiedy NIE jest potrzebne**

Po migracji. Krok [02-RemapLinks](02-RemapLinks.md) zapisuje te kolumny sam,
przy okazji przebudowy tresci.

Podmien tylko `<WITRYNA>` — serwis podajesz przy uruchomieniu.

---

## Dlaczego osobny flow, a nie czesc kroku 4

Budowanie mapy to dziesiec akcji bez petli: szybkie i bezpieczne, bo tylko
czyta biblioteke. Zapis metadanych to petla po wszystkich stronach, wiec trwa
dluzej i **moze nadpisac dane**, jesli akcja zapisu jest zle dobrana.

Trzymamy to osobno, zeby odswiezenie mapy — rzecz robiona najczesciej — nigdy
nie dotykalo kolumn, ktore sa zrodlem prawdy.

---

## 1. Trigger — Manually trigger a flow

Jedno wejscie tekstowe (**Add an input → Text**):

```
serwis
```

Kod serwisu, np. `GMSC`. Metadane licza sie dla wszystkich serwisow,
to pole steruje tylko tym, co skrypt uzna za korzen przy liczeniu kategorii.

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
pomin (tekst) — zostaw PUSTE

serwisMapy — **token `serwis`** z dynamic content

## 4. Plan — Data Operation → Compose

Inputs (fx):
```
json(body('Planuj')?['result'])
```

## 5. StopGdyBlad — Control → Condition

Lewa strona (fx):
```
empty(coalesce(outputs('Plan')?['blad'], ''))
```
is equal to: `false`

W galezi **If yes**: Control → **Terminate**, Status `Failed`, Message (fx):
```
outputs('Plan')?['blad']
```
Galaz If no: pusta. Akcje 6–7 dodaj PONIZEJ warunku.

## 6. Apply to each — Control

Select an output (fx):
```
outputs('Plan')?['pages']
```

**Wlacz rownoleglosc:** trzy kropki na akcji → **Settings** →
**Concurrency Control** → wlacz, **Degree of parallelism** = `20`.
Bez tego petla po kilkudziesieciu stronach ciagnie sie minutami.

## 7. ZapiszMetadane — Send an HTTP request to SharePoint   (w petli)

> **Nie uzywaj akcji „Update file properties".** Tamta wysyla komplet kolumn
> z formularza, a pole zostawione puste bywa zapisane jako **zero** w kolumnie
> liczbowej. Tak gina `ConfluencePageId` i `ParentPageId`.
> `ValidateUpdateListItem` zmienia **wylacznie** pola wymienione w tresci zadania.

Method: POST

Uri (fx):
```
concat('_api/web/lists/getbytitle(''Site Pages'')/items(', items('Apply_to_each')?['id'], ')/validateUpdateListItem')
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
concat('{"formValues":[{"FieldName":"SortOrder","FieldValue":"', items('Apply_to_each')?['sortOrder'], '"},{"FieldName":"TreePath","FieldValue":"', items('Apply_to_each')?['treePath'], '"},{"FieldName":"TreeSort","FieldValue":"', items('Apply_to_each')?['treeSort'], '"},{"FieldName":"Category","FieldValue":"', items('Apply_to_each')?['category'], '"}],"bNewDocumentUpdate":true}')
```

Zapisywane sa **tylko cztery kolumny**. `ParentPageId`, `ConfluencePageId`,
`Service` i `DocStatus` pozostaja nietkniete.

`bNewDocumentUpdate` ustawione na `true` zapisuje bez tworzenia nowej wersji
strony i bez wymogu wypozyczenia.

---

## Sprawdzenie

Wez dowolna strone z Site Pages i sprawdz, czy jej `ParentPageId` wystepuje
w jej `TreePath`. Jesli tak, hierarchia jest policzona poprawnie.

Potem uruchom [04-OdswiezDrzewo](04-OdswiezDrzewo.md), zeby odbudowac mape.

## Jesli cos poszlo nie tak

Gdy po biegu strony maja `ConfluencePageId` albo `ParentPageId` rowne zero,
odtworz je flow [97-NaprawMetadaneStron](97-NaprawMetadaneStron.md)
z listy migracyjnej.
