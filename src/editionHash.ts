/**
 * Edition identity hash — identity_v1
 *
 * FROZEN: This algorithm is identity_v1. Do not modify.
 * Same inputs must always produce the same hash.
 * Any change requires: version bump, migration path, updated test vectors.
 */

import { createHash } from 'crypto';
import {
  normalizeFormatForEditionHash,
  normalizePackagingForHash,
  normalizeRegionForHash,
  normalizeReleaseDateForHash,
} from './normalization.js';

/** identity_v1: Edition hash algorithm. Bump when hash logic changes. */
export const EDITION_HASH_VERSION = 1;

/** Algorithm name for audit. Suffix _v1 matches EDITION_HASH_VERSION. */
export const EDITION_HASH_ALGORITHM = 'sha256_edition_identity_v1';

/**
 * Compute edition identity hash for deduplication.
 * Stable fingerprint from movie_id, publisher_key, format, packaging, release_date, region.
 *
 * identity_v1: Exact extraction from majestic-server. Do not change behavior.
 *
 * @param movieId - Movie ID (from disc_edition.movie_id)
 * @param publisherKey - Canonical publisher key (from disc_edition.publisher_key), or null
 * @param format - Physical format (Blu-ray, 4K UHD, DVD, etc.)
 * @param packaging - Packaging (Steelbook, Keep Case, etc.)
 * @param releaseDate - Release date string (YYYY-MM-DD or partial; year extracted)
 * @param region - Region summary (single: "A", multi: "A + B", none: null → "none")
 * @returns SHA-256 hex hash
 */
export function computeEditionHash(
  movieId: number,
  publisherKey: string | null,
  format: string | null,
  packaging: string | null,
  releaseDate: string | null,
  region: string | null
): string {
  const parts = [
    String(movieId),
    publisherKey ?? '',
    normalizeFormatForEditionHash(format),
    normalizePackagingForHash(packaging),
    normalizeReleaseDateForHash(releaseDate),
    normalizeRegionForHash(region ?? 'none'),
  ];
  return createHash('sha256').update(parts.join('\0')).digest('hex');
}
