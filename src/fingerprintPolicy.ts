/**
 * Fingerprint versioning policy — identity-adjacent.
 *
 * Media file fingerprint is computed by the scanner (majestic-server).
 * This module documents the policy and version constant for identity continuity.
 * Fingerprint algorithm is NOT implemented here — only the contract is defined.
 */

/** Current fingerprint algorithm version. Bump when fingerprint format changes. */
export const FINGERPRINT_VERSION = 1;

/** Algorithm name for audit. */
export const FINGERPRINT_ALGORITHM = 'sha256_16mb_head_tail_v1';

/**
 * Fingerprint policy — identity_v1
 *
 * The media file fingerprint consists of:
 *
 * 1. **File size** (fingerprint_size): Total file size in bytes.
 *    Used for quick mismatch detection.
 *
 * 2. **First 16MB hash** (fingerprint_head_hash): SHA-256 of first 16 MiB.
 *    For files smaller than 16MB, hashes entire file.
 *
 * 3. **Last 16MB hash** (fingerprint_tail_hash): SHA-256 of last 16 MiB.
 *    For files smaller than 32MB, head and tail may overlap.
 *
 * 4. **Algorithm name**: Stored as fingerprint_algorithm for audit.
 *    Enables future algorithm changes with migration path.
 *
 * Determinism guarantees:
 * - Same file content → same fingerprint.
 * - Path, filename, mtime do NOT affect fingerprint.
 * - media_file must store fingerprint_version to support future changes.
 *
 * Migration: When algorithm changes, bump FINGERPRINT_VERSION.
 * Old fingerprints remain valid for lookup; new scans use new algorithm.
 */

export const FINGERPRINT_HEAD_BYTES = 16 * 1024 * 1024; // 16 MiB
export const FINGERPRINT_TAIL_BYTES = 16 * 1024 * 1024; // 16 MiB
