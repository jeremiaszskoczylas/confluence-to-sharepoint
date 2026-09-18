function main(wb: ExcelScript.Workbook, canvas: string, fragmenty: string): string {
  const fr: string[] = JSON.parse(fragmenty) as string[];
  const dek = (s: string) => s
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (m: string, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
  const parts = canvas.split("<div data-sp-canvascontrol");
  const out: { [k: string]: unknown }[] = [];
  let n = 0;
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const m = /data-sp-controldata="([^"]*)"/.exec(p);
    if (m === null) { continue; }
    let ctl: { [k: string]: unknown };
    try { ctl = JSON.parse(dek(m[1])) as { [k: string]: unknown }; }
    catch { return "ERR: nie mozna odczytac controldata kontrolki nr " + i; }
    if (p.indexOf("data-sp-rte") >= 0) {
      if (n < fr.length) {
        ctl["innerHTML"] = fr[n];
        ctl["addedFromPersistedData"] = true;
      }
      n++;
    }
    out.push(ctl);
  }
  if (n !== fr.length) {
    return "ERR: web partow tekstowych na stronie: " + n + ", fragmentow do wstawienia: " + fr.length;
  }
  return JSON.stringify(out);
}
