import {
  generateServerSeed,
  hashServerSeed,
  generateClientSeed,
  generateFloat,
  generateFloats,
  verifyResult,
} from './provably-fair';

describe('provably-fair RNG', () => {
  const SERVER_SEED = 'a'.repeat(64);
  const CLIENT_SEED = 'b'.repeat(16);

  it('generateServerSeed returns 64-char hex', () => {
    const seed = generateServerSeed();
    expect(seed).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(seed)).toBe(true);
  });

  it('generateClientSeed returns 16-char hex', () => {
    const seed = generateClientSeed();
    expect(seed).toHaveLength(16);
    expect(/^[0-9a-f]+$/.test(seed)).toBe(true);
  });

  it('hashServerSeed is deterministic', () => {
    const h1 = hashServerSeed(SERVER_SEED);
    const h2 = hashServerSeed(SERVER_SEED);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('generateFloat returns value in [0, 1)', () => {
    for (let i = 0; i < 20; i++) {
      const f = generateFloat(SERVER_SEED, CLIENT_SEED, i);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('generateFloat is deterministic', () => {
    const f1 = generateFloat(SERVER_SEED, CLIENT_SEED, 0);
    const f2 = generateFloat(SERVER_SEED, CLIENT_SEED, 0);
    expect(f1).toBe(f2);
  });

  it('generateFloats returns correct count', () => {
    const floats = generateFloats(SERVER_SEED, CLIENT_SEED, 0, 15);
    expect(floats).toHaveLength(15);
    floats.forEach((f) => {
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    });
  });

  it('verifyResult succeeds with correct pair', () => {
    const seed = generateServerSeed();
    const hash = hashServerSeed(seed);
    expect(verifyResult(seed, hash)).toBe(true);
  });

  it('verifyResult fails with wrong seed', () => {
    const hash = hashServerSeed(SERVER_SEED);
    expect(verifyResult('wrong' + SERVER_SEED.slice(5), hash)).toBe(false);
  });
});
