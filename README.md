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

Strony, ktorych krok 2 nie udzwignie, sklada sie recznie —
[flows/RECZNA-STRONA.md](flows/RECZNA-STRONA.md) opisuje, co dokladnie generuje
`parseTresc`, zeby reczna strona nie odstawala od pozostalych.

## Skrypty

| Plik | Parametry | Zastosowanie |
|---|---|---|
| `analyzeConfluenceHtml.ts` | `html` | Sonda diagnostyczna. Raportuje tagi, klasy CSS, makra, obrazy i linki występujące w pliku — służy rozpoznaniu formatu przed napisaniem parsera. |
| `pokazFragment.ts` | `html`, `klasa` | Zwraca fragment HTML otaczający wskazaną klasę CSS. Do podglądu struktury konkretnej konstrukcji. |
| `showRota.ts` | — | Sonda skoroszytu `rota`: arkusze, nagłówki, pierwsze wiersze i typy komórek. Służy dopasowaniu parsera grafiku. |
| `pokazTaby.ts` | `html` | Sonda zakładek i załączników. Zwraca liczby wystąpień znanych klas oraz szkielet znaczników (nazwy tagów, `class`, `id`, `data-*`); treść zastępuje licznikiem znaków, więc raport można pokazać bez ujawniania zawartości strony. Widoczne zostają tylko krótkie etykiety z nagłówków i odnośników. |
| `testObrazki.ts` | `obrazek`, `domena`, `siteId`, `webId`, `listId`, `uniqueId` | Sonda do [flows/95-TestObrazkow.md](flows/95-TestObrazkow.md). Buduje kanwe strony testowej z tym samym obrazkiem zapisanym na kilka sposobow i w kilku miejscach, zeby sprawdzic, ktory zapis przetrwa edycje strony. |
| `parseIndex.ts` | `html` | Parsuje `index.html` z eksportu. Zwraca płaską listę `ID|ID_rodzica|poziom|tytuł|plik` odtwarzającą hierarchię stron. |
| `parseTresc.ts` | `html`, `base`, `tytul`, `linki`, `nag`, `pod` | Główny parser. Czyści treść strony i buduje `CanvasContent1`. Cloaki zostają rozwinięte jako numerowane sekcje z wykazem; tylko zakładki stają się natywnymi sekcjami zwijanymi. Trzy ostatnie parametry (mapowanie linków, ścieżka, podstrony) wypełnia krok 2 (RemapLinks); w kroku 1 zostają puste. |
| `planujDrzewo.ts` | `dane`, `witryna`, `serwis` | Krok 2 (RemapLinks). Z wierszy mapy migracji **jednego serwisu** liczy dla każdej strony: rodzica, kategorię, `TreePath`/`TreeSort`, kolejność, ścieżkę (breadcrumb) i blok podstron; zwraca też mapowanie linków (po id i po tytule) oraz fragmenty HTML strony-mapy. Wiersze ze statusem `Manual` zostaja w drzewie i w mapowaniu linkow, ale wypadaja z listy stron do przetworzenia — ich tresci krok 2 nie nadpisuje. |
| `budujMape.ts` | `fragmenty` | Kroki 3 i 4. Buduje `CanvasContent1` strony-mapy: korzeń w sekcji zwykłej, każda gałąź jako sekcja zwijana (nazwa z tytułu gałęzi). |
| `planujMape.ts` | `dane`, `pomin`, `serwisMapy` | Krok 4 (utrzymanie). Liczy drzewo z biblioteki Site Pages po kolumnie `ParentPageId`, grupując strony po kolumnie `Service`, więc obejmuje też strony założone ręcznie i kolejne serwisy. Metadane (`TreePath`, `TreeSort`, `SortOrder`, `Category`) liczy dla wszystkich serwisów, a fragmenty strony-mapy tylko dla serwisu podanego w `serwisMapy` (pusty = wszystkie). Zwraca też liczniki: sieroty, strony bez serwisu, serwisy w mapie. |

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
  `[{controlType:4, position, contentVersion:5, zoneGroupMetadata?, innerHTML}, ..., {controlType:0, pageSettingsSlice}]`,
  gdzie `contentVersion` 5 oznacza edytor CK5
- usuwa puste znaczniki: przełączniki `cloakToggle`, ikony `aui-icon`
- usuwa ikony dekoracyjne `images/icons/*`
- zamienia panele informacyjne na prefiksy tekstowe (`⚠️ UWAGA:`, `ℹ️ INFO:`, `📌 NOTATKA:`, `💡 WSKAZÓWKA:`)
- przepisuje ścieżki `attachments/` na lokalizację w SharePoint (parametr `base`)
- zamienia linki wewnętrzne na placeholdery `{{CONF:<id>}}` do podmiany po utworzeniu stron
- neutralizuje martwe odnośniki (profile Confluence, `index.html`)
- zamienia `<input>` na znak `☐`
- obrazki z biblioteki (`base`) zapisuje jako `div.imagePlugin`, który przetrwa edycję strony.
  Obrazek jest blokiem: dzieli akapit i wychodzi z odnośnika, ale zostaje w swojej komórce tabeli
  albo punkcie listy. Rozmiar i wyrównanie bierze ze źródła, a odnośnik przenosi do `data-linkurl`.
  Bez szerokości w źródle obrazek dostaje całą kolumnę. Obrazki spoza biblioteki zostają jako `<img>`
- emotikony z kodem znaku w klasie (`emoticon-1f621`) zamienia na znak Unicode

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
