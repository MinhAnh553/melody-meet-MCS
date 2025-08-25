# 🎶 Melody Meet

**Melody Meet** là một nền tảng quản lý và bán vé sự kiện âm nhạc trực tuyến, được xây dựng theo kiến trúc **Microservices**.  
Người dùng có thể tìm kiếm, đặt vé sự kiện, nhận vé QR qua email, trong khi ban tổ chức có thể tạo và quản lý sự kiện dễ dàng. Hệ thống cũng tích hợp **chatbot AI** để hỗ trợ và tư vấn người dùng.

## 🛠 Công nghệ sử dụng

- **Backend**: Node.js, Express  
- **Frontend**: React (Vite + Bootstrap, Ant Design)  
- **Cơ sở dữ liệu**: MongoDB (Mongoose)  
- **Authentication**: JSON Web Token (JWT)  
- **Message Queue**: RabbitMQ, BullMQ  
- **Cache**: Redis  
- **Triển khai**: Docker, Kubernetes (HPA autoscaling)  
- **Chatbot AI**: OpenAI API  
- **Thanh toán**: VNPAY, ZaloPay, PayOS  
- **Email/Notification**: Nodemailer, Notification Service  
- **Media Storage**: Cloudinary  

---

## ✨ Tính năng chính

### Người dùng
- Đăng ký / Đăng nhập tài khoản
- Tìm kiếm, lọc sự kiện theo địa điểm, thời gian, thể loại
- Xem chi tiết sự kiện và chọn loại vé
- Đặt vé, thanh toán trực tuyến
- Nhận vé QR qua email và xem lại lịch sử vé
- Đánh giá sự kiện sau khi tham gia
- Sử dụng Chatbot để hỏi nhanh thông tin sự kiện

### Người tổ chức sự kiện (Organizer)
- Đăng ký nâng cấp thành Ban tổ chức
- Tạo sự kiện, quản lý vé, theo dõi đơn hàng
- Xem danh sách người tham gia, doanh thu
- Quản lý thông tin tổ chức

### Quản trị viên (Admin)
- Quản lý toàn hệ thống: người dùng, sự kiện, đơn hàng
- Duyệt yêu cầu nâng cấp tổ chức
- Thống kê tổng quan: doanh thu, số sự kiện, vé bán ra

---

## 🏗 Kiến trúc hệ thống

Hệ thống được thiết kế theo **Microservices Architecture**, gồm các service:  
- **Auth Service**: Quản lý người dùng, tổ chức, xác thực JWT  
- **Event Service**: Quản lý sự kiện, loại vé  
- **Order Service**: Xử lý đơn hàng, thanh toán, giữ vé tạm  
- **Ticket Service**: Tạo vé và quản lý vé QR  
- **Media Service**: Lưu trữ hình ảnh sự kiện lên Cloudinary  
- **Chat Service**: Chatbot hỗ trợ người dùng  
- **Notification Service**: Gửi OTP, email xác nhận, thông báo đơn hàng  
- **API Gateway**: Điều phối request đến các service, xử lý CORS, logging, rate limiting  

---

## 🚀 Cách cài đặt & chạy dự án

### Clone dự án
```bash
git clone https://github.com/MinhAnh553/melody-meet-MCSs.git
cd melody-meet-microservices
