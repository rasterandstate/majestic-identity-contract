import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  normalizeRegionForHash,
  normalizePackagingForHash,
  normalizeReleaseDateForHash,
  getEditionRegionSummary,
} from '../src/normalization.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testVectors = JSON.parse(
  readFileSync(join(__dirname, 'testVectors.json'), 'utf-8')
);

describe('normalization', () => {
  describe('normalizeRegionForHash', () => {
    for (const vec of (testVectors.normalization as { region: Array<{ input: string; expected: string }> }).region) {
      it(`"${vec.input}" → "${vec.expected}"`, () => {
        expect(normalizeRegionForHash(vec.input)).toBe(vec.expected);
      });
    }

    it('returns empty string for null', () => {
      expect(normalizeRegionForHash(null)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(normalizeRegionForHash('')).toBe('');
    });

    it('returns "none" for "none" (no-disc stable value)', () => {
      expect(normalizeRegionForHash('none')).toBe('none');
    });
  });

  describe('normalizeReleaseDateForHash', () => {
    const releaseDateVectors = (testVectors.normalization as { releaseDate?: Array<{ input: string | null; expected: string }> })
      .releaseDate ?? [];
    for (const vec of releaseDateVectors) {
      it(`"${vec.input}" → "${vec.expected}"`, () => {
        expect(normalizeReleaseDateForHash(vec.input)).toBe(vec.expected);
      });
    }
  });

  describe('normalizePackagingForHash', () => {
    for (const vec of (testVectors.normalization as { packaging: Array<{ input: string; expected: string }> })
      .packaging) {
      it(`"${vec.input}" → "${vec.expected}"`, () => {
        expect(normalizePackagingForHash(vec.input)).toBe(vec.expected);
      });
    }

    it('returns empty string for null', () => {
      expect(normalizePackagingForHash(null)).toBe('');
    });
  });

  describe('getEditionRegionSummary', () => {
    it('returns null for no discs', () => {
      expect(getEditionRegionSummary([])).toBeNull();
    });

    it('returns null when all regions empty', () => {
      expect(getEditionRegionSummary([{ region: null }, { region: '' }])).toBeNull();
    });

    it('returns single region for one disc', () => {
      expect(getEditionRegionSummary([{ region: 'A' }])).toBe('A');
    });

    it('returns sorted multi-region with " + " separator', () => {
      expect(getEditionRegionSummary([{ region: 'A' }, { region: 'B' }])).toBe('A + B');
    });

    it('stable ordering — B then A produces A + B', () => {
      expect(getEditionRegionSummary([{ region: 'B' }, { region: 'A' }])).toBe('A + B');
    });

    it('dedupes identical regions', () => {
      expect(getEditionRegionSummary([{ region: 'A' }, { region: 'A' }, { region: 'A' }])).toBe('A');
    });

    it('normalizes synonyms before combining', () => {
      expect(getEditionRegionSummary([{ region: 'Region A' }, { region: 'USA' }])).toBe('A');
    });
  });
});
