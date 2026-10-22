# Dashboard zespolu — Power Apps

Aplikacja Canvas, uklad szeroki (16:9), otwierana linkiem w przegladarce.
Wszystko na standardowych konektorach: SharePoint, Office 365 Users, Office 365 Outlook.

## Zanim zaczniesz

Aplikacja czyta dane, ktore musza juz istniec. Trzy warunki:

1. **Listy SharePoint zalozone** — krok 1 tego katalogu. Bez nich nie ma
   czego podlaczyc.
2. **Strony dokumentacji maja wypelniona kolumne `Service`.** Drzewo bierze
   wylacznie strony z przypisanym serwisem; reszta biblioteki to strony witryny.
3. **Flow [04-OdswiezDrzewo](../flows/04-OdswiezDrzewo.md) uruchomiony chociaz raz.**
   Migracja zapisala `TreePath`, ale krok 4 przelicza go na identyfikatory
   biblioteki — tych samych uzywa drzewo w aplikacji. Bez tego ekran dokumentacji
   pokaze same korzenie, a strzalki rozwijania nie beda reagowac.

Ekran glowny (krok 3) nie zalezy od zadnego z punktow 2 i 3 — mozesz go zbudowac
od razu po zalozeniu list.

## Kolejnosc budowania

| # | Plik | Co powstaje | Czas |
|---|---|---|---|
| 0 | [00-powerapps-podstawy.md](00-powerapps-podstawy.md) | **przeczytaj najpierw** — Power Apps dla osoby z Power Automate | 15 min czytania |
| 1 | [01-listy.md](01-listy.md) | listy SharePoint i kolumna `Service` | 40 min |
| 2 | [02-szkielet.md](02-szkielet.md) | aplikacja, nawigacja, kolory, zmienne | 45 min |
| 3 | [03-home.md](03-home.md) | ekran glowny: obsada z raportami, przerwy, komunikat | 2–3 h |
| 4 | [04-dokumentacja.md](04-dokumentacja.md) | drzewo dokumentacji z zakladkami serwisow | 1–2 h |
| 5 | [05-nowa-strona.md](05-nowa-strona.md) | dodawanie strony w wybranym miejscu drzewa | 1 h |
| 6 | [06-rota.md](06-rota.md) | grafik z Excela do listy `DT_Rota` | zalezy od ukladu pliku |

Konwencje nazewnicze: [KONWENCJE.md](KONWENCJE.md). Cala aplikacja jest po angielsku,
instrukcje po polsku.

Gierki i role dokladamy pozniej — szkielet jest na nie przygotowany.

## Wiele serwisow

Aplikacja obsluguje je od poczatku, bez przerabiania. Zakladki na ekranie
dokumentacji powstaja z listy `DT_Services`, a drzewo, wyszukiwarka i okno
nowej strony filtruja po kolumnie `Service`. Dodanie serwisu to wiersz na liscie
i wybor w kolumnie — w aplikacji nie zmieniasz ani jednej formuly.

## Formuly osobno

Caly kod formul lezy w [formuly/](formuly/), po jednym pliku na obszar aplikacji,
w formacie `### nazwaKontrolki.Wlasciwosc` + blok do skopiowania. Otwierasz plik
przyciskiem **Raw**, szukasz naglowka (Ctrl+F), kopiujesz. Instrukcje mowia, jaka
kontrolke zalozyc i gdzie ja postawic; tresc formuly bierzesz z pliku obok.

## Kolory

Szarosci i biel, czerwien jako jedyny akcent.

| Rola | Wartosc | Gdzie |
|---|---|---|
| tlo aplikacji | `244, 244, 245` | wszystkie ekrany |
| karty | `255, 255, 255` | panele tresci |
| pasek nawigacji | `35, 35, 38` | lewa kolumna |
| akcent | `200, 16, 46` | przyciski glowne, aktywna zakladka, stan „na przerwie" |
| akcent ciemny | `142, 11, 34` | najechanie na przycisk |
| akcent tlo | `251, 233, 236` | plakietki, zaznaczony wiersz |
| tekst | `28, 28, 30` | naglowki i tresc |
| tekst drugorzedny | `104, 104, 110` | opisy, metadane |

Statusy rozroznia nie tylko kolor, ale i tresc etykiety, wiec czytelne sa
takze przy slabym rozroznianiu barw.

## Ekrany

```
scr_Home          komunikat managera | obsada dnia z raportami | przerwa + raporty
scr_Docs          zakladki serwisow + drzewo + wyszukiwarka
scr_Games        pusty placeholder (pozniej)
```

Makiety wygladu powstaly jako osobny canvas „Dashboard zespolu — makiety".
Link jest w rozmowie; nie trafia do repo, bo jest prywatny.

Nawigacja: pionowy pasek po lewej, ten sam na kazdym ekranie.

## Zrodla danych

| Zrodlo | Rola |
|---|---|
| `DT_Rota` | kto i w jakich godzinach pracuje danego dnia (z Excela, krok 6) |
| `DT_Breaks` | przerwy godzinne, trzy typowe pory lub wlasna godzina |
| `DT_DailyChecks` | Daily Checks na tydzien (Starts / Throughout / End), reset w sobote |
| `DT_ManagerMessages` | komunikaty od managera |
| `DT_Services` | katalog serwisow — z niego powstaja zakladki dokumentacji |
| `Site Pages` | strony dokumentacji; drzewo z kolumn `ParentPageId`, `TreePath`, `SortOrder` |
| Office 365 Users | zdjecia profilowe i dane zalogowanej osoby |

## Czego nie da sie zrobic standardowymi konektorami

**Statusy obecnosci z Teams** (zielona kropka, „zajety", „z dala") wymagaja wlasnego
konektora do Microsoft Graph, a wlasny konektor jest premium. W zamian ekran glowny
pokazuje zdjecie profilowe plus status wyliczony z `DT_Rota` i `DT_Breaks`:
**w pracy**, **na przerwie**, **po godzinach**, **wolne**.

## Jak odswieza sie drzewo dokumentacji

Aplikacja czyta biblioteke Site Pages na zywo, wiec zmiana tytulu czy nowa strona
widac po `Refresh('Site Pages')` — bez zadnego flow.

Flow [04-OdswiezDrzewo](../flows/04-OdswiezDrzewo.md) jest potrzebny tylko po to, by
przeliczyc `TreePath` i `SortOrder` (kolejnosc i wciecia w drzewie) oraz przebudowac
strone-mape w SharePoincie. Po dodaniu strony: ustaw `ParentPageId`, uruchom flow,
w aplikacji kliknij odswiez.
