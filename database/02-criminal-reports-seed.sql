BEGIN;
------------------------------------------------
-- Reporters (from Keycloak)
------------------------------------------------
INSERT INTO reporter (id)
VALUES ('686fce27-64a1-4e3b-a471-b00920717bb1'),
    ('766a99f7-7af1-4613-82a4-c303b2e9ee03'),
    ('f5aea0e8-5dbf-442d-8c91-d69ec41a198d'),
    ('8c1c0a9f-9193-4a02-90ea-7c398f73a3e6');
    
INSERT INTO missing_person_report_status (name)
VALUES ('PENDING'),
('REJECTED'),
('PUBLISHED') ON CONFLICT (name) DO NOTHING;

INSERT INTO missing_person_report_status_translation (status_name, language_code, value)
VALUES ('PENDING', 'en', 'Pending'),
    ('PENDING', 'vi', 'Đang chờ'),
    ('REJECTED', 'en', 'Rejected'),
    ('REJECTED', 'vi', 'Từ chối'),
    ('PUBLISHED', 'en', 'Published'),
    ('PUBLISHED', 'vi', 'Đã xuất bản') ON CONFLICT (status_name, language_code) DO NOTHING;

------------------------------------------------
-- Missing person reports
------------------------------------------------
INSERT INTO missing_person_report (
        id,
        title,
        full_name,
        personal_id,
        photo,
        contact_email,
        contact_phone,
        date,
        content,
        created_at,
        user_id,
        reporter_id,
        status_name
    )
VALUES (
        'aa111111-1111-1111-1111-111111111111',
        'Missing Teenager',
        'Nguyen Van A',
        'ID123456',
        '/photos/a.jpg',
        'nguyenvana@gmail.com',
        '0901000001',
        '2026-03-01',
        'Last seen near District 1 market.',
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
        '/photos/b.jpg',
        'tranvanb@gmail.com',
        '0901000002',
        '2026-02-27',
        'Last seen leaving hospital.',
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
        '/photos/c.jpg',
        'lethic@gmail.com',
        '0901000003',
        '2026-03-02',
        'Child missing near school area.',
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
        '/photos/d.jpg',
        'phamvand@gmail.com',
        '0901000004',
        '2026-03-03',
        'Did not return home after class.',
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
        '/photos/e.jpg',
        'vothie@gmail.com',
        '0901000005',
        '2026-03-03',
        'Last seen leaving factory.',
        '2026-03-03 07:50:00+07',
        '55555555-5555-5555-5555-555555555555',
        'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
        'PENDING'
    );
------------------------------------------------
-- Guidelines documents
------------------------------------------------
INSERT INTO guidelines_document (
        id,
        title,
        abstract,
        content,
        created_at,
        reporter_id,
        public
    )
VALUES (
        'bb111111-1111-1111-1111-111111111111',
        'How to Report Missing Persons',
        'Basic instructions for filing a missing person report.',
        'Ensure you provide name, ID, photo, and last known location.',
        '2026-02-20 08:00:00+07',
        '686fce27-64a1-4e3b-a471-b00920717bb1',
        TRUE
    ),
    (
        'bb222222-2222-2222-2222-222222222222',
        'Community Crime Reporting Guide',
        'Steps to safely report criminal activity.',
        'Always prioritize safety and contact local authorities.',
        '2026-02-21 08:00:00+07',
        '766a99f7-7af1-4613-82a4-c303b2e9ee03',
        TRUE
    ),
    (
        'bb333333-3333-3333-3333-333333333333',
        'Emergency Reporting Standards',
        'Internal standards for incident documentation.',
        'Use accurate timestamps and verified witness statements.',
        '2026-02-22 08:00:00+07',
        'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
        FALSE
    ),
    (
        'bb444444-4444-4444-4444-444444444444',
        'Public Safety Awareness',
        'Guidelines for community members to improve safety.',
        'Report suspicious activities and avoid unsafe areas.',
        '2026-02-23 08:00:00+07',
        '8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
        TRUE
    );
------------------------------------------------
-- Crime reports
------------------------------------------------
INSERT INTO crime_report (
        id,
        title,
        content,
        date,
        severity,
        number_of_victims,
        number_of_offenders,
        arrested,
        longitude,
        latitude,
        created_at,
        updated_at,
        reporter_id,
        public
    )
VALUES (
        'cc111111-1111-1111-1111-111111111111',
        'Street Robbery',
        'Victim robbed by two individuals on motorcycle.',
        '2026-03-01',
        3,
        1,
        2,
        FALSE,
        106.7009,
        10.7769,
        '2026-03-01 09:00:00+07',
        '2026-03-01 09:00:00+07',
        '686fce27-64a1-4e3b-a471-b00920717bb1',
        TRUE
    ),
    (
        'cc222222-2222-2222-2222-222222222222',
        'Pickpocket Incident',
        'Wallet stolen in crowded market.',
        '2026-03-02',
        2,
        1,
        1,
        FALSE,
        106.7015,
        10.7754,
        '2026-03-02 11:30:00+07',
        '2026-03-02 11:30:00+07',
        '686fce27-64a1-4e3b-a471-b00920717bb1',
        TRUE
    ),
    (
        'cc333333-3333-3333-3333-333333333333',
        'Motorbike Theft',
        'Motorbike stolen from parking area.',
        '2026-03-02',
        3,
        0,
        1,
        TRUE,
        106.7032,
        10.7778,
        '2026-03-02 15:10:00+07',
        '2026-03-02 15:10:00+07',
        '766a99f7-7af1-4613-82a4-c303b2e9ee03',
        TRUE
    ),
    (
        'cc444444-4444-4444-4444-444444444444',
        'Assault Case',
        'Two suspects assaulted a pedestrian.',
        '2026-03-03',
        4,
        1,
        2,
        TRUE,
        106.7045,
        10.7791,
        '2026-03-03 18:00:00+07',
        '2026-03-03 18:00:00+07',
        'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
        FALSE
    ),
    (
        'cc555555-5555-5555-5555-555555555555',
        'Burglary',
        'House break-in reported by homeowner.',
        '2026-03-03',
        4,
        0,
        3,
        FALSE,
        106.6988,
        10.7756,
        '2026-03-03 21:15:00+07',
        '2026-03-03 21:15:00+07',
        '8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
        TRUE
    ),
    (
        'cc666666-6666-6666-6666-666666666666',
        'Phone Snatching',
        'Phone snatched by passing motorbike.',
        '2026-03-04',
        2,
        1,
        1,
        FALSE,
        106.6999,
        10.7748,
        '2026-03-04 08:40:00+07',
        '2026-03-04 08:40:00+07',
        '8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
        TRUE
    );
COMMIT;