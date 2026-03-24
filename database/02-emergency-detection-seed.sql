BEGIN;

INSERT INTO poi_type (name) VALUES
    ('HOME'),
    ('SCHOOL'),
    ('WORK'),
    ('AMUSEMENT'),
    ('RESTAURANT'),
    ('SHOP'),
    ('SPORT')
ON CONFLICT (name) DO NOTHING;

INSERT INTO poi_type_translation (type_name, language_code, value) VALUES
    ('HOME','en','Home'),
    ('HOME','vi','Nhà'),
    ('SCHOOL','en','School'),
    ('SCHOOL','vi','Trường'),
    ('WORK','en','Work'),
    ('WORK','vi','Nơi làm việc'),
    ('AMUSEMENT','en','Amusement'),
    ('AMUSEMENT','vi','Khu vui chơi'),
    ('RESTAURANT','en','Restaurant'),
    ('RESTAURANT','vi','Nhà hàng'),
    ('SHOP','en','Shop'),
    ('SHOP','vi','Cửa hàng'),
    ('SPORT','en','Sport'),
    ('SPORT','vi','Thể thao')
ON CONFLICT (type_name, language_code) DO NOTHING;

INSERT INTO poi (id, name, longitude, latitude, radius, created_at, user_id, type_name) VALUES
    ('a0000000-0000-4000-8000-000000000001','Home - User1', -73.935242, 40.730610, 50.0, NOW() - INTERVAL '120 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'HOME'),
    ('a0000000-0000-4000-8000-000000000002','School - User1', -73.934800, 40.731200, 75.0, NOW() - INTERVAL '115 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'SCHOOL'),
    ('a0000000-0000-4000-8000-000000000003','Work - User2', -0.127758, 51.507351, 60.0, NOW() - INTERVAL '110 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'WORK'),
    ('a0000000-0000-4000-8000-000000000004','Amusement Park - User2', -0.128200, 51.507800, 120.0, NOW() - INTERVAL '105 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'AMUSEMENT'),
    ('a0000000-0000-4000-8000-000000000005','Restaurant - User3', 139.691711, 35.689487, 40.0, NOW() - INTERVAL '100 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', 'RESTAURANT'),
    ('a0000000-0000-4000-8000-000000000006','Shop - User3', 139.692200, 35.689900, 30.0, NOW() - INTERVAL '95 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', 'SHOP'),
    ('a0000000-0000-4000-8000-000000000007','Sport Field - User4', 2.352222, 48.856613, 90.0, NOW() - INTERVAL '90 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'SPORT'),
    ('a0000000-0000-4000-8000-000000000008','Home - User4', 2.353000, 48.857000, 45.0, NOW() - INTERVAL '85 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'HOME'),
    ('a0000000-0000-4000-8000-000000000009','Work - User5', 151.209290, -33.868820, 80.0, NOW() - INTERVAL '80 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'WORK'),
    ('a0000000-0000-4000-8000-00000000000a','Restaurant - User5', 151.210000, -33.869000, 35.0, NOW() - INTERVAL '75 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'RESTAURANT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO location (longitude, latitude, "timestamp", user_id, anomaly) VALUES
    (-73.935242, 40.730610, NOW() - INTERVAL '1 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', FALSE),
    (-73.934900, 40.730900, NOW() - INTERVAL '2 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', FALSE),
    (-73.936000, 40.729800, NOW() - INTERVAL '3 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', TRUE),
    (-73.937100, 40.731200, NOW() - INTERVAL '4 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', FALSE),
    (-73.938000, 40.732000, NOW() - INTERVAL '5 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', FALSE),
    (-0.127758, 51.507351, NOW() - INTERVAL '6 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', FALSE),
    (-0.128500, 51.508000, NOW() - INTERVAL '7 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', TRUE),
    (-0.129000, 51.507700, NOW() - INTERVAL '8 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', FALSE),
    (139.691711, 35.689487, NOW() - INTERVAL '9 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', FALSE),
    (139.692500, 35.689900, NOW() - INTERVAL '10 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', FALSE),
    (2.352222, 48.856613, NOW() - INTERVAL '11 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', FALSE),
    (2.353000, 48.857000, NOW() - INTERVAL '12 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', TRUE),
    (151.209290, -33.868820, NOW() - INTERVAL '13 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
    (151.210000, -33.869000, NOW() - INTERVAL '14 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
    (-73.934500, 40.729800, NOW() - INTERVAL '15 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', FALSE),
    (-73.935800, 40.729200, NOW() - INTERVAL '16 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', TRUE),
    (-0.126800, 51.506900, NOW() - INTERVAL '17 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', FALSE),
    (139.690000, 35.689000, NOW() - INTERVAL '18 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', FALSE),
    (2.354000, 48.858000, NOW() - INTERVAL '19 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', FALSE),
    (151.211000, -33.867500, NOW() - INTERVAL '20 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', TRUE)
ON CONFLICT (user_id, "timestamp") DO NOTHING;

COMMIT;