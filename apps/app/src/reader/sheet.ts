let sheetOpen = false;

export function isSheetOpen(): boolean {
  return sheetOpen;
}

export function setSheetOpen(open: boolean): void {
  sheetOpen = open;
}
