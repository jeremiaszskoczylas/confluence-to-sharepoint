function main(wb: ExcelScript.Workbook, dane: string, witryna: string): string {
  interface W {
    Id: number; ID?: number; Title: string; ConfluenceId: number; ParentConfluenceId: number;
    SourceFile: string; TargetUrl: string; TargetPageId: number;
  }
  const surowe: W[] = JSON.parse(dane) as W[];
  for (const r of surowe) {
    if ((r.Id === undefined || r.Id === null) && r.ID !== undefined) { r.Id = r.ID; }
  }
  const rows: W[] = surowe.filter(r => r.TargetPageId > 0 && r.Id !== undefined);
  const byConf: { [k: string]: W } = {};
  for (const r of rows) { byConf[String(r.ConfluenceId)] = r; }

  const url = (r: W) => witryna + r.TargetUrl;
  const bezNr = (t: string) => t.replace(/^\d+\.\s*/, "");
  const pad = (n: number) => ("00000" + n).slice(-5);
  const kids = (cid: number) =>
    rows.filter(r => r.ParentConfluenceId === cid).sort((a, b) => a.Id - b.Id);
  const link = (r: W) => '<a href="' + url(r) + '">' + r.Title + "</a>";
  const ramka = (nag: string, srodek: string) =>
    '<table width="100%"><tr><td width="100%" align="left"><small><strong>' +
    nag + "</strong><br>" + srodek + "</small></td></tr></table>";

  const przodkowie = (r: W): W[] => {
    const out: W[] = [];
    let cur = byConf[String(r.ParentConfluenceId)];
    let g = 0;
    while (cur !== undefined && g < 20) {
      out.unshift(cur);
      cur = byConf[String(cur.ParentConfluenceId)];
      g++;
    }
    return out;
  };

  const pages = rows.map(r => {
    const a = przodkowie(r);
    const chain = a.concat([r]);
    const top = chain[0];
    const branch = chain.filter(x => x.ParentConfluenceId === top.ConfluenceId)[0];
    const parent = byConf[String(r.ParentConfluenceId)];
    const sib = kids(r.ParentConfluenceId);
    let pos = 0;
    for (let i = 0; i < sib.length; i++) { if (sib[i].ConfluenceId === r.ConfluenceId) { pos = i + 1; } }
    const dzieci = kids(r.ConfluenceId);
    return {
      id: r.Id,
      confId: r.ConfluenceId,
      pageId: r.TargetPageId,
      file: r.SourceFile,
      title: r.Title,
      parentPageId: parent !== undefined ? Number(parent.TargetPageId) : 0,
      category: branch !== undefined ? bezNr(branch.Title) : "",
      treePath: "/" + chain.map(x => String(x.ConfluenceId)).join("/") + "/",
      treeSort: chain.map(x => pad(x.Id)).join("."),
      sortOrder: pos * 10,
      nag: a.map(link).join(" &rsaquo; "),
      pod: dzieci.length > 0
        ? ramka("Podstrony &mdash; " + dzieci.length + ":", dzieci.map(link).join("<br>"))
        : ""
    };
  });

  const L: { [k: string]: string } = {};
  for (const r of rows) {
    L[String(r.ConfluenceId)] = url(r);
    L["t:" + r.Title.toLowerCase().trim()] = url(r);
  }

  const lista = (n: W): string => {
    const ch = kids(n.ConfluenceId);
    if (ch.length === 0) { return ""; }
    return "<ul>" + ch.map(c => "<li>" + link(c) + lista(c) + "</li>").join("") + "</ul>";
  };
  const roots = rows.filter(r => byConf[String(r.ParentConfluenceId)] === undefined)
    .sort((a, b) => a.Id - b.Id);
  const mapa: string[] = [];
  if (roots.length > 0) {
    const root = roots[0];
    mapa.push("<p>&#127968; <strong>" + link(root) + "</strong></p>");
    for (const b of kids(root.ConfluenceId)) {
      mapa.push("<p><strong>" + link(b) + "</strong></p>" + lista(b));
    }
  }

  return JSON.stringify({ pages: pages, linki: JSON.stringify(L), mapa: mapa });
}
