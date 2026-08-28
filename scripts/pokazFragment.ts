function main(wb: ExcelScript.Workbook, html: string, klasa: string): string {
  const i = html.indexOf(klasa);
  if (i < 0) { return "NIE ZNALEZIONO: " + klasa; }
  const a = i < 150 ? 0 : i - 150;
  return html.substring(a, i + 600);
}
