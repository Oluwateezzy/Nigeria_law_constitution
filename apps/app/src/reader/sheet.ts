let sheetDepth = 0;

export function isSheetOpen(): boolean {
  return sheetDepth > 0;
}

export function setSheetOpen(open: boolean): void {
  sheetDepth += open ? 1 : -1;
  if (sheetDepth < 0) sheetDepth = 0;
}
