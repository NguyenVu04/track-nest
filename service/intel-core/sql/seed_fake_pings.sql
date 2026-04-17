-- Seed 28 days of synthetic pings for manual end-to-end testing.
-- Two location clusters (home / office-ish) plus a handful of outlier rows.
-- Replace the UUID below with whatever user you want to exercise.

DO $$
DECLARE
    test_uid  UUID := '00000000-0000-0000-0000-000000000001';
    -- HCMC downtown & a secondary point ~2km away
    home_lat  DOUBLE PRECISION := 10.7769;
    home_lng  DOUBLE PRECISION := 106.7009;
    work_lat  DOUBLE PRECISION := 10.7931;
    work_lng  DOUBLE PRECISION := 106.7120;
BEGIN
    -- Home cluster: nights/weekends (hours 20-23 and 0-7)
    INSERT INTO location_ping
        (user_id, latitude_deg, longitude_deg, accuracy_meter, velocity_mps,
         event_ts, hour_of_day, day_of_week)
    SELECT
        test_uid,
        home_lat + (random() - 0.5) * 0.0008,
        home_lng + (random() - 0.5) * 0.0008,
        12.0,
        0.2 + random() * 0.3,
        gs,
        EXTRACT(HOUR FROM gs)::SMALLINT,
        EXTRACT(DOW  FROM gs)::SMALLINT
    FROM generate_series(
        now() - interval '28 days',
        now(),
        interval '3 minutes'
    ) AS gs
    WHERE EXTRACT(HOUR FROM gs) >= 20 OR EXTRACT(HOUR FROM gs) < 8;

    -- Work cluster: weekday business hours
    INSERT INTO location_ping
        (user_id, latitude_deg, longitude_deg, accuracy_meter, velocity_mps,
         event_ts, hour_of_day, day_of_week)
    SELECT
        test_uid,
        work_lat + (random() - 0.5) * 0.0008,
        work_lng + (random() - 0.5) * 0.0008,
        12.0,
        0.4 + random() * 0.6,
        gs,
        EXTRACT(HOUR FROM gs)::SMALLINT,
        EXTRACT(DOW  FROM gs)::SMALLINT
    FROM generate_series(
        now() - interval '28 days',
        now(),
        interval '3 minutes'
    ) AS gs
    WHERE EXTRACT(HOUR FROM gs) BETWEEN 9 AND 17
      AND EXTRACT(DOW  FROM gs) BETWEEN 1 AND 5;

    -- A dozen far outliers scattered over the window (for training-distribution tail).
    INSERT INTO location_ping
        (user_id, latitude_deg, longitude_deg, accuracy_meter, velocity_mps,
         event_ts, hour_of_day, day_of_week)
    SELECT
        test_uid,
        home_lat + (random() - 0.5) * 0.05,
        home_lng + (random() - 0.5) * 0.05,
        18.0,
        1.5 + random() * 3.0,
        gs,
        EXTRACT(HOUR FROM gs)::SMALLINT,
        EXTRACT(DOW  FROM gs)::SMALLINT
    FROM generate_series(
        now() - interval '21 days',
        now() - interval '2 days',
        interval '42 hours'
    ) AS gs;
END $$;
