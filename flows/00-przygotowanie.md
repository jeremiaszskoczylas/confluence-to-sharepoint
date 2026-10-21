# 0 — Przygotowanie (raz, przed pierwszym flow)

Bez tych rzeczy flow-y nie maja na czym pracowac. Kolejnosc ma znaczenie.

## A. Kolumny w bibliotece Site Pages

Site Pages → Add column. Wszystkie **bez wartosci domyslnej**.

| Nazwa | Typ | Po co |
|---|---|---|
| `ConfluencePageId` | Liczba | id strony zrodlowej; 0 = strona nie z migracji |
| `ParentPageId` | Liczba | id strony nadrzednej — **na tym stoi cale drzewo** |
| `SortOrder` | Liczba | kolejnosc wsrod rodzenstwa |
| `TreePath` | Jeden wiersz tekstu | sciezka id, np. `/8/9/11/12/` |
| `TreeSort` | Jeden wiersz tekstu | klucz sortowania calego drzewa |
| `Category` | Wybor | galaz najwyzszego poziomu |
| `DocStatus` | Wybor | `Draft`, `Published`, `Archived` |

W kolumnie `Category` dodaj po jednym wyborze na galaz (tytuly bez numeru
porzadkowego). Brakujacy wybor = blad przy zapisie metadanych.

## B. Lista DT_MigrationMap

Nowa lista. Kolumny:

| Nazwa | Typ |
|---|---|
| `Title` | domyslna, tytul strony |
| `ConfluenceId` | Liczba |
| `ParentConfluenceId` | Liczba |
| `Depth` | Liczba |
| `SourceFile` | Jeden wiersz tekstu |
| `MigrationStatus` | Wybor: `Pending`, `PageCreated`, `LinksRemapped`, `Failed` |
| `Service` | Jeden wiersz tekstu — kod serwisu, ten sam co `Code` w `DT_Services` |
| `TargetPageId` | Liczba |
| `TargetUrl` | Jeden wiersz tekstu |
| `MigratedOn` | Data i godzina |
| `ErrorMessage` | Wiele wierszy tekstu |

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
| `planujDrzewo` | 02-RemapLinks |
| `planujMape` | 04-OdswiezDrzewo |
| `budujMape` | 03-BudujMape, 04-OdswiezDrzewo |

Sondy diagnostyczne (`analyzeConfluenceHtml`, `pokazFragment`, `pokazTaby`) wklej
dopiero, gdy beda potrzebne.

## E. Zaladowanie DT_MigrationMap

`parseIndex` czyta `index.html` z eksportu i zwraca plaska liste
`ConfluenceId|ParentConfluenceId|Depth|Tytul|Plik`, po jednym wierszu na strone.

Flow pomocniczy, cztery akcje:

**1. Trigger** — Manually trigger a flow

**2. GetIndex** — SharePoint → Get file content using path

File Path (tekst):
```
/Dashboard_Team/<EKSPORT>/index.html
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

Wewnatrz petli **Dodaj** — SharePoint → Create item, lista `DT_MigrationMap`:

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

Zapisz wynik akcji `Drzewo` takze jako plik `drzewo.txt` w bibliotece — przyda sie,
gdyby trzeba bylo odtworzyc hierarchie ([99-NaprawHierarchie.md](99-NaprawHierarchie.md)).

## F. Strona mapy

Nic nie trzeba zakladac. Strone `<MAPA>` tworzy od zera
[03-BudujMape.md](03-BudujMape.md). W lewym panelu witryny dodaj do niej link
dopiero po pierwszym biegu.

## Kontrola przed krokiem 1

- `DT_MigrationMap` ma tyle wierszy, ile stron w eksporcie, wszystkie `Pending`
- `ParentConfluenceId` wypelnione (strona glowna ma 0)
- w `SiteAssets/DocMedia/attachments/` sa podfoldery z obrazami
- w Excelu widac skrypty z punktu D
