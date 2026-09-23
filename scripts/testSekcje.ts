function main(wb: ExcelScript.Workbook, wariant: string): string {
  // Eksperyment: ktory format CanvasContent1 renderuje sie na NOWO tworzonej stronie.
  // Wariant A - dwie zwykle sekcje (czy wiele sekcji w ogole dziala)
  // Wariant B - dwie sekcje ZWIJANE (zoneGroupMetadata na kazdej kontrolce grupy)
  // Wariant C - jedna sekcja, dwie kolumny obok siebie (sectionFactor 6)
  // Wariant D - kontrola: jedna kontrolka, format sprawdzony na produkcji
  const w = wariant.toUpperCase().trim();
  const gid = (n: number) => "c5f0a545-0f0d-4f31-9e2e-" + ("000000000000" + String(n)).slice(-12);
  const tekst = (n: number, tresc: string, zone: number, factor: number) => ({
    controlType: 4,
    id: gid(n),
    position: {
      layoutIndex: 1, zoneIndex: zone, sectionIndex: n,
      controlIndex: 1, sectionFactor: factor
    },
    addedFromPersistedData: true,
    innerHTML: tresc
  });
  const opis = "<p>Wariant " + w + " &mdash; jesli to widzisz, ten format dziala.</p>";

  if (w === "A") {
    return JSON.stringify([
      tekst(1, "<h2>Sekcja pierwsza</h2>" + opis, 1, 12),
      tekst(2, "<h2>Sekcja druga</h2><p>Druga sekcja, zwykla.</p>", 2, 12)
    ]);
  }
  if (w === "B") {
    const grupa = (n: number, nazwa: string, tresc: string, rozwin: boolean) => {
      const k = tekst(n, tresc, n, 12);
      return {
        controlType: k.controlType, id: k.id, position: k.position,
        addedFromPersistedData: k.addedFromPersistedData,
        emphasis: {},
        zoneGroupMetadata: {
          type: 1, displayName: nazwa, isExpanded: rozwin,
          showDividerLine: true, iconAlignment: "left"
        },
        innerHTML: k.innerHTML
      };
    };
    return JSON.stringify([
      grupa(1, "Zwijana sekcja pierwsza", opis, true),
      grupa(2, "Zwijana sekcja druga", "<p>Ta powinna byc zwinieta.</p>", false)
    ]);
  }
  if (w === "C") {
    const a = tekst(1, "<h2>Lewa kolumna</h2>" + opis, 1, 6);
    const b = tekst(2, "<h2>Prawa kolumna</h2><p>Obok lewej.</p>", 1, 6);
    b.position.sectionIndex = 2;
    return JSON.stringify([a, b]);
  }
  return JSON.stringify([tekst(1, "<h2>Kontrola</h2>" + opis, 1, 12)]);
}
