# 5 — NowaStrona (wywolywany z aplikacji)

Tworzy strone dokumentacji w wybranym miejscu drzewa i zwraca jej adres.
Wywoluje go przycisk **Nowa strona** w zakladce Dokumentacja
(patrz [app/04-nowa-strona.md](../app/05-nowa-strona.md)).

Podmien `<WITRYNA>`. Nazwy akcji dokladnie jak w naglowkach.

---

## 1. Trigger — Power Apps (V2)

Dodaj cztery wejscia tekstowe przyciskiem **Add an input → Text**, w tej kolejnosci
i z dokladnie takimi nazwami:

```
tytul
```
```
rodzicId
```
```
serwis
```
```
kategoria
```

Kolejnosc ma znaczenie — aplikacja podaje wartosci pozycyjnie.

## 2. Slug — Data Operation → Compose

Nazwa pliku strony. Zamienia spacje na myslniki i usuwa znaki, ktorych
SharePoint nie przyjmuje w nazwie pliku.

Inputs (fx) — CALE pole, jedna linia:
```
concat(triggerBody()['text_2'], '-', replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(trim(triggerBody()['text']), ' ', '-'), '/', ''), '\', ''), ':', ''), '*', ''), '?', ''), '"', ''), '<', ''), '>', ''), '|', ''), '.aspx')
```

`text` to `tytul`, `text_2` to `rodzicId`… — **uwaga**, Power Automate numeruje
wejscia w kolejnosci dodania: `text` = tytul, `text_1` = rodzicId,
`text_2` = serwis, `text_3` = kategoria. Jesli podpowiedzi pokazuja inne nazwy,
wstaw tokeny z dynamic content zamiast wpisywac je recznie.

## 3. CreatePage — Send an HTTP request to SharePoint

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
string(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"},"PageLayoutType":"Article","PromotedState":0}'),'Title',triggerBody()['text']))
```

## 4. SaveDraft — Send an HTTP request to SharePoint

Nowa strona dostaje naglowek z tytulem i miejsce na tresc.

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```
Headers: te same dwa co w 3.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',triggerBody()['text']),'CanvasContent1',concat('[{"controlType":4,"id":"c5f0a545-0f0d-4f31-9e2e-000000000001","position":{"layoutIndex":1,"zoneIndex":1,"sectionIndex":1,"controlIndex":1,"sectionFactor":12},"addedFromPersistedData":true,"innerHTML":"<h1>', triggerBody()['text'], '</h1><hr><p>Tresc w przygotowaniu.</p>"}]')))
```

## 5. UstawMetadane — SharePoint → Update file properties

Library Name (Enter custom value):
```
Site Pages
```
Id (fx):
```
body('CreatePage')?['d']?['Id']
```
ParentPageId (fx):
```
int(triggerBody()['text_1'])
```
Service Value (Enter custom value, potem fx):
```
triggerBody()['text_2']
```
Category Value (Enter custom value, potem fx):
```
if(equals(triggerBody()['text_3'], ''), null, triggerBody()['text_3'])
```
DocStatus Value (lista):
```
Draft
```
ConfluencePageId (tekst):
```
0
```
**Pozostale pola PUSTE.** `TreePath`, `TreeSort` i `SortOrder` wyliczy krok 4
(OdswiezDrzewo) — tutaj maja zostac puste, nie zerowe.

## 6. RenamePage — Send an HTTP request to SharePoint

Method: POST

Uri (fx) — podmien `<WITRYNA>` w DWOCH miejscach; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''<WITRYNA>/SitePages/', outputs('Slug'), ''',flags=1)')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 7. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 8. Odpowiedz — Respond to a PowerApp or flow

Dodaj dwa wyjscia:

**Text**, nazwa:
```
adres
```
wartosc (fx):
```
concat('<WITRYNA>/SitePages/', outputs('Slug'))
```

**Text**, nazwa:
```
idStrony
```
wartosc (fx):
```
string(body('CreatePage')?['d']?['Id'])
```

---

## Po utworzeniu strony

Nowa strona nie ma jeszcze `TreePath`, wiec w drzewie aplikacji pojawi sie
dopiero po przeliczeniu. Aplikacja wywoluje zaraz potem
[04-OdswiezDrzewo](04-OdswiezDrzewo.md), ktory uzupelnia sciezke, kolejnosc
i przebudowuje mape.

Zeby dalo sie go wywolac z aplikacji, zamien w nim trigger
**Manually trigger a flow** na **Power Apps (V2)** bez zadnych wejsc.
Recznie uruchamiasz go wtedy przez **Test → Manually → Run**.

## Sprawdzenie

1. w aplikacji wypelnij formularz i kliknij **Utworz strone**
2. w Site Pages pojawia sie strona o nazwie `<serwis>-<tytul>.aspx`
3. w jej szczegolach: `ParentPageId` wskazuje wybranego rodzica, `Service`
   ustawiony, `ConfluencePageId` = 0
4. po przeliczeniu drzewa strona jest w aplikacji w wybranym miejscu

## Znane ograniczenia

- Cudzyslow w tytule rozbije JSON w akcji 4. Jesli zespol wpisuje takie tytuly,
  dodaj przed akcja 3 Compose z `replace(triggerBody()['text'], '"', '')`
  i uzywaj jego wyniku zamiast surowego tytulu.
- Dwie strony o identycznym tytule w tym samym serwisie dostana te sama nazwe
  pliku, a `flags=1` nadpisze starsza. Przy duzym ruchu dopisz do sluga
  `formatDateTime(utcNow(), 'HHmm')`.
