# Test — ktory format kanwy renderuje sie na NOWEJ stronie

Jednorazowy eksperyment. Tworzy strony testowe `Test sekcji A/B/C/D` i pokazuje,
ktory format `CanvasContent1` SharePoint faktycznie renderuje.

Po co: wszystkie dotychczasowe proby z wieloma sekcjami byly robione na stronie mapy,
ktora okazala sie uszkodzona — wiec nic nie rozstrzygnely. Ten test jest czysty:
kazdy wariant ladauje na swiezo utworzonej stronie, ta sama droga co 60 zmigrowanych stron.

| Wariant | Co sprawdza |
|---|---|
| A | dwie zwykle sekcje jedna pod druga |
| B | dwie sekcje ZWIJANE (odpowiednik cloaka z Confluence) |
| C | dwie kolumny obok siebie w jednej sekcji |
| D | kontrola — jedna kontrolka, format sprawdzony na produkcji (ma dzialac zawsze) |

---

## 1. Trigger — Manually trigger a flow

Dodaj pole wejsciowe: **Add an input → Text**, nazwa:
```
wariant
```

## 2. BudujTest — Excel Online → Run script

Script (lista):
```
testSekcje
```
wariant (dyn): token **wariant** z triggera

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
string(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"},"PageLayoutType":"Article","PromotedState":0}'),'Title',concat('Test sekcji ', triggerBody()?['text'])))
```
Jesli `triggerBody()?['text']` nie zwraca wartosci, wstaw w to miejsce token **wariant**
z dynamic content.

## 4. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```
Headers: te same dwa co w 3.

Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',concat('Test sekcji ', triggerBody()?['text'])),'CanvasContent1',body('BudujTest')?['result']))
```

## 5. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Jak uruchomic

Run → wpisz `D` → Run. Potem to samo dla `A`, `B`, `C`.
Otworz cztery strony z Site Pages (Ctrl+F5) i zanotuj, ktore pokazuja tresc.

## Jak czytac wynik

| Co widzisz | Wniosek |
|---|---|
| D dziala, A/B/C puste | kanwa moze miec tylko JEDNA kontrolke — zostajemy przy obecnym parserze |
| D i A dzialaja, B puste | wiele sekcji OK, ale zwijanych nie da sie zapisac przez API |
| D, A i B dzialaja | **mozemy miec natywne zwijane sekcje** — cloaki i zakladki ida na sekcje zwijane |
| C dziala | mozliwe uklady dwukolumnowe (przydatne pozniej w mapie) |
| D puste | cos innego jest zepsute — zglos, bo to przeczy 60 dzialajacym stronom |

Po tescie strony `Test sekcji *` mozna usunac.
