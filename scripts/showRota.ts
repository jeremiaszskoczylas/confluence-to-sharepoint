function main(wb: ExcelScript.Workbook): string {
  // Sonda skoroszytu "rota". Pokazuje strukture arkuszy bez wynoszenia tresci:
  // naglowki, pierwsze kilka wierszy i typy komorek. Na tej podstawie dopasujemy
  // skrypt synchronizujacy (syncRota).
  const out: string[] = [];
  const arkusze = wb.getWorksheets();
  out.push("== ARKUSZE: " + arkusze.length + " ==");
  for (const a of arkusze) {
    out.push("- " + a.getName() + (a.getVisibility() === ExcelScript.SheetVisibility.visible ? "" : "  (ukryty)"));
  }

  const ark = wb.getActiveWorksheet();
  const zakres = ark.getUsedRange();
  if (!zakres) { return out.join("\n") + "\n\n== AKTYWNY ARKUSZ JEST PUSTY =="; }

  out.push("");
  out.push("== AKTYWNY ARKUSZ: " + ark.getName() + " ==");
  out.push("zakres: " + zakres.getAddress());
  const wiersze = zakres.getRowCount();
  const kolumny = zakres.getColumnCount();
  out.push("wierszy: " + wiersze + ", kolumn: " + kolumny);

  const ile = wiersze < 8 ? wiersze : 8;
  const ileKol = kolumny < 14 ? kolumny : 14;
  const wart = zakres.getResizedRange(ile - wiersze, ileKol - kolumny).getValues();
  const typy = zakres.getResizedRange(ile - wiersze, ileKol - kolumny).getValueTypes();

  out.push("");
  out.push("== PIERWSZE " + ile + " WIERSZY (po " + ileKol + " kolumn) ==");
  out.push("Format: [typ] wartosc. Dlugie teksty sa skracane.");
  for (let r = 0; r < ile; r++) {
    const komorki: string[] = [];
    for (let c = 0; c < ileKol; c++) {
      const v = wart[r][c];
      const t = String(typy[r][c]);
      let s = v === null || v === undefined ? "" : String(v);
      if (s.length > 22) { s = s.substring(0, 22) + "…"; }
      komorki.push("[" + t.substring(0, 3) + "]" + s);
    }
    out.push("w" + (r + 1) + ": " + komorki.join(" | "));
  }

  out.push("");
  out.push("== TABELE ==");
  const tabele = ark.getTables();
  if (tabele.length === 0) {
    out.push("brak tabel (dane jako zwykly zakres)");
  } else {
    for (const t of tabele) {
      out.push("- " + t.getName() + ", zakres " + t.getRange().getAddress());
      out.push("  kolumny: " + t.getHeaderRowRange().getValues()[0].join(" | "));
    }
  }
  return out.join("\n");
}
