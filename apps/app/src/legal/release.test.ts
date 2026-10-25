import { shippingInstrument } from '@nigeria-law/content';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { launchRequiresAccount } from '../account/line';

describe('phone release', () => {
  it('fails a launch flow that presents sign-in', () => {
    const launch = readFileSync('maestro/launch.yaml', 'utf8');
    expect(launchRequiresAccount).toBe(false);
    expect(launch).toContain('assertNotVisible: Sign in');
    expect(launch).toContain('Nigeria Constitution and Law');
    const instrument = shippingInstrument();
    expect(instrument.contentVersion.length).toBeGreaterThan(0);
    expect(instrument.legalTextHash).toHaveLength(64);
    expect(instrument.source.name.length).toBeGreaterThan(0);
  });

  it('does not depend on an advertising SDK', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies: Record<string, string>;
    };
    const names = Object.keys(pkg.dependencies);
    expect(
      names.some((name) => /admob|applovin|facebook-ads/i.test(name)),
    ).toBe(false);
  });
});
