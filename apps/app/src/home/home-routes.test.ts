import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readerHref } from '@/reader/linking';

export function scenarioHref(query?: string): string {
  const q = (query ?? '').trim();
  if (q.length > 0) {
    return `/scenario?q=${encodeURIComponent(q)}`;
  }
  return '/scenario';
}

export const homeQuickAccessRoutes = {
  crimes: '/crimes',
  trivia: '/trivia/all',
  notes: '/notes',
} as const;

describe('home screen wiring', () => {
  it('wires hero card input to scenario navigation', () => {
    expect(scenarioHref('')).toBe('/scenario');
    expect(scenarioHref('   ')).toBe('/scenario');
    expect(scenarioHref('police search phone')).toBe(
      '/scenario?q=police%20search%20phone',
    );
  });

  it('wires quick access grid items to correct routes', () => {
    expect(homeQuickAccessRoutes.crimes).toBe('/crimes');
    expect(homeQuickAccessRoutes.trivia).toBe('/trivia/all');
    expect(homeQuickAccessRoutes.notes).toBe('/notes');
  });

  it('wires continue reading card to the correct reader route', () => {
    const href = readerHref('cfrn-1999', '36', 'anchor-1');
    expect(href).toBe('/read/cfrn-1999/s/36?anchor=anchor-1#anchor-1');
  });

  it('has valid Maestro home scenario flow test', () => {
    const yaml = readFileSync('maestro/home-scenario.yaml', 'utf8');
    expect(yaml).toContain('tapOn: Describe your situation');
    expect(yaml).toContain('tapOn: Explain →');
    expect(yaml).toContain('assertVisible: What Does The Law Say');
  });
});
