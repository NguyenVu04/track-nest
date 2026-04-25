# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## File naming and mount order

Scripts are mounted into each service's Postgres container in lexicographic order by the docker-compose volume binding. Follow the prefix convention when adding files:

| Prefix | Purpose |
|---|---|
| `01-<service>-init.sql` | Schema DDL (extensions, tables, indexes, FKs) |
| `02-<service>-seed.sql` | Reference and test data |

`tables_postgres.sql` is the exception — it holds Quartz scheduler DDL for `user-tracking` and is mounted separately (not via the numbered prefix pattern).

## Required PostgreSQL extensions per database

Every init script enables these three:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

`01-user-tracking-init.sql` additionally enables:
```sql
CREATE EXTENSION IF NOT EXISTS "h3";
```

The TimescaleDB-HA image ships with PostGIS; `h3` is installed separately in the user-tracking container image.

## Key schema patterns

### Generated geometry column
Every table that stores a lat/lon pair carries a `geom` column generated from those values — do not store it manually:
```sql
geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED
```
Spatial indexes use `SPGIST` on point columns and `GIST` where range queries are needed.

### TimescaleDB hypertable
The `location` table in `user-tracking` is a hypertable partitioned by `timestamp` (1-day chunks) with 64 space partitions on `user_id`. This call must come after the `CREATE TABLE`:
```sql
SELECT create_hypertable('location', 'timestamp',
    chunk_time_interval => INTERVAL '1 days',
    partitioning_column => 'user_id',
    number_partitions => 64);
```

### Partial unique index for active requests
`emergency-ops` enforces that each `target_id` can only have one open request at a time via a partial index — not a regular FK or check constraint:
```sql
CREATE UNIQUE INDEX uq_emergency_request_active_target
    ON emergency_request (target_id)
    WHERE status_name IN ('PENDING', 'ACCEPTED');
```

### Status lookup tables with i18n
Both `emergency-ops` and `criminal-reports` use a `*_status` table (PK = `name VARCHAR(15)`) plus a `*_status_translation` table keyed on `(language_code, status_name)`. Status values are owned by seed data; the application reads them via FK rather than an enum type.

## Cross-service identity

UUIDs are not FK-enforced across the three separate Postgres instances — consistency is the application's responsibility. Some IDs intentionally overlap across databases:

- The `admin` emergency service in `emergency-ops` (`0e745cb3-...`) is also seeded as a `reporter` in `criminal-reports`.
- `sender_id` / `target_id` in `emergency_request` and `user_id` in `missing_person_report` reference user UUIDs that live in `user-tracking`'s `"user"` table.

## user-tracking seed data

`02-user-tracking-seed.sql` generates a full week of location history (3 360 points per user at 3-minute intervals) via `generate_series`. This is intentional — it pre-populates the `location_bucket` and `cell_visit` tables that the H3-based anomaly detection pipeline depends on. Re-running the seed on a non-empty database is safe because all inserts use `ON CONFLICT DO NOTHING`.
