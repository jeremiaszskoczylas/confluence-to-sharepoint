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

### 5. Wlasna lista migracyjna

Zaloz nowa liste `DT_MigrationMap_Switchboard` z kolumnami wg
[00-przygotowanie](00-przygotowanie.md), sekcja B. Najszybciej:
Site contents → **New** → **List** → **From existing list** → wskaz liste GMSC →
nazwa `DT_MigrationMap_Switchboard`. Kopiuje komplet kolumn razem z wyborami
`MigrationStatus`, a nie kopiuje wierszy — dokladnie o to chodzi.

(Starsza droga, **Save list as template**, bywa niedostepna: SharePoint Online
ukrywa ja, gdy w witrynie wylaczone sa skrypty niestandardowe.)

Zadne flow nie zaklada list — te jedna czynnosc robisz recznie raz na serwis.
Wypelni ja juz flow z punktu 6, razem z kolumna `Service`.

### 6. Wiersze w tej liscie

Uruchom flow z kroku 0, sekcja E, z dwiema zmianami:

- `GetIndex` → sciezka do **nowego** `index.html`:
  ```
  /<BIBLIOTEKA>/confluence-export/SWB/index.html
  ```
- akcja `Dodaj` → **lista**: `DT_MigrationMap_Switchboard`, pole `Service`:
  ```
  SWB
  ```

Wiersze GMSC leza w osobnej liscie, wiec nic im nie grozi.

W akcji `ZapiszDrzewo` zmien **File Name** na `drzewo-SWB.txt`, zeby nie nadpisac
pliku GMSC. Kazdy serwis ma wlasny plik hierarchii.

Kontrola: `DT_MigrationMap_Switchboard` ma komplet wierszy SWB ze statusem
`Pending`.

---

## B. Migracja

### Krok 1 — MigratePages

Uruchom [01-MigratePages](01-MigratePages.md) i wypelnij pola triggera:

| Placeholder | Wartosc dla Switchboard |
|---|---|
| `lista` | `DT_MigrationMap_Switchboard` |
| `serwis` | `SWB` |
| `eksport` | `confluence-export/SWB` |

**Zadnej akcji nie przepisujesz** — ten sam zbudowany flow obsluguje oba serwisy.
Najpierw `Top Count` = `1`, obejrzyj strone, potem `5000`.

Flow czyta wylacznie liste podana w polu `lista`, wiec wiersze GMSC sa poza
jego zasiegiem.

### Krok 2 — RemapLinks

Uruchom [02-RemapLinks](02-RemapLinks.md) z tymi samymi trzema wartosciami
co w kroku 1.

Pole `serwis` w akcji `Planuj` jest tu kluczowe. Dzieki niemu skrypt liczy
drzewo **tylko** ze stron Switchboarda: wlasny korzen, wlasne kategorie,
mapowanie linkow w obrebie serwisu.

### Krok 3 — mapa

**Nie uruchamiaj [03-BudujMape.md](03-BudujMape.md).** Ten flow buduje mape
jednego serwisu i nadpisalby mape GMSC.

Zamiast tego zaloz recznie strone mapy nowego serwisu (Site Pages → **New** →
**Page** → pusty szablon → tytul `Documentation Map Switchboard` → **Publish**;
tresci nie pisz) i uruchom [04-OdswiezDrzewo.md](04-OdswiezDrzewo.md) z polami:

```
serwis      = SWB
stronaMapy  = Documentation-Map-Switchboard.aspx
```

Kazdy serwis ma **wlasna** strone mapy. Flow wpisuje drzewo w te strone, ktora
wskazesz, i nie dotyka pozostalych — mapa GMSC zostaje nietknieta.

Od tego momentu krok 3 nie jest ci juz potrzebny w ogole.

### Krok 4 — aplikacja

Nic nie trzeba zmieniac. Zakladka `Switchboard` pojawi sie sama, bo zakladki
powstaja z `DT_Services`, a drzewo filtruje po kolumnie `Service`.

Jesli aplikacja byla otwarta, kliknij ikone odswiezania na ekranie dokumentacji.

---

## C. Dlaczego GMSC nie ucierpi

| Mechanizm | Co chroni |
|---|---|
| osobna lista migracyjna | krok 1 nie widzi wierszy innego serwisu |
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
- [ ] `DT_MigrationMap_Switchboard` ma wiersze SWB ze statusem `Pending`
- [ ] kolumna `Category` w Site Pages ma wybory dla galezi Switchboarda
- [ ] znasz trzy wartosci do pol triggera: lista, serwis, folder eksportu
- [ ] w akcji `OdhaczWMapie` pola poza `Id`, `Title` i statusem sa puste

Po kroku 2:

- [ ] strony SWB maja `ParentPageId` wskazujace na strony SWB, nie GMSC
- [ ] `Category` stron SWB pochodzi z galezi Switchboarda
- [ ] odnosnik wewnetrzny na stronie SWB prowadzi do strony SWB
- [ ] zadna strona GMSC nie zmienila sie (sprawdz date modyfikacji kilku)
