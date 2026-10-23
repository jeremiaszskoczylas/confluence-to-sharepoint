# Konwencje nazewnicze

Cala aplikacja jest po angielsku: nazwy list, kolumn, kontrolek, zmiennych
i teksty widoczne dla uzytkownika. Po polsku sa tylko te instrukcje.

Konwencja wg standardu Matthew Devaneya dla aplikacji Canvas, uzywanego
powszechnie w Power Platform.

## Kontrolki: `typ_Ekran_Cel`

```
lbl_Home_Greeting
gal_Home_Roster
btn_Breaks_Save
txt_NewPage_Title
```

| Prefiks | Kontrolka |
|---|---|
| `scr_` | ekran (Screen) |
| `lbl_` | etykieta (Text label) |
| `btn_` | przycisk (Button) |
| `gal_` | galeria (Gallery) |
| `txt_` | pole tekstowe (Text input) |
| `drp_` | lista rozwijana (Dropdown) |
| `cmb_` | pole kombi (Combo box) |
| `tgl_` | przelacznik (Toggle) |
| `chk_` | pole wyboru (Checkbox) |
| `ico_` | ikona (Icon) |
| `img_` | obraz (Image) |
| `rec_` | prostokat (Rectangle) |
| `htm_` | tekst HTML (HTML text) |
| `con_` | kontener (Container) |

## Zmienne i kolekcje

| Prefiks | Co to | Tworzone przez |
|---|---|---|
| `gbl` | zmienna globalna, widoczna wszedzie | `Set()` |
| `loc` | zmienna lokalna, tylko na jednym ekranie | `UpdateContext()` |
| `col` | kolekcja, czyli tabela w pamieci | `ClearCollect()` |

Po prefiksie PascalCase, bez podkreslen: `gblToday`, `colRosterToday`.

## Ekrany

```
scr_Home      ekran glowny
scr_Docs      dokumentacja
scr_Games     gierki (pozniej)
```

## Listy SharePoint

Prefiks `DT_` zostaje, nazwy po angielsku, kolumny w PascalCase.

| Lista | Rola |
|---|---|
| `DT_Rota` | grafik: kto i kiedy pracuje |
| `DT_Breaks` | zaplanowane przerwy |
| `DT_DailyChecks` | deklaracje Daily Checks na tydzien |
| `DT_ManagerMessages` | komunikaty od managera |
| `DT_Services` | katalog serwisow |
| `DT_MigrationMap` | lista robocza migracji — **jedna na serwis**, kolejne z sufiksem, np. `DT_MigrationMap_SWB` |

## Slownik: co sie zmienilo wzgledem wczesniejszych wersji

Jesli zalozyles juz cos wedlug poprzednich instrukcji, to jest mapa zmian.

| Bylo | Jest |
|---|---|
| `DT_Reports` | `DT_DailyChecks` |
| kolumny `Starty` / `Midy` / `Endy` | `Starts` / `Throughout` / `End` |
| `TydzienOd` | `WeekStart` |
| `OdGodz` / `DoGodz` | `StartTime` / `EndTime` |
| `Data` (w Rota) | `ShiftDate` |
| `Data` (w Breaks) | `BreakDate` |
| `Rodzaj` | `ShiftType` |
| `Osoba` | `Person` |
| `Tresc` (komunikat) | `Body` |
| `Wazne` | `IsImportant` |
| `AktywnyDo` | `ActiveUntil` |
| `Kod` (serwis) | `Code` |
| `Kolejnosc` | `SortOrder` |
| `Aktywny` | `IsActive` |
| zmienne `g…` | `gbl…` |
| kontrolki `lblTytulHome` | `lbl_Home_Greeting` |

## Nazewnictwo Daily Checks

Zbiorcza nazwa funkcji to **Daily Checks**. Trzy rodzaje:

| Kolumna | Etykieta w aplikacji | Skrot na plakietce |
|---|---|---|
| `Starts` | Starts | S |
| `Throughout` | Throughout | T |
| `End` | End | E |

Zapisales „Throught" — przyjalem **Throughout**, bo to poprawna forma
angielska dla kontroli prowadzonych w trakcie zmiany. Jesli zespol uzywa
innego slowa, powiedz, podmienie w jednym miejscu.

## Tydzien Daily Checks zaczyna sie w sobote

Deklaracje resetuja sie w sobote, wiec „tydzien" liczymy od soboty do piatku.
Sluzy do tego zmienna:

```
Set(gblWeekStart, DateAdd(Today(), -(Weekday(Today(), StartOfWeek.Saturday) - 1), Days))
```

W sobote `Weekday(...)` zwraca 1, wiec `gblWeekStart` to ten sam dzien.
W piatek zwraca 7, wiec cofa sie o 6 dni do poprzedniej soboty.

Wiersz w `DT_DailyChecks` jest jeden na osobe na taki tydzien. W sobote rano
nikt nie ma jeszcze wiersza na nowy tydzien, wiec przelaczniki startuja puste —
to jest wlasnie reset.

## Teksty widoczne dla uzytkownika

Po angielsku, zdaniowa wielkoscia liter: `"Save break"`, nie `"SAVE BREAK"`
ani `"Save Break"`. Wyjatek: nazwy wlasne i skroty.
