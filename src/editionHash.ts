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

/** Max length per string input to prevent abuse in high-throughput scenarios. */
const MAX_STRING_LENGTH = 4096;

function validateMovieId(movieId: number): void {
  if (typeof movieId !== 'number' || !Number.isFinite(movieId) || !Number.isInteger(movieId) || movieId < 0) {
    throw new TypeError(
      `movieId must be a non-negative integer, got ${movieId} (${typeof movieId})`
    );
  }
}

function validateStringLength(value: string | null, field: string): void {
  if (value != null && value.length > MAX_STRING_LENGTH) {
    throw new RangeError(
      `${field} exceeds max length ${MAX_STRING_LENGTH} (got ${value.length})`
    );
  }
}

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
  validateMovieId(movieId);
  validateStringLength(publisherKey ?? null, 'publisherKey');
  validateStringLength(format ?? null, 'format');
  validateStringLength(packaging ?? null, 'packaging');
  validateStringLength(releaseDate ?? null, 'releaseDate');
  validateStringLength(region ?? null, 'region');

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
