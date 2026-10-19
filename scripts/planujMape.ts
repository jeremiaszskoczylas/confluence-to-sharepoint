function main(wb: ExcelScript.Workbook, dane: string, pomin: string): string {
  // UTRZYMANIE. Drzewo liczone z biblioteki Site Pages (kolumna ParentPageId),
  // a nie z mapy migracji - dzieki temu obejmuje takze strony zalozone recznie
  // po migracji. Zwraca metadane do wpisania (TreePath, TreeSort, SortOrder,
  // Category) oraz fragmenty HTML strony-mapy.
  interface W {
    Id: number; Title: string; ParentPageId: number; SortOrder: number;
    FileRef: string; FileLeafRef: string;
  }
  let surowe: W[];
  try { surowe = JSON.parse(dane) as W[]; }
  catch { return '{"blad":"dane nie sa poprawnym JSON"}'; }
  if (!Array.isArray(surowe)) { return '{"blad":"dane nie sa tablica"}'; }

  const nazwaMapy = (pomin === undefined || pomin === null ? "" : pomin).toLowerCase();
  const rows: W[] = [];
  for (const r of surowe) {
    const plik = (r.FileLeafRef === undefined || r.FileLeafRef === null ? "" : r.FileLeafRef);
    if (nazwaMapy.length > 0 && plik.toLowerCase() === nazwaMapy) { continue; }
    if (r.Id === undefined || r.Id === null) { continue; }
    if (r.Title === undefined || r.Title === null || r.Title.length === 0) { continue; }
    rows.push(r);
  }
  const jest: { [k: string]: boolean } = {};
  for (const r of rows) { jest[String(r.Id)] = true; }
  const rodzic = (r: W) => {
    const p = r.ParentPageId;
    return p !== undefined && p !== null && p > 0 && jest[String(p)] === true ? p : 0;
  };
  const porzadek = (a: W, b: W) => {
    const sa = a.SortOrder === undefined || a.SortOrder === null ? 9999 : a.SortOrder;
    const sb = b.SortOrder === undefined || b.SortOrder === null ? 9999 : b.SortOrder;
    if (sa !== sb) { return sa - sb; }
    return a.Title < b.Title ? -1 : (a.Title > b.Title ? 1 : 0);
  };
  const kids = (id: number) => rows.filter(r => rodzic(r) === id).sort(porzadek);

  // Korzen: strona bez rodzica, ktora ma dzieci. Przy kilku kandydatach wygrywa
  // ta z najwiekszym poddrzewem. Pozostale bezrodzicowe to sieroty.
  const bezRodzica = rows.filter(r => rodzic(r) === 0);
  const policz = (id: number): number => {
    let n = 1;
    for (const d of kids(id)) { n += policz(d.Id); }
    return n;
  };
  let korzen: W | undefined = undefined;
  let naj = 0;
  for (const r of bezRodzica) {
    const n = policz(r.Id);
    if (n > naj) { naj = n; korzen = r; }
  }
  if (korzen === undefined || naj < 2) {
    return '{"blad":"nie znaleziono korzenia drzewa - czy strony maja wypelnione ParentPageId?"}';
  }
  const korzenId: number = korzen.Id;
  const sieroty = bezRodzica.filter(r => r.Id !== korzenId).sort(porzadek);

  const bezNr = (t: string) => t.replace(/^\d+\.\s*/, "");
  const pad = (n: number) => ("00000" + String(n)).slice(-5);
  const url = (r: W) => (r.FileRef === undefined || r.FileRef === null ? "" : r.FileRef);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const link = (r: W) => '<a href="' + url(r) + '">' + esc(r.Title) + "</a>";

  interface P {
    id: number; title: string; treePath: string; treeSort: string;
    sortOrder: number; category: string;
  }
  const pages: P[] = [];
  const lista = (id: number, poziom: number): string => {
    const d = kids(id);
    if (d.length === 0) { return ""; }
    let s = "<ul>";
    for (const x of d) { s += "<li>" + link(x) + lista(x.Id, poziom + 1) + "</li>"; }
    return s + "</ul>";
  };
  const zejdz = (r: W, lancuch: W[], kategoria: string, poz: number) => {
    const chain = lancuch.concat([r]);
    pages.push({
      id: r.Id,
      title: r.Title,
      treePath: "/" + chain.map(x => String(x.Id)).join("/") + "/",
      treeSort: chain.map(x => pad(x.Id)).join("."),
      sortOrder: poz * 10,
      category: kategoria
    });
    const d = kids(r.Id);
    for (let i = 0; i < d.length; i++) {
      const kat = chain.length === 1 ? bezNr(d[i].Title) : kategoria;
      zejdz(d[i], chain, kat, i + 1);
    }
  };
  zejdz(korzen, [], "", 1);

  const mapa: string[] = [];
  mapa.push("<p>&#127968; <strong>" + link(korzen) + "</strong></p>");
  for (const g of kids(korzenId)) {
    mapa.push("<p><strong>" + link(g) + "</strong></p>" + lista(g.Id, 1));
  }
  if (sieroty.length > 0) {
    let s = "<p><strong>Bez przypisania &mdash; " + sieroty.length + "</strong></p><ul>";
    for (const r of sieroty) { s += "<li>" + link(r) + "</li>"; }
    mapa.push(s + "</ul>");
  }
  return JSON.stringify({ pages: pages, mapa: mapa, sieroty: sieroty.length });
}
