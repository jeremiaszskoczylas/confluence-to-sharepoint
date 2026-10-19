# 99 — NaprawHierarchie (awaryjny)

Odtwarza `ParentConfluenceId` i `Depth` w `DT_MigrationMap` z pliku `drzewo.txt`
(wynik skryptu parseIndex). Nie rusza zadnej innej kolumny.

Kiedy uzyc: gdy hierarchia w mapie zostala nadpisana (np. przez akcje Update item
z wpisanym 0 w polu ParentConfluenceId).

## PODMIEN

| Placeholder | Na co |
|---|---|
| `<DRZEWO>` | sciezka do drzewo.txt w bibliotece, np. `/Dashboard_Team/Reports/drzewo.txt` |

---

## 1. Trigger — Manually trigger a flow

## 2. GetDrzewo — SharePoint → Get file content using path

File Path (tekst):
```
<DRZEWO>
```

## 3. Apply to each — Control

Select an output (fx):
```
skip(split(body('GetDrzewo'), decodeUriComponent('%0A')), 1)
```

Akcje 4–6 WEWNATRZ petli.

## 4. Condition — Control

Lewa strona (fx):
```
contains(item(), '|')
```
is equal to: `true`

Akcje 5–6 w galezi **If yes**.

## 5. SzukajWiersz — SharePoint → Get items

List Name: `DT_MigrationMap`

Filter Query (fx) — CALE pole:
```
concat('ConfluenceId eq ', trim(split(item(), '|')[0]))
```
Top Count (tekst):
```
1
```

## 6. Popraw — SharePoint → Update item

List Name: `DT_MigrationMap`

Id (fx):
```
first(body('SzukajWiersz')?['value'])?['ID']
```
Title (fx):
```
first(body('SzukajWiersz')?['value'])?['Title']
```
ParentConfluenceId (fx):
```
int(trim(split(item(), '|')[1]))
```
Depth (fx):
```
int(trim(split(item(), '|')[2]))
```
**WSZYSTKIE pozostale pola PUSTE** (MigrationStatus, ConfluenceId, SourceFile, TargetUrl,
TargetPageId, ErrorMessage, MigratedOn). Puste = nie zmieniaj. Wpisane 0 = nadpisz zerem.

Galaz If no: pusta.

---

## Po biegu

`DT_MigrationMap`: `ParentConfluenceId` znowu wypelnione, np. wiersz
`Known Error Handling` → `1149032772`, strona glowna → `0`, galezie → id strony glownej.

## Zasada na przyszlosc (dotyczy KAZDEJ akcji Update item / Update file properties)

W polach, ktorych nie chcesz zmieniac, NIE MOZE byc nic — zadnego 0, zadnej spacji.
Power Automate nie wypelnia pol wartosciami domyslnymi kolumn; jesli w polu jest 0,
ktos je tam wpisal, a flow bedzie je nadpisywal przy kazdym biegu.
