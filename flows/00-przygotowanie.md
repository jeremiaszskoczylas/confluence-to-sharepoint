# 0 — Przygotowanie (raz, przed pierwszym flow)

Bez tych rzeczy flow-y nie maja na czym pracowac. Kolejnosc ma znaczenie.

## A. Kolumny w bibliotece Site Pages

Site Pages → Add column. Wszystkie **bez wartosci domyslnej** — pole
*Default value* zostaw puste. Dlaczego to wazne, nizej.

| Nazwa | Typ | Po co |
|---|---|---|
| `ConfluencePageId` | Liczba | id strony zrodlowej; puste = strona nie z migracji |
| `ParentPageId` | Liczba | id strony nadrzednej — **na tym stoi cale drzewo** |
| `SortOrder` | Liczba | kolejnosc wsrod rodzenstwa |
| `TreePath` | Jeden wiersz tekstu | sciezka id, np. `/8/9/11/12/` |
| `TreeSort` | Jeden wiersz tekstu | klucz sortowania calego drzewa |
| `Category` | Wybor | galaz najwyzszego poziomu |
| `DocStatus` | Wybor | `Draft`, `Published`, `Archived` |
| `Service` | Wybor | kod serwisu; wartosci takie same jak `Code` w `DT_Services` |

W kolumnie `Service` dodaj wybor dla kazdego migrowanego serwisu (ten sam kod,
co `Code` w `DT_Services`). Przy drugim serwisie dopisujesz kolejny wybor.

W kolumnie `Category` dodaj po jednym wyborze na galaz (tytuly bez numeru
porzadkowego). **Wybory uzupelnisz po sekcji E** — galezie to **dzieci strony
glownej**: wiersze, ktorych `ParentConfluenceId` rowna sie `ConfluenceId` strony
glownej (ta ma `ParentConfluenceId` rowne `0`). Brakujacy wybor = blad przy
zapisie metadanych w kroku 2.

Nie filtruj po `Depth` — ta kolumna liczy zagniezdzenie list `<ul>` w eksporcie,
wiec strona glowna zwykle ma `1`, a galezie `2`. `ParentConfluenceId` daje ten
sam wynik niezaleznie od struktury pliku.

### Dlaczego bez wartosci domyslnych

Wartosc domyslna wchodzi przy **tworzeniu** elementu, gdy pole nie zostalo
podane. Nic nie zepsuje od razu, ale odbiera informacje, ktora przy tym
procesie jest najcenniejsza: **czym rozni sie „nie ustawiono" od „ustawiono
na zero"**.

| Kolumna | Domyslna wartosc | Co sie przez nia traci |
|---|---|---|
| `ConfluencePageId` | `0` | strona zalozona recznie wyglada jak zmigrowana z zepsutym id; nie odroznisz jej od strony, ktorej metadane zostaly wyzerowane |
| `ParentPageId` | `0` | drzewo liczy sie tak samo (skrypt traktuje zero i pustke jednakowo), ale nie widzisz, ktora strona czeka na przypisanie rodzica |
| `SortOrder` | `100` | **to jedyna, ktora zmienia wynik.** Krok 2 nadaje `10`, `20`, `30`…, wiec strona bez przeliczenia wchodzi pomiedzy dziewiata a jedenasta pozycje rodzenstwa. Bez domyslnej wartosci skrypt stawia ja na koncu (`9999`) — tam, gdzie widac, ze cos wymaga uwagi |

Zaden flow ani skrypt nie wymaga tych zer. Krok 1 ustawia `ConfluencePageId`
i `Service`, krok 2 reszte — zawsze jawnie.

**Usuniecie wartosci domyslnej nie czysci tego, co juz zapisane.** Dziala
od nastepnego utworzonego elementu. Zera z wczesniejszych biegow zostaja
i kasujesz je recznie albo przy migracji od zera.

## B. Lista migracyjna — jedna na serwis

**Kazdy serwis ma wlasna liste robocza.** Pierwsza nazwij `DT_MigrationMap`,
kolejne z sufiksem serwisu, np. `DT_MigrationMap_SWB`.

Osobne listy zamiast jednej wspolnej, bo: reset jednego serwisu to wyczyszczenie
jego listy, limit pieciu tysiecy elementow liczy sie osobno, a pomylka przy jednym
serwisie nie dotyka drugiego.

Kolumny (te same w kazdej liscie), **bez wartosci domyslnych**:

| Nazwa | Typ |
|---|---|
| `Title` | domyslna, tytul strony |
| `ConfluenceId` | Liczba |
| `ParentConfluenceId` | Liczba — `0` u strony glownej, ale wpisuje je flow, nie wartosc domyslna |
| `Depth` | Liczba |
| `SourceFile` | Jeden wiersz tekstu |
| `MigrationStatus` | Wybor: `Pending`, `PageCreated`, `LinksRemapped`, `Failed` |
| `Service` | Jeden wiersz tekstu — kod serwisu; przy osobnych listach to zabezpieczenie, nie filtr |
| `TargetPageId` | Liczba |
| `TargetUrl` | Jeden wiersz tekstu |
| `MigratedOn` | Data i godzina |
| `ErrorMessage` | Wiele wierszy tekstu — na razie zadne flow tu nie pisze, pole na przyszla obsluge bledow |

## B2. Lista DT_Services

Katalog serwisow. Z niego bierzesz `<SERWIS>`, a aplikacja robi z niego zakladki.

| Nazwa | Typ |
|---|---|
| `Title` | domyslna — nazwa serwisu, np. `GMSC` |
| `Code` | Jeden wiersz tekstu — krotki kod bez spacji, np. `GMSC` |
| `SortOrder` | Liczba — 10, 20, 30 |
| `IsActive` | Tak/Nie |

Zaloz od razu wiersz pierwszego serwisu. `Code` wchodzi w nazwy plikow stron,
wiec bez spacji i polskich znakow.

## C. Pliki na miejsce

1. Rozpakuj eksport HTML do biblioteki plikow: `<EKSPORT>`.
2. Folder `attachments` z eksportu skopiuj do **Site Assets → DocMedia**, tak zeby
   powstalo `SiteAssets/DocMedia/attachments/<id-strony>/<plik>`. Parser przepisuje
   sciezki wlasnie na ten uklad.

## D. Skrypty do Excela

Kazdy plik z katalogu `scripts/` tego repo wklej jako osobny skrypt w Excel Online
(Automate → New script), nazwany **dokladnie jak plik, bez rozszerzenia**:

| Skrypt | Uzywany w |
|---|---|
| `parseIndex` | ten krok, punkt E |
| `parseTresc` | 01-MigratePages, 02-RemapLinks |
| `planujDrzewo` | 02-RemapLinks, 03-BudujMape |
| `planujMape` | 04-OdswiezDrzewo |
| `budujMape` | 03-BudujMape, 04-OdswiezDrzewo |

Sondy diagnostyczne (`analyzeConfluenceHtml`, `pokazFragment`, `pokazTaby`) wklej
dopiero, gdy beda potrzebne.

## E. Zaladowanie listy migracyjnej

`parseIndex` czyta `index.html` z eksportu i zwraca plaska liste
`ConfluenceId|ParentConfluenceId|Depth|Tytul|Plik`, po jednym wierszu na strone.

Flow pomocniczy, piec akcji:

**1. Trigger** — Manually trigger a flow

**2. GetIndex** — SharePoint → Get file content using path

File Path (tekst):
```
/<BIBLIOTEKA>/<EKSPORT>/index.html
```

**3. Drzewo** — Excel Online → Run script

Script (lista):
```
parseIndex
```
html (dyn): File Content z GetIndex

**4. Apply to each** — Control

Select an output (fx):
```
skip(split(body('Drzewo')?['result'], decodeUriComponent('%0A')), 1)
```

Wewnatrz petli **Dodaj** — SharePoint → Create item, **lista tego serwisu**
(`DT_MigrationMap` dla pierwszego, `DT_MigrationMap_SWB` dla kolejnego):

Title (fx):
```
trim(split(item(), '|')[3])
```
ConfluenceId (fx):
```
int(trim(split(item(), '|')[0]))
```
ParentConfluenceId (fx):
```
int(trim(split(item(), '|')[1]))
```
Depth (fx):
```
int(trim(split(item(), '|')[2]))
```
SourceFile (fx):
```
trim(split(item(), '|')[4])
```
MigrationStatus Value (lista):
```
Pending
```
Service (tekst) — kod migrowanego serwisu:
```
<SERWIS>
```

**5. ZapiszDrzewo** — SharePoint → Create file   (POZA petla, na koncu)

Zapisuje plaska liste hierarchii na dysk. To jedyne zrodlo dla kroku 99,
gdyby hierarchia w mapie kiedys zostala nadpisana.

Folder Path (tekst):
```
/<BIBLIOTEKA>/Reports
```
File Name (tekst) — przy kolejnych serwisach dopisz kod, np. `drzewo-SWB.txt`:
```
drzewo.txt
```
File Content (fx):
```
body('Drzewo')?['result']
```

## F. Strona mapy

Strone mapy **zalozysz recznie**: Site Pages → **New** → **Page** → pusty
szablon → tytul, np. `Documentation Map` → **Publish**. Tresci nie pisz.

[04-OdswiezDrzewo](04-OdswiezDrzewo.md) wpisuje drzewo w istniejaca strone
i nie zaklada nowych — bez tego konczy sie bledem 404.

**Nie ustawiaj** na niej kolumny `Service`. Strony map nie naleza do drzewa;
puste `Service` trzyma je poza nim.

Link w lewym panelu witryny dodaj od razu — strona juz istnieje.

## Kontrola przed krokiem 1

- strona mapy serwisu istnieje i jest pusta
- lista migracyjna serwisu ma tyle wierszy, ile stron w eksporcie, wszystkie `Pending`
- `ParentConfluenceId` wypelnione (strona glowna ma 0)
- w `SiteAssets/DocMedia/attachments/` sa podfoldery z obrazami
- w Excelu widac skrypty z punktu D
