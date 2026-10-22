# 7 — Serwis zakladany recznie, bez migracji

Nowy serwis nie musi pochodzic z Confluence. Strony mozesz napisac wprost
w SharePoincie, a drzewo i mapa zbuduja sie tak samo jak dla stron migrowanych.

Dziala to dlatego, ze **zrodlem prawdy po migracji jest biblioteka Site Pages**,
a nie lista migracyjna. Krok 4 czyta biblioteke i nie interesuje go, skad wzielo
sie tam cokolwiek.

Kiedy ta droga jest lepsza od migracji: serwis ma kilka–kilkanascie stron,
nie ma eksportu HTML, albo tresc i tak trzeba napisac od nowa.

---

## A. Przygotowanie, raz na serwis

### 1. Wpis w katalogu serwisow

`DT_Services` → **New**. Przyklad dla serwisu Switchboard:

| Kolumna | Wartosc |
|---|---|
| `Title` | `Switchboard` |
| `Code` | `SWB` |
| `SortOrder` | `20` |
| `IsActive` | zaznaczone |

### 2. Wybor w kolumnie Service

Site Pages → ustawienia kolumny `Service` → dopisz wybor `SWB`.

**Bez tego nie zapiszesz metadanych** — SharePoint odrzuca wartosc spoza listy.

### 3. Wybory w kolumnie Category

Tu masz przewage nad migracja: galezie wymyslasz sam, wiec wybory mozesz dodac
od razu. Galaz to strona **bezposrednio pod korzeniem** serwisu.

Przyklad: `Call Handling`, `Escalations`, `Known Errors`.

Wpisuj **bez numeru porzadkowego**, nawet jesli w tytule strony numer bedzie
(`01. Call Handling` w tytule → wybor `Call Handling`).

---

## B. Tworzenie stron

### Kolejnosc: najpierw wszystkie strony, potem hierarchia

Nie ustawiaj `ParentPageId` w trakcie zakladania. Identyfikator rodzica poznasz
dopiero, gdy rodzic istnieje, a przeskakiwanie tam i z powrotem to strata czasu.
Zrob to tak:

1. zaloz **wszystkie** strony serwisu, z trescia albo samymi naglowkami
2. w jednym widoku siatki uzupelnij metadane, widzac wszystkie identyfikatory naraz

### Zakladanie pojedynczej strony

Site Pages → **New** → **Page** → szablon **Blank** → tytul → napisz tresc →
**Publish**.

Zacznij od **strony glownej serwisu** (korzenia), np. `Switchboard Home Page`.
Potem galezie, potem strony pod nimi.

### Nazwy plikow

Przy recznym zakladaniu SharePoint tworzy nazwe pliku z tytulu. Jesli inny serwis
ma strone o tym samym tytule, dostaniesz `Home-Page-1.aspx` — brzydkie, ale
dziala. Zeby bylo porzadnie, nadaj nazwy z prefiksem serwisu:

Site Pages → zaznacz strone → **Rename** → `SWB-Call-Handling.aspx`

To ta sama konwencja, ktora przy migracji nadaje krok 1. Nie jest wymagana
technicznie, ale trzyma biblioteke w ryzach i zapobiega kolizjom.

---

## C. Uzupelnienie metadanych

### Pokaz kolumne z identyfikatorem

Domyslnie jej nie widac, a bez niej nie ustawisz hierarchii.

Site Pages → przelacz na widok **All Pages** → klikniecie w naglowek dowolnej
kolumny → **Column settings** → **Show/hide columns** → zaznacz **ID** → **Apply**.

### Wpisz wartosci w widoku siatki

Site Pages → **Edit in grid view** (przycisk nad lista). Teraz wpisujesz wartosci
jak w Excelu, z kopiowaniem w dol.

Dla kazdej strony serwisu:

| Kolumna | Co wpisac |
|---|---|
| `Service` | `SWB` — ta sama wartosc we wszystkich wierszach, skopiuj w dol |
| `ParentPageId` | **ID strony nadrzednej** z kolumny ID; korzen serwisu zostaw `0` |
| `ConfluencePageId` | `0` — oznacza strone spoza migracji |
| `DocStatus` | `Published` |
| `Category` | zostaw puste |

`TreePath`, `TreeSort` i `SortOrder` **zostaw puste**. Wylicza je krok 4
i recznie wpisane wartosci i tak zostana nadpisane.

`Category` tez zostaw puste — krok 4 wyliczy ja z galezi, pod ktora strona wisi.

### Przyklad wypelnienia

Zalozmy, ze strony dostaly identyfikatory 120–124:

| ID | Tytul | Service | ParentPageId |
|---|---|---|---|
| 120 | Switchboard Home Page | SWB | `0` |
| 121 | 01. Call Handling | SWB | `120` |
| 122 | Transfer rules | SWB | `121` |
| 123 | 02. Escalations | SWB | `120` |
| 124 | Out of hours | SWB | `123` |

Korzen wskazuje na zero, galezie na korzen, strony szczegolowe na swoja galaz.

---

## D. Zbudowanie drzewa i mapy

Dwa flow, w tej kolejnosci:

1. [04b-PrzeliczDrzewo](04b-PrzeliczDrzewo.md) — przelicza `TreePath`,
   `TreeSort`, `SortOrder` i `Category` ze swiezo wpisanych `ParentPageId`.
   Przy stronach zakladanych recznie ten krok jest **obowiazkowy**: nikt inny
   tych kolumn nie wypelni.
2. [04-OdswiezDrzewo](04-OdswiezDrzewo.md) — wpisuje drzewo w strone mapy.

Przed krokiem 2 zaloz strone mapy tego serwisu (Site Pages → **New** → **Page**
→ pusty szablon → **Publish**). Flow nie tworzy stron, tylko wypelnia wskazana:

```
serwis      = SWB
stronaMapy  = Documentation-Map-Switchboard.aspx
```

Kazdy serwis ma wlasna strone mapy. Mapa GMSC zostaje nietknieta.

Trwa to okolo dwoch minut.

---

## E. Kontrola

- w Site Pages strony SWB maja wypelnione `TreePath` (np. `/120/121/122/`)
- `Category` uzupelnila sie sama z nazwy galezi, bez numeru
- mapa dokumentacji pokazuje korzen Switchboarda i jego galezie
- strony GMSC maja niezmieniona date modyfikacji

W aplikacji zakladka `Switchboard` pojawi sie sama, bo zakladki powstaja
z `DT_Services`. Jesli aplikacja byla otwarta, kliknij odswiezanie.

---

## F. Typowe bledy

**Strona nie pojawila sie w drzewie ani w mapie.**
Nie ma wypelnionej kolumny `Service`. Biblioteka zawiera takze strony witryny
spoza dokumentacji, wiec krok 4 bierze wylacznie te z przypisanym serwisem.

**Strona wyladowala w sekcji „Bez przypisania" na koncu mapy.**
Ma `Service`, ale nie ma `ParentPageId` albo wskazuje on na strone, ktorej
nie ma. To celowy sygnal: uzupelnij kolumne i uruchom krok 4 ponownie.

**Blad przy zapisie metadanych o wartosci spoza listy.**
Brakuje wyboru w kolumnie `Service` albo `Category`. Dodaj go w ustawieniach
kolumny i powtorz.

**Caly serwis wisi pod GMSC zamiast osobno.**
`ParentPageId` korzenia Switchboarda wskazuje na strone GMSC zamiast na zero.
Korzen kazdego serwisu ma miec zero.

**Dwie strony walcza o to samo miejsce w kolejnosci.**
`SortOrder` liczy krok 4 z kolejnosci rodzenstwa. Jesli chcesz inna kolejnosc
niz alfabetyczna, uzyj numerow w tytulach (`01.`, `02.`), tak jak w migrowanej
dokumentacji — numer i tak znika z kategorii.

---

## G. Pozniej: dodawanie stron z aplikacji

Gdy dashboard bedzie gotowy, pojedynczej strony nie trzeba juz zakladac recznie.
Przycisk **+ Nowa strona** w zakladce Dokumentacja robi to samo: tworzy strone,
ustawia serwis i rodzica wybranego z drzewa, przelicza hierarchie i otwiera
strone do edycji. Opis: [05-NowaStrona](05-NowaStrona.md)
oraz [app/05-nowa-strona.md](../app/05-nowa-strona.md).

Ten poradnik przydaje sie wtedy do zakladania **calego nowego serwisu naraz**,
bo robienie kilkunastu stron po jednej przez okno aplikacji trwaloby dluzej.
