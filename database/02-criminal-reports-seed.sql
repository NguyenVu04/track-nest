BEGIN;

------------------------------------------------
-- Reporters
------------------------------------------------
INSERT INTO reporter (id)
VALUES
('686fce27-64a1-4e3b-a471-b00920717bb1'),
('766a99f7-7af1-4613-82a4-c303b2e9ee03'),
('f5aea0e8-5dbf-442d-8c91-d69ec41a198d'),
('8c1c0a9f-9193-4a02-90ea-7c398f73a3e6'),
('0e745cb3-5f38-419b-b446-d204c2e15ba9');

------------------------------------------------
-- Missing person report statuses
------------------------------------------------
INSERT INTO missing_person_report_status (name)
VALUES
('PENDING'),
('REJECTED'),
('PUBLISHED')
ON CONFLICT (name) DO NOTHING;

INSERT INTO missing_person_report_status_translation (status_name, language_code, value)
VALUES
('PENDING','en','Pending'),
('PENDING','vi','Đang chờ'),
('REJECTED','en','Rejected'),
('REJECTED','vi','Từ chối'),
('PUBLISHED','en','Published'),
('PUBLISHED','vi','Đã xuất bản')
ON CONFLICT (status_name, language_code) DO NOTHING;

------------------------------------------------
-- Missing person reports
------------------------------------------------
INSERT INTO missing_person_report (
id,title,full_name,personal_id,photo,contact_email,contact_phone,date,content,created_at,user_id,reporter_id,status_name
)
VALUES
(
'aa111111-1111-1111-1111-111111111111',
'Missing Teenager',
'Nguyen Van A',
'ID123456',
'https://cdn.example.com/photos/a.jpg',
'nguyenvana@gmail.com',
'0901000001',
'2026-03-01',
'https://cdn.example.com/files/missing-person-reports/report-aa111111.pdf',
'2026-03-01 10:00:00+07',
'11111111-1111-1111-1111-111111111111',
'686fce27-64a1-4e3b-a471-b00920717bb1',
'PENDING'
),
(
'aa222222-2222-2222-2222-222222222222',
'Missing Elderly Man',
'Tran Van B',
'ID223456',
'https://cdn.example.com/photos/b.jpg',
'tranvanb@gmail.com',
'0901000002',
'2026-02-27',
'https://cdn.example.com/files/missing-person-reports/report-aa222222.pdf',
'2026-02-27 09:30:00+07',
'22222222-2222-2222-2222-222222222222',
'686fce27-64a1-4e3b-a471-b00920717bb1',
'PUBLISHED'
),
(
'aa333333-3333-3333-3333-333333333333',
'Missing Child',
'Le Thi C',
'ID323456',
'https://cdn.example.com/photos/c.jpg',
'lethic@gmail.com',
'0901000003',
'2026-03-02',
'https://cdn.example.com/files/missing-person-reports/report-aa333333.pdf',
'2026-03-02 14:00:00+07',
'33333333-3333-3333-3333-333333333333',
'766a99f7-7af1-4613-82a4-c303b2e9ee03',
'PUBLISHED'
),
(
'aa444444-4444-4444-4444-444444444444',
'Missing Student',
'Pham Van D',
'ID423456',
'https://cdn.example.com/photos/d.jpg',
'phamvand@gmail.com',
'0901000004',
'2026-03-03',
'https://cdn.example.com/files/missing-person-reports/report-aa444444.pdf',
'2026-03-03 18:20:00+07',
'44444444-4444-4444-4444-444444444444',
'766a99f7-7af1-4613-82a4-c303b2e9ee03',
'REJECTED'
),
(
'aa555555-5555-5555-5555-555555555555',
'Missing Worker',
'Vo Thi E',
'ID523456',
'https://cdn.example.com/photos/e.jpg',
'vothie@gmail.com',
'0901000005',
'2026-03-03',
'https://cdn.example.com/files/missing-person-reports/report-aa555555.pdf',
'2026-03-03 07:50:00+07',
'55555555-5555-5555-5555-555555555555',
'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
'PENDING'
),
(
'aa666666-6666-6666-6666-666666666666',
'Missing Tourist',
'Michael Chen',
'ID888888',
'https://cdn.example.com/photos/f.jpg',
'admin@gmail.com',
'0812345678',
'2026-03-04',
'https://cdn.example.com/files/missing-person-reports/report-aa666666.pdf',
'2026-03-04 09:00:00+07',
'66666666-6666-6666-6666-666666666666',
'0e745cb3-5f38-419b-b446-d204c2e15ba9',
'PUBLISHED'
);

------------------------------------------------
-- Guidelines documents
------------------------------------------------
INSERT INTO guidelines_document (
id,title,abstract,content,created_at,reporter_id,public
)
VALUES
(
'bb111111-1111-1111-1111-111111111111',
'How to Report Missing Persons',
'Basic instructions for filing a missing person report.',
'https://cdn.example.com/files/guidelines/missing-person-guide.pdf',
'2026-02-20 08:00:00+07',
'686fce27-64a1-4e3b-a471-b00920717bb1',
TRUE
),
(
'bb222222-2222-2222-2222-222222222222',
'Community Crime Reporting Guide',
'Steps to safely report criminal activity.',
'https://cdn.example.com/files/guidelines/community-crime-guide.pdf',
'2026-02-21 08:00:00+07',
'766a99f7-7af1-4613-82a4-c303b2e9ee03',
TRUE
),
(
'bb333333-3333-3333-3333-333333333333',
'Emergency Reporting Standards',
'Internal standards for incident documentation.',
'https://cdn.example.com/files/guidelines/emergency-standards.pdf',
'2026-02-22 08:00:00+07',
'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
FALSE
),
(
'bb444444-4444-4444-4444-444444444444',
'Public Safety Awareness',
'Guidelines for community members to improve safety.',
'https://cdn.example.com/files/guidelines/public-safety-awareness.pdf',
'2026-02-23 08:00:00+07',
'8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
TRUE
),
(
'bb555555-5555-5555-5555-555555555555',
'City Emergency Protocol',
'Official protocol for emergency coordination.',
'https://cdn.example.com/files/guidelines/city-emergency-protocol.pdf',
'2026-02-24 08:00:00+07',
'0e745cb3-5f38-419b-b446-d204c2e15ba9',
TRUE
);

------------------------------------------------
-- Crime reports
------------------------------------------------
INSERT INTO crime_report (
id,title,content,date,severity,number_of_victims,number_of_offenders,arrested,
longitude,latitude,created_at,updated_at,reporter_id,public
)
VALUES
(
'cc111111-1111-1111-1111-111111111111',
'Street Robbery',
'https://cdn.example.com/files/crime-reports/robbery-cc111111.pdf',
'2026-03-01',
3,1,2,FALSE,
106.7009,10.7769,
'2026-03-01 09:00:00+07',
'2026-03-01 09:00:00+07',
'686fce27-64a1-4e3b-a471-b00920717bb1',
TRUE
),
(
'cc222222-2222-2222-2222-222222222222',
'Pickpocket Incident',
'https://cdn.example.com/files/crime-reports/pickpocket-cc222222.pdf',
'2026-03-02',
2,1,1,FALSE,
106.7015,10.7754,
'2026-03-02 11:30:00+07',
'2026-03-02 11:30:00+07',
'686fce27-64a1-4e3b-a471-b00920717bb1',
TRUE
),
(
'cc333333-3333-3333-3333-333333333333',
'Motorbike Theft',
'https://cdn.example.com/files/crime-reports/motorbike-theft-cc333333.pdf',
'2026-03-02',
3,0,1,TRUE,
106.7032,10.7778,
'2026-03-02 15:10:00+07',
'2026-03-02 15:10:00+07',
'766a99f7-7af1-4613-82a4-c303b2e9ee03',
TRUE
),
(
'cc444444-4444-4444-4444-444444444444',
'Assault Case',
'https://cdn.example.com/files/crime-reports/assault-cc444444.pdf',
'2026-03-03',
4,1,2,TRUE,
106.7045,10.7791,
'2026-03-03 18:00:00+07',
'2026-03-03 18:00:00+07',
'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
FALSE
),
(
'cc555555-5555-5555-5555-555555555555',
'Burglary',
'https://cdn.example.com/files/crime-reports/burglary-cc555555.pdf',
'2026-03-03',
4,0,3,FALSE,
106.6988,10.7756,
'2026-03-03 21:15:00+07',
'2026-03-03 21:15:00+07',
'8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
TRUE
),
(
'cc666666-6666-6666-6666-666666666666',
'Phone Snatching',
'https://cdn.example.com/files/crime-reports/phone-snatching-cc666666.pdf',
'2026-03-04',
2,1,1,FALSE,
106.6999,10.7748,
'2026-03-04 08:40:00+07',
'2026-03-04 08:40:00+07',
'8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
TRUE
),
(
'cc777777-7777-7777-7777-777777777777',
'Market Fraud',
'https://cdn.example.com/files/crime-reports/market-fraud-cc777777.pdf',
'2026-03-04',
3,2,2,FALSE,
106.7022,10.7761,
'2026-03-04 09:10:00+07',
'2026-03-04 09:10:00+07',
'0e745cb3-5f38-419b-b446-d204c2e15ba9',
TRUE
);

COMMIT;