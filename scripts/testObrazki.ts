function main(wb: ExcelScript.Workbook, obrazek: string, domena: string,
  siteId: string, webId: string, listId: string, uniqueId: string): string {
  // Sonda: buduje kanwe strony testowej z tym samym obrazkiem zapisanym na kilka sposobow
  // i w kilku miejscach. Kazdy ma etykiete, wiec po edycji strony widac, ktore przetrwaly.
  const esc = (s: string) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  // Wzor obrazka w tekscie z PnP Core SDK (Page.cs, inlineImageCK5Html), te same atrybuty
  // w tej samej kolejnosci. Procent 0 pomija szerokosc procentowa, jak w PnP Framework.
  const plugin = (url: string, ids: boolean, szer: number, wys: number,
    procent: number, podpis: string, alt: string, link: string): string =>
    '<div class="imagePlugin" style="background-color:transparent;position:relative;"' +
    ' data-alignment="Left" data-imageurl="' + esc(url) + '" data-uploading="0"' +
    ' data-height="' + wys + '" data-width="' + szer + '"' +
    ' data-imagenaturalheight="' + wys + '" data-imagenaturalwidth="' + szer + '"' +
    (procent > 0 ? ' data-widthpercentage="' + procent + '"' : "") +
    (ids ? ' data-webid="' + esc(webId) + '" data-siteid="' + esc(siteId) +
      '" data-listid="' + esc(listId) + '" data-uniqueid="' + esc(uniqueId) + '"' : "") +
    ' data-isoverlaytextenabled="false" data-captiontext="' + esc(podpis) +
    '" data-alttext="' + esc(alt) + '" data-linkurl="' + esc(link) + '"></div>';

  const A = plugin(obrazek, true, 210, 118, 0, "", "", "");
  const B = plugin(obrazek, false, 210, 118, 0, "", "", "");
  const C = plugin(domena + obrazek, false, 210, 118, 0, "", "", "");
  // Kontrola: obrazek zapisany tak, jak dzis robi to parseTresc.
  const K = '<p><span class="confluence-embedded-file-wrapper"><img src="' + esc(obrazek) + '"></span></p>';
  const et = (s: string) => "<p><strong>" + s + "</strong></p>";
  const pozycja = (s: string, html: string) => "<li>" + s + html + "</li>";
  const wiersz = (s: string, html: string) =>
    '<tr><td class="confluenceTd">' + s + '</td><td class="confluenceTd">' + html + "</td></tr>";

  interface Seg { nazwa: string; rozwin: boolean; kol: string; tresc: string }
  const segs: Seg[] = [
    {
      nazwa: "", rozwin: true, kol: "",
      tresc: "<h2>Akapit</h2>" +
        et("P-A") + A + et("P-B") + B + et("P-C") + C + et("P-K") + K +
        "<h2>Tabela</h2>" +
        '<div class="table-wrap"><table class="confluenceTable"><tbody>' +
        wiersz("T-A", A) + wiersz("T-B", B) + wiersz("T-K", K) +
        "</tbody></table></div>" +
        "<h2>Lista</h2>" +
        "<ol><li>Punkt glowny<ul>" +
        pozycja("L-A", A) + pozycja("L-B", B) + pozycja("L-K", K) +
        "</ul></li></ol>"
    },
    { nazwa: "Sekcja rozwinieta", rozwin: true, kol: "", tresc: et("Z-A") + A + et("Z-B") + B },
    { nazwa: "Sekcja zwinieta", rozwin: false, kol: "", tresc: et("Y-A") + A + et("Y-B") + B },
    { nazwa: "", rozwin: true, kol: "L", tresc: et("D1-A") + A + et("D1-B") + B },
    { nazwa: "", rozwin: true, kol: "P", tresc: et("D2-A") + A + et("D2-B") + B },
    {
      nazwa: "", rozwin: true, kol: "",
      tresc: "<h2>Rozmiar, podpis i odnosnik</h2>" +
        et("R-1 rozmiar ze zrodla") + A +
        et("R-2 cala szerokosc kolumny") + plugin(obrazek, true, 0, 0, 100, "", "", "") +
        et("O-A podpis i odnosnik") +
        plugin(obrazek, true, 210, 118, 0, "Podpis testowy", "Tekst alternatywny", obrazek)
    }
  ];

  const canvas: { [k: string]: unknown }[] = [];
  let zone = 0;
  for (let n = 0; n < segs.length; n++) {
    const s = segs[n];
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
      contentVersion: 5,
      emphasis: {},
      innerHTML: s.tresc
    };
    if (s.nazwa.length > 0) {
      k["zoneGroupMetadata"] = {
        type: 1, displayName: s.nazwa, isExpanded: s.rozwin,
        showDividerLine: true, iconAlignment: "left"
      };
    }
    canvas.push(k);
  }
  // Ustawienia strony odczytane z kanwy strony zalozonej recznie: contentVersion 5 to edytor CK5.
  canvas.push({
    controlType: 0,
    pageSettingsSlice: {
      isDefaultDescription: true, isDefaultThumbnail: true, isSpellCheckEnabled: true,
      globalRichTextStylingVersion: 1, rtePageSettings: { contentVersion: 5 }, isEmailReady: false
    }
  });
  return JSON.stringify(canvas);
}
