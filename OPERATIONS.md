# Vận hành thiệp cưới

## Đăng nhập

Chạy `npm run setup:admin` một lần ở máy cục bộ để tạo mật khẩu ngẫu nhiên. Mật khẩu được ghi vào `admin-access.txt`, bản băm mật khẩu và khóa phiên được ghi vào `.env.local`. Không công khai hai tệp này. Nếu đã có cấu hình, lệnh sẽ dừng để tránh đổi mật khẩu ngoài ý muốn.

Trang `/admin` kiểm tra mật khẩu tại máy chủ, phiên đăng nhập có hiệu lực 8 giờ. Khi đưa lên hosting, cấu hình `ADMIN_PASSWORD_HASH` và `SESSION_SECRET` từ `.env.local` trong phần biến môi trường rồi triển khai lại. Không dùng tiền tố `NEXT_PUBLIC_`.

## Các tiệc và khách mời

Trong mục **Các tiệc cưới**, điền ngày giờ, địa điểm và bản đồ từng tiệc. Tiệc Lào Cai kế thừa thông tin hiện có; Thanh Hóa kế thừa địa chỉ nhà gái; ngày giờ chưa biết để trống. Bấm **Lưu & Publish** để lưu các thay đổi.

Trong **Khách mời**, chọn tiệc cho nhóm khách mới hoặc cho từng link. Link riêng là quyền truy cập để khách xem và sửa xác nhận: chỉ gửi cho người được mời. Link cũ được giữ nguyên; link mới có mã ngẫu nhiên dài. Link chung ghi nhớ phản hồi trên cùng trình duyệt thông qua cookie. Xóa cookie hoặc đổi thiết bị sẽ không khôi phục phản hồi từ link chung; nên dùng link riêng.

Trong **RSVP**, lọc theo tiệc và trạng thái, bấm **Cập nhật phản hồi** để lấy dữ liệu mới mà không mất nội dung đang sửa. **Xuất CSV cho Excel** xuất đúng danh sách đang lọc, có dấu tiếng Việt. Khách sửa phản hồi sẽ cập nhật cùng một bản ghi. Phản hồi cũ không tự ghép với khách theo tên. Xóa phản hồi có hiệu lực ngay; các chỉnh sửa nội dung và link cần bấm lưu.

## Lưu trữ và sao lưu

Ở máy cục bộ: nội dung và link trong `data.json`; phản hồi mới và dấu xóa trong `rsvps.json`. Sao lưu cả hai cùng với `public/uploads`, `public/optimized`, `src/lib/image-manifest.json` và các biến môi trường. Ảnh gốc không bị xóa.

Trên Vercel/serverless: cấu hình Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, hoặc cặp `KV_REST_API_*`) và Vercel Blob (`BLOB_READ_WRITE_TOKEN`). Nội dung lưu ở khóa `wedding-data`, phản hồi mới ở hash `wedding:rsvps:v2`. Lỗi Redis sẽ được báo thay vì ghi lạc sang dữ liệu cục bộ. Giới hạn đăng nhập dùng Redis trên hosting; khi chạy cục bộ, giới hạn nằm trong bộ nhớ tiến trình.

Nội dung được kiểm tra phiên bản khi lưu: nếu hai quản trị viên chỉnh đồng thời, phiên lưu sau cần tải lại. Việc lưu nội dung không ghi đè phản hồi khách. Hai thay đổi đồng thời của cùng một khách dùng bản được lưu sau cùng.

## Ảnh

`npm run optimize:images` tạo bản WebP tối đa 1600px từ ảnh tải lên hiện có, giữ nguyên ảnh gốc. Chạy trước khi build. Ảnh tải mới tự động được giảm kích thước trên máy chủ. Tệp tải lên tối đa 25 MB, hỗ trợ ảnh JPG/PNG/WebP/AVIF và nhạc MP3/WAV/OGG.

## Kiểm tra

`npm run lint` và `npm run build` kiểm tra mã và bản dựng. `npm test` chạy kiểm thử tích hợp với dữ liệu riêng, tài khoản thử và cổng tự chọn, rồi dừng máy chủ thử. Không chạy đồng thời nhiều bộ kiểm thử. Thư mục dữ liệu thử được tách bằng `WEDDING_DATA_DIR`; không dùng tùy chọn này trên hosting. Trước khi gửi link thật, kiểm tra giờ, địa chỉ, bản đồ và mã QR mừng cưới của từng tiệc.
