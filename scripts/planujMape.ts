function main(wb: ExcelScript.Workbook, dane: string, pomin: string): string {
  // UTRZYMANIE. Drzewo liczone z biblioteki Site Pages (kolumna ParentPageId),
  // a nie z mapy migracji - dzieki temu obejmuje takze strony zalozone recznie.
  // Strony sa grupowane po kolumnie Service, wiec kazdy serwis dostaje wlasny
  // korzen i wlasne sekcje mapy; serwisy nie mieszaja sie ze soba.
  interface W {
    Id: number; Title: string; ParentPageId: number; SortOrder: number;
    FileRef: string; FileLeafRef: string; Service?: string;
  }
  let surowe: W[];
  try { surowe = JSON.parse(dane) as W[]; }
  catch { return '{"blad":"dane nie sa poprawnym JSON"}'; }
  if (!Array.isArray(surowe)) { return '{"blad":"dane nie sa tablica"}'; }

  const nazwaMapy = (pomin === undefined || pomin === null ? "" : pomin).toLowerCase();
  const rows: W[] = [];
  let pozaDokumentacja = 0;
  for (const r of surowe) {
    const plik = (r.FileLeafRef === undefined || r.FileLeafRef === null ? "" : r.FileLeafRef);
    if (nazwaMapy.length > 0 && plik.toLowerCase() === nazwaMapy) { continue; }
    if (r.Id === undefined || r.Id === null) { continue; }
    if (r.Title === undefined || r.Title === null || r.Title.length === 0) { continue; }
    // Biblioteka Site Pages zawiera takze strony witryny spoza dokumentacji
    // (Home.aspx, strony zespolu). Do drzewa nalezy tylko to, co ma przypisany
    // serwis - inaczej mapa konczylaby sie lista systemowych stron SharePointa.
    if (r.Service === undefined || r.Service === null || String(r.Service).length === 0) {
      pozaDokumentacja++;
      continue;
    }
    rows.push(r);
  }
  if (rows.length === 0) {
    return '{"blad":"zadna strona nie ma wypelnionej kolumny Service - ustaw ja na stronach dokumentacji"}';
  }
  const jest: { [k: string]: boolean } = {};
  for (const r of rows) { jest[String(r.Id)] = true; }
  const serwisOf = (r: W) =>
    (r.Service === undefined || r.Service === null || r.Service === "") ? "" : r.Service;
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
  // Dziecko musi byc w tym samym serwisie co rodzic. Bez tego strona z innego
  // serwisu wchodzi w cudze drzewo i dostaje sciezke biegnaca przez obcy korzen.
  const serwisById: { [k: string]: string } = {};
  for (const r of rows) { serwisById[String(r.Id)] = serwisOf(r); }
  const kids = (id: number) => rows.filter(r =>
    rodzic(r) === id && serwisOf(r) === serwisById[String(id)]
  ).sort(porzadek);

  const bezNr = (t: string) => t.replace(/^\d+\.\s*/, "");
  const pad = (n: number) => {
    let s = String(n);
    while (s.length < 9) { s = "0" + s; }
    return s;
  };
  const url = (r: W) => (r.FileRef === undefined || r.FileRef === null ? "" : r.FileRef);
  const esc = (s: string) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const link = (r: W) => '<a href="' + esc(url(r)) + '">' + esc(r.Title) + "</a>";

  interface P {
    id: number; title: string; service: string; treePath: string; treeSort: string;
    sortOrder: number; category: string;
  }
  const pages: P[] = [];
  const lista = (id: number): string => {
    const d = kids(id);
    if (d.length === 0) { return ""; }
    let s = "<ul>";
    for (const x of d) { s += "<li>" + link(x) + lista(x.Id) + "</li>"; }
    return s + "</ul>";
  };
  const zejdz = (r: W, lancuch: W[], kategoria: string, poz: number) => {
    const chain = lancuch.concat([r]);
    pages.push({
      id: r.Id,
      title: r.Title,
      service: serwisOf(r),
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

  // lista serwisow w kolejnosci pierwszego wystapienia
  const serwisy: string[] = [];
  for (const r of rows) {
    const s = serwisOf(r);
    if (serwisy.indexOf(s) < 0) { serwisy.push(s); }
  }

  const mapa: string[] = [];
  const sieroty: W[] = [];
  let korzeni = 0;

  for (const s of serwisy) {
    const wSerwisie = rows.filter(r => serwisOf(r) === s);
    const bezRodzica = wSerwisie.filter(r => rodzic(r) === 0);
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
    // Jedna strona bez rodzica = korzen, nawet gdy nie ma jeszcze dzieci
    // (swiezo zalozony serwis, przestrzen z jedna strona). Przy kilku
    // kandydatach wygrywa ten z poddrzewem, a reszta idzie do sierot.
    if (bezRodzica.length === 1) { korzen = bezRodzica[0]; naj = policz(bezRodzica[0].Id); }
    else if (korzen === undefined || naj < 2) {
      for (const r of bezRodzica) { sieroty.push(r); }
      continue;
    }
    korzeni++;
    const korzenId: number = korzen.Id;
    for (const r of bezRodzica) { if (r.Id !== korzenId) { sieroty.push(r); } }
    zejdz(korzen, [], "", 1);

    // naglowek serwisu tylko gdy serwisow jest wiecej niz jeden
    const naglowek = serwisy.length > 1 && s.length > 0
      ? '<p><font color="#8E0B22"><strong>' + esc(s) + "</strong></font></p>"
      : "";
    mapa.push(naglowek + "<p>&#127968; <strong>" + link(korzen) + "</strong></p>");
    for (const g of kids(korzenId)) {
      mapa.push("<p><strong>" + link(g) + "</strong></p>" + lista(g.Id));
    }
  }

  if (korzeni === 0) {
    return '{"blad":"nie znaleziono korzenia drzewa - czy strony maja wypelnione ParentPageId?"}';
  }
  // Strony w cyklu (A wskazuje B, B wskazuje A) nie maja rodzica rownego 0,
  // wiec nie trafiaja do bezRodzica, a z korzenia sa nieosiagalne. Bez tego
  // przepadalyby po cichu: ani w drzewie, ani w mapie, ani w liczniku.
  const wDrzewie: { [k: string]: boolean } = {};
  for (const x of pages) { wDrzewie[String(x.id)] = true; }
  for (const r of rows) {
    if (wDrzewie[String(r.Id)] !== true && sieroty.indexOf(r) < 0) { sieroty.push(r); }
  }
  if (sieroty.length > 0) {
    const posort = sieroty.sort(porzadek);
    let s = "<p><strong>Bez przypisania &mdash; " + posort.length + "</strong></p><ul>";
    for (const r of posort) { s += "<li>" + link(r) + "</li>"; }
    mapa.push(s + "</ul>");
  }
  return JSON.stringify({
    pages: pages, mapa: mapa, sieroty: sieroty.length, serwisy: korzeni,
    pozaDokumentacja: pozaDokumentacja
  });
}
