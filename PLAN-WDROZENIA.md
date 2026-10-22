# Plan wdrozenia — od stanu obecnego

Stan na dzis: GMSC zmigrowany (60 stron), mapa dokumentacji dziala, zalaczniki
w `DocMedia`, `DT_MigrationMap` wypelniona. Nic z nowych rzeczy nie jest wdrozone.

**Nie musisz migrowac od zera.** Istniejace strony wystarczy uzupelnic o jedna
kolumne i przeliczyc. Ponowna migracja jest potrzebna tylko wtedy, gdy chcesz
nowa tresc stron (zakladki) — i to jest osobny, opcjonalny etap.

Etapy sa ulozone tak, ze po kazdym masz cos dzialajacego i mozesz przerwac.

---

## Etap 1 — przygotowanie pod wiele serwisow i pod aplikacje

**Czas: 30–40 minut. Bez tego nie ruszysz dalej.**

### 1.1 Kolumna Service w bibliotece

Site Pages → **Add column** → **Wybor**, nazwa `Service`, wybor `GMSC`.

### 1.2 Wypelnij ja na istniejacych stronach

Site Pages → widok **All Pages** → **Edit in grid view** → w kolumnie `Service`
wpisz `GMSC` w pierwszym wierszu i skopiuj w dol na wszystkie strony dokumentacji.

**Nie wypelniaj** stron spoza dokumentacji (strona glowna witryny, strona mapy).
Puste `Service` jest dla nich wlasciwe — dzieki temu nie wejda do drzewa.

Kontrola: strony dokumentacji maja `GMSC`, mapa i strony witryny maja pusto.

### 1.3 Lista DT_Services

Nowa lista wg [flows/00-przygotowanie.md](flows/00-przygotowanie.md), sekcja B2.
Jeden wiersz: `Title` = `GMSC`, `Code` = `GMSC`, `SortOrder` = `10`,
`IsActive` zaznaczone.

### 1.4 Kolumna Service w DT_MigrationMap

`DT_MigrationMap` → **Add column** → Jeden wiersz tekstu, nazwa `Service`.
W widoku siatki wpisz `GMSC` we wszystkich wierszach.

Potrzebne przy migracji Switchboarda — filtr w kroku 1 bierze wiersze po serwisie.

### 1.5 Zbuduj flow 04-OdswiezDrzewo

Wg [flows/04-OdswiezDrzewo.md](flows/04-OdswiezDrzewo.md). Dwanascie akcji,
okolo 20 minut. Wczesniej wklej do Excela skrypty `planujMape` i `budujMape`
z katalogu `scripts/`.

W akcji `Planuj` pole **`serwisMapy`** wpisz `GMSC`. Dzieki temu strona
`Documentation-Map` pokazuje tylko GMSC, a aplikacja i tak dostanie metadane
wszystkich serwisow do swoich zakladek.

### 1.6 Uruchom go

Kontrola po biegu:

- strony maja `TreePath` z **identyfikatorami biblioteki**, np. `/8/9/11/12/`
  (sprawdz jeden: `ParentPageId` strony musi wystepowac w jej `TreePath`)
- mapa dokumentacji wyglada jak dotad: korzen i zwijane galezie
- w wyniku akcji `Planuj` pole `sieroty` to zero albo tyle, ile stron
  swiadomie nie ma rodzica

**Po tym etapie:** dokumentacja jest gotowa na drugi serwis i na aplikacje.
Tresc stron bez zmian.

---

## Etap 2 — aplikacja

**Czas: 3–4 wieczory. Mozesz zaczac od razu po etapie 1.**

Kolejnosc i szczegoly: [app/README.md](app/README.md).

| Krok | Co powstaje | Czas |
|---|---|---|
| [00-powerapps-podstawy](app/00-powerapps-podstawy.md) | **przeczytaj przed klikaniem** | 15 min |
| [01-listy](app/01-listy.md) | listy `DT_Rota`, `DT_Breaks`, `DT_DailyChecks`, `DT_ManagerMessages` | 40 min |
| [02-szkielet](app/02-szkielet.md) | aplikacja, nawigacja, kolory | 45 min |
| [03-home](app/03-home.md) | ekran glowny | 2–3 h |
| [04-dokumentacja](app/04-dokumentacja.md) | drzewo z zakladkami serwisow | 1–2 h |
| [05-nowa-strona](app/05-nowa-strona.md) | dodawanie stron z aplikacji | 1 h |

Pierwsza rzecz w poradniku to przestawienie jezyka autora na angielski.
Bez tego **kazda** formula bedzie czerwona.

Formuly kopiujesz z [app/formuly/](app/formuly/), nie przepisujesz z instrukcji.

Po szkielecie (krok 02) masz juz cos, co dziala i co widac — dobry moment
na pierwsza przerwe.

---

## Etap 3 — zakladki na stronach (opcjonalny)

**Czas: 1 godzina. Tylko jesli przeszkadza ci rozjechana strona
„Out of & Back in Production".**

Parser obsluguje teraz makro zakladek: para zakladek staje sie dwiema kolumnami
obok siebie, tytul z atrybutu panelu. Zeby to zobaczyc, trzeba przebudowac tresc
stron.

1. Wklej do Excela nowa wersje `parseTresc` z `scripts/`
2. Zbuduj [flows/02-RemapLinks](flows/02-RemapLinks.md) (jesli masz stara wersje
   tego flow, porownaj z ściągą — doszlo pole `serwis` w akcji `Planuj`
   i placeholder `<BIBLIOTEKA>`)
3. **Sprawdz w akcji `OdhaczWMapie`, czy pola poza `Id`, `Title` i statusem
   sa puste.** Wpisane zero kasuje hierarchie przy kazdej iteracji
4. Uruchom. 30–40 minut
5. Obejrzyj „Out of & Back in Production" i jedna strone z cloakami

Uwaga: ten bieg **nadpisuje tresc wszystkich stron**. Reczne poprawki wpisane
w strony po migracji przepadna.

Jesli nie robisz tego etapu, strony zostaja takie jak dzis — poza jedna
rozjechana wszystko dziala.

---

## Etap 4 — serwis Switchboard

**Czas: jak etapy migracji, czyli okolo godziny biegow.**

Dwie drogi, zaleznie od tego, czy masz eksport z Confluence:

| Masz eksport HTML | Nie masz, piszesz od nowa |
|---|---|
| [flows/06-KolejnySerwis](flows/06-KolejnySerwis.md) | [flows/07-RecznySerwis](flows/07-RecznySerwis.md) |
| ten sam komplet flow, podmieniasz `<EKSPORT>` i `<SERWIS>` | zakladasz strony recznie, ustawiasz `Service` i `ParentPageId` |

Obie konczy sie tak samo: uruchomieniem kroku 4, ktory dolacza nowy serwis
do mapy pod wlasnym naglowkiem. W aplikacji zakladka pojawia sie sama.

---

## Czego NIE robic

- **Nie uruchamiaj [03-BudujMape](flows/03-BudujMape.md).** Robil mape, zanim
  powstal krok 4. Dzis krok 4 robi to samo i obsluguje wiele serwisow,
  a krok 3 nadpisalby mape jednym serwisem.
- **Nie kasuj folderu eksportu HTML.** Etap 3 i kazda przyszla przebudowa tresci
  czytaja z niego.
- **Nie kasuj `SiteAssets/DocMedia/attachments/`.** Tam mieszkaja obrazy
  wszystkich stron.
- **Nie zmieniaj nazw istniejacych plikow stron GMSC** na wersje z prefiksem.
  Dzialaja odnosniki i mapa; kolizji ze Switchboardem nie bedzie, bo jego strony
  dostana prefiks `SWB-`.

---

## Jesli masz malo czasu

Minimum, zeby ruszyc z aplikacja: **etap 1** (40 minut), potem etap 2 krok po
kroku w swoim tempie. Etapy 3 i 4 mozesz odlozyc na dowolnie dlugo.
