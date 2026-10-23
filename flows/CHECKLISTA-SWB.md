# Checklista: migracja serwisu Switchboard

Plan na jeden dzien. Switchboard jest **testem przed ponowna migracja GMSC**,
wiec wazniejsze od tempa jest to, zeby po drodze bylo widac, co sie dzieje.

Pelne opisy akcji sa w [06-KolejnySerwis](06-KolejnySerwis.md). Tutaj jest
kolejnosc, kontrole i miejsca, w ktorych latwo cos nadpisac.

Zalozenia: `<SERWIS>` = `SWB`, eksport w `confluence-export/SWB`,
lista `DT_MigrationMap_SWB`, mapa `Documentation-Map-Switchboard.aspx`.

---

## 0. Zanim zaczniesz: jedna poprawka w kroku 2

**To trzeba zrobic, inaczej migracja SWB skonczy sie pusta mapa.**

W zbudowanym flow `02-RemapLinks` akcja **UstawMetadane** jest typu
`Update file properties`. Ta akcja wysyla komplet kolumn z formularza, a pole
zostawione puste zapisuje jako zero albo pusty tekst. Akcja nie wymienia
`ConfluencePageId` ani `Service`, wiec **kasuje obie kolumny na kazdej stronie**.

Przy GMSC zobaczyles dokladnie to: wyzerowane `ConfluencePageId` i `Service`,
ktore trzeba bylo wpisac recznie. Przy SWB skutek bylby gorszy, bo krok 4
filtruje po `Service` — bez niej mapa wyszlaby pusta (`wMapie: 0`).

Podmien te jedna akcje na **Send an HTTP request to SharePoint** wedlug
[02-RemapLinks](02-RemapLinks.md), punkt 9. Zapisuje szesc kolumn i nie dotyka
pozostalych.

Kontrola: w kroku 2 nie ma juz zadnej akcji `Update file properties`.

---

## 0b. Wartosci domyslne kolumn

Site Pages i listy migracyjne maja miec pola *Default value* **puste** —
w `ConfluencePageId`, `ParentPageId`, `SortOrder`, `ConfluenceId`
i `ParentConfluenceId`. Uzasadnienie: [00-przygotowanie](00-przygotowanie.md),
sekcja A, „Dlaczego bez wartosci domyslnych".

Sprawdz to teraz, bo `From existing list` kopiuje wartosci domyslne razem
z kolumnami — nowa lista SWB odziedziczy je po GMSC.

Najwazniejsza jest `SortOrder` w Site Pages: domyslne `100` wstawia strone
w srodek rodzenstwa zamiast na koniec.

Przejrzyj **wszystkie** kolumny obu list i biblioteki, nie tylko liczbowe:

- Site Pages: `ConfluencePageId`, `ParentPageId`, `SortOrder`, `TreePath`,
  `TreeSort`, `Category`, `DocStatus`, `Service`
- obie listy migracyjne: `ConfluenceId`, `ParentConfluenceId`, `Depth`,
  `SourceFile`, `MigrationStatus`, `Service`, `TargetPageId`, `TargetUrl`,
  `MigratedOn`, `ErrorMessage`

Dwa przypadki grozniejsze od domyslnego zera:

- **`Category`** z domyslna galezia przypisuje do niej kazda nowa strone,
  zanim krok 2 cokolwiek policzy — strona wyglada na przypisana do galezi,
  do ktorej nie nalezy
- **`MigratedOn`** z domyslnym „Dzisiaj" sprawia, ze swiezy wiersz wyglada
  na juz zmigrowany

Usuniecie domyslnej wartosci dziala od nastepnego utworzonego elementu.
Zapisanych juz zer nie czysci — przy SWB to bez znaczenia, bo jego strony
dopiero powstana.

---

## 1. Zabezpieczenie GMSC przed startem

Zrob zrzut stanu, zebys po migracji mogl porownac. Site Pages → filtr
`Service` = `GMSC`:

| Co zapisac | Twoja wartosc |
|---|---|
| liczba stron GMSC | |
| `TreePath` dowolnej strony glebokiej | |
| `ConfluencePageId` tej samej strony | |

Otworz tez `Documentation-Map.aspx` i zrob zrzut ekranu. To pieciominutowa
polisa: jesli cokolwiek ruszy GMSC, zobaczysz to od razu, a nie za tydzien.

**Co moze dotknac GMSC i dlaczego nie dotknie:**

| Ryzyko | Zabezpieczenie | Co sprawdzasz |
|---|---|---|
| wiersze SWB trafia do listy GMSC | flow z sekcji E ma wskazana liste w akcji `Dodaj` | przed uruchomieniem: lista to `DT_MigrationMap_SWB` |
| krok 1 nadpisze strony GMSC | czyta liste SWB, a nazwy plikow zaczynaja sie od kodu serwisu | `GMSC-*.aspx` i `SWB-*.aspx` to rozne pliki |
| krok 2 zepsuje metadane GMSC | petla idzie po wierszach listy SWB | po biegu: liczba stron GMSC bez zmian |
| krok 4 nadpisze mape GMSC | wpisuje tresc tylko w strone z pola `stronaMapy` | `stronaMapy` = `Documentation-Map-Switchboard.aspx` |
| `drzewo.txt` GMSC zostanie nadpisany | w akcji `ZapiszDrzewo` zmieniasz nazwe pliku | `drzewo-SWB.txt` |
| zalaczniki sie pomieszaja | podfoldery nazywaja sie identyfikatorami stron Confluence | nowe podfoldery obok starych |

---

## 2. Przygotowanie

Kolejnosc jest celowo przeplatana: wyborow `Category` nie da sie wpisac
wczesniej, bo nazw galezi nie znasz, dopoki nie zaladujesz listy.

### 2.1 Wpis w DT_Services

`Title` = `Switchboard`, `Code` = `SWB`, `SortOrder` = `20`, `IsActive` zaznaczone.

### 2.2 Nowy wybor w kolumnie Service

Site Pages → ustawienia kolumny `Service` → dopisz `SWB`.

Bez tego krok 1 wywali sie na pierwszej stronie: SharePoint odrzuca wartosc
spoza listy wyborow.

### 2.3 Pliki eksportu

1. Eksport przestrzeni Switchboard z Confluence do HTML.
2. Rozpakuj do `confluence-export/SWB` — **osobny folder**, nie mieszaj z GMSC.
3. Folder `attachments` z tego eksportu skopiuj do
   `SiteAssets/DocMedia/attachments/`.

Kontrola: w `DocMedia/attachments/` przybylo podfolderow, a stare zostaly.

### 2.4 Lista migracyjna

Site contents → **New** → **List** → **From existing list** → wskaz
`DT_MigrationMap` → nazwa `DT_MigrationMap_SWB`.

Kopiuje komplet kolumn razem z wyborami `MigrationStatus` i **nie kopiuje
wierszy**. Zadne flow nie zaklada list — to jedyna czynnosc reczna tego typu.

Kontrola: nowa lista jest pusta i ma jedenascie kolumn.

### 2.5 Zaladowanie wierszy

Flow z [00-przygotowanie](00-przygotowanie.md), sekcja E, z czterema zmianami:

| Akcja | Pole | Wartosc |
|---|---|---|
| `GetIndex` | File Path | `/<BIBLIOTEKA>/confluence-export/SWB/index.html` |
| `Dodaj` | lista | `DT_MigrationMap_SWB` |
| `Dodaj` | `Service` | `SWB` |
| `ZapiszDrzewo` | File Name | `drzewo-SWB.txt` |

**Sprawdz liste w akcji `Dodaj` dwa razy.** To jedyne miejsce w calym dniu,
gdzie pomylka dopisuje smieci do listy GMSC.

Kontrola: `DT_MigrationMap_SWB` ma tyle wierszy, ile stron w eksporcie,
wszystkie `Pending`, `ParentConfluenceId` wypelnione (strona glowna ma 0).
`DT_MigrationMap` ma tyle wierszy, co wczoraj.

### 2.6 Wybory w kolumnie Category

Galezie najwyzszego poziomu to **dzieci strony glownej**. Znajdziesz je tak:

1. w `DT_MigrationMap_SWB` odszukaj strone glowna — ma `ParentConfluenceId`
   rowne `0`. Zapisz jej `ConfluenceId`.
2. przefiltruj liste po `ParentConfluenceId` = ten numer.

To sa galezie. Ich tytuly dopisz jako wybory w kolumnie `Category`
w Site Pages — **bez numeru porzadkowego**: `01. Call Handling` daje wybor
`Call Handling`.

> **Nie filtruj po `Depth` = `1`.** `parseIndex` liczy zagniezdzenie list
> `<ul>` w `index.html`, wiec strona glowna ma `Depth` rowne `1`, a galezie
> `2`. Filtr po `ParentConfluenceId` jest niezalezny od struktury eksportu
> i zawsze daje to, czego oczekuje skrypt: `planujDrzewo` wyprowadza
> `Category` z tytulu tego przodka, ktorego rodzicem jest korzen.

Bez tego **kazda** iteracja kroku 2 skonczy sie bledem.

### 2.7 Strona mapy

Site Pages → **New** → **Page** → pusty szablon → tytul
`Documentation Map Switchboard` → **Publish**. Tresci nie pisz.

**Nie ustawiaj** na niej kolumny `Service` — strony map nie naleza do drzewa.

Kontrola: strona istnieje, nazwa pliku to `Documentation-Map-Switchboard.aspx`.

---

## 3. Migracja

### 3.1 Krok 1 na jednej stronie

[01-MigratePages](01-MigratePages.md), pola triggera:

```
lista    = DT_MigrationMap_SWB
serwis   = SWB
eksport  = confluence-export/SWB
```

**`Top Count` = `1`.**

Potem **obejrzyj te jedna strone naprawde dokladnie**: obrazy, odnosniki,
zakladki, zwijane sekcje. Blad parsera zauwazony teraz kosztuje minute,
zauwazony po kroku 2 kosztuje czterdziesci minut biegu.

Kontrola: w Site Pages jest `SWB-<tytul>.aspx`, ma `ConfluencePageId` i
`Service` = `SWB`. Wiersz na liscie ma status `PageCreated`.

### 3.2 Krok 1 na calosci

`Top Count` = `5000`, uruchom ponownie. Okolo dziesieciu minut.

Kontrola: wszystkie wiersze maja `PageCreated`, `TargetPageId` i `TargetUrl`.
Zaden nie zostal na `Pending`.

### 3.3 Krok 2

[02-RemapLinks](02-RemapLinks.md), te same trzy wartosci. Trzydziesci do
czterdziestu minut.

Kontrola — **to jest moment prawdy dla poprawki z punktu 0**. Wez dowolna
strone SWB:

- `Service` = `SWB` — nie puste
- `ConfluencePageId` — liczba, nie zero
- `ParentPageId` wskazuje na Id strony nadrzednej
- `TreePath` zawiera `ParentPageId` tej strony
- `Category` wypelniona (poza korzeniem)

Jesli `Service` albo `ConfluencePageId` sie wyzerowaly, poprawka z punktu 0
nie weszla. Zatrzymaj sie tutaj i popraw akcje, zanim pojdziesz dalej.

### 3.4 Krok 4 — mapa

[04-OdswiezDrzewo](04-OdswiezDrzewo.md):

```
serwis      = SWB
stronaMapy  = Documentation-Map-Switchboard.aspx
```

Kontrola w wyniku akcji `Planuj`:

| Pole | Spodziewana wartosc |
|---|---|
| `wMapie` | `1` |
| `serwisy` | tyle, ile serwisow ma poprawny korzen |
| `sieroty` | `0`, albo liczba stron swiadomie bez rodzica |

Potem otworz strone mapy z **Ctrl+F5**: korzen Switchboarda, pod nim zwijane
galezie.

---

## 4. Kontrola koncowa: czy GMSC przetrwal

Wroc do tabeli z punktu 1 i porownaj:

- liczba stron z `Service` = `GMSC` — bez zmian
- `TreePath` i `ConfluencePageId` tej jednej strony — bez zmian
- `Documentation-Map.aspx` wyglada jak na zrzucie
- `DT_MigrationMap` ma tyle wierszy, co rano, statusy bez zmian

Jesli wszystkie cztery sie zgadzaja, proces jest bezpieczny dla wielu serwisow
i mozna nim przepuscic GMSC od nowa.

---

## 5. Gdy cos pojdzie nie tak

| Objaw | Przyczyna | Co zrobic |
|---|---|---|
| krok 1 wywala sie na pierwszej stronie | brak wyboru `SWB` w kolumnie `Service` | punkt 2.2 |
| krok 2 wywala sie na kazdej iteracji | brak wyborow w `Category` | punkt 2.6 |
| po kroku 2 `Service` puste | akcja `Update file properties` | punkt 0, potem [97](97-NaprawMetadaneStron.md) |
| krok 4: `wMapie: 0` | strony nie maja `Service` = `SWB` | jak wyzej |
| krok 4: blad 404 na `GetMapa` | strony mapy nie ma albo zla nazwa | punkt 2.7 |
| petla kreci sie bez konca | zly flow — krok 4 nie ma petli | zatrzymaj (Cancel), sprawdz, ktory flow odpaliles |

Reset samego SWB: wyczysc `DT_MigrationMap_SWB`, skasuj strony
z filtrem `Service` = `SWB`, zaladuj liste od nowa punktem 2.5. GMSC
zostaje nietkniety, bo wszystko jest rozdzielone.
