import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const bg = [0xf6, 0xf3, 0xec, 255];
const accent = [0x0e, 0x3b, 0x2e, 255];
const clear = [0, 0, 0, 0];

const glyphs = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length - 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = pixels(x, y);
      const at = row + 1 + x * 4;
      raw[at] = pixel[0];
      raw[at + 1] = pixel[1];
      raw[at + 2] = pixel[2];
      raw[at + 3] = pixel[3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function fill(color) {
  return () => color;
}

function iconPixel(x, y, size, background) {
  const mark = size * 0.34;
  const left = (size - mark) / 2;
  const top = (size - mark * 1.25) / 2;
  const width = mark;
  const height = mark * 1.25;
  const inside =
    x >= left && x < left + width && y >= top && y < top + height;
  if (!inside) return background;
  const stripe = x > left + width * 0.18 && x < left + width * 0.32;
  return stripe ? bg : accent;
}

function drawText(pixels, text, originX, originY, scale, color) {
  let cursor = originX;
  for (const character of text) {
    const glyph = glyphs[character] ?? glyphs[' '];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((bit, column) => {
        if (bit !== '1') return;
        for (let y = 0; y < scale; y += 1) {
          for (let x = 0; x < scale; x += 1) {
            pixels.set(
              `${cursor + column * scale + x},${originY + rowIndex * scale + y}`,
              color,
            );
          }
        }
      });
    });
    cursor += 6 * scale;
  }
}

function splash() {
  const size = 1200;
  const marks = new Map();
  const scale = 8;
  const lines = ['NIGERIA', 'CONSTITUTION AND LAW'];
  lines.forEach((line, index) => {
    const width = line.length * 6 * scale - scale;
    drawText(
      marks,
      line,
      Math.round((size - width) / 2),
      470 + index * 90,
      scale,
      accent,
    );
  });
  return png(size, size, (x, y) => marks.get(`${x},${y}`) ?? bg);
}

const icon = png(1024, 1024, (x, y) => iconPixel(x, y, 1024, bg));
const foreground = png(1024, 1024, (x, y) => iconPixel(x, y, 1024, clear));
const background = png(1024, 1024, fill(bg));
const favicon = png(64, 64, (x, y) => iconPixel(x, y, 64, bg));

const root = new URL('../apps/app/assets/', import.meta.url);
writeFileSync(new URL('icon.png', root), icon);
writeFileSync(new URL('splash-icon.png', root), splash());
writeFileSync(new URL('android-icon-foreground.png', root), foreground);
writeFileSync(new URL('android-icon-background.png', root), background);
writeFileSync(new URL('android-icon-monochrome.png', root), foreground);
writeFileSync(new URL('favicon.png', root), favicon);
