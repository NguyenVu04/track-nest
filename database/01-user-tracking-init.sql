CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    longitude FLOAT NOT NULL,
    latitude FLOAT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accuracy FLOAT NOT NULL DEFAULT 0,
    velocity FLOAT NOT NULL DEFAULT 0,
    user_id UUID NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED
);

CREATE INDEX CONCURRENTLY idx_location_time_brin ON location USING BRIN (timestamp);

CREATE TABLE mobile_device (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(2) NOT NULL,
    device_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE tracking_notification(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE risk_notification(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE tracking_notification_alerts_user(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_notification_id UUID NOT NULL,
    user_id UUID NOT NULL
);

CREATE TABLE tracking_permission (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    otp VARCHAR(15) NOT NULL,
    create_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

CREATE TABLE tracker_tracks_target (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracker_id UUID NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE tracking_notification_alerts_user
    ADD FOREIGN KEY (tracking_notification_id) REFERENCES tracking_notification(id);