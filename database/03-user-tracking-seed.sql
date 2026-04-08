BEGIN;

------------------------------------------------
-- Users (20 more)
------------------------------------------------
INSERT INTO "user" (id, username, connected) VALUES
    ('b0000001-b000-4000-8000-b00000000001', 'user6',  TRUE),
    ('b0000002-b000-4000-8000-b00000000002', 'user7',  FALSE),
    ('b0000003-b000-4000-8000-b00000000003', 'user8',  TRUE),
    ('b0000004-b000-4000-8000-b00000000004', 'user9',  TRUE),
    ('b0000005-b000-4000-8000-b00000000005', 'user10', FALSE),
    ('b0000006-b000-4000-8000-b00000000006', 'user11', TRUE),
    ('b0000007-b000-4000-8000-b00000000007', 'user12', TRUE),
    ('b0000008-b000-4000-8000-b00000000008', 'user13', FALSE),
    ('b0000009-b000-4000-8000-b00000000009', 'user14', TRUE),
    ('b000000a-b000-4000-8000-b0000000000a', 'user15', TRUE),
    ('b000000b-b000-4000-8000-b0000000000b', 'user16', FALSE),
    ('b000000c-b000-4000-8000-b0000000000c', 'user17', TRUE),
    ('b000000d-b000-4000-8000-b0000000000d', 'user18', TRUE),
    ('b000000e-b000-4000-8000-b0000000000e', 'user19', FALSE),
    ('b000000f-b000-4000-8000-b0000000000f', 'user20', TRUE),
    ('b0000010-b000-4000-8000-b00000000010', 'user21', TRUE),
    ('b0000011-b000-4000-8000-b00000000011', 'user22', FALSE),
    ('b0000012-b000-4000-8000-b00000000012', 'user23', TRUE),
    ('b0000013-b000-4000-8000-b00000000013', 'user24', TRUE),
    ('b0000014-b000-4000-8000-b00000000014', 'user25', FALSE)
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- Locations (20 more, 1 per new user)
------------------------------------------------
INSERT INTO location (longitude, latitude, "timestamp", accuracy, velocity, user_id) VALUES
    (106.7001, 10.7770, NOW() - INTERVAL '21 minutes', 5.0, 0.5, 'b0000001-b000-4000-8000-b00000000001'),
    (106.7015, 10.7755, NOW() - INTERVAL '22 minutes', 6.2, 1.0, 'b0000002-b000-4000-8000-b00000000002'),
    (106.7030, 10.7780, NOW() - INTERVAL '23 minutes', 4.8, 0.3, 'b0000003-b000-4000-8000-b00000000003'),
    (106.6990, 10.7745, NOW() - INTERVAL '24 minutes', 7.0, 0.8, 'b0000004-b000-4000-8000-b00000000004'),
    (106.7045, 10.7795, NOW() - INTERVAL '25 minutes', 5.5, 1.2, 'b0000005-b000-4000-8000-b00000000005'),
    (106.7008, 10.7762, NOW() - INTERVAL '26 minutes', 6.0, 0.4, 'b0000006-b000-4000-8000-b00000000006'),
    (106.6975, 10.7740, NOW() - INTERVAL '27 minutes', 8.0, 0.0, 'b0000007-b000-4000-8000-b00000000007'),
    (106.7052, 10.7805, NOW() - INTERVAL '28 minutes', 4.0, 0.7, 'b0000008-b000-4000-8000-b00000000008'),
    (106.7020, 10.7768, NOW() - INTERVAL '29 minutes', 5.8, 0.9, 'b0000009-b000-4000-8000-b00000000009'),
    (106.6983, 10.7752, NOW() - INTERVAL '30 minutes', 7.5, 0.2, 'b000000a-b000-4000-8000-b0000000000a'),
    (106.7035, 10.7782, NOW() - INTERVAL '31 minutes', 6.5, 1.1, 'b000000b-b000-4000-8000-b0000000000b'),
    (106.7000, 10.7765, NOW() - INTERVAL '32 minutes', 5.0, 0.6, 'b000000c-b000-4000-8000-b0000000000c'),
    (106.7058, 10.7810, NOW() - INTERVAL '33 minutes', 9.0, 0.0, 'b000000d-b000-4000-8000-b0000000000d'),
    (106.6965, 10.7735, NOW() - INTERVAL '34 minutes', 4.5, 1.5, 'b000000e-b000-4000-8000-b0000000000e'),
    (106.7025, 10.7773, NOW() - INTERVAL '35 minutes', 6.8, 0.3, 'b000000f-b000-4000-8000-b0000000000f'),
    (106.6995, 10.7750, NOW() - INTERVAL '36 minutes', 7.2, 0.8, 'b0000010-b000-4000-8000-b00000000010'),
    (106.7040, 10.7790, NOW() - INTERVAL '37 minutes', 5.3, 0.5, 'b0000011-b000-4000-8000-b00000000011'),
    (106.7012, 10.7760, NOW() - INTERVAL '38 minutes', 6.0, 1.0, 'b0000012-b000-4000-8000-b00000000012'),
    (106.6978, 10.7743, NOW() - INTERVAL '39 minutes', 8.5, 0.2, 'b0000013-b000-4000-8000-b00000000013'),
    (106.7048, 10.7800, NOW() - INTERVAL '40 minutes', 5.0, 0.7, 'b0000014-b000-4000-8000-b00000000014');

------------------------------------------------
-- Mobile Devices (20 more)
------------------------------------------------
INSERT INTO mobile_device (id, language_code, device_token, platform, created_at, user_id) VALUES
    ('f4000001-f400-4000-8000-f40000000001', 'vi', 'token-user6-1',  'ANDROID', NOW(), 'b0000001-b000-4000-8000-b00000000001'),
    ('f4000002-f400-4000-8000-f40000000002', 'en', 'token-user7-1',  'IOS',     NOW(), 'b0000002-b000-4000-8000-b00000000002'),
    ('f4000003-f400-4000-8000-f40000000003', 'vi', 'token-user8-1',  'ANDROID', NOW(), 'b0000003-b000-4000-8000-b00000000003'),
    ('f4000004-f400-4000-8000-f40000000004', 'en', 'token-user9-1',  'IOS',     NOW(), 'b0000004-b000-4000-8000-b00000000004'),
    ('f4000005-f400-4000-8000-f40000000005', 'vi', 'token-user10-1', 'ANDROID', NOW(), 'b0000005-b000-4000-8000-b00000000005'),
    ('f4000006-f400-4000-8000-f40000000006', 'en', 'token-user11-1', 'IOS',     NOW(), 'b0000006-b000-4000-8000-b00000000006'),
    ('f4000007-f400-4000-8000-f40000000007', 'vi', 'token-user12-1', 'ANDROID', NOW(), 'b0000007-b000-4000-8000-b00000000007'),
    ('f4000008-f400-4000-8000-f40000000008', 'en', 'token-user13-1', 'IOS',     NOW(), 'b0000008-b000-4000-8000-b00000000008'),
    ('f4000009-f400-4000-8000-f40000000009', 'vi', 'token-user14-1', 'ANDROID', NOW(), 'b0000009-b000-4000-8000-b00000000009'),
    ('f400000a-f400-4000-8000-f4000000000a', 'en', 'token-user15-1', 'IOS',     NOW(), 'b000000a-b000-4000-8000-b0000000000a'),
    ('f400000b-f400-4000-8000-f4000000000b', 'vi', 'token-user16-1', 'ANDROID', NOW(), 'b000000b-b000-4000-8000-b0000000000b'),
    ('f400000c-f400-4000-8000-f4000000000c', 'en', 'token-user17-1', 'IOS',     NOW(), 'b000000c-b000-4000-8000-b0000000000c'),
    ('f400000d-f400-4000-8000-f4000000000d', 'vi', 'token-user18-1', 'ANDROID', NOW(), 'b000000d-b000-4000-8000-b0000000000d'),
    ('f400000e-f400-4000-8000-f4000000000e', 'en', 'token-user19-1', 'IOS',     NOW(), 'b000000e-b000-4000-8000-b0000000000e'),
    ('f400000f-f400-4000-8000-f4000000000f', 'vi', 'token-user20-1', 'ANDROID', NOW(), 'b000000f-b000-4000-8000-b0000000000f'),
    ('f4000010-f400-4000-8000-f40000000010', 'en', 'token-user21-1', 'IOS',     NOW(), 'b0000010-b000-4000-8000-b00000000010'),
    ('f4000011-f400-4000-8000-f40000000011', 'vi', 'token-user22-1', 'ANDROID', NOW(), 'b0000011-b000-4000-8000-b00000000011'),
    ('f4000012-f400-4000-8000-f40000000012', 'en', 'token-user23-1', 'IOS',     NOW(), 'b0000012-b000-4000-8000-b00000000012'),
    ('f4000013-f400-4000-8000-f40000000013', 'vi', 'token-user24-1', 'ANDROID', NOW(), 'b0000013-b000-4000-8000-b00000000013'),
    ('f4000014-f400-4000-8000-f40000000014', 'en', 'token-user25-1', 'IOS',     NOW(), 'b0000014-b000-4000-8000-b00000000014')
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- Tracking Notifications (20 more)
------------------------------------------------
INSERT INTO tracking_notification (id, type, title, content, created_at, target_id) VALUES
    ('f5000001-f500-4000-8000-f50000000001', 'info',  'Location Update',    'User entered monitored zone.',        NOW() - INTERVAL '5 minutes',  'b0000001-b000-4000-8000-b00000000001'),
    ('f5000002-f500-4000-8000-f50000000002', 'alert', 'Speed Alert',        'User is moving too fast.',            NOW() - INTERVAL '6 minutes',  'b0000002-b000-4000-8000-b00000000002'),
    ('f5000003-f500-4000-8000-f50000000003', 'info',  'Check-in Received',  'User checked in safely.',             NOW() - INTERVAL '7 minutes',  'b0000003-b000-4000-8000-b00000000003'),
    ('f5000004-f500-4000-8000-f50000000004', 'alert', 'Zone Exit Alert',    'User left safe zone.',                NOW() - INTERVAL '8 minutes',  'b0000004-b000-4000-8000-b00000000004'),
    ('f5000005-f500-4000-8000-f50000000005', 'info',  'Activity Resumed',   'User active again.',                  NOW() - INTERVAL '9 minutes',  'b0000005-b000-4000-8000-b00000000005'),
    ('f5000006-f500-4000-8000-f50000000006', 'alert', 'Inactivity Warning', 'No movement in 30 minutes.',          NOW() - INTERVAL '10 minutes', 'b0000006-b000-4000-8000-b00000000006'),
    ('f5000007-f500-4000-8000-f50000000007', 'info',  'Home Arrival',       'User arrived at home.',               NOW() - INTERVAL '11 minutes', 'b0000007-b000-4000-8000-b00000000007'),
    ('f5000008-f500-4000-8000-f50000000008', 'alert', 'Distress Signal',    'User triggered SOS.',                 NOW() - INTERVAL '12 minutes', 'b0000008-b000-4000-8000-b00000000008'),
    ('f5000009-f500-4000-8000-f50000000009', 'info',  'School Arrival',     'User arrived at school.',             NOW() - INTERVAL '13 minutes', 'b0000009-b000-4000-8000-b00000000009'),
    ('f500000a-f500-4000-8000-f5000000000a', 'alert', 'Curfew Breach',      'User out past curfew.',               NOW() - INTERVAL '14 minutes', 'b000000a-b000-4000-8000-b0000000000a'),
    ('f500000b-f500-4000-8000-f5000000000b', 'info',  'Work Arrival',       'User arrived at workplace.',          NOW() - INTERVAL '15 minutes', 'b000000b-b000-4000-8000-b0000000000b'),
    ('f500000c-f500-4000-8000-f5000000000c', 'alert', 'Danger Zone Entry',  'User entered high-risk area.',        NOW() - INTERVAL '16 minutes', 'b000000c-b000-4000-8000-b0000000000c'),
    ('f500000d-f500-4000-8000-f5000000000d', 'info',  'Battery Low Alert',  'Device battery below 10%.',           NOW() - INTERVAL '17 minutes', 'b000000d-b000-4000-8000-b0000000000d'),
    ('f500000e-f500-4000-8000-f5000000000e', 'alert', 'GPS Signal Lost',    'Location signal lost.',               NOW() - INTERVAL '18 minutes', 'b000000e-b000-4000-8000-b0000000000e'),
    ('f500000f-f500-4000-8000-f5000000000f', 'info',  'Weekend Check-in',   'User sent weekend check-in.',         NOW() - INTERVAL '19 minutes', 'b000000f-b000-4000-8000-b0000000000f'),
    ('f5000010-f500-4000-8000-f50000000010', 'alert', 'Unusual Route',      'User took unexpected route.',         NOW() - INTERVAL '20 minutes', 'b0000010-b000-4000-8000-b00000000010'),
    ('f5000011-f500-4000-8000-f50000000011', 'info',  'Park Arrival',       'User arrived at the park.',           NOW() - INTERVAL '21 minutes', 'b0000011-b000-4000-8000-b00000000011'),
    ('f5000012-f500-4000-8000-f50000000012', 'alert', 'Night Out Alert',    'User active late at night.',          NOW() - INTERVAL '22 minutes', 'b0000012-b000-4000-8000-b00000000012'),
    ('f5000013-f500-4000-8000-f50000000013', 'info',  'Hospital Arrival',   'User arrived at hospital.',           NOW() - INTERVAL '23 minutes', 'b0000013-b000-4000-8000-b00000000013'),
    ('f5000014-f500-4000-8000-f50000000014', 'alert', 'Emergency Beacon',   'User activated emergency beacon.',    NOW() - INTERVAL '24 minutes', 'b0000014-b000-4000-8000-b00000000014')
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- Risk Notifications (20 more)
------------------------------------------------
INSERT INTO risk_notification (id, type, title, content, created_at, user_id) VALUES
    ('f6000001-f600-4000-8000-f60000000001', 'risk', 'Nearby Crime Alert',    'A robbery was reported near your location.',          NOW() - INTERVAL '5 minutes',  'b0000001-b000-4000-8000-b00000000001'),
    ('f6000002-f600-4000-8000-f60000000002', 'risk', 'Flood Warning',         'Flash flood warning issued for your area.',           NOW() - INTERVAL '6 minutes',  'b0000002-b000-4000-8000-b00000000002'),
    ('f6000003-f600-4000-8000-f60000000003', 'risk', 'High Crime Zone',       'You have entered a high crime zone.',                 NOW() - INTERVAL '7 minutes',  'b0000003-b000-4000-8000-b00000000003'),
    ('f6000004-f600-4000-8000-f60000000004', 'risk', 'Suspicious Activity',   'Suspicious person reported in your vicinity.',        NOW() - INTERVAL '8 minutes',  'b0000004-b000-4000-8000-b00000000004'),
    ('f6000005-f600-4000-8000-f60000000005', 'risk', 'Road Hazard',           'Road block reported on your current route.',          NOW() - INTERVAL '9 minutes',  'b0000005-b000-4000-8000-b00000000005'),
    ('f6000006-f600-4000-8000-f60000000006', 'risk', 'Drug Zone Warning',     'Drug activity reported in nearby area.',              NOW() - INTERVAL '10 minutes', 'b0000006-b000-4000-8000-b00000000006'),
    ('f6000007-f600-4000-8000-f60000000007', 'risk', 'Protest Alert',         'Large gathering reported on your route.',             NOW() - INTERVAL '11 minutes', 'b0000007-b000-4000-8000-b00000000007'),
    ('f6000008-f600-4000-8000-f60000000008', 'risk', 'Violence Incident',     'Violent incident reported 200m from you.',            NOW() - INTERVAL '12 minutes', 'b0000008-b000-4000-8000-b00000000008'),
    ('f6000009-f600-4000-8000-f60000000009', 'risk', 'Night Safety Warning',  'Low visibility area. Stay alert.',                   NOW() - INTERVAL '13 minutes', 'b0000009-b000-4000-8000-b00000000009'),
    ('f600000a-f600-4000-8000-f6000000000a', 'risk', 'Pickpocket Zone',       'High pickpocket activity in this area.',              NOW() - INTERVAL '14 minutes', 'b000000a-b000-4000-8000-b0000000000a'),
    ('f600000b-f600-4000-8000-f6000000000b', 'risk', 'Gang Territory Alert',  'Known gang territory ahead.',                        NOW() - INTERVAL '15 minutes', 'b000000b-b000-4000-8000-b0000000000b'),
    ('f600000c-f600-4000-8000-f6000000000c', 'risk', 'Construction Hazard',   'Active construction zone. Use caution.',              NOW() - INTERVAL '16 minutes', 'b000000c-b000-4000-8000-b0000000000c'),
    ('f600000d-f600-4000-8000-f6000000000d', 'risk', 'Animal Threat',         'Wild animal sightings reported in the area.',         NOW() - INTERVAL '17 minutes', 'b000000d-b000-4000-8000-b0000000000d'),
    ('f600000e-f600-4000-8000-f6000000000e', 'risk', 'Public Disorder',       'Public disorder event near your location.',           NOW() - INTERVAL '18 minutes', 'b000000e-b000-4000-8000-b0000000000e'),
    ('f600000f-f600-4000-8000-f6000000000f', 'risk', 'Air Quality Warning',   'Poor air quality detected in your area.',             NOW() - INTERVAL '19 minutes', 'b000000f-b000-4000-8000-b0000000000f'),
    ('f6000010-f600-4000-8000-f60000000010', 'risk', 'Scam Activity',         'Scam operations reported in nearby market.',          NOW() - INTERVAL '20 minutes', 'b0000010-b000-4000-8000-b00000000010'),
    ('f6000011-f600-4000-8000-f60000000011', 'risk', 'Missing Person Nearby', 'Missing person last seen near your location.',        NOW() - INTERVAL '21 minutes', 'b0000011-b000-4000-8000-b00000000011'),
    ('f6000012-f600-4000-8000-f60000000012', 'risk', 'Theft Hotspot',         'High theft activity reported in this zone.',          NOW() - INTERVAL '22 minutes', 'b0000012-b000-4000-8000-b00000000012'),
    ('f6000013-f600-4000-8000-f60000000013', 'risk', 'Storm Warning',         'Severe storm approaching your area.',                 NOW() - INTERVAL '23 minutes', 'b0000013-b000-4000-8000-b00000000013'),
    ('f6000014-f600-4000-8000-f60000000014', 'risk', 'Assault Reported',      'Assault incident reported 500m from you.',            NOW() - INTERVAL '24 minutes', 'b0000014-b000-4000-8000-b00000000014')
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- Tracking Notification Alerts User (20 more)
------------------------------------------------
INSERT INTO tracking_notification_alerts_user (notification_id, tracker_id) VALUES
    ('f5000001-f500-4000-8000-f50000000001', 'b0000002-b000-4000-8000-b00000000002'),
    ('f5000002-f500-4000-8000-f50000000002', 'b0000003-b000-4000-8000-b00000000003'),
    ('f5000003-f500-4000-8000-f50000000003', 'b0000004-b000-4000-8000-b00000000004'),
    ('f5000004-f500-4000-8000-f50000000004', 'b0000005-b000-4000-8000-b00000000005'),
    ('f5000005-f500-4000-8000-f50000000005', 'b0000006-b000-4000-8000-b00000000006'),
    ('f5000006-f500-4000-8000-f50000000006', 'b0000007-b000-4000-8000-b00000000007'),
    ('f5000007-f500-4000-8000-f50000000007', 'b0000008-b000-4000-8000-b00000000008'),
    ('f5000008-f500-4000-8000-f50000000008', 'b0000009-b000-4000-8000-b00000000009'),
    ('f5000009-f500-4000-8000-f50000000009', 'b000000a-b000-4000-8000-b0000000000a'),
    ('f500000a-f500-4000-8000-f5000000000a', 'b000000b-b000-4000-8000-b0000000000b'),
    ('f500000b-f500-4000-8000-f5000000000b', 'b000000c-b000-4000-8000-b0000000000c'),
    ('f500000c-f500-4000-8000-f5000000000c', 'b000000d-b000-4000-8000-b0000000000d'),
    ('f500000d-f500-4000-8000-f5000000000d', 'b000000e-b000-4000-8000-b0000000000e'),
    ('f500000e-f500-4000-8000-f5000000000e', 'b000000f-b000-4000-8000-b0000000000f'),
    ('f500000f-f500-4000-8000-f5000000000f', 'b0000010-b000-4000-8000-b00000000010'),
    ('f5000010-f500-4000-8000-f50000000010', 'b0000011-b000-4000-8000-b00000000011'),
    ('f5000011-f500-4000-8000-f50000000011', 'b0000012-b000-4000-8000-b00000000012'),
    ('f5000012-f500-4000-8000-f50000000012', 'b0000013-b000-4000-8000-b00000000013'),
    ('f5000013-f500-4000-8000-f50000000013', 'b0000014-b000-4000-8000-b00000000014'),
    ('f5000014-f500-4000-8000-f50000000014', 'b0000001-b000-4000-8000-b00000000001')
ON CONFLICT DO NOTHING;

------------------------------------------------
-- Family Circles (20 more)
------------------------------------------------
INSERT INTO family_circle (id, name, created_at) VALUES
    ('f3000001-f300-4000-8000-f30000000001', 'Nguyen Family',  NOW()),
    ('f3000002-f300-4000-8000-f30000000002', 'Tran Family',    NOW()),
    ('f3000003-f300-4000-8000-f30000000003', 'Le Family',      NOW()),
    ('f3000004-f300-4000-8000-f30000000004', 'Pham Family',    NOW()),
    ('f3000005-f300-4000-8000-f30000000005', 'Vo Family',      NOW()),
    ('f3000006-f300-4000-8000-f30000000006', 'Bui Family',     NOW()),
    ('f3000007-f300-4000-8000-f30000000007', 'Dang Family',    NOW()),
    ('f3000008-f300-4000-8000-f30000000008', 'Do Family',      NOW()),
    ('f3000009-f300-4000-8000-f30000000009', 'Ngo Family',     NOW()),
    ('f300000a-f300-4000-8000-f3000000000a', 'Hoang Family',   NOW()),
    ('f300000b-f300-4000-8000-f3000000000b', 'Trinh Family',   NOW()),
    ('f300000c-f300-4000-8000-f3000000000c', 'Dinh Family',    NOW()),
    ('f300000d-f300-4000-8000-f3000000000d', 'Ly Family',      NOW()),
    ('f300000e-f300-4000-8000-f3000000000e', 'Truong Family',  NOW()),
    ('f300000f-f300-4000-8000-f3000000000f', 'Dam Family',     NOW()),
    ('f3000010-f300-4000-8000-f30000000010', 'Cao Family',     NOW()),
    ('f3000011-f300-4000-8000-f30000000011', 'Vu Family',      NOW()),
    ('f3000012-f300-4000-8000-f30000000012', 'Mai Family',     NOW()),
    ('f3000013-f300-4000-8000-f30000000013', 'Luu Family',     NOW()),
    ('f3000014-f300-4000-8000-f30000000014', 'Ha Family',      NOW())
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- User in Family Circle (20 more)
------------------------------------------------
INSERT INTO user_in_family_circle (family_circle_id, user_id, role, admin) VALUES
    ('f3000001-f300-4000-8000-f30000000001', 'b0000001-b000-4000-8000-b00000000001', 'Father', TRUE),
    ('f3000002-f300-4000-8000-f30000000002', 'b0000002-b000-4000-8000-b00000000002', 'Mother', TRUE),
    ('f3000003-f300-4000-8000-f30000000003', 'b0000003-b000-4000-8000-b00000000003', 'Child',  FALSE),
    ('f3000004-f300-4000-8000-f30000000004', 'b0000004-b000-4000-8000-b00000000004', 'Father', TRUE),
    ('f3000005-f300-4000-8000-f30000000005', 'b0000005-b000-4000-8000-b00000000005', 'Mother', TRUE),
    ('f3000006-f300-4000-8000-f30000000006', 'b0000006-b000-4000-8000-b00000000006', 'Child',  FALSE),
    ('f3000007-f300-4000-8000-f30000000007', 'b0000007-b000-4000-8000-b00000000007', 'Father', TRUE),
    ('f3000008-f300-4000-8000-f30000000008', 'b0000008-b000-4000-8000-b00000000008', 'Mother', TRUE),
    ('f3000009-f300-4000-8000-f30000000009', 'b0000009-b000-4000-8000-b00000000009', 'Child',  FALSE),
    ('f300000a-f300-4000-8000-f3000000000a', 'b000000a-b000-4000-8000-b0000000000a', 'Father', TRUE),
    ('f300000b-f300-4000-8000-f3000000000b', 'b000000b-b000-4000-8000-b0000000000b', 'Mother', TRUE),
    ('f300000c-f300-4000-8000-f3000000000c', 'b000000c-b000-4000-8000-b0000000000c', 'Child',  FALSE),
    ('f300000d-f300-4000-8000-f3000000000d', 'b000000d-b000-4000-8000-b0000000000d', 'Father', TRUE),
    ('f300000e-f300-4000-8000-f3000000000e', 'b000000e-b000-4000-8000-b0000000000e', 'Mother', TRUE),
    ('f300000f-f300-4000-8000-f3000000000f', 'b000000f-b000-4000-8000-b0000000000f', 'Child',  FALSE),
    ('f3000010-f300-4000-8000-f30000000010', 'b0000010-b000-4000-8000-b00000000010', 'Father', TRUE),
    ('f3000011-f300-4000-8000-f30000000011', 'b0000011-b000-4000-8000-b00000000011', 'Mother', TRUE),
    ('f3000012-f300-4000-8000-f30000000012', 'b0000012-b000-4000-8000-b00000000012', 'Child',  FALSE),
    ('f3000013-f300-4000-8000-f30000000013', 'b0000013-b000-4000-8000-b00000000013', 'Father', TRUE),
    ('f3000014-f300-4000-8000-f30000000014', 'b0000014-b000-4000-8000-b00000000014', 'Mother', TRUE)
ON CONFLICT DO NOTHING;

COMMIT;
