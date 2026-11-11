function main(wb: ExcelScript.Workbook, html: string, poczatek: string, koniec: string): string {
  // Wycina z pliku eksportu Confluence fragment strony miedzy dwoma znacznikami tekstowymi
  // i opakowuje go jak cala strone, zeby parseTresc przerobil go jak kazda inna strone.
  // Fragment zaczyna sie od znacznika HTML, w ktorym stoi poczatek, i konczy tuz przed
  // znacznikiem, w ktorym stoi koniec. Do konca strony prowadzi koniec id="footer".
  const m = html.indexOf('id="main-content"');
  if (m < 0) { return "ERR: w pliku nie ma main-content"; }
  // Szukamy od tresci strony, bo naglowek z tytulem i sciezka powtarza nazwy stron.
  const obszar = html.substring(m);
  const p = poczatek === undefined || poczatek === null ? "" : poczatek;
  const k = koniec === undefined || koniec === null ? "" : koniec;
  if (p.length === 0 || k.length === 0) { return "ERR: podaj poczatek i koniec fragmentu"; }
  const ile = (s: string) => {
    let n = 0;
    let i = obszar.indexOf(s);
    while (i >= 0) { n++; i = obszar.indexOf(s, i + s.length); }
    return n;
  };
  const ileP = ile(p);
  if (ileP !== 1) {
    return "ERR: poczatek wystepuje " + ileP + " razy, a ma wystepowac raz - wybierz dluzszy fragment";
  }
  const ileK = ile(k);
  if (ileK !== 1) {
    return "ERR: koniec wystepuje " + ileK + " razy, a ma wystepowac raz - wybierz dluzszy fragment";
  }
  const od = obszar.lastIndexOf("<", obszar.indexOf(p));
  const doZn = obszar.lastIndexOf("<", obszar.indexOf(k));
  if (od <= 0 || doZn <= od) { return "ERR: koniec musi stac w pliku dalej niz poczatek"; }
  const frag = obszar.substring(od, doZn);

  // Ciecie w srodku strony zostawia zamkniecia bez otwarc i otwarcia bez zamkniec.
  // Pierwsze pomijamy, bo naleza do tresci sprzed fragmentu, a drugie domykamy na koncu.
  const BEZ_ZAMKNIECIA = " area base br col embed hr img input link meta param source track wbr ";
  const stos: string[] = [];
  const re = /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let wy = "";
  let ost = 0;
  let t = re.exec(frag);
  while (t !== null) {
    wy += frag.substring(ost, t.index);
    ost = t.index + t[0].length;
    const n = t[2].toLowerCase();
    if (t[1] === "/") {
      const j = stos.lastIndexOf(n);
      if (j >= 0) {
        for (let x = stos.length - 1; x > j; x--) { wy += "</" + stos[x] + ">"; }
        stos.splice(j);
        wy += t[0];
      }
    } else {
      if (BEZ_ZAMKNIECIA.indexOf(" " + n + " ") < 0 && !/\/$/.test(t[3])) { stos.push(n); }
      wy += t[0];
    }
    t = re.exec(frag);
  }
  wy += frag.substring(ost);
  for (let x = stos.length - 1; x >= 0; x--) { wy += "</" + stos[x] + ">"; }
  return '<div id="main-content">' + wy + '</div><div id="footer"></div>';
}
