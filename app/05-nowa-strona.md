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

Wszystko na `scrDocs`.

---

## A. Podlaczenie flow

Lewy pasek → **Power Automate** → **Add flow** → wybierz `NowaStrona`,
potem jeszcze raz → `OdswiezDrzewo`.

Po dodaniu w formulach dostepne sa jako `NowaStrona.Run(...)`
i `OdswiezDrzewo.Run()`.

## B. Przycisk otwierajacy

**Button** `btnNowaStrona`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"+ Nowa strona"` |
| X / Y | `1180` / `24` |
| Width / Height | `162` / `44` |
| Fill | `gKolorAkcent` |
| HoverFill | `gKolorAkcentCiemny` |
| Color | `RGBA(255,255,255,1)` |
| BorderThickness | `0` |

OnSelect:
```
Set(gNowaStrona, true);
Set(gRodzic, Blank());
Reset(txtNowyTytul)
```

## C. Okno

**Rectangle** `recNowaTlo`: X `0`, Y `0`, Width `Parent.Width`,
Height `Parent.Height`, Fill `RGBA(28,28,30,0.5)`, Visible `gNowaStrona`.

**Rectangle** `recNowa`: X `363`, Y `60`, Width `640`, Height `700`,
Fill `gKolorPanel`, BorderThickness `1`, BorderColor `gKolorLinia`,
Visible `gNowaStrona`.

Wszystkie kontrolki ponizej maja **Visible** = `gNowaStrona`.

### Naglowek

**Text label** `lblNowaTytul`: X `387`, Y `82`, Width `500`, Height `30`,
Size `19`, FontWeight `FontWeight.Semibold`, Text `"Nowa strona dokumentacji"`

**Text label** `lblNowaOpis`: X `387`, Y `112`, Width `560`, Height `24`,
Size `11`, Color `gKolorSzary`,
Text `"Powstanie w SharePoincie i trafi w wybrane miejsce drzewa"`

**Icon** → **Cancel**, `icoNowaZamknij`: X `947`, Y `84`, Width/Height `24`,
Color `gKolorSzary`, OnSelect:
```
Set(gNowaStrona, false)
```

### Tytul strony

**Text label**: X `387`, Y `152`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Tytul strony"`

**Text input** `txtNowyTytul`: X `387`, Y `176`, Width `592`, Height `44`,
HintText `"np. Reservation Amendments - wyjatki"`, Default `""`

**Text label** `lblPodgladAdresu`: X `387`, Y `224`, Width `592`, Height `20`,
Size `10`, Color `gKolorSzaryJasny`, Text:
```
"Adres: /SitePages/" & gSerwis & "-" &
Substitute(Substitute(Substitute(Trim(txtNowyTytul.Text), " ", "-"), "/", ""), "?", "") & ".aspx"
```

### Serwis i kategoria

**Text label**: X `387`, Y `256`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Serwis"`

**Dropdown** `drpNowySerwis`: X `387`, Y `280`, Width `286`, Height `44`,
Items `colSerwisy`, Value `"Title"`,
Default:
```
LookUp(colSerwisy, Kod = gSerwis)
```

**Text label**: X `693`, Y `256`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Kategoria"`

**Dropdown** `drpNowaKategoria`: X `693`, Y `280`, Width `286`, Height `44`,
Items:
```
Distinct(Filter(colStrony, Service = gSerwis && !IsBlank(Category)), Category)
```
AllowEmptySelection: `true`

Puste = kategoria zostanie wziеta z rodzica przy nastepnym przeliczeniu drzewa.

### Wybor miejsca w drzewie

**Text label**: X `387`, Y `340`, Size `11`, FontWeight `FontWeight.Semibold`,
Text `"Miejsce w drzewie"`

**Gallery** (Blank vertical) `galRodzic`: X `387`, Y `364`, Width `592`,
Height `240`, TemplateSize `40`, TemplatePadding `0`,
BorderThickness `1`, BorderColor `gKolorLinia`.

Items:
```
SortByColumns(Filter(colStrony, Service = gSerwis), "TreeSort", Ascending)
```

W szablonie galerii:

**Rectangle** `recRodzicTlo`: X `0`, Y `0`, Width `Parent.TemplateWidth`,
Height `40`, Fill:
```
If(gRodzic = ThisItem.ID, gKolorAkcentTlo, gKolorPanel)
```

**Radio** nie jest potrzebne — caly wiersz jest klikalny:

**Text label** `lblRodzic`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `12 + ThisItem.Poziom * 20` |
| Y | `8` |
| Width | `480` |
| Height | `24` |
| Text | `ThisItem.Title` |
| FontWeight | `If(gRodzic = ThisItem.ID, FontWeight.Semibold, FontWeight.Normal)` |
| OnSelect | `Set(gRodzic, ThisItem.ID)` |

**Text label** `lblRodzicZnacznik`: X `500`, Y `8`, Width `80`, Height `24`,
Size `10`, Color `gKolorAkcentCiemny`, Align `Align.Right`,
Text:
```
If(gRodzic = ThisItem.ID, "rodzic", "")
```

### Podglad miejsca

**Text label** `lblPodgladMiejsca`: X `387`, Y `616`, Width `592`, Height `48`,
Size `11`, Color `gKolorSzary`, Text:
```
If(IsBlank(gRodzic),
    "Zaznacz strone nadrzedna na liscie powyzej",
    "Trafi tutaj:  " & LookUp(colStrony, ID = gRodzic).Title &
    "  >  " & If(IsBlank(txtNowyTytul.Text), "(tytul)", txtNowyTytul.Text)
)
```

### Przyciski

**Button** `btnNowaAnuluj`: X `707`, Y `680`, Width `120`, Height `44`,
Text `"Anuluj"`, Fill `gKolorPanel`, Color `gKolorTekst`,
BorderThickness `1`, BorderColor `gKolorLinia`, OnSelect:
```
Set(gNowaStrona, false)
```

**Button** `btnNowaUtworz`: X `839`, Y `680`, Width `140`, Height `44`,
Text `"Utworz strone"`, Fill `gKolorAkcent`,
DisplayMode:
```
If(IsBlank(gRodzic) || IsBlank(Trim(txtNowyTytul.Text)),
    DisplayMode.Disabled, DisplayMode.Edit)
```

OnSelect — **cala formula**:
```
Set(gTworze, true);
Set(gWynik,
    NowaStrona.Run(
        Trim(txtNowyTytul.Text),
        Text(gRodzic),
        drpNowySerwis.Selected.Kod,
        Coalesce(drpNowaKategoria.Selected.Value, "")
    )
);
OdswiezDrzewo.Run();
Refresh('Site Pages');
Set(gTworze, false);
Set(gNowaStrona, false);
Notify("Strona utworzona", NotificationType.Success, 3000);
Launch(gWitrynaUrl & Mid(gWynik.adres, Find("/SitePages/", gWynik.adres)), {}, LaunchTarget.New)
```

Ostatnia linia otwiera nowa strone w nowej karcie, zeby od razu dopisac tresc.
Jesli wolisz zostac w aplikacji — usun ja.

### Wskaznik pracy

**Text label** `lblTworze`: X `387`, Y `680`, Width `300`, Height `44`,
Color `gKolorSzary`, Visible `gTworze`,
Text `"Tworze strone i przeliczam drzewo..."`

Przeliczenie drzewa trwa kilkanascie sekund przy kilkudziesieciu stronach,
wiec komunikat jest potrzebny.

---

## D. Odswiezenie listy po powrocie

Zeby nowa strona pojawila sie w drzewie bez przelaczania ekranow, dopisz
na koncu OnSelect przycisku **Utworz strone** cala formule z sekcji B pliku
[04-dokumentacja.md](04-dokumentacja.md) (ta, ktora buduje `colStrony`).

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
ustaw `Visible` przycisku na zmienna roli (jak `gManager` w
[03-home.md](03-home.md)) i ogranicz zapis w samej bibliotece.
