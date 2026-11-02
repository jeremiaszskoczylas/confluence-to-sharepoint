function main(wb: ExcelScript.Workbook, dane: string, witryna: string, serwis: string): string {
  interface W {
    Id: number; ID?: number; Title: string; ConfluenceId: number; ParentConfluenceId: number;
    SourceFile: string; TargetUrl: string; TargetPageId: number; Service?: string;
    MigrationStatus?: string | { Value?: string };
  }
  let surowe: W[];
  try { surowe = JSON.parse(dane) as W[]; }
  catch { return '{"blad":"dane nie sa poprawnym JSON"}'; }
  if (!Array.isArray(surowe)) { return '{"blad":"dane nie sa tablica"}'; }

  for (const r of surowe) {
    if ((r.Id === undefined || r.Id === null) && r.ID !== undefined) { r.Id = r.ID; }
  }
  // Gdy podano serwis, bierzemy TYLKO jego strony - dzieki temu drzewo, linki
  // i mapa kazdego serwisu sa liczone osobno i nie mieszaja sie ze soba.
  const kod = (serwis === undefined || serwis === null) ? "" : serwis.trim();
  // Wiersz bez ConfluenceId albo bez Title rozsypuje drzewo (kids(undefined) laczy
  // takie wiersze w petle) albo wywraca skrypt na toLowerCase - odrzucamy je tutaj.
  const rows: W[] = surowe.filter(r =>
    r.TargetPageId > 0 && r.Id !== undefined && r.Id !== null &&
    r.ConfluenceId !== undefined && r.ConfluenceId !== null &&
    r.Title !== undefined && r.Title !== null && String(r.Title).length > 0 &&
    (kod.length === 0 || (r.Service !== undefined && r.Service !== null && r.Service === kod))
  );
  const pominiete = surowe.length - rows.length;
  if (rows.length === 0) {
    return '{"blad":"brak stron do przetworzenia' +
      (kod.length > 0 ? " dla serwisu " + kod : "") +
      ' - sprawdz kolumny Service, TargetPageId, ConfluenceId i Title"}';
  }

  // MigrationStatus z konektora SharePointa przychodzi jako obiekt {Value:"..."},
  // a z czystego REST jako tekst - obslugujemy oba ksztalty.
  const status = (r: W): string => {
    const s = r.MigrationStatus;
    if (s === undefined || s === null) { return ""; }
    if (typeof s === "string") { return s.trim(); }
    const v = s.Value;
    return (v === undefined || v === null) ? "" : String(v).trim();
  };

  const byConf: { [k: string]: W } = {};
  for (const r of rows) { byConf[String(r.ConfluenceId)] = r; }

  const url = (r: W) => witryna + r.TargetUrl;
  const bezNr = (t: string) => t.replace(/^\d+\.\s*/, "");
  // 9 cyfr: Id elementow SharePointa przekraczaja 99999 w wiekszych bibliotekach,
  // a obciety klucz psuje sortowanie calego drzewa.
  const pad = (n: number) => {
    let s = String(n);
    while (s.length < 9) { s = "0" + s; }
    return s;
  };
  const esc = (s: string) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const kids = (cid: number) =>
    rows.filter(r => r.ParentConfluenceId === cid).sort((a, b) => a.Id - b.Id);
  const link = (r: W) => '<a href="' + esc(url(r)) + '">' + esc(r.Title) + "</a>";
  const ramka = (nag: string, srodek: string) =>
    '<table width="100%"><tr><td width="100%" align="left"><small><strong>' +
    nag + "</strong><br>" + srodek + "</small></td></tr></table>";

  // Lancuch przodkow z wykrywaniem cyklu: bez tego dwa wiersze wskazujace na siebie
  // daja 20 fikcyjnych poziomow w TreePath i okruszkach.
  const przodkowie = (r: W): W[] => {
    const out: W[] = [];
    const byl: { [k: string]: boolean } = {};
    byl[String(r.ConfluenceId)] = true;
    let cur = byConf[String(r.ParentConfluenceId)];
    let g = 0;
    while (cur !== undefined && g < 20) {
      if (byl[String(cur.ConfluenceId)] === true) { break; }
      byl[String(cur.ConfluenceId)] = true;
      out.unshift(cur);
      cur = byConf[String(cur.ParentConfluenceId)];
      g++;
    }
    return out;
  };

  // Strony utrzymywane recznie (status Manual) ZOSTAJA w danych drzewa: sa w mapowaniu
  // linkow, w ramce podstron u rodzica i w mapie dokumentacji. Wypadaja wylacznie z listy
  // do przetworzenia, zeby krok 2 nie nadpisal ich recznie zlozonej tresci.
  const reczne = rows.filter(r => status(r) === "Manual").length;
  const pages = rows.filter(r => status(r) !== "Manual").map(r => {
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
      // TreePath i TreeSort budujemy z identyfikatorow STRON SharePointa, nie z id
      // Confluence: tych samych uzywa planujMape (krok 4) i drzewo w aplikacji.
      // Inaczej po kroku 2 drzewo w aplikacji nie rozwijaloby sie wcale.
      treePath: "/" + chain.map(x => String(x.TargetPageId)).join("/") + "/",
      treeSort: chain.map(x => pad(x.TargetPageId)).join("."),
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
    L["t:" + String(r.Title).toLowerCase().trim()] = url(r);
  }

  // Zejscie po drzewie z licznikiem glebokosci i zbiorem odwiedzonych.
  const lista = (n: W, gl: number, byl: { [k: string]: boolean }): string => {
    if (gl > 20) { return ""; }
    const ch = kids(n.ConfluenceId);
    if (ch.length === 0) { return ""; }
    let s = "";
    for (const c of ch) {
      const k = String(c.ConfluenceId);
      if (byl[k] === true) { continue; }
      byl[k] = true;
      s += "<li>" + link(c) + lista(c, gl + 1, byl) + "</li>";
    }
    return s.length > 0 ? "<ul>" + s + "</ul>" : "";
  };

  const roots = rows.filter(r => byConf[String(r.ParentConfluenceId)] === undefined)
    .sort((a, b) => a.Id - b.Id);
  const mapa: string[] = [];
  // Wszystkie korzenie, nie tylko pierwszy: przy filtrze serwisu strony moga miec
  // kilka korzeni (np. wspolny rodzic nalezy do innego serwisu), a wtedy pozostale
  // galezie znikalyby z mapy bez zadnego sladu.
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    const ikona = i === 0 ? "&#127968; " : "";
    mapa.push("<p>" + ikona + "<strong>" + link(root) + "</strong></p>");
    for (const b of kids(root.ConfluenceId)) {
      mapa.push("<p><strong>" + link(b) + "</strong></p>" + lista(b, 1, {}));
    }
  }

  return JSON.stringify({
    pages: pages, linki: JSON.stringify(L), mapa: mapa,
    korzeni: roots.length, pominietych: pominiete, recznych: reczne
  });
}
