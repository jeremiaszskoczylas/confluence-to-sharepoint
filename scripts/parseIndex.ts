function main(wb: ExcelScript.Workbook, html: string): string {
  const dec = (s: string) => s
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const re = /<ul|<\/ul|<a href="([^"]+\.html)"[^>]*>([^<]*)<\/a>/gi;
  const out: string[] = [];
  const st: number[] = [];
  let d = 0;
  let x = re.exec(html);
  while (x !== null) {
    if (x[1]) {
      const m = /(\d+)\.html$/.exec(x[1]);
      if (m !== null && d > 0) {
        out.push(m[1] + "|" + (st[d - 1] || 0) + "|" + d + "|" +
                 dec(x[2].trim()) + "|" + x[1]);
        st[d] = Number(m[1]);
      }
    } else if (x[0].charAt(1) === "/") {
      d--;
    } else {
      d++;
    }
    x = re.exec(html);
  }
  return out.length + " stron\n" + out.join("\n");
}
