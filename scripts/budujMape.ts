function main(wb: ExcelScript.Workbook, fragmenty: string): string {
  // Buduje CanvasContent1 strony-mapy: sekcja 1 = korzen (zwykla),
  // kazda kolejna galaz = NATYWNA SEKCJA ZWIJANA SharePointa (zwinieta).
  // Format kontrolek potwierdzony na produkcji testem testSekcje wariant B (2026-09-23).
  let fr: string[];
  try { fr = JSON.parse(fragmenty) as string[]; }
  catch { return "ERR: fragmenty nie sa poprawnym JSON"; }
  if (!Array.isArray(fr) || fr.length === 0) { return "ERR: brak fragmentow"; }
  for (let i = 0; i < fr.length; i++) {
    if (typeof fr[i] !== "string" || fr[i].replace(/<[^>]+>|&nbsp;|\s/g, "").length === 0) {
      return "ERR: fragment nr " + (i + 1) + " jest pusty";
    }
  }
  // nazwa sekcji = tekst pierwszego odnosnika we fragmencie (tytul galezi)
  const nazwa = (s: string, n: number) => {
    const m = /<a[^>]*>([\s\S]*?)<\/a>/i.exec(s);
    if (m === null) { return "Sekcja " + n; }
    const t = m[1].replace(/<[^>]+>/g, "").replace(/&[a-z]+;|&#\d+;/gi, " ")
      .replace(/\s+/g, " ").trim();
    return t.length > 0 ? t : "Sekcja " + n;
  };
  const out: { [k: string]: unknown }[] = [];
  for (let i = 0; i < fr.length; i++) {
    const n = i + 1;
    const k: { [k: string]: unknown } = {
      controlType: 4,
      id: "c5f0a545-0f0d-4f31-9e2e-" + ("000000000000" + String(n)).slice(-12),
      position: {
        layoutIndex: 1, zoneIndex: n, sectionIndex: n,
        controlIndex: 1, sectionFactor: 12
      },
      addedFromPersistedData: true,
      emphasis: {},
      innerHTML: fr[i]
    };
    if (i > 0) {
      k["zoneGroupMetadata"] = {
        type: 1, displayName: nazwa(fr[i], n), isExpanded: false,
        showDividerLine: true, iconAlignment: "left"
      };
    }
    out.push(k);
  }
  return JSON.stringify(out);
}
