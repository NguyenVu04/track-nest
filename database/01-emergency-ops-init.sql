CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE emergency_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    open_at TIMESTAMP WITH TIME ZONE NOT NULL,
    close_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sender_id UUID NOT NULL,
    target_id UUID NOT NULL,
    emergency_service_id UUID NOT NULL,
    status_name VARCHAR(15) NOT NULL
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
    latitude FLOAT NOT NULL,
    radius FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    emergency_service_id UUID NOT NULL,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED
);

ALTER TABLE emergency_request
    ADD FOREIGN KEY (status_name) REFERENCES emergency_request_status(name);

ALTER TABLE emergency_request_status_translation
    ADD FOREIGN KEY (status_name) REFERENCES emergency_request_status(name);