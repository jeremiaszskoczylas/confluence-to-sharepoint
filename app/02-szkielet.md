# 2 — Szkielet aplikacji

Aplikacja, polaczenia, motyw, nawigacja. Po tym kroku masz puste ekrany
z dzialajacym menu — tresc dokladasz w krokach 2 i 3.

> **Formuly do tego kroku:** [formuly/01-start.txt](formuly/01-start.txt)
> Otworz w widoku **Raw**, szukaj naglowka `### nazwaKontrolki.Wlasciwosc`
> (Ctrl+F) i kopiuj blok pod nim. Pierwszy raz w Power Apps?
> Zacznij od [00-powerapps-podstawy.md](00-powerapps-podstawy.md).

## A. Zalozenie aplikacji

1. make.powerapps.com → wlasciwe srodowisko → **Create** → **Blank app** →
   **Blank canvas app** → **Create**
2. Nazwa: `Dashboard zespolu`, format **Tablet** (szeroki 16:9) → **Create**

Format Tablet jest wlasciwy takze dla przegladarki — nazwa myli, chodzi o proporcje.

## B. Polaczenia

Lewy pasek → **Data** → **Add data**. Dodaj kolejno:

- **SharePoint** → adres witryny → zaznacz listy: `DT_Rota`, `DT_Breaks`,
  `DT_DailyChecks`, `DT_ManagerMessages`, `DT_Services` oraz biblioteke **Site Pages**
- **Office 365 Users**

## C. Motyw i zmienne startowe

Zaznacz **App** w drzewie po lewej → wlasciwosc **OnStart** → wklej calosc:

```
Set(gblColorBg, RGBA(244, 244, 245, 1));
Set(gblColorPanel, RGBA(255, 255, 255, 1));
Set(gblColorAccent, RGBA(200, 16, 46, 1));
Set(gblColorAccentDark, RGBA(142, 11, 34, 1));
Set(gblColorAccentSoft, RGBA(251, 233, 236, 1));
Set(gblColorNav, RGBA(35, 35, 38, 1));
Set(gblColorText, RGBA(28, 28, 30, 1));
Set(gblColorMuted, RGBA(104, 104, 110, 1));
Set(gblColorFaint, RGBA(134, 134, 141, 1));
Set(gblColorLine, RGBA(0, 0, 0, 0.09));

Set(gblUser, User());
Set(gblToday, Today());
Set(gblWeekStart, DateAdd(Today(), -(Weekday(Today(), StartOfWeek.Saturday) - 1), Days));
Set(gblScreen, "Home");
Set(gblEditMessage, false);
Set(gblIsManager, false)
```

`gblIsManager` zostaje na `false` — role wlaczymy pozniej, opis na koncu
[03-home.md](03-home.md). `gblWeekStart` to **sobota** rozpoczynajaca biezacy tydzien Daily Checks,
uzywany przy raportach.

**Uruchom OnStart teraz:** trzy kropki przy `App` → **Run OnStart**. Po kazdej
zmianie OnStart trzeba to powtorzyc, inaczej zmienne sa puste.

## D. Ekrany

Lewy pasek → **Tree view** → **+ New screen** → **Blank**. Zaloz trzy i nazwij
je (dwuklik na nazwie):

```
scr_Home
scr_Docs
scr_Games
```

Pierwszy ekran z szablonu skasuj, jesli zostal pusty `Screen1`.

Dla **kazdego** z trzech ekranow ustaw:

- **Fill**:
```
gblColorBg
```

## E. Pasek nawigacji

Robimy raz na `scr_Home`, potem kopiujemy na pozostale ekrany.

### Tlo paska

**Insert** → **Rectangle**, nazwa `rec_Nav_Bg`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `0` |
| Y | `0` |
| Width | `220` |
| Height | `Parent.Height` |
| Fill | `gblColorNav` |

### Tytul

**Insert** → **Text label**, nazwa `lbl_Nav_Logo`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Dashboard zespolu"` |
| X / Y | `24` / `28` |
| Width / Height | `180` / `60` |
| Color | `RGBA(255,255,255,1)` |
| Size | `18` |
| FontWeight | `FontWeight.Semibold` |

### Przyciski menu

**Insert** → **Button**, nazwa `btn_Nav_Home`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Strona glowna"` |
| X / Y | `12` / `110` |
| Width / Height | `196` / `44` |
| Fill | `If(gblScreen = "Home", RGBA(255,255,255,0.18), RGBA(255,255,255,0))` |
| HoverFill | `RGBA(255,255,255,0.28)` |
| Color / HoverColor / PressedColor | `RGBA(255,255,255,1)` |
| BorderThickness | `0` |
| Align | `Align.Left` |
| PaddingLeft | `16` |
| OnSelect | `Set(gblScreen, "Home"); Navigate(scr_Home)` |

Skopiuj przycisk dwa razy (Ctrl+C, Ctrl+V) i zmien:

**btn_Nav_Docs** — Y `160`, Text `"Dokumentacja"`,
OnSelect:
```
Set(gblScreen, "Docs"); Navigate(scr_Docs)
```
Fill:
```
If(gblScreen = "Docs", RGBA(255,255,255,0.18), RGBA(255,255,255,0))
```

**btn_Nav_Games** — Y `210`, Text `"Gierki"`,
OnSelect:
```
Set(gblScreen, "Games"); Navigate(scr_Games)
```
Fill:
```
If(gblScreen = "Games", RGBA(255,255,255,0.18), RGBA(255,255,255,0))
```

### Stopka paska: kto jest zalogowany

**Insert** → **Media** → **Image**, nazwa `img_Nav_Me`:

| Wlasciwosc | Wartosc |
|---|---|
| Image | `Office365Users.UserPhotoV2(gblUser.Email)` |
| X / Y | `24` / `Parent.Height - 86` |
| Width / Height | `40` / `40` |
| ImagePosition | `ImagePosition.Fill` |

**Text label** `lbl_Nav_Me`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `gblUser.FullName` |
| X / Y | `72` / `Parent.Height - 82` |
| Width / Height | `140` / `32` |
| Color | `RGBA(255,255,255,1)` |
| Size | `11` |

Jesli zdjecie nie wczyta sie od razu — to normalne, konektor czasem potrzebuje
chwili przy pierwszym uruchomieniu.

### Kopiowanie paska na pozostale ekrany

Zaznacz w drzewie `rec_Nav_Bg`, `lbl_Nav_Logo`, trzy przyciski, `img_Nav_Me`, `lbl_Nav_Me`
(Ctrl i klikanie) → Ctrl+C → wejdz na `scr_Docs` → Ctrl+V. To samo na `scr_Games`.

## F. Obszar tresci

Na kazdym ekranie tresc zaczyna sie od X = `248`. Zapamietaj te liczbe,
powtarza sie w krokach 2 i 3.

Na `scr_Games` wstaw na razie jedna etykiete:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Wkrotce"` |
| X / Y | `248` / `40` |
| Size | `24` |
| Color | `gblColorMuted` |

## G. Sprawdzenie

**Alt + klik** na przyciskach menu — ekrany przelaczaja sie, podswietlenie
aktywnej pozycji przesuwa sie razem z nimi, na dole paska widac twoje zdjecie
i imie. Jesli podswietlenie nie dziala, uruchom **Run OnStart** jeszcze raz.
