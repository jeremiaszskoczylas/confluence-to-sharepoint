function main(wb: ExcelScript.Workbook, html: string): string {
  const uniq = (re: RegExp) => {
    const m: { [k: string]: number } = {};
    let x = re.exec(html);
    while (x !== null) {
      const k = x[1].substring(0, 60);
      m[k] = (m[k] || 0) + 1;
      x = re.exec(html);
    }
    return Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, 15)
      .map(k => m[k] + "x  " + k).join("\n");
  };

  return [
    "ROZMIAR: " + html.length,
    "MAIN-CONTENT: " + html.indexOf("main-content"),
    "== TAGI ==", uniq(/<([a-z][a-z0-9]*)/gi),
    "== KLASY ==", uniq(/class="([^"]+)"/gi),
    "== MAKRA ==", uniq(/data-macro-name="([^"]+)"/gi),
    "== IMG ==", uniq(/<img[^>]+src="([^"]+)"/gi),
    "== LINKI ==", uniq(/<a[^>]+href="([^"]+)"/gi)
  ].join("\n");
}
