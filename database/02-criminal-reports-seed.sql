BEGIN;
INSERT INTO reporter (id) VALUES
    ('2b16c1e4-c132-43f2-8875-ac877aef51ce'),
    ('f6c0abe9-b995-420f-926c-78febdec0d5d'),
    ('ead82f3a-d5e3-4845-905a-0ae5823f65a2'),
    ('a1919fe8-f705-4422-898b-c76229868c21')
ON CONFLICT (id) DO NOTHING;

INSERT INTO missing_person_report_status (name) VALUES
    ('PENDING'),('REJECTED'),('PUBLISHED')
ON CONFLICT (name) DO NOTHING;

INSERT INTO missing_person_report_status_translation (status_name, language_code, value) VALUES
    ('PENDING','en','Pending'),
    ('PENDING','vi','Đang chờ'),
    ('REJECTED','en','Rejected'),
    ('REJECTED','vi','Từ chối'),
    ('PUBLISHED','en','Published'),
    ('PUBLISHED','vi','Đã xuất bản')
ON CONFLICT (status_name, language_code) DO NOTHING;

INSERT INTO guidelines_document (id, title, abstract, content, created_at, reporter_id, public) VALUES
    ('30000000-0000-4000-8000-000000000001','Guideline 1','Abstract 1','https://example.com/mockups/guideline-1.html', NOW() - INTERVAL '100 minutes', '2b16c1e4-c132-43f2-8875-ac877aef51ce', TRUE),
    ('30000000-0000-4000-8000-000000000002','Guideline 2','Abstract 2','https://example.com/mockups/guideline-2.html', NOW() - INTERVAL '95 minutes', 'f6c0abe9-b995-420f-926c-78febdec0d5d', FALSE),
    ('30000000-0000-4000-8000-000000000003','Guideline 3','Abstract 3','https://example.com/mockups/guideline-3.html', NOW() - INTERVAL '90 minutes', 'ead82f3a-d5e3-4845-905a-0ae5823f65a2', TRUE),
    ('30000000-0000-4000-8000-000000000004','Guideline 4','Abstract 4','https://example.com/mockups/guideline-4.html', NOW() - INTERVAL '85 minutes', 'a1919fe8-f705-4422-898b-c76229868c21', FALSE),
    ('30000000-0000-4000-8000-000000000005','Guideline 5','Abstract 5','https://example.com/mockups/guideline-5.html', NOW() - INTERVAL '80 minutes', '2b16c1e4-c132-43f2-8875-ac877aef51ce', TRUE),
    ('30000000-0000-4000-8000-000000000006','Guideline 6','Abstract 6','https://example.com/mockups/guideline-6.html', NOW() - INTERVAL '75 minutes', 'f6c0abe9-b995-420f-926c-78febdec0d5d', TRUE),
    ('30000000-0000-4000-8000-000000000007','Guideline 7','Abstract 7','https://example.com/mockups/guideline-7.html', NOW() - INTERVAL '70 minutes', 'ead82f3a-d5e3-4845-905a-0ae5823f65a2', FALSE),
    ('30000000-0000-4000-8000-000000000008','Guideline 8','Abstract 8','https://example.com/mockups/guideline-8.html', NOW() - INTERVAL '65 minutes', 'a1919fe8-f705-4422-898b-c76229868c21', TRUE),
    ('30000000-0000-4000-8000-000000000009','Guideline 9','Abstract 9','https://example.com/mockups/guideline-9.html', NOW() - INTERVAL '60 minutes', '2b16c1e4-c132-43f2-8875-ac877aef51ce', FALSE),
    ('30000000-0000-4000-8000-000000000010','Guideline 10','Abstract 10','https://example.com/mockups/guideline-10.html', NOW() - INTERVAL '55 minutes', 'f6c0abe9-b995-420f-926c-78febdec0d5d', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO crime_report (id, title, content, date, severity, number_of_victims, number_of_offenders, arrested, longitude, latitude, created_at, updated_at, reporter_id, public) VALUES
    ('40000000-0000-4000-8000-000000000001','Crime 1','https://example.com/mockups/crime-1.html', CURRENT_DATE - 10, 3, 1, 1, FALSE, -73.935242, 40.730610, NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '119 minutes', '2b16c1e4-c132-43f2-8875-ac877aef51ce', TRUE),
    ('40000000-0000-4000-8000-000000000002','Crime 2','https://example.com/mockups/crime-2.html', CURRENT_DATE - 9, 5, 2, 2, TRUE, -0.127758, 51.507351, NOW() - INTERVAL '115 minutes', NOW() - INTERVAL '114 minutes', 'f6c0abe9-b995-420f-926c-78febdec0d5d', FALSE),
    ('40000000-0000-4000-8000-000000000003','Crime 3','https://example.com/mockups/crime-3.html', CURRENT_DATE - 8, 2, 0, 1, FALSE, 139.691711, 35.689487, NOW() - INTERVAL '110 minutes', NOW() - INTERVAL '109 minutes', 'ead82f3a-d5e3-4845-905a-0ae5823f65a2', TRUE),
    ('40000000-0000-4000-8000-000000000004','Crime 4','https://example.com/mockups/crime-4.html', CURRENT_DATE - 7, 4, 3, 2, TRUE, 151.209290, -33.868820, NOW() - INTERVAL '105 minutes', NOW() - INTERVAL '104 minutes', 'a1919fe8-f705-4422-898b-c76229868c21', FALSE),
    ('40000000-0000-4000-8000-000000000005','Crime 5','https://example.com/mockups/crime-5.html', CURRENT_DATE - 6, 1, 1, 0, FALSE, -73.936000, 40.732000, NOW() - INTERVAL '100 minutes', NOW() - INTERVAL '99 minutes', '2b16c1e4-c132-43f2-8875-ac877aef51ce', FALSE),
    ('40000000-0000-4000-8000-000000000006','Crime 6','https://example.com/mockups/crime-6.html', CURRENT_DATE - 5, 5, 4, 3, TRUE, -0.129500, 51.508500, NOW() - INTERVAL '95 minutes', NOW() - INTERVAL '94 minutes', 'f6c0abe9-b995-420f-926c-78febdec0d5d', TRUE),
    ('40000000-0000-4000-8000-000000000007','Crime 7','https://example.com/mockups/crime-7.html', CURRENT_DATE - 4, 3, 2, 1, FALSE, 139.692500, 35.689900, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '89 minutes', 'ead82f3a-d5e3-4845-905a-0ae5823f65a2', FALSE),
    ('40000000-0000-4000-8000-000000000008','Crime 8','https://example.com/mockups/crime-8.html', CURRENT_DATE - 3, 2, 1, 1, TRUE, 151.210000, -33.869000, NOW() - INTERVAL '85 minutes', NOW() - INTERVAL '84 minutes', 'a1919fe8-f705-4422-898b-c76229868c21', TRUE),
    ('40000000-0000-4000-8000-000000000009','Crime 9','https://example.com/mockups/crime-9.html', CURRENT_DATE - 2, 4, 2, 2, FALSE, -73.934000, 40.729500, NOW() - INTERVAL '80 minutes', NOW() - INTERVAL '79 minutes', '2b16c1e4-c132-43f2-8875-ac877aef51ce', TRUE),
    ('40000000-0000-4000-8000-000000000010','Crime 10','https://example.com/mockups/crime-10.html', CURRENT_DATE - 1, 1, 0, 0, FALSE, -0.128000, 51.507800, NOW() - INTERVAL '75 minutes', NOW() - INTERVAL '74 minutes', 'f6c0abe9-b995-420f-926c-78febdec0d5d', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO missing_person_report (id, title, full_name, personal_id, photo, contact_email, contact_phone, date, content, created_at, user_id, reporter_id, status_name) VALUES
    ('50000000-0000-4000-8000-000000000001','Missing 1','Alice Smith','PID0001','https://example.com/mockups/photo-a1.jpg','alice@example.com','+10000000001', CURRENT_DATE - 12, 'https://example.com/mockups/missing-1.html', NOW() - INTERVAL '70 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', '2b16c1e4-c132-43f2-8875-ac877aef51ce', 'PENDING'),
    ('50000000-0000-4000-8000-000000000002','Missing 2','Bob Nguyen','PID0002','https://example.com/mockups/photo-b2.jpg','bob@example.com','+10000000002', CURRENT_DATE - 11, 'https://example.com/mockups/missing-2.html', NOW() - INTERVAL '65 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'f6c0abe9-b995-420f-926c-78febdec0d5d', 'REJECTED'),
    ('50000000-0000-4000-8000-000000000003','Missing 3','Carlos Tan','PID0003','https://example.com/mockups/photo-c3.jpg','carlos@example.com','+10000000003', CURRENT_DATE - 10, 'https://example.com/mockups/missing-3.html', NOW() - INTERVAL '60 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', 'ead82f3a-d5e3-4845-905a-0ae5823f65a2', 'PUBLISHED'),
    ('50000000-0000-4000-8000-000000000004','Missing 4','Diana Ho','PID0004','https://example.com/mockups/photo-d4.jpg','diana@example.com','+10000000004', CURRENT_DATE - 9, 'https://example.com/mockups/missing-4.html', NOW() - INTERVAL '55 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', 'a1919fe8-f705-4422-898b-c76229868c21', 'PENDING'),
    ('50000000-0000-4000-8000-000000000005','Missing 5','Evan Lee','PID0005','https://example.com/mockups/photo-e5.jpg','evan@example.com','+10000000005', CURRENT_DATE - 8, 'https://example.com/mockups/missing-5.html', NOW() - INTERVAL '50 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', '2b16c1e4-c132-43f2-8875-ac877aef51ce', 'REJECTED'),
    ('50000000-0000-4000-8000-000000000006','Missing 6','Fiona Tran','PID0006','https://example.com/mockups/photo-f6.jpg','fiona@example.com','+10000000006', CURRENT_DATE - 7, 'https://example.com/mockups/missing-6.html', NOW() - INTERVAL '45 minutes', 'dd382dcf-3652-499c-acdb-5d9ce99a67b8', 'f6c0abe9-b995-420f-926c-78febdec0d5d', 'PUBLISHED'),
    ('50000000-0000-4000-8000-000000000007','Missing 7','George Kim','PID0007','https://example.com/mockups/photo-g7.jpg','george@example.com','+10000000007', CURRENT_DATE - 6, 'https://example.com/mockups/missing-7.html', NOW() - INTERVAL '40 minutes', '8c52c01e-42a7-45cc-9254-db8a7601c764', 'ead82f3a-d5e3-4845-905a-0ae5823f65a2', 'PENDING'),
    ('50000000-0000-4000-8000-000000000008','Missing 8','Hannah Pham','PID0008','https://example.com/mockups/photo-h8.jpg','hannah@example.com','+10000000008', CURRENT_DATE - 5, 'https://example.com/mockups/missing-8.html', NOW() - INTERVAL '35 minutes', '4405a37d-bc86-403e-b605-bedd7db88d37', 'a1919fe8-f705-4422-898b-c76229868c21', 'REJECTED'),
    ('50000000-0000-4000-8000-000000000009','Missing 9','Ibrahim Ali','PID0009','https://example.com/mockups/photo-i9.jpg','ibrahim@example.com','+10000000009', CURRENT_DATE - 4, 'https://example.com/mockups/missing-9.html', NOW() - INTERVAL '30 minutes', '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5', '2b16c1e4-c132-43f2-8875-ac877aef51ce', 'PUBLISHED'),
    ('50000000-0000-4000-8000-000000000010','Missing 10','Julia Park','PID0010','https://example.com/mockups/photo-j10.jpg','julia@example.com','+10000000010', CURRENT_DATE - 3, 'https://example.com/mockups/missing-10.html', NOW() - INTERVAL '25 minutes', 'f8f735b4-549c-4d8c-9e10-15f8c198b71b', 'f6c0abe9-b995-420f-926c-78febdec0d5d', 'PENDING')
ON CONFLICT (id) DO NOTHING;

COMMIT;