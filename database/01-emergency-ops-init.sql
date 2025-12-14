CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE emergency_service (
    id UUID PRIMARY KEY,
    longitude FLOAT NOT NULL,
    latitude FLOAT NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    CHECK ( longitude >= -180 AND longitude <= 180 ),
    CHECK ( latitude >= -90 AND latitude <= 90 )
);

CREATE TABLE emergency_service_tracks_user (
    user_id UUID PRIMARY KEY,
    emergency_service_id UUID NOT NULL
);

CREATE TABLE emergency_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    open_at TIMESTAMP WITH TIME ZONE NOT NULL,
    close_at TIMESTAMP WITH TIME ZONE,
    sender_id UUID NOT NULL,
    target_id UUID NOT NULL,
    emergency_service_id UUID NOT NULL,
    status_name VARCHAR(15) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    CHECK ( longitude >= -180 AND longitude <= 180 ),
    CHECK ( latitude >= -90 AND latitude <= 90 )
);

CREATE TABLE emergency_request_status (
    name VARCHAR(15) PRIMARY KEY
);

CREATE TABLE emergency_request_status_translation (
    language_code VARCHAR(2) NOT NULL,
    value VARCHAR(100) NOT NULL,
    status_name VARCHAR(15) NOT NULL,
    PRIMARY KEY (language_code, status_name)
);

CREATE TABLE safe_zone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    longitude FLOAT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    radius DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    emergency_service_id UUID NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    CHECK ( longitude >= -180 AND longitude <= 180 AND latitude >= -90 AND latitude <= 90 )
);

ALTER TABLE emergency_service_tracks_user
    ADD FOREIGN KEY (emergency_service_id) REFERENCES emergency_service (id) ON DELETE CASCADE;

ALTER TABLE emergency_request
    ADD FOREIGN KEY (status_name) REFERENCES emergency_request_status (name);

ALTER TABLE emergency_request
    ADD FOREIGN KEY (emergency_service_id) REFERENCES emergency_service (id) ON DELETE CASCADE;

ALTER TABLE emergency_request_status_translation
    ADD FOREIGN KEY (status_name) REFERENCES emergency_request_status (name) ON DELETE CASCADE;

ALTER TABLE safe_zone
    ADD FOREIGN KEY (emergency_service_id) REFERENCES emergency_service (id) ON DELETE CASCADE;

CREATE INDEX idx_emergency_service_spglist ON emergency_service USING GIST (geom);

CREATE INDEX idx_safe_zone_geom_spgist ON safe_zone USING SPGIST (geom);

CREATE INDEX idx_emergency_request_geom_spgist ON emergency_request USING SPGIST (geom);

CREATE INDEX idx_emergency_request_user_time_desc ON emergency_request (emergency_service_id, open_at DESC);