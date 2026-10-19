# Dashboard zespolu — Power Apps

Aplikacja Canvas, uklad szeroki (16:9), otwierana linkiem w przegladarce.
Wszystko na standardowych konektorach: SharePoint, Office 365 Users, Office 365 Outlook.

## Kolejnosc budowania

| # | Plik | Co powstaje | Czas |
|---|---|---|---|
| 0 | [00-listy.md](00-listy.md) | listy SharePoint i kolumna `Service` | 40 min |
| 1 | [01-szkielet.md](01-szkielet.md) | aplikacja, nawigacja, motyw, zmienne startowe | 45 min |
| 2 | [02-home.md](02-home.md) | ekran glowny: obsada, przerwy, raporty, komunikat | 2–3 h |
| 3 | [03-dokumentacja.md](03-dokumentacja.md) | drzewo dokumentacji z zakladkami serwisow | 1–2 h |

Gierki i role dokladamy pozniej — szkielet jest na nie przygotowany.

## Ekrany

```
scrHome          obsada dnia | moja przerwa | raporty tygodnia | komunikat managera
scrDocs          zakladki serwisow + drzewo + wyszukiwarka
scrGry           pusty placeholder (pozniej)
```

Nawigacja: pionowy pasek po lewej, ten sam na kazdym ekranie.

## Zrodla danych

| Zrodlo | Rola |
|---|---|
| `DT_Rota` | kto i w jakich godzinach pracuje danego dnia |
| `DT_Breaks` | zaplanowane przerwy godzinne |
| `DT_Reports` | deklaracje raportow na tydzien (starty / midy / endy) |
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
