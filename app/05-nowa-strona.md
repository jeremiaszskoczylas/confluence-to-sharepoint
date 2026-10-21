# 5 — Dodawanie nowej strony dokumentacji

Przycisk w zakladce Dokumentacja otwiera okno: tytul, serwis, kategoria
i wybor miejsca w drzewie. Po zatwierdzeniu strona powstaje w SharePoincie
i otwiera sie do edycji.

> **Formuly do tego kroku:** [formuly/04-nowa-strona.txt](formuly/04-nowa-strona.txt)
> Otworz w widoku **Raw**, szukaj naglowka `### nazwaKontrolki.Wlasciwosc`
> (Ctrl+F) i kopiuj blok pod nim. Pierwszy raz w Power Apps?
> Zacznij od [00-powerapps-podstawy.md](00-powerapps-podstawy.md).

Wymaga dwoch flow: [05-NowaStrona](../flows/05-NowaStrona.md) oraz
[04-OdswiezDrzewo](../flows/04-OdswiezDrzewo.md) z triggerem Power Apps.

Wszystko na `scr_Docs`.

---

## A. Podlaczenie flow

Lewy pasek → **Power Automate** → **Add flow** → wybierz `NowaStrona`,
potem jeszcze raz → `OdswiezDrzewo`.

Po dodaniu w formulach dostepne sa jako `NewDocPage.Run(...)`
i `RefreshTree.Run()`.

## B. Przycisk otwierajacy

**Button** `btn_Docs_NewPage`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"+ Nowa strona"` |
| X / Y | `1180` / `24` |
| Width / Height | `162` / `44` |
| Fill | `gblColorAccent` |
| HoverFill | `gblColorAccentDark` |
| Color | `RGBA(255,255,255,1)` |
| BorderThickness | `0` |

OnSelect:
```
Set(gblNewPage, true);
Set(gblParentId, Blank());
Reset(txt_NewPage_Title)
```

## C. Okno

**Rectangle** `rec_NewPage_Overlay`: X `0`, Y `0`, Width `Parent.Width`,
Height `Parent.Height`, Fill `RGBA(28,28,30,0.5)`, Visible `gblNewPage`.

**Rectangle** `rec_NewPage_Dialog`: X `363`, Y `60`, Width `640`, Height `700`,
Fill `gblColorPanel`, BorderThickness `1`, BorderColor `gblColorLine`,
Visible `gblNewPage`.

Wszystkie kontrolki ponizej maja **Visible** = `gblNewPage`.

### Naglowek

**Text label** `lbl_NewPage_Title`: X `387`, Y `82`, Width `500`, Height `30`,
Size `19`, FontWeight `FontWeight.Semibold`, Text `"Nowa strona dokumentacji"`

**Text label** `lbl_NewPage_Hint`: X `387`, Y `112`, Width `560`, Height `24`,
Size `11`, Color `gblColorMuted`,
Text `"Powstanie w SharePoincie i trafi w wybrane miejsce drzewa"`

**Icon** → **Cancel**, `ico_NewPage_Close`: X `947`, Y `84`, Width/Height `24`,
Color `gblColorMuted`, OnSelect:
```
Set(gblNewPage, false)
```

### Tytul strony

**Text label**: X `387`, Y `152`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Tytul strony"`

**Text input** `txt_NewPage_Title`: X `387`, Y `176`, Width `592`, Height `44`,
HintText `"np. Reservation Amendments - wyjatki"`, Default `""`

**Text label** `lbl_NewPage_Address`: X `387`, Y `224`, Width `592`, Height `20`,
Size `10`, Color `gblColorFaint`, Text:
```
"Adres: /SitePages/" & gblService & "-" &
Substitute(Substitute(Substitute(Trim(txt_NewPage_Title.Text), " ", "-"), "/", ""), "?", "") & ".aspx"
```

### Serwis i kategoria

**Text label**: X `387`, Y `256`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Serwis"`

**Dropdown** `drp_NewPage_Service`: X `387`, Y `280`, Width `286`, Height `44`,
Items `colServices`, Value `"Title"`,
Default:
```
LookUp(colServices, Kod = gblService)
```

**Text label**: X `693`, Y `256`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Kategoria"`

**Dropdown** `drp_NewPage_Category`: X `693`, Y `280`, Width `286`, Height `44`,
Items:
```
Distinct(Filter(colPages, Service = gblService && !IsBlank(Category)), Category)
```
AllowEmptySelection: `true`

Puste = kategoria zostanie wziеta z rodzica przy nastepnym przeliczeniu drzewa.

### Wybor miejsca w drzewie

**Text label**: X `387`, Y `340`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Miejsce w drzewie"`

**Gallery** (Blank vertical) `gal_NewPage_Parent`: X `387`, Y `364`, Width `592`,
Height `240`, TemplateSize `40`, TemplatePadding `0`,
BorderThickness `1`, BorderColor `gblColorLine`.

Items:
```
SortByColumns(Filter(colPages, Service = gblService), "TreeSort", Ascending)
```

W szablonie galerii:

**Rectangle** `rec_Parent_Row`: X `0`, Y `0`, Width `Parent.TemplateWidth`,
Height `40`, Fill:
```
If(gblParentId = ThisItem.ID, gblColorAccentSoft, gblColorPanel)
```

**Radio** nie jest potrzebne — caly wiersz jest klikalny:

**Text label** `lbl_Parent_Title`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `12 + ThisItem.Depth * 20` |
| Y | `8` |
| Width | `480` |
| Height | `24` |
| Text | `ThisItem.Title` |
| FontWeight | `If(gblParentId = ThisItem.ID, FontWeight.Semibold, FontWeight.Normal)` |
| OnSelect | `Set(gblParentId, ThisItem.ID)` |

**Text label** `lbl_Parent_Badge`: X `500`, Y `8`, Width `80`, Height `24`,
Size `10`, Color `gblColorAccentDark`, Align `Align.Right`,
Text:
```
If(gblParentId = ThisItem.ID, "rodzic", "")
```

### Podglad miejsca

**Text label** `lbl_NewPage_Preview`: X `387`, Y `616`, Width `592`, Height `48`,
Size `11`, Color `gblColorMuted`, Text:
```
If(IsBlank(gblParentId),
    "Zaznacz strone nadrzedna na liscie powyzej",
    "Trafi tutaj:  " & LookUp(colPages, ID = gblParentId).Title &
    "  >  " & If(IsBlank(txt_NewPage_Title.Text), "(tytul)", txt_NewPage_Title.Text)
)
```

### Przyciski

**Button** `btn_NewPage_Cancel`: X `707`, Y `680`, Width `120`, Height `44`,
Text `"Anuluj"`, Fill `gblColorPanel`, Color `gblColorText`,
BorderThickness `1`, BorderColor `gblColorLine`, OnSelect:
```
Set(gblNewPage, false)
```

**Button** `btn_NewPage_Create`: X `839`, Y `680`, Width `140`, Height `44`,
Text `"Utworz strone"`, Fill `gblColorAccent`,
DisplayMode:
```
If(IsBlank(gblParentId) || IsBlank(Trim(txt_NewPage_Title.Text)),
    DisplayMode.Disabled, DisplayMode.Edit)
```

OnSelect — **cala formula**:
```
Set(gblCreating, true);
Set(gblCreateResult,
    NewDocPage.Run(
        Trim(txt_NewPage_Title.Text),
        Text(gblParentId),
        drp_NewPage_Service.Selected.Kod,
        Coalesce(drp_NewPage_Category.Selected.Value, "")
    )
);
RefreshTree.Run();
Refresh('Site Pages');
Set(gblCreating, false);
Set(gblNewPage, false);
Notify("Strona utworzona", NotificationType.Success, 3000);
Launch(gblSiteUrl & Mid(gblCreateResult.adres, Find("/SitePages/", gblCreateResult.adres)), {}, LaunchTarget.New)
```

Ostatnia linia otwiera nowa strone w nowej karcie, zeby od razu dopisac tresc.
Jesli wolisz zostac w aplikacji — usun ja.

### Wskaznik pracy

**Text label** `lbl_NewPage_Working`: X `387`, Y `680`, Width `300`, Height `44`,
Color `gblColorMuted`, Visible `gblCreating`,
Text `"Tworze strone i przeliczam drzewo..."`

Przeliczenie drzewa trwa kilkanascie sekund przy kilkudziesieciu stronach,
wiec komunikat jest potrzebny.

---

## D. Odswiezenie listy po powrocie

Zeby nowa strona pojawila sie w drzewie bez przelaczania ekranow, dopisz
na koncu OnSelect przycisku **Utworz strone** cala formule z sekcji B pliku
[04-dokumentacja.md](04-dokumentacja.md) (ta, ktora buduje `colPages`).

---

## E. Sprawdzenie

1. **Alt + klik** → **+ Nowa strona** → okno sie otwiera
2. przycisk **Utworz strone** jest nieaktywny, dopoki nie ma tytulu i rodzica
3. po zatwierdzeniu: w Site Pages jest nowa strona z ustawionym `ParentPageId`
   i `Service`, otwiera sie w nowej karcie
4. po zamknieciu okna strona jest widoczna w drzewie pod wybranym rodzicem

Jesli strona powstaje, ale nie widac jej w drzewie: nie przeliczylo sie
`TreePath` — sprawdz, czy `OdswiezDrzewo` ma trigger **Power Apps (V2)**
i czy zakonczylo sie powodzeniem.

## F. Uprawnienia

Kazdy, kto moze otworzyc aplikacje, moze utworzyc strone. Flow dziala
w kontekscie osoby klikajacej, wiec zapis i tak podlega uprawnieniom
biblioteki Site Pages. Jesli tworzenie ma byc ograniczone do czesci zespolu,
ustaw `Visible` przycisku na zmienna roli (jak `gblIsManager` w
[03-home.md](03-home.md)) i ogranicz zapis w samej bibliotece.
