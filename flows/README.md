# Flow-y — od eksportu HTML do dzialajacej dokumentacji

Komplet sciag do zbudowania w Power Automate. Kazda wartosc do wklejenia jest
w osobnym bloku: potrojne klikniecie zaznacza cala linie, Ctrl+C kopiuje.

## Kolejnosc

| # | Plik | Kiedy | Czas |
|---|---|---|---|
| 0 | [00-przygotowanie.md](00-przygotowanie.md) | raz, przed wszystkim | 1–2 h |
| 1 | [01-MigratePages.md](01-MigratePages.md) | raz, tworzy strony | ~10 min biegu |
| 2 | [02-RemapLinks.md](02-RemapLinks.md) | po migracji, potem przy kazdej zmianie parsera | 30–40 min biegu |
| 3 | [03-BudujMape.md](03-BudujMape.md) | po kroku 2, gdy serwis jest jeden; przy wielu zastepuje go krok 4 | ~1 min |
| 4 | [04-OdswiezDrzewo.md](04-OdswiezDrzewo.md) | **utrzymanie** — po kazdej nowej/usunietej/przeniesionej stronie | ~2 min |
| 5 | [05-NowaStrona.md](05-NowaStrona.md) | wywolywany z aplikacji przy dodawaniu strony | kilka sekund |
| ! | [99-NaprawHierarchie.md](99-NaprawHierarchie.md) | awaryjnie, gdy hierarchia w mapie migracji zostanie nadpisana | ~5 min |

Kroki 1–3 to migracja jednorazowa. Krok 4 to jedyne, co trzeba uruchamiac recznie
pozniej; krok 5 odpala sie sam z aplikacji.

## Trzy wartosci do podmiany

Te same we wszystkich sciagach. Wypelnij raz i trzymaj pod reka.

| Placeholder | Co wpisac | Przyklad |
|---|---|---|
| `<WITRYNA>` | sciezka witryny bez domeny i bez ukosnika na koncu | `/sites/nazwa` albo `/teams/Dzial/podwitryna` |
| `<EKSPORT>` | folder rozpakowanego eksportu w bibliotece plikow | `confluence-export/NAZWA` |
| `<MAPA>` | nazwa pliku strony-mapy z paska adresu | `Documentation-Map.aspx` |
| `<SERWIS>` | kod serwisu z listy `DT_Services`, kolumna `Code` | `GMSC` |

## Migracja kolejnego serwisu

Ten sam komplet flow obsluguje kazda nastepna przestrzen Confluence.
Przy drugim i kolejnym serwisie:

1. dopisz wiersz w `DT_Services` (nazwa + krotki `Code`, np. `SRV2`)
2. dodaj ten kod do wyborow kolumny `Service` w bibliotece Site Pages
3. rozpakuj nowy eksport do osobnego folderu
4. zaladuj `DT_MigrationMap` z kroku 0, wypelniajac kolumne `Service` nowym kodem
5. w krokach 1 i 2 podmien `<EKSPORT>` i `<SERWIS>`, reszta zostaje bez zmian
6. uruchom kroki 1, 2 i 4

Nic sie nie nadpisze, bo:

- nazwy plikow stron zaczynaja sie od kodu serwisu, wiec dwie strony `Home Page`
  z roznych przestrzeni to dwa rozne pliki
- krok 1 bierze tylko wiersze z `MigrationStatus eq 'Pending'` **i** biezacym serwisem
- krok 2 liczy drzewo i linki osobno dla kazdego serwisu
- krok 4 grupuje mape po serwisach: kazdy dostaje wlasny korzen i wlasne sekcje

## Zasady wspolne

- **Nazwy akcji musza byc dokladnie takie jak w naglowkach sciagi.** Wyrazenia
  odwoluja sie do nazw; inna nazwa = flow nie zadziala. Zmiana nazwy: trzy kropki
  na akcji → Rename.
- Oznaczenia pol: **fx** = panel wyrazen (po wstawieniu w polu ma byc kolorowy zeton,
  nie goly tekst) · **tekst** = wpisz normalnie · **dyn** = dynamic content ·
  **lista** = wybierz z rozwijanej.
- **W akcjach Update item i Update file properties pola, ktorych nie chcesz zmieniac,
  musza byc PUSTE.** Wpisane `0` nadpisuje wartosc przy kazdym biegu. Tak stracilismy
  cala hierarchie 2026-09-18.
- Skrypty uruchamiane sa przez **Run script** z OneDrive (wariant „from SharePoint
  library" potrafi zwracac blad formatu). Kod skryptow: katalog `scripts/` w tym repo.
- Flow-y sa idempotentne — mozna je uruchamiac wielokrotnie.

## Co jest czym

Migracja opiera sie na dwoch zrodlach prawdy, w dwoch roznych fazach:

- **`DT_MigrationMap`** — lista robocza migracji: ktory plik HTML odpowiada ktorej
  stronie. Potrzebna w krokach 1–3. Po migracji zostaje jako slad historyczny.
- **biblioteka `Site Pages`** — zrodlo prawdy po migracji. Kolumny `ParentPageId`,
  `TreePath`, `TreeSort`, `SortOrder`, `Category` opisuja drzewo. Krok 4 czyta
  wlasnie stad, dzieki czemu obejmuje rowniez strony zalozone recznie.
