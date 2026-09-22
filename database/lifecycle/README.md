# Database lifecycle

This directory contains **public-safe lifecycle documentation only**.

Gym Master keeps executable database migration SQL, customer installation
inventory, backups, dumps and disaster-recovery artifacts outside the public
repository.

## Public artifacts

The canonical public contract is:

```text
docs/database/database-lifecycle-versioning-v1.md
```

The public static verifier is:

```text
scripts/verify-database-lifecycle-versioning.mjs
```

## Important boundary

Do not add real migration SQL to this directory.

The repository intentionally ignores `*.sql` and the historical/private
database migration locations. The lifecycle design is public; executable
database mutation artifacts remain private.

Database version is independent from application version. Every supported
installation converges on the same logical database version; feature variation
is controlled through configuration/licensing instead of schema forks.
