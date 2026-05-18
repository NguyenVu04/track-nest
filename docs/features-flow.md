# TrackNest — Cách hệ thống hoạt động

Tài liệu này mô tả các tính năng chính của TrackNest theo góc nhìn của người dùng: điều gì xảy ra phía sau mỗi khi bạn nhấn một nút, chia sẻ vị trí, hay gửi tín hiệu khẩn cấp.

---

## 1. Theo dõi và chia sẻ vị trí theo thời gian thực

### Ý tưởng cốt lõi

Bạn không cần phải chủ động "gửi" vị trí — ứng dụng tự động cập nhật vị trí của bạn trong nền và chia sẻ với những người thân đã được mời vào cùng nhóm gia đình. Người thân xem vị trí của bạn trên bản đồ giống như xem kim đồng hồ đang chạy: liên tục, không cần tải lại trang.

### Luồng hoạt động

```
Ứng dụng của bạn (chạy nền)
    │
    │  Gửi tọa độ GPS định kỳ
    ▼
Hệ thống TrackNest
    │
    ├─ Lưu lại lịch sử vị trí của bạn
    │
    └─ Thông báo tức thì đến tất cả người thân trong nhóm
           │
           ├─ Nếu người thân đang mở app → bản đồ cập nhật ngay lập tức
           └─ Nếu người thân đóng app  → họ sẽ nhận thông báo đẩy
```

### Chi tiết hơn về "thông báo tức thì"

Khi vị trí của bạn được gửi lên, hệ thống cần đảm bảo tất cả người thân — dù đang dùng điện thoại nào, kết nối đến máy chủ nào — đều nhận được ngay lập tức. Để làm điều này:

- Hệ thống kiểm tra xem từng người thân **có đang mở ứng dụng không**.
  - **Có** → vị trí được đẩy thẳng đến màn hình bản đồ của họ, không cần họ làm gì.
  - **Không** → một thông báo đẩy được gửi đến điện thoại, mời họ mở app xem.

- Để việc này hoạt động dù hệ thống chạy trên nhiều máy chủ khác nhau (phục vụ hàng nghìn người dùng cùng lúc), các máy chủ "nói chuyện" với nhau qua một kênh trung gian — giống như một bảng tin chung mà tất cả đều có thể đọc và ghi.

### Lịch sử vị trí

Mọi điểm vị trí được lưu lại theo thứ tự thời gian. Bạn có thể xem lại "hành trình trong ngày" của bất kỳ thành viên nào trong nhóm, giúp cha mẹ an tâm khi con đi học về muộn, hoặc phối hợp khi cần tìm kiếm.

---

## 2. Cảnh báo bất thường — Khi hệ thống "nhận ra" điều gì đó không ổn

### Ý tưởng cốt lõi

Theo thời gian, TrackNest học được thói quen di chuyển của bạn: bạn thường đến những đâu, vào ngày nào trong tuần, vào giờ nào. Khi bạn đột ngột xuất hiện ở một nơi hoàn toàn xa lạ vào một thời điểm bất thường, hệ thống hiểu đây là tín hiệu đáng lo ngại và chủ động cảnh báo người thân.

### Hệ thống học thói quen của bạn như thế nào?

```
Mỗi lần bạn gửi vị trí
    │
    ▼
Hệ thống ghi nhận: "Vào thứ Ba lúc 8 giờ sáng, người này thường ở khu vực này"
    │
    ▼
Sau khoảng 20 lần ghi nhận tại cùng một khu vực / giờ / ngày
    │
    ▼
Hệ thống hình thành "vùng quen thuộc" cho bạn
```

Vùng quen thuộc không phải là một điểm cố định, mà là một khu vực hình lục giác nhỏ — cách phân chia không gian này giúp hệ thống linh hoạt hơn so với việc so sánh tọa độ tuyệt đối.

### Khi phát hiện bất thường

```
Bạn gửi vị trí
    │
    ▼
Hệ thống kiểm tra: vị trí này có nằm trong vùng quen thuộc không?
    │
    ├─ Có → Không có gì xảy ra, mọi thứ bình thường
    │
    └─ Không → Phát hiện bất thường!
                    │
                    ├─ Gửi thông báo đẩy đến tất cả người thân trong nhóm
                    │      "Vị trí của [tên] có điều gì đó bất thường —
                    │       hãy kiểm tra và liên lạc với họ."
                    │
                    └─ Hệ thống "im lặng" trong 1 giờ tiếp theo
                           (để tránh gửi liên tục nếu bạn đang đi du lịch)
```

### Vai trò của dữ liệu cộng đồng

Ngoài thói quen cá nhân, TrackNest còn tích hợp **báo cáo cộng đồng** — các tin tức về tội phạm, mất tích, hoặc khu vực nguy hiểm do người dùng đóng góp hoặc cơ quan chức năng cập nhật.

Những báo cáo này được:

1. **Tóm tắt tự động bằng AI** — thay vì đọc một bản báo cáo dài và khô khan, bạn thấy một đoạn tóm tắt ngắn gọn, dễ hiểu.
2. **Đính kèm vị trí địa lý** — bạn xem báo cáo trực tiếp trên bản đồ, biết ngay khu vực nào đang có vấn đề.
3. **Lọc theo loại** — tội phạm, người mất tích, hoặc các sự kiện khác.

Khi hệ thống cảnh báo bất thường, người thân của bạn cũng có thể đối chiếu với các báo cáo cộng đồng trong vùng đó để đánh giá mức độ nghiêm trọng.

---

## 3. Ứng dụng khẩn cấp — Khi bạn cần giúp đỡ ngay lập tức

### Ý tưởng cốt lõi

Chỉ với một thao tác, TrackNest gửi tín hiệu khẩn cấp đến cả **đơn vị cứu trợ gần nhất** lẫn **toàn bộ người thân trong nhóm** — cùng lúc, không cần bạn phải gọi điện hay nhắn tin thủ công.

### Luồng từ khi bạn nhấn SOS

```
Bạn nhấn nút khẩn cấp trên ứng dụng
    │
    ▼
Hệ thống ghi nhận yêu cầu khẩn cấp
    │
    ├─ Xác định vị trí hiện tại của bạn
    ├─ Tìm đơn vị cứu trợ gần nhất (cảnh sát, y tế, v.v.)
    └─ Tạo hồ sơ yêu cầu khẩn cấp với trạng thái "Đang chờ xử lý"
          │
          ▼
    Hai luồng thông báo diễn ra đồng thời:

    ┌─────────────────────────┐    ┌─────────────────────────────┐
    │ Đơn vị cứu trợ          │    │ Người thân của bạn          │
    │                         │    │                             │
    │ Màn hình dashboard của  │    │ Nhận thông báo đẩy:         │
    │ họ hiện ngay thông báo  │    │ "Yêu cầu khẩn cấp của       │
    │ với ID và thời gian tiếp│    │ [tên] đã được giao cho       │
    │ nhận yêu cầu của bạn.   │    │ [đơn vị cứu trợ]."          │
    │                         │    │                             │
    │ Họ phản hồi và cập nhật │    │ Bấm vào thông báo →         │
    │ trạng thái xử lý.       │    │ Vào màn hình SOS để theo dõi│
    └─────────────────────────┘    └─────────────────────────────┘
```

### Trong suốt quá trình xử lý

- **Bạn** thấy trạng thái yêu cầu cập nhật theo thời gian thực: Đang chờ → Đang xử lý → Hoàn thành.
- **Người thân** xem được vị trí của bạn và biết đơn vị nào đang đến hỗ trợ.
- **Đơn vị cứu trợ** thấy tọa độ chính xác, tên, và hồ sơ của bạn trên giao diện quản lý của họ.

### Nhắn tin trong nhóm gia đình khi có sự cố

Song song với yêu cầu khẩn cấp, mọi thành viên trong nhóm có thể nhắn tin trực tiếp cho nhau qua tính năng **nhắn tin nhóm gia đình**:

```
Bạn hoặc người thân gửi tin nhắn trong nhóm
    │
    ▼
Hệ thống phân phối tin nhắn ngay lập tức

    ├─ Người đang mở app → tin nhắn hiện ra ngay, không cần tải lại
    │
    └─ Người đóng app   → nhận thông báo đẩy với nội dung tin nhắn
                           và tên người gửi, bấm vào mở thẳng vào
                           cuộc trò chuyện nhóm
```

Tính năng này đặc biệt hữu ích trong tình huống khẩn cấp khi cần phối hợp nhanh giữa các thành viên ("Tôi đang trên đường", "Đã gọi cho cảnh sát", v.v.).

---

## Tổng quan — Ba tầng bảo vệ

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   TẦNG 1 — Theo dõi thường ngày                                │
│   Vị trí cập nhật liên tục, người thân luôn biết bạn ở đâu    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TẦNG 2 — Cảnh báo sớm                                       │
│   Phát hiện bất thường trong hành trình, cảnh báo trước        │
│   khi sự việc leo thang. Dữ liệu cộng đồng bổ sung ngữ cảnh.  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TẦNG 3 — Ứng phó khẩn cấp                                   │
│   Khi đã xảy ra sự cố: kết nối tức thì với cứu trợ,           │
│   thông báo đến toàn bộ người thân, nhắn tin phối hợp.        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Cả ba tầng hoạt động độc lập nhưng bổ trợ lẫn nhau — bạn được bảo vệ ngay từ những thay đổi nhỏ nhất trong hành trình hàng ngày, cho đến khi cần phản ứng khẩn cấp.

---

## Hướng dẫn hình ảnh — Màu sắc và phong cách thương hiệu

Phần này cung cấp thông tin màu sắc và cảm xúc thị giác để các công cụ AI tạo video có thể tái hiện đúng bản sắc của TrackNest.

### Bảng màu chủ đạo

TrackNest sử dụng tông màu **xanh ngọc lam (teal)** làm màu nhận diện chính — gợi lên sự tin cậy, bình tĩnh, và công nghệ hiện đại. Đây không phải xanh lam lạnh lẽo của doanh nghiệp, cũng không phải xanh lá thiên nhiên — đây là sắc teal ấm áp, gần gũi với cảm giác an toàn và kết nối gia đình.

#### Màu chính

| Tên | Mã màu | Mô tả cảm xúc | Dùng ở đâu |
|---|---|---|---|
| **Teal chủ đạo** | `#74becb` | Tin cậy, hiện đại, bình tĩnh | Nút bấm chính, điểm nhấn giao diện, icon tính năng |
| **Teal đậm** | `#5aa8b5` | Chắc chắn, chuyên nghiệp | Trạng thái hover, viền nhấn mạnh |
| **Teal phụ** | `#5b9aa6` | Hài hòa, thứ cấp | Nút phụ, nhãn thông tin |
| **Teal điểm nhấn** | `#4a8a96` | Chiều sâu, tin tưởng | Chi tiết trang trí, đường kẻ phân cách |

#### Màu nền và bề mặt

| Tên | Mã màu | Mô tả cảm xúc | Dùng ở đâu |
|---|---|---|---|
| **Nền trắng ngọc** | `#f8fafa` | Trong sáng, thoáng đãng | Nền trang chính, thẻ nội dung |
| **Teal nhạt** | `#a8d8e0` | Nhẹ nhàng, thân thiện | Nền thẻ phụ, vùng highlight |
| **Teal rất nhạt** | `#e0f2f5` | Tinh tế, làm nền | Vùng nền section, dải phân cách |
| **Teal cực nhạt** | `#f0f8f9` | Gần như trắng, thanh thoát | Nền hover, tooltip |

#### Màu thanh điều hướng (sidebar)

Thanh bên của web dashboard dùng nền tối để tạo tương phản với vùng nội dung sáng:

| Tên | Mã màu | Mô tả cảm xúc |
|---|---|---|
| **Nền sidebar** | `#0d1e2b` | Trang nghiêm, chuyên nghiệp, đêm tối |
| **Chữ sidebar** | `#94a3b8` | Nhẹ, dễ đọc trên nền tối |
| **Teal trên nền tối** | `#74becb` | Nổi bật, điểm sáng trên nền đêm |

#### Màu trạng thái và cảnh báo

| Tên | Mã màu | Ý nghĩa | Dùng khi |
|---|---|---|---|
| **Đỏ cảnh báo** | `#e74c3c` | Nguy hiểm, khẩn cấp, hành động cần thiết | Nút SOS, cảnh báo bất thường, lỗi hệ thống |
| **Vàng amber** | `#f0a500` (approx) | Thận trọng, chú ý | Trạng thái đang chờ xử lý |
| **Xanh lá** | `#3dbf6e` (approx) | An toàn, thành công, bình thường | Trạng thái hoàn thành, vùng quen thuộc |

---

### Hướng dẫn phong cách cho video

#### Cảm xúc tổng thể
Video nên toát lên cảm giác: **bình tĩnh nhưng đáng tin cậy** — không quá vui nhộn như app giải trí, không quá lạnh lẽo như phần mềm doanh nghiệp. Đây là một sản phẩm bảo vệ gia đình, nên hình ảnh cần ấm áp và gần gũi, nhưng vẫn thể hiện sự chuyên nghiệp của công nghệ.

#### Palette gợi ý cho từng cảnh

| Cảnh trong video | Màu nền chủ đạo | Màu nhấn | Ghi chú |
|---|---|---|---|
| Giới thiệu / màn hình mở đầu | `#0d1e2b` (tối) | `#74becb` (teal sáng) | Cảm giác đêm tối, điểm sáng hy vọng |
| Tính năng theo dõi vị trí | `#f8fafa` (sáng) | `#74becb` | Bản đồ sáng, pin vị trí teal |
| Cảnh báo bất thường | `#f8fafa` → chuyển `#e74c3c` | Đỏ + teal | Transition từ bình thường sang cảnh báo |
| Tính năng khẩn cấp (SOS) | `#e74c3c` (đỏ nổi bật) | Trắng | Căng thẳng, khẩn cấp, cần hành động |
| Nhắn tin gia đình | `#f0f8f9` (rất nhạt) | `#5aa8b5` | Ấm áp, kết nối, gần gũi |
| Màn hình kết thúc | Gradient từ `#0d1e2b` → `#74becb` | Trắng | Cảm giác tin tưởng, an toàn |

#### Gradient đặc trưng

Nếu cần gradient nhận diện thương hiệu:

```
Gradient chính:   #74becb → #4a8a96   (teal sáng → teal đậm, trái sang phải)
Gradient đêm:     #0d1e2b → #253f47   (navy đen → teal đêm, trên xuống dưới)
Gradient cảnh báo:#74becb → #e74c3c   (bình thường → nguy hiểm)
```

#### Typography và phông chữ
- Phông chữ nên là **sans-serif hiện đại**: Inter, Nunito, hoặc Be Vietnam Pro.
- Chữ trên nền sáng: `#1a1a1a` (gần đen).
- Chữ trên nền tối: trắng `#ffffff` hoặc `#94a3b8` cho chữ phụ.
- Tránh phông chữ serif hoặc kiểu chữ viết tay — TrackNest là công nghệ, không phải thủ công.

#### Hình dạng và đường nét
- Bo góc nhẹ (`12px`) — không quá vuông vức cứng nhắc, không quá tròn trịa trẻ con.
- Đường kẻ mỏng, tinh tế — teal nhạt trên nền trắng.
- Icon dạng outline (nét viền) hoặc filled đơn sắc — tránh icon nhiều màu rối mắt.
- Bản đồ nên dùng style tối giản, nền xám nhạt hoặc trắng với pin màu teal.

#### Âm thanh gợi ý (cho AI tạo nhạc nền)
- **Cảnh thường ngày / theo dõi vị trí**: nhạc nền nhẹ nhàng, ambient, tiết tấu chậm.
- **Cảnh cảnh báo**: âm thanh tăng dần, nhịp nhanh hơn nhưng không hoảng loạn.
- **Cảnh SOS / khẩn cấp**: âm thanh rõ ràng, dứt khoát, không nên dùng nhạc đáng sợ — cảm giác là "hệ thống đang vào cuộc, mọi thứ được kiểm soát".
- **Cảnh kết thúc**: nhạc giải quyết, ấm áp, nhẹ nhõm.
