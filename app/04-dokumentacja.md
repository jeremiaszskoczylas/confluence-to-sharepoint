# 4 — Ekran dokumentacji

Zakladki serwisow, rozwijane drzewo stron, wyszukiwarka. Klikniecie tytulu
otwiera strone SharePoint w nowej karcie.

> **Formuly do tego kroku:** [formuly/03-dokumentacja.txt](formuly/03-dokumentacja.txt)
> Otworz w widoku **Raw**, szukaj naglowka `### nazwaKontrolki.Wlasciwosc`
> (Ctrl+F) i kopiuj blok pod nim. Pierwszy raz w Power Apps?
> Zacznij od [00-powerapps-podstawy.md](00-powerapps-podstawy.md).

Drzewo czyta biblioteke Site Pages na zywo — zadnego flow do odswiezania
nie trzeba. SortOrder i wciecia biora sie z kolumn `ParentPageId`, `TreePath`
i `SortOrder`, ktore przelicza [flow 04](../flows/04-OdswiezDrzewo.md).

> **Zanim otworzysz ten ekran pierwszy raz, uruchom
> [flow 04-OdswiezDrzewo](../flows/04-OdswiezDrzewo.md).** Krok 2 migracji zapisuje
> `TreePath`, ale dopiero krok 4 przelicza calosc dla biblioteki i uzupelnia strony
> zalozone recznie. Bez tego drzewo pokaze same korzenie, a chevrony nie beda reagowac.

Wszystko na `scr_Docs`, obszar tresci od X = `248`.

---

## A. Adres witryny w OnStart

Drzewo musi wiedziec, dokad linkowac. Zaznacz **App** → **OnStart** → dopisz
na koncu (podmien na swoj adres, bez ukosnika na koncu):

```
;Set(gblSiteUrl, "https://TWOJA-DOMENA.sharepoint.com<WITRYNA>")
```

Przyklad calosci po podmianie: `https://firma.sharepoint.com/teams/Dzial/podwitryna`.

Potem **Run OnStart**.

---

## B. Wczytanie stron przy wejsciu na ekran

Zaznacz `scr_Docs` → wlasciwosc **OnVisible**:

```
ClearCollect(colPages,
    AddColumns(
        RenameColumns(
            ShowColumns(
                Filter('Site Pages', !IsBlank(TreePath)),
                "ID", "Title", "ParentPageId", "TreePath", "TreeSort", "SortOrder",
                "Service", "Name"
            ),
            "Name", "FileName"
        ),
        "Depth", (Len(TreePath) - Len(Substitute(TreePath, "/", ""))) - 2
    )
);
ClearCollect(colServices, SortByColumns(Filter(DT_Services, IsActive), "SortOrder", Ascending));
If(IsBlank(gblService), Set(gblService, First(colServices).Code));
ClearCollect(colExpanded,
    ShowColumns(Filter(colPages, Depth = 0), "ID")
);
Set(gblSearch, "")
```

Co to robi: pobiera strony majace wyliczona sciezke drzewa, dolicza kolumne
`Depth` (glebokosc z liczby ukosnikow w `TreePath`), wczytuje liste serwisow
i rozwija korzen kazdego z nich.

Strony bez `TreePath` sa pomijane — to strony spoza drzewa, w tym sama mapa.

---

## C. Naglowek i zakladki serwisow

**Text label** `lbl_Docs_Title`: X `248`, Y `24`, Width `500`, Height `40`,
Size `24`, FontWeight `FontWeight.Semibold`, Text `"Dokumentacja"`

### Zakladki

**Insert** → **Gallery** → **Blank horizontal**, nazwa `gal_Docs_Services`:

| Wlasciwosc | Wartosc |
|---|---|
| Items | `colServices` |
| X / Y | `248` / `76` |
| Width / Height | `1094` / `44` |
| TemplateSize | `160` |
| TemplatePadding | `0` |
| ShowScrollbar | `false` |

W szablonie galerii:

**Button** `btn_Service_Tab`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `ThisItem.Title` |
| X / Y | `0` / `0` |
| Width / Height | `152` / `40` |
| Fill | `If(gblService = ThisItem.Code, gblColorAccent, RGBA(0,0,0,0))` |
| Color | `If(gblService = ThisItem.Code, RGBA(255,255,255,1), gblColorText)` |
| BorderThickness | `0` |
| OnSelect | `Set(gblService, ThisItem.Code)` |

Przy jednym serwisie widac jedna zakladke. Kolejne dochodza same po dopisaniu
wierszy do `DT_Services` i ustawieniu kolumny `Service` na stronach.

---

## D. Wyszukiwarka

**Text input** `txt_Docs_Search`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `248` / `136` |
| Width / Height | `420` / `40` |
| HintText | `"Szukaj w tytulach stron"` |
| OnChange | `Set(gblSearch, txt_Docs_Search.Text)` |

Zeby wyniki pojawialy sie w trakcie pisania, ustaw zamiast tego:

| Wlasciwosc | Wartosc |
|---|---|
| OnChange | `Set(gblSearch, Self.Text)` |

**Icon** → **Cancel**, nazwa `ico_Docs_ClearSearch`: X `628`, Y `146`, Width/Height `20`,
Visible `!IsBlank(gblSearch)`, OnSelect:
```
Reset(txt_Docs_Search); Set(gblSearch, "")
```

**Text label** `lbl_Docs_Subtitle`: X `690`, Y `136`, Width `300`, Height `40`,
Color `gblColorMuted`, Size `11`, Text:
```
CountRows(Filter(colPages, Service = gblService)) & " stron w tym serwisie"
```

---

## E. Drzewo

**Insert** → **Gallery** → **Blank vertical**, nazwa `gal_Docs_Tree`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `248` / `192` |
| Width / Height | `1094` / `460` |
| TemplateSize | `40` |
| TemplatePadding | `0` |

Items — **cala formula**:

```
SortByColumns(
    Filter(colPages As s,
        s.Service = gblService,
        If(IsBlank(gblSearch),
            s.Depth = 0 ||
            CountRows(
                Filter(colExpanded As r, r.ID <> s.ID && "/" & r.ID & "/" in s.TreePath)
            ) = s.Depth,
            gblSearch in s.Title
        )
    ),
    "TreeSort", Ascending
)
```

Jak to dziala: przy pustej wyszukiwarce wiersz jest widoczny, gdy jest korzeniem
albo gdy **wszyscy** jego przodkowie sa rozwinieci. Liczba przodkow to `Depth`,
a sprawdzenie przynaleznosci robi `"/id/" in TreePath`. Przy wpisanym szukaniu
drzewo splaszcza sie do listy pasujacych tytulow.

### Zawartosc wiersza

**Icon** → **ChevronRight**, nazwa `ico_Tree_Chevron`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `8 + ThisItem.Depth * 24` |
| Y | `10` |
| Width / Height | `20` |
| Color | `gblColorMuted` |
| Visible | `CountRows(Filter(colPages, ParentPageId = ThisItem.ID)) > 0 && IsBlank(gblSearch)` |
| Rotation | `If(ThisItem.ID in colExpanded.ID, 90, 0)` |

OnSelect:
```
If(ThisItem.ID in colExpanded.ID,
    Remove(colExpanded, LookUp(colExpanded, ID = ThisItem.ID)),
    Collect(colExpanded, {ID: ThisItem.ID})
)
```

**Text label** `lbl_Tree_Page`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `34 + ThisItem.Depth * 24` |
| Y | `8` |
| Width | `700` |
| Height | `24` |
| Text | `ThisItem.Title` |
| Color | `gblColorAccent` |
| Underline po najechaniu | ustaw **HoverColor** na `gblColorText` |
| OnSelect | `Launch(gblSiteUrl & "/SitePages/" & ThisItem.FileName, {}, LaunchTarget.New)` |

**Text label** `lbl_Tree_Meta` — pomocniczo, numer poziomu i kategoria:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `800` / `8` |
| Width / Height | `280` / `24` |
| Size | `10` |
| Color | `gblColorMuted` |
| Align | `Align.Right` |
| Text | `If(IsBlank(gblSearch), "", "poziom " & ThisItem.Depth + 1)` |

**Rectangle** `rec_Tree_RowLine` (cienka linia pod wierszem): X `0`, Y `39`,
Width `Parent.TemplateWidth`, Height `1`, Fill `RGBA(0,0,0,0.06)`.

---

## F. Rozwin i zwin wszystko

**Button** `btn_Docs_ExpandAll`: X `1010`, Y `136`, Width `150`, Height `40`,
Text `"Rozwin wszystko"`, Fill `gblColorMuted`, OnSelect:
```
ClearCollect(colExpanded, ShowColumns(colPages, "ID"))
```

**Button** `btn_Docs_CollapseAll`: X `1172`, Y `136`, Width `150`, Height `40`,
Text `"Zwin wszystko"`, Fill `gblColorMuted`, OnSelect:
```
ClearCollect(colExpanded, ShowColumns(Filter(colPages, Depth = 0), "ID"))
```

---

## G. Odswiezenie po zmianach w SharePoincie

**Icon** → **Reload**, nazwa `ico_Docs_Refresh`: X `1140`, Y `32`, Width/Height `28`,
Color `gblColorMuted`, OnSelect:
```
// pelna formula: formuly/03-dokumentacja.txt, naglowek ico_Docs_Refresh.OnSelect
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
  `FirstN(SortByColumns(Filter('Site Pages', Service = gblService), "Modified", Descending), 8)`
- **Ulubione** — kolumna `IsImportant` w Site Pages plus filtr w zakladce
- **Wyszukiwanie w tresci**, nie tylko w tytulach, wymaga flow z `_api/search/query`;
  drzewo zostaje bez zmian, dochodzi osobny ekran wynikow
