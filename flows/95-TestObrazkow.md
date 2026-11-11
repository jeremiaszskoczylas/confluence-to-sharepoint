# 95 — TestObrazkow (sonda)

Sprawdza, ktory zapis obrazka przetrwa wejscie w edycje strony. Obrazki zapisane
przez `parseTresc` jako `<img>` znikaja po edycji, a ta sonda porownuje je ze wzorem
`imagePlugin`, ktorego uzywa PnP Core SDK.

Flow nadpisuje tylko strone wskazana w triggerze. Zadnej innej strony ani listy nie
dotyka. Zakladasz dla niego **osobna, pusta strone** i kasujesz ja po tescie.

Podmien tylko `<WITRYNA>`.

---

## Przygotowanie

1. Site Pages → **New** → **Page** → pusty szablon. Tytul: `Test Obrazki`.
   **Publish**. Nazwa pliku to zwykle `Test-Obrazki.aspx`, sprawdz ja w bibliotece.
2. Wybierz **jeden istniejacy obrazek** z `DocMedia` i zapisz jego pelna sciezke od
   korzenia serwera, np. `<WITRYNA>/SiteAssets/DocMedia/<SERWIS>/attachments/<id>/<plik>.png`.
3. W skoroszycie ze skryptami dodaj nowy skrypt `testObrazki`, tresc z
   [scripts/testObrazki.ts](../scripts/testObrazki.ts).

---

## 1. Trigger — Manually trigger a flow

Trzy wejscia tekstowe, **w tej kolejnosci**:

```
strona
```
```
obrazek
```
```
domena
```

- `strona` — nazwa pliku strony testowej, np. `Test-Obrazki.aspx`
- `obrazek` — pelna sciezka obrazka z przygotowania, z ukosnikiem na poczatku
- `domena` — adres dzierzawy bez ukosnika na koncu, np. `https://firma.sharepoint.com`

Ponizej wstawiaj tokeny z dynamic content. Wyrazenia z `text`, `text_1` i `text_2`
to wariant awaryjny.

## 2. GetPlik — Send an HTTP request to SharePoint

Method: GET

Uri (fx):
```
concat('_api/web/getfilebyserverrelativeurl(''', triggerBody()?['text_1'], ''')?$select=UniqueId,ListId,WebId,SiteId')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

**404** znaczy, ze sciezka obrazka jest bledna.

## 3. GetStrona — Send an HTTP request to SharePoint

Method: GET

Uri (fx) — podmien `<WITRYNA>`; podwojne apostrofy sa celowe:
```
concat('_api/web/getfilebyserverrelativeurl(''<WITRYNA>/SitePages/', triggerBody()?['text'], ''')/ListItemAllFields?$select=Id,Title')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

**404** znaczy, ze strony o tej nazwie nie ma.

## 4. Buduj — Excel Online → Run script

Script (lista):
```
testObrazki
```
obrazek — **token `obrazek`**

domena — **token `domena`**

siteId (fx):
```
body('GetPlik')?['d']?['SiteId']
```
webId (fx):
```
body('GetPlik')?['d']?['WebId']
```
listId (fx):
```
body('GetPlik')?['d']?['ListId']
```
uniqueId (fx):
```
body('GetPlik')?['d']?['UniqueId']
```

## 5. Checkout — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetStrona')?['d']?['Id'], ')/checkoutpage')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

## 6. SaveDraft — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetStrona')?['d']?['Id'], ')/savepageasdraft')
```
Headers — dwa wiersze:
```
Accept
```
```
application/json;odata=verbose
```
```
Content-Type
```
```
application/json;odata=verbose
```
Body (fx) — CALE pole:
```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',body('GetStrona')?['d']?['Title']),'CanvasContent1',body('Buduj')?['result']))
```

## 7. Publish — Send an HTTP request to SharePoint

Method: POST

Uri (fx):
```
concat('_api/sitepages/pages(', body('GetStrona')?['d']?['Id'], ')/publish')
```
Headers — jeden wiersz: Accept → application/json;odata=verbose

Body: PUSTE

---

## Co jest na stronie

Pierwsza czesc etykiety mowi, gdzie stoi obrazek. Litera po myslniku mowi, jak jest zapisany.

| Miejsce | Etykiety |
|---|---|
| akapit | `P-A`, `P-B`, `P-C`, `P-K` |
| tabela | `T-A`, `T-B`, `T-K` |
| lista z podpunktami | `L-A`, `L-B`, `L-K` |
| sekcja zwijana rozwinieta | `Z-A`, `Z-B` |
| sekcja zwijana zwinieta | `Y-A`, `Y-B` |
| lewa kolumna | `D1-A`, `D1-B` |
| prawa kolumna | `D2-A`, `D2-B` |
| rozmiar ze zrodla | `R-1` |
| cala szerokosc kolumny | `R-2` |
| podpis i odnosnik | `O-A` |

| Litera | Zapis |
|---|---|
| `A` | `imagePlugin` z czterema identyfikatorami pliku |
| `B` | `imagePlugin` bez identyfikatorow, sciezka od korzenia serwera |
| `C` | `imagePlugin` bez identyfikatorow, pelny adres z domena |
| `K` | kontrola: `<img>`, tak jak dzis zapisuje go `parseTresc` |

Wszystkie etykiety pokazuja ten sam plik, wiec proporcje moga byc znieksztalcone.
W tym tescie nie ma to znaczenia.

---

## Jak testowac

1. Uruchom flow i otworz strone testowa. Spisz etykiety **bez obrazka**.
2. Rozwin „Sekcja zwinieta" i sprawdz `Y-A` oraz `Y-B`.
3. Kliknij **Edit**, poczekaj na pelne zaladowanie edytora i kliknij **Republish**.
4. Odswiez strone przez `Ctrl+F5` i znow spisz etykiety bez obrazka.

---

## Jak czytac wynik

| Co zniknelo po edycji | Co to znaczy | Co dalej |
|---|---|---|
| tylko `K` | identyfikatory nie sa potrzebne | zmiana wylacznie w `parseTresc` |
| `K` i `B`, a `A` zostaje | identyfikatory sa potrzebne | zmiana w `parseTresc` i pobieranie identyfikatorow w kroku 2 |
| nic, zostaje tez `K` | wystarcza ustawienie `contentVersion` 5 | sprawdzamy, czy `imagePlugin` jest w ogole potrzebny |
| `A`, `B` i `K` | wzor nie dziala na stronach zapisanych tym flow | odczytujemy kanwe sonda [96-PokazKanwe](96-PokazKanwe.md) |

`C` ma znaczenie tylko wtedy, gdy `B` znika, a `C` zostaje.
Jesli `A` lub `B` znika tylko w jednym miejscu, na przyklad w tabeli, zapisz, w ktorym.

---

## Wynik

Na stronie testowej przed edycja i po niej zostaly wszystkie warianty `A`, `B` i `C`,
takze w tabeli, na liscie, w sekcjach zwijanych i w kolumnach. Zniknely wszystkie `K`, czyli
zwykly `<img>` w akapicie, w tabeli i na liscie.

Dlatego `parseTresc` zapisuje obrazki wariantem `B`: bez identyfikatorow pliku i bez nowych
akcji w krokach 1 i 2.

---

## Po tescie

Skasuj strone `Test Obrazki` z Site Pages. Flow i skrypt moga zostac.
