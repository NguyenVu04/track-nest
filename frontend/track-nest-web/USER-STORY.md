User Story: Đăng tải báo cáo người mất tích
Tên Story: Đăng tải báo cáo người mất tích (Publish Missing Person Report)

Mô tả:

Là một Phóng viên, Tôi muốn đăng tải (công khai) các báo cáo người mất tích đã được xử lý lên hệ thống, Để người dùng có thể xem thông tin chi tiết và hỗ trợ tìm kiếm.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí dưới đây được trích xuất từ phần Preconditions, Normal Flow, Alternative Flows và Exceptions của Use Case:

1. Điều kiện tiên quyết:

Phóng viên phải đang đăng nhập và có kết nối Internet.

Phóng viên phải có ít nhất một báo cáo đang ở trạng thái "chưa được xử lý" (hoặc đã được giao).

2. Luồng xử lý chính (Happy Path):

Phóng viên có thể xem danh sách và kiểm tra thông tin chi tiết của báo cáo trước khi đăng.

Khi nhấn nút "Đăng tải", hệ thống phải hiển thị một cửa sổ xác nhận (popup) để ngăn chặn thao tác nhầm.

Sau khi xác nhận, trạng thái báo cáo phải chuyển thành "Công khai" (Public) và hiển thị được cho người dùng cuối.

Hệ thống phải hiển thị thông báo thành công cho Phóng viên.

Hệ thống phải gửi thông báo cho người gửi báo cáo gốc rằng báo cáo của họ đã được công khai.

3. Xử lý ngoại lệ và luồng thay thế:

Hủy bỏ: Nếu ở bước xác nhận, Phóng viên nhấn "Cancel", thao tác đăng tải sẽ bị hủy và trạng thái báo cáo không thay đổi.

Lỗi hệ thống: Nếu có lỗi máy chủ (E1), hệ thống phải hiển thị thông báo lỗi cụ thể: "Lỗi khi đăng tải báo cáo" và giữ nguyên trạng thái báo cáo.

---------------------------------------------------------------------------

User Story: Xóa báo cáo người mất tích
Tên Story: Xóa báo cáo người mất tích (Delete Missing Person Report)

Mô tả:

Là một Phóng viên, Tôi muốn có khả năng xóa các báo cáo người mất tích khỏi hệ thống, Để loại bỏ các nội dung không phù hợp, sai lệch hoặc không còn hiệu lực khỏi danh sách quản lý.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này bao gồm các yêu cầu về chức năng, giao diện và luồng dữ liệu dựa trên Use Case bạn cung cấp:

1. Quyền hạn và Truy cập:

Chức năng xóa chỉ khả dụng khi Phóng viên đã đăng nhập và đang xem danh sách báo cáo (đã đăng tải hoặc được giao).

Nút hoặc menu "Xóa" phải hiển thị rõ ràng trên từng báo cáo.

2. Cơ chế Xác nhận (Confirmation):

Khi nhấn nút "Xóa", hệ thống bắt buộc phải hiển thị một cửa sổ xác nhận (popup/modal) với nội dung cảnh báo.

Cửa sổ này phải có hai tùy chọn: "Xác nhận" và "Hủy" (Cancel).

Nếu chọn "Hủy", hành động xóa bị hủy bỏ và popup đóng lại.

3. Xử lý dữ liệu:

Khi chọn "Xác nhận", báo cáo phải được loại bỏ khỏi danh sách hiển thị trên hệ thống ngay lập tức.

4. Thông báo phản hồi:

Cho Phóng viên: Hiển thị thông báo "Thành công" (Success toast/message) sau khi xóa xong.

Cho Người gửi báo cáo (User): Hệ thống phải tự động gửi thông báo đến người dùng gốc (người đã tạo báo cáo đó) về việc báo cáo của họ đã bị xóa.

5. Xử lý lỗi:

Nếu có lỗi từ phía máy chủ (Server error) khiến việc xóa thất bại, hệ thống phải giữ nguyên trạng thái báo cáo và hiển thị thông báo lỗi: "Lỗi khi xóa báo cáo".

---------------------------------------------------------------------------

User Story: Đăng tải tài liệu hướng dẫn
Tên Story: Đăng tải tài liệu hướng dẫn (Publish Guideline Document)

Mô tả:

Là một Phóng viên, Tôi muốn soạn thảo và đăng tải các tài liệu hướng dẫn mới (ví dụ: hướng dẫn phòng chống tội phạm) lên hệ thống, Để cung cấp kiến thức và thông tin an toàn hữu ích cho cộng đồng người dùng.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này dựa trên quy trình nghiệp vụ (Normal Flow) và các ngoại lệ được mô tả trong Use Case:

1. Truy cập và Nhập liệu:

Phóng viên có thể truy cập chức năng này thông qua tab hoặc menu "Tài liệu hướng dẫn" trên bảng điều khiển (Dashboard).

Hệ thống phải cung cấp form để nhập các thông tin cần thiết cho tài liệu (Tiêu đề, nội dung, hình ảnh minh họa, v.v.).

2. Tính năng Xem trước (Preview):

Quan trọng: Trước khi tài liệu được lưu vào hệ thống, một bản xem trước (Preview) phải được hiển thị để Phóng viên kiểm tra lại bố cục và nội dung.

3. Thao tác Gửi và Hủy:

Nút Gửi: Khi nhấn nút "Gửi" (Submit), hệ thống sẽ lưu tài liệu và công khai nó cho người dùng xem.

Nút Hủy: Nếu nhấn nút "Hủy" (Cancel) tại bất kỳ bước nào trước khi gửi, quá trình đăng tải sẽ dừng lại và quay về trạng thái trước đó (dữ liệu không được lưu).

4. Phản hồi hệ thống:

Thành công: Hiển thị thông báo "Đăng tải thành công" ngay sau khi tài liệu được lưu.

Thất bại: Trong trường hợp lỗi máy chủ (E1), hệ thống phải hiển thị thông báo "Lỗi khi đăng tải tài liệu hướng dẫn" và cho phép Phóng viên thử lại mà không làm mất dữ liệu đã nhập.

---------------------------------------------------------------------------

User Story: Xóa tài liệu hướng dẫn
Tên Story: Xóa tài liệu hướng dẫn (Delete Guideline Document)

Mô tả:

Là một Phóng viên, Tôi muốn xóa các tài liệu hướng dẫn phòng chống tội phạm đã cũ hoặc không còn chính xác, Để đảm bảo kho dữ liệu trên hệ thống luôn cập nhật và người dùng không tiếp cận với thông tin lỗi thời.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này được xây dựng dựa trên luồng hoạt động (Normal Flow) và các biện pháp bảo vệ (Alternative Flows/Exceptions) trong Use Case:

1. Vị trí chức năng:

Chức năng xóa phải nằm trong menu hành động (Action Menu) tương ứng với từng tài liệu tại tab "Tài liệu hướng dẫn".

2. Cơ chế an toàn (Confirmation):

Hệ thống không được xóa ngay lập tức khi nhấn nút "Xóa".

Một cửa sổ xác nhận (Popup/Modal) phải xuất hiện với câu hỏi xác nhận hành động.

Cửa sổ này phải có hai nút: "Xác nhận" và "Hủy".

3. Xử lý hành động:

Nếu chọn "Xác nhận": Hệ thống thực hiện xóa tài liệu khỏi cơ sở dữ liệu (hoặc ẩn đi) và cập nhật lại danh sách hiển thị ngay lập tức.

Nếu chọn "Hủy": Cửa sổ xác nhận đóng lại và không có thay đổi nào xảy ra đối với tài liệu.

4. Phản hồi trạng thái:

Thành công: Hiển thị thông báo "Xóa thành công" sau khi tài liệu biến mất khỏi danh sách.

Lỗi: Nếu hệ thống gặp lỗi (E1) và không thể xóa, phải hiển thị thông báo "Lỗi khi xóa tài liệu hướng dẫn" và giữ nguyên tài liệu trong danh sách.

---------------------------------------------------------------------------

User Story: Đăng tải báo cáo tội phạm
Tên Story: Đăng tải báo cáo tội phạm (Publish Crime Report)

Mô tả:

Là một Phóng viên, Tôi muốn tạo và đăng tải các báo cáo về tội phạm mới lên hệ thống, Để cập nhật kịp thời các thông tin an ninh trật tự vào cơ sở dữ liệu chung.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này được trích xuất trực tiếp từ luồng sự kiện (Normal Flow) và các ngoại lệ (Exceptions) trong Use Case:

1. Truy cập chức năng:

Chức năng tạo mới phải nằm trong tab "Báo cáo tội phạm".

Phải có nút "Báo cáo mới" hiển thị rõ ràng để bắt đầu quy trình.

2. Nhập liệu và Kiểm tra:

Hệ thống phải cung cấp một mẫu (form) nhập liệu đầy đủ các trường thông tin cần thiết về tội phạm.

Phóng viên có thể nhập liệu và xem lại (review) toàn bộ thông tin đã nhập trước khi quyết định gửi đi.

3. Hành động Gửi (Submit):

Khi nhấn nút "Gửi", hệ thống thực hiện lưu dữ liệu vào cơ sở dữ liệu.

Sau khi lưu thành công, hệ thống phải hiển thị thông báo xác nhận thành công cho Phóng viên.

4. Xử lý lỗi (Error Handling):

Trong trường hợp xảy ra lỗi máy chủ (E1) khiến dữ liệu không thể lưu, hệ thống phải hiển thị thông báo lỗi cụ thể: "Lỗi khi tạo báo cáo mới" và đảm bảo người dùng có thể thử lại sau đó.

---------------------------------------------------------------------------

User Story: Xóa báo cáo tội phạm
Tên Story: Xóa báo cáo tội phạm (Delete Crime Report)

Mô tả:

Là một Phóng viên, Tôi muốn xóa các báo cáo tội phạm đã lỗi thời hoặc sai lệch khỏi hệ thống, Để đảm bảo cơ sở dữ liệu tội phạm luôn chính xác và cập nhật.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này được xây dựng dựa trên luồng sự kiện chính (Normal Flow) và các luồng thay thế/ngoại lệ trong Use Case:

1. Tương tác và Tìm kiếm:

Phóng viên phải có khả năng tìm kiếm và chọn báo cáo cần xóa trong tab "Báo cáo tội phạm".

Nút "Xóa" phải được hiển thị rõ ràng trên giao diện của từng báo cáo.

2. Cơ chế Xác nhận và Kiểm tra (Confirmation Modal):

Khi nhấn nút "Xóa", hệ thống không được xóa ngay mà phải hiển thị một hộp thoại xác nhận (Popup/Modal).

Hộp thoại này phải hiển thị lại tóm tắt thông tin của báo cáo (theo bước 4 của Normal Flow) để Phóng viên kiểm tra lại trước khi quyết định cuối cùng.

Hộp thoại phải có hai nút hành động: "Xác nhận" và "Hủy".

3. Hành động Xóa và Hủy:

Xác nhận: Nếu chọn "Xác nhận", hệ thống thực hiện xóa báo cáo khỏi cơ sở dữ liệu và làm mới danh sách hiển thị.

Hủy: Nếu chọn "Hủy" (theo Alternative Flow A1), hộp thoại đóng lại và báo cáo vẫn được giữ nguyên.

4. Phản hồi hệ thống:

Thành công: Hiển thị thông báo (Notification/Toast) xác nhận thao tác thành công ngay sau khi xóa.

Lỗi: Nếu có lỗi máy chủ (E1), hệ thống hiển thị thông báo "Lỗi khi xóa báo cáo tội phạm" và giữ nguyên trạng thái dữ liệu.

---------------------------------------------------------------------------

User Story: Tạo báo cáo phân tích tội phạm
Tên Story: Tạo báo cáo phân tích tội phạm (Generate Crime Analysis Report)

Mô tả:

Là một Nhân viên Dịch vụ cứu hộ, Tôi muốn tạo các báo cáo tổng hợp về tình hình tội phạm dựa trên khu vực và khoảng thời gian cụ thể, Để nắm bắt các xu hướng an ninh, điểm nóng tội phạm và lên phương án hỗ trợ hoặc điều phối lực lượng phù hợp.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này được xây dựng dựa trên các tham số đầu vào (Input parameters) và kết quả mong đợi (Expected outcomes) trong Use Case:

1. Bộ lọc và Tham số đầu vào:

Tại tab "Tình hình phạm tội", hệ thống phải cung cấp các bộ lọc (filter) cho phép người dùng chọn:

Khu vực: (Ví dụ: Quận, Phường, hoặc Bán kính cụ thể).

Khoảng thời gian: (Từ ngày... Đến ngày...).

Nút "Tạo báo cáo tổng hợp" chỉ kích hoạt khi các tham số bắt buộc đã được chọn.

2. Hiển thị kết quả (Visualization):

Sau khi nhấn "Tạo báo cáo", hệ thống xử lý và hiển thị kết quả trực quan ngay trên Dashboard (có thể là biểu đồ hoặc bảng số liệu).

Phải có thông báo "Thành công" xuất hiện khi dữ liệu được tải xong.

3. Tính năng Tải xuống (Export):

Giao diện hiển thị báo cáo phải đi kèm nút "Tải xuống" (Download).

Khi nhấn nút này, người dùng có thể tải về file báo cáo (định dạng thông thường là PDF hoặc Excel) chứa nội dung tương tự như những gì hiển thị trên màn hình.

4. Xử lý lỗi:

Nếu hệ thống gặp sự cố khi truy xuất hoặc tổng hợp dữ liệu (Lỗi E1), phải hiển thị thông báo: "Lỗi khi tổng hợp báo cáo tội phạm" và cho phép người dùng thử lại.

---------------------------------------------------------------------------

User Story: Từ chối yêu cầu khẩn cấp
Tên Story: Từ chối yêu cầu khẩn cấp (Reject Emergency Request)

Mô tả:

Là một Nhân viên cứu hộ, Tôi muốn từ chối các yêu cầu cứu hộ khi đơn vị đang quá tải, yêu cầu ngoài phạm vi hoặc thiếu thông tin, Để thông báo kịp thời cho người dân tìm phương án hỗ trợ khác và hệ thống ghi nhận lại lý do phục vụ đánh giá.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này đảm bảo quy trình từ chối diễn ra chặt chẽ và minh bạch:

1. Điều kiện kích hoạt:

Nút "Từ chối" chỉ khả dụng đối với các yêu cầu đang ở trạng thái "Đang chờ xử lý" (Pending).

Nhân viên cứu hộ có thể xem chi tiết yêu cầu trước khi quyết định từ chối.

2. Quy trình nhập lý do (Bắt buộc):

Khi nhấn nút "Từ chối", hệ thống phải hiển thị một hộp thoại (Form/Modal) yêu cầu nhập Lý do từ chối.

Trường "Lý do" là bắt buộc (Required field). Nhân viên không thể hoàn tất việc từ chối nếu để trống trường này.

Gợi ý UX: Có thể cung cấp các lý do mẫu (ví dụ: "Quá tải", "Sai địa chỉ", "Spam") kèm theo ô nhập văn bản tự do.

3. Cập nhật dữ liệu:

Sau khi xác nhận, trạng thái yêu cầu chuyển ngay sang "Đã từ chối" (Rejected).

Lý do từ chối phải được lưu trữ vào cơ sở dữ liệu gắn liền với yêu cầu đó để phục vụ cho các báo cáo thống kê sau này.

4. Thông báo người dùng:

Hệ thống phải gửi thông báo (Push notification/SMS) đến thiết bị của người gửi yêu cầu (User) báo tin rằng yêu cầu đã bị từ chối.

5. Xử lý lỗi:

Nếu xảy ra lỗi kết nối hoặc lỗi máy chủ (E1), hệ thống hiển thị thông báo "Lỗi khi từ chối yêu cầu khẩn cấp" và giữ nguyên trạng thái "Đang chờ xử lý" để nhân viên thao tác lại.

---------------------------------------------------------------------------

User Story: Tiếp nhận yêu cầu khẩn cấp
Tên Story: Tiếp nhận yêu cầu khẩn cấp (Accept Emergency Request)

Mô tả:

Là một Nhân viên cứu hộ, Tôi muốn tiếp nhận các yêu cầu khẩn cấp đang ở trạng thái chờ, Để chính thức bắt đầu quy trình cứu hộ, kích hoạt chế độ theo dõi vị trí nạn nhân và trấn an người báo tin.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này tập trung vào sự chuyển đổi trạng thái và việc kích hoạt các tính năng thời gian thực sau khi tiếp nhận:

1. Điều kiện tiên quyết trên giao diện:

Nút "Tiếp nhận" chỉ được hiển thị hoặc kích hoạt đối với các yêu cầu đang có trạng thái "Đang chờ xử lý".

Nhân viên cứu hộ phải xem được thông tin chi tiết trước khi nhấn nút.

2. Cập nhật trạng thái hệ thống:

Ngay khi nhấn "Tiếp nhận", trạng thái của yêu cầu trong cơ sở dữ liệu phải chuyển thành "Đã chấp nhận" (Accepted).

3. Kích hoạt Theo dõi thời gian thực (Real-time Tracking):

Quan trọng: Sau khi tiếp nhận thành công, giao diện của Nhân viên cứu hộ phải tự động chuyển sang (hoặc hiển thị) bản đồ.

Bản đồ này phải hiển thị vị trí thời gian thực của "Người được theo dõi" (nạn nhân) để đội cứu hộ có thể di chuyển chính xác.

4. Thông báo phản hồi:

Cho Người gửi yêu cầu: Hệ thống phải gửi thông báo (Notification) đến người dùng đã tạo yêu cầu để họ biết rằng đội cứu hộ đã tiếp nhận và đang xử lý.

Cho Nhân viên cứu hộ: Hiển thị thông báo thành công hoặc chuyển hướng mượt mà sang màn hình bản đồ.

5. Xử lý lỗi:

Trong trường hợp mất kết nối hoặc lỗi máy chủ (E1), hệ thống phải hiển thị thông báo "Lỗi khi tiếp nhận yêu cầu" và đảm bảo trạng thái yêu cầu không bị thay đổi sai lệch (vẫn giữ là "Đang chờ" để thử lại).

---------------------------------------------------------------------------

User Story: Hoàn thành yêu cầu khẩn cấp
Tên Story: Hoàn thành yêu cầu khẩn cấp (Complete Emergency Request)

Mô tả:

Là một Nhân viên cứu hộ, Tôi muốn xác nhận hoàn thành nhiệm vụ và ghi lại báo cáo kết quả xử lý, Để đóng hồ sơ yêu cầu trên hệ thống và dừng việc theo dõi vị trí của người dùng.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này được xây dựng dựa trên luồng xử lý (Normal Flow) và các thay đổi quan trọng về hệ thống (Postconditions):

1. Điều kiện tiên quyết:

Chức năng "Hoàn thành" chỉ khả dụng đối với các yêu cầu đang ở trạng thái "Đã chấp nhận" (đang được xử lý).

2. Báo cáo kết quả (Bắt buộc):

Khi nhấn nút "Hoàn thành", hệ thống phải hiển thị một biểu mẫu (Form/Modal) yêu cầu nhập "Kết quả xử lý".

Nhân viên cứu hộ bắt buộc phải nhập thông tin vào trường này (ví dụ: "Đã đưa nạn nhân đến bệnh viện", "Hiện trường an toàn", v.v.) trước khi có thể lưu.

3. Thay đổi trạng thái và Lưu trữ:

Sau khi xác nhận, trạng thái yêu cầu được cập nhật thành "Đã hoàn thành" (Completed).

Nội dung báo cáo kết quả phải được lưu vào lịch sử của yêu cầu đó.

4. Ngắt kết nối theo dõi (Quan trọng):

Ngay khi trạng thái chuyển sang "Đã hoàn thành", hệ thống phải lập tức dừng tính năng chia sẻ vị trí thời gian thực giữa thiết bị người dùng và dịch vụ cứu hộ để bảo vệ quyền riêng tư.

5. Thông báo:

Hệ thống gửi thông báo đến Người dùng (người gửi yêu cầu) xác nhận rằng nhiệm vụ cứu hộ đã kết thúc thành công.

6. Xử lý lỗi:

Nếu có lỗi kết nối (E1), hệ thống hiển thị thông báo lỗi và giữ nguyên trạng thái "Đang xử lý" (không được đóng hồ sơ non).

---------------------------------------------------------------------------

User Story: Xóa khu vực an toàn
Tên Story: Xóa khu vực an toàn (Remove Safe Zone)

Mô tả:

Là một Nhân viên Dịch vụ cứu hộ, Tôi muốn xóa các địa điểm "Khu vực an toàn" (như đồn cảnh sát, trạm y tế đã di dời hoặc đóng cửa) khỏi hệ thống, Để đảm bảo bản đồ hiển thị cho người dân luôn chính xác, tránh hướng dẫn họ đến những nơi không còn khả năng hỗ trợ.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này được xây dựng dựa trên luồng xử lý chính và các biện pháp phòng ngừa thao tác sai:

1. Tìm kiếm và Thao tác:

Tại tab "Khu vực an toàn", nhân viên phải có công cụ tìm kiếm hoặc lọc để nhanh chóng xác định địa điểm cần xóa.

Nút "Xóa" phải được bố trí trên từng dòng hoặc thẻ thông tin của khu vực an toàn.

2. Xác nhận an toàn (Confirmation Modal):

Khi nhấn nút "Xóa", hệ thống không được xóa ngay mà phải hiển thị một hộp thoại xác nhận.

Hộp thoại phải hiển thị lại thông tin tóm tắt của khu vực đó (Tên, Địa chỉ) để nhân viên kiểm tra lần cuối (theo bước 4 Normal Flow).

Phải có hai nút: "Xác nhận" và "Hủy".

3. Xử lý hành động:

Xác nhận: Nếu chọn "Xác nhận", hệ thống xóa địa điểm khỏi cơ sở dữ liệu và danh sách trên giao diện phải được cập nhật ngay lập tức (biến mất).

Hủy: Nếu chọn "Hủy", hộp thoại đóng lại và dữ liệu được giữ nguyên.

4. Phản hồi hệ thống:

Thành công: Hiển thị thông báo "Xóa thành công".

Lỗi: Nếu gặp lỗi máy chủ (E1), hệ thống hiển thị thông báo "Gặp lỗi khi xóa khu vực" và giữ nguyên hiển thị của khu vực đó trong danh sách.

---------------------------------------------------------------------------

Dưới đây là bản chuyển đổi từ Use Case EMERGENCY-UC-05 sang định dạng User Story cùng các tiêu chí chấp nhận chi tiết:

User Story: Thêm khu vực an toàn
Tên Story: Thêm khu vực an toàn (Add Safe Zone)

Mô tả:

Là một Nhân viên Dịch vụ cứu hộ, Tôi muốn thêm mới các địa điểm an toàn (như đồn công an, trạm y tế, chốt bảo vệ...) vào hệ thống, Để mở rộng mạng lưới hỗ trợ và giúp người dùng tìm thấy nơi trú ẩn gần nhất khi gặp nguy hiểm.

Tiêu chí chấp nhận (Acceptance Criteria)
Các tiêu chí này cụ thể hóa các bước nhập liệu (Normal Flow) và các luồng thay thế trong Use Case:

1. Giao diện và Kích hoạt:

Tại tab "Khu vực an toàn", phải có nút "Thêm mới" nổi bật.

Khi nhấn nút, hệ thống hiển thị một biểu mẫu (Form) hoặc Modal nhập liệu.

2. Nhập liệu thông tin:

Biểu mẫu phải bao gồm các trường thông tin cần thiết: Tên địa điểm, Địa chỉ cụ thể, và Loại hình (Đồn cảnh sát/Bệnh viện...).

Gợi ý bổ sung (Implied): Nên có tính năng chọn vị trí trực tiếp trên bản đồ (Pin location) để lấy tọa độ chính xác.

3. Xác nhận và Lưu trữ:

Nút Xác nhận: Khi nhấn "Xác nhận", hệ thống kiểm tra dữ liệu (không được để trống các trường bắt buộc) và lưu vào cơ sở dữ liệu.

Cập nhật danh sách: Sau khi lưu thành công, địa điểm mới phải xuất hiện ngay lập tức trong danh sách quản lý mà không cần tải lại trang.

4. Chức năng Hủy bỏ:

Nếu nhân viên nhấn nút "Hủy" (theo Alternative Flow A1), biểu mẫu đóng lại, dữ liệu đã nhập bị xóa và không có bản ghi nào được tạo ra.

5. Phản hồi hệ thống:

Thành công: Hiển thị thông báo "Thêm mới thành công".

Lỗi: Nếu gặp lỗi máy chủ (E1), hệ thống hiển thị thông báo "Lỗi khi thêm khu vực an toàn" và giữ nguyên trạng thái biểu mẫu để nhân viên thử lại.