BEGIN;
------------------------------------------------
-- Reporters
------------------------------------------------
INSERT INTO reporter (id, username)
VALUES ('686fce27-64a1-4e3b-a471-b00920717bb1', 'reporter1'),
    ('766a99f7-7af1-4613-82a4-c303b2e9ee03', 'reporter2'),
    ('f5aea0e8-5dbf-442d-8c91-d69ec41a198d', 'reporter3'),
    ('8c1c0a9f-9193-4a02-90ea-7c398f73a3e6', 'reporter4'),
    ('0e745cb3-5f38-419b-b446-d204c2e15ba9', 'admin') ON CONFLICT (id) DO NOTHING;
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
    id, title, full_name, personal_id, photo,
    contact_email, contact_phone, date, content,
    latitude, longitude, created_at, user_id, reporter_id, status_name
)
VALUES
('f0000001-f000-4000-8000-f00000000001','Sinh viên mất tích','Nguyen Thi Hoa','ID100001',
'https://placehold.co/600x400','hoanguyen@gmail.com','0901100001','2026-03-05',
'Nguyen Thi Hoa, 21 tuổi, được nhìn thấy lần cuối gần khuôn viên trường vào khoảng 19h30. Cô mặc áo trắng, quần jean xanh và mang balo đen. Nhân chứng cho biết cô đã lên một chiếc taxi nhưng không rõ điểm đến. Gia đình không thể liên lạc từ thời điểm đó.',
10.8800,106.8050,'2026-03-05 08:00:00+07','dd382dcf-3652-499c-acdb-5d9ce99a67b8','686fce27-64a1-4e3b-a471-b00920717bb1','PENDING'),

('f0000002-f000-4000-8000-f00000000002','Công nhân mất tích','Tran Van Duc','ID100002',
'https://placehold.co/600x400','ducvan@gmail.com','0901100002','2026-03-05',
'Tran Van Duc, 34 tuổi, rời nhà máy sau ca làm nhưng không về nhà. Xe máy của anh được phát hiện tại một khu đất trống. Không có dấu hiệu xô xát, nhưng vụ việc vẫn đang được điều tra.',
10.7500,106.6100,'2026-03-05 09:30:00+07','8c52c01e-42a7-45cc-9254-db8a7601c764','766a99f7-7af1-4613-82a4-c303b2e9ee03','PUBLISHED'),

('f0000003-f000-4000-8000-f00000000003','Cụ bà mất tích','Le Thi Mai','ID100003',
'https://placehold.co/600x400','maile@gmail.com','0901100003','2026-03-06',
'Bà Lê Thị Mai, 72 tuổi, rời nhà vào sáng sớm và chưa quay về. Bà có dấu hiệu suy giảm trí nhớ và có thể bị lạc. Lần cuối được thấy gần khu chợ địa phương.',
10.8380,106.6650,'2026-03-06 07:45:00+07','4405a37d-bc86-403e-b605-bedd7db88d37','f5aea0e8-5dbf-442d-8c91-d69ec41a198d','REJECTED'),

('f0000004-f000-4000-8000-f00000000004','Học sinh mất tích','Pham Van Khoa','ID100004',
'https://placehold.co/600x400','khoapham@gmail.com','0901100004','2026-03-06',
'Phạm Văn Khoa không về nhà sau giờ học. Bạn bè cho biết em rời trường một mình. Điện thoại đã tắt từ buổi tối cùng ngày.',
10.7550,106.6680,'2026-03-06 11:00:00+07','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','f5aea0e8-5dbf-442d-8c91-d69ec41a198d','PUBLISHED'),

('f0000005-f000-4000-8000-f00000000005','Tiểu thương mất tích','Vo Thi Lan','ID100005',
'https://placehold.co/600x400','lanvo@gmail.com','0901100005','2026-03-07',
'Võ Thị Lan được nhìn thấy lần cuối khi dọn hàng tại chợ. Sau đó không về nhà. Những người xung quanh không ghi nhận bất thường.',
10.8000,106.6450,'2026-03-07 08:20:00+07','f8f735b4-549c-4d8c-9e10-15f8c198b71b','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6','PENDING'),

('f0000006-f000-4000-8000-f00000000006','Tài xế taxi mất tích','Bui Van Minh','ID100006',
'https://placehold.co/600x400','minhbui@gmail.com','0901100006','2026-03-07',
'Bùi Văn Minh mất liên lạc khi đang chạy xe. Xe taxi được tìm thấy nhưng không có hành khách. Dữ liệu GPS bị gián đoạn đột ngột.',
10.6900,106.7300,'2026-03-07 13:00:00+07','dd382dcf-3652-499c-acdb-5d9ce99a67b8','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6','PUBLISHED'),

('f0000007-f000-4000-8000-f00000000007','Người già mất tích','Dang Thi Thu','ID100007',
'https://placehold.co/600x400','thudang@gmail.com','0901100007','2026-03-08',
'Đặng Thị Thu, 68 tuổi, rời nhà vào sáng sớm. Bà có dấu hiệu lú lẫn và có thể đi lạc khỏi khu vực sinh sống.',
10.8150,106.7100,'2026-03-08 06:30:00+07','8c52c01e-42a7-45cc-9254-db8a7601c764','0e745cb3-5f38-419b-b446-d204c2e15ba9','PENDING'),

('f0000008-f000-4000-8000-f00000000008','Người bán hàng rong mất tích','Do Van Hung','ID100008',
'https://placehold.co/600x400','hungdo@gmail.com','0901100008','2026-03-08',
'Đỗ Văn Hùng biến mất khi đang bán hàng. Xe đẩy vẫn còn tại chỗ. Có dấu hiệu nghi vấn cần điều tra thêm.',
10.7730,106.7020,'2026-03-08 10:15:00+07','4405a37d-bc86-403e-b605-bedd7db88d37','0e745cb3-5f38-419b-b446-d204c2e15ba9','REJECTED'),

('f0000009-f000-4000-8000-f00000000009','Khách du lịch mất tích','Sarah Johnson','ID100009',
'https://placehold.co/600x400','sarah.j@email.com','0901100009','2026-03-09',
'Sarah Johnson được nhìn thấy lần cuối tại khu trung tâm. Khách sạn xác nhận cô không quay lại phòng. Hành lý vẫn còn nguyên.',
10.7676,106.6942,'2026-03-09 14:00:00+07','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','686fce27-64a1-4e3b-a471-b00920717bb1','PUBLISHED'),

('f000000a-f000-4000-8000-f0000000000a','Nhân viên giao hàng mất tích','Ngo Van Tuan','ID100010',
'https://placehold.co/600x400','tuanngo@gmail.com','0901100010','2026-03-09',
'Ngô Văn Tuấn mất liên lạc khi đang giao hàng. Lộ trình giao hàng chưa hoàn tất và điện thoại không thể liên hệ.',
10.8530,106.7150,'2026-03-09 16:45:00+07','f8f735b4-549c-4d8c-9e10-15f8c198b71b','686fce27-64a1-4e3b-a471-b00920717bb1','PENDING'),

('f000000b-f000-4000-8000-f0000000000b','Giáo viên mất tích','Hoang Thi Yen','ID100011',
'https://placehold.co/600x400','yenhoang@gmail.com','0901100011','2026-03-10',
'Hoàng Thị Yến không đến trường giảng dạy và mất liên lạc từ sáng. Không có dấu hiệu bất thường trước đó.',
10.7850,106.6900,'2026-03-10 09:00:00+07','dd382dcf-3652-499c-acdb-5d9ce99a67b8','766a99f7-7af1-4613-82a4-c303b2e9ee03','PUBLISHED'),

('f000000c-f000-4000-8000-f0000000000c','Công nhân xây dựng mất tích','Nguyen Van Son','ID100012',
'https://placehold.co/600x400','sonnguyen@gmail.com','0901100012','2026-03-10',
'Nguyễn Văn Sơn biến mất trong giờ nghỉ tại công trường. Không quay lại làm việc sau đó.',
10.8780,106.7980,'2026-03-10 11:30:00+07','8c52c01e-42a7-45cc-9254-db8a7601c764','766a99f7-7af1-4613-82a4-c303b2e9ee03','PENDING'),

('f000000d-f000-4000-8000-f0000000000d','Y tá mất tích','Tran Thi Bich','ID100013',
'https://placehold.co/600x400','bichtran@gmail.com','0901100013','2026-03-11',
'Trần Thị Bích không đến ca trực tại bệnh viện. Đồng nghiệp xác nhận cô đã rời nhà nhưng không tới nơi làm việc.',
10.7990,106.6800,'2026-03-11 07:00:00+07','4405a37d-bc86-403e-b605-bedd7db88d37','f5aea0e8-5dbf-442d-8c91-d69ec41a198d','REJECTED'),

('f000000e-f000-4000-8000-f0000000000e','Chủ cửa hàng mất tích','Le Van Thanh','ID100014',
'https://placehold.co/600x400','thanhole@gmail.com','0901100014','2026-03-11',
'Lê Văn Thanh đóng cửa hàng như bình thường nhưng không về nhà. Không có dấu hiệu trộm cắp tại cửa hàng.',
10.7720,106.6680,'2026-03-11 14:20:00+07','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','f5aea0e8-5dbf-442d-8c91-d69ec41a198d','PUBLISHED'),

('f000000f-f000-4000-8000-f0000000000f','Ngư dân mất tích','Pham Van Long','ID100015',
'https://placehold.co/600x400','longpham@gmail.com','0901100015','2026-03-12',
'Phạm Văn Long đi đánh cá sáng sớm nhưng không quay về. Thuyền được tìm thấy trôi dạt không có người.',
10.4100,106.9600,'2026-03-12 05:30:00+07','f8f735b4-549c-4d8c-9e10-15f8c198b71b','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6','PENDING'),

('f0000010-f000-4000-8000-f00000000010','Thợ sửa xe mất tích','Vo Van Khanh','ID100016',
'https://placehold.co/600x400','khanhvo@gmail.com','0901100016','2026-03-12',
'Võ Văn Khanh rời xưởng sửa xe trong giờ nghỉ trưa và không quay lại. Dụng cụ cá nhân vẫn còn tại chỗ.',
10.8150,106.7100,'2026-03-12 12:00:00+07','dd382dcf-3652-499c-acdb-5d9ce99a67b8','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6','PUBLISHED'),

('f0000011-f000-4000-8000-f00000000011','Nhân viên vệ sinh mất tích','Bui Thi Hien','ID100017',
'https://placehold.co/600x400','hienbui@gmail.com','0901100017','2026-03-13',
'Bùi Thị Hiền trên đường đi làm thì mất liên lạc. Không đến nơi làm việc theo lịch.',
10.7750,106.7030,'2026-03-13 08:45:00+07','8c52c01e-42a7-45cc-9254-db8a7601c764','0e745cb3-5f38-419b-b446-d204c2e15ba9','PENDING'),

('f0000012-f000-4000-8000-f00000000012','Nhà báo mất tích','Dang Van Quoc','ID100018',
'https://placehold.co/600x400','quocdang@gmail.com','0901100018','2026-03-13',
'Đặng Văn Quốc đang điều tra một vụ việc thì mất tích. Tin nhắn cuối cùng cho biết anh chuẩn bị gặp nguồn tin.',
11.0500,106.6500,'2026-03-13 10:30:00+07','4405a37d-bc86-403e-b605-bedd7db88d37','0e745cb3-5f38-419b-b446-d204c2e15ba9','REJECTED'),

('f0000013-f000-4000-8000-f00000000013','Dược sĩ mất tích','Do Thi Ngoc','ID100019',
'https://placehold.co/600x400','ngocdo@gmail.com','0901100019','2026-03-14',
'Đỗ Thị Ngọc rời hiệu thuốc sau giờ làm nhưng không về nhà. Camera cho thấy cô rời đi một mình.',
10.7550,106.6680,'2026-03-14 09:15:00+07','2878c6d3-cb3c-493c-9c6c-7a4094a6a7a5','686fce27-64a1-4e3b-a471-b00920717bb1','PUBLISHED'),

('f0000014-f000-4000-8000-f00000000014','Cán bộ nghỉ hưu mất tích','Ngo Van Binh','ID100020',
'https://placehold.co/600x400','binhngo@gmail.com','0901100020','2026-03-14',
'Ngô Văn Bình đi bộ buổi sáng nhưng không quay về. Gia đình cho biết đây là hành vi bất thường.',
10.8780,106.8020,'2026-03-14 15:00:00+07','f8f735b4-549c-4d8c-9e10-15f8c198b71b','686fce27-64a1-4e3b-a471-b00920717bb1','PENDING');
------------------------------------------------
-- Guidelines documents
------------------------------------------------
INSERT INTO guidelines_document (
    id, title, abstract, content, created_at, reporter_id, public
)
VALUES
('f1000001-f100-4000-8000-f10000000001',
'Hướng dẫn an toàn cho trẻ em',
'Các bước bảo vệ trẻ em khỏi nguy cơ bị bắt cóc.',
'Luôn biết trẻ đang ở đâu và đi cùng ai. Dạy trẻ không nói chuyện với người lạ. Thiết lập quy tắc an toàn gia đình và số điện thoại khẩn cấp.',
'2026-03-01 08:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',TRUE),

('f1000002-f100-4000-8000-f10000000002',
'Quy trình bảo vệ người cao tuổi',
'Các biện pháp theo dõi và bảo vệ người cao tuổi.',
'Người cao tuổi cần được kiểm tra thường xuyên. Sử dụng vòng nhận dạng và duy trì liên lạc hằng ngày để tránh lạc đường.',
'2026-03-01 09:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',FALSE),

('f1000003-f100-4000-8000-f10000000003',
'Hướng dẫn an toàn cho du khách',
'Lời khuyên giúp du khách an toàn trong thành phố.',
'Giữ tài sản cá nhân cẩn thận, tránh khu vực đông người vào giờ cao điểm và không mang nhiều tiền mặt.',
'2026-03-02 08:00:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',TRUE),

('f1000004-f100-4000-8000-f10000000004',
'Mẹo an toàn ban đêm',
'Khuyến nghị để đảm bảo an toàn khi ra ngoài ban đêm.',
'Hạn chế đi một mình vào ban đêm. Luôn sử dụng phương tiện đáng tin cậy và chia sẻ vị trí với người thân.',
'2026-03-02 10:00:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',TRUE),

('f1000005-f100-4000-8000-f10000000005',
'Phòng chống trộm cắp phương tiện',
'Cách bảo vệ xe máy và ô tô khỏi bị trộm.',
'Luôn khóa xe cẩn thận, sử dụng khóa chống trộm và không để xe ở nơi vắng hoặc thiếu ánh sáng.',
'2026-03-03 08:00:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',TRUE),

('f1000006-f100-4000-8000-f10000000006',
'Hướng dẫn an toàn số',
'Cách bảo vệ bản thân trên môi trường mạng.',
'Không chia sẻ thông tin cá nhân với người lạ. Sử dụng mật khẩu mạnh và bật xác thực hai lớp.',
'2026-03-03 11:00:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',FALSE),

('f1000007-f100-4000-8000-f10000000007',
'An toàn giao thông công cộng',
'Lưu ý khi sử dụng xe buýt và tàu.',
'Giữ đồ cá nhân gần người, tránh chen lấn và chú ý xung quanh khi lên xuống phương tiện.',
'2026-03-04 08:00:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f1000008-f100-4000-8000-f10000000008',
'An ninh khu chợ',
'Hướng dẫn cho người bán và người mua.',
'Không để tiền hoặc hàng hóa không giám sát. Quan sát các hành vi đáng ngờ trong khu vực.',
'2026-03-04 09:30:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f1000009-f100-4000-8000-f10000000009',
'An toàn khu vực trường học',
'Quy tắc đảm bảo an ninh trường học.',
'Kiểm soát người ra vào, đảm bảo học sinh được giám sát và tránh tiếp xúc với người lạ.',
'2026-03-05 08:00:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',TRUE),

('f100000a-f100-4000-8000-f1000000000a',
'Xử lý bạo lực gia đình',
'Quy trình nội bộ xử lý các trường hợp bạo lực.',
'Ghi nhận thông tin, bảo vệ nạn nhân và liên hệ cơ quan chức năng để can thiệp kịp thời.',
'2026-03-05 14:00:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',FALSE),

('f100000b-f100-4000-8000-f1000000000b',
'An toàn cháy nổ',
'Quy trình thoát hiểm khi có cháy.',
'Luôn biết lối thoát hiểm, không sử dụng thang máy khi có cháy và di chuyển nhanh ra khu vực an toàn.',
'2026-03-06 08:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',TRUE),

('f100000c-f100-4000-8000-f1000000000c',
'An toàn mùa lũ',
'Hướng dẫn khi xảy ra lũ lụt.',
'Di chuyển đến nơi cao ráo, tránh vùng nước chảy mạnh và chuẩn bị nhu yếu phẩm cần thiết.',
'2026-03-06 10:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',TRUE),

('f100000d-f100-4000-8000-f1000000000d',
'Địa điểm đồn công an',
'Hướng dẫn tìm và liên hệ công an.',
'Ghi nhớ địa chỉ và số điện thoại đồn công an gần nhất để liên hệ khi cần thiết.',
'2026-03-07 08:00:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',TRUE),

('f100000e-f100-4000-8000-f1000000000e',
'Báo cáo tội phạm mạng',
'Cách trình báo tội phạm công nghệ cao.',
'Lưu lại bằng chứng, không xóa dữ liệu và báo cáo cho cơ quan chức năng càng sớm càng tốt.',
'2026-03-07 13:00:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',FALSE),

('f100000f-f100-4000-8000-f1000000000f',
'Báo cáo tội phạm ma túy',
'Quy trình báo cáo an toàn.',
'Không đối đầu trực tiếp, ghi nhận thông tin và báo cáo ẩn danh nếu cần thiết.',
'2026-03-08 08:00:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',FALSE),

('f1000010-f100-4000-8000-f10000000010',
'Xử lý tai nạn giao thông',
'Các bước sau khi xảy ra tai nạn.',
'Đảm bảo an toàn, gọi cấp cứu và cung cấp thông tin cho cơ quan chức năng.',
'2026-03-08 11:00:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',TRUE),

('f1000011-f100-4000-8000-f10000000011',
'Nhận diện hoạt động băng nhóm',
'Hướng dẫn nhận biết và báo cáo.',
'Quan sát dấu hiệu bất thường, tránh tiếp xúc và báo cáo cho cơ quan chức năng.',
'2026-03-09 08:00:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',FALSE),

('f1000012-f100-4000-8000-f10000000012',
'An toàn khi sử dụng ATM',
'Hướng dẫn tránh gian lận ATM.',
'Che bàn phím khi nhập mã PIN và kiểm tra máy trước khi sử dụng.',
'2026-03-09 10:00:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f1000013-f100-4000-8000-f10000000013',
'Bảo vệ nhân chứng',
'Quyền lợi và hỗ trợ.',
'Nhân chứng có quyền được bảo vệ danh tính và hỗ trợ pháp lý từ cơ quan chức năng.',
'2026-03-10 08:00:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',FALSE),

('f1000014-f100-4000-8000-f10000000014',
'Chương trình dân phòng',
'Hướng dẫn tổ chức giám sát khu phố.',
'Thành lập nhóm cộng đồng, phối hợp tuần tra và báo cáo tình hình an ninh.',
'2026-03-10 14:00:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',TRUE);
------------------------------------------------
-- Crime reports
------------------------------------------------
INSERT INTO crime_report (
    id, title, content, date, severity,
    number_of_victims, number_of_offenders,
    arrested, longitude, latitude,
    created_at, updated_at, reporter_id, public
)
VALUES
('f2000001-f200-4000-8000-f20000000001',
'Đánh cắp dữ liệu thẻ ATM',
'Phát hiện thiết bị đánh cắp dữ liệu thẻ được gắn vào máy ATM. Nhiều khách hàng báo mất tiền trong tài khoản sau khi sử dụng máy.',
'2026-03-05',2,3,1,FALSE,106.6975,10.7760,
'2026-03-05 08:30:00+07','2026-03-05 08:30:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',TRUE),

('f2000002-f200-4000-8000-f20000000002',
'Đột nhập nhà ở',
'Một căn nhà bị đột nhập khi chủ vắng mặt. Đối tượng phá cửa sổ phía sau và lấy đi tài sản có giá trị.',
'2026-03-05',4,0,2,TRUE,106.7050,10.7800,
'2026-03-05 11:00:00+07','2026-03-05 11:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',FALSE),

('f2000003-f200-4000-8000-f20000000003',
'Bắt giữ tàng trữ ma túy',
'Một đối tượng bị bắt giữ khi tàng trữ chất ma túy trái phép. Tang vật được thu giữ tại hiện trường.',
'2026-03-06',3,0,1,TRUE,106.6992,10.7742,
'2026-03-06 14:20:00+07','2026-03-06 14:20:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',TRUE),

('f2000004-f200-4000-8000-f20000000004',
'Lừa đảo trực tuyến',
'Nhóm đối tượng lừa đảo trực tuyến đã chiếm đoạt tiền của nhiều nạn nhân thông qua các trang web giả mạo.',
'2026-03-06',2,5,1,FALSE,106.7018,10.7768,
'2026-03-06 10:00:00+07','2026-03-06 10:00:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',TRUE),

('f2000005-f200-4000-8000-f20000000005',
'Đua xe trái phép',
'Nhóm thanh niên tổ chức đua xe trái phép trên đường phố vào ban đêm, gây mất trật tự và nguy hiểm cho người tham gia giao thông.',
'2026-03-07',1,0,4,TRUE,106.7025,10.7755,
'2026-03-07 22:30:00+07','2026-03-07 22:30:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',TRUE),

('f2000006-f200-4000-8000-f20000000006',
'Đe dọa bằng dao tại nhà hàng',
'Một đối tượng dùng dao đe dọa khách hàng tại nhà hàng sau khi xảy ra tranh cãi. Nhân viên đã báo công an kịp thời.',
'2026-03-07',4,2,1,TRUE,106.7038,10.7783,
'2026-03-07 19:45:00+07','2026-03-07 19:45:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',FALSE),

('f2000007-f200-4000-8000-f20000000007',
'Phá hoại cửa hàng',
'Một cửa hàng bị phá hoại tài sản vào ban đêm. Kính và bảng hiệu bị đập vỡ.',
'2026-03-08',2,0,3,FALSE,106.6968,10.7748,
'2026-03-08 02:15:00+07','2026-03-08 02:15:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f2000008-f200-4000-8000-f20000000008',
'Hành hung do tranh chấp đất',
'Xảy ra xô xát giữa hai bên do tranh chấp đất đai. Một người bị thương nhẹ.',
'2026-03-08',3,1,2,FALSE,106.7055,10.7812,
'2026-03-08 09:00:00+07','2026-03-08 09:00:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f2000009-f200-4000-8000-f20000000009',
'Tai nạn do say rượu',
'Tai nạn giao thông xảy ra do người điều khiển phương tiện sử dụng rượu bia. Có người bị thương.',
'2026-03-09',3,2,1,TRUE,106.7003,10.7763,
'2026-03-09 23:50:00+07','2026-03-09 23:50:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',TRUE),

('f200000a-f200-4000-8000-f2000000000a',
'Tiền giả lưu hành',
'Phát hiện nhóm đối tượng lưu hành tiền giả tại khu vực chợ. Nhiều giao dịch bị ảnh hưởng.',
'2026-03-09',3,4,2,FALSE,106.7012,10.7771,
'2026-03-09 15:30:00+07','2026-03-09 15:30:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',FALSE),

('f200000b-f200-4000-8000-f2000000000b',
'Nghi vấn buôn người',
'Nhận được thông tin nghi vấn về hoạt động buôn người. Cơ quan chức năng đang tiến hành xác minh.',
'2026-03-10',5,3,2,FALSE,106.6980,10.7735,
'2026-03-10 07:00:00+07','2026-03-10 07:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',FALSE),

('f200000c-f200-4000-8000-f2000000000c',
'Trộm cắp căn hộ',
'Một căn hộ bị trộm đột nhập và lấy đi tài sản có giá trị. Không có dấu hiệu phá cửa mạnh.',
'2026-03-10',3,1,1,TRUE,106.7042,10.7794,
'2026-03-10 11:00:00+07','2026-03-10 11:00:00+07','686fce27-64a1-4e3b-a471-b00920717bb1',TRUE),

('f200000d-f200-4000-8000-f2000000000d',
'Vụ án hối lộ',
'Một cán bộ bị bắt vì nhận hối lộ trong quá trình xử lý hồ sơ hành chính.',
'2026-03-11',4,0,1,TRUE,106.7019,10.7758,
'2026-03-11 09:20:00+07','2026-03-11 09:20:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',FALSE),

('f200000e-f200-4000-8000-f2000000000e',
'Tụ điểm đánh bạc trái phép',
'Phát hiện tụ điểm đánh bạc trái phép với nhiều người tham gia. Công an đã triệt phá và bắt giữ các đối tượng liên quan.',
'2026-03-11',3,10,5,TRUE,106.6995,10.7751,
'2026-03-11 21:00:00+07','2026-03-11 21:00:00+07','766a99f7-7af1-4613-82a4-c303b2e9ee03',TRUE),

('f200000f-f200-4000-8000-f2000000000f',
'Giật túi trên cầu',
'Một vụ giật túi xảy ra trên cầu. Nạn nhân bị mất tài sản nhưng không bị thương nặng.',
'2026-03-12',2,1,1,FALSE,106.7007,10.7767,
'2026-03-12 17:30:00+07','2026-03-12 17:30:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',TRUE),

('f2000010-f200-4000-8000-f20000000010',
'Đánh cắp danh tính',
'Thông tin cá nhân của nhiều người bị đánh cắp và sử dụng cho các giao dịch trái phép.',
'2026-03-12',3,2,1,FALSE,106.7033,10.7779,
'2026-03-12 10:00:00+07','2026-03-12 10:00:00+07','f5aea0e8-5dbf-442d-8c91-d69ec41a198d',FALSE),

('f2000011-f200-4000-8000-f20000000011',
'Phóng hỏa kho hàng',
'Một vụ phóng hỏa xảy ra tại kho hàng vào ban đêm. Thiệt hại lớn về tài sản nhưng không có thương vong.',
'2026-03-13',5,0,1,TRUE,106.6960,10.7730,
'2026-03-13 03:45:00+07','2026-03-13 03:45:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f2000012-f200-4000-8000-f20000000012',
'Cố gắng cướp xe',
'Đối tượng cố gắng cướp xe nhưng không thành. Nạn nhân chống trả và thoát khỏi hiện trường.',
'2026-03-13',4,1,2,FALSE,106.7047,10.7803,
'2026-03-13 20:10:00+07','2026-03-13 20:10:00+07','8c1c0a9f-9193-4a02-90ea-7c398f73a3e6',TRUE),

('f2000013-f200-4000-8000-f20000000013',
'Buôn bán hàng giả',
'Nhóm đối tượng buôn bán hàng giả tại chợ, gây thiệt hại cho người tiêu dùng.',
'2026-03-14',2,8,2,TRUE,106.7021,10.7764,
'2026-03-14 13:00:00+07','2026-03-14 13:00:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',TRUE),

('f2000014-f200-4000-8000-f20000000014',
'Quấy rối nơi làm việc',
'Một nhân viên báo cáo bị quấy rối tại nơi làm việc. Vụ việc đang được điều tra nội bộ.',
'2026-03-14',3,1,1,FALSE,106.7028,10.7772,
'2026-03-14 16:00:00+07','2026-03-14 16:00:00+07','0e745cb3-5f38-419b-b446-d204c2e15ba9',FALSE);
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
