import { lagosDay } from './lagos-day';

export const freeHostedLimit = 5;
export const plusHostedLimit = 100;
export const ipHostedLimit = 20;

export type QuotaLane = 'free' | 'plus';

export type QuotaSubject = {
  installId: string;
  userId: string | null;
  ip: string;
  lane: QuotaLane;
  now: Date;
};

export type QuotaSnapshot = {
  lane: QuotaLane;
  remaining: number;
  limit: number;
  resetsAt: string;
  used: number;
};

export function lagosResetsAt(instant: Date): string {
  const [year, month, day] = lagosDay(instant).split('-').map(Number);
  const next = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + 1));
  const stamp = next.toISOString().slice(0, 10);
  return `${stamp}T00:00:00+01:00`;
}

export function limitForLane(lane: QuotaLane): number {
  return lane === 'plus' ? plusHostedLimit : freeHostedLimit;
}

function slot(id: string, instant: Date): string {
  return `${id}|${lagosDay(instant)}`;
}

export class QuotaBook {
  private install = new Map<string, number>();
  private user = new Map<string, number>();
  private ip = new Map<string, number>();
  private folded = new Set<string>();

  seedInstall(installId: string, now: Date, count: number): void {
    this.install.set(slot(installId, now), count);
  }

  seedUser(userId: string, now: Date, count: number): void {
    this.user.set(slot(userId, now), count);
  }

  seedIp(ip: string, now: Date, count: number): void {
    this.ip.set(slot(ip, now), count);
  }

  markFolded(userId: string, installId: string, now: Date): void {
    this.folded.add(`${userId}|${installId}|${lagosDay(now)}`);
  }

  snapshot(subject: QuotaSubject): QuotaSnapshot {
    const limit = limitForLane(subject.lane);
    const used = this.used(subject);
    return {
      lane: subject.lane,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsAt: lagosResetsAt(subject.now),
    };
  }

  blocked(subject: QuotaSubject): boolean {
    const snap = this.snapshot(subject);
    return snap.remaining <= 0 || this.ipUsed(subject) >= ipHostedLimit;
  }

  commit(subject: QuotaSubject): QuotaSnapshot {
    const day = lagosDay(subject.now);
    if (subject.userId) {
      const foldKey = `${subject.userId}|${subject.installId}|${day}`;
      let used = this.user.get(slot(subject.userId, subject.now)) ?? 0;
      if (!this.folded.has(foldKey)) {
        used += this.install.get(slot(subject.installId, subject.now)) ?? 0;
        this.folded.add(foldKey);
      }
      this.user.set(slot(subject.userId, subject.now), used + 1);
    } else {
      const key = slot(subject.installId, subject.now);
      this.install.set(key, (this.install.get(key) ?? 0) + 1);
    }
    const ipKey = slot(subject.ip, subject.now);
    this.ip.set(ipKey, (this.ip.get(ipKey) ?? 0) + 1);
    return this.snapshot(subject);
  }

  private used(subject: QuotaSubject): number {
    if (!subject.userId) {
      return this.install.get(slot(subject.installId, subject.now)) ?? 0;
    }
    const day = lagosDay(subject.now);
    const foldKey = `${subject.userId}|${subject.installId}|${day}`;
    const account = this.user.get(slot(subject.userId, subject.now)) ?? 0;
    if (this.folded.has(foldKey)) return account;
    return (
      account + (this.install.get(slot(subject.installId, subject.now)) ?? 0)
    );
  }

  private ipUsed(subject: QuotaSubject): number {
    return this.ip.get(slot(subject.ip, subject.now)) ?? 0;
  }
}

export function countsAsRequest(code: string | null): boolean {
  return code === null;
}
