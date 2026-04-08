BEGIN;

------------------------------------------------
-- New Reporters (10 more)
------------------------------------------------
INSERT INTO reporter (id) VALUES
    ('c0000001-c000-4000-8000-c00000000001'),
    ('c0000002-c000-4000-8000-c00000000002'),
    ('c0000003-c000-4000-8000-c00000000003'),
    ('c0000004-c000-4000-8000-c00000000004'),
    ('c0000005-c000-4000-8000-c00000000005'),
    ('c0000006-c000-4000-8000-c00000000006'),
    ('c0000007-c000-4000-8000-c00000000007'),
    ('c0000008-c000-4000-8000-c00000000008'),
    ('c0000009-c000-4000-8000-c00000000009'),
    ('c000000a-c000-4000-8000-c0000000000a')
ON CONFLICT (id) DO NOTHING;

------------------------------------------------
-- Missing Person Reports (20 more)
------------------------------------------------
INSERT INTO missing_person_report (
    id, title, full_name, personal_id, photo, contact_email, contact_phone,
    date, content, created_at, user_id, reporter_id, status_name
) VALUES
(
    'f0000001-f000-4000-8000-f00000000001',
    'Missing University Student',
    'Nguyen Thi Hoa',
    'ID100001',
    'https://cdn.example.com/photos/hoa.jpg',
    'hoanguyen@gmail.com',
    '0901100001',
    '2026-03-05',
    'https://cdn.example.com/files/missing-person-reports/report-f0000001.pdf',
    '2026-03-05 08:00:00+07',
    'b0000001-b000-4000-8000-b00000000001',
    'c0000001-c000-4000-8000-c00000000001',
    'PENDING'
),
(
    'f0000002-f000-4000-8000-f00000000002',
    'Missing Factory Worker',
    'Tran Van Duc',
    'ID100002',
    'https://cdn.example.com/photos/duc.jpg',
    'ducvan@gmail.com',
    '0901100002',
    '2026-03-05',
    'https://cdn.example.com/files/missing-person-reports/report-f0000002.pdf',
    '2026-03-05 09:30:00+07',
    'b0000002-b000-4000-8000-b00000000002',
    'c0000001-c000-4000-8000-c00000000001',
    'PUBLISHED'
),
(
    'f0000003-f000-4000-8000-f00000000003',
    'Missing Grandmother',
    'Le Thi Mai',
    'ID100003',
    'https://cdn.example.com/photos/mai.jpg',
    'maile@gmail.com',
    '0901100003',
    '2026-03-06',
    'https://cdn.example.com/files/missing-person-reports/report-f0000003.pdf',
    '2026-03-06 07:45:00+07',
    'b0000003-b000-4000-8000-b00000000003',
    'c0000002-c000-4000-8000-c00000000002',
    'REJECTED'
),
(
    'f0000004-f000-4000-8000-f00000000004',
    'Missing High School Boy',
    'Pham Van Khoa',
    'ID100004',
    'https://cdn.example.com/photos/khoa.jpg',
    'khoapham@gmail.com',
    '0901100004',
    '2026-03-06',
    'https://cdn.example.com/files/missing-person-reports/report-f0000004.pdf',
    '2026-03-06 11:00:00+07',
    'b0000004-b000-4000-8000-b00000000004',
    'c0000002-c000-4000-8000-c00000000002',
    'PUBLISHED'
),
(
    'f0000005-f000-4000-8000-f00000000005',
    'Missing Market Vendor',
    'Vo Thi Lan',
    'ID100005',
    'https://cdn.example.com/photos/lan.jpg',
    'lanvo@gmail.com',
    '0901100005',
    '2026-03-07',
    'https://cdn.example.com/files/missing-person-reports/report-f0000005.pdf',
    '2026-03-07 08:20:00+07',
    'b0000005-b000-4000-8000-b00000000005',
    'c0000003-c000-4000-8000-c00000000003',
    'PENDING'
),
(
    'f0000006-f000-4000-8000-f00000000006',
    'Missing Taxi Driver',
    'Bui Van Minh',
    'ID100006',
    NULL,
    'minhbui@gmail.com',
    '0901100006',
    '2026-03-07',
    'https://cdn.example.com/files/missing-person-reports/report-f0000006.pdf',
    '2026-03-07 13:00:00+07',
    'b0000006-b000-4000-8000-b00000000006',
    'c0000003-c000-4000-8000-c00000000003',
    'PUBLISHED'
),
(
    'f0000007-f000-4000-8000-f00000000007',
    'Missing Elderly Woman',
    'Dang Thi Thu',
    'ID100007',
    'https://cdn.example.com/photos/thu.jpg',
    'thudang@gmail.com',
    '0901100007',
    '2026-03-08',
    'https://cdn.example.com/files/missing-person-reports/report-f0000007.pdf',
    '2026-03-08 06:30:00+07',
    'b0000007-b000-4000-8000-b00000000007',
    'c0000004-c000-4000-8000-c00000000004',
    'PENDING'
),
(
    'f0000008-f000-4000-8000-f00000000008',
    'Missing Street Vendor',
    'Do Van Hung',
    'ID100008',
    'https://cdn.example.com/photos/hung.jpg',
    'hungdo@gmail.com',
    '0901100008',
    '2026-03-08',
    'https://cdn.example.com/files/missing-person-reports/report-f0000008.pdf',
    '2026-03-08 10:15:00+07',
    'b0000008-b000-4000-8000-b00000000008',
    'c0000004-c000-4000-8000-c00000000004',
    'REJECTED'
),
(
    'f0000009-f000-4000-8000-f00000000009',
    'Missing Foreign Tourist',
    'Sarah Johnson',
    'ID100009',
    'https://cdn.example.com/photos/sarah.jpg',
    'sarah.j@email.com',
    '0901100009',
    '2026-03-09',
    'https://cdn.example.com/files/missing-person-reports/report-f0000009.pdf',
    '2026-03-09 14:00:00+07',
    'b0000009-b000-4000-8000-b00000000009',
    'c0000005-c000-4000-8000-c00000000005',
    'PUBLISHED'
),
(
    'f000000a-f000-4000-8000-f0000000000a',
    'Missing Delivery Man',
    'Ngo Van Tuan',
    'ID100010',
    'https://cdn.example.com/photos/tuan.jpg',
    'tuanngo@gmail.com',
    '0901100010',
    '2026-03-09',
    'https://cdn.example.com/files/missing-person-reports/report-f000000a.pdf',
    '2026-03-09 16:45:00+07',
    'b000000a-b000-4000-8000-b0000000000a',
    'c0000005-c000-4000-8000-c00000000005',
    'PENDING'
),
(
    'f000000b-f000-4000-8000-f0000000000b',
    'Missing Teacher',
    'Hoang Thi Yen',
    'ID100011',
    'https://cdn.example.com/photos/yen.jpg',
    'yenhoang@gmail.com',
    '0901100011',
    '2026-03-10',
    'https://cdn.example.com/files/missing-person-reports/report-f000000b.pdf',
    '2026-03-10 09:00:00+07',
    'b000000b-b000-4000-8000-b0000000000b',
    'c0000006-c000-4000-8000-c00000000006',
    'PUBLISHED'
),
(
    'f000000c-f000-4000-8000-f0000000000c',
    'Missing Construction Worker',
    'Nguyen Van Son',
    'ID100012',
    NULL,
    'sonnguyen@gmail.com',
    '0901100012',
    '2026-03-10',
    'https://cdn.example.com/files/missing-person-reports/report-f000000c.pdf',
    '2026-03-10 11:30:00+07',
    'b000000c-b000-4000-8000-b0000000000c',
    'c0000006-c000-4000-8000-c00000000006',
    'PENDING'
),
(
    'f000000d-f000-4000-8000-f0000000000d',
    'Missing Nurse',
    'Tran Thi Bich',
    'ID100013',
    'https://cdn.example.com/photos/bich.jpg',
    'bichtran@gmail.com',
    '0901100013',
    '2026-03-11',
    'https://cdn.example.com/files/missing-person-reports/report-f000000d.pdf',
    '2026-03-11 07:00:00+07',
    'b000000d-b000-4000-8000-b0000000000d',
    'c0000007-c000-4000-8000-c00000000007',
    'REJECTED'
),
(
    'f000000e-f000-4000-8000-f0000000000e',
    'Missing Shopkeeper',
    'Le Van Thanh',
    'ID100014',
    'https://cdn.example.com/photos/thanh.jpg',
    'thanhole@gmail.com',
    '0901100014',
    '2026-03-11',
    'https://cdn.example.com/files/missing-person-reports/report-f000000e.pdf',
    '2026-03-11 14:20:00+07',
    'b000000e-b000-4000-8000-b0000000000e',
    'c0000007-c000-4000-8000-c00000000007',
    'PUBLISHED'
),
(
    'f000000f-f000-4000-8000-f0000000000f',
    'Missing Fisherman',
    'Pham Van Long',
    'ID100015',
    'https://cdn.example.com/photos/long.jpg',
    'longpham@gmail.com',
    '0901100015',
    '2026-03-12',
    'https://cdn.example.com/files/missing-person-reports/report-f000000f.pdf',
    '2026-03-12 05:30:00+07',
    'b000000f-b000-4000-8000-b0000000000f',
    'c0000008-c000-4000-8000-c00000000008',
    'PENDING'
),
(
    'f0000010-f000-4000-8000-f00000000010',
    'Missing Mechanic',
    'Vo Van Khanh',
    'ID100016',
    'https://cdn.example.com/photos/khanh.jpg',
    'khanhvo@gmail.com',
    '0901100016',
    '2026-03-12',
    'https://cdn.example.com/files/missing-person-reports/report-f0000010.pdf',
    '2026-03-12 12:00:00+07',
    'b0000010-b000-4000-8000-b00000000010',
    'c0000008-c000-4000-8000-c00000000008',
    'PUBLISHED'
),
(
    'f0000011-f000-4000-8000-f00000000011',
    'Missing Cleaner',
    'Bui Thi Hien',
    'ID100017',
    NULL,
    'hienbui@gmail.com',
    '0901100017',
    '2026-03-13',
    'https://cdn.example.com/files/missing-person-reports/report-f0000011.pdf',
    '2026-03-13 08:45:00+07',
    'b0000011-b000-4000-8000-b00000000011',
    'c0000009-c000-4000-8000-c00000000009',
    'PENDING'
),
(
    'f0000012-f000-4000-8000-f00000000012',
    'Missing Journalist',
    'Dang Van Quoc',
    'ID100018',
    'https://cdn.example.com/photos/quoc.jpg',
    'quocdang@gmail.com',
    '0901100018',
    '2026-03-13',
    'https://cdn.example.com/files/missing-person-reports/report-f0000012.pdf',
    '2026-03-13 10:30:00+07',
    'b0000012-b000-4000-8000-b00000000012',
    'c0000009-c000-4000-8000-c00000000009',
    'REJECTED'
),
(
    'f0000013-f000-4000-8000-f00000000013',
    'Missing Pharmacist',
    'Do Thi Ngoc',
    'ID100019',
    'https://cdn.example.com/photos/ngoc.jpg',
    'ngocdo@gmail.com',
    '0901100019',
    '2026-03-14',
    'https://cdn.example.com/files/missing-person-reports/report-f0000013.pdf',
    '2026-03-14 09:15:00+07',
    'b0000013-b000-4000-8000-b00000000013',
    'c000000a-c000-4000-8000-c0000000000a',
    'PUBLISHED'
),
(
    'f0000014-f000-4000-8000-f00000000014',
    'Missing Retired Officer',
    'Ngo Van Binh',
    'ID100020',
    'https://cdn.example.com/photos/binh.jpg',
    'binhngo@gmail.com',
    '0901100020',
    '2026-03-14',
    'https://cdn.example.com/files/missing-person-reports/report-f0000014.pdf',
    '2026-03-14 15:00:00+07',
    'b0000014-b000-4000-8000-b00000000014',
    'c000000a-c000-4000-8000-c0000000000a',
    'PENDING'
);

------------------------------------------------
-- Guidelines Documents (20 more)
------------------------------------------------
INSERT INTO guidelines_document (
    id, title, abstract, content, created_at, reporter_id, public
) VALUES
(
    'f1000001-f100-4000-8000-f10000000001',
    'Child Safety Guidelines',
    'Steps for protecting children from abduction.',
    'https://cdn.example.com/files/guidelines/child-safety.pdf',
    '2026-03-01 08:00:00+07',
    'c0000001-c000-4000-8000-c00000000001',
    TRUE
),
(
    'f1000002-f100-4000-8000-f10000000002',
    'Elder Care Safety Protocol',
    'Procedures for tracking and protecting elderly citizens.',
    'https://cdn.example.com/files/guidelines/elder-care.pdf',
    '2026-03-01 09:00:00+07',
    'c0000001-c000-4000-8000-c00000000001',
    FALSE
),
(
    'f1000003-f100-4000-8000-f10000000003',
    'Tourist Safety Manual',
    'Guidance for tourists to stay safe in the city.',
    'https://cdn.example.com/files/guidelines/tourist-safety.pdf',
    '2026-03-02 08:00:00+07',
    'c0000002-c000-4000-8000-c00000000002',
    TRUE
),
(
    'f1000004-f100-4000-8000-f10000000004',
    'Night Safety Tips',
    'Recommendations for staying safe at night.',
    'https://cdn.example.com/files/guidelines/night-safety.pdf',
    '2026-03-02 10:00:00+07',
    'c0000002-c000-4000-8000-c00000000002',
    TRUE
),
(
    'f1000005-f100-4000-8000-f10000000005',
    'Vehicle Theft Prevention',
    'Tips to prevent theft of motorbikes and cars.',
    'https://cdn.example.com/files/guidelines/vehicle-theft-prevention.pdf',
    '2026-03-03 08:00:00+07',
    'c0000003-c000-4000-8000-c00000000003',
    TRUE
),
(
    'f1000006-f100-4000-8000-f10000000006',
    'Digital Safety Guide',
    'How to stay safe online and avoid scams.',
    'https://cdn.example.com/files/guidelines/digital-safety.pdf',
    '2026-03-03 11:00:00+07',
    'c0000003-c000-4000-8000-c00000000003',
    FALSE
),
(
    'f1000007-f100-4000-8000-f10000000007',
    'Public Transport Safety',
    'Safety tips when using buses and trains.',
    'https://cdn.example.com/files/guidelines/public-transport-safety.pdf',
    '2026-03-04 08:00:00+07',
    'c0000004-c000-4000-8000-c00000000004',
    TRUE
),
(
    'f1000008-f100-4000-8000-f10000000008',
    'Market Area Crime Watch',
    'Guidance for vendors and shoppers in market areas.',
    'https://cdn.example.com/files/guidelines/market-area-crime-watch.pdf',
    '2026-03-04 09:30:00+07',
    'c0000004-c000-4000-8000-c00000000004',
    TRUE
),
(
    'f1000009-f100-4000-8000-f10000000009',
    'School Zone Safety',
    'Rules and guidelines for school zone security.',
    'https://cdn.example.com/files/guidelines/school-zone-safety.pdf',
    '2026-03-05 08:00:00+07',
    'c0000005-c000-4000-8000-c00000000005',
    TRUE
),
(
    'f100000a-f100-4000-8000-f1000000000a',
    'Domestic Violence Response',
    'Internal procedures for handling domestic violence reports.',
    'https://cdn.example.com/files/guidelines/domestic-violence-response.pdf',
    '2026-03-05 14:00:00+07',
    'c0000005-c000-4000-8000-c00000000005',
    FALSE
),
(
    'f100000b-f100-4000-8000-f1000000000b',
    'Fire Safety and Emergency Evacuation',
    'Evacuation procedures for buildings and public spaces.',
    'https://cdn.example.com/files/guidelines/fire-safety-evacuation.pdf',
    '2026-03-06 08:00:00+07',
    'c0000006-c000-4000-8000-c00000000006',
    TRUE
),
(
    'f100000c-f100-4000-8000-f1000000000c',
    'Flood Safety Protocol',
    'Actions to take during flooding events.',
    'https://cdn.example.com/files/guidelines/flood-safety.pdf',
    '2026-03-06 10:00:00+07',
    'c0000006-c000-4000-8000-c00000000006',
    TRUE
),
(
    'f100000d-f100-4000-8000-f1000000000d',
    'Police Station Locations',
    'Guide to finding and contacting local police stations.',
    'https://cdn.example.com/files/guidelines/police-stations.pdf',
    '2026-03-07 08:00:00+07',
    'c0000007-c000-4000-8000-c00000000007',
    TRUE
),
(
    'f100000e-f100-4000-8000-f1000000000e',
    'Cybercrime Reporting Steps',
    'How to file a cybercrime report with authorities.',
    'https://cdn.example.com/files/guidelines/cybercrime-reporting.pdf',
    '2026-03-07 13:00:00+07',
    'c0000007-c000-4000-8000-c00000000007',
    FALSE
),
(
    'f100000f-f100-4000-8000-f1000000000f',
    'Drug Trafficking Reporting',
    'Confidential reporting procedures for drug-related crimes.',
    'https://cdn.example.com/files/guidelines/drug-trafficking-reporting.pdf',
    '2026-03-08 08:00:00+07',
    'c0000008-c000-4000-8000-c00000000008',
    FALSE
),
(
    'f1000010-f100-4000-8000-f10000000010',
    'Road Accident Reporting',
    'Procedures to follow after a road traffic accident.',
    'https://cdn.example.com/files/guidelines/road-accident-reporting.pdf',
    '2026-03-08 11:00:00+07',
    'c0000008-c000-4000-8000-c00000000008',
    TRUE
),
(
    'f1000011-f100-4000-8000-f10000000011',
    'Gang Activity Awareness',
    'How to identify and safely report gang activity.',
    'https://cdn.example.com/files/guidelines/gang-activity-awareness.pdf',
    '2026-03-09 08:00:00+07',
    'c0000009-c000-4000-8000-c00000000009',
    FALSE
),
(
    'f1000012-f100-4000-8000-f10000000012',
    'ATM Security Tips',
    'How to stay safe when using ATM machines.',
    'https://cdn.example.com/files/guidelines/atm-security.pdf',
    '2026-03-09 10:00:00+07',
    'c0000009-c000-4000-8000-c00000000009',
    TRUE
),
(
    'f1000013-f100-4000-8000-f10000000013',
    'Witness Protection Information',
    'Rights and support available for crime witnesses.',
    'https://cdn.example.com/files/guidelines/witness-protection.pdf',
    '2026-03-10 08:00:00+07',
    'c000000a-c000-4000-8000-c0000000000a',
    FALSE
),
(
    'f1000014-f100-4000-8000-f10000000014',
    'Community Watch Program Guide',
    'How to set up and run a neighborhood watch program.',
    'https://cdn.example.com/files/guidelines/community-watch.pdf',
    '2026-03-10 14:00:00+07',
    'c000000a-c000-4000-8000-c0000000000a',
    TRUE
);

------------------------------------------------
-- Crime Reports (20 more)
------------------------------------------------
INSERT INTO crime_report (
    id, title, content, date, severity, number_of_victims,
    number_of_offenders, arrested, longitude, latitude,
    created_at, updated_at, reporter_id, public
) VALUES
(
    'f2000001-f200-4000-8000-f20000000001',
    'ATM Card Skimming',
    'https://cdn.example.com/files/crime-reports/atm-skimming-f2000001.pdf',
    '2026-03-05', 2, 3, 1, FALSE, 106.6975, 10.7760,
    '2026-03-05 08:30:00+07', '2026-03-05 08:30:00+07',
    'c0000001-c000-4000-8000-c00000000001', TRUE
),
(
    'f2000002-f200-4000-8000-f20000000002',
    'Residential Break-In',
    'https://cdn.example.com/files/crime-reports/break-in-f2000002.pdf',
    '2026-03-05', 4, 0, 2, TRUE, 106.7050, 10.7800,
    '2026-03-05 11:00:00+07', '2026-03-05 11:00:00+07',
    'c0000001-c000-4000-8000-c00000000001', FALSE
),
(
    'f2000003-f200-4000-8000-f20000000003',
    'Drug Possession Arrest',
    'https://cdn.example.com/files/crime-reports/drug-possession-f2000003.pdf',
    '2026-03-06', 3, 0, 1, TRUE, 106.6992, 10.7742,
    '2026-03-06 14:20:00+07', '2026-03-06 14:20:00+07',
    'c0000002-c000-4000-8000-c00000000002', TRUE
),
(
    'f2000004-f200-4000-8000-f20000000004',
    'Online Scam',
    'https://cdn.example.com/files/crime-reports/online-scam-f2000004.pdf',
    '2026-03-06', 2, 5, 1, FALSE, 106.7018, 10.7768,
    '2026-03-06 10:00:00+07', '2026-03-06 10:00:00+07',
    'c0000002-c000-4000-8000-c00000000002', TRUE
),
(
    'f2000005-f200-4000-8000-f20000000005',
    'Motorbike Street Racing',
    'https://cdn.example.com/files/crime-reports/racing-f2000005.pdf',
    '2026-03-07', 1, 0, 4, TRUE, 106.7025, 10.7755,
    '2026-03-07 22:30:00+07', '2026-03-07 22:30:00+07',
    'c0000003-c000-4000-8000-c00000000003', TRUE
),
(
    'f2000006-f200-4000-8000-f20000000006',
    'Knife Threat at Restaurant',
    'https://cdn.example.com/files/crime-reports/knife-threat-f2000006.pdf',
    '2026-03-07', 4, 2, 1, TRUE, 106.7038, 10.7783,
    '2026-03-07 19:45:00+07', '2026-03-07 19:45:00+07',
    'c0000003-c000-4000-8000-c00000000003', FALSE
),
(
    'f2000007-f200-4000-8000-f20000000007',
    'Shop Vandalism',
    'https://cdn.example.com/files/crime-reports/vandalism-f2000007.pdf',
    '2026-03-08', 2, 0, 3, FALSE, 106.6968, 10.7748,
    '2026-03-08 02:15:00+07', '2026-03-08 02:15:00+07',
    'c0000004-c000-4000-8000-c00000000004', TRUE
),
(
    'f2000008-f200-4000-8000-f20000000008',
    'Land Dispute Assault',
    'https://cdn.example.com/files/crime-reports/land-dispute-f2000008.pdf',
    '2026-03-08', 3, 1, 2, FALSE, 106.7055, 10.7812,
    '2026-03-08 09:00:00+07', '2026-03-08 09:00:00+07',
    'c0000004-c000-4000-8000-c00000000004', TRUE
),
(
    'f2000009-f200-4000-8000-f20000000009',
    'Drunk Driving Accident',
    'https://cdn.example.com/files/crime-reports/drunk-driving-f2000009.pdf',
    '2026-03-09', 3, 2, 1, TRUE, 106.7003, 10.7763,
    '2026-03-09 23:50:00+07', '2026-03-09 23:50:00+07',
    'c0000005-c000-4000-8000-c00000000005', TRUE
),
(
    'f200000a-f200-4000-8000-f2000000000a',
    'Counterfeit Currency',
    'https://cdn.example.com/files/crime-reports/counterfeit-f200000a.pdf',
    '2026-03-09', 3, 4, 2, FALSE, 106.7012, 10.7771,
    '2026-03-09 15:30:00+07', '2026-03-09 15:30:00+07',
    'c0000005-c000-4000-8000-c00000000005', FALSE
),
(
    'f200000b-f200-4000-8000-f2000000000b',
    'Human Trafficking Tip',
    'https://cdn.example.com/files/crime-reports/trafficking-f200000b.pdf',
    '2026-03-10', 5, 3, 2, FALSE, 106.6980, 10.7735,
    '2026-03-10 07:00:00+07', '2026-03-10 07:00:00+07',
    'c0000006-c000-4000-8000-c00000000006', FALSE
),
(
    'f200000c-f200-4000-8000-f2000000000c',
    'Apartment Theft',
    'https://cdn.example.com/files/crime-reports/apartment-theft-f200000c.pdf',
    '2026-03-10', 3, 1, 1, TRUE, 106.7042, 10.7794,
    '2026-03-10 11:00:00+07', '2026-03-10 11:00:00+07',
    'c0000006-c000-4000-8000-c00000000006', TRUE
),
(
    'f200000d-f200-4000-8000-f2000000000d',
    'Bribery Case',
    'https://cdn.example.com/files/crime-reports/bribery-f200000d.pdf',
    '2026-03-11', 4, 0, 1, TRUE, 106.7019, 10.7758,
    '2026-03-11 09:20:00+07', '2026-03-11 09:20:00+07',
    'c0000007-c000-4000-8000-c00000000007', FALSE
),
(
    'f200000e-f200-4000-8000-f2000000000e',
    'Illegal Gambling Den',
    'https://cdn.example.com/files/crime-reports/gambling-f200000e.pdf',
    '2026-03-11', 3, 10, 5, TRUE, 106.6995, 10.7751,
    '2026-03-11 21:00:00+07', '2026-03-11 21:00:00+07',
    'c0000007-c000-4000-8000-c00000000007', TRUE
),
(
    'f200000f-f200-4000-8000-f2000000000f',
    'Bag Snatching on Bridge',
    'https://cdn.example.com/files/crime-reports/bag-snatch-f200000f.pdf',
    '2026-03-12', 2, 1, 1, FALSE, 106.7007, 10.7767,
    '2026-03-12 17:30:00+07', '2026-03-12 17:30:00+07',
    'c0000008-c000-4000-8000-c00000000008', TRUE
),
(
    'f2000010-f200-4000-8000-f20000000010',
    'Identity Theft',
    'https://cdn.example.com/files/crime-reports/identity-theft-f2000010.pdf',
    '2026-03-12', 3, 2, 1, FALSE, 106.7033, 10.7779,
    '2026-03-12 10:00:00+07', '2026-03-12 10:00:00+07',
    'c0000008-c000-4000-8000-c00000000008', FALSE
),
(
    'f2000011-f200-4000-8000-f20000000011',
    'Arson at Warehouse',
    'https://cdn.example.com/files/crime-reports/arson-f2000011.pdf',
    '2026-03-13', 5, 0, 1, TRUE, 106.6960, 10.7730,
    '2026-03-13 03:45:00+07', '2026-03-13 03:45:00+07',
    'c0000009-c000-4000-8000-c00000000009', TRUE
),
(
    'f2000012-f200-4000-8000-f20000000012',
    'Carjacking Attempt',
    'https://cdn.example.com/files/crime-reports/carjacking-f2000012.pdf',
    '2026-03-13', 4, 1, 2, FALSE, 106.7047, 10.7803,
    '2026-03-13 20:10:00+07', '2026-03-13 20:10:00+07',
    'c0000009-c000-4000-8000-c00000000009', TRUE
),
(
    'f2000013-f200-4000-8000-f20000000013',
    'Fake Product Sales',
    'https://cdn.example.com/files/crime-reports/fake-products-f2000013.pdf',
    '2026-03-14', 2, 8, 2, TRUE, 106.7021, 10.7764,
    '2026-03-14 13:00:00+07', '2026-03-14 13:00:00+07',
    'c000000a-c000-4000-8000-c0000000000a', TRUE
),
(
    'f2000014-f200-4000-8000-f20000000014',
    'Workplace Harassment',
    'https://cdn.example.com/files/crime-reports/harassment-f2000014.pdf',
    '2026-03-14', 3, 1, 1, FALSE, 106.7028, 10.7772,
    '2026-03-14 16:00:00+07', '2026-03-14 16:00:00+07',
    'c000000a-c000-4000-8000-c0000000000a', FALSE
);

COMMIT;
