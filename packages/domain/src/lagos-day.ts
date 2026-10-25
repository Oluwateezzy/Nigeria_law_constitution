const LAGOS_TIME_ZONE = 'Africa/Lagos';

export function lagosDay(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LAGOS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const year = part(parts, 'year');
  const month = part(parts, 'month');
  const day = part(parts, 'day');
  return `${year}-${month}-${day}`;
}

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  const value = parts.find((item) => item.type === type)?.value;
  if (!value) {
    throw new Error(`Missing ${type} from the Lagos date`);
  }
  return value;
}
