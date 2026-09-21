function main(wb: ExcelScript.Workbook, canvas: string, fragmenty: string): string {
  // Wariant awaryjny: WSZYSTKIE fragmenty w JEDNYM web parcie tekstowym, rozdzielone <hr>.
  // To jest 1:1 format, ktorym parseTresc zapisal 60 stron (1 kontrolka, 1 sekcja) -
  // jesli i to daje pusta strone, wina jest po stronie strony, nie formatu.
  // Parametr canvas jest ignorowany - zostal, zeby nie zmieniac akcji w flow.
  let fr: string[];
  try { fr = JSON.parse(fragmenty) as string[]; }
  catch { return "ERR: fragmenty nie sa poprawnym JSON"; }
  if (!Array.isArray(fr) || fr.length === 0) { return "ERR: brak fragmentow do wstawienia"; }
  for (let i = 0; i < fr.length; i++) {
    if (typeof fr[i] !== "string" || fr[i].replace(/<[^>]+>|&nbsp;|\s/g, "").length === 0) {
      return "ERR: fragment nr " + (i + 1) + " jest pusty";
    }
  }
  return JSON.stringify([{
    controlType: 4,
    id: "c5f0a545-0f0d-4f31-9e2e-000000000001",
    position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
    addedFromPersistedData: true,
    innerHTML: fr.join("<hr>")
  }]);
}
