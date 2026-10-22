# 97 — NaprawMetadaneStron (awaryjny)

Odtwarza na stronach w Site Pages kolumny `ConfluencePageId`, `ParentPageId`
i `Service` na podstawie `DT_MigrationMap`. Nie rusza tresci stron.

**Kiedy uzyc:** gdy po jakims biegu strony maja `ConfluencePageId` rowne zero,
pusta hierarchie albo gdy licznik `sieroty` w kroku 4 nagle urosl.

Dziala, bo `DT_MigrationMap` trzyma komplet: ktora strona Confluence odpowiada
ktorej stronie SharePointa i kto jest czyim rodzicem. Dopoki ta lista jest cala,
metadane stron da sie odtworzyc w kazdej chwili.

Podmien `<WITRYNA>` i `<SERWIS>`.

---

## Dlaczego nie uzywamy tu Update file properties

Akcja **Update file properties** wysyla do SharePointa komplet kolumn z formularza.
Pole zostawione puste potrafi zostac zapisane jako zero w kolumnie liczbowej —
i wlasnie tak gina `ConfluencePageId` oraz `ParentPageId`.

Ten flow zapisuje przez **ValidateUpdateListItem**, ktory zmienia **wylacznie**
pola wymienione w tresci zadania. Czego nie wymienisz, tego nie dotknie.

---

## 1. Trigger — Manually trigger a flow

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
serwis (tekst):
```
<SERWIS>
```

## 4. Plan — Data Operation → Compose

Inputs (fx):
```
json(body('Planuj')?['result'])
```

## 5. Apply to each — Control

Select an output (fx):
```
outputs('Plan')?['pages']
```

## 6. PrzywrocMetadane — Send an HTTP request to SharePoint   (w petli)

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
concat('{"formValues":[{"FieldName":"ConfluencePageId","FieldValue":"', items('Apply_to_each')?['confId'], '"},{"FieldName":"ParentPageId","FieldValue":"', items('Apply_to_each')?['parentPageId'], '"},{"FieldName":"Service","FieldValue":"<SERWIS>"}],"bNewDocumentUpdate":true}')
```

`bNewDocumentUpdate` ustawione na `true` zapisuje bez tworzenia nowej wersji
strony i bez wymogu wypozyczenia.

---

## Po biegu

Sprawdz na kilku stronach w Site Pages:

- `ConfluencePageId` ma liczbe, nie zero
- `ParentPageId` wskazuje na Id strony nadrzednej
- `Service` wypelniony

Potem uruchom [04-OdswiezDrzewo](04-OdswiezDrzewo.md), zeby przeliczyl
`TreePath`, `TreeSort`, `SortOrder` i odbudowal mape. Licznik `sieroty`
powinien spasc do zera albo do liczby stron, ktore swiadomie nie maja rodzica.

## Czego ten flow nie odtworzy

- stron **spoza migracji** (zalozonych recznie) — nie ma ich w `DT_MigrationMap`.
  Ich `ParentPageId` ustawiasz recznie, wg [07-RecznySerwis](07-RecznySerwis.md)
- `Category` i `DocStatus` — wylicza je krok 4 albo ustawiasz recznie
- tresci stron — od tego jest [02-RemapLinks](02-RemapLinks.md)

## Jak nie dopuscic do tego ponownie

W **kazdej** akcji `Update item` i `Update file properties` pola, ktorych nie
zmieniasz, musza byc puste — ale przy kolumnach **liczbowych** nawet to bywa
za malo. Gdzie tylko zapisujesz pojedyncze kolumny do biblioteki, bezpieczniej
uzyc `ValidateUpdateListItem` tak jak tutaj.
