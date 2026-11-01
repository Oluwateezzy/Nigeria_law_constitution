import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('V2 Brand Assets (V2-P1-T1)', () => {
  const brandDir = path.resolve(__dirname, '../../assets/brand');

  const requiredAssets = [
    'logo.svg',
    'logo-mono-light.svg',
    'logo-mono-dark.svg',
    'logo@1x.png',
    'logo@2x.png',
    'logo@3x.png',
    'logo-mono-light@1x.png',
    'logo-mono-light@2x.png',
    'logo-mono-light@3x.png',
    'logo-mono-dark@1x.png',
    'logo-mono-dark@2x.png',
    'logo-mono-dark@3x.png',
    'wordmark.svg',
    'wordmark-dark.svg',
    'wordmark@1x.png',
    'wordmark@2x.png',
    'wordmark@3x.png',
    'wordmark-dark@1x.png',
    'wordmark-dark@2x.png',
    'wordmark-dark@3x.png',
    'icon.png',
  ];

  it('all required brand asset files exist', () => {
    for (const file of requiredAssets) {
      const fullPath = path.join(brandDir, file);
      expect(fs.existsSync(fullPath), `Asset missing: ${file}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Asset empty: ${file}`).toBeGreaterThan(0);
    }
  });

  it('SVG assets are valid SVG markup', () => {
    const svgs = requiredAssets.filter((f) => f.endsWith('.svg'));
    for (const svgFile of svgs) {
      const content = fs.readFileSync(path.join(brandDir, svgFile), 'utf-8');
      expect(content).toContain('<svg');
      expect(content).toContain('</svg>');
      expect(content).toContain('viewBox=');
    }
  });

  it('PNG assets have valid PNG magic bytes', () => {
    const pngs = requiredAssets.filter((f) => f.endsWith('.png'));
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    for (const pngFile of pngs) {
      const fd = fs.openSync(path.join(brandDir, pngFile), 'r');
      const header = Buffer.alloc(8);
      fs.readSync(fd, header, 0, 8, 0);
      fs.closeSync(fd);
      expect(header.equals(pngMagic), `Invalid PNG header for ${pngFile}`).toBe(true);
    }
  });

  it('app icon is 1024x1024', () => {
    const iconPath = path.join(brandDir, 'icon.png');
    const fd = fs.openSync(iconPath, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    // PNG IHDR chunk starts at byte 12; width at 16..19, height at 20..23 (big endian)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(1024);
    expect(height).toBe(1024);
  });
});
