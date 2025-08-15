CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE Language(
    codename VARCHAR(2) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE POIType(
    codename VARCHAR(15) PRIMARY KEY
);

CREATE TABLE POITypeTranslation(
    poi VARCHAR(15) NOT NULL,
    language VARCHAR(2) NOT NULL,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY (poi, language)
);

CREATE TABLE UserLocation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL,
    location GEOMETRY(Point, 4326),
    isPOI BOOLEAN NOT NULL DEFAULT FALSE,
    poiType VARCHAR(15),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE UserPOI (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID NOT NULL,
    poi GEOMETRY(Polygon, 4326) NOT NULL,
    name VARCHAR(255) NOT NULL,
    poiType VARCHAR(15) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE GuardianTarget (
    guardianId UUID NOT NULL,
    targetId UUID NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (guardianId, targetId),
    CONSTRAINT guardian_not_self CHECK (guardianId <> targetId)
);

CREATE TABLE TargetOTP (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    targetId UUID NOT NULL,
    username VARCHAR(255) NOT NULL,
    otp CHAR(8) NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE POITypeTranslation
    ADD CONSTRAINT fk_poitypetranslation_poi FOREIGN KEY (poi) REFERENCES POIType(codename),
    ADD CONSTRAINT fk_poitypetranslation_language FOREIGN KEY (language) REFERENCES Language(codename);

ALTER TABLE UserPOI
    ADD CONSTRAINT fk_userpoi_poitype FOREIGN KEY (poiType) REFERENCES POIType(codename);

ALTER TABLE UserLocation
    ADD CONSTRAINT fk_userlocation_poitype FOREIGN KEY (poiType) REFERENCES POIType(codename);