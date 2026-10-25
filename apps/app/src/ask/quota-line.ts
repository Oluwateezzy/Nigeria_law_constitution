import { plusHostedLimit } from '@nigeria-law/domain';
import { copy } from '../copy';

export function quotaLine(snapshot: {
  remaining: number;
  limit?: number;
  resetsAt?: string;
  lane?: 'free' | 'plus';
}): string {
  const plus = snapshot.lane === 'plus' || snapshot.limit === plusHostedLimit;
  if (plus) {
    const reset = snapshot.resetsAt ? ` Resets ${snapshot.resetsAt}.` : '';
    if (snapshot.remaining <= 0) {
      return `You have used today's ${plusHostedLimit} Plus explanations.${reset}`;
    }
    return `${snapshot.remaining} Plus explanations left today.${reset}`;
  }
  if (snapshot.remaining <= 0) return copy.quotaFreeNoneLeft;
  if (snapshot.remaining === 4) return copy.quotaFreeSomeLeft;
  return `${snapshot.remaining} free explanations left today`;
}
