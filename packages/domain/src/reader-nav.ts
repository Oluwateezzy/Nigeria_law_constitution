export function elapsedNow(): number {
  return Date.now();
}

export function stepIndex(
  index: number,
  count: number,
  delta: -1 | 1,
): number | null {
  const next = index + delta;
  if (next < 0 || next >= count) {
    return null;
  }
  return next;
}

export class MoveGate {
  private lastAt = Number.NEGATIVE_INFINITY;
  index: number;

  constructor(
    private count: number,
    index: number,
    private windowMs = 32,
  ) {
    this.index = index;
  }

  resize(count: number) {
    this.count = count;
    if (this.index > count - 1) {
      this.index = Math.max(0, count - 1);
    }
  }

  setIndex(index: number) {
    this.index = index;
  }

  move(delta: -1 | 1, now: number): number | null {
    if (now - this.lastAt < this.windowMs) {
      return null;
    }
    this.lastAt = now;
    const next = stepIndex(this.index, this.count, delta);
    if (next === null) {
      return null;
    }
    this.index = next;
    return next;
  }
}

export function swipeDelta(dx: number, sheetOpen: boolean): -1 | 1 | null {
  if (sheetOpen) {
    return null;
  }
  if (dx <= -48) {
    return 1;
  }
  if (dx >= 48) {
    return -1;
  }
  return null;
}
