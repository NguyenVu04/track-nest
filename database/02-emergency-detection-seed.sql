BEGIN;
INSERT INTO poi_type (name) VALUES
                                ('SCHOOL'),
                                ('WORK'),
                                ('SHOP'),
                                ('RESTAURANT'),
                                ('HOME'),
                                ('AMUSEMENT'),
                                ('SPORT');

INSERT INTO poi_type_translation (type_name, language_code, value) VALUES
                                                                       ('SCHOOL', 'en', 'School'),
                                                                       ('SCHOOL', 'vi', 'Trường học'),
                                                                       ('WORK', 'en', 'Work'),
                                                                       ('WORK', 'vi', 'Cơ quan'),
                                                                       ('SHOP', 'en', 'Shop'),
                                                                       ('SHOP', 'vi', 'Cửa hàng'),
                                                                       ('RESTAURANT', 'en', 'Restaurant'),
                                                                       ('RESTAURANT', 'vi', 'Nhà hàng'),
                                                                       ('HOME', 'en', 'Home'),
                                                                       ('HOME', 'vi', 'Nhà'),
                                                                       ('AMUSEMENT', 'en', 'Amusement'),
                                                                       ('AMUSEMENT', 'vi', 'Khu vui chơi'),
                                                                       ('SPORT', 'en', 'Sport'),
                                                                       ('SPORT', 'vi', 'Thể thao');

INSERT INTO poi (id, name, longitude, latitude, radius, created_at, user_id, type_name) VALUES
                                                                                            ('00000000-0000-0000-0000-000000000001', 'Green Valley School', 105.8200, 21.0320, 60, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'SCHOOL'),
                                                                                            ('00000000-0000-0000-0000-000000000002', 'Central Office', 105.8240, 21.0305, 80, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'WORK'),
                                                                                            ('00000000-0000-0000-0000-000000000003', 'Corner Shop', 105.8265, 21.0310, 20, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'SHOP'),
                                                                                            ('00000000-0000-0000-0000-000000000004', 'Pho Delight', 105.8288, 21.0333, 30, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'RESTAURANT'),
                                                                                            ('00000000-0000-0000-0000-000000000005', 'Home - Nguyen', 105.8295, 21.0338, 50, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'HOME'),
                                                                                            ('00000000-0000-0000-0000-000000000006', 'Funland Amusement', 105.8330, 21.0350, 150, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'AMUSEMENT'),
                                                                                            ('00000000-0000-0000-0000-000000000007', 'Riverside Sport Center', 105.8360, 21.0365, 120, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'SPORT'),
                                                                                            ('00000000-0000-0000-0000-000000000008', 'Mall Shop A', 105.8400, 21.0290, 40, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'SHOP'),
                                                                                            ('00000000-0000-0000-0000-000000000009', 'Evening Restaurant', 105.8422, 21.0300, 35, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'RESTAURANT'),
                                                                                            ('00000000-0000-0000-0000-00000000000a', 'Branch Office B', 105.8455, 21.0290, 70, now(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'WORK');

INSERT INTO poi_duration (id, poi_id, day_of_week, start_at, end_at) VALUES
                                                                         ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, current_time + INTERVAL '7 hours',  current_time + INTERVAL '15 hours'),
                                                                         ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 1, current_time + INTERVAL '8 hours',  current_time + INTERVAL '17 hours'),
                                                                         ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 2, current_time + INTERVAL '9 hours',  current_time + INTERVAL '18 hours'),
                                                                         ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 2, current_time + INTERVAL '11 hours', current_time + INTERVAL '14 hours'),
                                                                         ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 0, current_time + INTERVAL '0 hours',  current_time + INTERVAL '23 hours'),
                                                                         ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 6, current_time + INTERVAL '10 hours', current_time + INTERVAL '22 hours'),
                                                                         ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 3, current_time + INTERVAL '6 hours',  current_time + INTERVAL '22 hours'),
                                                                         ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 4, current_time + INTERVAL '10 hours', current_time + INTERVAL '21 hours'),
                                                                         ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 5, current_time + INTERVAL '17 hours', current_time + INTERVAL '23 hours'),
                                                                         ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 1, current_time + INTERVAL '8 hours',  current_time + INTERVAL '16 hours');

INSERT INTO location (longitude, latitude, "timestamp", user_id, anomaly) VALUES
                                                                              (106.7000, 10.7700, NOW() + INTERVAL '3 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7005, 10.7705, NOW() + INTERVAL '6 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7010, 10.7710, NOW() + INTERVAL '9 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7015, 10.7715, NOW() + INTERVAL '12 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7020, 10.7720, NOW() + INTERVAL '15 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7025, 10.7725, NOW() + INTERVAL '18 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7030, 10.7730, NOW() + INTERVAL '21 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7035, 10.7735, NOW() + INTERVAL '24 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7040, 10.7740, NOW() + INTERVAL '27 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE),
                                                                              (106.7045, 10.7745, NOW() + INTERVAL '30 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', FALSE);

INSERT INTO voice_record (id, created_at, user_id) VALUES
                                                       ('30000000-0000-0000-0000-000000000001', now() - INTERVAL '2 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000002', now() - INTERVAL '10 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000003', now() - INTERVAL '20 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000004', now() - INTERVAL '30 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000005', now() - INTERVAL '40 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000006', now() - INTERVAL '1 hour', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000007', now() - INTERVAL '2 hours', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000008', now() - INTERVAL '4 hours', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-000000000009', now() - INTERVAL '1 day', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                       ('30000000-0000-0000-0000-00000000000a', now() - INTERVAL '2 days', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

COMMIT;