# 0 — Listy SharePoint pod dashboard

Zakladasz raz, w tej samej witrynie co dokumentacja. Wszystkie kolumny
**bez wartosci domyslnej**, chyba ze napisano inaczej.

Skrot: lista → **New** → **List** → nazwa z naglowka → potem **Add column**.

---

## DT_Rota — kto pracuje danego dnia

Docelowo zasilana z pliku `rota`. Na teraz wypelnisz recznie kilkoma wierszami,
zeby bylo co pokazac na ekranie.

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | imie i nazwisko, np. `Jan Kowalski` |
| `Email` | Jeden wiersz tekstu | sluzbowy, po nim laczymy zdjecie z Teams |
| `Data` | Data (bez godziny) | dzien zmiany |
| `OdGodz` | Jeden wiersz tekstu | `08:00` — tekst, nie czas; prostsze w porownaniach |
| `DoGodz` | Jeden wiersz tekstu | `16:00` |
| `Rodzaj` | Wybor | `Praca`, `Urlop`, `Chorobowe`, `Szkolenie` |

Dane przykladowe (wpisz 4–6 wierszy, w tym dzisiejsza date i rozne godziny):

```
Jan Kowalski   | jan.kowalski@...   | dzis | 08:00 | 16:00 | Praca
Anna Nowak     | anna.nowak@...     | dzis | 10:00 | 18:00 | Praca
Piotr Wisniew. | piotr.w@...        | dzis | 06:00 | 14:00 | Praca
Maria Lewand.  | maria.l@...        | dzis |       |       | Urlop
```

W kolumnie `Email` wpisz **prawdziwe adresy osob z zespolu** — inaczej nie zaciagna
sie zdjecia profilowe.

---

## DT_Breaks — przerwy

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | wpisujemy tu email osoby (pole wymagane, wykorzystujemy je) |
| `Osoba` | Osoba lub grupa | kto rezerwuje |
| `Data` | Data (bez godziny) | |
| `OdGodz` | Jeden wiersz tekstu | `12:00` |
| `DoGodz` | Jeden wiersz tekstu | `13:00` |

Przerwa trwa godzine, wiec `DoGodz` liczy aplikacja — nie wpisujesz recznie.

**Indeks:** ustawienia listy → Indexed columns → dodaj indeks na `Data`.
Bez tego przy kilkuset wierszach pojawi sie ostrzezenie o delegowaniu.

---

## DT_Reports — raporty na tydzien

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | email osoby |
| `Osoba` | Osoba lub grupa | |
| `TydzienOd` | Data (bez godziny) | poniedzialek danego tygodnia |
| `Starty` | Tak/Nie | |
| `Midy` | Tak/Nie | |
| `Endy` | Tak/Nie | |

Jeden wiersz na osobe na tydzien. Aplikacja go zaklada albo aktualizuje.

---

## DT_ManagerMessages — komunikat od managera

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | krotki naglowek, np. `Zmiana grafiku w piatek` |
| `Tresc` | Wiele wierszy tekstu | **wlacz tekst sformatowany** (Rich text) |
| `Wazne` | Tak/Nie | wyroznia komunikat kolorem |
| `AktywnyDo` | Data (bez godziny) | po tej dacie znika z ekranu |

Aplikacja pokazuje **najnowszy** komunikat, ktorego `AktywnyDo` jeszcze nie minal.

**Uprawnienia:** lista → Settings → Permissions for this list → Stop inheriting
permissions → zostaw `Read` dla zespolu, a `Contribute` nadaj tylko grupie managerow.
To jedyne miejsce, gdzie uprawnienia naprawde ograniczaja zapis; ukrycie przycisku
w aplikacji jest tylko kosmetyka.

---

## DT_Services — katalog serwisow

Z tej listy powstaja zakladki na ekranie dokumentacji.

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | nazwa widoczna na zakladce, np. `GMSC` |
| `Kod` | Jeden wiersz tekstu | wartosc zapisywana w kolumnie `Service` stron |
| `Kolejnosc` | Liczba | 10, 20, 30 — kolejnosc zakladek |
| `Aktywny` | Tak/Nie | odhaczony = zakladka znika |

Na start jeden wiersz: nazwa biezacego serwisu, `Kod` taki sam, `Kolejnosc` 10,
`Aktywny` zaznaczone.

---

## Kolumna Service w bibliotece Site Pages

Site Pages → Add column → **Wybor**, nazwa `Service`, jeden wybor na serwis
(te same wartosci co `Kod` w `DT_Services`).

Potem przypisz istniejace strony do biezacego serwisu hurtem:

1. Site Pages → widok **All Pages** → zaznacz wszystkie strony migrowane
2. prawy panel szczegolow → `Service` → wybierz wartosc → zapisz

Przy migracji kolejnej przestrzeni Confluence ustawisz te kolumne w kroku
[01-MigratePages](../flows/01-MigratePages.md) razem z pozostalymi metadanymi,
a nazwom plikow nadasz prefiks serwisu, zeby sie nie zderzyly
(np. `GMSC-Home-Page.aspx` i `SRV2-Home-Page.aspx`).

---

## Kontrola przed krokiem 1

- `DT_Rota` ma kilka wierszy z dzisiejsza data i prawdziwymi adresami e-mail
- `DT_ManagerMessages` ma jeden przykladowy komunikat z `AktywnyDo` w przyszlosci
- `DT_Services` ma wiersz biezacego serwisu
- strony w Site Pages maja wypelniona kolumne `Service`
