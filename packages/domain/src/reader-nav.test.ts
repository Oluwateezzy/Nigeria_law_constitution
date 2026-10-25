import { describe, expect, it } from 'vitest';
import { MoveGate, stepIndex, swipeDelta } from './reader-nav';

const ids = ['a', 'b', 'c'];

describe('reader navigation', () => {
  it('walks a three-section instrument without skipping or passing the ends', () => {
    expect(stepIndex(0, ids.length, -1)).toBeNull();
    let index = 0;
    const visited = [ids[index]];
    while (true) {
      const next = stepIndex(index, ids.length, 1);
      if (next === null) {
        break;
      }
      index = next;
      visited.push(ids[index]!);
    }
    expect(visited).toEqual(['a', 'b', 'c']);
    expect(stepIndex(index, ids.length, 1)).toBeNull();
    expect(index).toBe(2);
  });

  it('coalesces one activation and still advances one section per later tap', () => {
    const gate = new MoveGate(30, 0);
    expect(gate.move(1, 0)).toBe(1);
    expect(gate.move(1, 10)).toBeNull();
    expect(gate.index).toBe(1);

    const walked: number[] = [0];
    const rapid = new MoveGate(30, 0);
    for (let tap = 0; tap < 10; tap += 1) {
      walked.push(rapid.move(1, tap * 100)!);
    }
    expect(walked).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(new MoveGate(3, 2).move(1, 0)).toBeNull();
  });

  it('ignores a swipe that starts while a sheet is open', () => {
    expect(swipeDelta(-80, true)).toBeNull();
    expect(swipeDelta(80, true)).toBeNull();
    expect(swipeDelta(-80, false)).toBe(1);
    expect(swipeDelta(80, false)).toBe(-1);
    expect(swipeDelta(12, false)).toBeNull();
  });
});
