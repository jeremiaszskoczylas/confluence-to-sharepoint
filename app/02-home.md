# 2 — Ekran glowny

Cztery bloki: komunikat managera na gorze, obsada dnia po lewej, moja przerwa
i raporty po prawej.

Wszystko na `scrHome`, obszar tresci zaczyna sie od X = `248`.

Powtarzajace sie ustawienia karty (biale tlo z cieniem): **Rectangle** z
`Fill = gKolorPanel`, `BorderColor = RGBA(0,0,0,0.08)`, `BorderThickness = 1`.
Najpierw wstawiasz prostokat, potem na nim kontrolki.

---

## A. Naglowek ekranu

**Text label** `lblTytulHome`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Czesc, " & First(Split(gJa.FullName, " ")).Value & "!"` |
| X / Y | `248` / `24` |
| Width / Height | `600` / `40` |
| Size | `24` |
| FontWeight | `FontWeight.Semibold` |
| Color | `gKolorTekst` |

**Text label** `lblData`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `Text(gDzis, "dddd, d mmmm yyyy", "pl-PL")` |
| X / Y | `248` / `62` |
| Width / Height | `600` / `24` |
| Color | `gKolorSzary` |

---

## B. Komunikat od managera

### Karta

**Rectangle** `recKomunikat`: X `248`, Y `100`, Width `1094`, Height `120`,
Fill `gKolorPanel`, BorderThickness `1`, BorderColor `RGBA(0,0,0,0.08)`.

### Pasek wyroznienia

**Rectangle** `recKomPasek`: X `248`, Y `100`, Width `6`, Height `120`.

Fill:
```
If(LookUp(DT_ManagerMessages, AktywnyDo >= gDzis, Wazne), gKolorCzerwony, gKolorAkcent)
```

### Naglowek komunikatu

**Text label** `lblKomTytul`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `272` / `114` |
| Width / Height | `900` / `28` |
| Size | `15` |
| FontWeight | `FontWeight.Semibold` |

Text:
```
With({m: LookUp(DT_ManagerMessages, AktywnyDo >= gDzis)},
    If(IsBlank(m), "Brak komunikatow", m.Title)
)
```

### Tresc komunikatu

**Insert** → **Display** → **HTML text**, nazwa `htmKomTresc`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `272` / `144` |
| Width / Height | `900` / `64` |
| Size | `12` |

HtmlText:
```
With({m: LookUp(DT_ManagerMessages, AktywnyDo >= gDzis)},
    If(IsBlank(m), "<p style='color:#605E5C'>Manager nie zostawil dzis zadnej wiadomosci.</p>", m.Tresc)
)
```

Kontrolka HTML text jest potrzebna, bo kolumna `Tresc` jest tekstem sformatowanym.
Zwykla etykieta pokazalaby znaczniki HTML.

### Przycisk edycji

**Button** `btnEdytujKom`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Edytuj"` |
| X / Y | `1222` / `114` |
| Width / Height | `96` / `32` |
| Fill | `gKolorAkcent` |
| Visible | `gManager` |
| OnSelect | `Set(gEdycjaKom, true)` |

Na razie `gManager` jest `false`, wiec przycisk jest ukryty. Zeby przetestowac
edycje, zmien chwilowo `Visible` na `true`.

### Okno edycji

**Rectangle** `recEdycjaTlo`: X `0`, Y `0`, Width `Parent.Width`,
Height `Parent.Height`, Fill `RGBA(0,0,0,0.45)`, Visible `gEdycjaKom`.

**Rectangle** `recEdycja`: X `383`, Y `180`, Width `600`, Height `360`,
Fill `gKolorPanel`, Visible `gEdycjaKom`.

**Text input** `txtKomTytul`: X `407`, Y `240`, Width `552`, Height `40`,
HintText `"Naglowek komunikatu"`, Visible `gEdycjaKom`.

**Text input** `txtKomTresc`: X `407`, Y `292`, Width `552`, Height `140`,
Mode `TextMode.MultiLine`, HintText `"Tresc"`, Visible `gEdycjaKom`.

**Toggle** `tglKomWazne`: X `407`, Y `444`, Visible `gEdycjaKom`.
Obok **Text label** z tekstem `"Oznacz jako wazne"`, Visible `gEdycjaKom`.

**Button** `btnKomZapisz`: X `727`, Y `492`, Width `110`, Height `36`,
Text `"Zapisz"`, Fill `gKolorAkcent`, Visible `gEdycjaKom`.

OnSelect:
```
Patch(DT_ManagerMessages, Defaults(DT_ManagerMessages),
    {
        Title: txtKomTytul.Text,
        Tresc: "<p>" & Substitute(txtKomTresc.Text, Char(10), "</p><p>") & "</p>",
        Wazne: tglKomWazne.Value,
        AktywnyDo: DateAdd(gDzis, 7, Days)
    }
);
Set(gEdycjaKom, false);
Reset(txtKomTytul); Reset(txtKomTresc)
```

**Button** `btnKomAnuluj`: X `849`, Y `492`, Width `110`, Height `36`,
Text `"Anuluj"`, Fill `gKolorSzary`, Visible `gEdycjaKom`,
OnSelect:
```
Set(gEdycjaKom, false)
```

Nowy komunikat jest wazny przez 7 dni i przykrywa poprzedni, bo ekran pokazuje
najnowszy aktywny wpis.

---

## C. Obsada dnia

### Karta i naglowek

**Rectangle** `recObsada`: X `248`, Y `240`, Width `560`, Height `420`,
Fill `gKolorPanel`, BorderThickness `1`, BorderColor `RGBA(0,0,0,0.08)`.

**Text label** `lblObsadaTytul`: X `272`, Y `256`, Width `400`, Height `28`,
Size `16`, FontWeight `FontWeight.Semibold`, Text:
```
"Kto dzis pracuje (" & CountRows(Filter(DT_Rota, Data = gDzis, Rodzaj = "Praca")) & ")"
```

### Galeria

**Insert** → **Gallery** → **Blank vertical**, nazwa `galObsada`:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `264` / `292` |
| Width / Height | `528` / `352` |
| TemplateSize | `64` |
| TemplatePadding | `0` |
| ShowScrollbar | `true` |

Items:
```
SortByColumns(Filter(DT_Rota, Data = gDzis), "Title", Ascending)
```

### Zawartosc wiersza galerii

Zaznacz galerie, kliknij **Add an item from the insert pane** i wstawiaj
kontrolki **do srodka** szablonu.

**Image** `imgOsoba`:

| Wlasciwosc | Wartosc |
|---|---|
| Image | `Office365Users.UserPhotoV2(ThisItem.Email)` |
| X / Y | `8` / `8` |
| Width / Height | `48` / `48` |
| ImagePosition | `ImagePosition.Fill` |

**Text label** `lblOsobaImie`: X `68`, Y `8`, Width `260`, Height `24`,
FontWeight `FontWeight.Semibold`, Text `ThisItem.Title`

**Text label** `lblOsobaGodziny`: X `68`, Y `32`, Width `260`, Height `22`,
Size `11`, Color `gKolorSzary`, Text:
```
If(ThisItem.Rodzaj = "Praca", ThisItem.OdGodz & " - " & ThisItem.DoGodz, ThisItem.Rodzaj)
```

**Text label** `lblOsobaStatus` — status wyliczany z grafiku i przerw:

| Wlasciwosc | Wartosc |
|---|---|
| X / Y | `360` / `20` |
| Width / Height | `160` / `24` |
| Size | `11` |
| Align | `Align.Right` |

Text:
```
With(
    {
        teraz: Text(Now(), "[$-en-US]HH:mm"),
        p: LookUp(DT_Breaks, Data = gDzis && Title = ThisItem.Email)
    },
    If(
        ThisItem.Rodzaj <> "Praca", ThisItem.Rodzaj,
        !IsBlank(p) && teraz >= p.OdGodz && teraz < p.DoGodz, "Na przerwie " & p.OdGodz,
        teraz >= ThisItem.OdGodz && teraz < ThisItem.DoGodz, "W pracy",
        "Po godzinach"
    )
)
```

Color:
```
With(
    {
        teraz: Text(Now(), "[$-en-US]HH:mm"),
        p: LookUp(DT_Breaks, Data = gDzis && Title = ThisItem.Email)
    },
    If(
        ThisItem.Rodzaj <> "Praca", gKolorSzary,
        !IsBlank(p) && teraz >= p.OdGodz && teraz < p.DoGodz, gKolorZolty,
        teraz >= ThisItem.OdGodz && teraz < ThisItem.DoGodz, gKolorZielony,
        gKolorSzary
    )
)
```

Porownujemy godziny jako tekst w formacie `HH:mm`, dlatego w `DT_Rota`
godziny musza byc zapisane dwucyfrowo: `08:00`, nie `8:00`.

---

## D. Moja przerwa

**Rectangle** `recPrzerwa`: X `830`, Y `240`, Width `512`, Height `200`,
Fill `gKolorPanel`, BorderThickness `1`, BorderColor `RGBA(0,0,0,0.08)`.

**Text label** `lblPrzerwaTytul`: X `854`, Y `256`, Width `400`, Height `28`,
Size `16`, FontWeight `FontWeight.Semibold`, Text `"Moja przerwa dzisiaj"`

**Dropdown** `drpPrzerwa`: X `854`, Y `300`, Width `220`, Height `40`.

Items:
```
["10:00","11:00","12:00","13:00","14:00","15:00"]
```

Default:
```
With({p: LookUp(DT_Breaks, Data = gDzis && Title = gJa.Email)},
    If(IsBlank(p), "12:00", p.OdGodz)
)
```

**Text label** `lblPrzerwaDo`: X `1086`, Y `300`, Width `160`, Height `40`,
Color `gKolorSzary`, Text:
```
"do " & Text(Value(Left(drpPrzerwa.Selected.Value, 2)) + 1, "00") & ":00"
```

**Button** `btnPrzerwaZapisz`: X `854`, Y `360`, Width `160`, Height `40`,
Text `"Zapisz przerwe"`, Fill `gKolorAkcent`.

OnSelect:
```
With(
    {
        ist: LookUp(DT_Breaks, Data = gDzis && Title = gJa.Email),
        od: drpPrzerwa.Selected.Value,
        do: Text(Value(Left(drpPrzerwa.Selected.Value, 2)) + 1, "00") & ":00"
    },
    If(IsBlank(ist),
        Patch(DT_Breaks, Defaults(DT_Breaks),
            {
                Title: gJa.Email,
                Osoba: {
                    '@odata.type': "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
                    Claims: "i:0#.f|membership|" & gJa.Email,
                    DisplayName: gJa.FullName,
                    Email: gJa.Email
                },
                Data: gDzis,
                OdGodz: od,
                DoGodz: do
            }
        ),
        Patch(DT_Breaks, ist, {OdGodz: od, DoGodz: do})
    )
);
Notify("Przerwa zapisana", NotificationType.Success, 2000)
```

**Text label** `lblPrzerwaInfo`: X `1030`, Y `360`, Width `290`, Height `40`,
Size `11`, Color `gKolorSzary`, Text:
```
With({p: LookUp(DT_Breaks, Data = gDzis && Title = gJa.Email)},
    If(IsBlank(p), "Nie masz jeszcze zapisanej przerwy",
        "Zapisana: " & p.OdGodz & " - " & p.DoGodz)
)
```

Jedna osoba ma jedna przerwe dziennie — ponowny zapis nadpisuje poprzednia.

---

## E. Raporty w tym tygodniu

**Rectangle** `recRaporty`: X `830`, Y `460`, Width `512`, Height `200`,
Fill `gKolorPanel`, BorderThickness `1`, BorderColor `RGBA(0,0,0,0.08)`.

**Text label** `lblRaportyTytul`: X `854`, Y `476`, Width `460`, Height `28`,
Size `16`, FontWeight `FontWeight.Semibold`, Text:
```
"Moje raporty (tydzien od " & Text(gPoniedzialek, "dd.mm") & ")"
```

Trzy przelaczniki. **Insert** → **Input** → **Toggle**.

| Kontrolka | X | Y | Default |
|---|---|---|---|
| `tglStarty` | `854` | `520` | patrz nizej |
| `tglMidy` | `854` | `562` | patrz nizej |
| `tglEndy` | `854` | `604` | patrz nizej |

Default dla `tglStarty`:
```
With({r: LookUp(DT_Reports, TydzienOd = gPoniedzialek && Title = gJa.Email)},
    !IsBlank(r) && r.Starty
)
```
Dla `tglMidy` i `tglEndy` tak samo, zmieniajac `r.Starty` na `r.Midy` i `r.Endy`.

Obok kazdego przelacznika **Text label** (X `914`, ta sama wysokosc, Width `120`):
teksty `"Starty"`, `"Midy"`, `"Endy"`.

**Button** `btnRaportyZapisz`: X `1150`, Y `604`, Width `170`, Height `40`,
Text `"Zapisz raporty"`, Fill `gKolorAkcent`.

OnSelect:
```
With({ist: LookUp(DT_Reports, TydzienOd = gPoniedzialek && Title = gJa.Email)},
    If(IsBlank(ist),
        Patch(DT_Reports, Defaults(DT_Reports),
            {
                Title: gJa.Email,
                Osoba: {
                    '@odata.type': "#Microsoft.Azure.Connectors.SharePoint.SPListExpandedUser",
                    Claims: "i:0#.f|membership|" & gJa.Email,
                    DisplayName: gJa.FullName,
                    Email: gJa.Email
                },
                TydzienOd: gPoniedzialek,
                Starty: tglStarty.Value,
                Midy: tglMidy.Value,
                Endy: tglEndy.Value
            }
        ),
        Patch(DT_Reports, ist,
            {Starty: tglStarty.Value, Midy: tglMidy.Value, Endy: tglEndy.Value})
    )
);
Notify("Zapisane", NotificationType.Success, 2000)
```

### Kto co robi w tym tygodniu

Pod przelacznikami **Text label** `lblKtoRaporty`, X `1030`, Y `520`, Width `300`,
Height `70`, Size `11`, Color `gKolorSzary`, Text:
```
"Starty: " &
Concat(Filter(DT_Reports, TydzienOd = gPoniedzialek, Starty), Osoba.DisplayName, ", ")
& Char(10) & "Midy: " &
Concat(Filter(DT_Reports, TydzienOd = gPoniedzialek, Midy), Osoba.DisplayName, ", ")
& Char(10) & "Endy: " &
Concat(Filter(DT_Reports, TydzienOd = gPoniedzialek, Endy), Osoba.DisplayName, ", ")
```

---

## F. Odswiezanie

**Insert** → **Icon** → **Reload**, nazwa `icoOdswiez`: X `1300`, Y `30`,
Width / Height `28`, Color `gKolorSzary`.

OnSelect:
```
Refresh(DT_Rota); Refresh(DT_Breaks); Refresh(DT_Reports); Refresh(DT_ManagerMessages);
Set(gDzis, Today())
```

---

## G. Sprawdzenie

1. **Alt + klik** → widac liste osob z dzisiejszej daty, ze zdjeciami i statusem
2. wybierz godzine przerwy → **Zapisz przerwe** → w `DT_Breaks` pojawia sie wiersz,
   a status przy twoim nazwisku zmienia sie w godzinach przerwy
3. przestaw przelaczniki raportow → **Zapisz raporty** → wiersz w `DT_Reports`
4. jesli nie widac zdjec: sprawdz, czy `Email` w `DT_Rota` to prawdziwe adresy

## H. Role managera (do zrobienia pozniej)

Teraz `gManager` jest na sztywno `false`. Docelowo: zaloz grupe SharePoint
`GMSC Managers`, a w `App.OnStart` ustaw:

```
Set(gManager, !IsEmpty(
    Filter(Office365Groups.ListGroupMembers("<ID-GRUPY>").value, mail = gJa.Email)
))
```

Konektor Office 365 Groups jest standardowy. Samo ukrycie przycisku nie chroni
danych — zapis do listy ogranicza sie uprawnieniami listy
(patrz [00-listy.md](00-listy.md), sekcja `DT_ManagerMessages`).
