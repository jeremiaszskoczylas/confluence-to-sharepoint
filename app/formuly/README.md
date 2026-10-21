# Formuly do kopiowania

Wszystkie formuly aplikacji, bez opisow, zeby dalo sie je szybko wklejac.

## Jak uzywac

1. Otworz plik przyciskiem **Raw** na GitHubie — wtedy nic nie przeszkadza
   w zaznaczaniu.
2. Ctrl+F, wpisz nazwe kontrolki, np. `galObsada`.
3. Naglowek ma postac `### nazwaKontrolki.Wlasciwosc`. Skopiuj **wszystko
   pod naglowkiem, do nastepnego naglowka albo pustej linii z `---`**.
4. W Power Apps zaznacz te kontrolke, w pasku formuly wybierz te wlasciwosc,
   wklej.

Linie zaczynajace sie od `//` to komentarze dla ciebie — Power Apps je przyjmuje
i ignoruje, wiec mozesz je wkleic razem z formula albo pominac.

## Pliki

| Plik | Co zawiera |
|---|---|
| [01-start.txt](01-start.txt) | `App.OnStart` — kolory i zmienne globalne |
| [02-home.txt](02-home.txt) | ekran glowny: obsada, przerwa, raporty, komunikat |
| [03-dokumentacja.txt](03-dokumentacja.txt) | drzewo dokumentacji, zakladki, wyszukiwarka |
| [04-nowa-strona.txt](04-nowa-strona.txt) | okno dodawania strony |

## Zanim wkleisz pierwsza formule

Przestaw jezyk autora na angielski — inaczej Power Apps bedzie oczekiwal
srednikow zamiast przecinkow i kazda formula bedzie bledem. Instrukcja:
[../00-powerapps-podstawy.md](../00-powerapps-podstawy.md), pierwsza sekcja.

## Trzy wartosci do podmiany

Wystepuja w formulach jako teksty w nawiasach ostrych:

| Co | Gdzie | Przyklad |
|---|---|---|
| `<ADRES-WITRYNY>` | `01-start.txt`, zmienna `gWitrynaUrl` | `https://firma.sharepoint.com/teams/Dzial/pod` |
| `<ID-GRUPY-MANAGEROW>` | `01-start.txt`, opcjonalnie, przy rolach | identyfikator grupy z Entra |

Reszta formul nie wymaga podmian.
