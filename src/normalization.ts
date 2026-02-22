/**
 * Deterministic normalization for identity hashing.
 *
 * FROZEN: Do not modify synonym maps or normalization logic.
 * Same input must always produce the same output.
 * Any change requires: version bump, migration path, updated test vectors.
 */

/** Base normalization: trim, lowercase, collapse whitespace. */
function normalizeForHash(s: string | null): string {
  if (s == null) return '';
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Region synonym map — identity_v1.
 * Maps common region variants to canonical form for deterministic hashing.
 */
export const REGION_SYNONYMS: Record<string, string> = {
  a: 'A',
  'region a': 'A',
  'blu-ray region a': 'A',
  'a (us)': 'A',
  usa: 'A',
  'united states': 'A',
  'u.s.': 'A',
  'u.s.a.': 'A',
  america: 'A',
  b: 'B',
  'region b': 'B',
  uk: 'B',
  'united kingdom': 'B',
  england: 'B',
  'great britain': 'B',
  c: 'C',
  'region c': 'C',
  abc: 'ABC',
  'a,b,c': 'ABC',
  'a/b/c': 'ABC',
  'region free': 'ABC',
  all: 'ABC',
  'region a, b, c': 'ABC',
  '0': 'ABC',
  'region 0': 'ABC',
  '1': '1',
  '2': '2',
  'region 1': '1',
  'region 2': '2',
  none: 'none', // Stable value when edition has no discs
};

/**
 * Packaging synonym map — identity_v1.
 * Slip variants collapse to "slip"; keep case variants to "standard".
 */
export const PACKAGING_SYNONYMS: Record<string, string> = {
  'steel book': 'steelbook',
  'steel-book': 'steelbook',
  steel_case: 'steelbook',
  'steel case': 'steelbook',
  'digi book': 'digibook',
  'digi-book': 'digibook',
  'digi pack': 'digipack',
  'digi-pack': 'digipack',
  slipcase: 'slip',
  'slip case': 'slip',
  slipcover: 'slip',
  'slip sleeve': 'slip',
  'keep case': 'standard',
  'keep case (slim)': 'standard',
  'keep case (standard)': 'standard',
  'steel-case': 'steelbook',
  'box set': 'box',
};

/**
 * Normalize region for hash.
 * Includes country→region mapping — "USA", "United States" often appear in region fields.
 */
export function normalizeRegionForHash(region: string | null): string {
  const n = normalizeForHash(region);
  if (!n) return '';
  return REGION_SYNONYMS[n] ?? n;
}

/**
 * Normalize packaging for hash.
 * "Steelbook", "steelbook", "Steel Book" hash identically.
 */
export function normalizePackagingForHash(packaging: string | null): string {
  const n = normalizeForHash(packaging);
  if (!n) return '';
  return PACKAGING_SYNONYMS[n] ?? n;
}

/**
 * Normalize release_date to year for hash.
 * Collectors treat May 2020 and Oct 2020 as same release wave.
 */
export function normalizeReleaseDateForHash(releaseDate: string | null): string {
  if (!releaseDate || !releaseDate.trim()) return '';
  const year = releaseDate.trim().slice(0, 4);
  return /^\d{4}$/.test(year) ? year : '';
}

/**
 * Normalize format for edition hash: 4K, Blu-ray, DVD, etc.
 */
export function normalizeFormatForEditionHash(format: string | null): string {
  const n = normalizeForHash(format);
  if (!n) return '';
  if (/4k|uhd|2160/.test(n)) return '4k';
  if (/blu-ray|bluray|bd/.test(n)) return 'bluray';
  if (/dvd/.test(n)) return 'dvd';
  if (/hd dvd/.test(n)) return 'hddvd';
  return n;
}

/**
 * Compute region summary from discs.
 * Normalizes each region, dedupes, sorts for deterministic identity.
 * Returns null if no regions set.
 *
 * Single region: "A"
 * Multi-region: "A + B" (sorted, stable order)
 */
export function getEditionRegionSummary(
  discs: Array<{ region?: string | null }>
): string | null {
  const normalized = discs
    .map((d) => normalizeRegionForHash((d.region ?? '').trim() || null))
    .filter(Boolean);
  const regions = [...new Set(normalized)].sort();
  if (regions.length === 0) return null;
  if (regions.length === 1) return regions[0];
  return regions.join(' + ');
}
