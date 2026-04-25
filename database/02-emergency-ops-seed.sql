BEGIN;

------------------------------------------------
-- Emergency services
-- One service per city, coordinates near each user's home location
-- from the user-tracking seed (home_lon, home_lat per user).
------------------------------------------------
INSERT INTO emergency_service (id, username, phone_number, longitude, latitude)
VALUES
    ('6c6ca52f-46b9-472b-8868-86ab2775b187', 'emgser1', '0112345678', 106.7020, 10.7780),  -- Ho Chi Minh City, District 1
    ('2c57e800-b4e2-48ba-b43c-b61075530236', 'emgser2', '0212345678', 105.8550, 21.0295),  -- Hanoi, Hoan Kiem
    ('168d6df2-21ef-4773-8a38-6fad42d527e9', 'emgser3', '0312345678', 108.2218, 16.0482),  -- Da Nang
    ('7ed33501-bcf8-4944-b043-44b328a3a071', 'emgser4', '0412345678', 107.5918, 16.4648),  -- Hue
    ('2077665d-ecaa-44f6-82ee-a721bf7785bd', 'emgser5', '0512345678', 105.7858, 10.0462),  -- Can Tho
    ('0e745cb3-5f38-419b-b446-d204c2e15ba9', 'admin',   '0812345678', 106.6998, 10.7758);  -- Ho Chi Minh City (admin)

------------------------------------------------
-- Emergency request statuses
------------------------------------------------
INSERT INTO emergency_request_status (name)
VALUES ('PENDING'), ('REJECTED'), ('ACCEPTED'), ('CLOSED')
ON CONFLICT (name) DO NOTHING;

INSERT INTO emergency_request_status_translation (language_code, value, status_name)
VALUES
    ('en', 'Pending',      'PENDING'),
    ('vi', 'Đang chờ',     'PENDING'),
    ('en', 'Rejected',     'REJECTED'),
    ('vi', 'Từ chối',      'REJECTED'),
    ('en', 'Accepted',     'ACCEPTED'),
    ('vi', 'Đã chấp nhận', 'ACCEPTED'),
    ('en', 'Closed',       'CLOSED'),
    ('vi', 'Đã đóng',      'CLOSED')
ON CONFLICT (language_code, status_name) DO NOTHING;

------------------------------------------------
-- Safe zones (one per service, near its city)
------------------------------------------------
INSERT INTO safe_zone (id, name, longitude, latitude, radius, created_at, emergency_service_id)
VALUES
    ('a1a11111-1111-1111-1111-111111111111', 'HCMC District 1 Safe Point', 106.7000, 10.7765, 200, NOW(), '6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('a2a22222-2222-2222-2222-222222222222', 'Hanoi Hoan Kiem Shelter',    105.8540, 21.0280, 150, NOW(), '2c57e800-b4e2-48ba-b43c-b61075530236'),
    ('a3a33333-3333-3333-3333-333333333333', 'Da Nang Safe Area',          108.2200, 16.0465, 250, NOW(), '168d6df2-21ef-4773-8a38-6fad42d527e9'),
    ('a4a44444-4444-4444-4444-444444444444', 'Hue Citadel Refuge',         107.5900, 16.4628, 180, NOW(), '7ed33501-bcf8-4944-b043-44b328a3a071'),
    ('a5a55555-5555-5555-5555-555555555555', 'Can Tho Riverside Shelter',  105.7840, 10.0445, 220, NOW(), '2077665d-ecaa-44f6-82ee-a721bf7785bd'),
    ('a6a66666-6666-6666-6666-666666666666', 'Admin Command Shelter',      106.6980, 10.7748, 300, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9');

------------------------------------------------
-- Users tracked by emergency services
-- user_id values match the "user" table in the user-tracking database.
-- The PRIMARY KEY on user_id enforces one service per user.
------------------------------------------------
INSERT INTO emergency_service_tracks_user (user_id, last_longitude, last_latitude, last_update_time, emergency_service_id)
VALUES
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8', 106.7010, 10.7769, '2026-03-04 10:00:00+07', '6c6ca52f-46b9-472b-8868-86ab2775b187'),  -- user1 → emgser1 (HCMC)
    ('8c52c01e-42a7-45cc-9254-db8a7601c764', 105.8542, 21.0285, '2026-03-04 10:01:00+07', '2c57e800-b4e2-48ba-b43c-b61075530236'),  -- user2 → emgser2 (Hanoi)
    ('4405a37d-bc86-403e-b605-bedd7db88d37', 108.2208, 16.0471, '2026-03-04 10:02:00+07', '168d6df2-21ef-4773-8a38-6fad42d527e9'),  -- user3 → emgser3 (Da Nang)
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 107.5909, 16.4637, '2026-03-04 10:03:00+07', '7ed33501-bcf8-4944-b043-44b328a3a071'),  -- user4 → emgser4 (Hue)
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b', 105.7848, 10.0452, '2026-03-04 10:04:00+07', '2077665d-ecaa-44f6-82ee-a721bf7785bd'); -- user5 → emgser5 (Can Tho)

------------------------------------------------
-- Emergency requests
-- Partial unique index on emergency_request(target_id) WHERE status_name IN ('PENDING','ACCEPTED')
-- enforces at most one active request per target at a time.
-- Active targets below: user2 (PENDING), user4 (ACCEPTED), user5 (PENDING) — each appears once.
------------------------------------------------
INSERT INTO emergency_request (id, open_at, close_at, sender_id, target_id, emergency_service_id, status_name, longitude, latitude)
VALUES
    -- PENDING:  user1 reported user2 missing; handled by emgser1 (HCMC)
    ('c1c11111-1111-1111-1111-111111111111', '2026-03-04 09:30:00+07', NULL,                     'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '8c52c01e-42a7-45cc-9254-db8a7601c764', '6c6ca52f-46b9-472b-8868-86ab2775b187', 'PENDING',  106.7012, 10.7770),
    -- CLOSED:   user3 reported user1 missing; resolved by emgser3 (Da Nang)
    ('c2c22222-2222-2222-2222-222222222222', '2026-03-04 09:00:00+07', '2026-03-04 09:20:00+07', '4405a37d-bc86-403e-b605-bedd7db88d37', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '168d6df2-21ef-4773-8a38-6fad42d527e9', 'CLOSED',   108.2208, 16.0471),
    -- ACCEPTED: user2 reported user4 missing; being handled by emgser2 (Hanoi)
    ('c3c33333-3333-3333-3333-333333333333', '2026-03-04 09:40:00+07', NULL,                     '8c52c01e-42a7-45cc-9254-db8a7601c764', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', '2c57e800-b4e2-48ba-b43c-b61075530236', 'ACCEPTED', 105.8542, 21.0285),
    -- REJECTED: user4 reported user3 missing; rejected by emgser4 (Hue)
    ('c4c44444-4444-4444-4444-444444444444', '2026-03-04 08:50:00+07', '2026-03-04 09:00:00+07', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', '4405a37d-bc86-403e-b605-bedd7db88d37', '7ed33501-bcf8-4944-b043-44b328a3a071', 'REJECTED', 107.5909, 16.4637),
    -- CLOSED:   user5 reported user1 missing; resolved by emgser5 (Can Tho)
    ('c5c55555-5555-5555-5555-555555555555', '2026-03-04 08:30:00+07', '2026-03-04 08:50:00+07', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '2077665d-ecaa-44f6-82ee-a721bf7785bd', 'CLOSED',   105.7848, 10.0452),
    -- PENDING:  user1 reported user5 missing; handled by emgser1 (HCMC)
    ('c6c66666-6666-6666-6666-666666666666', '2026-03-04 10:10:00+07', NULL,                     'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '6c6ca52f-46b9-472b-8868-86ab2775b187', 'PENDING',  106.7020, 10.7780),
    -- REJECTED: user2 reported user3 missing; rejected by emgser2 (Hanoi)
    ('c7c77777-7777-7777-7777-777777777777', '2026-03-04 09:55:00+07', '2026-03-04 10:05:00+07', '8c52c01e-42a7-45cc-9254-db8a7601c764', '4405a37d-bc86-403e-b605-bedd7db88d37', '2c57e800-b4e2-48ba-b43c-b61075530236', 'REJECTED', 105.8542, 21.0285),
    -- CLOSED:   user3 reported user1 missing again; resolved by emgser3 (Da Nang)
    ('c8c88888-8888-8888-8888-888888888888', '2026-03-04 10:15:00+07', '2026-03-04 10:30:00+07', '4405a37d-bc86-403e-b605-bedd7db88d37', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '168d6df2-21ef-4773-8a38-6fad42d527e9', 'CLOSED',   108.2218, 16.0482);

COMMIT;
