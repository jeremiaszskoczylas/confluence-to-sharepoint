# 6 — Migracja kolejnego serwisu

Przyklad na serwisie **Switchboard**, przy zalozeniu, ze GMSC jest juz
zmigrowany. Uzywasz tych samych flow, zmieniasz tylko dwie wartosci
i dokladasz wiersze do listy migracyjnej.

Nic z GMSC nie zostanie ruszone. Dlaczego — w sekcji na koncu.

---

## A. Przygotowanie, raz na serwis

### 1. Wpis w katalogu serwisow

`DT_Services` → **New**:

| Kolumna | Wartosc |
|---|---|
| `Title` | `Switchboard` |
| `Code` | `SWB` |
| `SortOrder` | `20` |
| `IsActive` | zaznaczone |

`Code` wchodzi w nazwy plikow, wiec ma byc krotki, bez spacji i polskich znakow.
`SWB` da strony w rodzaju `SWB-Call-Handling.aspx`.

### 2. Nowa wartosc w kolumnie Service

Site Pages → ustawienia kolumny `Service` → dopisz wybor `SWB`.

Bez tego krok 1 wywali sie przy zapisie metadanych: SharePoint odrzuca
wartosc spoza listy wyborow.

### 3. Wybory w kolumnie Category

Krok 2 zapisuje `Category` wyliczona z galezi najwyzszego poziomu nowego serwisu.
SharePoint odrzuca wartosc spoza listy wyborow, wiec bez tego **kazda iteracja**
kroku 2 skonczy sie bledem.

Nazwy galezi poznasz dopiero po zaladowaniu listy migracyjnej (punkt 5):
to wiersze `DT_MigrationMap` z `Depth` rownym 1, dla nowego serwisu.
Tytuly wpisujesz **bez numeru porzadkowego**: `01. Call Handling` w Confluence
daje wybor `Call Handling`.

Kolejnosc jest wiec taka: punkty 1, 2, 4, 5, potem wracasz tutaj i dopiero
uruchamiasz krok 2 migracji.

### 4. Pliki eksportu

1. Wyeksportuj przestrzen Switchboard z Confluence do HTML.
2. Rozpakuj do **osobnego folderu**, np. `confluence-export/SWB`.
   Nie mieszaj z folderem GMSC.
3. Folder `attachments` z nowego eksportu skopiuj do
   `SiteAssets/DocMedia/attachments/`. Podfoldery maja nazwy z identyfikatorow
   stron Confluence, wiec nie nadpisza tych z GMSC.

### 5. Wiersze w liscie migracyjnej

Uruchom flow z kroku 0, sekcja E, z dwiema zmianami:

- `GetIndex` → sciezka do **nowego** `index.html`:
  ```
  /<BIBLIOTEKA>/confluence-export/SWB/index.html
  ```
- akcja `Dodaj` → pole `Service`:
  ```
  SWB
  ```

Wiersze GMSC zostaja nietkniete, bo flow tylko **dopisuje** nowe.

W akcji `ZapiszDrzewo` zmien **File Name** na `drzewo-SWB.txt`, zeby nie nadpisac
pliku GMSC. Kazdy serwis ma wlasny plik hierarchii.

Kontrola: w `DT_MigrationMap` sa teraz wiersze obu serwisow, a nowe maja
`Service` = `SWB` i `MigrationStatus` = `Pending`.

---

## B. Migracja

### Krok 1 — MigratePages

W ściądze [01-MigratePages.md](01-MigratePages.md) podmien:

| Placeholder | Wartosc dla Switchboard |
|---|---|
| `<EKSPORT>` | `confluence-export/SWB` |
| `<SERWIS>` | `SWB` |

Reszta bez zmian. Uruchom najpierw z `Top Count` = `1`, obejrzyj strone,
potem `5000`.

Filtr w akcji `GetPending` brzmi teraz:
```
MigrationStatus eq 'Pending' and Service eq 'SWB'
```
Wiersze GMSC maja status `LinksRemapped`, wiec i tak by nie weszly — ale filtr
po serwisie zabezpiecza takze wtedy, gdy kiedys zresetujesz GMSC.

### Krok 2 — RemapLinks

W ściądze [02-RemapLinks.md](02-RemapLinks.md) podmien te same dwie wartosci:
`<EKSPORT>` na folder SWB, `<SERWIS>` na `SWB`.

Pole `serwis` w akcji `Planuj` jest tu kluczowe. Dzieki niemu skrypt liczy
drzewo **tylko** ze stron Switchboarda: wlasny korzen, wlasne kategorie,
mapowanie linkow w obrebie serwisu.

### Krok 3 — mapa

**Nie uruchamiaj [03-BudujMape.md](03-BudujMape.md).** Ten flow buduje mape
jednego serwisu i nadpisalby mape GMSC.

Zamiast tego uruchom [04-OdswiezDrzewo.md](04-OdswiezDrzewo.md). Czyta on
biblioteke Site Pages, grupuje strony po kolumnie `Service` i buduje jedna
mape z obydwoma serwisami, kazdy pod wlasnym naglowkiem.

Od tego momentu krok 3 nie jest ci juz potrzebny w ogole.

### Krok 4 — aplikacja

Nic nie trzeba zmieniac. Zakladka `Switchboard` pojawi sie sama, bo zakladki
powstaja z `DT_Services`, a drzewo filtruje po kolumnie `Service`.

Jesli aplikacja byla otwarta, kliknij ikone odswiezania na ekranie dokumentacji.

---

## C. Dlaczego GMSC nie ucierpi

| Mechanizm | Co chroni |
|---|---|
| filtr `Service eq 'SWB'` w kroku 1 | bierze wylacznie wiersze Switchboarda |
| prefiks w nazwie pliku | `GMSC-Home-Page.aspx` i `SWB-Home-Page.aspx` to dwa rozne pliki, nawet gdy obie przestrzenie maja strone „Home Page" |
| parametr `serwis` w kroku 2 | drzewo i linki liczone osobno; strona glowna GMSC nie stanie sie rodzicem strony Switchboarda |
| grupowanie po `Service` w kroku 4 | kazdy serwis dostaje wlasny korzen w mapie |
| osobne foldery eksportu | pliki zrodlowe sie nie mieszaja |
| podfoldery zalacznikow po id strony | obrazy obu przestrzeni wspolistnieja w `DocMedia` |

Jedyne wspolne miejsca to lista migracyjna, biblioteka Site Pages i folder
zalacznikow. We wszystkich trzech rozroznienie idzie po kolumnie `Service`
albo po identyfikatorze strony Confluence, ktory jest unikalny w calej
instancji Confluence.

---

## D. Lista kontrolna

Przed uruchomieniem kroku 1:

- [ ] `DT_Services` ma wiersz `Switchboard` z kodem `SWB`
- [ ] kolumna `Service` w Site Pages ma wybor `SWB`
- [ ] eksport rozpakowany do `confluence-export/SWB`
- [ ] zalaczniki skopiowane do `DocMedia/attachments/`
- [ ] `DT_MigrationMap` ma wiersze SWB ze statusem `Pending` i wypelnionym `Service`
- [ ] kolumna `Category` w Site Pages ma wybory dla galezi Switchboarda
- [ ] w ściądze kroku 1 podmienione `<EKSPORT>` i `<SERWIS>`
- [ ] w akcji `OdhaczWMapie` pola poza `Id`, `Title` i statusem sa puste

Po kroku 2:

- [ ] strony SWB maja `ParentPageId` wskazujace na strony SWB, nie GMSC
- [ ] `Category` stron SWB pochodzi z galezi Switchboarda
- [ ] odnosnik wewnetrzny na stronie SWB prowadzi do strony SWB
- [ ] zadna strona GMSC nie zmienila sie (sprawdz date modyfikacji kilku)
