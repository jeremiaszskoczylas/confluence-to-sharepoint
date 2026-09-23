function main(wb: ExcelScript.Workbook, html: string, base: string, tytul: string,
  linki: string, nag: string, pod: string): string {
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
  // --- zakladki (makra Tabs / Tab Container / Deck of Cards z Confluence) ---
  // W eksporcie statycznym nie ma JS: panele leca jeden po drugim, bez oznaczen,
  // przez co tresc wariantow zlewa sie w jeden ciag. Zamieniamy je na jawne bloki:
  // wykaz zakladek + naglowek H3 z etykieta przed trescia kazdego wariantu.
  const etyk: { [k: string]: string } = {};
  const kolejka: string[] = [];
  h = h.replace(
    /<ul[^>]*class=["'][^"']*tabs-menu[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi,
    (m: string, srodek: string) => {
      const aRe = /<a[^>]*href=["']#([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      const nazwy: string[] = [];
      let a = aRe.exec(srodek);
      while (a !== null) {
        const t = a[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (t.length > 0) { etyk[a[1]] = t; kolejka.push(t); nazwy.push(t); }
        a = aRe.exec(srodek);
      }
      if (nazwy.length === 0) { return ""; }
      return '<p><small><font color="#605E5C"><u>&#128209; Zak&#322;adki (' +
        nazwy.length + "): " + nazwy.join(" &middot; ") +
        " &mdash; ponizej wszystkie warianty</u></font></small></p>";
    });
  // Kazda zakladka staje sie natywna sekcja zwijana. Kontener i panele znikaja,
  // zeby segmenty mialy zbilansowane znaczniki; aktywna karta zostaje rozwinieta.
  const byloAktywne = h.indexOf("active-pane") >= 0;
  let nrZak = 0;
  const wytnijDiv = (s: string, wzor: RegExp,
    buduj: (atr: string, tresc: string) => string, post: string): string => {
    let wynik = s;
    for (let it = 0; it < 200; it++) {
      wzor.lastIndex = 0;
      const g = wzor.exec(wynik);
      if (g === null) { break; }
      const po = g.index + g[0].length;
      const tk = /<div\b|<\/div>/gi;
      tk.lastIndex = po;
      let d = 1;
      let kon = -1;
      let t = tk.exec(wynik);
      while (t !== null) {
        d += t[0].charAt(1) === "/" ? -1 : 1;
        if (d === 0) { kon = t.index; break; }
        t = tk.exec(wynik);
      }
      if (kon < 0) { break; }
      wynik = wynik.substring(0, g.index) + buduj(g[1] !== undefined ? g[1] : "",
        wynik.substring(po, kon)) + post + wynik.substring(kon + 6);
    }
    return wynik;
  };
  const czysty = (s: string) => s.replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;|&#\d+;/gi, " ").replace(/\s+/g, " ").trim();
  // Nazwa zakladki: etykieta z menu, potem atrybut, potem NAGLOWEK OTWIERAJACY panel
  // (wtedy znika z tresci, zeby nie dublowal paska sekcji), na koncu numer.
  const znacznik = (atr: string, tresc: string): string => {
    nrZak++;
    const idm = /id=[\"\']([^\"\']+)[\"\']/.exec(atr);
    const dlm = /data-label=[\"\']([^\"\']+)[\"\']/.exec(atr);
    const ng = /^\s*<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/i.exec(tresc);
    let e = "";
    let dalej = tresc;
    if (idm !== null && etyk[idm[1]] !== undefined) { e = etyk[idm[1]]; }
    else if (dlm !== null) { e = dlm[1]; }
    else if (ng !== null && czysty(ng[2]).length > 0) {
      e = czysty(ng[2]);
      dalej = tresc.substring(ng.index + ng[0].length);
    } else {
      const k = kolejka.shift();
      e = k !== undefined ? k : "Zakladka " + nrZak;
    }
    const roz = atr.indexOf("active-pane") >= 0 || (nrZak === 1 && !byloAktywne);
    return "<!--SEK:" + (roz ? "1" : "0") + ":" +
      czysty(e).replace(/--+>?|[<>]/g, " ").replace(/\s+/g, " ").trim() + "-->" + dalej;
  };
  h = wytnijDiv(h, /<div[^>]*class=[\"\'][^\"\']*(?:aui-tabs|deck)[^\"\']*[\"\'][^>]*>/gi,
    (atr: string, tresc: string) => tresc, "<!--/SEK-->");
  h = wytnijDiv(h, /<div([^>]*class=[\"\'][^\"\']*tabs-pane[^\"\']*[\"\'][^>]*)>/gi,
    (atr: string, tresc: string) => znacznik(atr, tresc), "");
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
  if (linki !== undefined && linki !== null && linki.length > 1) {
    const L: { [k: string]: string } = JSON.parse(linki) as { [k: string]: string };
    h = h.replace(/href="\{\{CONF:(\d+)\}\}"/g,
      (m: string, id: string) => 'href="' + (L[id] !== undefined ? L[id] : "#") + '"');
    h = h.replace(/href="https?:\/\/[^"]*\/display\/[^\/"]+\/([^"#?]+)[^"]*"/gi,
      (m: string, t: string) => {
        let nazwa = t.replace(/\+/g, " ");
        try { nazwa = decodeURIComponent(nazwa); } catch { nazwa = t; }
        const u = L["t:" + nazwa.toLowerCase().trim()];
        return u !== undefined ? 'href="' + u + '"' : m;
      });
  }
  let gora = "";
  if (nag !== undefined && nag !== null && nag.length > 0) {
    gora += "<p><small>" + nag + "</small></p>";
  }
  if (tytul !== undefined && tytul !== null && tytul.length > 0) {
    gora += "<h1>" + tytul + "</h1><hr>";
  }
  h = gora + h;
  if (pod !== undefined && pod !== null && pod.length > 0) {
    h = h + (h.indexOf("<!--SEK:") >= 0 ? "<!--/SEK-->" : "") + "<hr>" + pod;
  }
  // --- podzial na sekcje strony ---
  // Znaczniki <!--SEK:R:nazwa--> (R=1 rozwinieta, 0 zwinieta) i <!--/SEK--> wstawila
  // wczesniej obsluga cloakow i zakladek. Brak znacznikow = jedna kontrolka, czyli
  // dokladnie format sprzed tej zmiany (strony bez cloakow/zakladek sa nietkniete).
  interface Seg { nazwa: string; rozwin: boolean; tresc: string }
  const segs: Seg[] = [];
  const zRe = /<!--SEK:([01]):([\s\S]*?)-->|<!--\/SEK-->/g;
  let ost = 0;
  let biez: Seg = { nazwa: "", rozwin: true, tresc: "" };
  let z = zRe.exec(h);
  while (z !== null) {
    biez.tresc += h.substring(ost, z.index);
    segs.push(biez);
    ost = z.index + z[0].length;
    biez = z[1] !== undefined
      ? { nazwa: z[2], rozwin: z[1] === "1", tresc: "" }
      : { nazwa: "", rozwin: true, tresc: "" };
    z = zRe.exec(h);
  }
  biez.tresc += h.substring(ost);
  segs.push(biez);
  const pelne: Seg[] = segs.filter(s =>
    s.tresc.replace(/<[^>]+>|&nbsp;|\s/g, "").length > 0 || s.nazwa.length > 0);
  if (pelne.length === 0) { pelne.push({ nazwa: "", rozwin: true, tresc: h }); }

  // Kazdy segment musi miec zbilansowane <div> - osierocone domkniecia zostaja
  // po kontenerze main-content albo po wycietym kontenerze zakladek.
  const zbilansuj = (t: string): string => {
    let d = 0;
    let w = t.replace(/<div\b[^>]*>|<\/div>/gi, (m: string) => {
      if (m.charAt(1) === "/") {
        if (d === 0) { return ""; }
        d--;
        return m;
      }
      d++;
      return m;
    });
    while (d > 0) { w += "</div>"; d--; }
    return w;
  };
  const canvas: { [k: string]: unknown }[] = [];
  for (let n = 0; n < pelne.length; n++) {
    const s = pelne[n];
    let t = zbilansuj(s.tresc.replace(/^\s*<hr>/, ""));
    if (t.replace(/<[^>]+>|&nbsp;|\s/g, "").length === 0) { t = "<p></p>"; }
    const k: { [k: string]: unknown } = {
      controlType: 4,
      id: "c5f0a545-0f0d-4f31-9e2e-" + ("000000000000" + String(n + 1)).slice(-12),
      position: {
        layoutIndex: 1, zoneIndex: n + 1, sectionIndex: n + 1,
        controlIndex: 1, sectionFactor: 12
      },
      addedFromPersistedData: true,
      emphasis: {},
      innerHTML: t
    };
    if (s.nazwa.length > 0) {
      k["zoneGroupMetadata"] = {
        type: 1, displayName: s.nazwa, isExpanded: s.rozwin,
        showDividerLine: true, iconAlignment: "left"
      };
    }
    canvas.push(k);
  }
  return JSON.stringify(canvas);
}
