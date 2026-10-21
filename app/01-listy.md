# 1 — Listy SharePoint pod dashboard

Zakladasz raz, w tej samej witrynie co dokumentacja. Wszystkie kolumny
**bez wartosci domyslnej**, chyba ze napisano inaczej.

Nazwy list i kolumn sa po angielsku — patrz [KONWENCJE.md](KONWENCJE.md).
Trzymaj sie ich dokladnie, bo formuly odwoluja sie do nich po nazwie.

Skrot: **New** → **List** → nazwa z naglowka → potem **Add column**.

---

## DT_Rota — grafik zmian

Docelowo zasilana ze skoroszytu `rota` skryptem (patrz
[06-rota.md](06-rota.md)). Na teraz wypelnij recznie kilkoma wierszami.

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | imie i nazwisko, np. `Jan Kowalski` |
| `Email` | Jeden wiersz tekstu | sluzbowy; po nim laczymy zdjecie z Teams |
| `ShiftDate` | Data (bez godziny) | dzien zmiany |
| `StartTime` | Jeden wiersz tekstu | `08:00` — tekst, nie czas |
| `EndTime` | Jeden wiersz tekstu | `16:00` |
| `ShiftType` | Wybor | `Work`, `Leave`, `Sick`, `Training` |

Godziny zapisuj **dwucyfrowo**: `08:00`, nie `8:00`. Porownania robimy
na tekscie, wiec `8:00` wypadnie w zlym miejscu.

Dane przykladowe — wpisz 4–6 wierszy z dzisiejsza data:

```
Jan Kowalski    | jan.kowalski@...  | dzis | 08:00 | 16:00 | Work
Anna Nowak      | anna.nowak@...    | dzis | 10:00 | 18:00 | Work
Piotr Wisniewski| piotr.w@...       | dzis | 06:00 | 14:00 | Work
Maria Lewandow. | maria.l@...       | dzis |       |       | Leave
```

W `Email` wpisz **prawdziwe adresy osob z zespolu** — inaczej nie zaciagna
sie zdjecia profilowe.

**Indeks:** ustawienia listy → Indexed columns → dodaj indeks na `ShiftDate`.

---

## DT_Breaks — przerwy

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | wpisujemy tu adres e-mail (pole wymagane, wykorzystujemy je) |
| `Person` | Osoba lub grupa | kto rezerwuje |
| `BreakDate` | Data (bez godziny) | |
| `StartTime` | Jeden wiersz tekstu | `12:00` |
| `EndTime` | Jeden wiersz tekstu | `13:00` |

Przerwa trwa godzine. Aplikacja daje trzy przyciski na typowe pory
(12:00, 13:00, 14:00) oraz pole **Other time**, gdzie mozna wpisac dowolna
godzine rozpoczecia — koniec liczy sie sam.

**Indeks:** dodaj indeks na `BreakDate`.

---

## DT_DailyChecks — Daily Checks na tydzien

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | adres e-mail osoby |
| `Person` | Osoba lub grupa | |
| `WeekStart` | Data (bez godziny) | **sobota** rozpoczynajaca tydzien |
| `Starts` | Tak/Nie | |
| `Throughout` | Tak/Nie | |
| `End` | Tak/Nie | |

Jeden wiersz na osobe na tydzien. Tydzien liczy sie od soboty, wiec w sobote
rano nikt nie ma jeszcze wiersza i wszystkie przelaczniki sa puste — na tym
polega cotygodniowy reset. Stare wiersze zostaja jako historia.

**Indeks:** dodaj indeks na `WeekStart`.

---

## DT_ManagerMessages — komunikat od managera

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | krotki naglowek |
| `Body` | Wiele wierszy tekstu | **wlacz tekst sformatowany** (Rich text) |
| `IsImportant` | Tak/Nie | wyroznia komunikat kolorem |
| `ActiveUntil` | Data (bez godziny) | po tej dacie znika z ekranu |

Aplikacja pokazuje **najnowszy** komunikat, ktorego `ActiveUntil` jeszcze
nie minal.

**Uprawnienia:** lista → Settings → Permissions for this list → Stop inheriting
permissions → `Read` dla zespolu, `Contribute` tylko dla grupy managerow.
To jedyne miejsce, ktore naprawde ogranicza zapis; ukrycie przycisku
w aplikacji jest tylko kosmetyka.

---

## DT_Services — katalog serwisow

Z tej listy powstaja zakladki dokumentacji **i** wybor serwisu przy migracji.

| Kolumna | Typ | Uwagi |
|---|---|---|
| `Title` | domyslna | nazwa na zakladce, np. `GMSC` |
| `Code` | Jeden wiersz tekstu | krotki kod, trafia do kolumny `Service` stron i w prefiks nazwy pliku |
| `SortOrder` | Liczba | 10, 20, 30 — kolejnosc zakladek |
| `IsActive` | Tak/Nie | odznaczony = zakladka znika |

`Code` powinien byc krotki i bez spacji — wchodzi w nazwy plikow stron,
np. `GMSC-Known-Errors.aspx`.

Na start jeden wiersz: biezacy serwis, `SortOrder` 10, `IsActive` zaznaczone.

---

## Kolumny w bibliotece Site Pages

Zakladasz je przy migracji (patrz [flows/00-przygotowanie.md](../flows/00-przygotowanie.md)),
ale aplikacja z nich korzysta, wiec dla porzadku komplet:

| Kolumna | Typ | Rola |
|---|---|---|
| `ConfluencePageId` | Liczba | id strony zrodlowej; 0 = nie z migracji |
| `ParentPageId` | Liczba | id strony nadrzednej — na tym stoi drzewo |
| `SortOrder` | Liczba | kolejnosc wsrod rodzenstwa |
| `TreePath` | Jeden wiersz tekstu | sciezka id, np. `/8/9/11/12/` |
| `TreeSort` | Jeden wiersz tekstu | klucz sortowania drzewa |
| `Category` | Wybor | galaz najwyzszego poziomu |
| `DocStatus` | Wybor | `Draft`, `Published`, `Archived` |
| `Service` | Wybor | kod serwisu; wartosci takie same jak `Code` w `DT_Services` |

Kolumna `Service` jest **obowiazkowa** od momentu, gdy planujesz migracje
drugiego serwisu. Bez niej strony z roznych przestrzeni zlewaja sie w jedno
drzewo.

---

## Kontrola przed krokiem 2

- `DT_Rota` ma kilka wierszy z dzisiejsza data i prawdziwymi adresami e-mail
- `DT_ManagerMessages` ma jeden przykladowy komunikat z `ActiveUntil` w przyszlosci
- `DT_Services` ma wiersz biezacego serwisu z wypelnionym `Code`
- strony w Site Pages maja wypelniona kolumne `Service`
