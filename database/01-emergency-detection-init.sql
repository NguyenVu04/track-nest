CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE location (
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL,
    anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    PRIMARY KEY (user_id, "timestamp")
);

SELECT create_hypertable('location', 'timestamp',
                     chunk_time_interval => INTERVAL '1 days',
                     partitioning_column => 'user_id',
                     number_partitions => 64);

CREATE TABLE poi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    radius FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID NOT NULL,
    type_name VARCHAR(15) NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED
);

CREATE TABLE poi_duration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL,
    day_of_week SMALLINT NOT NULL,
    start_at TIME WITH TIME ZONE NOT NULL,
    end_at TIME WITH TIME ZONE NOT NULL
);

CREATE TABLE poi_type (
    name VARCHAR(15) PRIMARY KEY
);

CREATE TABLE poi_type_translation (
    type_name VARCHAR(15) NOT NULL,
    language_code VARCHAR(2) NOT NULL,
    value VARCHAR(100) NOT NULL,
    PRIMARY KEY (type_name, language_code)
);

CREATE TABLE voice_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID NOT NULL
);

ALTER TABLE poi
    ADD FOREIGN KEY (type_name) REFERENCES poi_type(name);

ALTER TABLE poi_duration
    ADD FOREIGN KEY (poi_id) REFERENCES poi(id);

ALTER TABLE poi_type_translation
    ADD FOREIGN KEY (type_name) REFERENCES poi_type(name);

CREATE INDEX idx_poi_geom_gist ON poi USING GIST (geom);

CREATE INDEX idx_location_user_time_desc ON location (user_id, "timestamp" DESC);

CREATE INDEX idx_poi_user ON poi (user_id);

CREATE INDEX idx_voice_record_user ON voice_record (user_id);