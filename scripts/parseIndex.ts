function main(wb: ExcelScript.Workbook, html: string): string {
  // Tytul czyscimy ze znacznikow (<em>, <code>) i z pionowej kreski, ktora jest
  // separatorem pol - inaczej wiersz mialby 6 pol i rozjechalby parsowanie we flow.
  const dec = (s: string) => s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\|/g, "/").replace(/\s+/g, " ").trim();
  // href moze nie byc pierwszym atrybutem, a tytul moze zawierac znaczniki
  // (<em>, <code>) - wczesniej takie strony wypadaly z wyniku bez sladu.
  const re = /<ul|<\/ul|<a[^>]*href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
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
