function main(wb: ExcelScript.Workbook, html: string, base: string): string {
  const P: { [k: string]: string } = {
    information: "&#8505; INFO:", note: "&#9888; UWAGA:",
    warning: "&#128721; OSTRZEZENIE:", tip: "&#9989; WSKAZOWKA:"
  };
  const i = html.indexOf('id="main-content"');
  if (i < 0) { return "ERR: brak main-content"; }
  let h = html.substring(i);
  h = h.substring(h.indexOf(">") + 1);
  const e = h.indexOf('<div id="footer"');
  if (e > 0) { h = h.substring(0, e); }

  h = h.replace(/ style="[^"]*"/gi, "");
  h = h.replace(/<span[^>]*class="(cloakToggle|aui-icon)[^"]*"[^>]*><\/span>/gi, "");
  h = h.replace(/<img[^>]*src="images\/icons\/[^"]*"[^>]*>/gi, "");
  h = h.replace(/<img[^>]*data-image-src="([^"]+)"[^>]*>/gi, '<img src="$1">');
  h = h.replace(
    /<div class="confluence-information-macro confluence-information-macro-([a-z]+)">\s*<div class="confluence-information-macro-body">([\s\S]*?)<\/div>\s*<\/div>/gi,
    (m: string, t: string, c: string) =>
      '<table width="100%"><tr><td width="100%"><p><strong>' + (P[t] || "UWAGA:") + '</strong></p>' + c + '</td></tr></table>');
  h = h.replace(/(href|src)="attachments\//gi, '$1="' + base);
  h = h.replace(/href="[^"]*?(\d+)\.html"/gi, 'href="{{CONF:$1}}"');
  h = h.replace(/href="(\/confluence\/display\/~[^"]*|index\.html)"/gi, 'href="#"');
  h = h.replace(/<input[^>]*>/gi, "&#9744; ");
  h = h.replace(/<br[^>]*>\s*(?=<br)/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");

  const segs: { t: string; c: string; k: boolean }[] = [];
  const rx = /<h2[^>]*>([\s\S]*?)<\/h2>\s*<span[^>]*class="cloak[\s"][^>]*>/gi;
  let pos = 0;
  let guard = 0;
  let m2 = rx.exec(h);
  while (m2 !== null && guard < 200) {
    guard++;
    const start = rx.lastIndex;
    const tk = /<span\b|<\/span>/gi;
    tk.lastIndex = start;
    let depth = 1;
    let end = h.length;
    let t2 = tk.exec(h);
    while (t2 !== null) {
      depth += t2[0] === "</span>" ? -1 : 1;
      if (depth === 0) { end = t2.index; break; }
      t2 = tk.exec(h);
    }
    segs.push({ t: "", c: h.substring(pos, m2.index), k: false });
    segs.push({
      t: m2[1].replace(/<[^>]+>/g, "").trim() || "Sekcja",
      c: h.substring(start, end), k: true
    });
    pos = end + 7;
    rx.lastIndex = pos;
    m2 = rx.exec(h);
  }
  segs.push({ t: "", c: h.substring(pos), k: false });

  const used = segs.filter(s =>
    s.k || s.c.replace(/<[^>]+>|&nbsp;|\s/g, "").length > 0);
  const enc = (s: string) => s
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts = used.map((s, n) => {
    const cd: { [k: string]: unknown } = {
      controlType: 4, displayMode: 2,
      id: "b1b1b1b1-0000-4000-8000-" + ("00000000000" + n).slice(-12),
      position: {
        layoutIndex: 1, zoneIndex: n + 1, sectionIndex: 1,
        controlIndex: 1, sectionFactor: 12
      },
      emphasis: {}
    };
    if (s.k) {
      cd["zoneGroupMetadata"] = {
        type: 1, displayName: s.t, isExpanded: false,
        showDividerLine: true, iconAlignment: "left"
      };
    }
    return '<div data-sp-canvascontrol="" data-sp-canvasdataversion="1.0" ' +
      'data-sp-controldata="' + enc(JSON.stringify(cd)) + '">' +
      '<div data-sp-rte="">' + s.c + "</div></div>";
  });
  return parts.join("");
}
