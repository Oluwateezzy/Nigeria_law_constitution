import { copy } from '@/copy';

export function quotaLine(remaining: number): string {
  if (remaining <= 0) return copy.quotaFreeNoneLeft;
  if (remaining === 4) return copy.quotaFreeSomeLeft;
  return `${remaining} free explanations left today`;
}
