# 96 — PokazKanwe (sonda)

Zwraca `CanvasContent1` wskazanej strony, czyli surowy JSON kanwy: liste
kontrolek, ich typy, sekcje zwijane i dane web partow.

Dwie akcje, tylko czyta. Nic nie zapisuje i nie da sie nim niczego zepsuc.

**Kiedy przydatny**

- chcesz zobaczyc, **jak SharePoint sam buduje** konstrukcje, ktorej parser nie
  potrafi odtworzyc — zakladasz strone recznie w edytorze, wstawiasz ten element
  i odczytujesz, co powstalo
- strona wyglada inaczej niz powinna i chcesz sprawdzic, co faktycznie siedzi
  w kanwie, zanim zaczniesz zmieniac `parseTresc`
- strona jest pusta albo nie otwiera sie w edytorze — sonda pokaze, czy kanwa
  jest ucieta, czy nie ma jej wcale

Podmien tylko `<WITRYNA>` w adresie witryny akcji. Strone wskazujesz przy
uruchomieniu.

---

## 1. Trigger — Manually trigger a flow

Jedno wejscie tekstowe (**Add an input → Text**):

```
idStrony
```

Wpisujesz **Id elementu z biblioteki Site Pages**, nie nazwe pliku. Zobaczysz je
po dodaniu kolumny `ID` do widoku biblioteki.

---

## 2. GetKanwa — Send an HTTP request to SharePoint

Method: GET

Uri (fx):
```
concat('_api/web/lists/getbytitle(''Site Pages'')/items(', triggerBody()?['text'], ')?$select=Id,Title,FileLeafRef,CanvasContent1')
```

Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

### Wariant po nazwie pliku

Jesli wygodniej Ci podac nazwe pliku niz Id, uzyj tego adresu — ale nazwa musi
byc **dokladna**, razem z przedrostkiem serwisu i rozszerzeniem `.aspx`:

```
concat('_api/web/lists/getbytitle(''Site Pages'')/items?$select=Id,Title,FileLeafRef,CanvasContent1&$filter=FileLeafRef eq ''', triggerBody()?['text'], '''')
```

Wariant po Id jest pewniejszy: nazwy stron z eksportu zawieraja kropki
i podkreslenia, a kazda literowka daje pusty wynik bez bledu.

---

## Jak czytac wynik

Historia biegu → akcja **GetKanwa** → outputs → pole `CanvasContent1`.

Przy dluzszych stronach Power Automate napisze, ze zawartosc jest za duza, zeby
ja wyswietlic, i zaproponuje pobranie. Pobierz i otworz w Notatniku — przy
okazji **rozmiar tego pliku to dokladnie tyle, ile wazy kanwa**, a to jedyny
sposob, zeby zmierzyc, jak blisko jesteś limitu.

`CanvasContent1` to tablica kontrolek. Na co patrzec:

| Co widzisz | Co to znaczy |
|---|---|
| `"controlType": 4` | blok tekstu; tresc siedzi w polu `innerHTML` |
| `"controlType": 3` | web part; rodzaj okresla `webPartId`, a dane `webPartData` |
| `"zoneGroupMetadata"` | kontrolka nalezy do **sekcji zwijanej**; `displayName` to jej nazwa, `isExpanded` mowi, czy rozwinieta |
| `"sectionFactor": 12` | pelna szerokosc |
| `"sectionFactor": 6` | polowa szerokosci, czyli jedna z dwoch kolumn |
| ten sam `zoneIndex`, inny `sectionIndex` | kontrolki stoja obok siebie w jednej sekcji |

Tak samo zbudowane jest wyjscie `parseTresc` — porownanie jednego z drugim od
razu pokazuje, czym rozni sie strona zrobiona recznie od zmigrowanej.

---

## Uwaga na dane

Wynik zawiera **cala tresc strony**: nazwy plikow, adresy zalacznikow, tekst
dokumentacji. Nie wrzucaj go do repozytorium ani nikomu w surowej postaci.

Jesli pokazujesz komus fragment kanwy, zeby omowic strukture, podmien tresc
`innerHTML`, nazwy plikow i identyfikatory na `XXX`. Struktura kontrolek
wystarcza do kazdej diagnozy, a zawartosc do niczego nie jest potrzebna.
