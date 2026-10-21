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
  // --- zakladki (makro Tabs Container z Confluence) ---
  // W eksporcie statycznym menu <ul class="tabs-menu"> jest PUSTE (Confluence buduje je
  // JavaScriptem), a tytul kazdej zakladki siedzi w atrybucie data-pane-title panelu.
  // Panele leca jeden po drugim, wiec bez oznaczenia tresc wariantow zlewa sie w ciag.
  // Kazda zakladka staje sie natywna sekcja zwijana; aktywna karta zostaje rozwinieta.
  h = h.replace(/<ul[^>]*class=["'][^"']*tabs-menu[^"']*["'][^>]*>[\s\S]*?<\/ul>/gi, "");
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
  // data-pane-title bywa zapisany samymi malymi literami - na pasku sekcji wyglada to zle,
  // wiec podnosimy pierwsze litery slow. Tytul z wielkimi literami zostaje nietkniety.
  const tytulZak = (s: string): string => {
    const t = s.replace(/\s+/g, " ").trim();
    if (t !== t.toLowerCase()) { return t; }
    const w = t.split(" ");
    let r = "";
    for (let i = 0; i < w.length; i++) {
      if (w[i].length === 0) { continue; }
      const duze = i === 0 || w[i].length > 2;
      r += (r.length > 0 ? " " : "") +
        (duze ? w[i].charAt(0).toUpperCase() + w[i].substring(1) : w[i]);
    }
    return r;
  };
  // Nazwa zakladki: data-pane-title, w jego braku NAGLOWEK OTWIERAJACY panel
  // (wtedy znika z tresci, zeby nie dublowal paska sekcji), na koncu numer.
  let pary = false;
  const znacznik = (atr: string, tresc: string, nr: number, bylo: boolean): string => {
    const pt = /data-pane-title=["']([^"']*)["']/.exec(atr);
    const ng = /^\s*<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/i.exec(tresc);
    let e = "";
    let dalej = tresc;
    if (pt !== null && pt[1].trim().length > 0) { e = tytulZak(pt[1]); }
    else if (ng !== null && czysty(ng[2]).length > 0) {
      e = czysty(ng[2]);
      dalej = tresc.substring(ng.index + ng[0].length);
    } else { e = "Zakladka " + nr; }
    const nazwa = czysty(e).replace(/--+>?|[<>]/g, " ").replace(/\s+/g, " ").trim();
    // Para zakladek (np. EMS / MyDay) -> dwie kolumny obok siebie, tytul jako naglowek
    // w kolumnie. Wiecej niz dwie -> sekcje zwijane, bo trzy kolumny sa za waskie.
    if (pary) {
      return "<!--SEK:" + (nr === 1 ? "L" : "P") + ":-->" +
        "<h2>" + nazwa + "</h2>" + dalej;
    }
    const roz = atr.indexOf("active-pane") >= 0 || (nr === 1 && !bylo);
    return "<!--SEK:" + (roz ? "1" : "0") + ":" + nazwa + "-->" + dalej;
  };
  // Panele przetwarzamy W OBREBIE kontenera, zeby kazda grupa zakladek byla
  // rozpatrywana osobno (na stronie bywa kilka grup).
  const panelRe = /<div([^>]*class=["'][^"']*tabs-pane[^"']*["'][^>]*)>/gi;
  const ilePaneli = (s: string) => {
    let n = 0;
    const r = /<div[^>]*class=["'][^"']*tabs-pane[^"']*["'][^>]*>/gi;
    let m = r.exec(s);
    while (m !== null) { n++; m = r.exec(s); }
    return n;
  };
  const panele = (tresc: string): string => {
    let nr = 0;
    const bylo = tresc.indexOf("active-pane") >= 0;
    pary = ilePaneli(tresc) === 2;
    return wytnijDiv(tresc, panelRe, (atr: string, wnetrze: string) => {
      nr++;
      return znacznik(atr, wnetrze, nr, bylo);
    }, "");
  };
  h = wytnijDiv(h, /<div[^>]*class=["'][^"']*aui-tabs[^"']*["'][^>]*>/gi,
    (atr: string, tresc: string) => panele(tresc), "<!--/SEK-->");
  h = panele(h);
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
  // Etykieta nie moze wyjsc poza swoj akapit — (?!<\/p>) zatrzymuje ja na koncu <p>.
  // Miedzy akapitem a cloakiem dopuszczamy puste znaczniki, bo czyszczenie
  // pustych elementow dzieje sie dopiero pozniej.
  const gRe = /<p[^>]*>\s*<span[^>]*class="cloakToggle[^"]*"[^>]*><\/span>\s*((?:[^<]|<(?!\/p>))*)<\/p>(?:\s|<p[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/p>|<div[^>]*><\/div>)*<span[^>]*class="cloak[\s"][^>]*>/gi;
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
  h = h.replace(/href="(?!https?:)[^"]*?(\d+)\.html"/gi, 'href="{{CONF:$1}}"');
  h = h.replace(/href="(\/confluence\/display\/~[^"]*|index\.html)"/gi, 'href="#"');
  h = h.replace(/<input[^>]*>/gi, "&#9744; ");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;|<br[^>]*>)*<\/\1>/gi, "");
  h = h.replace(/<h2/gi, "<hr><h2");
  h = h.replace(/^\s*<hr>/, "");
  // Uszkodzone mapowanie nie moze wywrocic calego biegu. Przy bledzie parsowania
  // ZOSTAWIAMY placeholdery {{CONF:id}} nietkniete: sa widoczne na stronie i od razu
  // wiadomo, ze trzeba powtorzyc bieg. Podmiana na "#" nastepuje tylko wtedy, gdy
  // mapowanie jest poprawne, a danej strony w nim nie ma (nie zostala zmigrowana).
  let mapaOk = false;
  let L: { [k: string]: string } = {};
  if (linki !== undefined && linki !== null && linki.length > 1) {
    try { L = JSON.parse(linki) as { [k: string]: string }; mapaOk = true; }
    catch { mapaOk = false; }
  }
  if (mapaOk) {
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
  // Znaczniki wstawila wczesniej obsluga cloakow i zakladek:
  //   <!--SEK:1:nazwa--> sekcja zwijana rozwinieta, <!--SEK:0:nazwa--> zwinieta,
  //   <!--SEK:L:--> lewa kolumna, <!--SEK:P:--> prawa kolumna, <!--/SEK--> koniec.
  // Brak znacznikow = jedna kontrolka, czyli format sprzed tej zmiany
  // (strony bez cloakow i zakladek sa nietkniete).
  interface Seg { nazwa: string; rozwin: boolean; kol: string; tresc: string }
  const segs: Seg[] = [];
  const zRe = /<!--SEK:([01LP]):([\s\S]*?)-->|<!--\/SEK-->/g;
  let ost = 0;
  let biez: Seg = { nazwa: "", rozwin: true, kol: "", tresc: "" };
  let z = zRe.exec(h);
  while (z !== null) {
    biez.tresc += h.substring(ost, z.index);
    segs.push(biez);
    ost = z.index + z[0].length;
    biez = z[1] !== undefined
      ? {
        nazwa: z[1] === "L" || z[1] === "P" ? "" : z[2],
        rozwin: z[1] === "1", kol: z[1] === "L" || z[1] === "P" ? z[1] : "", tresc: ""
      }
      : { nazwa: "", rozwin: true, kol: "", tresc: "" };
    z = zRe.exec(h);
  }
  biez.tresc += h.substring(ost);
  segs.push(biez);
  const pelne: Seg[] = segs.filter(s =>
    s.tresc.replace(/<[^>]+>|&nbsp;|\s/g, "").length > 0 || s.nazwa.length > 0);
  if (pelne.length === 0) { pelne.push({ nazwa: "", rozwin: true, kol: "", tresc: h }); }

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
  let zone = 0;
  for (let n = 0; n < pelne.length; n++) {
    const s = pelne[n];
    let t = zbilansuj(s.tresc.replace(/^\s*<hr>/, ""));
    if (t.replace(/<[^>]+>|&nbsp;|\s/g, "").length === 0) { t = "<p></p>"; }
    // Prawa kolumna dzieli sekcje z lewa (ten sam zoneIndex, sectionIndex 1 i 2,
    // polowa szerokosci). Pozostale segmenty dostaja wlasna sekcje na pelna szerokosc.
    if (s.kol !== "P") { zone++; }
    const k: { [k: string]: unknown } = {
      controlType: 4,
      id: "c5f0a545-0f0d-4f31-9e2e-" + ("000000000000" + String(n + 1)).slice(-12),
      position: {
        layoutIndex: 1,
        zoneIndex: zone,
        sectionIndex: s.kol === "L" ? 1 : (s.kol === "P" ? 2 : zone),
        controlIndex: 1,
        sectionFactor: s.kol === "" ? 12 : 6
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
