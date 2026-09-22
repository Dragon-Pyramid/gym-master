# Gym Master — Database Lifecycle & Versioning v1

## Purpose

This document defines the public, provider-neutral contract used to keep every
Gym Master installation on one logical database version without creating
client-specific schema forks.

It intentionally documents **rules, metadata semantics and validation
boundaries**, not private production schema dumps, credentials, customer data
or executable migration SQL.

## Core invariants

1. Every supported Gym Master installation converges on one canonical logical
   database version.
2. Customer feature differences are expressed through configuration or
   licensing, never through client-specific schema forks.
3. Application release version and database version are independent values.
4. Database versions are monotonic integers: `1`, `2`, `3`, ...
5. Migration identifiers are ordered and immutable:
   `NNNN_descriptive_slug`.
6. A migration may advance only one certified source state to one certified
   target state.
7. Upgrade execution is fail-closed. A failed precondition, backup, migration,
   validation or runtime smoke stops the rollout.
8. A verified backup is required before any migration that mutates a client
   database.
9. Destructive changes use `EXPAND -> MIGRATE -> CONTRACT`; replacement and
   removal are not collapsed into one rollout.
10. The promoted Golden Baseline is immutable evidence. Lifecycle adoption
    creates a new migration; it never rewrites the Golden Baseline.
11. Real migration SQL, database dumps, customer inventory and recovery
    artifacts remain private and outside the public repository.
12. Secrets must never be stored in lifecycle inventory.

## Version model

The application release remains the normal product version, for example:

- app version: `0.1.0`
- app Git SHA: immutable source revision

The database uses an independent lifecycle version:

- `db_version`: monotonic integer
- `baseline_id`: certified origin/baseline
- `last_migration_id`: last successfully applied migration
- `target_db_version`: rollout target

The currently certified Golden v2 database predates lifecycle metadata.
Therefore it is **not** retroactively declared to be database version 1.

Its adoption transition is:

```text
certified Golden v2 / pre-adoption
        |
        v
0001_adopt_golden_v2_lifecycle_metadata
        |
        v
db_version = 1
```

Until migration `0001` is actually applied and validated, an installation based
on Golden v2 remains `CERTIFIED_BASELINE_PRE_ADOPTION` with no current
`db_version`.

## Internal lifecycle namespace

The intended internal PostgreSQL namespace is:

```text
gm_lifecycle
```

The lifecycle contract reserves two relations:

```text
gm_lifecycle.instance_state
gm_lifecycle.migration_history
```

These names are contract-level identifiers only. Their executable DDL belongs
to the private migration artifact and is deliberately not published here.

### `instance_state`

Represents the single current lifecycle state of one database instance.

Logical fields include:

- current database version
- baseline id
- last migration id
- application compatibility metadata
- current lifecycle status
- timestamps / audit metadata required by the private implementation

### `migration_history`

Contains one immutable record for every lifecycle migration successfully
applied to the instance.

A successful history record must be sufficient to identify:

- migration id
- source database version
- target database version
- artifact checksum
- execution/result status
- validation result
- application compatibility reference

The private implementation defines the exact DDL.

## Migration lifecycle

A database rollout follows this order:

```text
discover current state
        |
        v
validate source version and preconditions
        |
        v
create backup
        |
        v
verify backup + checksum
        |
        v
apply exactly one migration
        |
        v
database post-checks
        |
        v
update lifecycle metadata atomically
        |
        v
application runtime smoke
        |
        v
update private installation inventory
```

Any failed gate stops the rollout. The next migration is never attempted after
a failed migration or failed validation.

## Migration artifact rules

A private migration artifact must:

- have one immutable migration id;
- declare exact source and target versions;
- declare compatible app release/source revision when required;
- declare preconditions and postconditions;
- be checksum-addressed;
- run transactionally when PostgreSQL semantics permit it;
- fail closed on an unexpected source state;
- never silently skip a required transformation;
- never contain customer credentials;
- preserve a private execution/audit record.

The first planned migration is:

```text
0001_adopt_golden_v2_lifecycle_metadata
```

Its purpose is lifecycle adoption only. It must not introduce an unrelated
business feature.

## Installation inventory

Inventory is private and maintained per installation. It contains metadata such
as:

- client code / installation code
- environment
- app version
- app Git SHA
- lifecycle status
- current database version
- target database version
- baseline id
- last migration id
- public-data fingerprint/checksum
- last verified backup id/checksum
- rollout status
- validation status

Inventory must never contain:

- passwords
- JWTs
- Supabase anon/service-role keys
- database credentials
- connection strings containing credentials
- private customer data

## Public / private boundary

Safe public repository artifacts:

```text
docs/database/database-lifecycle-versioning-v1.md
database/lifecycle/README.md
scripts/verify-database-lifecycle-versioning.mjs
```

Private recovery/lifecycle artifacts live outside the repository, under the
operator-controlled recovery area.

The public repository intentionally ignores SQL and the historical/private
migration directories. A public verifier must fail if executable SQL is added
to the tracked lifecycle contract by mistake.

## Rollout policy

All client databases must converge on the same supported logical database
version.

A client may temporarily be behind during an approved rolling upgrade, but:

- the observed source version must be known;
- there must be a certified migration path to the target;
- the application/database compatibility window must be explicit;
- the rollout state must be recorded privately;
- no client-specific schema branch becomes a permanent supported state.

## Failure policy

On failure:

1. stop;
2. preserve evidence;
3. do not advance lifecycle metadata;
4. do not run the next migration;
5. classify whether recovery is forward-fix or restore;
6. validate the database and application again before resuming.

This contract does not claim that arbitrary down migrations are safe.
Recovery strategy is migration-specific and backup-aware.

## Current baseline reference

The initial lifecycle adoption work is based on the private certified baseline:

```text
baseline_id = 20260917-golden-v2
planned_db_version = 1
planned_first_migration_id = 0001_adopt_golden_v2_lifecycle_metadata
```

The Golden Baseline itself remains immutable.
