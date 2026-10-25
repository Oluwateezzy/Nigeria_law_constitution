export const launchRequiresAccount = false;

export function showAccountLine(
  livingCount: number,
  dismissed: boolean,
): boolean {
  return livingCount >= 3 && !dismissed;
}
