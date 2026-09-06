function main(wb: ExcelScript.Workbook, html: string, base: string, tytul: string): string {
  const P: { [k: string]: string } = {
    information: '<font color="#B7791F"><u>&#8505; INFO:</u></font>',
    note: '<font color="#C4314B"><u>&#9888; UWAGA:</u></font>',
    warning: '<font color="#C4314B"><u>&#128721; OSTRZEZENIE:</u></font>',
    tip: '<font color="#107C10"><u>&#9989; WSKAZOWKA:</u></font>'
  };
  const i = html.indexOf('id="main-content"');
  if (i < 0) { return "ERR: brak main-content"; }
  let h = html.substring(i);
  h = h.substring(h.indexOf(">") + 1);
  const e = h.indexOf('<div id="footer"');
  if (e > 0) { h = h.substring(0, e); }

  h = h.replace(/<style[\s\S]*?<\/style>/gi, "");
  h = h.replace(/<div[^>]*class=["'][^"']*toc-macro[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "");
  h = h.replace(/<ul[^>]*class=["'][^"']*toc-indentation[^"']*["'][^>]*>[\s\S]*?<\/ul>/gi, "");
  h = h.replace(
    /<h[1-4][^>]*>(?:[^<]|<(?!\/h[1-4]))*?(?:Table\s*of\s*Contents|Spis\s*tre)(?:[^<]|<(?!\/h[1-4]))*<\/h[1-4]>\s*(?:<span[^>]*class=["']cloak[\s"'][^>]*>(?:[^<]|<(?!\/span>))*<\/span>|<ul[\s\S]*?<\/ul>|<ol[\s\S]*?<\/ol>)?/gi,
    "");
  h = h.replace(
    /<h[1-4][^>]*>(?:[^<]|<(?!\/h[1-4]))*?Change\s*History(?:[^<]|<(?!\/h[1-4]))*<\/h[1-4]>[\s\S]*?(?=<h[1-4][\s>]|$)/gi,
    "");
  h = h.replace(/ style="[^"]*"/gi, "");
  h = h.replace(/<(\/?)h1([^>]*)>/gi, "<$1h2$2>");
  const tyt: string[] = [];
  const kotw: string[] = [];
  h = h.replace(
    /<h2[^>]*>\s*<span[^>]*class="cloakToggle[^"]*"[^>]*><\/span>\s*([\s\S]*?)<\/h2>/gi,
    (m: string, tt: string) => {
      const czysty = tt.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ").trim();
      if (czysty.length === 0) { return m; }
      tyt.push(czysty);
      const pelny = tyt.length + ". " + czysty;
      kotw.push(pelny.toLowerCase().replace(/[^a-z0-9\s.-]/g, "").replace(/\s+/g, "-"));
      return "<h2>" + tyt.length + ". " + tt + "</h2>";
    });
  if (tyt.length > 1) {
    let w = '<table width="100%"><tr><td width="100%" align="left"><small><strong>' +
      "Na tej stronie &mdash; " + tyt.length + ":</strong><br>";
    for (let n = 0; n < tyt.length; n++) {
      w += '<a href="#' + kotw[n] + '">' + (n + 1) + ". " + tyt[n] + "</a><br>";
    }
    w += "</small></td></tr></table>";
    const gdzie = h.indexOf("<h2>1. ");
    h = gdzie >= 0 ? h.substring(0, gdzie) + w + h.substring(gdzie) : w + h;
  }
  const gRe = /<p[^>]*>\s*<span[^>]*class="cloakToggle[^"]*"[^>]*><\/span>\s*([\s\S]*?)<\/p>\s*<span[^>]*class="cloak[\s"][^>]*>/gi;
  let wyn = "";
  let poz = 0;
  let wTab = false;
  let str2 = 0;
  let g = gRe.exec(h);
  while (g !== null && str2 < 400) {
    str2++;
    const etyk = g[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const bStart = gRe.lastIndex;
    const tk2 = /<span\b|<\/span>/gi;
    tk2.lastIndex = bStart;
    let d2 = 1;
    let kon = h.length;
    let t3 = tk2.exec(h);
    while (t3 !== null) {
      d2 += t3[0].charAt(1) === "/" ? -1 : 1;
      if (d2 === 0) { kon = t3.index; break; }
      t3 = tk2.exec(h);
    }
    const przed = h.substring(poz, g.index);
    const dalej = wTab && przed.replace(/\s|<br[^>]*>/gi, "").length === 0;
    if (!dalej) {
      if (wTab) { wyn += "</table>"; }
      wyn += przed + '<table width="100%">';
      wTab = true;
    }
    const low = etyk.toLowerCase();
    let ozn = "<strong>" + etyk + "</strong>";
    if (low === "yes" || low === "tak") {
      ozn = '<font color="#107C10"><strong>&#10003; ' + etyk + "</strong></font>";
    } else if (low === "no" || low === "nie") {
      ozn = '<font color="#C4314B"><strong>&#10007; ' + etyk + "</strong></font>";
    }
    wyn += '<tr><td width="15%" align="left">' + ozn + "</td>" +
      '<td align="left">' + h.substring(bStart, kon) + "</td></tr>";
    poz = kon + 7;
    gRe.lastIndex = poz;
    g = gRe.exec(h);
  }
  if (wTab) { wyn += "</table>"; }
  h = wyn + h.substring(poz);
  h = h.replace(/<span[^>]*class="(cloakToggle|aui-icon)[^"]*"[^>]*><\/span>/gi, "");
  h = h.replace(/<img[^>]*src="images\/icons\/[^"]*"[^>]*>/gi, "");
  h = h.replace(/<img[^>]*data-image-src="([^"]+)"[^>]*>/gi, '<img src="$1">');
  h = h.replace(
    /<div class="confluence-information-macro confluence-information-macro-([a-z]+)">\s*<div class="confluence-information-macro-body">([\s\S]*?)<\/div>\s*<\/div>/gi,
    (m: string, t: string, c: string) =>
      '<table width="100%"><tr><td width="100%" align="left"><small><strong>' +
      (P[t] || "UWAGA:") + '</strong><br>' +
      c.replace(/<\/p>\s*<p[^>]*>/gi, "<br>").replace(/<\/?p[^>]*>/gi, "") +
      '</small></td></tr></table>');
  h = h.replace(/(href|src)="(?:\.\.\/)+[^"]*?attachments\//gi, '$1="' + base);
  h = h.replace(/(href|src)="attachments\//gi, '$1="' + base);
  h = h.replace(/href="[^"]*?(\d+)\.html"/gi, 'href="{{CONF:$1}}"');
  h = h.replace(/href="(\/confluence\/display\/~[^"]*|index\.html)"/gi, 'href="#"');
  h = h.replace(/<input[^>]*>/gi, "&#9744; ");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<h2/gi, "<hr><h2");
  h = h.replace(/^\s*<hr>/, "");
  if (tytul !== undefined && tytul !== null && tytul.length > 0) {
    h = "<h1>" + tytul + "</h1><hr>" + h;
  }
  const canvas = [{
    controlType: 4,
    id: "c5f0a545-0f0d-4f31-9e2e-000000000001",
    position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
    addedFromPersistedData: true,
    innerHTML: h
  }];
  return JSON.stringify(canvas);
}