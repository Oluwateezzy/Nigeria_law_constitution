const sectionColumn = 68 * 10.5 + 40;
const askColumn = 360;

export function askUsesColumn(windowWidth: number): boolean {
  return windowWidth >= sectionColumn + askColumn;
}
