function main(wb: ExcelScript.Workbook, canvas: string, fragmenty: string): string {
  // v3: buduje kanwe mapy OD ZERA w jedynym formacie, ktory na pewno renderuje
  // (ten sam co SaveDraft w Flow 3/4: minimalna kontrolka tekstowa, bez metadanych sekcji).
  // Kazdy fragment = osobna sekcja (zoneIndex 1..N), zeby dalo sie potem recznie
  // wlaczyc zwijanie sekcji w edytorze strony.
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
  const out = fr.map((h: string, n: number) => ({
    controlType: 4,
    id: "c5f0a545-0f0d-4f31-9e2e-" + ("000000000000" + String(n + 1)).slice(-12),
    position: { layoutIndex: 1, zoneIndex: n + 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
    addedFromPersistedData: true,
    innerHTML: h
  }));
  return JSON.stringify(out);
}
