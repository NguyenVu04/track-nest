CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE "user" (
    id UUID PRIMARY KEY,
    connected BOOLEAN NOT NULL DEFAULT TRUE,
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    username VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT
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

CREATE TABLE mobile_device (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(2) NOT NULL,
    device_token TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'ANDROID',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE tracking_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
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
    notification_id UUID NOT NULL,
    tracker_id UUID NOT NULL,
    PRIMARY KEY (notification_id, tracker_id)
);

CREATE TABLE family_circle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_in_family_circle (
    family_circle_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50),
    admin BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (family_circle_id, user_id)
);

CREATE TABLE location_bucket (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    day_of_week SMALLINT NOT NULL,
    hour_of_day SMALLINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_num_visits INTEGER NOT NULL DEFAULT 1,
    CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    UNIQUE (user_id, day_of_week, hour_of_day)
);

CREATE TABLE cell_visit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    cell_id VARCHAR(16) NOT NULL,
    bucket_id UUID NOT NULL,
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    num_visits INTEGER NOT NULL DEFAULT 1,
    mature BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (cell_id, bucket_id)
);

CREATE TABLE anomaly_run (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE cell_visit
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE cell_visit
    ADD FOREIGN KEY (bucket_id) REFERENCES location_bucket (id) ON DELETE CASCADE;

ALTER TABLE anomaly_run
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE user_in_family_circle
    ADD FOREIGN KEY (family_circle_id) REFERENCES family_circle (id) ON DELETE CASCADE;

ALTER TABLE user_in_family_circle
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE location
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE mobile_device
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_notification
    ADD FOREIGN KEY (target_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE risk_notification
    ADD FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_notification_alerts_user
    ADD FOREIGN KEY (tracker_id) REFERENCES "user" (id) ON DELETE CASCADE;

ALTER TABLE tracking_notification_alerts_user
    ADD FOREIGN KEY (notification_id) REFERENCES tracking_notification (id) ON DELETE CASCADE;

CREATE INDEX idx_location_user_time_desc ON location (user_id, "timestamp" DESC);

CREATE INDEX idx_location_geom_spgist ON location USING SPGIST (geom);

CREATE INDEX idx_mobile_device_user ON mobile_device (user_id);

CREATE INDEX idx_tracking_notification_target ON tracking_notification (target_id);

CREATE INDEX idx_risk_notification_user ON risk_notification (user_id);