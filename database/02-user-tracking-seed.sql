BEGIN;
INSERT INTO "user" (id, connected) VALUES
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8', TRUE),
    ('8c52c01e-42a7-45cc-9254-db8a7601c764', TRUE),
    ('4405a37d-bc86-403e-b605-bedd7db88d37', FALSE),
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', TRUE),
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO location (longitude, latitude, "timestamp", accuracy, velocity, user_id) VALUES
    (-73.935242, 40.730610, NOW() - INTERVAL '1 minutes', 5.0, 0.5, 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    (-73.934000, 40.731000, NOW() - INTERVAL '2 minutes', 6.0, 0.7, 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    (-73.936500, 40.729500, NOW() - INTERVAL '3 minutes', 4.5, 0.2, 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    (-73.937000, 40.730000, NOW() - INTERVAL '4 minutes', 5.5, 0.1, 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    (-0.127758, 51.507351, NOW() - INTERVAL '5 minutes', 8.0, 1.2, '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    (-0.128500, 51.508000, NOW() - INTERVAL '6 minutes', 7.5, 0.9, '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    (-0.129000, 51.506500, NOW() - INTERVAL '7 minutes', 6.5, 0.3, '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    (-0.130000, 51.507900, NOW() - INTERVAL '8 minutes', 9.0, 0.0, '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    (139.691711, 35.689487, NOW() - INTERVAL '9 minutes', 3.0, 2.0, '4405a37d-bc86-403e-b605-bedd7db88d37'),
    (139.692500, 35.689900, NOW() - INTERVAL '10 minutes', 3.5, 1.8, '4405a37d-bc86-403e-b605-bedd7db88d37'),
    (139.690200, 35.688800, NOW() - INTERVAL '11 minutes', 4.0, 0.4, '4405a37d-bc86-403e-b605-bedd7db88d37'),
    (139.693000, 35.690500, NOW() - INTERVAL '12 minutes', 5.0, 0.6, '4405a37d-bc86-403e-b605-bedd7db88d37'),
    (2.352222, 48.856613, NOW() - INTERVAL '13 minutes', 6.0, 0.9, '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    (2.353000, 48.857000, NOW() - INTERVAL '14 minutes', 5.8, 0.7, '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    (2.351000, 48.856000, NOW() - INTERVAL '15 minutes', 7.0, 0.2, '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    (2.354000, 48.856500, NOW() - INTERVAL '16 minutes', 6.5, 0.0, '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    (151.209290, -33.868820, NOW() - INTERVAL '17 minutes', 10.0, 0.1, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    (151.210000, -33.869000, NOW() - INTERVAL '18 minutes', 9.5, 0.3, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    (151.208500, -33.868000, NOW() - INTERVAL '19 minutes', 8.0, 0.2, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    (151.211000, -33.869500, NOW() - INTERVAL '20 minutes', 7.5, 0.0, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

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

INSERT INTO tracking_notification (id, type, title, content, created_at, user_id) VALUES
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

INSERT INTO tracking_notification_alerts_user (tracking_notification_id, user_id) VALUES
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

INSERT INTO tracking_permission (id, otp, create_at, user_id) VALUES
    ('dddddddd-2000-4000-8000-dddddddddddd','OTP0001', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('dddddddd-2001-4000-8000-dddddddddddd','OTP0002', NOW(), 'dd382dcf-3652-499c-acdb-5d9ce99a67b8'),
    ('dddddddd-2002-4000-8000-dddddddddddd','OTP0003', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('dddddddd-2003-4000-8000-dddddddddddd','OTP0004', NOW(), '8c52c01e-42a7-45cc-9254-db8a7601c764'),
    ('dddddddd-2004-4000-8000-dddddddddddd','OTP0005', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('dddddddd-2005-4000-8000-dddddddddddd','OTP0006', NOW(), '4405a37d-bc86-403e-b605-bedd7db88d37'),
    ('dddddddd-2006-4000-8000-dddddddddddd','OTP0007', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('dddddddd-2007-4000-8000-dddddddddddd','OTP0008', NOW(), '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5'),
    ('dddddddd-2008-4000-8000-dddddddddddd','OTP0009', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
    ('dddddddd-2009-4000-8000-dddddddddddd','OTP0010', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tracker_tracks_target (tracker_id, target_id, created_at) VALUES
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8','8c52c01e-42a7-45cc-9254-db8a7601c764', NOW()),
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8','4405a37d-bc86-403e-b605-bedd7db88d37', NOW()),
    ('8c52c01e-42a7-45cc-9254-db8a7601c764','dd382dcf-3652-499c-acdb-5d9ce99a67b8', NOW()),
    ('8c52c01e-42a7-45cc-9254-db8a7601c764','f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
    ('4405a37d-bc86-403e-b605-bedd7db88d37','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', NOW()),
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','4405a37d-bc86-403e-b605-bedd7db88d37', NOW()),
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b','dd382dcf-3652-499c-acdb-5d9ce99a67b8', NOW()),
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b','8c52c01e-42a7-45cc-9254-db8a7601c764', NOW()),
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
    ('4405a37d-bc86-403e-b605-bedd7db88d37','dd382dcf-3652-499c-acdb-5d9ce99a67b8', NOW())
ON CONFLICT DO NOTHING;

COMMIT;