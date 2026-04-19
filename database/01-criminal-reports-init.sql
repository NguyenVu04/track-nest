CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE reporter (
    id UUID PRIMARY KEY
);

CREATE TABLE missing_person_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    personal_id VARCHAR(50) NOT NULL,
    photo TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    status_name VARCHAR(15) NOT NULL
);

CREATE TABLE missing_person_report_status (
    name VARCHAR(15) PRIMARY KEY
);

CREATE TABLE missing_person_report_status_translation (
    status_name VARCHAR(15) NOT NULL,
    language_code VARCHAR(2) NOT NULL,
    value VARCHAR(100) NOT NULL,
    PRIMARY KEY (status_name, language_code)
);

CREATE TABLE guidelines_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    abstract VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reporter_id UUID NOT NULL,
    public BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE crime_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    severity INTEGER NOT NULL,
    number_of_victims INTEGER NOT NULL,
    number_of_offenders INTEGER NOT NULL,
    arrested BOOLEAN NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reporter_id UUID NOT NULL,
    public BOOLEAN NOT NULL DEFAULT FALSE,
    geom geometry(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)) STORED,
    CHECK (severity >= 1 AND severity <= 5),
    CHECK ( longitude >= -180 AND longitude <= 180 ),
    CHECK ( latitude >= -90 AND latitude <= 90),
    CHECK ( number_of_victims >= 0),
    CHECK ( number_of_offenders >= 0)
);

ALTER TABLE missing_person_report
    ADD FOREIGN KEY (status_name) REFERENCES missing_person_report_status(name);

ALTER TABLE missing_person_report_status_translation
    ADD FOREIGN KEY (status_name) REFERENCES missing_person_report_status(name) ON DELETE CASCADE;

ALTER TABLE crime_report
    ADD FOREIGN KEY (reporter_id) REFERENCES reporter(id);

ALTER TABLE missing_person_report
    ADD FOREIGN KEY (reporter_id) REFERENCES reporter(id);

ALTER TABLE guidelines_document
    ADD FOREIGN KEY (reporter_id) REFERENCES reporter(id);

CREATE INDEX idx_crime_report_geom_spgist ON crime_report USING SPGIST (geom);
