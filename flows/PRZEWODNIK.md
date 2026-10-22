# Przewodnik: migracja od zera i kolejne serwisy

Jeden ciag krokow, bez wariantow. Szczegoly kazdego kroku sa w osobnych plikach;
tutaj jest kolejnosc, czasy i to, co trzeba sprawdzic po drodze.

Proces zostal **przeprowadzony w calosci na przestrzeni GMSC**: 60 stron, mapa
dokumentacji, dzialajace odnosniki. To nie jest plan teoretyczny, tylko spisana
droga, ktora juz raz zadziala, plus obsluga wielu serwisow.

---

## Co masz, zanim zaczniesz

| Rzecz | Gdzie | Uwaga |
|---|---|---|
| kolumny w Site Pages | biblioteka witryny | komplet w [00](00-przygotowanie.md), sekcja A |
| `DT_MigrationMap`, `DT_Services` | listy witryny | [00](00-przygotowanie.md), sekcje B i B2 |
| eksport HTML | biblioteka plikow | osobny folder na serwis |
| zalaczniki | `SiteAssets/DocMedia/attachments/` | **tu mieszkaja obrazy na zawsze** |
| skrypty | Excel Online, Automate | nazwy dokladnie jak pliki w `scripts/` |

Cztery wartosci do podmiany w sciagach: `<WITRYNA>`, `<BIBLIOTEKA>`, `<EKSPORT>`,
`<SERWIS>`, plus `<MAPA>` przy stronie mapy.

---

## Migracja pierwszego serwisu

| # | Krok | Czas | Sprawdz po kroku |
|---|---|---|---|
| 1 | [00](00-przygotowanie.md) sekcja E — zaladuj liste migracyjna z `index.html` | 2 min | tyle wierszy, ile stron; wszystkie `Pending`; `Service` wypelniony |
| 2 | [00](00-przygotowanie.md) sekcja A — uzupelnij wybory `Category` | 5 min | po jednym wyborze na galaz (wiersze z `Depth` = 1), bez numeru |
| 3 | [01-MigratePages](01-MigratePages.md), `Top Count` = `1` | 1 min | **obejrzyj te strone dokladnie**: naglowki, ramki, obrazy |
| 4 | [01](01-MigratePages.md) ponownie, `Top Count` = `5000` | ~10 min | komplet `PageCreated`, `TargetPageId`, `TargetUrl` |
| 5 | [02-RemapLinks](02-RemapLinks.md) | 30–40 min | sciezka nadrzedna, dzialajace odnosniki, `ParentPageId` ≠ 0 |
| 6 | [04-OdswiezDrzewo](04-OdswiezDrzewo.md) | 2 min | mapa: korzen i galezie; `TreePath` wypelniony |

Krok 3 jest najwazniejszy w calej liscie. Blad parsera zauwazony na jednej stronie
kosztuje minute, zauwazony po kroku 5 kosztuje 40 minut powtorki.

**Przed krokiem 5** sprawdz w akcji `OdhaczWMapie`, czy pola poza `Id`, `Title`
i `MigrationStatus` sa puste. Wpisane tam zero kasuje hierarchie przy kazdej
iteracji — tak stracilismy ja 18 wrzesnia.

[03-BudujMape](03-BudujMape.md) pomijasz. Robil mape, zanim powstal krok 4;
dzis krok 4 robi to samo i obsluguje wiele serwisow.

---

## Kolejny serwis, na przykladzie Switchboard

Te same flow, zmieniasz dwie wartosci. Pelna procedura z lista kontrolna:
[06-KolejnySerwis](06-KolejnySerwis.md).

| # | Krok | Co innego niz wyzej |
|---|---|---|
| 1 | wiersz w `DT_Services` | `Title` Switchboard, `Code` **SWB** |
| 2 | wybor `SWB` w kolumnie `Service` | bez tego krok 1 padnie na pierwszej stronie |
| 3 | eksport do `confluence-export/SWB`, zalaczniki do `DocMedia` | osobny folder |
| 4 | [00](00-przygotowanie.md) sekcja E z `Service` = `SWB` | **dopisuje** wiersze, nie kasuje GMSC |
| 5 | wybory `Category` dla galezi Switchboarda | nowe nazwy galezi = nowe wybory |
| 6 | [01](01-MigratePages.md) z `<EKSPORT>` i `<SERWIS>` dla SWB | filtr bierze tylko wiersze SWB |
| 7 | [02](02-RemapLinks.md) z tymi samymi dwiema wartosciami | drzewo liczone osobno dla SWB |
| 8 | [04](04-OdswiezDrzewo.md) | uruchom z `serwis` = `SWB` i wlasna strona mapy |

GMSC nie ucierpi, bo nazwy plikow zaczynaja sie od kodu serwisu
(`GMSC-Home-Page.aspx` i `SWB-Home-Page.aspx` to dwa rozne pliki), filtr w kroku 1
bierze tylko wiersze danego serwisu, a drzewo i odnosniki liczone sa per serwis.

---

## Serwis bez Confluence

Nowy serwis nie musi pochodzic z eksportu. Strony mozesz napisac wprost
w SharePoincie, ustawic `Service` i `ParentPageId`, uruchomic krok 4 — drzewo
i mapa zbuduja sie tak samo. Pelny poradnik: [07-RecznySerwis](07-RecznySerwis.md).

Dziala to dlatego, ze po migracji zrodlem prawdy jest biblioteka Site Pages,
a nie lista migracyjna. Krok 4 nie pyta, skad wziela sie strona.

## Mapa per serwis

Krok 4 pyta przy starcie o dwie rzeczy: **kod serwisu** i **nazwe strony mapy**.
Kazdy serwis moze miec wlasna strone:

| serwis | stronaMapy | efekt |
|---|---|---|
| `GMSC` | `Documentation-Map.aspx` | drzewo GMSC na stronie GMSC |
| `SWB` | `Documentation-Map-Switchboard.aspx` | drzewo Switchboarda na jego stronie |
| dowolny | *(puste)* | samo przeliczenie metadanych, bez ruszania map |

Metadane drzewa licza sie zawsze dla wszystkich serwisow, bo potrzebuje ich
aplikacja. Ogranicza sie tylko zawartosc strony mapy.

## Utrzymanie

Po migracji uruchamiasz **tylko krok 4**, i to po zmianach w strukturze:
nowa strona, usunieta strona, zmieniony rodzic albo tytul.

Dodanie strony recznie: napisz i opublikuj, ustaw `ParentPageId` na Id strony
nadrzednej oraz `Service`, uruchom krok 4. Strona bez `Service` nie wejdzie do
drzewa — biblioteka zawiera takze strony witryny spoza dokumentacji.
Strona z `Service`, ale bez rodzica, trafi na koniec mapy do sekcji
„Bez przypisania"; to sygnal, zeby uzupelnic kolumne.

Z poziomu aplikacji robi to [05-NowaStrona](05-NowaStrona.md), ktore wola krok 4
samo.

---

## Co sprawdzone, a co nowe

Uczciwy podzial, zebys wiedzial, gdzie patrzec, gdyby cos poszlo nie tak.

**Sprawdzone na produkcji (migracja GMSC):** tworzenie stron, parsowanie tresci
z cloakami, panelami, obrazami i galeziami decyzyjnymi, przepisywanie odnosnikow,
sciezka nadrzedna i blok podstron, metadane drzewa, budowa strony mapy.

**Nowe, nieuruchomione:** obsluga zakladek (pary jako dwie kolumny), migracja
per serwis, krok 4 jako nastepca kroku 3, poprawki odpornosciowe z audytu
(wiersze bez identyfikatora, cykle w hierarchii, znaki specjalne w tytulach).

Parser porownalem z wersja, ktora zadziala na produkcji, na osmiu typach stron
w obu trybach. Jedyna roznica w wyniku to usuniety osierocony `</div>` na koncu
tresci. Nic poza tym sie nie zmienilo, wiec strony bez zakladek wyjda tak samo
jak za pierwszym razem.
