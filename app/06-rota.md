# 6 — Grafik z Excela do DT_Rota

Zamiast przepisywac grafik recznie, Office Script czyta skoroszyt `rota`
i zwraca gotowe wiersze, a flow wpisuje je do listy `DT_Rota`.

Podzial rol jest taki sam jak w migracji: **skrypt parsuje, flow zapisuje**.
Office Script nie ma dostepu do SharePointa, a Power Automate nie umie
sensownie czytac arkusza komorka po komorce.

---

## Najpierw: pokaz mi strukture pliku

Nie znam ukladu Twojego arkusza, a od niego zalezy caly parser. Zamiast
zgadywac, uruchom sonde — zwroci sam szkielet: nazwy arkuszy, naglowki,
kilka pierwszych wierszy ze skroconymi wartosciami i typami komorek.

1. Otworz skoroszyt `rota` w Excel Online
2. **Automate** → **New script** → wklej kod z
   [scripts/showRota.ts](../scripts/showRota.ts) → zapisz jako `showRota`
3. Ustaw sie na arkuszu z grafikiem i kliknij **Run**
4. Skopiuj wynik z panelu po prawej i wklej mi go w rozmowie

Wynik wyglada mniej wiecej tak:

```
== ARKUSZE: 3 ==
- Październik
- Listopad
- Ustawienia

== AKTYWNY ARKUSZ: Październik ==
zakres: A1:AH12
wierszy: 12, kolumn: 34
...
w1: [Str]Imię i nazwisko | [Dou]1 | [Dou]2 | [Dou]3 | ...
w2: [Str]Jan Kowalski    | [Str]8-16 | [Str]8-16 | [Str]U | ...
```

Na tej podstawie napisze `syncRota` dopasowany do Twojego ukladu.

Wartosci sa skracane do 22 znakow, wiec raport pokazuje **uklad**, nie pelna
tresc grafiku. Imiona beda widoczne — jesli to przeszkadza, podmien je
w kopii pliku przed uruchomieniem sondy.

---

## Co bedzie dalej (plan, do uzupelnienia po sondzie)

### Skrypt `syncRota`

Wejscie: arkusz grafiku plus parametry `miesiac` i `rok`.
Wyjscie: JSON z lista wierszy w formacie listy `DT_Rota`:

```
[
  {"title":"Jan Kowalski","email":"jan.kowalski@...","date":"2026-10-21",
   "startTime":"08:00","endTime":"16:00","shiftType":"Work"},
  ...
]
```

Skrypt bedzie musial poradzic sobie z:

- **ukladem kalendarzowym** (osoby w wierszach, dni w kolumnach) albo
  **lista** (jeden wiersz na zmiane) — zalezy, co pokaze sonda
- **skrotami zmian** w rodzaju `8-16`, `8:00-16:00`, `D`, `N`, `U`, `L4` —
  potrzebna bedzie tabela tlumaczen skrotow na godziny i `ShiftType`
- **adresami e-mail**: jesli nie ma ich w arkuszu, dopasujemy po imieniu
  i nazwisku do istniejacych wierszy `DT_Rota` albo do katalogu Microsoft 365

### Flow `SyncRota`

| # | Akcja | Rola |
|---|---|---|
| 1 | Recurrence | codziennie rano, np. 05:00 |
| 2 | Run script `syncRota` | zwraca JSON z wierszami |
| 3 | Parse JSON | zeby dalo sie iterowac po polach |
| 4 | Get items `DT_Rota` | istniejace wiersze z zakresu dat |
| 5 | Apply to each | po wierszach ze skryptu |
| 6 | Condition | wiersz juz jest → Update item, nie ma → Create item |

Dopisywanie zamiast czyszczenia listy jest wazne: `DT_Breaks` i widok obsady
odwoluja sie do dat, a kasowanie i wstawianie od nowa zmienialoby identyfikatory.

### Czego nie bedzie

Skrypt nie zmienia grafiku w Excelu — czyta go tylko. Zrodlem prawdy zostaje
plik `rota`, a lista SharePoint jest jego odwzorowaniem dla aplikacji.

---

## Zanim przyslesz sonde, sprawdz dwie rzeczy

1. **Czy plik `rota` jest na SharePoincie albo OneDrive** (nie na dysku lokalnym).
   Flow musi go widziec, zeby uruchamiac skrypt automatycznie.
2. **Czy uklad arkusza jest staly z miesiaca na miesiac.** Jesli kazdy miesiac
   ma inny format, parser bedzie kruchy i lepiej ustalic jeden szablon.
