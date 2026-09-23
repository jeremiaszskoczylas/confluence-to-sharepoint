function main(wb: ExcelScript.Workbook, html: string): string {
  // Sonda struktury zakladek i zalacznikow. Zwraca SAM SZKIELET znacznikow
  // (nazwy tagow, class, id, atrybuty data-*), a tekst zastepuje licznikiem znakow,
  // zeby dalo sie pokazac budowe strony bez ujawniania tresci firmowej.
  const i = html.indexOf('id="main-content"');
  const h = i < 0 ? html : html.substring(i);
  const ile = (w: string) => {
    let n = 0;
    let p = h.indexOf(w);
    while (p >= 0) { n++; p = h.indexOf(w, p + 1); }
    return n;
  };
  const klasy: string[] = [
    "tabs-menu", "tabs-pane", "aui-tabs", "menu-item", "active-pane", "active-tab",
    "deck", "data-label", "cloakToggle", "expand-container", "expand-control",
    "plugin_attachments", "attachments/", "conf-macro", "data-macro-name"
  ];
  let r = "== WYSTAPIENIA ==";
  for (const k of klasy) {
    const n = ile(k);
    if (n > 0) { r += "\n" + k + ": " + n; }
  }
  let start = h.indexOf("tabs-menu");
  if (start < 0) { start = h.indexOf("tabs-pane"); }
  if (start < 0) { start = h.indexOf("data-label"); }
  if (start < 0) { start = h.indexOf("expand-container"); }
  if (start < 0) { return r + "\n\n== BRAK ZAKLADEK W TYM PLIKU =="; }
  const od = Math.max(0, h.lastIndexOf("<", Math.max(0, start - 400)));
  const wyc = h.substring(od, Math.min(h.length, start + 2500));
  r += "\n\n== SZKIELET (tekst zastapiony licznikiem znakow) ==";
  const tRe = /<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/gi;
  let wc = 0;
  let ostatni = "";
  let m = tRe.exec(wyc);
  while (m !== null && wc < 160) {
    if (m[4] !== undefined) {
      const t = m[4].replace(/\s+/g, " ").trim();
      // etykiety zakladek i tytuly pokazujemy wprost - bez nich nie da sie
      // ustalic, skad brac nazwy sekcji; dluzsza tresc zostaje ukryta
      const widoczny = t.length <= 60 &&
        (ostatni === "a" || ostatni === "li" || ostatni === "strong" ||
         (ostatni.charAt(0) === "h" && ostatni.length === 2));
      if (t.length > 0) {
        r += widoczny ? "\n  \"" + t + "\"" : "\n  [tekst " + t.length + " znakow]";
        wc++;
      }
    } else {
      ostatni = m[1] === "" ? m[2].toLowerCase() : "";
      const wazne: string[] = [];
      const aRe = /(class|id|data-[a-z-]+|href|src)=["'][^"']*["']/gi;
      let a = aRe.exec(m[3]);
      while (a !== null) {
        let v = a[0];
        if (v.length > 90) { v = v.substring(0, 90) + "..."; }
        wazne.push(v);
        a = aRe.exec(m[3]);
      }
      r += "\n<" + m[1] + m[2] + (wazne.length > 0 ? " " + wazne.join(" ") : "") + ">";
      wc++;
    }
    m = tRe.exec(wyc);
  }
  return r;
}
