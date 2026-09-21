function main(wb: ExcelScript.Workbook, fragmenty: string): string {
  // Buduje CanvasContent1 strony-mapy: JEDEN web part tekstowy z calym drzewem,
  // fragmenty (korzen + galezie) rozdzielone <hr>. Format 1:1 jak w parseTresc
  // (ten sam, ktorym zapisano zmigrowane strony). Zadnych sekcji, zadnych metadanych.
  let fr: string[];
  try { fr = JSON.parse(fragmenty) as string[]; }
  catch { return "ERR: fragmenty nie sa poprawnym JSON"; }
  if (!Array.isArray(fr) || fr.length === 0) { return "ERR: brak fragmentow"; }
  for (let i = 0; i < fr.length; i++) {
    if (typeof fr[i] !== "string" || fr[i].replace(/<[^>]+>|&nbsp;|\s/g, "").length === 0) {
      return "ERR: fragment nr " + (i + 1) + " jest pusty";
    }
  }
  const h = "<h1>Mapa dokumentacji</h1><hr>" + fr.join("<hr>");
  return JSON.stringify([{
    controlType: 4,
    id: "c5f0a545-0f0d-4f31-9e2e-000000000001",
    position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
    addedFromPersistedData: true,
    innerHTML: h
  }]);
}
