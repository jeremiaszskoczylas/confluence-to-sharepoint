# Confluence → SharePoint

Office Scripts wspierające migrację dokumentacji z **Confluence Server / Data Center**
(eksport przestrzeni do HTML) do **SharePoint Site Pages**, uruchamiane z Power Automate
akcją `Run script`.

Całość działa na **standardowych konektorach Power Platform** — bez premium, bez Dataverse,
bez rejestracji aplikacji w Entra ID.

## Od czego zaczac

[PLAN-WDROZENIA.md](PLAN-WDROZENIA.md) — co robic po kolei od stanu obecnego,
w czterech etapach, z czasami i kontrola po kazdym kroku.
## Dashboard (Power Apps)

Instrukcje budowy aplikacji sa w katalogu [app/](app/). Jesli nie budowales
wczesniej aplikacji w Power Apps, zacznij od
[app/00-powerapps-podstawy.md](app/00-powerapps-podstawy.md) — poradnik dla osoby,
ktora zna Power Automate. Kod formul lezy osobno w [app/formuly/](app/formuly/),
w plikach do kopiowania.

## Flow-y

Caly proces w jednym ciagu: [flows/PRZEWODNIK.md](flows/PRZEWODNIK.md).

Komplet szczegolowych sciag do Power Automate jest w katalogu [flows/](flows/) —
zacznij od [flows/README.md](flows/README.md), ktory podaje kolejnosc
i trzy wartosci do podmiany.

## Skrypty

| Plik | Parametry | Zastosowanie |
|---|---|---|
| `analyzeConfluenceHtml.ts` | `html` | Sonda diagnostyczna. Raportuje tagi, klasy CSS, makra, obrazy i linki występujące w pliku — służy rozpoznaniu formatu przed napisaniem parsera. |
| `pokazFragment.ts` | `html`, `klasa` | Zwraca fragment HTML otaczający wskazaną klasę CSS. Do podglądu struktury konkretnej konstrukcji. |
| `showRota.ts` | — | Sonda skoroszytu `rota`: arkusze, nagłówki, pierwsze wiersze i typy komórek. Służy dopasowaniu parsera grafiku. |
| `pokazTaby.ts` | `html` | Sonda zakładek i załączników. Zwraca liczby wystąpień znanych klas oraz szkielet znaczników (nazwy tagów, `class`, `id`, `data-*`); treść zastępuje licznikiem znaków, więc raport można pokazać bez ujawniania zawartości strony. Widoczne zostają tylko krótkie etykiety z nagłówków i odnośników. |
| `parseIndex.ts` | `html` | Parsuje `index.html` z eksportu. Zwraca płaską listę `ID|ID_rodzica|poziom|tytuł|plik` odtwarzającą hierarchię stron. |
| `parseTresc.ts` | `html`, `base`, `tytul`, `linki`, `nag`, `pod` | Główny parser. Czyści treść strony i buduje `CanvasContent1`. Cloaki zostają rozwinięte jako numerowane sekcje z wykazem; tylko zakładki stają się natywnymi sekcjami zwijanymi. Trzy ostatnie parametry (mapowanie linków, ścieżka, podstrony) wypełnia krok 2 (RemapLinks); w kroku 1 zostają puste. |
| `planujDrzewo.ts` | `dane`, `witryna`, `serwis` | Krok 2 (RemapLinks). Z wierszy mapy migracji **jednego serwisu** liczy dla każdej strony: rodzica, kategorię, `TreePath`/`TreeSort`, kolejność, ścieżkę (breadcrumb) i blok podstron; zwraca też mapowanie linków (po id i po tytule) oraz fragmenty HTML strony-mapy. |
| `budujMape.ts` | `fragmenty` | Kroki 3 i 4. Buduje `CanvasContent1` strony-mapy: korzeń w sekcji zwykłej, każda gałąź jako sekcja zwijana (nazwa z tytułu gałęzi). |
| `planujMape.ts` | `dane`, `pomin` | Krok 4 (utrzymanie). Liczy drzewo z biblioteki Site Pages po kolumnie `ParentPageId`, grupując strony po kolumnie `Service`, więc obejmuje też strony założone ręcznie i kolejne serwisy. Zwraca metadane do wpisania (`TreePath`, `TreeSort`, `SortOrder`, `Category`), fragmenty mapy i liczbę stron bez przypisania. |

## Co robi `parseTresc`

- wycina blok `id="main-content"`, odrzuca nagłówek i stopkę
- usuwa atrybuty `style` — czym odsłania treść sekcji `cloak` ukrytych przez `display: none`
- cloaki → rozwinięte, ponumerowane sekcje z liniami i wykazem odnośników na górze
  (kotwice zgodne z regułą SharePointa)
- **zakładki** (`tabs-pane`): grupa dwóch zakładek → **dwie kolumny obok siebie**
  (`sectionFactor` 6), tytuł zakładki jako nagłówek w kolumnie; grupa trzech lub więcej →
  natywne sekcje zwijane z kartą aktywną (`active-pane`) rozwiniętą. Treść przed i po
  zakładkach wraca do sekcji pełnej szerokości. Panele przetwarzane są w obrębie kontenera,
  więc każda grupa na stronie rozpatrywana jest osobno.
  Nazwa sekcji pochodzi z `data-pane-title` (zapisany małymi literami dostaje wielkie
  pierwsze litery); w jego braku z nagłówka otwierającego panel, który wtedy znika z treści,
  a na końcu numer zastępczy. Menu `tabs-menu` jest w eksporcie **puste** — Confluence buduje
  je JavaScriptem — więc parser je usuwa i nie szuka w nim etykiet
- kanwa ma jedną kontrolkę, a przy zakładkach tyle, ile sekcji:
  `[{controlType:4, position, zoneGroupMetadata?, innerHTML}]`
- usuwa puste znaczniki: przełączniki `cloakToggle`, ikony `aui-icon`
- usuwa ikony dekoracyjne `images/icons/*`
- zamienia panele informacyjne na prefiksy tekstowe (`⚠️ UWAGA:`, `ℹ️ INFO:`, `📌 NOTATKA:`, `💡 WSKAZÓWKA:`)
- przepisuje ścieżki `attachments/` na lokalizację w SharePoint (parametr `base`)
- zamienia linki wewnętrzne na placeholdery `{{CONF:<id>}}` do podmiany po utworzeniu stron
- neutralizuje martwe odnośniki (profile Confluence, `index.html`)
- zamienia `<input>` na znak `☐`

## Uwagi

Makra w eksporcie Confluence **Server** nie mają atrybutu `data-macro-name` — rozpoznawanie
odbywa się po klasach CSS.

Nazwy plików w eksporcie mają postać `Tytul-Strony_<pageId>.html`, ale zdarzają się też
pliki samego ID (`<pageId>.html`) — regex musi obsługiwać oba warianty, inaczej takie strony
wypadną z migracji bez ostrzeżenia.

Zakładek SharePoint Online nie ma w standardzie, a dodatki (Hillbilly Tabs, Accordion Pro,
web party PnP) wymagają SPFx i katalogu aplikacji. Najbliższym natywnym odpowiednikiem
zakładek i cloaków są sekcje zwijane — i tak są tu odwzorowane.

SharePoint Text web part akceptuje wyłącznie podzbiór HTML. Konstrukcje spoza niego są
usuwane po cichu przy zapisie — stąd jawne przekształcanie paneli i checkboxów zamiast
polegania na sanitizacji.
