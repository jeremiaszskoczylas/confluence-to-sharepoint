# 3 — Ekran glowny

Cztery bloki: komunikat managera na gorze, obsada dnia po lewej, moja przerwa
i raporty po prawej.

> **Formuly do tego kroku:** [formuly/02-home.txt](formuly/02-home.txt)
> Otworz w widoku **Raw**, szukaj naglowka `### nazwaKontrolki.Wlasciwosc`
> (Ctrl+F) i kopiuj blok pod nim. Pierwszy raz w Power Apps?
> Zacznij od [00-powerapps-podstawy.md](00-powerapps-podstawy.md).

Wszystko na `scr_Home`, obszar tresci zaczyna sie od X = `248`.

Powtarzajace sie ustawienia karty (biale tlo z cieniem): **Rectangle** z
`Fill = gblColorPanel`, `BorderColor = RGBA(0,0,0,0.08)`, `BorderThickness = 1`.
Najpierw wstawiasz prostokat, potem na nim kontrolki.

---

## A. Naglowek ekranu

**Text label** `lbl_Home_Greeting`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Czesc, " & First(Split(gblUser.FullName, " ")).Value & "!"` |
| X / Y | `248` / `24` |
| Width / Height | `600` / `40` |
| Size | `24` |
| FontWeight | `FontWeight.Semibold` |
| Color | `gblColorText` |

**Text label** `lbl_Home_Date`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `Text(gblToday, "dddd, d mmmm yyyy", "en-GB")` |
| X / Y | `248` / `62` |
| Width / Height | `600` / `24` |
| Color | `gblColorMuted` |

---

## B. Komunikat od managera

### Karta

**Rectangle** `rec_Home_MsgCard`: X `248`, Y `100`, Width `1094`, Height `120`,
Fill `gblColorPanel`, BorderThickness `1`, BorderColor `RGBA(0,0,0,0.08)`.

### Pasek wyroznienia

**Rectangle** `rec_Home_MsgBar`: X `248`, Y `100`, Width `6`, Height `120`.

Fill:
```
If(LookUp(DT_ManagerMessages, ActiveUntil >= gblToday, IsImportant), gblColorAccent, gblColorAccent)
```

### Naglowek komunikatu

**Text label** `lbl_Home_MsgTitle`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `272` / `114` |
| Width / Height | `900` / `28` |
| Size | `15` |
| FontWeight | `FontWeight.Semibold` |

Text:
```
With({m: LookUp(DT_ManagerMessages, ActiveUntil >= gblToday)},
    If(IsBlank(m), "Brak komunikatow", m.Title)
)
```

### Tresc komunikatu

**Insert** → **Display** → **HTML text**, nazwa `htm_Home_MsgBody`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `272` / `144` |
| Width / Height | `900` / `64` |
| Size | `12` |

HtmlText:
```
With({m: LookUp(DT_ManagerMessages, ActiveUntil >= gblToday)},
    If(IsBlank(m), "<p style='color:#605E5C'>Manager nie zostawil dzis zadnej wiadomosci.</p>", gblMessage.Body)
)
```

Kontrolka HTML text jest potrzebna, bo kolumna `Tresc` jest tekstem sformatowanym.
Zwykla etykieta pokazalaby znaczniki HTML.

### Przycisk edycji

**Button** `btn_Home_EditMsg`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Edytuj"` |
| X / Y | `1222` / `114` |
| Width / Height | `96` / `32` |
| Fill | `gblColorAccent` |
| Visible | `gblIsManager` |
| OnSelect | `Set(gblEditMessage, true)` |

Na razie `gblIsManager` jest `false`, wiec przycisk jest ukryty. Zeby przetestowac
edycje, zmien chwilowo `Visible` na `true`.

### Okno edycji

**Rectangle** `rec_Msg_Overlay`: X `0`, Y `0`, Width `Parent.Width`,
Height `Parent.Height`, Fill `RGBA(0,0,0,0.45)`, Visible `gblEditMessage`.

**Rectangle** `rec_Msg_Dialog`: X `383`, Y `180`, Width `600`, Height `360`,
Fill `gblColorPanel`, Visible `gblEditMessage`.

**Text input** `txt_Msg_Title`: X `407`, Y `240`, Width `552`, Height `40`,
HintText `"Naglowek komunikatu"`, Visible `gblEditMessage`.

**Text input** `txt_Msg_Body`: X `407`, Y `292`, Width `552`, Height `140`,
Mode `TextMode.MultiLine`, HintText `"Tresc"`, Visible `gblEditMessage`.

**Toggle** `tgl_Msg_Important`: X `407`, Y `444`, Visible `gblEditMessage`.
Obok **Text label** z tekstem `"Oznacz jako wazne"`, Visible `gblEditMessage`.

**Button** `btn_Msg_Save`: X `727`, Y `492`, Width `110`, Height `36`,
Text `"Zapisz"`, Fill `gblColorAccent`, Visible `gblEditMessage`.

OnSelect:
```
Patch(DT_ManagerMessages, Defaults(DT_ManagerMessages),
    {
        Title: txt_Msg_Title.Text,
        Body: "<p>" & Substitute(txt_Msg_Body.Text, Char(10), "</p><p>") & "</p>",
        IsImportant: tgl_Msg_Important.Value,
        ActiveUntil: DateAdd(gblToday, 7, Days)
    }
);
Set(gblEditMessage, false);
Reset(txt_Msg_Title); Reset(txt_Msg_Body)
```

**Button** `btn_Msg_Cancel`: X `849`, Y `492`, Width `110`, Height `36`,
Text `"Anuluj"`, Fill `gblColorMuted`, Visible `gblEditMessage`,
OnSelect:
```
Set(gblEditMessage, false)
```

Nowy komunikat jest wazny przez 7 dni i przykrywa poprzedni, bo ekran pokazuje
najnowszy aktywny wpis.

---

## C. Obsada dnia

### Karta i naglowek

**Rectangle** `rec_Home_RosterCard`: X `248`, Y `240`, Width `560`, Height `460`,
Fill `gblColorPanel`, BorderThickness `1`, BorderColor `RGBA(0,0,0,0.08)`.

**Text label** `lbl_Home_RosterTitle`: X `272`, Y `256`, Width `400`, Height `28`,
Size `16`, FontWeight `FontWeight.Semibold`, Text:
```
"Kto dzis pracuje (" & CountRows(Filter(DT_Rota, ShiftDate = gblToday, ShiftType = "Work")) & ")"
```

**Text label** `lbl_Home_RosterLegend`: X `272`, Y `282`, Width `520`, Height `20`,
Size `11`, Color `gblColorFaint`,
Text wg pliku formul (`lbl_Home_RosterLegend`)

### Galeria

**Insert** → **Gallery** → **Blank vertical**, nazwa `gal_Home_Roster`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `264` / `308` |
| Width / Height | `528` / `312` |
| TemplateSize | `64` |
| TemplatePadding | `0` |
| ShowScrollbar | `true` |

Items — do grafiku dnia doklejamy deklaracje raportow z biezacego tygodnia:
```
AddColumns(
    SortByColumns(Filter(DT_Rota, ShiftDate = gblToday), "Title", Ascending),
    "Checks", LookUp(DT_DailyChecks, WeekStart = gblWeekStart && Title = Email)
)
```

`Rap` jest pusty, gdy dana osoba nie zadeklarowala nic na ten tydzien —
w wierszu widac wtedy trzy wygaszone plakietki.

### Zawartosc wiersza galerii

Zaznacz galerie, kliknij **Add an item from the insert pane** i wstawiaj
kontrolki **do srodka** szablonu.

**Image** `img_Roster_Photo`:

| Wlasciwosc | Wartosc |
|---|---|
| Image | `Office365Users.UserPhotoV2(ThisItem.Email)` |
| X / Y | `8` / `8` |
| Width / Height | `48` / `48` |
| ImagePosition | `ImagePosition.Fill` |

**Text label** `lbl_Roster_Name`: X `68`, Y `8`, Width `225`, Height `24`,
FontWeight `FontWeight.Semibold`, Text `ThisItem.Title`

**Text label** `lbl_Roster_Hours`: X `68`, Y `32`, Width `225`, Height `22`,
Size `11`, Color `gblColorMuted`, Text:
```
If(ThisItem.ShiftType = "Work", ThisItem.StartTime & " - " & ThisItem.EndTime, ThisItem.ShiftType)
```

### Plakietki Daily Checks w wierszu

Trzy male etykiety obok siebie. Kazda ma **Height** `26`, **Width** `26`,
**Y** `19`, **Size** `11`, **FontWeight** `FontWeight.Semibold`,
**Align** `Align.Center`, **VerticalAlign** `VerticalAlign.Middle`,
**BorderThickness** `1`, **BorderRadius** (w panelu Radius) `5`.

| Kontrolka | X | Text |
|---|---|---|
| `lbl_Roster_ChkS` | `300` | `"S"` |
| `lbl_Roster_ChkT` | `330` | `"T"` |
| `lbl_Roster_ChkE` | `360` | `"E"` |

Dla `lbl_Roster_ChkS`:

Fill:
```
If(ThisItem.Checks.Starts, gblColorAccentSoft, gblColorPanel)
```
Color:
```
If(ThisItem.Checks.Starts, gblColorAccentDark, RGBA(182,182,188,1))
```
BorderColor:
```
If(ThisItem.Checks.Starts, RGBA(200,16,46,0.4), gblColorLine)
```
Tooltip:
```
If(ThisItem.Checks.Starts, ThisItem.Title & " robi starty", ThisItem.Title & " nie robi startow")
```

Dla `lbl_Roster_ChkT` i `lbl_Roster_ChkE` te same cztery formuly, podmieniajac
`ThisItem.Checks.Starts` na `ThisItem.Checks.Throughout` oraz `ThisItem.Checks.End`.

Pusty `Rap` (brak deklaracji) daje `false` w kazdym warunku, wiec wszystkie trzy
plakietki sa wygaszone — od razu widac, kto jeszcze nic nie wybral.

### Status

**Text label** `lbl_Roster_Status` — status wyliczany z grafiku i przerw:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `400` / `20` |
| Width / Height | `120` / `24` |
| Size | `11` |
| Align | `Align.Right` |

Text:
```
With(
    {
        teraz: Text(Now(), "[$-en-US]HH:mm"),
        p: LookUp(DT_Breaks, BreakDate = gblToday && Title = ThisItem.Email)
    },
    If(
        ThisItem.ShiftType <> "Work", ThisItem.ShiftType,
        !IsBlank(p) && teraz >= p.StartTime && teraz < p.EndTime, "Na przerwie " & p.StartTime,
        teraz >= ThisItem.StartTime && teraz < ThisItem.EndTime, "W pracy",
        "Po godzinach"
    )
)
```

Color:
```
With(
    {
        teraz: Text(Now(), "[$-en-US]HH:mm"),
        p: LookUp(DT_Breaks, BreakDate = gblToday && Title = ThisItem.Email)
    },
    If(
        ThisItem.ShiftType <> "Work", gblColorMuted,
        !IsBlank(p) && teraz >= p.StartTime && teraz < p.EndTime, gblColorAccent,
        teraz >= ThisItem.StartTime && teraz < ThisItem.EndTime, gblColorText,
        gblColorMuted
    )
)
```

Porownujemy godziny jako tekst w formacie `HH:mm`, dlatego w `DT_Rota`
godziny musza byc zapisane dwucyfrowo: `08:00`, nie `8:00`.

### Stopka karty: pokrycie Daily Checks na dzis

Najwazniejsza informacja na tej karcie. Jesli osoba z endami ma w czwartek wolne,
to w czwartek **wszystkie** plakietki E sa szare — znaczy, ze ktos z obecnych musi
te endy przejac. Stopka nazywa to wprost, zeby nie trzeba bylo liczyc wzrokiem.

Najpierw wspolna kolekcja. Zaznacz `scr_Home` → **OnVisible**:
```
ClearCollect(colRosterToday,
    AddColumns(
        Filter(DT_Rota, ShiftDate = gblToday, ShiftType = "Work"),
        "Checks", LookUp(DT_DailyChecks, WeekStart = gblWeekStart && Title = Email)
    )
)
```

Dopisz te sama formule na koncu OnSelect przycisku `btn_Checks_Save`
oraz ikony odswiezania, zeby stopka nadazala za zmianami.

**Text label** `lbl_Home_Coverage`: X `272`, Y `628`, Width `420`, Height `24`,
Size `11`, Color `gblColorMuted`, Text:
```
"Dzis na zmianie —  S: " &
Coalesce(Concat(Filter(colRosterToday, Rap.Starts), First(Split(Title, " ")).Value, ", "), "nikt") &
"   M: " &
Coalesce(Concat(Filter(colRosterToday, Rap.Throughout), First(Split(Title, " ")).Value, ", "), "nikt") &
"   E: " &
Coalesce(Concat(Filter(colRosterToday, Rap.End), First(Split(Title, " ")).Value, ", "), "nikt")
```

**Text label** `lbl_Home_Gap` — ostrzezenie, widoczne tylko gdy czegos brakuje:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `272` / `652` |
| Width / Height | `520` / `36` |
| Size | `11` |
| Color | `gblColorAccentDark` |
| Fill | `gblColorAccentSoft` |
| Visible | patrz nizej |

Visible:
```
CountRows(Filter(colRosterToday, Rap.Starts)) = 0 ||
CountRows(Filter(colRosterToday, Rap.Throughout)) = 0 ||
CountRows(Filter(colRosterToday, Rap.End)) = 0
```

Text:
```
"Dzis nikt nie robi: " &
Concat(
    Filter(
        Table(
            {n: "starty", ile: CountRows(Filter(colRosterToday, Rap.Starts))},
            {n: "midy",   ile: CountRows(Filter(colRosterToday, Rap.Throughout))},
            {n: "endy",   ile: CountRows(Filter(colRosterToday, Rap.End))}
        ),
        ile = 0
    ),
    n, ", "
) & " — ktos z dzisiejszej zmiany musi je przejac"
```

Liczone sa tylko osoby z `ShiftType = "Work"`, wiec urlop czy chorobowe nie zasłaniaja
luki. Kto ma raporty w tym tygodniu, ale dzis nie pracuje, pojawi sie w swoim dniu.

---

## D. Moja przerwa

Trzy typowe godziny jako przyciski plus pole na dowolna wlasna godzine.
Przerwa zawsze trwa godzine, koniec liczy sie sam.

**Rectangle** `rec_Home_BreakCard`: X `830`, Y `240`, Width `512`, Height `248`,
Fill `gblColorPanel`, BorderThickness `1`, BorderColor `gblColorLine`.

**Text label** `lbl_Home_BreakTitle`: X `854`, Y `256`, Width `400`, Height `28`,
Size `16`, FontWeight `FontWeight.Semibold`.

### Wybor godziny

Cztery przyciski w rzedzie, kazdy Height `44`, Y `300`:

| Kontrolka | X | Width |
|---|---|---|
| `btn_Break_12` | `854` | `86` |
| `btn_Break_13` | `948` | `86` |
| `btn_Break_14` | `1042` | `86` |
| `btn_Break_Other` | `1136` | `110` |

Formuly `Text`, `OnSelect`, `Fill` i `Color` kazdego przycisku sa w pliku formul.
Wybrana godzine trzyma zmienna lokalna `loc_BreakStart`, a `loc_BreakCustom`
mowi, czy uzytkownik wpisuje wlasna pore.

**Text input** `txt_Break_Custom`: X `854`, Y `352`, Width `150`, Height `44`.
Widoczny tylko po klikniecu **Other time**. Przyjmuje godzine w formacie
`HH:MM`; dopoki wpis jest niepoprawny, przycisk zapisu jest nieaktywny,
a pod polem pojawia sie podpowiedz.

**Text label** `lbl_Break_CustomError`: X `1014`, Y `352`, Width `300`, Height `44`,
Size `11`, Color `gblColorAccentDark`.

**Text label** `lbl_Break_End`: X `854`, Y `404`, Width `160`, Height `24`,
Size `12`, Color `gblColorMuted` — pokazuje godzine zakonczenia.

### Zapis

**Button** `btn_Break_Save`: X `1136`, Y `404`, Width `186`, Height `44`,
Fill `gblColorAccent`, Color bialy.

**Text label** `lbl_Break_Saved`: X `854`, Y `436`, Width `280`, Height `24`,
Size `11`, Color `gblColorMuted`.

**Text label** `lbl_Break_Others`: X `854`, Y `458`, Width `460`, Height `24`,
Size `11`, Color `gblColorFaint` — kto jeszcze ma przerwe o tej samej porze.

Jedna osoba ma jedna przerwe dziennie: ponowny zapis nadpisuje poprzednia.

---
## E. Moje Daily Checks

**Rectangle** `rec_Home_ChecksCard`: X `830`, Y `500`, Width `512`, Height `262`,
Fill `gblColorPanel`, BorderThickness `1`, BorderColor `gblColorLine`.

**Text label** `lbl_Home_ChecksTitle`: X `854`, Y `516`, Width `460`, Height `28`,
Size `16`, FontWeight `FontWeight.Semibold`.

**Text label** `lbl_Home_ChecksReset`: X `854`, Y `542`, Width `300`, Height `20`,
Size `11`, Color `gblColorFaint`, Text `"Resets every Saturday"`.

### Trzy przelaczniki

**Insert** → **Input** → **Toggle**.

| Kontrolka | Y | Etykieta obok (X `914`) | Licznik (X `1060`) |
|---|---|---|---|
| `tgl_Checks_Starts` | `576` | `"Starts"` | `lbl_Checks_CountStarts` |
| `tgl_Checks_Throughout` | `618` | `"Throughout"` | `lbl_Checks_CountThroughout` |
| `tgl_Checks_End` | `660` | `"End"` | `lbl_Checks_CountEnd` |

Wszystkie przelaczniki X `854`. Etykiety i liczniki: Height `24`, liczniki
dodatkowo Size `11`, Color `gblColorMuted`, Width `260`.

Wlasciwosc `Default` kazdego przelacznika czyta wiersz z `DT_DailyChecks`
dla **biezacego tygodnia**, czyli od ostatniej soboty. W sobote rano wiersza
jeszcze nie ma, wiec wszystkie trzy startuja wylaczone — to jest cotygodniowy
reset, o ktory chodzilo. Stare wiersze zostaja w liscie jako historia.

**Button** `btn_Checks_Save`: X `1136`, Y `706`, Width `186`, Height `44`,
Fill `gblColorAccent`. Jego `OnSelect` zapisuje wiersz i od razu przebudowuje
kolekcje `colRosterToday`, zeby plakietki w liscie obsady odswiezyly sie
bez przeladowania ekranu.

---
## F. Odswiezanie

**Insert** → **Icon** → **Reload**, nazwa `ico_Home_Refresh`: X `1300`, Y `30`,
Width / Height `28`, Color `gblColorMuted`.

OnSelect:
```
// pelna formula w formuly/02-home.txt, naglowek ico_Home_Refresh.OnSelect
Refresh(DT_Rota); Refresh(DT_Breaks); Refresh(DT_DailyChecks); Refresh(DT_ManagerMessages);
Set(gblToday, Today());
Set(gblWeekStart, DateAdd(Today(), -(Weekday(Today(), StartOfWeek.Saturday) - 1), Days))
```

---

## G. Sprawdzenie

1. **Alt + klik** → widac liste osob z dzisiejszej daty, ze zdjeciami i statusem
2. wybierz godzine przerwy → **Zapisz przerwe** → w `DT_Breaks` pojawia sie wiersz,
   a status przy twoim nazwisku zmienia sie w godzinach przerwy
3. przestaw przelaczniki Daily Checks → **Save Daily Checks** → wiersz w `DT_DailyChecks`
4. przy kazdej osobie widac trzy plakietki S, M, E — wypelnione oznaczaja raporty,
   ktore ta osoba robi w tym tygodniu
5. gdy nikt z obecnych nie ma danego raportu, pod lista zapala sie ostrzezenie;
   sprawdz to, odznaczajac u siebie raport, ktory masz jako jedyny
6. jesli nie widac zdjec: sprawdz, czy `Email` w `DT_Rota` to prawdziwe adresy

## H. Role managera (do zrobienia pozniej)

Teraz `gblIsManager` jest na sztywno `false`. Docelowo: zaloz grupe SharePoint
`GMSC Managers`, a w `App.OnStart` ustaw:

```
Set(gblIsManager, !IsEmpty(
    Filter(Office365Groups.ListGroupMembers("<ID-GRUPY>").value, mail = gblUser.Email)
))
```

Konektor Office 365 Groups jest standardowy. Samo ukrycie przycisku nie chroni
danych — zapis do listy ogranicza sie uprawnieniami listy
(patrz [01-listy.md](01-listy.md), sekcja `DT_ManagerMessages`).
