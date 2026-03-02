# Repo Interrogation Report: majestic-identity-contract

**Date:** 2025-03-02  
**Repository:** majestic-identity-contract  
**Version:** 1.0.0

---

## 1. Identity & Purpose

### Clear Description

**majestic-identity-contract** is a frozen, deterministic identity library for Majestic. It provides edition hashing (SHA-256 from movie, publisher, format, packaging, release date, region), region/packaging normalization, and fingerprint policy constants. It has no runtime dependencies, no I/O, and no side effects.

### Primary Responsibilities

- **Edition identity hash** (`computeEditionHash`) — Deterministic SHA-256 hash for disc edition deduplication within a single Majestic library
- **Normalization** — Canonical forms for region, packaging, format, and release date so identical editions always produce the same hash
- **Fingerprint policy** — Version constants and byte sizes (16 MiB head/tail) for media file fingerprinting; implementation lives in majestic-server

### Secondary Responsibilities

- Re-export of synonym maps (`REGION_SYNONYMS`, `PACKAGING_SYNONYMS`) for consumers that need to inspect or extend behavior
- `getEditionRegionSummary` — Multi-disc region aggregation with deterministic ordering

### Architectural Boundary Assessment

- **Scope:** Appropriately narrow. Pure functions only; no DB, HTTP, streaming, or UI.
- **Overlap:** None with other repos. Identity logic was extracted from majestic-server; this package is the single source of truth.
- **Boundary:** Clear. Consumers (e.g. majestic-server) import and call; no shared state or side effects.

---

## 2. Public Surface Area

### Exported Library API

| Export | Source | Purpose |
|--------|--------|---------|
| `computeEditionHash` | `editionHash.ts` | SHA-256 edition hash |
| `EDITION_HASH_VERSION` | `editionHash.ts` | Version constant (1) |
| `EDITION_HASH_ALGORITHM` | `editionHash.ts` | Algorithm name for audit |
| `normalizeRegionForHash` | `normalization.ts` | Region → canonical form |
| `normalizePackagingForHash` | `normalization.ts` | Packaging → canonical form |
| `normalizeReleaseDateForHash` | `normalization.ts` | Release date → year |
| `normalizeFormatForEditionHash` | `normalization.ts` | Format → canonical form |
| `getEditionRegionSummary` | `normalization.ts` | Multi-disc region summary |
| `REGION_SYNONYMS` | `normalization.ts` | Region synonym map |
| `PACKAGING_SYNONYMS` | `normalization.ts` | Packaging synonym map |
| `FINGERPRINT_VERSION` | `fingerprintPolicy.ts` | Fingerprint version (1) |
| `FINGERPRINT_ALGORITHM` | `fingerprintPolicy.ts` | Algorithm name |
| `FINGERPRINT_HEAD_BYTES` | `fingerprintPolicy.ts` | 16 MiB |
| `FINGERPRINT_TAIL_BYTES` | `fingerprintPolicy.ts` | 16 MiB |

### Surface Analysis

| Criterion | Status |
|-----------|--------|
| **Authenticated** | N/A — library; no network or auth |
| **Authorized** | N/A |
| **Input validated** | Partial — see §6 |
| **Output sanitized** | Yes — hash is hex; normalization returns strings |
| **Rate limiting** | N/A |
| **Documented** | Yes — README, JSDoc, test vectors |

### Other Surfaces

- **HTTP endpoints:** None
- **CLI commands:** None
- **Background jobs:** None
- **WebSocket/SSE:** None
- **File system writes:** None
- **Cron tasks:** None

---

## 3. Authentication & Authorization

**Not applicable.** This is a pure library with no network, sessions, or tokens. Identity here refers to **content/edition identity**, not user authentication.

---

## 4. Data Integrity & Concurrency

### Storage

- **No persistent storage.** All functions are pure; no DB, files, or shared mutable state.

### Determinism & Concurrency

- **Writes:** None.
- **Race conditions:** None — stateless.
- **Optimistic locking:** N/A.
- **Destructive actions:** None.
- **Audit trail:** Algorithm names (`EDITION_HASH_ALGORITHM`, `FINGERPRINT_ALGORITHM`) support audit.

### Hash Input Handling

- **Separator:** `\0` used in `editionHash.ts:53` (`parts.join('\0')`). User-controlled strings (e.g. `publisherKey`, `format`) are concatenated as single parts; no separator injection risk.
- **Last-write-wins:** N/A — no shared state.
- **Rollback:** N/A.

### Caveat

- **movieId** is an internal DB ID (`disc_edition.movie_id`). Same movie, different DB instance → different `movieId` → different edition hash. Edition hash is **per-instance** only; not suitable as a global identifier. Documented in README.

---

## 5. Configuration & Environment

### Required Env Vars

**None.** No runtime configuration.

### Validation at Startup

- N/A — no server or startup logic.

### Secrets

- None.

### Dev vs Prod

- No distinction; behavior is identical everywhere.

### Flags

| Issue | Status |
|-------|--------|
| Implicit defaults | None — no config |
| Fallback paths hiding misconfiguration | None |
| HTTP in production | N/A |

### Note

- `.gitignore` references `!.env.example` but `.env.example` does not exist. Harmless; no env vars are used.

---

## 6. Security Posture

### General

- **Security headers, CSP, CORS:** N/A — not a web app.
- **eval / dynamic execution:** None.
- **Raw HTML injection:** None.
- **File uploads:** None.
- **Deserialization:** None (JSON only in tests).
- **Error leakage:** Functions return values; no stack traces or sensitive data exposed.

### Input Handling

| Concern | Location | Assessment |
|---------|----------|------------|
| **Unbounded strings** | `editionHash.ts`, `normalization.ts` | No length limits. Very large inputs could increase CPU/memory for hashing. Low risk for typical edition metadata. |
| **movieId type** | `editionHash.ts:38` | `number`; `String(movieId)` used. `NaN`, `Infinity` produce deterministic but possibly unintended hashes. Not validated. |
| **Null/undefined** | All functions | Handled via `?? ''`, `|| null`, etc. No crashes observed. |

### Crypto

- **Hash:** Node `crypto.createHash('sha256')` — standard, acceptable.
- **Separator:** `\0` — no injection into hash structure.

### Flags

| Issue | Status |
|------|--------|
| Missing CSP | N/A |
| Wildcard CORS | N/A |
| Unauthenticated file access | N/A |

---

## 7. Operational Readiness

### Logging

- **No logging.** Pure functions; no `console.log` or structured logging. Appropriate for a library.

### Errors

- No explicit error handling; invalid inputs produce deterministic outputs (e.g. empty string, passthrough). No thrown exceptions in normal paths.

### Health Checks

- N/A — not a service.

### Deployment

- **Documented:** README includes usage, versioning, migration, release checklist.
- **Launch checklist:** Release checklist in README (tag, CI, majestic-server update).
- **Backup:** N/A — no state.

### Flags

| Issue | Status |
|------|--------|
| console.log scattered | None |
| No log levels | N/A |
| No startup validation | N/A |
| No deployment doc | README sufficient |

---

## 8. Testing Discipline

### Test Files

| File | Tests | Purpose |
|------|-------|---------|
| `tests/editionHash.test.ts` | 13 | Edition hash: vectors, determinism, region order, release date collapse |
| `tests/normalization.test.ts` | 33 | Region, packaging, release date, `getEditionRegionSummary` |

### Coverage

- **Edition hash:** Single/multi-region, no-disc, synonyms, determinism, region order invariance, release date collapse.
- **Normalization:** Region, packaging, release date, region summary (empty, single, multi, dedup, synonyms).

### Quality

- **Test vectors:** `tests/testVectors.json` — spec-driven; CI fails on output drift.
- **Determinism:** Explicit tests for same-input-same-output and region order.
- **Skipped tests:** None (`it.skip` not used).
- **Snapshots:** None.
- **Deterministic:** Yes — no flakiness observed.

### CI

- `.github/workflows/ci.yml`: push/PR on `main` → `pnpm install --frozen-lockfile` → `pnpm test`.
- **Result:** 46 tests pass in ~300ms.

### Flags

| Issue | Status |
|------|--------|
| Red CI | Green |
| it.skip without rationale | None |
| Snapshot overuse | None |
| No integration tests for critical flows | Unit tests cover all exported functions; integration is consumer responsibility |

### Gaps

- No explicit coverage thresholds (no `vitest.config.*` with coverage).
- No tests for `normalizeFormatForEditionHash` in isolation (covered indirectly via edition hash vectors).
- No tests for `NaN`, `Infinity`, or extremely large `movieId`.

---

## 9. Dependency & Supply Risk

### Top-Level Dependencies

| Package | Type | Version |
|---------|------|---------|
| typescript | dev | ^5.0.0 |
| vitest | dev | ^2.0.0 |

**Runtime dependencies:** None (leaf package).

### Overrides

- `esbuild >= 0.25.0` (pnpm override) — transitive via vitest; version pin for compatibility.

### Risk Assessment

| Concern | Status |
|---------|--------|
| Outdated packages | Minor — ^ ranges allow updates |
| High-risk packages | None |
| Unnecessary deps | None |
| Transitive risk | Low — dev-only deps |

### Flags

| Issue | Status |
|------|--------|
| Large unneeded dependencies | None |
| Abandoned libraries | None |
| Security-sensitive packages | Node `crypto` only (stdlib) |

---

## 10. Production Readiness Verdict

### GO / NO-GO

| Context | Verdict |
|---------|---------|
| **Internal use** | **GO** |
| **Paying customers** | **GO** (as a library consumed by majestic-server) |
| **Internet exposure** | **GO** (library only; no direct exposure) |

### Must Fix Before Release

- **None.** Package is suitable for production use as a library.

### Should Fix Before Scaling

1. **Input validation** — Consider validating `movieId` (finite number, integer) and optionally bounding string lengths to avoid abuse in high-throughput scenarios. Low priority for typical usage.
2. **Coverage thresholds** — Add `vitest.config.ts` with coverage thresholds (e.g. 90%) to prevent regressions.

### Can Defer

1. **`.env.example`** — Create if env vars are ever added; currently unnecessary.
2. **Explicit `normalizeFormatForEditionHash` tests** — Covered indirectly; add if refactoring that module.
3. **Edge-case tests** — `NaN`, `Infinity`, very large `movieId` — add if consumers report issues.

### Confidence Score

**95/100**

- Strong: Frozen spec, test vectors, no deps, clear scope, good docs.
- Minor: No explicit coverage config, no input validation for numeric edge cases.

---

## Summary

**majestic-identity-contract** is a well-scoped, frozen identity library with no runtime dependencies, clear documentation, and spec-driven tests. It is suitable for production use as a dependency of majestic-server and other Majestic services. No blocking issues identified.
