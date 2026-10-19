# 1 — Szkielet aplikacji

Aplikacja, polaczenia, motyw, nawigacja. Po tym kroku masz puste ekrany
z dzialajacym menu — tresc dokladasz w krokach 2 i 3.

## A. Zalozenie aplikacji

1. make.powerapps.com → wlasciwe srodowisko → **Create** → **Blank app** →
   **Blank canvas app** → **Create**
2. Nazwa: `Dashboard zespolu`, format **Tablet** (szeroki 16:9) → **Create**

Format Tablet jest wlasciwy takze dla przegladarki — nazwa myli, chodzi o proporcje.

## B. Polaczenia

Lewy pasek → **Data** → **Add data**. Dodaj kolejno:

- **SharePoint** → adres witryny → zaznacz listy: `DT_Rota`, `DT_Breaks`,
  `DT_Reports`, `DT_ManagerMessages`, `DT_Services` oraz biblioteke **Site Pages**
- **Office 365 Users**

## C. Motyw i zmienne startowe

Zaznacz **App** w drzewie po lewej → wlasciwosc **OnStart** → wklej calosc:

```
Set(gKolorTlo, RGBA(248, 249, 250, 1));
Set(gKolorPanel, RGBA(255, 255, 255, 1));
Set(gKolorAkcent, RGBA(0, 90, 158, 1));
Set(gKolorTekst, RGBA(32, 31, 30, 1));
Set(gKolorSzary, RGBA(96, 94, 92, 1));
Set(gKolorZielony, RGBA(16, 124, 16, 1));
Set(gKolorCzerwony, RGBA(196, 49, 75, 1));
Set(gKolorZolty, RGBA(183, 121, 31, 1));

Set(gJa, User());
Set(gDzis, Today());
Set(gPoniedzialek, DateAdd(Today(), -(Weekday(Today(), StartOfWeek.Monday) - 1), Days));
Set(gEkran, "Home");
Set(gEdycjaKom, false);
Set(gManager, false)
```

`gManager` zostaje na `false` — role wlaczymy pozniej, opis na koncu
[02-home.md](02-home.md). `gPoniedzialek` to poniedzialek biezacego tygodnia,
uzywany przy raportach.

**Uruchom OnStart teraz:** trzy kropki przy `App` → **Run OnStart**. Po kazdej
zmianie OnStart trzeba to powtorzyc, inaczej zmienne sa puste.

## D. Ekrany

Lewy pasek → **Tree view** → **+ New screen** → **Blank**. Zaloz trzy i nazwij
je (dwuklik na nazwie):

```
scrHome
scrDocs
scrGry
```

Pierwszy ekran z szablonu skasuj, jesli zostal pusty `Screen1`.

Dla **kazdego** z trzech ekranow ustaw:

- **Fill**:
```
gKolorTlo
```

## E. Pasek nawigacji

Robimy raz na `scrHome`, potem kopiujemy na pozostale ekrany.

### Tlo paska

**Insert** → **Rectangle**, nazwa `recNav`:

| Wlasciwosc | Wartosc |
|---|---|
| X | `0` |
| Y | `0` |
| Width | `220` |
| Height | `Parent.Height` |
| Fill | `gKolorAkcent` |

### Tytul

**Insert** → **Text label**, nazwa `lblLogo`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Dashboard zespolu"` |
| X / Y | `24` / `28` |
| Width / Height | `180` / `60` |
| Color | `RGBA(255,255,255,1)` |
| Size | `18` |
| FontWeight | `FontWeight.Semibold` |

### Przyciski menu

**Insert** → **Button**, nazwa `btnNavHome`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Strona glowna"` |
| X / Y | `12` / `110` |
| Width / Height | `196` / `44` |
| Fill | `If(gEkran = "Home", RGBA(255,255,255,0.18), RGBA(255,255,255,0))` |
| HoverFill | `RGBA(255,255,255,0.28)` |
| Color / HoverColor / PressedColor | `RGBA(255,255,255,1)` |
| BorderThickness | `0` |
| Align | `Align.Left` |
| PaddingLeft | `16` |
| OnSelect | `Set(gEkran, "Home"); Navigate(scrHome)` |

Skopiuj przycisk dwa razy (Ctrl+C, Ctrl+V) i zmien:

**btnNavDocs** — Y `160`, Text `"Dokumentacja"`,
OnSelect:
```
Set(gEkran, "Docs"); Navigate(scrDocs)
```
Fill:
```
If(gEkran = "Docs", RGBA(255,255,255,0.18), RGBA(255,255,255,0))
```

**btnNavGry** — Y `210`, Text `"Gierki"`,
OnSelect:
```
Set(gEkran, "Gry"); Navigate(scrGry)
```
Fill:
```
If(gEkran = "Gry", RGBA(255,255,255,0.18), RGBA(255,255,255,0))
```

### Stopka paska: kto jest zalogowany

**Insert** → **Media** → **Image**, nazwa `imgJa`:

| Wlasciwosc | Wartosc |
|---|---|
| Image | `Office365Users.UserPhotoV2(gJa.Email)` |
| X / Y | `24` / `Parent.Height - 86` |
| Width / Height | `40` / `40` |
| ImagePosition | `ImagePosition.Fill` |

**Text label** `lblJa`:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `gJa.FullName` |
| X / Y | `72` / `Parent.Height - 82` |
| Width / Height | `140` / `32` |
| Color | `RGBA(255,255,255,1)` |
| Size | `11` |

Jesli zdjecie nie wczyta sie od razu — to normalne, konektor czasem potrzebuje
chwili przy pierwszym uruchomieniu.

### Kopiowanie paska na pozostale ekrany

Zaznacz w drzewie `recNav`, `lblLogo`, trzy przyciski, `imgJa`, `lblJa`
(Ctrl i klikanie) → Ctrl+C → wejdz na `scrDocs` → Ctrl+V. To samo na `scrGry`.

## F. Obszar tresci

Na kazdym ekranie tresc zaczyna sie od X = `248`. Zapamietaj te liczbe,
powtarza sie w krokach 2 i 3.

Na `scrGry` wstaw na razie jedna etykiete:

| Wlasciwosc | Wartosc |
|---|---|
| Text | `"Wkrotce"` |
| X / Y | `248` / `40` |
| Size | `24` |
| Color | `gKolorSzary` |

## G. Sprawdzenie

**Alt + klik** na przyciskach menu — ekrany przelaczaja sie, podswietlenie
aktywnej pozycji przesuwa sie razem z nimi, na dole paska widac twoje zdjecie
i imie. Jesli podswietlenie nie dziala, uruchom **Run OnStart** jeszcze raz.
