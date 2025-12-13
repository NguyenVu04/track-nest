CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE "user" (
    id UUID PRIMARY KEY,
    connected BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE location (
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accuracy FLOAT NOT NULL DEFAULT 0,
    velocity FLOAT NOT NULL DEFAULT 0,
    user_id UUID NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    PRIMARY KEY (user_id, "timestamp"),
    CHECK ( longitude >= -180 AND longitude <= 180 ),
    CHECK ( latitude >= -90 AND latitude <= 90 ),
    CHECK ( accuracy >= 0 ),
    CHECK ( velocity >= 0 )
);

SELECT create_hypertable('location', 'timestamp',
                         chunk_time_interval => INTERVAL '1 days',
                         partitioning_column => 'user_id',
                         number_partitions => 64);

CREATE TABLE emergency_alert (
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    CHECK ( longitude >= -180 AND longitude <= 180 ),
    CHECK ( latitude >= -90 AND latitude <= 90 ),
    PRIMARY KEY (user_id, created_at)
);

SELECT create_hypertable('emergency_alert', 'created_at',
                         chunk_time_interval => INTERVAL '1 days',
                         partitioning_column => 'user_id',
                         number_partitions => 64);

CREATE TABLE mobile_device (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(2) NOT NULL,
    device_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE tracking_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    tracker_id UUID NOT NULL,
    target_id UUID NOT NULL
);

CREATE TABLE risk_notification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE tracking_notification_alerts_user (
    tracking_notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (tracking_notification_id, user_id)
);

CREATE TABLE tracking_permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    otp VARCHAR(15) NOT NULL,
    create_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL,
    number_of_attempts INTEGER NOT NULL DEFAULT 0,
    CHECK ( number_of_attempts >= 0 )
);

CREATE TABLE tracker_tracks_target (
    tracker_id UUID NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tracker_id, target_id),
    CHECK ( tracker_id <> target_id )
);

ALTER TABLE location
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE mobile_device
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_notification
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE risk_notification
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_notification_alerts_user
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_permission
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracker_tracks_target
    ADD FOREIGN KEY (tracker_id) references "user" (id) ON DELETE CASCADE;

ALTER TABLE tracker_tracks_target
    ADD FOREIGN KEY (target_id) references "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_notification_alerts_user
    ADD FOREIGN KEY (tracking_notification_id) REFERENCES tracking_notification (id) ON DELETE CASCADE;

ALTER TABLE emergency_alert
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE location SET (
    timescaledb.compress = true,
    timescaledb.compress_segmentby = 'user_id',
    timescaledb.compress_orderby = '"timestamp" DESC');

ALTER TABLE emergency_alert SET (
    timescaledb.compress = true,
    timescaledb.compress_segmentby = 'user_id',
    timescaledb.compress_orderby = '"timestamp" DESC');

SELECT add_compression_policy('location', INTERVAL '7 days');

SELECT add_retention_policy('location', INTERVAL '28 days');

SELECT add_compression_policy('emergency_alert', INTERVAL '1 days');

SELECT add_retention_policy('emergency_alert', INTERVAL '7 days');

CREATE INDEX idx_location_user_time_desc ON location (user_id, "timestamp" DESC);

CREATE INDEX idx_location_geom_spgist ON location USING SPGIST (geom);

CREATE INDEX idx_mobile_device_user ON mobile_device (user_id);

CREATE INDEX idx_tracking_notification_user ON tracking_notification (user_id);

CREATE INDEX idx_risk_notification_user ON risk_notification (user_id);