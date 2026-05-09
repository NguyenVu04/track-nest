export const Vietnamese = {
  title: "Kiểm thử Thông báo",
  errorTitle: "Lỗi",
  successTitle: "Thành công",
  result: "Kết quả",

  // Emergency section
  sectionEmergency: "Thông báo Yêu cầu Khẩn cấp",
  emergencyHint:
    "Kích hoạt cả hai kênh thông báo: WebSocket tới dashboard dịch vụ khẩn cấp và Kafka → FCM tới thiết bị nạn nhân.",
  labelServiceId: "Service ID (UUID)",
  labelRequestId: "Request ID (UUID, để trống = tự tạo)",
  labelTargetId: "Target ID (UUID)",
  labelTargetUsername: "Tên nạn nhân",
  labelServiceUsername: "Tên dịch vụ khẩn cấp",
  placeholderUuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  sendEmergency: "Gửi thông báo khẩn cấp",

  // Family message section
  sectionFamily: "Thông báo Tin nhắn Gia đình",
  familyHint:
    "Gửi FCM push tới tất cả thành viên của vòng gia đình (trừ người gửi), với cùng định dạng payload như tin nhắn thật.",
  labelCircleId: "Circle ID (UUID)",
  labelSenderId: "Sender ID (UUID, bị loại trừ)",
  labelSenderName: "Tên người gửi (tiêu đề thông báo)",
  labelContent: "Nội dung tin nhắn (nội dung thông báo)",
  placeholderContent: "Nhập nội dung tin nhắn...",
  sendFamily: "Gửi thông báo gia đình",

  missingFields: "Vui lòng điền tất cả các trường bắt buộc.",
};

export const English = {
  title: "Notification Test",
  errorTitle: "Error",
  successTitle: "Success",
  result: "Result",

  // Emergency section
  sectionEmergency: "Emergency Request Notification",
  emergencyHint:
    "Fires both notification channels: WebSocket push to the emergency-service dashboard and Kafka → FCM push to the target user's device.",
  labelServiceId: "Service ID (UUID)",
  labelRequestId: "Request ID (UUID, leave blank to auto-generate)",
  labelTargetId: "Target ID (UUID)",
  labelTargetUsername: "Target username",
  labelServiceUsername: "Service username",
  placeholderUuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  sendEmergency: "Send Emergency Notification",

  // Family message section
  sectionFamily: "Family Message Notification",
  familyHint:
    "Sends an FCM push to all circle members except the sender, using the same payload shape as a real chat message.",
  labelCircleId: "Circle ID (UUID)",
  labelSenderId: "Sender ID (UUID, excluded from push)",
  labelSenderName: "Sender name (notification title)",
  labelContent: "Message content (notification body)",
  placeholderContent: "Enter message content...",
  sendFamily: "Send Family Notification",

  missingFields: "Please fill in all required fields.",
};
