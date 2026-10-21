# 4 — Ekran dokumentacji

Zakladki serwisow, rozwijane drzewo stron, wyszukiwarka. Klikniecie tytulu
otwiera strone SharePoint w nowej karcie.

> **Formuly do tego kroku:** [formuly/03-dokumentacja.txt](formuly/03-dokumentacja.txt)
> Otworz w widoku **Raw**, szukaj naglowka `### nazwaKontrolki.Wlasciwosc`
> (Ctrl+F) i kopiuj blok pod nim. Pierwszy raz w Power Apps?
> Zacznij od [00-powerapps-podstawy.md](00-powerapps-podstawy.md).

Drzewo czyta biblioteke Site Pages na zywo — zadnego flow do odswiezania
nie trzeba. Kolejnosc i wciecia biora sie z kolumn `ParentPageId`, `TreePath`
i `SortOrder`, ktore przelicza [flow 04](../flows/04-OdswiezDrzewo.md).

Wszystko na `scrDocs`, obszar tresci od X = `248`.

---

## A. Adres witryny w OnStart

Drzewo musi wiedziec, dokad linkowac. Zaznacz **App** → **OnStart** → dopisz
na koncu (podmien na swoj adres, bez ukosnika na koncu):

```
;Set(gWitrynaUrl, "https://TWOJA-DOMENA.sharepoint.com<WITRYNA>")
```

Przyklad calosci po podmianie: `https://firma.sharepoint.com/teams/Dzial/podwitryna`.

Potem **Run OnStart**.

---

## B. Wczytanie stron przy wejsciu na ekran

Zaznacz `scrDocs` → wlasciwosc **OnVisible**:

```
ClearCollect(colStrony,
    AddColumns(
        RenameColumns(
            ShowColumns(
                Filter('Site Pages', !IsBlank(TreePath)),
                "ID", "Title", "ParentPageId", "TreePath", "TreeSort", "SortOrder",
                "Service", "Name"
            ),
            "Name", "Plik"
        ),
        "Poziom", (Len(TreePath) - Len(Substitute(TreePath, "/", ""))) - 2
    )
);
ClearCollect(colSerwisy, SortByColumns(Filter(DT_Services, Aktywny), "Kolejnosc", Ascending));
If(IsBlank(gSerwis), Set(gSerwis, First(colSerwisy).Kod));
ClearCollect(colRozwiniete,
    ShowColumns(Filter(colStrony, Poziom = 0), "ID")
);
Set(gSzukaj, "")
```

Co to robi: pobiera strony majace wyliczona sciezke drzewa, dolicza kolumne
`Poziom` (glebokosc z liczby ukosnikow w `TreePath`), wczytuje liste serwisow
i rozwija korzen kazdego z nich.

Strony bez `TreePath` sa pomijane — to strony spoza drzewa, w tym sama mapa.

---

## C. Naglowek i zakladki serwisow

**Text label** `lblDocsTytul`: X `248`, Y `24`, Width `500`, Height `40`,
Size `24`, FontWeight `FontWeight.Semibold`, Text `"Dokumentacja"`

### Zakladki

**Insert** → **Gallery** → **Blank horizontal**, nazwa `galSerwisy`:

| Wlasciwosc | Wartosc |
|---|---|
| Items | `colSerwisy` |
| X / Y | `248` / `76` |
| Width / Height | `1094` / `44` |
| TemplateSize | `160` |
| TemplatePadding | `0` |
| ShowScrollbar | `false` |

W szablonie galerii:

**Button** `btnSerwis`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `ThisItem.Title` |
| X / Y | `0` / `0` |
| Width / Height | `152` / `40` |
| Fill | `If(gSerwis = ThisItem.Kod, gKolorAkcent, RGBA(0,0,0,0))` |
| Color | `If(gSerwis = ThisItem.Kod, RGBA(255,255,255,1), gKolorTekst)` |
| BorderThickness | `0` |
| OnSelect | `Set(gSerwis, ThisItem.Kod)` |

Przy jednym serwisie widac jedna zakladke. Kolejne dochodza same po dopisaniu
wierszy do `DT_Services` i ustawieniu kolumny `Service` na stronach.

---

## D. Wyszukiwarka

**Text input** `txtSzukaj`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `248` / `136` |
| Width / Height | `420` / `40` |
| HintText | `"Szukaj w tytulach stron"` |
| OnChange | `Set(gSzukaj, txtSzukaj.Text)` |

Zeby wyniki pojawialy sie w trakcie pisania, ustaw zamiast tego:

| Wlasciwosc | Wartosc |
|---|---|
| OnChange | `Set(gSzukaj, Self.Text)` |

**Icon** → **Cancel**, nazwa `icoCzysc`: X `628`, Y `146`, Width/Height `20`,
Visible `!IsBlank(gSzukaj)`, OnSelect:
```
Reset(txtSzukaj); Set(gSzukaj, "")
```

**Text label** `lblLicznik`: X `690`, Y `136`, Width `300`, Height `40`,
Color `gKolorSzary`, Size `11`, Text:
```
CountRows(Filter(colStrony, Service = gSerwis)) & " stron w tym serwisie"
```

---

## E. Drzewo

**Insert** → **Gallery** → **Blank vertical**, nazwa `galDrzewo`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `248` / `192` |
| Width / Height | `1094` / `460` |
| TemplateSize | `40` |
| TemplatePadding | `0` |

Items — **cala formula**:

```
SortByColumns(
    Filter(colStrony As s,
        s.Service = gSerwis,
        If(IsBlank(gSzukaj),
            s.Poziom = 0 ||
            CountRows(
                Filter(colRozwiniete As r, r.ID <> s.ID && "/" & r.ID & "/" in s.TreePath)
            ) = s.Poziom,
            gSzukaj in s.Title
        )
    ),
    "TreeSort", Ascending
)
```

Jak to dziala: przy pustej wyszukiwarce wiersz jest widoczny, gdy jest korzeniem
albo gdy **wszyscy** jego przodkowie sa rozwinieci. Liczba przodkow to `Poziom`,
a sprawdzenie przynaleznosci robi `"/id/" in TreePath`. Przy wpisanym szukaniu
drzewo splaszcza sie do listy pasujacych tytulow.

### Zawartosc wiersza

**Icon** → **ChevronRight**, nazwa `icoChevron`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `8 + ThisItem.Poziom * 24` |
| Y | `10` |
| Width / Height | `20` |
| Color | `gKolorSzary` |
| Visible | `CountRows(Filter(colStrony, ParentPageId = ThisItem.ID)) > 0 && IsBlank(gSzukaj)` |
| Rotation | `If(ThisItem.ID in colRozwiniete.ID, 90, 0)` |

OnSelect:
```
If(ThisItem.ID in colRozwiniete.ID,
    Remove(colRozwiniete, LookUp(colRozwiniete, ID = ThisItem.ID)),
    Collect(colRozwiniete, {ID: ThisItem.ID})
)
```

**Text label** `lblStrona`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `34 + ThisItem.Poziom * 24` |
| Y | `8` |
| Width | `700` |
| Height | `24` |
| Text | `ThisItem.Title` |
| Color | `gKolorAkcent` |
| Underline po najechaniu | ustaw **HoverColor** na `gKolorTekst` |
| OnSelect | `Launch(gWitrynaUrl & "/SitePages/" & ThisItem.Plik, {}, LaunchTarget.New)` |

**Text label** `lblSciezkaStrony` — pomocniczo, numer poziomu i kategoria:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `800` / `8` |
| Width / Height | `280` / `24` |
| Size | `10` |
| Color | `gKolorSzary` |
| Align | `Align.Right` |
| Text | `If(IsBlank(gSzukaj), "", "poziom " & ThisItem.Poziom + 1)` |

**Rectangle** `recWierszLinia` (cienka linia pod wierszem): X `0`, Y `39`,
Width `Parent.TemplateWidth`, Height `1`, Fill `RGBA(0,0,0,0.06)`.

---

## F. Rozwin i zwin wszystko

**Button** `btnRozwin`: X `1010`, Y `136`, Width `150`, Height `40`,
Text `"Rozwin wszystko"`, Fill `gKolorSzary`, OnSelect:
```
ClearCollect(colRozwiniete, ShowColumns(colStrony, "ID"))
```

**Button** `btnZwin`: X `1172`, Y `136`, Width `150`, Height `40`,
Text `"Zwin wszystko"`, Fill `gKolorSzary`, OnSelect:
```
ClearCollect(colRozwiniete, ShowColumns(Filter(colStrony, Poziom = 0), "ID"))
```

---

## G. Odswiezenie po zmianach w SharePoincie

**Icon** → **Reload**, nazwa `icoOdswiezDocs`: X `1300`, Y `30`, Width/Height `28`,
Color `gKolorSzary`, OnSelect:
```
Refresh('Site Pages'); Refresh(DT_Services); Select(Parent)
```

Zamiast `Select(Parent)` mozesz przejsc na inny ekran i wrocic — chodzi o to,
zeby wykonal sie **OnVisible** ekranu, ktory buduje kolekcje od nowa.
Najprosciej dopisac na koncu OnSelect ikony cala formule z punktu B.

---

## H. Sprawdzenie

1. **Alt + klik** → widac korzen serwisu, chevron przy stronach majacych podstrony
2. klikniecie chevronu rozwija jeden poziom, tytul otwiera strone w nowej karcie
3. wpisanie frazy splaszcza drzewo do pasujacych tytulow, krzyzyk czysci
4. **Rozwin wszystko** pokazuje cala strukture

Jesli drzewo jest puste: strony nie maja `TreePath` — uruchom
[flow 04](../flows/04-OdswiezDrzewo.md). Jesli widac tylko korzen i nic sie nie
rozwija: sprawdz, czy `ParentPageId` wskazuje na **Id strony** z biblioteki,
a nie na id z Confluence.

## I. Co dalej

- **Ostatnio zmienione** — dodatkowa galeria obok drzewa:
  `FirstN(SortByColumns(Filter('Site Pages', Service = gSerwis), "Modified", Descending), 8)`
- **Ulubione** — kolumna `IsImportant` w Site Pages plus filtr w zakladce
- **Wyszukiwanie w tresci**, nie tylko w tytulach, wymaga flow z `_api/search/query`;
  drzewo zostaje bez zmian, dochodzi osobny ekran wynikow
