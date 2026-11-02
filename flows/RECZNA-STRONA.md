# Reczne odtworzenie strony — sciaga

Do czego to sluzy: niektorych stron krok 2 nie udzwignie. Przy zrodle powyzej
mniej wiecej 130 KB `savepageasdraft` zwraca 200, ale SharePoint kanwy nie
zapisuje — powstaje pusta strona, ktorej edytor nie otwiera. Taka strone sklada
sie raz recznie i oznacza w liscie migracyjnej statusem `Manual`
([00-przygotowanie](00-przygotowanie.md), sekcja B).

Ten plik mowi, **co dokladnie generuje `parseTresc`**, zeby strona zlozona
recznie wygladala jak pozostale i nie odstawala od nich.

Zasada nadrzedna: **kopiuj z przegladarki, nie z kodu**. Edytor SharePointa przy
wklejaniu sam przenosi pogrubienia, kolory, tabele i obrazki. Ta sciaga jest na
to, czego nie przeniesie, i na decyzje o strukturze.

---

## Zanim zaczniesz: widoczna kopia zrodla

Cloaki sa w eksporcie ukryte atrybutem `display: none`, a skrypt odslania je,
usuwajac wszystkie atrybuty `style`. Zrob to samo recznie, na kopii:

1. skopiuj plik `.html` z eksportu na pulpit pod nowa nazwa
2. otworz w Notatniku
3. `Ctrl+H`: `display: none` → `display: block` → **Replace All**
4. `Ctrl+H`: `display:none` → `display:block` → **Replace All**
5. zapisz, otworz w przegladarce

Teraz widzisz cala tresc naraz, z obrazkami. Oryginal zostaje nietkniety.
Kopiujesz **tylko z tej kopii**.

---

## Docelowy uklad strony, z gory na dol

| # | Element | Skad sie bierze |
|---|---|---|
| 1 | sciezka okruszkowa — maly tekst, odnosniki rozdzielone `›` | krok 2, parametr `nag` |
| 2 | tytul strony jako **Heading 1** | kolumna `Title` w liscie |
| 3 | pozioma linia | zawsze pod tytulem |
| 4 | ramka „Na tej stronie" | tylko gdy strona ma **wiecej niz jeden** cloak |
| 5 | tresc — sekcje zwijane albo kolumny, zaleznie od zakladek | struktura strony w Confluence |
| 6 | pozioma linia | zawsze nad ramka podstron |
| 7 | ramka „Podstrony — N:" | tylko gdy strona ma podstrony |

Punkty 1, 6 i 7 dokladasz sam — krok 2 ich dla strony `Manual` nie wstawi.

---

## Czego NIE kopiowac

Skrypt wyrzuca to ze zrodla. Jesli skopiujesz, Twoja strona bedzie odstawac:

- **spis tresci** z gory strony (makro Table of Contents) — w SharePoincie jego
  role przejmuje ramka „Na tej stronie"
- **Change History** — naglowek i wszystko do nastepnego naglowka
- **ikonki Confluence** (male obrazki z `images/icons/`) — w kanwie zostaja
  pustymi ramkami
- **puste akapity i naglowki** — skrypt przepuszcza je trzy razy, bo
  w eksporcie jest ich duzo
- **menu zakladek** — w eksporcie statycznym jest puste, tytuly zakladek siedza
  w atrybutach paneli

Jedna rzecz, ktora skrypt przenosi, a Ty mozesz pominac: **sekcja komentarzy**.
Zakres tresci konczy sie na stopce, a komentarze leza przed nia, wiec strony
zmigrowane automatycznie je maja. Przy recznym skladaniu nic Cie nie zmusza do
ich kopiowania.

---

## Zakladki

Confluence: makro Tabs Container, panele `tabs-pane`, tytul w `data-pane-title`.

| Ile zakladek w grupie | Co robi skrypt | Co klikasz w edytorze |
|---|---|---|
| dokladnie 2 | dwie kolumny obok siebie, tytul zakladki jako **Heading 2** w kolumnie | **Add section** → **Two columns**, w kazdej kolumnie web part Text |
| 3 i wiecej | natywne sekcje zwijane, nazwa = tytul zakladki | **Add section** → **Collapsible section**, nazwa = tytul zakladki |

Przy sekcjach zwijanych:

- **rozwinieta zostaje ta, ktora w Confluence jest aktywna** (`active-pane`);
  jesli zadna nie jest aktywna — pierwsza
- pozostale zwiniete
- linia rozdzielajaca **wlaczona**, ikona po **lewej**

Tresc, ktora na stronie jest **przed** zakladkami albo **po** nich, idzie
do zwyklej sekcji na pelna szerokosc — nie do zwijanej.

Jesli na stronie jest kilka grup zakladek, kazda rozpatrujesz osobno: jedna
grupa moze dac dwie kolumny, a inna sekcje zwijane.

---

## Cloaki

Confluence: naglowek z `cloakToggle`, tresc ukryta pod nim.

Skrypt **rozwija je na plasko i numeruje**. SharePoint nie pozwala zagniezdzic
sekcji zwijanej w zwijanej, wiec cloaki wewnatrz zakladek tez laduja na plasko.

Dla kazdego cloaka:

- **Heading 2** o tresci `N. Tytul cloaka` — numeracja od 1, w kolejnosci
  wystepowania na stronie
- nad kazdym naglowkiem **pozioma linia** (poza pierwszym na stronie)
- tresc cloaka pod naglowkiem, normalnie

### Ramka „Na tej stronie"

Wstawiasz ja **tylko gdy cloakow jest wiecej niz jeden**, bezposrednio nad
naglowkiem `1. ...`. Tabela na pelna szerokosc, jedna komorka, maly tekst:

```
Na tej stronie — 3:
1. Pierwszy cloak
2. Drugi cloak
3. Trzeci cloak
```

Pierwsza linia pogrubiona, kazda pozycja to odnosnik do naglowka na tej samej
stronie. SharePoint sam robi kotwice z naglowkow — wstawiajac odnosnik, podaj
adres strony z `#` i tytulem naglowka zapisanym malymi literami z lacznikami
w miejsce spacji, na przyklad `#1-pierwszy-cloak`.

Najprosciej: wstaw odnosnik, przejdz do naglowka w przegladarce i sprawdz, czy
skacze. Jesli nie — popraw tekst po `#`.

---

## Cloak w akapicie: etykieta i tresc

Confluence: akapit, w nim przelacznik cloaka, krotka etykieta, a pod spodem
ukryta tresc. Typowo lista kontrolna.

Skrypt sklada z nich **tabele dwukolumnowa**: etykieta w lewej kolumnie
szerokiej na 15%, tresc w prawej. Kolejne takie pary trafiaja do **tej samej
tabeli**, jako nastepne wiersze.

Etykieta jest pogrubiona, a trzy warianty maja kolory:

| Etykieta | Jak wyglada |
|---|---|
| `Yes` albo `Tak` | zielony `#107C10`, ptaszek przed tekstem |
| `No` albo `Nie` | czerwony `#C4314B`, krzyzyk przed tekstem |
| cokolwiek innego | zwykle pogrubienie, bez koloru |

W edytorze: web part Text → **Insert table**, dwie kolumny, lewa wezsza.
Kolor tekstu ustawiasz z paska narzedzi.

---

## Makra informacyjne

Confluence: `confluence-information-macro`. Skrypt zamienia je na **tabele na
pelna szerokosc, jedna komorka, maly tekst**, z etykieta w pierwszej linii
(podkreslona, kolorowa) i trescia pod spodem.

| Typ w Confluence | Etykieta | Kolor |
|---|---|---|
| information | `INFO:` ze znakiem informacji | `#B7791F` |
| note | `UWAGA:` ze znakiem ostrzezenia | `#C4314B` |
| warning | `OSTRZEZENIE:` | `#C4314B` |
| tip | `WSKAZOWKA:` z ptaszkiem | `#107C10` |

Nierozpoznany typ dostaje `UWAGA:` bez koloru.

Akapity wewnatrz makra skrypt zbija w jeden blok z przejsciami do nowej linii,
wiec nie rob z nich osobnych akapitow.

---

## Obrazki

Przy wklejaniu z przegladarki edytor sam wgrywa obrazki do zasobow witryny
i podmienia adresy. To jest wariant zalecany — nic nie musisz robic.

Jesli ktorys wklei sie jako pusta ramka, wstaw go z biblioteki: web part
**Image** → **Site** → folder zalacznikow tej strony,
czyli `<ZALACZNIKI>/<ConfluenceId strony>/`.

Pliki maja tam nazwy czysto numeryczne, **bez rozszerzen** — rozpoznasz je
tylko po miniaturze.

### Zalaczniki do pobrania (pliki, maile)

Tu jest najwiecej dlubania, bo numeryczna nazwa bez rozszerzenia kliknieta
w SharePoincie sie nie otworzy.

1. w kodzie zrodlowym znajdz `data-linked-resource-default-alias` — ten atrybut
   trzyma **prawdziwa nazwe** kazdego zalacznika
2. skopiuj pliki z lokalnego eksportu i nadaj im te nazwy, z rozszerzeniem
3. wgraj do podfolderu w witrynie, np. `<ZALACZNIKI>/<ConfluenceId>/pliki/`
4. na stronie zaznacz tekst odnosnika → wstaw link → wklej adres pliku

---

## Linki

Co robi skrypt, zeby bylo wiadomo, czego sie spodziewac:

| Rodzaj odnosnika w zrodle | Gdzie prowadzi po migracji |
|---|---|
| do innej strony tego serwisu | na odpowiadajaca strone w SharePoincie |
| do strony innego serwisu albo pominietej | `#` |
| do profilu uzytkownika Confluence | `#` |
| do `index.html` | `#` |
| zewnetrzny `http`/`https` | bez zmian |

Przy recznym skladaniu: odnosniki wewnetrzne **popraw na adresy stron
w SharePoincie**. Nazwa pliku strony to zawsze `<KOD SERWISU>-<SourceFile
z .html zamienionym na .aspx>`, wiec adres zlozysz z listy migracyjnej, nie
musisz go szukac po bibliotece.

---

## Drobiazgi

- **wszystkie `Heading 1` ze zrodla staja sie `Heading 2`** — jedyny Heading 1
  na stronie to tytul u gory
- **nad kazdym `Heading 2` jest pozioma linia**, poza pierwszym na stronie
- **pola wyboru** (`checkbox` w zrodle) zamieniaja sie na znak `☐`
- **atrybuty `style` ze zrodla nie przechodza** — nie przenos kolorow tla ani
  szerokosci ze strony Confluence, poza tym, co opisane wyzej

---

## Sciezka okruszkowa i ramka podstron

Dla strony `Manual` krok 2 ich nie wstawi. Dokladasz raz, recznie.

### Sciezka okruszkowa (punkt 1 ukladu)

Na samej gorze, **nad tytulem**. Maly tekst, odnosniki do kolejnych stron
nadrzednych od korzenia serwisu, rozdzielone znakiem `›` ze spacjami:

```
Strona glowna serwisu › Galaz › Strona nadrzedna
```

Sama strona **nie wystepuje** w swojej sciezce.

### Ramka podstron (punkty 6 i 7)

Tylko gdy strona ma podstrony. Pozioma linia, pod nia tabela na pelna
szerokosc, jedna komorka, maly tekst:

```
Podstrony — 2:
Pierwsza podstrona
Druga podstrona
```

Pierwsza linia pogrubiona, kazda pozycja to odnosnik.

**Najszybsza droga dla obu:** otworz **inna, juz zmigrowana strone z tej samej
galezi**, wejdz w `Edit`, skopiuj gotowa sciezke albo ramke i podmien w niej
tresc. Wtedy formatowanie zgadza sie co do znaku.

---

## Kolejnosc pracy

1. widoczna kopia zrodla (sekcja na gorze tego pliku)
2. spis struktury na kartce: ile zakladek, jak sie nazywaja, gdzie cloaki
3. podgladnij **inna zmigrowana strone z zakladkami** — to Twoj wzorzec
4. zaloz strone, tytul dokladnie jak kolumna `Title` w liscie
5. tresc sekcjami: jedna zakladka = jedna sekcja = jeden web part Text
6. **`Save as draft` po kazdej sekcji**
7. obrazki i zalaczniki
8. sciezka okruszkowa i ramka podstron
9. `Publish`
10. nazwa pliku, kolumny strony, wiersz w liscie — dalsza czesc procedury
    w [00-przygotowanie](00-przygotowanie.md), sekcja B

Punkt 6 nie jest ostroznoscia na zapas. Dzielenie tresci na osobne web party
**jest tym, co omija limit** — jeden ogromny blok sie nie zapisze, piec
mniejszych sie zapisze. Jesli ktorys zapis sie nie uda, od razu wiesz, ktora
sekcja jest za duza, i rozbijasz ja na dwa web party po naglowkach.

---

## Lista kontrolna na koniec

- [ ] tytul strony zgadza sie z kolumna `Title` w liscie migracyjnej
- [ ] jeden `Heading 1` (tytul), wszystkie pozostale naglowki to `Heading 2`
- [ ] pozioma linia pod tytulem i nad kazdym `Heading 2` poza pierwszym
- [ ] liczba sekcji zwijanych = liczba zakladek w Confluence
- [ ] rozwinieta jest ta sekcja, ktora w Confluence byla aktywna
- [ ] cloaki ponumerowane od 1, w kolejnosci ze strony
- [ ] ramka „Na tej stronie" jest, jesli cloakow jest wiecej niz jeden,
      i wszystkie jej odnosniki skacza
- [ ] zaden obrazek nie jest pusta ramka
- [ ] kazdy zalacznik ma prawdziwa nazwe z rozszerzeniem i otwiera sie po
      klikniecu
- [ ] odnosniki wewnetrzne prowadza na strony w SharePoincie, nie do plikow
      `.html`
- [ ] sciezka okruszkowa na gorze, bez samej tej strony
- [ ] nie przenioslo sie: spis tresci, Change History, ikonki Confluence
- [ ] strona otwiera sie i **da sie na niej kliknac `Edit`** — jesli nie,
      kanwa jest za duza i trzeba rozbic najwiekszy web part
