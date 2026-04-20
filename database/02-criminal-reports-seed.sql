BEGIN;
------------------------------------------------
-- Reporters
------------------------------------------------
INSERT INTO reporter (id)
VALUES ('686fce27-64a1-4e3b-a471-b00920717bb1'),
    ('766a99f7-7af1-4613-82a4-c303b2e9ee03'),
    ('f5aea0e8-5dbf-442d-8c91-d69ec41a198d'),
    ('8c1c0a9f-9193-4a02-90ea-7c398f73a3e6'),
    ('0e745cb3-5f38-419b-b446-d204c2e15ba9');
------------------------------------------------
-- Missing person report statuses
------------------------------------------------
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
        latitude,
        longitude,
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
        'https://cdn.example.com/photos/a.jpg',
        'nguyenvana@gmail.com',
        '0901000001',
        '2026-03-01',
        'Male, 16 years old, 1.65m tall, slim build. Last seen wearing a white T-shirt and blue jeans near Nguyen Hue Walking Street, District 1. Has a small scar on left cheek. Was heading to a friend''s house but never arrived.',
        10.7769,
        106.7009,
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
        'Male, 72 years old, 1.60m tall, grey hair, walks with a slight limp. Last seen wearing brown pants and a checkered shirt near Ben Thanh Market. Suffers from mild dementia and may be confused about his location.',
        10.7725,
        106.6980,
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
        'Female, 8 years old, 1.25m tall, long black hair with a red hairpin. Last seen wearing a pink school uniform near Phan Dinh Phung Primary School, Phu Nhuan District. Was dismissed from school at 4:30 PM and did not return home.',
        10.7990,
        106.6816,
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
        'Male, 20 years old, 1.72m tall, short black hair, medium build. Last seen on the HCMUT campus in Thu Duc City wearing a blue hoodie and carrying a black backpack. Left the library at 9 PM and has not been contactable since.',
        10.8800,
        106.8050,
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
        'Female, 34 years old, 1.55m tall, shoulder-length black hair. Last seen leaving her factory in Binh Duong Province after the evening shift at 10 PM. Was supposed to take the bus home but the bus driver does not remember seeing her.',
        11.1000,
        106.6500,
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
        'Male, 28 years old, approximately 1.78m tall, short dark hair, wearing glasses. Last seen near Bui Vien Walking Street, District 1. He is a foreign tourist from Singapore and was staying at a nearby guesthouse. His belongings remain in his room.',
        10.7676,
        106.6942,
        '2026-03-04 09:00:00+07',
        '66666666-6666-6666-6666-666666666666',
        '0e745cb3-5f38-419b-b446-d204c2e15ba9',
        'PUBLISHED'
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
        'Steps to file a missing person report: 1) Contact local police within 24 hours. 2) Provide a recent photo and physical description. 3) List last known location and time. 4) Submit the report to the nearest station or via this platform.',
        '2026-02-20 08:00:00+07',
        '686fce27-64a1-4e3b-a471-b00920717bb1',
        TRUE
    ),
    (
        'bb222222-2222-2222-2222-222222222222',
        'Community Crime Reporting Guide',
        'Steps to safely report criminal activity.',
        'To report criminal activity safely: 1) Do not confront the suspect directly. 2) Note description, time, and location. 3) Contact emergency services or submit a report online. 4) If you are a witness, preserve any evidence and cooperate with authorities.',
        '2026-02-21 08:00:00+07',
        '766a99f7-7af1-4613-82a4-c303b2e9ee03',
        TRUE
    ),
    (
        'bb333333-3333-3333-3333-333333333333',
        'Emergency Reporting Standards',
        'Internal standards for incident documentation.',
        'Internal documentation standards require: 1) Accurate timestamps for all events. 2) Witness statements to be collected within 48 hours. 3) Photographic evidence to be uploaded within 24 hours. 4) All reports reviewed by a supervisor before publication.',
        '2026-02-22 08:00:00+07',
        'f5aea0e8-5dbf-442d-8c91-d69ec41a198d',
        FALSE
    ),
    (
        'bb444444-4444-4444-4444-444444444444',
        'Public Safety Awareness',
        'Guidelines for community members to improve safety.',
        'Public safety tips: 1) Stay aware of your surroundings in crowded areas. 2) Avoid displaying valuables in public. 3) Travel in groups at night. 4) Report suspicious activity to local authorities immediately. 5) Keep emergency contacts saved on your phone.',
        '2026-02-23 08:00:00+07',
        '8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',
        TRUE
    ),
    (
        'bb555555-5555-5555-5555-555555555555',
        'City Emergency Protocol',
        'Official protocol for emergency coordination.',
        'City emergency coordination protocol: 1) All incidents are triaged by severity level. 2) High-severity cases are escalated to the Emergency Operations Center within 15 minutes. 3) Public notifications are issued for incidents affecting more than 10 people. 4) Post-incident reviews are conducted within 72 hours.',
        '2026-02-24 08:00:00+07',
        '0e745cb3-5f38-419b-b446-d204c2e15ba9',
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
        'Two suspects on a motorbike snatched a bag from a pedestrian on Nguyen Hue Street. The victim sustained minor injuries to the wrist. Suspects fled northbound.',
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
        'A tourist reported that their wallet was stolen while riding the bus on route 65. The theft occurred between stops near Ben Thanh Market. No physical confrontation.',
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
        'A motorbike was stolen from a residential alley in District 3 while its owner was inside a shop. Security footage showed one suspect used a master key. Suspect was later apprehended nearby.',
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
        'A physical altercation occurred outside a bar on Bui Vien Street. Two suspects assaulted one victim causing bruising and a broken arm. Both suspects were arrested at the scene.',
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
        'Three suspects broke into a ground-floor apartment in District 1 through a window while residents were away. Cash and electronics were taken. Suspects escaped before police arrived.',
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
        'A suspect on a motorbike grabbed a smartphone from a pedestrian who was using the device on the sidewalk near the Notre-Dame Cathedral. Victim was knocked to the ground but uninjured.',
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
    ),
    (
        'cc777777-7777-7777-7777-777777777777',
        'Market Fraud',
        'Two suspects operated a fake currency exchange stall at Binh Tay Market, defrauding at least two foreign tourists of approximately 5 million VND each using counterfeit bills.',
        '2026-03-04',
        3,
        2,
        2,
        FALSE,
        106.7022,
        10.7761,
        '2026-03-04 09:10:00+07',
        '2026-03-04 09:10:00+07',
        '0e745cb3-5f38-419b-b446-d204c2e15ba9',
        TRUE
    );
------------------------------------------------
-- Chat sessions and messages
------------------------------------------------
INSERT INTO chat_session (id, user_id, started_at, document_id)
VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'dd382dcf-3652-499c-acdb-5d9ce99a67b8',
        '2026-04-10T10:00:00Z',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '8c52c01e-42a7-45cc-9254-db8a7601c764',
        '2026-04-11T09:00:00Z',
        '22222222-2222-2222-2222-222222222222'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '4405a37d-bc86-403e-b605-bedd7db88d37',
        '2026-04-12T08:00:00Z',
        '33333333-3333-3333-3333-333333333333'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5',
        '2026-04-12T09:00:00Z',
        '44444444-4444-4444-4444-444444444444'
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'f8f735b4-549c-4d8c-9e10-15f8c198b71b',
        '2026-04-12T10:00:00Z',
        '55555555-5555-5555-5555-555555555555'
    ) ON CONFLICT DO NOTHING;

INSERT INTO chat_message (id, session_id, content, role, created_at)
VALUES (
        '10000000-0000-0000-0000-000000000001',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'You are a crime analysis assistant. Answer based on the document.',
        'USER',
        '2026-04-10T10:00:00Z'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Summarize the robbery case.',
        'USER',
        '2026-04-10T10:00:05Z'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'An armed robbery occurred at a jewelry store involving two masked suspects who stole valuables.',
        'MODEL',
        '2026-04-10T10:00:08Z'
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Were there injuries?',
        'USER',
        '2026-04-10T10:00:15Z'
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'No injuries were reported.',
        'MODEL',
        '2026-04-10T10:00:18Z'
    ),
    (
        '20000000-0000-0000-0000-000000000001',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'You are a cybersecurity assistant. Answer based on the document.',
        'USER',
        '2026-04-11T09:00:00Z'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'What type of attack happened?',
        'USER',
        '2026-04-11T09:00:05Z'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'A ransomware attack encrypted company systems.',
        'MODEL',
        '2026-04-11T09:00:08Z'
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'What was affected?',
        'USER',
        '2026-04-11T09:00:15Z'
    ),
    (
        '20000000-0000-0000-0000-000000000005',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Internal databases and services were impacted.',
        'MODEL',
        '2026-04-11T09:00:18Z'
    ),
    (
        '30000000-0000-0000-0000-000000000001',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'You are a crime assistant. Answer based on the document.',
        'USER',
        '2026-04-12T08:00:00Z'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'What crime was reported?',
        'USER',
        '2026-04-12T08:00:05Z'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'A burglary targeting a residential property was reported.',
        'MODEL',
        '2026-04-12T08:00:08Z'
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Was anything stolen?',
        'USER',
        '2026-04-12T08:00:15Z'
    ),
    (
        '30000000-0000-0000-0000-000000000005',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Electronics and cash were stolen.',
        'MODEL',
        '2026-04-12T08:00:18Z'
    ),
    (
        '40000000-0000-0000-0000-000000000001',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'You are a security assistant. Answer based on the document.',
        'USER',
        '2026-04-12T09:00:00Z'
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Describe the incident.',
        'USER',
        '2026-04-12T09:00:05Z'
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'A coordinated theft occurred at a warehouse facility.',
        'MODEL',
        '2026-04-12T09:00:08Z'
    ),
    (
        '40000000-0000-0000-0000-000000000004',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'How many suspects?',
        'USER',
        '2026-04-12T09:00:15Z'
    ),
    (
        '40000000-0000-0000-0000-000000000005',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Three suspects were involved.',
        'MODEL',
        '2026-04-12T09:00:18Z'
    ),
    (
        '50000000-0000-0000-0000-000000000001',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'You are an incident analysis assistant. Answer based on the document.',
        'USER',
        '2026-04-12T10:00:00Z'
    ),
    (
        '50000000-0000-0000-0000-000000000002',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'What happened in the report?',
        'USER',
        '2026-04-12T10:00:05Z'
    ),
    (
        '50000000-0000-0000-0000-000000000003',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'A data breach exposed internal records of the organization.',
        'MODEL',
        '2026-04-12T10:00:08Z'
    ),
    (
        '50000000-0000-0000-0000-000000000004',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Was sensitive data involved?',
        'USER',
        '2026-04-12T10:00:15Z'
    ),
    (
        '50000000-0000-0000-0000-000000000005',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Yes, personal and financial data were affected.',
        'MODEL',
        '2026-04-12T10:00:18Z'
    ) ON CONFLICT DO NOTHING;
COMMIT;
