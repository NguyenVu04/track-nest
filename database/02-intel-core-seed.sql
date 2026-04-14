BEGIN;
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