BEGIN;

INSERT INTO emergency_service (id, longitude, latitude) VALUES
    ('6c6ca52f-46b9-472b-8868-86ab2775b187', -73.935242, 40.730610),
    ('2c57e800-b4e2-48ba-b43c-b61075530236', -0.127758, 51.507351),
    ('168d6df2-21ef-4773-8a38-6fad42d527e9', 139.691711, 35.689487),
    ('0e745cb3-5f38-419b-b446-d204c2e15ba9', 151.209290, -33.868820)
ON CONFLICT (id) DO NOTHING;

INSERT INTO emergency_service_tracks_user (user_id, emergency_service_id) VALUES
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8','6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('dd382dcf-3652-499c-acdb-5d9ce99a67b8','2c57e800-b4e2-48ba-b43c-b61075530236'),
    ('8c52c01e-42a7-45cc-9254-db8a7601c764','6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('8c52c01e-42a7-45cc-9254-db8a7601c764','168d6df2-21ef-4773-8a38-6fad42d527e9'),
    ('4405a37d-bc86-403e-b605-bedd7db88d37','0e745cb3-5f38-419b-b446-d204c2e15ba9'),
    ('4405a37d-bc86-403e-b605-bedd7db88d37','168d6df2-21ef-4773-8a38-6fad42d527e9'),
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','2c57e800-b4e2-48ba-b43c-b61075530236'),
    ('2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','0e745cb3-5f38-419b-b446-d204c2e15ba9'),
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b','6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b','2c57e800-b4e2-48ba-b43c-b61075530236')
ON CONFLICT DO NOTHING;

INSERT INTO emergency_request_status (name) VALUES
    ('PENDING'),('REJECTED'),('ACCEPTED'),('CLOSED')
ON CONFLICT (name) DO NOTHING;

INSERT INTO emergency_request_status_translation (language_code, value, status_name) VALUES
    ('en','Pending','PENDING'),
    ('vi','Đang chờ','PENDING'),
    ('en','Rejected','REJECTED'),
    ('vi','Từ chối','REJECTED'),
    ('en','Accepted','ACCEPTED'),
    ('vi','Đã chấp nhận','ACCEPTED'),
    ('en','Closed','CLOSED'),
    ('vi','Đã đóng','CLOSED')
ON CONFLICT (language_code, status_name) DO NOTHING;

INSERT INTO emergency_request (id, open_at, close_at, sender_id, target_id, emergency_service_id, status_name) VALUES
    ('10000000-0000-4000-8000-000000000001', NOW() - INTERVAL '60 minutes', NULL, 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '8c52c01e-42a7-45cc-9254-db8a7601c764', '6c6ca52f-46b9-472b-8868-86ab2775b187', 'PENDING'),
    ('10000000-0000-4000-8000-000000000002', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '40 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '2c57e800-b4e2-48ba-b43c-b61075530236', 'ACCEPTED'),
    ('10000000-0000-4000-8000-000000000003', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '30 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', '168d6df2-21ef-4773-8a38-6fad42d527e9', 'CLOSED'),
    ('10000000-0000-4000-8000-000000000004', NOW() - INTERVAL '45 minutes', NULL, '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', '4405a37d-bc86-403e-b605-bedd7db88d37', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'PENDING'),
    ('10000000-0000-4000-8000-000000000005', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '10 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '6c6ca52f-46b9-472b-8868-86ab2775b187', 'REJECTED'),
    ('10000000-0000-4000-8000-000000000006', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '5 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '4405a37d-bc86-403e-b605-bedd7db88d37', '168d6df2-21ef-4773-8a38-6fad42d527e9', 'CLOSED'),
    ('10000000-0000-4000-8000-000000000007', NOW() - INTERVAL '30 minutes', NULL, '8c52c01e-42a7-45cc-9254-db8a7601c764', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '2c57e800-b4e2-48ba-b43c-b61075530236', 'PENDING'),
    ('10000000-0000-4000-8000-000000000008', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '2 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', '8c52c01e-42a7-45cc-9254-db8a7601c764', '0e745cb3-5f38-419b-b446-d204c2e15ba9', 'ACCEPTED'),
    ('10000000-0000-4000-8000-000000000009', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '1 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '6c6ca52f-46b9-472b-8868-86ab2775b187', 'REJECTED'),
    ('10000000-0000-4000-8000-000000000010', NOW() - INTERVAL '15 minutes', NULL, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', '168d6df2-21ef-4773-8a38-6fad42d527e9', 'PENDING')
ON CONFLICT (id) DO NOTHING;

INSERT INTO safe_zone (id, name, longitude, latitude, radius, created_at, emergency_service_id) VALUES
    ('20000000-0000-4000-8000-000000000001','Safe Zone 1', -73.935500, 40.731000, 500.0, NOW() - INTERVAL '120 minutes', '6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('20000000-0000-4000-8000-000000000002','Safe Zone 2', -73.934000, 40.729500, 300.0, NOW() - INTERVAL '115 minutes', '6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('20000000-0000-4000-8000-000000000003','Safe Zone 3', -0.128000, 51.507800, 400.0, NOW() - INTERVAL '110 minutes', '2c57e800-b4e2-48ba-b43c-b61075530236'),
    ('20000000-0000-4000-8000-000000000004','Safe Zone 4', -0.126500, 51.506900, 250.0, NOW() - INTERVAL '105 minutes', '2c57e800-b4e2-48ba-b43c-b61075530236'),
    ('20000000-0000-4000-8000-000000000005','Safe Zone 5', 139.692000, 35.690000, 600.0, NOW() - INTERVAL '100 minutes', '168d6df2-21ef-4773-8a38-6fad42d527e9'),
    ('20000000-0000-4000-8000-000000000006','Safe Zone 6', 139.690000, 35.689000, 350.0, NOW() - INTERVAL '95 minutes', '168d6df2-21ef-4773-8a38-6fad42d527e9'),
    ('20000000-0000-4000-8000-000000000007','Safe Zone 7', 151.209000, -33.869000, 450.0, NOW() - INTERVAL '90 minutes', '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
    ('20000000-0000-4000-8000-000000000008','Safe Zone 8', 151.210500, -33.868500, 200.0, NOW() - INTERVAL '85 minutes', '0e745cb3-5f38-419b-b446-d204c2e15ba9'),
    ('20000000-0000-4000-8000-000000000009','Safe Zone 9', -73.936000, 40.732000, 150.0, NOW() - INTERVAL '80 minutes', '6c6ca52f-46b9-472b-8868-86ab2775b187'),
    ('20000000-0000-4000-8000-000000000010','Safe Zone 10', -0.129500, 51.508500, 275.0, NOW() - INTERVAL '75 minutes', '2c57e800-b4e2-48ba-b43c-b61075530236')
ON CONFLICT (id) DO NOTHING;

COMMIT;