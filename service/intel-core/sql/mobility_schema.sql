-- Human mobility anomaly detection schema.
-- Apply once against the intel-core PostgreSQL database.

CREATE TABLE IF NOT EXISTS location_ping (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    latitude_deg    DOUBLE PRECISION NOT NULL,
    longitude_deg   DOUBLE PRECISION NOT NULL,
    accuracy_meter  DOUBLE PRECISION NOT NULL,
    velocity_mps    DOUBLE PRECISION NOT NULL,
    event_ts        TIMESTAMPTZ NOT NULL,
    hour_of_day     SMALLINT NOT NULL,
    day_of_week     SMALLINT NOT NULL,
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_location_ping_user_event_ts
    ON location_ping (user_id, event_ts);
CREATE INDEX IF NOT EXISTS ix_location_ping_event_ts
    ON location_ping (event_ts);

CREATE TABLE IF NOT EXISTS user_profile (
    user_id                 UUID PRIMARY KEY,
    centroid_lat            DOUBLE PRECISION,
    centroid_lng            DOUBLE PRECISION,
    last_full_refit_at      TIMESTAMPTZ,
    last_warm_refit_at      TIMESTAMPTZ,
    last_seen_at            TIMESTAMPTZ,
    total_training_samples  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_bucket_model (
    user_id             UUID NOT NULL,
    hour_of_day         SMALLINT NOT NULL,
    day_of_week         SMALLINT NOT NULL,
    n_components        INTEGER NOT NULL,
    n_samples           INTEGER NOT NULL,
    threshold_loglik    DOUBLE PRECISION NOT NULL,
    s3_key              VARCHAR(512) NOT NULL,
    suspended           BOOLEAN NOT NULL DEFAULT FALSE,
    trained_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, hour_of_day, day_of_week)
);
CREATE INDEX IF NOT EXISTS ix_user_bucket_model_user ON user_bucket_model (user_id);

CREATE TABLE IF NOT EXISTS user_speed_profile (
    user_id     UUID PRIMARY KEY,
    p50_mps     DOUBLE PRECISION NOT NULL,
    p95_mps     DOUBLE PRECISION NOT NULL,
    p99_mps     DOUBLE PRECISION NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retraining_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    kind            VARCHAR(16) NOT NULL,       -- 'full' | 'warm' | 'drift'
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ,
    buckets_trained INTEGER NOT NULL DEFAULT 0,
    samples_used    INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(16) NOT NULL DEFAULT 'running',  -- 'running' | 'ok' | 'failed'
    error           VARCHAR(1024)
);
CREATE INDEX IF NOT EXISTS ix_retraining_log_user_started
    ON retraining_log (user_id, started_at);
