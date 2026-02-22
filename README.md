# majestic-identity-contract

## Purpose

Defines the edition identity algorithm, region normalization, fingerprint versioning, and deterministic identity rules for Majestic. This contract is frozen: identity rules must not change once deployed.

## Responsibilities

- **Edition hash algorithm**: Deterministic hash from content-derived inputs
- **Region normalization**: Canonical representation of region codes
- **Fingerprint versioning policy**: How fingerprint format evolves
- **Deterministic identity rules**: Rules that guarantee same input yields same identity
- **Test vectors**: Reference inputs and expected outputs for verification

## Non-Responsibilities

- **Scanning implementation**: Scanner lives in majestic-server; uses this contract
- **Registry storage**: Database schema and storage are server concerns
- **Streaming**: Identity is independent of playback path

## Architectural Principles

1. **Determinism**: Same content, same inputs, same identity always
2. **Frozen rules**: Identity algorithm and rules are immutable; no silent changes
3. **Versioned fingerprint**: Fingerprint format has version; old versions remain decodable
4. **Test vectors**: Every rule has test vectors; regressions are detectable

## Critical Invariants

- **Identity rules are frozen**: Do not modify the edition hash algorithm, region normalization, or deterministic rules without a new contract version and explicit migration
- Same file content yields same edition hash across scans, machines, and time
- Fingerprint version increments only when format changes; old versions remain valid for lookup

## Dependencies

- None (this is a leaf contract package)

## Failure Philosophy

- Ambiguous input: fail closed; do not assign identity
- Test vector mismatch: fail build; do not ship
- Contract violation: treat as critical bug; fix before any release

## Test Vectors

- Reference inputs and expected outputs for edition hash
- Region normalization examples
- Fingerprint version decoding examples

## Current Status

Contract defined. Consumed by majestic-server. Identity layer complete and frozen.

## Future Constraints

- **No changes to identity algorithm without new contract version**
- New fingerprint versions must be additive; old versions must remain decodable
- Test vectors must be updated for any new rules; CI must enforce
