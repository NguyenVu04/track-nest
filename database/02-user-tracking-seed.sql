BEGIN;
INSERT INTO "user" (id, username, connected) VALUES
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'user1', TRUE),
    ('8c52c01e-42a7-45cc-9254-db8a7601c764', 'user2', TRUE),
    ('4405a37d-bc86-403e-b605-bedd7db88d37', 'user3', FALSE),
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'user4', TRUE),
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'admin', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Generate one week of location samples per user at 3-minute intervals (3360 points/user).
-- Simulates a daily home/work/commute pattern so the anomaly pipeline has usable buckets.
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN
        SELECT * FROM (VALUES
            ('dd382dcf-3652-499c-acdb-5d9ce99a67b8'::uuid, 106.700981, 10.776889),  -- Ho Chi Minh City, District 1
            ('8c52c01e-42a7-45cc-9254-db8a7601c764'::uuid, 105.854167, 21.028511),  -- Hanoi, Hoan Kiem
            ('4405a37d-bc86-403e-b605-bedd7db88d37'::uuid, 108.220833, 16.047079),  -- Da Nang
            ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'::uuid, 107.590866, 16.463713),  -- Hue
            ('f8f735b4-549c-4d8c-9e10-15f8c198b71b'::uuid, 105.784817, 10.045162)   -- Can Tho
        ) AS t(user_id, home_lon, home_lat)
    LOOP
        INSERT INTO location (longitude, latitude, "timestamp", accuracy, velocity, user_id)
        SELECT
            CASE
                WHEN h >= 8  AND h < 17 THEN u.home_lon + 0.020 + (random() - 0.5) * 0.002
                WHEN h >= 20 OR  h < 7  THEN u.home_lon         + (random() - 0.5) * 0.002
                ELSE                         u.home_lon + 0.020 * random() + (random() - 0.5) * 0.002
            END,
            CASE
                WHEN h >= 8  AND h < 17 THEN u.home_lat + 0.015 + (random() - 0.5) * 0.002
                WHEN h >= 20 OR  h < 7  THEN u.home_lat         + (random() - 0.5) * 0.002
                ELSE                         u.home_lat + 0.015 * random() + (random() - 0.5) * 0.002
            END,
            ts,
            3.0 + random() * 10,
            CASE
                WHEN (h = 7 OR h = 17 OR h = 18 OR h = 19) THEN 5.0 + random() * 10
                ELSE random() * 2
            END,
            u.user_id
        FROM (
            SELECT
                NOW() - (i * INTERVAL '3 minutes') AS ts,
                EXTRACT(HOUR FROM NOW() - (i * INTERVAL '3 minutes'))::INT AS h
            FROM generate_series(1, 3360) AS i
        ) s
        ON CONFLICT (user_id, "timestamp") DO NOTHING;
    END LOOP;
END $$;

INSERT INTO mobile_device (id, language_code, device_token, created_at, user_id) VALUES
    ('11111111-1111-4111-8111-111111111111', 'en', 'token-user1-1', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('22222222-2222-4222-8222-222222222222', 'vi', 'token-user1-2', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('33333333-3333-4333-8333-333333333333', 'en', 'token-user2-1', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('44444444-4444-4444-8444-444444444444', 'vi', 'token-user2-2', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('55555555-5555-4555-8555-555555555555', 'en', 'token-user3-1', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('66666666-6666-4666-8666-666666666666', 'vi', 'token-user3-2', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('77777777-7777-4777-8777-777777777777', 'en', 'token-user4-1', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('88888888-8888-4888-8888-888888888888', 'vi', 'token-user4-2', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('99999999-9999-4999-8999-999999999999', 'en', 'token-user5-1', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'vi', 'token-user5-2', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tracking_notification (id, type, title, content, created_at, target_id) VALUES
    ('bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb', 'info', 'Track A', 'Content A', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('bbbbbbbb-0001-4000-8000-bbbbbbbbbbbb', 'alert', 'Track B', 'Content B', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('bbbbbbbb-0002-4000-8000-bbbbbbbbbbbb', 'info', 'Track C', 'Content C', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('bbbbbbbb-0003-4000-8000-bbbbbbbbbbbb', 'alert', 'Track D', 'Content D', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('bbbbbbbb-0004-4000-8000-bbbbbbbbbbbb', 'info', 'Track E', 'Content E', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('bbbbbbbb-0005-4000-8000-bbbbbbbbbbbb', 'alert', 'Track F', 'Content F', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('bbbbbbbb-0006-4000-8000-bbbbbbbbbbbb', 'info', 'Track G', 'Content G', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('bbbbbbbb-0007-4000-8000-bbbbbbbbbbbb', 'alert', 'Track H', 'Content H', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('bbbbbbbb-0008-4000-8000-bbbbbbbbbbbb', 'info', 'Track I', 'Content I', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    ('bbbbbbbb-0009-4000-8000-bbbbbbbbbbbb', 'alert', 'Track J', 'Content J', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO risk_notification (id, type, title, content, created_at, user_id) VALUES
    ('cccccccc-1000-4000-8000-cccccccccccc', 'risk', 'Risk A', 'Risk content A', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('cccccccc-1001-4000-8000-cccccccccccc', 'risk', 'Risk B', 'Risk content B', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('cccccccc-1002-4000-8000-cccccccccccc', 'risk', 'Risk C', 'Risk content C', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('cccccccc-1003-4000-8000-cccccccccccc', 'risk', 'Risk D', 'Risk content D', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('cccccccc-1004-4000-8000-cccccccccccc', 'risk', 'Risk E', 'Risk content E', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('cccccccc-1005-4000-8000-cccccccccccc', 'risk', 'Risk F', 'Risk content F', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('cccccccc-1006-4000-8000-cccccccccccc', 'risk', 'Risk G', 'Risk content G', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('cccccccc-1007-4000-8000-cccccccccccc', 'risk', 'Risk H', 'Risk content H', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('cccccccc-1008-4000-8000-cccccccccccc', 'risk', 'Risk I', 'Risk content I', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    ('cccccccc-1009-4000-8000-cccccccccccc', 'risk', 'Risk J', 'Risk content J', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tracking_notification_alerts_user (notification_id, tracker_id) VALUES
    ('bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb','8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('bbbbbbbb-0001-4000-8000-bbbbbbbbbbbb','4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('bbbbbbbb-0002-4000-8000-bbbbbbbbbbbb','dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('bbbbbbbb-0003-4000-8000-bbbbbbbbbbbb','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('bbbbbbbb-0004-4000-8000-bbbbbbbbbbbb','f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    ('bbbbbbbb-0005-4000-8000-bbbbbbbbbbbb','8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('bbbbbbbb-0006-4000-8000-bbbbbbbbbbbb','4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('bbbbbbbb-0007-4000-8000-bbbbbbbbbbbb','dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('bbbbbbbb-0008-4000-8000-bbbbbbbbbbbb','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('bbbbbbbb-0009-4000-8000-bbbbbbbbbbbb','f8f735b4-549c-4d8c-9e10-15f8c198b71b')
ON CONFLICT DO NOTHING;

INSERT INTO family_circle (id, name, created_at) VALUES
    ('cccccccc-1000-4000-8000-cccccccccccc', 'Family Circle 1', NOW()),
    ('cccccccc-1001-4000-8000-cccccccccccc', 'Family Circle 2', NOW()),
    ('cccccccc-1002-4000-8000-cccccccccccc', 'Family Circle 3', NOW()),
    ('cccccccc-1003-4000-8000-cccccccccccc', 'Family Circle 4', NOW()),
    ('cccccccc-1004-4000-8000-cccccccccccc', 'Admin Circle', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_in_family_circle (family_circle_id, user_id, role, admin) VALUES
    ('cccccccc-1000-4000-8000-cccccccccccc', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'Child', FALSE),
    ('cccccccc-1000-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Child', FALSE),
    ('cccccccc-1000-4000-8000-cccccccccccc', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'Mother', TRUE),
    ('cccccccc-1001-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Child', FALSE),
    ('cccccccc-1001-4000-8000-cccccccccccc', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'Father', TRUE),
    ('cccccccc-1002-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Child', FALSE),
    ('cccccccc-1002-4000-8000-cccccccccccc', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'Father', TRUE),
    ('cccccccc-1003-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Child', FALSE),
    ('cccccccc-1003-4000-8000-cccccccccccc', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'Mother', TRUE),
    ('cccccccc-1004-4000-8000-cccccccccccc', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'Child', FALSE),
    ('cccccccc-1004-4000-8000-cccccccccccc', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'Mother', TRUE)
ON CONFLICT DO NOTHING;

-- location_bucket: one row per (user, day_of_week, hour_of_day) derived from location data.
INSERT INTO location_bucket (user_id, day_of_week, hour_of_day, total_num_visits, created_at)
SELECT
    user_id,
    EXTRACT(DOW  FROM "timestamp")::SMALLINT,
    EXTRACT(HOUR FROM "timestamp")::SMALLINT,
    COUNT(*)::INTEGER,
    MIN("timestamp")
FROM location
GROUP BY user_id, EXTRACT(DOW FROM "timestamp"), EXTRACT(HOUR FROM "timestamp")
ON CONFLICT (user_id, day_of_week, hour_of_day) DO NOTHING;

-- cell_visit: aggregate location points into H3 resolution-9 cells (~174m edge) per bucket.
INSERT INTO cell_visit (user_id, cell_id, bucket_id, first_seen, last_seen, num_visits, mature)
SELECT
    l.user_id,
    h3_lat_lng_to_cell(POINT(l.longitude, l.latitude), 8)::text,
    b.id,
    MIN(l."timestamp"),
    MAX(l."timestamp"),
    COUNT(*)::INTEGER,
    COUNT(*) >= 5
FROM location l
JOIN location_bucket b
    ON b.user_id     = l.user_id
   AND b.day_of_week = EXTRACT(DOW  FROM l."timestamp")::SMALLINT
   AND b.hour_of_day = EXTRACT(HOUR FROM l."timestamp")::SMALLINT
GROUP BY l.user_id, h3_lat_lng_to_cell(POINT(l.longitude, l.latitude), 8), b.id
ON CONFLICT (cell_id, bucket_id) DO NOTHING;

-- anomaly_run: a couple of historical (resolved) and active (unresolved) runs per user.
INSERT INTO anomaly_run (id, user_id, started_at, resolved, last_seen_at) VALUES
    ('dddddddd-0000-4000-8000-dddddddddddd', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', NOW() - INTERVAL '3 days',  TRUE,  NOW() - INTERVAL '3 days' + INTERVAL '45 minutes'),
    ('dddddddd-0001-4000-8000-dddddddddddd', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', NOW() - INTERVAL '2 hours', FALSE, NOW() - INTERVAL '10 minutes'),
    ('dddddddd-0002-4000-8000-dddddddddddd', '8c52c01e-42a7-45cc-9254-db8a7601c764', NOW() - INTERVAL '5 days',  TRUE,  NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
    ('dddddddd-0003-4000-8000-dddddddddddd', '8c52c01e-42a7-45cc-9254-db8a7601c764', NOW() - INTERVAL '30 minutes', FALSE, NOW() - INTERVAL '5 minutes'),
    ('dddddddd-0004-4000-8000-dddddddddddd', '4405a37d-bc86-403e-b605-bedd7db88d37', NOW() - INTERVAL '6 days',  TRUE,  NOW() - INTERVAL '6 days' + INTERVAL '20 minutes'),
    ('dddddddd-0005-4000-8000-dddddddddddd', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', NOW() - INTERVAL '1 day',   TRUE,  NOW() - INTERVAL '1 day'  + INTERVAL '2 hours'),
    ('dddddddd-0006-4000-8000-dddddddddddd', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', NOW() - INTERVAL '15 minutes', FALSE, NOW() - INTERVAL '2 minutes'),
    ('dddddddd-0007-4000-8000-dddddddddddd', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW() - INTERVAL '4 days',  TRUE,  NOW() - INTERVAL '4 days' + INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- Family messages
------------------------------------------------
INSERT INTO family_message (id, family_circle_id, sender_id, content, created_at)
VALUES
    ('eeeeeeee-1000-4000-8000-eeeeeeeeeeee', 'cccccccc-1000-4000-8000-cccccccccccc', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'Everyone please check in when you get home tonight.', NOW() - INTERVAL '5 days'),
    ('eeeeeeee-1001-4000-8000-eeeeeeeeeeee', 'cccccccc-1000-4000-8000-cccccccccccc', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'I am home, just arrived.', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes'),
    ('eeeeeeee-1002-4000-8000-eeeeeeeeeeee', 'cccccccc-1000-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'On my way back, will be there in 20 minutes.', NOW() - INTERVAL '5 days' + INTERVAL '45 minutes'),
    ('eeeeeeee-1003-4000-8000-eeeeeeeeeeee', 'cccccccc-1000-4000-8000-cccccccccccc', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'Good, stay safe.', NOW() - INTERVAL '5 days' + INTERVAL '50 minutes'),
    ('eeeeeeee-1004-4000-8000-eeeeeeeeeeee', 'cccccccc-1001-4000-8000-cccccccccccc', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'Dinner is ready, where are you?', NOW() - INTERVAL '3 days'),
    ('eeeeeeee-1005-4000-8000-eeeeeeeeeeee', 'cccccccc-1001-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Still at school, finishing up a project.', NOW() - INTERVAL '3 days' + INTERVAL '10 minutes'),
    ('eeeeeeee-1006-4000-8000-eeeeeeeeeeee', 'cccccccc-1001-4000-8000-cccccccccccc', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'Ok, come back by 7 PM.', NOW() - INTERVAL '3 days' + INTERVAL '12 minutes'),
    ('eeeeeeee-1007-4000-8000-eeeeeeeeeeee', 'cccccccc-1002-4000-8000-cccccccccccc', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'I got an alert that you left the safe zone. Are you okay?', NOW() - INTERVAL '2 hours'),
    ('eeeeeeee-1008-4000-8000-eeeeeeeeeeee', 'cccccccc-1002-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Yes, I am fine. Just went to the convenience store nearby.', NOW() - INTERVAL '2 hours' + INTERVAL '5 minutes'),
    ('eeeeeeee-1009-4000-8000-eeeeeeeeeeee', 'cccccccc-1002-4000-8000-cccccccccccc', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'Alright, please let me know when you are back.', NOW() - INTERVAL '2 hours' + INTERVAL '7 minutes'),
    ('eeeeeeee-100a-4000-8000-eeeeeeeeeeee', 'cccccccc-1003-4000-8000-cccccccccccc', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'Family meeting this Sunday at 10 AM, do not forget.', NOW() - INTERVAL '1 day'),
    ('eeeeeeee-100b-4000-8000-eeeeeeeeeeee', 'cccccccc-1003-4000-8000-cccccccccccc', '4405a37d-bc86-403e-b605-bedd7db88d37', 'Got it, I will be there.', NOW() - INTERVAL '1 day' + INTERVAL '20 minutes'),
    ('eeeeeeee-100c-4000-8000-eeeeeeeeeeee', 'cccccccc-1004-4000-8000-cccccccccccc', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'SOS drill scheduled for tomorrow morning, please participate.', NOW() - INTERVAL '12 hours'),
    ('eeeeeeee-100d-4000-8000-eeeeeeeeeeee', 'cccccccc-1004-4000-8000-cccccccccccc', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'Understood, I will be ready.', NOW() - INTERVAL '12 hours' + INTERVAL '15 minutes'),
    ('eeeeeeee-100e-4000-8000-eeeeeeeeeeee', 'cccccccc-1004-4000-8000-cccccccccccc', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'Great, stay alert everyone.', NOW() - INTERVAL '12 hours' + INTERVAL '18 minutes')
ON CONFLICT (id) DO NOTHING;

COMMIT;