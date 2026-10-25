import * as Crypto from 'expo-crypto';

const current = globalThis.crypto;
const missingRandom =
  !current ||
  typeof current.randomUUID !== 'function' ||
  typeof current.getRandomValues !== 'function';

if (missingRandom) {
  const polyfill = {
    randomUUID: () => Crypto.randomUUID(),
    getRandomValues: <T extends ArrayBufferView>(array: T) => {
      const bytes = Crypto.getRandomBytes(array.byteLength);
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(
        bytes,
      );
      return array;
    },
  };
  Object.defineProperty(globalThis, 'crypto', {
    value: polyfill,
    configurable: true,
  });
}
