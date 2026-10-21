# 0 — Power Apps dla osoby, ktora zna Power Automate

Przeczytaj raz, w calosci, przed pierwszym klikniecim. Potem wracaj do sekcji
„Co robic, gdy…" na koncu. Zajmie 15 minut i oszczedzi kilka godzin.

---

## NAJPIERW TO: przecinek czy srednik

Power Apps rozdziela argumenty funkcji **przecinkiem albo srednikiem, zaleznie
od jezyka konta**. Przy polskich ustawieniach `Filter(dane, warunek)` jest bledem,
bo oczekiwane jest `Filter(dane; warunek)`.

Wszystkie formuly w tym repo sa zapisane **z przecinkami**, czyli po angielsku.
Zeby dzialaly bez przerabiania, przestaw jezyk autora:

1. make.powerapps.com → ikona zebatki w prawym gornym rogu → **Settings**
2. **Language settings** → **Author language** → **English (United States)**
3. odswiez strone

Nie zmienia to jezyka interfejsu Windows ani tego, co widza uzytkownicy aplikacji.
Zmienia tylko sposob zapisu formul. Jesli wolisz zostawic polski, musisz w kazdej
wklejanej formule zamienic `,` na `;` — przy stu formulach to proszenie sie o bledy.

Sprawdzenie: wstaw dowolna etykiete i wklej w jej `Text`:
```
Concatenate("a", "b")
```
Jesli widzisz `ab`, jestes gotowy. Jesli blad — jezyk nie przestawil sie.

---

## Czym to sie rozni od Power Automate

To najwazniejsza rzecz do zrozumienia.

**Power Automate to przepis**: kroki wykonuja sie po kolei, raz, od gory do dolu.
Zmienna ma wartosc, bo wczesniejszy krok ja ustawil.

**Power Apps to arkusz kalkulacyjny**: wlasciwosci kontrolek zawieraja formuly,
ktore przeliczaja sie **same**, gdy zmieni sie cokolwiek, od czego zaleza.
Nie ma „kolejnosci krokow" dla wygladu. Jesli etykieta ma w `Text` formule
`CountRows(DT_Breaks)`, to liczba zmienia sie sama, gdy ktos doda przerwe.

Konsekwencje, ktore zaskakuja na poczatku:

| W Power Automate | W Power Apps |
|---|---|
| zmienna istnieje po kroku „Initialize variable" | zmienna istnieje po wykonaniu `Set(...)`, czyli zwykle po **Run OnStart** |
| akcje dziala sie po kolei | formuly wygladu nie maja kolejnosci; kolejnosc jest tylko wewnatrz jednego `OnSelect`, gdzie oddzielasz polecenia **srednikiem** |
| petla „Apply to each" | nie ma petli dla wygladu; galeria sama rysuje wiersz na kazdy rekord |
| wynik akcji bierzesz z `body('Akcja')` | wynik kontrolki bierzesz z `Nazwa.Wlasciwosc`, np. `txt_NewPage_Title.Text` |

Jedyne miejsce, gdzie myslisz „krokami", to `OnSelect` przycisku: tam polecenia
wykonuja sie po kolei, rozdzielone srednikiem.

---

## Studio: co jest gdzie

Po otwarciu aplikacji do edycji widzisz cztery obszary.

**1. Pasek formuly (gora, na calej szerokosci)**
Tu wklejasz kod. Po lewej stronie paska jest **lista rozwijana z nazwa
wlasciwosci** — zanim wkleisz, musisz w niej wybrac wlasciwa pozycje
(`Text`, `OnSelect`, `Fill`, `Items`…). To najczestszy blad poczatkujacego:
wklejenie formuly w `Text`, gdy miala pojsc w `Items`.

Strzalka w prawym koncu paska rozwija go na kilka linii — przydaje sie przy
dlugich formulach.

**2. Drzewo (lewa kolumna, zakladka Tree view)**
Lista ekranow, a w kazdym lista kontrolek. Klikniecie zaznacza, **dwuklik na
nazwie** pozwala ja zmienic. Kolejnosc na liscie to kolejnosc warstw: pozycja
**wyzej na liscie = na wierzchu**. Gdy kontrolka chowa sie pod prostokatem,
przeciagnij ja w drzewie wyzej.

**3. Panel wlasciwosci (prawa kolumna)**
Te same wlasciwosci, ale w formie pol i suwakow. Wygodny do rozmiarow i kolorow.
Zakladka **Advanced** w tym panelu pokazuje wszystkie wlasciwosci jako pola
tekstowe — to alternatywa dla paska formuly, czesto szybsza przy przepisywaniu
wielu wartosci z instrukcji.

**4. Lewy pasek ikon**
- **Insert** — dodawanie kontrolek (etykiety, przyciski, galerie)
- **Data** — zrodla danych: listy SharePoint, konektory
- **Power Automate** — podlaczanie flow do aplikacji
- **Tree view** — drzewo z punktu 2

---

## Pojecia, ktore wystepuja w instrukcjach

**Kontrolka** — element na ekranie: etykieta, przycisk, prostokat, galeria.

**Wlasciwosc** — cecha kontrolki: `Text`, `X`, `Y`, `Width`, `Fill`, `Visible`.
Kazda moze byc liczba, tekstem albo formula.

**Galeria (Gallery)** — powtarzalna lista. Dajesz jej w `Items` zbior rekordow,
a ona rysuje ten sam uklad dla kazdego. Wewnatrz galerii piszesz `ThisItem.Tytul`,
zeby odwolac sie do pola biezacego wiersza. To odpowiednik `Apply to each`,
tylko dla wygladu.

**Zmienna globalna** — `Set(gblToday, Today())`. Widoczna na wszystkich ekranach.
Nasze zmienne maja prefiks `gbl` (patrz [KONWENCJE.md](KONWENCJE.md)).

**Kolekcja** — tabela trzymana w pamieci aplikacji:
`ClearCollect(colStrony, ...)`. Uzywamy jej, gdy dane trzeba przeliczyc raz
i potem z nich korzystac wielokrotnie.

**`OnStart`** (wlasciwosc obiektu **App**) — wykonuje sie raz, przy
uruchomieniu aplikacji. Tu ustawiamy kolory i zmienne.

**`OnVisible`** (wlasciwosc ekranu) — wykonuje sie przy kazdym wejsciu na
ten ekran. Tu budujemy kolekcje.

**`OnSelect`** — co ma sie stac po klikniecu.

**`Patch`** — zapis do listy SharePoint. `Patch(Lista, Defaults(Lista), {...})`
dodaje nowy wiersz, `Patch(Lista, istniejacyRekord, {...})` zmienia istniejacy.

---

## Jak dodac kontrolke, krok po kroku

Instrukcje w kolejnych plikach pisza skrotem: „**Insert** → **Text label**,
nazwa `lbl_Home_Greeting`, X `248`, Y `24`, Text `"Czesc"`". Rozwiniecie:

1. **Insert** w lewym pasku → kliknij **Text label**. Kontrolka pojawia sie
   na srodku ekranu z nazwa `Label1`.
2. W drzewie dwuklik na `Label1` → wpisz `lbl_Home_Greeting` → Enter.
   **Nazwy musza byc dokladnie takie jak w instrukcji** — inne formuly sie
   do nich odwoluja.
3. Zaznacz kontrolke. W pasku formuly wybierz z listy wlasciwosc `X`,
   wpisz `248`, Enter. To samo dla `Y`.
4. Wybierz `Text`, wklej `"Czesc"` (z cudzyslowami — to tekst, nie formula).

Rozmiary i pozycje mozesz tez ustawic w panelu po prawej, w polach
X / Y / Width / Height. Szybciej niz przez pasek formuly.

**Kopiowanie zamiast wstawiania**: gdy potrzebujesz trzeciej podobnej etykiety,
zaznacz gotowa, Ctrl+C, Ctrl+V i zmien tylko to, co sie rozni. Kopia dostaje
nazwe `lbl_Home_Greeting_1` — zmien ja na wlasciwa.

---

## Testowanie

**Alt + klik** — w trybie edycji przytrzymaj Alt i klikaj; aplikacja reaguje
jak uruchomiona, ale nadal mozesz edytowac. Tak sprawdzasz 90% rzeczy.

**F5** — pelny podglad w nowym okienku. **Esc** wychodzi.

**Run OnStart** — trzy kropki przy obiekcie **App** w drzewie → **Run OnStart**.
Konieczne po **kazdej** zmianie w `OnStart`, bo zmienne nie przeliczaja sie same.
Gdy aplikacja zachowuje sie dziwnie i widzisz puste kolory — zwykle o to chodzi.

**Ctrl+S** — zapis wersji. **Publish** (prawy gorny rog) — udostepnienie
uzytkownikom. To rozroznienie jak w Power Automate: zapisany flow to nie to samo
co wlaczony. Dopoki nie klikniesz Publish, zespol widzi poprzednia wersje.

---

## Delegowanie: ostrzezenie z niebieska kropka

Power Apps czasem podkresla formule i pisze, ze „delegowanie moze byc
niepelne". Znaczy to: filtrowanie wykona sie **w aplikacji, na pierwszych
500 rekordach**, a nie po stronie SharePointa.

Kiedy to problem: lista ma wiecej niz 500 wierszy i filtr moze wskazywac
dalsze. Kiedy nie: nasze listy przerw i raportow maja po kilkadziesiat wierszy
na tydzien.

Gdzie to nam dotyczy: nigdzie krytycznie. W kilku miejscach swiadomie uzywamy
`AddColumns` i `LookUp`, ktore nie deleguja — przy rozmiarach naszych list
to bez znaczenia. Limit mozna podniesc do 2000: **Settings** → **General** →
**Data row limit**.

---

## Co robic, gdy…

**Formula jest czerwona.** Najedz na podkreslenie — pojawi sie opis bledu.
Najczestsze przyczyny: zly separator (patrz sekcja o przecinku), literowka
w nazwie kontrolki, formula wklejona w niewlasciwa wlasciwosc.

**„Name isn't valid" przy nazwie kontrolki.** Odwolujesz sie do kontrolki,
ktorej jeszcze nie ma albo ma inna nazwe. Sprawdz pisownie w drzewie.

**Zmienna jest pusta, kolory sa czarno-biale.** Nie wykonal sie `OnStart`.
Trzy kropki przy **App** → **Run OnStart**.

**Kontrolka zniknela.** Prawdopodobnie jest pod inna. W drzewie przeciagnij
ja wyzej na liscie.

**Zdjecia profilowe sie nie pokazuja.** Konektor Office 365 Users potrzebuje
chwili przy pierwszym uruchomieniu; przy dalszych brakach sprawdz, czy adres
e-mail w `DT_Rota` jest prawdziwy.

**Galeria jest pusta, choc lista ma dane.** Sprawdz `Items` — czy filtr nie
odcina wszystkiego (np. `Data = gblToday`, a w liscie nie ma dzisiejszej daty).

**„Incompatible types for comparison" przy filtrze.** Kolumna typu **Wybor**
(Choice) w SharePoincie to w Power Apps **rekord**, nie tekst. Zawsze piszesz
`Kolumna.Value`, np. `ShiftType.Value = "Work"`, nigdy `ShiftType = "Work"`.
To najczestsza przyczyna czerwonych formul w tej aplikacji.

**Ostrzezenie „deprecated" przy nazwach kolumn w cudzyslowach.** W nowszych
aplikacjach Power Fx woli identyfikatory zamiast tekstow w `AddColumns`
czy `SortByColumns`. To ostrzezenie, nie blad — formuly dzialaja.

**Nie wiem, gdzie wkleic formule.** Naglowek w pliku formul ma postac
`### nazwaKontrolki.Wlasciwosc` — zaznacz te kontrolke w drzewie, wybierz
te wlasciwosc w pasku formuly, wklej blok pod naglowkiem.

**Zepsulem cos i nie wiem co.** Ctrl+Z dziala wielokrotnie. Gorzej: plik →
**See all versions** → przywroc poprzednia wersje.

---

## Gdzie sa formuly

Zeby nie przepisywac kodu z opisow, wszystkie formuly leza osobno w
[formuly/](formuly/), po jednym pliku na obszar aplikacji. Otwierasz plik
w widoku **Raw** na GitHubie, szukasz naglowka (Ctrl+F) i kopiujesz blok.

Instrukcje w kolejnych plikach podaja, ktora kontrolke zalozyc i jakie
nadac jej rozmiary; formuly bierzesz z plikow obok. Tam, gdzie formula jest
jednolinijkowa i krotka, jest wpisana wprost w instrukcji.

---

## Kolejnosc dalej

1. [01-listy.md](01-listy.md) — listy SharePoint, zrodlo danych aplikacji
2. [02-szkielet.md](02-szkielet.md) — aplikacja, nawigacja, kolory
3. [03-home.md](03-home.md) — ekran glowny
4. [04-dokumentacja.md](04-dokumentacja.md) — drzewo dokumentacji
5. [05-nowa-strona.md](05-nowa-strona.md) — dodawanie stron

Po kazdym kroku jest sekcja „Sprawdzenie" — zrob ja, zanim przejdziesz dalej.
Blad znaleziony od razu kosztuje minute, znaleziony po trzech ekranach — godzine.
