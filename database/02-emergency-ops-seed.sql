BEGIN;

INSERT INTO emergency_service (id, longitude, latitude) VALUES
    ('0e745cb3-5f38-419b-b446-d204c2e15ba9', 106.7000, 10.7700);

INSERT INTO emergency_request_status (name) VALUES
                                                ('PENDING'),
                                                ('REJECTED'),
                                                ('ACCEPTED'),
                                                ('CLOSED');

INSERT INTO emergency_request_status_translation (language_code, value, status_name) VALUES
-- English
('en', 'Pending', 'PENDING'),
('en', 'Rejected', 'REJECTED'),
('en', 'Accepted', 'ACCEPTED'),
('en', 'Closed', 'CLOSED'),
-- Vietnamese
('vi', 'Đang chờ', 'PENDING'),
('vi', 'Bị từ chối', 'REJECTED'),
('vi', 'Đã chấp nhận', 'ACCEPTED'),
('vi', 'Đã đóng', 'CLOSED');

INSERT INTO safe_zone (id, name, longitude, latitude, radius, created_at, emergency_service_id) VALUES
                                                                                                    ('20000000-0000-4000-8000-000000000001', 'Safe Zone 1', 106.6990, 10.7690, 50.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000002', 'Safe Zone 2', 106.7005, 10.7705, 75.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000003', 'Safe Zone 3', 106.7010, 10.7710, 100.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000004', 'Safe Zone 4', 106.7015, 10.7715, 150.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000005', 'Safe Zone 5', 106.7020, 10.7720, 200.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000006', 'Safe Zone 6', 106.7025, 10.7725, 120.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000007', 'Safe Zone 7', 106.7030, 10.7730, 80.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000008', 'Safe Zone 8', 106.7035, 10.7735, 60.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-000000000009', 'Safe Zone 9', 106.7040, 10.7740, 90.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
                                                                                                    ('20000000-0000-4000-8000-00000000000a', 'Safe Zone 10', 106.7045, 10.7745, 110.0, NOW(), '0e745cb3-5f38-419b-b446-d204c2e15ba9');

INSERT INTO emergency_request (id, open_at, close_at, sender_id, target_id, emergency_service_id, status_name) VALUES
                                                                                                                   ('10000000-0000-4000-8000-000000000001', NOW(), NULL, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'PENDING'),
                                                                                                                   ('10000000-0000-4000-8000-000000000002', NOW(), NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'ACCEPTED'),
                                                                                                                   ('10000000-0000-4000-8000-000000000003', NOW(), NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'CLOSED'),
                                                                                                                   ('10000000-0000-4000-8000-000000000004', NOW(), NULL, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'REJECTED'),
                                                                                                                   ('10000000-0000-4000-8000-000000000005', NOW(), NULL, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'PENDING'),
                                                                                                                   ('10000000-0000-4000-8000-000000000006', NOW(), NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'ACCEPTED'),
                                                                                                                   ('10000000-0000-4000-8000-000000000007', NOW(), NULL, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'REJECTED'),
                                                                                                                   ('10000000-0000-4000-8000-000000000008', NOW(), NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'CLOSED'),
                                                                                                                   ('10000000-0000-4000-8000-000000000009', NOW(), NULL, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'PENDING'),
                                                                                                                   ('10000000-0000-4000-8000-00000000000a', NOW(), NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'ACCEPTED');

INSERT INTO emergency_service_tracks_user (emergency_service_id, user_id) VALUES
    ('0e745cb3-5f38-419b-b446-d204c2e15ba9', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

COMMIT;