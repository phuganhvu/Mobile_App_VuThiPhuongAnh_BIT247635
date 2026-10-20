# Video demo
https://drive.google.com/drive/folders/1c2XThDJ9gdPSKPHpepcHaJXXL-hLgaGM?usp=sharing
# Course Manager – Ứng dụng Quản lý Khóa học

**Sinh viên:** Vũ Thị Phương Anh  
**MSSV:** BIT247635  
**Nền tảng:** React Native + Expo  
**Backend:** MockAPI.io (REST API)

## Cấu hình MockAPI

Project MockAPI đã được cấu hình. Ứng dụng gọi trực tiếp hai resource hiện có:

- Danh mục: `https://6acde9adf338359cf1c29dbd.mockapi.io/Categories`
- Khóa học: `https://6acde9adf338359cf1c29dbd.mockapi.io/Courses`

Đường dẫn resource phân biệt chữ hoa/thường. Có thể ghi đè domain bằng biến `EXPO_PUBLIC_MOCKAPI_BASE_URL` nếu cần; giữ nguyên resource paths `/Categories` và `/Courses`.

Ứng dụng lấy dữ liệu từ API, không dùng danh sách hardcode thay thế. Khóa học đọc được cả `categoryId` và `categoryID` để tương thích với resource đang có.

## Cài đặt và chạy

Yêu cầu Node.js 18+.

```bash
npm install
npx expo start
```

Chạy trên web:

```bash
npx expo start --web
```

Chạy trên Android:

```bash
npx expo start --android
```

## Chức năng

- Danh sách khóa học từ MockAPI, tìm kiếm theo tên và lọc theo danh mục.
- Chi tiết khóa học gồm thông tin, ảnh bìa, tên danh mục lấy từ API và nút phát trailer.
- Thêm/sửa khóa học qua form; chọn danh mục từ API, xem trước ảnh bìa và kiểm tra dữ liệu trước khi gửi.
- Xóa khóa học sau xác nhận.
- Quản lý danh mục: xem, thêm, sửa và xóa; không cho xóa danh mục đang được khóa học sử dụng.
- Hiển thị trạng thái đang tải, lỗi kết nối và danh sách rỗng.

Các thay đổi được gửi tới MockAPI bằng REST API: GET, POST, PUT và DELETE. Ảnh bìa và trailer được lưu dưới dạng URL; trailer cần là URL MP4 trực tiếp để phát trong ứng dụng.
