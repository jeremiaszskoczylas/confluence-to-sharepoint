# 6 — Migracja kolejnego serwisu

Pelna kolejnosc dla kazdej nastepnej przestrzeni z Confluence, gdy pierwszy serwis
jest juz zmigrowany. Uzywasz tych samych flow co przy pierwszym serwisie, bez
przepisywania akcji: inny serwis to inne wartosci wpisane przy uruchomieniu.

Zmigrowane serwisy zostaja nietkniete. Dlaczego, opisuje sekcja F.

W przykladach `<KOD>` to kod nowego serwisu, np. `SWB`, a `<NAZWA>` jego pelna nazwa.
`<WITRYNA>` i `<BIBLIOTEKA>` maja te same wartosci co przy pierwszym serwisie
([README](README.md)).

---

## A. Przygotowanie, raz na serwis

### 1. Aktualny parseTresc

Skrypt `parseTresc` jest wspolny dla wszystkich serwisow. Przed migracja wklej
w Excelu wersje z repozytorium, a poprzednia zachowaj, zeby moc do niej wrocic.

Starsze wersje zapisuja obrazki tak, ze znikaja po edycji strony, i nie wycinaja
formularzy `<form>`, ktore psuja strone.

### 2. Wpis w katalogu serwisow

`DT_Services` → **New**:

| Kolumna | Wartosc |
|---|---|
| `Title` | `<NAZWA>` |
| `Code` | `<KOD>` |
| `SortOrder` | kolejna dziesiatka, np. `30` |
| `IsActive` | zaznaczone |

`Code` wchodzi w nazwy plikow stron, wiec ma byc krotki, bez spacji i polskich znakow.

### 3. Nowa wartosc w kolumnie Service

Site Pages → ustawienia kolumny `Service` → dopisz wybor `<KOD>`.

Bez tego krok 1 wywali sie przy zapisie metadanych, bo SharePoint odrzuca wartosc
spoza listy wyborow.

`Category` jest kolumna tekstowa i niczego w niej nie dopisujesz.

### 4. Pliki eksportu

1. Wyeksportuj przestrzen z Confluence do HTML.
2. Rozpakuj do **osobnego folderu** w bibliotece, np. `Confluence-export/<KOD>`.
   Nie mieszaj z folderami innych serwisow.

### 5. Zalaczniki

Folder `attachments` z eksportu skopiuj do **wlasnego podfolderu serwisu**:

```
SiteAssets/DocMedia/<KOD>/attachments/
```

Kazdy serwis ma tu osobny folder, wiec kasujac jeden, nie ruszasz pozostalych.
Pelna sciezke do tego folderu wpisujesz potem w pole `zalaczniki` w krokach 1 i 2.

### 6. Lista migracyjna

Site contents → **New** → **List** → **From existing list** → wskaz liste migracyjna
juz zmigrowanego serwisu → nazwa `DT_MigrationMap_<KOD>`.

Kopiuje komplet kolumn bez wierszy. Sprawdz dwie rzeczy:

- kolumna `MigrationStatus` ma wybory `Skipped` i `Manual`
- zadna kolumna nie ma wartosci domyslnej
  ([00-przygotowanie](00-przygotowanie.md), sekcja A, „Dlaczego bez wartosci domyslnych")

Starsza droga, **Save list as template**, bywa niedostepna, bo SharePoint Online
ukrywa ja przy wylaczonych skryptach niestandardowych.

### 7. Strona mapy

Site Pages → **New** → **Page** → pusty szablon → tytul np. `Documentation Map <NAZWA>`
→ **Publish**. Tresci nie piszesz. Zapisz nazwe pliku strony, bedzie potrzebna w kroku 4.

Kazdy serwis ma wlasna strone mapy, a krok 4 nie potrafi jej zalozyc sam.

### 8. Wiersze w liscie

Uruchom flow z [00-przygotowanie](00-przygotowanie.md), sekcja E, z trzema zmianami:

- `GetIndex` → sciezka do **nowego** `index.html`:
  ```
  /<BIBLIOTEKA>/Confluence-export/<KOD>/index.html
  ```
- `Dodaj` → lista `DT_MigrationMap_<KOD>`, pole `Service`:
  ```
  <KOD>
  ```
- `ZapiszDrzewo` → **File Name** `drzewo-<KOD>.txt`, zeby nie nadpisac pliku innego serwisu

---

## B. Kontrola listy, przed krokiem 1

Teraz blad kosztuje minute, po kroku 2 kosztuje caly bieg.

1. **Liczba wierszy** = liczba plikow `.html` w folderze eksportu, bez `index.html`.
2. Filtr `Depth` = `1` zwraca **dokladnie jeden** wiersz, czyli strone glowna serwisu.
3. Zaden wiersz nie ma pustego `Title`, `SourceFile` ani `Service`.
4. **Group by** po `ConfluenceId`, potem po `SourceFile`: kazda grupa ma licznik 1.
5. Opcjonalnie: czy kazdy plik z `SourceFile` istnieje. Wyeksportuj liste i folder
   eksportu do CSV i porownaj w Excelu formula `=COUNTIF(B:B;A2)`. Zero oznacza plik,
   ktorego nie ma, czyli przyszly blad 404 w kroku 1.

### Pomijanie stron

Strony, ktorych nie chcesz migrowac, oznacz statusem `Skipped`. Pomijaj **cale galezie**,
razem z podstronami, inaczej podstrony wyladuja w mapie jako osobne korzenie.
Szczegoly: [00-przygotowanie](00-przygotowanie.md), sekcja B, „Pomijanie wybranych stron".

Pliki, ktorych brakuje w eksporcie (punkt 5), tez oznacz jako `Skipped`.

---

## C. Migracja

### Wartosci do pol triggera

Te same cztery wartosci w kroku 1 i w kroku 2. Rozjechane daja strony bez obrazkow
i ponowny bieg kroku 2.

| Pole | Wartosc | Format |
|---|---|---|
| `lista` | `DT_MigrationMap_<KOD>` | nazwa listy |
| `serwis` | `<KOD>` | kod z `DT_Services` |
| `eksport` | `Confluence-export/<KOD>` | sciezka **wewnatrz biblioteki**, bez ukosnikow na koncach |
| `zalaczniki` | `<WITRYNA>/SiteAssets/DocMedia/<KOD>/attachments/` | pelna sciezka **od korzenia serwera**, z ukosnikiem na koncu |

Trzy pomylki, ktore juz sie zdarzyly:

- folder eksportu wpisany i w `<BIBLIOTEKA>` w akcji, i w pole `eksport` — zdubluje sie
  w sciezce i GetHtml zwroci **notFound**. `<BIBLIOTEKA>` to sama nazwa biblioteki.
- `zalaczniki` bez `attachments/` na koncu albo bez ukosnika na poczatku — obrazki
  nie wyswietla sie na stronach
- inne `zalaczniki` w kroku 1 i w kroku 2 — obrazki prowadza w zle miejsce

Jesli pola triggera przestaja byc rozpoznawane, sprawdz ich prawdziwe klucze:
historia biegu → trigger → **Show raw outputs**.

### Krok 1 — MigratePages

1. [01-MigratePages](01-MigratePages.md) z `Top Count` = `1`. Obejrzyj te jedna strone:
   obrazki, naglowki, tabele, i czy **Edit** sie otwiera.
2. `Top Count` = `5000`, uruchom ponownie.
3. Kontrola: zaden wiersz nie zostal na `Pending`, a wszystkie poza `Skipped`
   maja `PageCreated` i `TargetPageId`.

### Po kroku 1: najwieksze strony

Posortuj folder eksportu po **File Size** i otworz **piec najwiekszych stron**.
Zadna nie moze byc pusta, a **Edit** musi sie otwierac.

Sprawdzasz juz teraz, bo krok 1 zapisuje pelna tresc strony. Zepsuta strona
zatrzymalaby potem krok 2 na akcji `Checkout`. Co robic z zepsuta strona: sekcja D.

### Krok 2 — RemapLinks

[02-RemapLinks](02-RemapLinks.md) z tymi samymi czterema wartosciami.

Po biegu, w historii, akcja **Planuj** → outputs:

| Pole | Ma byc |
|---|---|
| `korzeni` | `1` |
| `recznych` | `0`, chyba ze oznaczyles strony jako `Manual` |
| `pominietych` | liczba wierszy `Skipped` i `Failed` |

`korzeni` wieksze niz 1 znaczy, ze drzewo sie rozerwalo, najczesciej przez pominieta
strone, ktorej podstron nie pominieto.

Sprawdz na dwoch, trzech stronach, czy po **Edit** → **Republish** → `Ctrl+F5`
zostaja obrazki, ramki z kolorami i tabele.

### Krok 3 — mapa

**Nie uruchamiaj [03-BudujMape](03-BudujMape.md).** Czyta tylko liste migracyjna,
wiec nie widzi stron zalozonych recznie.

Uruchom [04-OdswiezDrzewo](04-OdswiezDrzewo.md):

```
serwis      <KOD>
stronaMapy  <nazwa pliku strony z punktu A.7>
```

### Krok 4 — aplikacja

Nic nie zmieniasz. Zakladka nowego serwisu pojawi sie sama, bo zakladki powstaja
z `DT_Services`, a drzewo filtruje po kolumnie `Service`.

---

## D. Gdy strona sie zepsuje

Objawy: strona jest pusta, przy wejsciu w **Edit** pojawia sie „can't edit this page",
a kolejny bieg konczy sie na akcji `Checkout` bledem **400** z komunikatem
`Value cannot be null` i kodem `-2147467261`. Bieg, ktory ja zepsul, byl zielony:
SharePoint przyjmuje zapis, ale potem nie potrafi strony odczytac.

Taka strona jest stracona. Przywracanie wersji z historii tez nie pomaga.

1. **Znajdz przyczyne w pliku zrodlowym.** Raz byl to formularz `<form>`, ktory
   `parseTresc` teraz wycina. Poszukaj w pliku `.html` w Notatniku innych podejrzanych
   elementow: `<iframe`, `<object`, `<embed`, `<script`, `<textarea`. Jesli cos znajdziesz,
   zglos, zeby dopisac to do parsera, zamiast poprawiac kazdy plik recznie.
2. **Skasuj strone** z Site Pages i z kosza (**Site contents** → **Recycle bin**).
3. **Odczekaj okolo 15 minut.** SharePoint jeszcze chwile trzyma nazwe pliku zablokowana.
4. Dalej jedna z dwoch drog:
   - przyczyna usunieta: ustaw wierszowi w liscie `MigrationStatus` na `Pending`, wyczysc
     `TargetPageId` i `TargetUrl`, uruchom krok 1, potem krok 2
   - strona za duza albo przyczyna nieznana: podziel ja na kilka stron flow
     [08-WklejFragment](08-WklejFragment.md), a wierszowi ustaw `Manual`
     ([00-przygotowanie](00-przygotowanie.md), sekcja B, „Strony utrzymywane recznie")

Nowe strony sprawdzaj najpierw na pustej stronie roboczej. Zepsuje sie wtedy ona,
a nie strona docelowa.

Nie uruchamiaj zadnego flow na stronie otwartej w trybie **Edit** w przegladarce.

---

## E. Lista kontrolna

Przed krokiem 1:

- [ ] w Excelu jest aktualny `parseTresc`
- [ ] `DT_Services` ma wiersz z kodem `<KOD>`
- [ ] kolumna `Service` w Site Pages ma wybor `<KOD>`
- [ ] eksport rozpakowany do `Confluence-export/<KOD>`
- [ ] zalaczniki skopiowane do `SiteAssets/DocMedia/<KOD>/attachments/`
- [ ] `DT_MigrationMap_<KOD>` ma wiersze ze statusem `Pending`, bez wartosci domyslnych
- [ ] lista przeszla kontrole z sekcji B, pominiecia oznaczone jako `Skipped`
- [ ] strona mapy zalozona, znasz nazwe jej pliku
- [ ] znasz cztery wartosci do pol triggera

Po kroku 1:

- [ ] zaden wiersz nie zostal na `Pending`
- [ ] piec najwiekszych stron nie jest pustych i otwiera sie w edytorze

Po kroku 2:

- [ ] `korzeni` = 1, `pominietych` zgadza sie z lista
- [ ] strony nowego serwisu maja `ParentPageId` wskazujace na strony tego serwisu
- [ ] odnosnik wewnetrzny prowadzi do strony tego samego serwisu
- [ ] obrazki zostaja po **Edit** → **Republish**

Po kroku 4:

- [ ] mapa pokazuje korzen i galezie, bez bloku „Bez przypisania"
- [ ] strony innych serwisow maja niezmieniona date modyfikacji

---

## F. Dlaczego inne serwisy nie ucierpia

| Mechanizm | Co chroni |
|---|---|
| osobna lista migracyjna | krok 1 nie widzi wierszy innego serwisu |
| prefiks kodu w nazwie pliku | `GMSC-Home-Page.aspx` i `SWB-Home-Page.aspx` to dwa rozne pliki, nawet gdy obie przestrzenie maja strone „Home Page" |
| pole `serwis` w kroku 2 | drzewo i linki liczone osobno; strona glowna jednego serwisu nie stanie sie rodzicem strony drugiego |
| grupowanie po `Service` w kroku 4 | kazdy serwis dostaje wlasny korzen i wlasna strone mapy |
| osobne foldery eksportu | pliki zrodlowe sie nie mieszaja |
| osobne foldery zalacznikow | obrazki serwisow leza oddzielnie w `DocMedia/<KOD>/` |

Wspolne sa tylko biblioteka Site Pages i skrypty w Excelu. W bibliotece rozroznienie
idzie po kolumnie `Service`, a skrypt `parseTresc` jest ten sam dla kazdego serwisu,
dlatego jego zmiana dotyczy wszystkich przy nastepnym biegu kroku 2.

Odnosniki miedzy serwisami prowadza w `#`, bo mapowanie linkow liczone jest w obrebie
jednego serwisu.
