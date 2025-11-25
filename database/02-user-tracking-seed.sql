BEGIN;

-- Provided single user
INSERT INTO "user" (id, connected) VALUES
    ('f8f735b4-549c-4d8c-9e10-15f8c198b71b', TRUE);

INSERT INTO location (longitude, latitude, "timestamp", accuracy, velocity, user_id) VALUES
                                                                                         (106.7000, 10.7700, NOW() + INTERVAL '3 minutes', 5.0, 0.0, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7005, 10.7705, NOW() + INTERVAL '6 minutes', 4.2, 0.1, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7010, 10.7710, NOW() + INTERVAL '9 minutes', 6.1, 0.3, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7015, 10.7715, NOW() + INTERVAL '12 minutes', 3.8, 0.0, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7020, 10.7720, NOW() + INTERVAL '15 minutes', 5.5, 1.2, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7025, 10.7725, NOW() + INTERVAL '18 minutes', 2.7, 0.6, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7030, 10.7730, NOW() + INTERVAL '21 minutes', 4.0, 0.0, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7035, 10.7735, NOW() + INTERVAL '24 minutes', 7.3, 2.0, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7040, 10.7740, NOW() + INTERVAL '27 minutes', 3.3, 0.4, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                         (106.7045, 10.7745, NOW() + INTERVAL '30 minutes', 5.9, 0.0, 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

-- mobile_device (fixed UUIDs)
INSERT INTO mobile_device (id, language_code, device_token, created_at, user_id) VALUES
                                                                                     ('00000001-0000-4000-8000-000000000001', 'vi', 'token-0001', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000002-0000-4000-8000-000000000002', 'en', 'token-0002', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000003-0000-4000-8000-000000000003', 'vi', 'token-0003', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000004-0000-4000-8000-000000000004', 'en', 'token-0004', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000005-0000-4000-8000-000000000005', 'vi', 'token-0005', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000006-0000-4000-8000-000000000006', 'en', 'token-0006', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000007-0000-4000-8000-000000000007', 'vi', 'token-0007', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000008-0000-4000-8000-000000000008', 'en', 'token-0008', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('00000009-0000-4000-8000-000000000009', 'vi', 'token-0009', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                     ('0000000a-0000-4000-8000-00000000000a', 'en', 'token-0010', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

-- tracking_notification (fixed UUIDs)
INSERT INTO tracking_notification (id, type, title, content, created_at, user_id) VALUES
                                                                                      ('00010001-0000-4000-8000-000000000001', 'info', 'Tracking started', 'Tracking started for the device.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010002-0000-4000-8000-000000000002', 'alert', 'Proximity alert', 'Target within proximity threshold.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010003-0000-4000-8000-000000000003', 'info', 'Tracker connected', 'A tracker device connected.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010004-0000-4000-8000-000000000004', 'warning', 'Battery low', 'Tracker battery low.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010005-0000-4000-8000-000000000005', 'info', 'Checkpoint reached', 'Checkpoint reached.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010006-0000-4000-8000-000000000006', 'alert', 'Movement detected', 'Unexpected movement detected.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010007-0000-4000-8000-000000000007', 'info', 'Settings updated', 'Tracking settings updated.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010008-0000-4000-8000-000000000008', 'alert', 'No signal', 'Tracker lost signal.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('00010009-0000-4000-8000-000000000009', 'info', 'Report ready', 'Tracking report ready.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                      ('0001000a-0000-4000-8000-00000000000a', 'warning', 'High speed', 'Target moving at high speed.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

-- risk_notification (fixed UUIDs)
INSERT INTO risk_notification (id, type, title, content, created_at, user_id) VALUES
                                                                                  ('00020001-0000-4000-8000-000000000001', 'critical', 'Severe risk', 'Immediate action required.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020002-0000-4000-8000-000000000002', 'high', 'High risk area', 'Target entered high risk area.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020003-0000-4000-8000-000000000003', 'medium', 'Potential risk', 'Potential risk detected nearby.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020004-0000-4000-8000-000000000004', 'low', 'Low risk', 'Low-level risk notification.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020005-0000-4000-8000-000000000005', 'warning', 'Risk trend', 'Risk trend increasing.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020006-0000-4000-8000-000000000006', 'info', 'Risk advisory', 'Advisory — be aware.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020007-0000-4000-8000-000000000007', 'high', 'Restricted area', 'Entered restricted area.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020008-0000-4000-8000-000000000008', 'critical', 'Evacuate', 'Evacuation advised.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('00020009-0000-4000-8000-000000000009', 'info', 'Risk cleared', 'Previously reported risk cleared.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                  ('0002000a-0000-4000-8000-00000000000a', 'warning', 'Watch area', 'Monitor this area for hazards.', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

-- tracking_notification_alerts_user (references tracking_notification ids above)
INSERT INTO tracking_notification_alerts_user (id, tracking_notification_id, user_id) VALUES
                                                                                          ('00030001-0000-4000-8000-000000000001', '00010001-0000-4000-8000-000000000001', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030002-0000-4000-8000-000000000002', '00010002-0000-4000-8000-000000000002', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030003-0000-4000-8000-000000000003', '00010003-0000-4000-8000-000000000003', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030004-0000-4000-8000-000000000004', '00010004-0000-4000-8000-000000000004', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030005-0000-4000-8000-000000000005', '00010005-0000-4000-8000-000000000005', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030006-0000-4000-8000-000000000006', '00010006-0000-4000-8000-000000000006', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030007-0000-4000-8000-000000000007', '00010007-0000-4000-8000-000000000007', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030008-0000-4000-8000-000000000008', '00010008-0000-4000-8000-000000000008', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('00030009-0000-4000-8000-000000000009', '00010009-0000-4000-8000-000000000009', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                                          ('0003000a-0000-4000-8000-00000000000a', '0001000a-0000-4000-8000-00000000000a', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

-- tracking_permission (fixed UUIDs)
INSERT INTO tracking_permission (id, otp, create_at, user_id) VALUES
                                                                  ('00040001-0000-4000-8000-000000000001', '100001', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040002-0000-4000-8000-000000000002', '100002', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040003-0000-4000-8000-000000000003', '100003', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040004-0000-4000-8000-000000000004', '100004', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040005-0000-4000-8000-000000000005', '100005', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040006-0000-4000-8000-000000000006', '100006', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040007-0000-4000-8000-000000000007', '100007', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040008-0000-4000-8000-000000000008', '100008', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('00040009-0000-4000-8000-000000000009', '100009', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b'),
                                                                  ('0004000a-0000-4000-8000-00000000000a', '100010', NOW(), 'f8f735b4-549c-4d8c-9e10-15f8c198b71b');

-- tracker_tracks_target (fixed UUIDs)
INSERT INTO tracker_tracks_target (id, tracker_id, target_id, created_at) VALUES
                                                                              ('00050001-0000-4000-8000-000000000001', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050002-0000-4000-8000-000000000002', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050003-0000-4000-8000-000000000003', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050004-0000-4000-8000-000000000004', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050005-0000-4000-8000-000000000005', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050006-0000-4000-8000-000000000006', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050007-0000-4000-8000-000000000007', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050008-0000-4000-8000-000000000008', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('00050009-0000-4000-8000-000000000009', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW()),
                                                                              ('0005000a-0000-4000-8000-00000000000a', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', NOW());

COMMIT;