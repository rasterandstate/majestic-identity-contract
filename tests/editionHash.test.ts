import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { computeEditionHash } from '../src/editionHash.js';
import { getEditionRegionSummary } from '../src/normalization.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testVectors = JSON.parse(
  readFileSync(join(__dirname, 'testVectors.json'), 'utf-8')
);

describe('editionHash', () => {
  for (const vec of testVectors.editionHash as Array<{
    name: string;
    movieId: number;
    publisherKey: string | null;
    format: string | null;
    packaging: string | null;
    releaseDate: string | null;
    region: string | null;
    expectedHash: string;
  }>) {
    it(`produces expected hash for ${vec.name}`, () => {
      const hash = computeEditionHash(
        vec.movieId,
        vec.publisherKey,
        vec.format,
        vec.packaging,
        vec.releaseDate,
        vec.region
      );
      expect(hash).toBe(vec.expectedHash);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  }

  it('is deterministic — same input yields same hash', () => {
    const h1 = computeEditionHash(1, 'criterion', 'Blu-ray', 'Steelbook', '2020-05-15', 'A');
    const h2 = computeEditionHash(1, 'criterion', 'Blu-ray', 'Steelbook', '2020-05-15', 'A');
    expect(h1).toBe(h2);
  });

  it('hash invariant to region order — A+B and B+A produce same region summary', () => {
    const summaryAB = getEditionRegionSummary([{ region: 'A' }, { region: 'B' }]);
    const summaryBA = getEditionRegionSummary([{ region: 'B' }, { region: 'A' }]);
    expect(summaryAB).toBe('A + B');
    expect(summaryBA).toBe('A + B');
    const hashAB = computeEditionHash(1, null, 'Blu-ray', null, '2020', summaryAB);
    const hashBA = computeEditionHash(1, null, 'Blu-ray', null, '2020', summaryBA);
    expect(hashAB).toBe(hashBA);
  });

  it('produces stable 64-char hex output', () => {
    const hash = computeEditionHash(999, 'arrow', '4K UHD', 'Digibook', '2023-12-01', 'ABC');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('release date collapse — 2020, 2020-01-01, 2020-12-31 produce same hash', () => {
    const base = { movieId: 1, publisherKey: null, format: 'Blu-ray', packaging: null, region: 'A' };
    const h1 = computeEditionHash(base.movieId, base.publisherKey, base.format, base.packaging, '2020', base.region);
    const h2 = computeEditionHash(base.movieId, base.publisherKey, base.format, base.packaging, '2020-01-01', base.region);
    const h3 = computeEditionHash(base.movieId, base.publisherKey, base.format, base.packaging, '2020-12-31', base.region);
    expect(h1).toBe(h2);
    expect(h2).toBe(h3);
  });
});
