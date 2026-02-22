# majestic-identity-contract

Deterministic identity logic for Majestic: edition hash, region/packaging normalization, fingerprint policy. Extracted and frozen from majestic-server.

---

## ⚠️ WARNING

**Identity rules are frozen.**

Any modification requires:

- version bump
- migration path
- updated test vectors

**Do not redesign identity.**  
**Do not optimize hashing.**  
**Do not simplify normalization.**  
Extract behavior exactly as implemented.

---

## Identity Philosophy

Majestic models identity explicitly. Edition identity is derived from content-derived inputs—never from paths, filenames, or mutable metadata. The same edition, described the same way, must always produce the same identity hash.

**Principles:**

1. **Determinism**: Same inputs → same identity. Always.
2. **Frozen rules**: The algorithm and synonym maps are immutable. No silent changes.
3. **Versioned evolution**: Changes require explicit version bump and migration.
4. **Test vectors**: Every rule has test vectors; regressions are detectable.

---

## ⚠️ Movie ID Caveat

**`movieId` is the internal database ID** (from `disc_edition.movie_id` → `movie.id`).

It is **not** stable across environments. Same movie, different DB instance → different `movieId` → different edition hash.

**Implications:**

- Edition hash is **per-instance**. It deduplicates editions within a single Majestic library, not across libraries or servers.
- Cross-environment identity (e.g. curated API, federation) would require a canonical movie identity (e.g. TMDB ID, content hash) instead of `movieId`. That is a future migration.
- **Do not** use edition hash as a global identifier. Use it for in-library deduplication only.

This is documented, not fixed. Changing it would require a new hash version and migration.

---

## Determinism Guarantees

- **Edition hash**: `computeEditionHash(movieId, publisherKey, format, packaging, releaseDate, region)` produces identical output for identical inputs across runs, machines, and time (within the same `movieId` scope).
- **Region normalization**: "Region A", "A", "region a", "USA" all normalize to canonical "A".
- **Packaging normalization**: "Steel Book", "steelbook", "Steel-book" all normalize to "steelbook".
- **Region summary**: Multi-region discs produce sorted, stable order ("A + B", never "B + A").
- **Hash invariance to region order**: `getEditionRegionSummary` sorts regions before joining; [A,B] and [B,A] produce the same hash.

---

## Explicit Freeze Statement

**As of version 1.0.0, the identity layer is complete and frozen.**

- Edition hash algorithm: **identity_v1**. Do not modify.
- Region synonym map: **frozen**. Do not add/remove mappings.
- Packaging synonym map: **frozen**. Do not add/remove mappings.
- Format normalization: **frozen**. Do not change regex or output forms.

---

## Versioning Policy

- **EDITION_HASH_VERSION**: Bump when edition hash inputs, separator, or normalization changes.
- **FINGERPRINT_VERSION**: Bump when media file fingerprint format changes.
- **Migration**: Old hashes remain valid for lookup. New scans use new algorithm. Backfill scripts must handle both versions.

---

## What Constitutes a Breaking Change

- Changing the edition hash algorithm (inputs, separator, hash function).
- Adding, removing, or modifying region synonyms.
- Adding, removing, or modifying packaging synonyms.
- Changing format normalization (e.g. "4K" → different canonical form).
- Changing release date extraction (e.g. year vs full date).
- Changing region summary ordering or separator.

---

## Migration Requirements if Hash Algorithm Changes

1. **Version bump**: Increment `EDITION_HASH_VERSION` and `EDITION_HASH_ALGORITHM` suffix.
2. **Dual support**: majestic-server must support both old and new hash for lookup during transition.
3. **Backfill**: Script to recompute `edition_identity_hash` for existing `disc_edition` rows using new algorithm.
4. **Test vectors**: Add new vectors for new algorithm; retain old vectors for regression.
5. **Documentation**: Update this README with migration notes and timeline.

---

## Structure

```
/src
  editionHash.ts    — Edition identity hash (identity_v1)
  normalization.ts  — Region, packaging, format, release date normalization
  fingerprintPolicy.ts — Fingerprint version and policy (documentation)
  index.ts          — Re-exports
/tests
  editionHash.test.ts
  normalization.test.ts
  testVectors.json
README.md
package.json
tsconfig.json
```

---

## Usage

```ts
import {
  computeEditionHash,
  normalizeRegionForHash,
  normalizePackagingForHash,
  getEditionRegionSummary,
} from 'majestic-identity-contract';

// Edition hash
const hash = computeEditionHash(
  1,           // movieId
  'criterion', // publisherKey
  'Blu-ray',   // format
  'Steelbook', // packaging
  '2020-05-15',// releaseDate
  'A'          // region
);

// Region summary from discs
const region = getEditionRegionSummary([
  { region: 'A' },
  { region: 'B' },
]);
// → "A + B"
```

---

## Non-Responsibilities

This package does **not** include:

- Database access
- Streaming logic
- Build pipeline logic
- HTTP routes
- UI code
- Enrichment logic
- Playback logic

---

## Packaging Normalization Philosophy

**Collapsed intentionally:**

- **Keep Case (Slim)** and **Keep Case (Standard)** → `standard`. Collectors don't distinguish slim vs standard keep case for identity.
- **Slipcase**, **Slip Cover**, **Slip Sleeve** → `slip`. Same physical concept.
- **Steel Book**, **steel-book**, **Steel Case** → `steelbook`.

**Not collapsed:** Steelbook, Digibook, Digipack, Slip, Box, Standard remain distinct. Over-normalization would merge editions that collectors treat differently.

---

## Test Vectors

See `tests/testVectors.json`. Covers:

- Single-region edition
- Multi-region edition (A+B)
- No-disc edition (region null → "none")
- Synonym input cases ("Region A", "A", "region a")
- Packaging variations (Steel Book, Keep Case, etc.)
- **Edge cases**: `""`, `null`, `"Unknown"`, `"All Regions"` (region); `"2020"`, `"2020-01-01"`, `"2020-12-31"` (release date collapse)

Run tests: `npm test`

---

## Dependencies

None. This is a leaf contract package.

---

## Release Checklist

Before cutting a release:

1. **Tag**: `git tag v1.0.0` (or appropriate version)
2. **CI**: Ensure `.github/workflows/ci.yml` passes on push
3. **majestic-server**: Update to depend on this package; remove duplicate logic
