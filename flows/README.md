# Flow-y — od eksportu HTML do dzialajacej dokumentacji

Komplet sciag do zbudowania w Power Automate. Kazda wartosc do wklejenia jest
w osobnym bloku: potrojne klikniecie zaznacza cala linie, Ctrl+C kopiuje.

## Zacznij tutaj

[PRZEWODNIK.md](PRZEWODNIK.md) — caly proces w jednym ciagu: migracja od zera,
kolejny serwis, utrzymanie, z czasami i kontrola po kazdym kroku. Pliki ponizej
to szczegolowe sciagi do poszczegolnych krokow.

Migracja konkretnego serwisu, z kontrolami po kazdym kroku i lista rzeczy,
ktore moglyby nadpisac juz zmigrowany serwis:
[CHECKLISTA-SWB.md](CHECKLISTA-SWB.md).

## Kolejnosc

| # | Plik | Kiedy | Czas |
|---|---|---|---|
| 0 | [00-przygotowanie.md](00-przygotowanie.md) | raz, przed wszystkim | 1–2 h |
| 1 | [01-MigratePages.md](01-MigratePages.md) | raz, tworzy strony | ~10 min biegu |
| 2 | [02-RemapLinks.md](02-RemapLinks.md) | po migracji, potem przy kazdej zmianie parsera | 30–40 min biegu |
| 3 | [03-BudujMape.md](03-BudujMape.md) | po kroku 2, gdy serwis jest jeden; przy wielu zastepuje go krok 4 | ~1 min |
| 4 | [04-OdswiezDrzewo.md](04-OdswiezDrzewo.md) | **strona mapy serwisu** — serwis i strone wybierasz przy starcie; tylko czyta | ~1 min |
| 4b | [04b-PrzeliczDrzewo.md](04b-PrzeliczDrzewo.md) | metadane drzewa dla stron zakladanych recznie | zalezy od liczby stron |
| 5 | [05-NowaStrona.md](05-NowaStrona.md) | wywolywany z aplikacji przy dodawaniu strony | kilka sekund |
| 6 | [06-KolejnySerwis.md](06-KolejnySerwis.md) | migracja drugiej i kazdej nastepnej przestrzeni z Confluence | jak kroki 1–2 |
| 7 | [07-RecznySerwis.md](07-RecznySerwis.md) | nowy serwis pisany recznie, bez eksportu HTML | zalezy od liczby stron |
| M | [RECZNA-STRONA.md](RECZNA-STRONA.md) | strona, ktorej krok 2 nie udzwignie — reczne odtworzenie tego, co generuje `parseTresc` | ~1 h na strone |
| S | [96-PokazKanwe.md](96-PokazKanwe.md) | sonda: zwraca `CanvasContent1` wskazanej strony; tylko czyta | ~1 min |
| ! | [97-NaprawMetadaneStron.md](97-NaprawMetadaneStron.md) | awaryjnie, gdy strony straca `ConfluencePageId` albo `ParentPageId` | ~3 min |
| ! | [98-ResetMigracji.md](98-ResetMigracji.md) | czyszczenie przed migracja od zera | 10 min |
| ! | [99-NaprawHierarchie.md](99-NaprawHierarchie.md) | awaryjnie, gdy hierarchia w mapie migracji zostanie nadpisana | ~5 min |

Kroki 1–3 to migracja jednorazowa. Krok 4 to jedyne, co trzeba uruchamiac recznie
pozniej; krok 5 odpala sie sam z aplikacji.

## Wartosci do podmiany

Te same we wszystkich sciagach. Wypelnij raz i trzymaj pod reka.

| Placeholder | Co wpisac | Przyklad |
|---|---|---|
| `<WITRYNA>` | sciezka witryny bez domeny i bez ukosnika na koncu | `/sites/nazwa` albo `/teams/Dzial/podwitryna` |
| `<EKSPORT>` | folder rozpakowanego eksportu w bibliotece plikow | `confluence-export/NAZWA` |
| `<MAPA>` | nazwa pliku strony-mapy z paska adresu | `Documentation-Map.aspx` |
| `<SERWIS>` | kod serwisu; w krokach 1, 2 i 4 podajesz go **w polu triggera**, nie w sciądze | `GMSC` |
| `<BIBLIOTEKA>` | biblioteka plikow, w ktorej lezy eksport | `Dashboard_Team` |

## Listy migracyjne

**Kazdy serwis ma wlasna liste robocza:** `DT_MigrationMap` dla pierwszego,
`DT_MigrationMap_SWB` dla kolejnego. Nazwe listy podajesz w polu
triggera, wiec jeden zbudowany flow obsluguje wszystkie serwisy.

## Migracja kolejnego serwisu

Ten sam komplet flow obsluguje kazda nastepna przestrzen Confluence.
Pelna procedura z przykladem: [06-KolejnySerwis.md](06-KolejnySerwis.md).

W skrocie: wiersz w `DT_Services`, nowy wybor w kolumnie `Service`, osobny
folder eksportu, wiersze w liscie migracyjnej z kodem serwisu, podmiana
`<EKSPORT>` i `<SERWIS>` w krokach 1 i 2, na koniec krok 4 zamiast 3.

## Co zostaje po migracji

| Rzecz | Potrzebna pozniej? |
|---|---|
| `SiteAssets/DocMedia/attachments/` | **tak, zawsze** — tu wskazuja obrazy w tresci stron |
| biblioteka Site Pages z kolumnami | **tak** — zrodlo prawdy dla drzewa i aplikacji |
| folder eksportu HTML | tak, dopoki chcesz moc przebudowac tresc krokiem 2 |
| `DT_MigrationMap` | do krokow 1–3; potem slad historyczny |
| `drzewo.txt` | ratunek przy uszkodzonej hierarchii (krok 99) |
| `attachments` wewnatrz eksportu | nie — kopia dziala juz w `DocMedia` |
| `index.html` | nie — zastepuje go `drzewo.txt` |

Szczegoly i uzasadnienie: [98-ResetMigracji.md](98-ResetMigracji.md), sekcja D.

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
