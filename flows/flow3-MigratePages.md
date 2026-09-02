# Flow 3 — MigratePages

Sciaga do zbudowania flow w Power Automate. Kazdy blok `kod` kopiujesz w calosci.

## PODMIEN PRZED UZYCIEM

| Placeholder | Na co podmienic |
|---|---|
| `<WITRYNA>` | fragment adresu Twojej witryny po /sites/ |
| `<FOLDER-EKSPORTU>` | sciezka do rozpakowanego eksportu w bibliotece plikow |

## WAZNE ZASADY

1. **Nazwy akcji musza byc DOKLADNIE takie jak nizej** (Rename przez trzy kropki
   na akcji). Wyrazenia odwoluja sie do nazw — inna nazwa = flow nie zadziala.
2. Blok oznaczony **[fx]** wstawiasz przez panel wyrazen (ikona fx) — po wstawieniu
   w polu ma byc kolorowy zeton, NIE golu tekst.
3. Blok oznaczony **[tekst]** wpisujesz normalnie w pole.
4. **[tekst+token]** = tekst, a w srodku dynamic content z podanej akcji.

---

## 1. Trigger

`Manually trigger a flow`

---

## 2. Akcja: GetPending   (SharePoint -> Get items)

- List Name: `DT_MigrationMap`
- Advanced options -> Filter Query **[tekst]**:

```
MigrationStatus eq 'Pending'
```

- Top Count **[tekst]** (na pierwszy test JEDNA strona; potem podnosisz):

```
1
```

---

## 3. Apply to each

W pole "Select an output" wstaw dynamic content **value** z akcji GetPending.
Wszystko ponizej jest WEWNATRZ tej petli.

---

## 4. Akcja: GetHtml   (SharePoint -> Get file content using path)

- File Path **[tekst+token]** — tekst, a na koncu token **SourceFile** z GetPending:

```
/Dashboard_Team/<FOLDER-EKSPORTU>/
```

(po ostatnim ukosniku wstaw token SourceFile)

---

## 5. Akcja: ParsujTresc   (Excel Online -> Run script / Run script from SharePoint library)

- Script: `parseTresc` (wersja z commita a33c856 lub nowsza!)
- Pole `html`: dynamic content **File Content** z GetHtml
- Pole `base` **[tekst]**:

```
/sites/<WITRYNA>/SiteAssets/DocMedia/attachments/
```

---

## 6. Akcja: CreatePage   (SharePoint -> Send an HTTP request to SharePoint)

- Site Address: Twoja witryna
- Method: `POST`
- Uri **[tekst]**:

```
_api/sitepages/pages
```

- Headers (dwa wiersze):

| klucz | wartosc |
|---|---|
| Accept | `application/json;odata=verbose` |
| Content-Type | `application/json;odata=verbose` |

- Body **[tekst+token]** — w miejsce slowa TYTUL wstaw token **Title** z GetPending:

```
{"__metadata":{"type":"SP.Publishing.SitePage"},"Title":"TYTUL","PageLayoutType":"Article","PromotedState":0}
```

---

## 7. Akcja: SaveDraft   (Send an HTTP request to SharePoint)

- Method: `POST`
- Uri — CALE pole jako jedno **[fx]**:

```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/savepageasdraft')
```

- Headers: te same dwa co w CreatePage
- Body — CALE pole jako jedno **[fx]** (zadnego tekstu obok!):

```
string(setProperty(setProperty(json('{"__metadata":{"type":"SP.Publishing.SitePage"}}'),'Title',items('Apply_to_each')?['Title']),'CanvasContent1',body('ParsujTresc')?['result']))
```

To wyrazenie samo escapuje cudzyslowy z HTML — dlatego musi byc wyrazeniem,
a nie recznie sklejonym tekstem.

---

## 8. Akcja: UstawMetadane   (SharePoint -> Update file properties)

- Library Name: `Site Pages`
- Id **[fx]**:

```
body('CreatePage')?['d']?['Id']
```

- ConfluencePageId: dynamic content **ConfluenceId** z GetPending
- DocStatus Value: wybierz z listy `Published`
- Reszta pol PUSTA (Category i ParentPageId uzupelni Flow 4)

---

## 8b. Akcja: RenamePage   (Send an HTTP request to SharePoint)

Endpoint tworzacy strony nadaje LOSOWA nazwe pliku (np. 1j19sg3p.aspx) — ta akcja
zmienia ja na nazwe z eksportu (SourceFile z .html -> .aspx). Daje to czytelne,
unikalne adresy i obsluguje strony bez tytulu w nazwie pliku.

Wstaw MIEDZY UstawMetadane a Publish.

- Method: `POST`
- Uri — CALE pole jako jedno **[fx]** (podmien <WITRYNA> w DWOCH miejscach;
  podwojne apostrofy '' sa celowe — tak sie escapuje apostrof):

```
concat('_api/web/getfilebyserverrelativeurl(''/sites/<WITRYNA>/', body('CreatePage')?['d']?['Url'], ''')/moveto(newurl=''/sites/<WITRYNA>/SitePages/', replace(items('Apply_to_each')?['SourceFile'], '.html', '.aspx'), ''',flags=1)')
```

- Headers: jeden wiersz — Accept: `application/json;odata=verbose`
- Body: PUSTE

UWAGA: po dodaniu tej akcji, w akcji OdhaczWMapie pole TargetUrl musi byc
wyrazeniem (stary d.Url przestaje byc prawdziwy po zmianie nazwy):

```
concat('SitePages/', replace(items('Apply_to_each')?['SourceFile'], '.html', '.aspx'))
```

---

## 9. Akcja: Publish   (Send an HTTP request to SharePoint)

- Method: `POST`
- Uri — CALE pole **[fx]**:

```
concat('_api/sitepages/pages(', body('CreatePage')?['d']?['Id'], ')/publish')
```

- Headers: jeden wiersz — Accept: `application/json;odata=verbose`
- Body: PUSTE

---

## 10. Akcja: OdhaczWMapie   (SharePoint -> Update item)

- List Name: `DT_MigrationMap`
- Id: dynamic content **ID** z GetPending
- Title: dynamic content **Title** z GetPending (pole wymagane)
- MigrationStatus Value: wybierz z listy `PageCreated`
- TargetPageId **[fx]**:

```
body('CreatePage')?['d']?['Id']
```

- TargetUrl **[fx]**:

```
body('CreatePage')?['d']?['Url']
```

- MigratedOn **[fx]**:

```
utcNow()
```

---

## Test

1. Zapisz flow. Top Count = 1 -> Test -> Run.
2. Wejdz do Site Pages — powinna byc nowa strona. Otworz i obejrzyj
   (naglowki, panele z emoji, obrazy z DocMedia).
3. W DT_MigrationMap jeden wiersz ma miec status PageCreated + TargetUrl.
4. Jesli wyglada dobrze: podnies Top Count do 5, potem usun limit
   (puste pole = wszystkie).

## Znane ograniczenia

- Tytul zawierajacy cudzyslow (") rozbije JSON w CreatePage — w razie
  bledu na takiej stronie zglos sie po poprawke.
- Strona o tytule identycznym jak istniejaca dostanie URL z przyrostkiem.
