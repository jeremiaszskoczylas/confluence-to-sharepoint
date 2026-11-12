# 8 — WklejFragment

Wycina z pliku eksportu Confluence wskazany fragment strony, przerabia go tak samo jak
krok 2 i nadpisuje nim istniejaca strone SharePointa. Obrazki, zakladki, cloaki, ramki
i linki wewnetrzne wychodza tak jak na stronach zmigrowanych automatycznie.

**Kiedy przydatny**

- strona Confluence jest za duza, zeby zapisac ja w calosci, wiec dzielisz ja na kilka
  stron SharePointa: jeden fragment na jedna strone
- chcesz odtworzyc tylko czesc strony, bez recznego przepisywania

Flow nadpisuje **cala tresc** strony wskazanej w triggerze. Zadnej innej strony ani
listy nie zmienia. Mozesz go uruchamiac ile razy chcesz, kazdy bieg buduje tresc od nowa.

Strona docelowa musi juz istniec. Jej kolumn (`Service`, `ParentPageId`, `TreePath`
i pozostalych) flow nie rusza.

Podmien `<WITRYNA>`, `<BIBLIOTEKA>`, `<EKSPORT>`, `<LISTA>`, `<SERWIS>` i `<ZALACZNIKI>`,
z tymi samymi wartosciami co w krokach 1 i 2 tego serwisu.

---

## Jak wybrac poczatek i koniec

Otworz plik `.html` z eksportu w Notatniku. Znajdz miejsce, gdzie zaczyna sie fragment,
i skopiuj kawalek tekstu z tej linii. Najlepiej kawalek znacznika, na przyklad:

```
data-pane-title="Start"
```

Sprawdz `Ctrl+F`, czy ten kawalek wystepuje w pliku **tylko raz**. Jesli wystepuje
czesciej, dopisz kilka znakow obok. Tak samo wybierz koniec: pierwsze miejsce, ktorego
juz nie chcesz.

Fragment do samego konca strony konczysz znacznikiem stopki:

```
id="footer"
```

Fragment zaczyna sie od znacznika HTML, w ktorym stoi poczatek, i konczy tuz przed
znacznikiem, w ktorym stoi koniec. Kazdy bieg pokazuje w historii, co wycial, wiec
wybor latwo poprawic i puscic jeszcze raz.

> Jesli poczatkiem jest cala zakladka (`data-pane-title`), na stronie pojawi sie jedna
> sekcja zwijana z jej tytulem. Bez tej sekcji zacznij od pierwszego naglowka wewnatrz
> zakladki.

---

## 1. Trigger — Manually trigger a flow

Cztery wejscia tekstowe, **w tej kolejnosci**:

```
strona
```
```
plik
```
```
poczatek
```
```
koniec
```

- `strona` — nazwa pliku strony docelowej, np. `GMSC-Strona-docelowa.aspx`
- `plik` — nazwa pliku z folderu eksportu, np. `Strona-zrodlowa_123456.html`
- `poczatek`, `koniec` — znaczniki wybrane wyzej

Ponizej wstawiaj tokeny z dynamic content. Wyrazenia z `text`, `text_1`, `text_2`
i `text_3` to wariant awaryjny.

## 2. GetHtml — SharePoint → Get file content using path

File Path (fx):
```
concat('/<BIBLIOTEKA>/<EKSPORT>/', triggerBody()?['text_1'])
```

## 3. Wytnij — Excel Online → Run script

Script (lista):
```
wytnijFragment
```
html (dyn): File Content z GetHtml

poczatek — **token `poczatek`**. Awaryjnie (fx):
```
triggerBody()?['text_2']
```
koniec — **token `koniec`**. Awaryjnie (fx):
```
triggerBody()?['text_3']
```

## 4. GetAll — SharePoint → Get items

Lista migracyjna serwisu. Potrzebna do zamiany linkow wewnetrznych na adresy stron.

List Name (Enter custom value):
```
<LISTA>
```
Top Count (tekst):
```
5000
```
Filter Query: PUSTE

## 5. Planuj — Excel Online → Run script

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

## 6. Plan — Data Operation → Compose

Inputs (fx):
```
json(body('Planuj')?['result'])
```

## 7. GetStrona — Send an HTTP request to SharePoint

Method: GET

Uri (fx) — podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/SitePages/', triggerBody()?['text'], ''')/ListItemAllFields?$select=Id,Title')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

**404** znaczy, ze strony o tej nazwie nie ma.

## 8. ParsujTresc — Excel Online → Run script

Script (lista):
```
parseTresc
```
html (fx):
```
body('Wytnij')?['result']
```
base (tekst) — folder zalacznikow serwisu, z ukosnikiem na koncu:
```
<ZALACZNIKI>
```
tytul (fx):
```
body('GetStrona')?['d']?['Title']
```
linki (fx):
```
outputs('Plan')?['linki']
```
nag (tekst) — sciezka okruszkowa strony docelowej, jedna linia. Odnosniki do kolejnych
stron nadrzednych, od strony glownej serwisu, rozdzielone `&rsaquo;`:
```
<a href="<WITRYNA>/SitePages/<STRONA-GLOWNA>.aspx">Strona glowna</a> &rsaquo; <a href="<WITRYNA>/SitePages/<RODZIC>.aspx">Rodzic</a>
```
Adres kazdej strony skopiujesz z paska przegladarki, bez domeny. Bez sciezki (fx):
```
concat('','')
```
pod (fx) — ramka podstron, zwykle niepotrzebna:
```
concat('','')
```

## 9. StopGdyERR — Control → Condition

Bezpiecznik. Zatrzymuje flow, zanim cokolwiek zapisze na stronie.

Lewa strona (fx):
```
or(startsWith(body('Wytnij')?['result'], 'ERR'), startsWith(body('ParsujTresc')?['result'], 'ERR'), greater(length(body('ParsujTresc')?['result']), 80000))
```
is equal to: `true`

W galezi **If yes**: Control → **Terminate**, Status `Failed`, Message (fx):
```
if(startsWith(body('Wytnij')?['result'], 'ERR'), body('Wytnij')?['result'], concat('Kanwa ma ', string(length(body('ParsujTresc')?['result'])), ' znakow: ', substring(body('ParsujTresc')?['result'], 0, min(200, length(body('ParsujTresc')?['result'])))))
```
Galaz If no: pusta. Akcje 10–12 dodaj PONIZEJ warunku.

> **Dlaczego 80 000 znakow.** Strona z okolo 139 KB zrodla zapisala sie pusta,
> a mniejsze strony przechodzily. To nie jest znany limit SharePointa, tylko
> zapas. Pozniej okazalo sie, ze strone psul formularz `<form>` z eksportu, ktory
> `parseTresc` teraz wycina, wiec rozmiar mogl nie miec znaczenia. Bezpiecznik zostaje
> na wszelki wypadek. Gdy zadziala, podziel fragment na dwie strony. Mozesz tez podniesc
> te liczbe na wlasne ryzyko: strona zapisana pusta nie otwiera sie potem w edytorze.

## 10. Checkout — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetStrona')?['d']?['Id'], ')/checkoutpage')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 11. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetStrona')?['d']?['Id'], ')/savepageasdraft')
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
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',body('GetStrona')?['d']?['Title']),'CanvasContent1',body('ParsujTresc')?['result']))
```

## 12. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetStrona')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Sprawdzenie po biegu

1. Strona nie jest pusta i da sie na niej kliknac **Edit**.
2. Fragment zaczyna sie i konczy tam, gdzie chciales. Jesli nie, popraw znaczniki
   i uruchom flow jeszcze raz.
3. Obrazki sa na miejscach, a linki wewnetrzne prowadza do stron w SharePoincie.

Strona docelowa nie jest w liscie migracyjnej, wiec krok 2 jej nie nadpisze.
Zalaczniki do pobrania, np. maile `.msg`, maja w eksporcie nazwy bez rozszerzen,
tak jak na pozostalych zmigrowanych stronach.
