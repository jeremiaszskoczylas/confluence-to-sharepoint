function main(wb: ExcelScript.Workbook, canvas: string, fragmenty: string): string {
  const fr: string[] = JSON.parse(fragmenty) as string[];
  const znak = "<div data-sp-canvascontrol";
  const parts = canvas.split(znak);
  let n = 0;
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const rte = p.indexOf("data-sp-rte");
    if (rte < 0) { continue; }
    const start = p.indexOf(">", rte) + 1;
    // koniec tresci = poczatek koncowego ciagu </div> (rte + kontrolka [+ zewnetrzny wrapper])
    const ogon = /(\s*<\/div>)+\s*$/.exec(p);
    const end = ogon !== null ? ogon.index : -1;
    if (start <= 0 || end < start) { continue; }
    if (n < fr.length) { parts[i] = p.substring(0, start) + fr[n] + p.substring(end); }
    n++;
  }
  if (n !== fr.length) {
    return "ERR: web partow tekstowych na stronie: " + n + ", fragmentow do wstawienia: " + fr.length;
  }
  return parts.join(znak);
}
