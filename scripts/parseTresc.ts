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
      '<table><tr><td><p><strong>' + (P[t] || "UWAGA:") + '</strong></p>' + c + '</td></tr></table>');
  h = h.replace(/(href|src)="attachments\//gi, '$1="' + base);
  h = h.replace(/href="[^"]*?(\d+)\.html"/gi, 'href="{{CONF:$1}}"');
  h = h.replace(/href="(\/confluence\/display\/~[^"]*|index\.html)"/gi, 'href="#"');
  h = h.replace(/<input[^>]*>/gi, "&#9744; ");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;)*<\/\1>/gi, "");
  h = h.replace(/<(p|div|span|h[1-4])[^>]*>(?:\s|&nbsp;)*<\/\1>/gi, "");
  const canvas = [{
    controlType: 4,
    id: "c5f0a545-0f0d-4f31-9e2e-000000000001",
    position: { layoutIndex: 1, zoneIndex: 1, sectionIndex: 1, controlIndex: 1, sectionFactor: 12 },
    addedFromPersistedData: true,
    innerHTML: h
  }];
  return JSON.stringify(canvas);
}