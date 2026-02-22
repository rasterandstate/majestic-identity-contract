/**
 * majestic-identity-contract
 *
 * Deterministic identity logic: edition hash, normalization, fingerprint policy.
 * FROZEN: Do not modify without version bump and migration path.
 */

export {
  computeEditionHash,
  EDITION_HASH_VERSION,
  EDITION_HASH_ALGORITHM,
} from './editionHash.js';

export {
  normalizeRegionForHash,
  normalizePackagingForHash,
  normalizeReleaseDateForHash,
  normalizeFormatForEditionHash,
  getEditionRegionSummary,
  REGION_SYNONYMS,
  PACKAGING_SYNONYMS,
} from './normalization.js';

export {
  FINGERPRINT_VERSION,
  FINGERPRINT_ALGORITHM,
  FINGERPRINT_HEAD_BYTES,
  FINGERPRINT_TAIL_BYTES,
} from './fingerprintPolicy.js';
