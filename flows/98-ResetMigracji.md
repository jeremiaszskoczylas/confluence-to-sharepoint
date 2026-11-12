# 98 — Reset: migracja od zera

Czyszczenie przed ponownym przepuszczeniem calej przestrzeni przez kroki 1–4.
Uzywasz, gdy chcesz zaczac od czystej karty: po zmianach w parserze, po
nieudanym biegu albo zanim pokazesz wynik zespolowi.

**Czytaj uwaznie sekcje „Czego NIE kasowac".** Jedna pomylka kosztuje
ponowne wgrywanie 87 MB zalacznikow.

---

## A. Co skasowac

### 1. Zmigrowane strony w Site Pages

Site Pages → widok **All Pages**. Zeby nie kasowac recznie po jednej:

1. kliknij naglowek kolumny → **Filter by** → `ConfluencePageId` → zaznacz
   wszystkie wartosci **oprocz pustej i zera**
   (albo prosciej: filtr po `Service` = kod serwisu, ktory resetujesz)
2. zaznacz wszystko przyciskiem w naglowku listy
3. **Delete**

Filtr po `Service` jest bezpieczniejszy, bo przy kilku serwisach kasuje tylko
jeden. Przy pierwszym resecie, gdy serwis jest jeden, oba filtry daja to samo.

Osobne listy migracyjne ulatwiaja reset: czyscisz liste jednego serwisu
i ladujesz ja od nowa, nie dotykajac pozostalych.

### 2. Strona mapy

`Documentation-Map.aspx` **zostaw**. Krok 4 nadpisuje jej tresc w miejscu
i nie potrafi zalozyc strony od nowa — po skasowaniu konczy sie bledem 404.
Jesli skasujesz ja swiadomie, zaloz ja ponownie recznie przed krokiem 4
(Site Pages → **New** → **Page** → pusty szablon → **Publish**).

### 3. Kosz

Site contents → **Recycle bin** → **Empty recycle bin**. Niekonieczne, ale
porzadkuje widok i zwalnia miejsce. Usuniete strony i tak nie blokuja nazw.

### 4. Lista migracyjna

Dwie drogi:

**Droga szybka — reset statusow.** Otworz liste migracyjna resetowanego serwisu
w widoku listy,
zaznacz wszystkie wiersze i wyczysc kolumny: `MigrationStatus` z powrotem na
`Pending`, `TargetPageId`, `TargetUrl`, `MigratedOn`, `ErrorMessage` na puste.
Edycja wielu wierszy naraz: przelacz widok na **Edit in grid view**, zaznacz
kolumne i wklej wartosc w dol.

**Droga pewna — od nowa.** Usun wszystkie wiersze listy i zaladuj ja ponownie
flow z kroku 0, sekcja E. Trwa minute i gwarantuje, ze hierarchia i nazwy
plikow sa zgodne z aktualnym eksportem. **Zalecam te droge**, bo droga szybka
zostawia stare `ConfluenceId` i `ParentConfluenceId`, a to one odpowiadaja
za drzewo.

---

## B. Czego NIE kasowac

| Zostaw | Dlaczego |
|---|---|
| `SiteAssets/DocMedia/<Serwis>/attachments/` | **Tu mieszkaja obrazy wszystkich stron serwisu.** Sciezki w tresci wskazuja wlasnie tutaj. Skasowanie = puste ramki na kazdej stronie i ponowne wgrywanie 87 MB |
| folder eksportu HTML | Krok 2 czyta pliki `.html` przy **kazdym** biegu. Bez nich nie przebudujesz tresci |
| `drzewo.txt` | Odtworzenie hierarchii, gdyby znowu sie wyzerowala (krok 99) |
| kolumny w Site Pages | Zakladasz raz, zostaja na zawsze |
| `DT_Services` | Katalog serwisow, uzywany tez przez aplikacje |
| skrypty w Excelu | — |

---

## C. Przebieg migracji od zera, krok po kroku

Zalozenie: kroki z pliku 00 byly juz raz zrobione, czyli kolumny i skrypty
sa na miejscu, a zalaczniki leza w `DocMedia`.

| # | Co robisz | Czas | Kontrola po kroku |
|---|---|---|---|
| 1 | Sekcja A tego pliku: skasuj strony, zresetuj liste migracyjna | 10 min | Site Pages puste (poza mapa i stronami spoza migracji), lista ma komplet wierszy `Pending` |
| 2 | Uruchom **01-MigratePages** z `Top Count` = `1` | 1 min | jedna strona w Site Pages, wyglada poprawnie |
| 3 | Podnies `Top Count` na `5000`, uruchom ponownie | ~10 min | wszystkie wiersze maja `PageCreated`, `TargetPageId` i `TargetUrl` |
| 4 | Uruchom **02-RemapLinks** | 30–40 min | strony maja sciezke nadrzedna, dzialajace odnosniki, wypelnione `ParentPageId` i `TreePath` |
| 5 | Uruchom **03-BudujMape** (jeden serwis) albo **04-OdswiezDrzewo** (zawsze bezpieczny) | 1–2 min | mapa pokazuje korzen i galezie |
| 6 | Obejrzyj 3–4 strony: z obrazami, z cloakami, z zakladkami | 10 min | — |

Miedzy krokiem 2 a 3 **obejrzyj te jedna strone naprawde dokladnie**. Blad
parsera zauwazony teraz kosztuje minute, zauwazony po kroku 4 kosztuje
kolejne 40 minut biegu.

### Zanim uruchomisz krok 4

Sprawdz w `02-RemapLinks`, akcja `OdhaczWMapie`, czy pola poza `Id`, `Title`
i `MigrationStatus` sa **puste**. Wpisane tam zero kasuje hierarchie przy
kazdej iteracji. Tak stracilismy ja 18 wrzesnia.

---

## D. Jakie pliki zostaja i po co

Po zakonczonej migracji w srodowisku zostaje kilka rzeczy. Nie wszystkie
sa tak samo potrzebne.

**Potrzebne na zawsze:**

- **`SiteAssets/DocMedia/<Serwis>/attachments/`** — obrazy i pliki wstawione w tresc
  stron. Kazda strona linkuje tutaj. To jest czesc dzialajacej dokumentacji,
  nie pozostalosc po migracji.
- **biblioteka Site Pages z kolumnami** — zrodlo prawdy po migracji.
  Z `ParentPageId`, `TreePath` i `SortOrder` korzysta drzewo w aplikacji
  i flow odswiezajacy.

**Potrzebne, dopoki moze sie zdarzyc kolejna migracja albo przebudowa tresci:**

- **folder eksportu HTML** — krok 2 czyta z niego tresc przy kazdym biegu.
  Dopoki istnieje, mozesz poprawic parser i przepuscic wszystko jeszcze raz.
  Po usunieciu zostaja tylko strony takie, jakie sa, i dalsze zmiany robisz
  recznie w edytorze.
- **lista migracyjna serwisu** — potrzebna do krokow 1–2. Po migracji to slad
  historyczny: ktory plik odpowiada ktorej stronie.
- **`drzewo.txt`** — ratunek, gdyby hierarchia w mapie znowu zostala nadpisana.

**Mozna skasowac od razu:**

- **folder `attachments` wewnatrz eksportu** — jego kopia lezy juz w `DocMedia`
  i to ona obsluguje strony. Oryginal przyda sie tylko przy migracji od zera
  na czystej witrynie.
- **`index.html`** — po zaladowaniu listy migracyjnej jego role przejmuje
  `drzewo.txt`.

### Odpowiedz wprost na pytanie o eksport

Eksportu HTML **nie kasuj zaraz po utworzeniu stron**. Krok 2 bez niego nie
zadziala, a to on dokłada linki wewnetrzne, sciezki i podstrony. Usun go
dopiero wtedy, gdy uznasz tresc za gotowa i pogodzisz sie z tym, ze dalsze
poprawki beda recznie. Najrozsadniej: spakuj caly eksport do jednego ZIP
i odloz w bibliotece archiwalnej. Zajmuje 87 MB, a oszczedza dzien pracy,
gdyby trzeba bylo wrocic.

Zalaczniki i obrazy **sa potrzebne zawsze** — ale w `DocMedia`, nie w eksporcie.
To dwa rozne miejsca. W tresci stron sciezka prowadzi do `DocMedia`.
