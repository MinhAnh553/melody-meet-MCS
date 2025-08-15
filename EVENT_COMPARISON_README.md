# Event Comparison Feature

## Tổng quan

Tính năng "So sánh sự kiện" cho phép các nhà tổ chức sự kiện (organizers) so sánh doanh thu và hiệu suất giữa các sự kiện của họ. Tính năng này cung cấp các biểu đồ trực quan và bảng so sánh chi tiết để giúp organizers phân tích hiệu quả hoạt động.

## Tính năng chính

### 1. So sánh theo thời gian

-   **Tất cả thời gian**: So sánh tất cả sự kiện đã được duyệt và đã kết thúc
-   **Tháng này**: Chỉ tính các đơn hàng trong tháng hiện tại
-   **Quý này**: Chỉ tính các đơn hàng trong quý hiện tại
-   **Năm nay**: Chỉ tính các đơn hàng trong năm hiện tại

### 2. Sắp xếp linh hoạt

-   **Doanh thu**: Sắp xếp theo tổng doanh thu giảm dần
-   **Vé bán**: Sắp xếp theo số lượng vé đã bán
-   **Đơn hàng**: Sắp xếp theo số lượng đơn hàng
-   **Ngày tạo**: Sắp xếp theo ngày tạo sự kiện

### 3. Thống kê tổng quan

-   Tổng doanh thu của tất cả sự kiện
-   Tổng số vé đã bán
-   Tổng số đơn hàng
-   Số lượng sự kiện

### 4. Biểu đồ trực quan

-   **Biểu đồ cột doanh thu**: So sánh doanh thu giữa các sự kiện
-   **Biểu đồ cột vé bán**: So sánh số lượng vé bán giữa các sự kiện

### 5. Bảng so sánh chi tiết

-   Tên sự kiện và hình ảnh
-   Ngày diễn ra
-   Trạng thái sự kiện
-   Doanh thu
-   Số vé bán/tổng vé
-   Số đơn hàng
-   Tỷ lệ bán vé (với thanh progress)
-   Giá vé trung bình

## API Endpoint

### GET /v1/events/organizer/comparison

**Quyền truy cập**: Chỉ dành cho organizers và admins

**Parameters**:

-   `period` (optional): `all`, `month`, `quarter`, `year` (default: `all`)

**Response**:

```json
{
    "success": true,
    "data": [
        {
            "eventId": "event_id",
            "eventName": "Tên sự kiện",
            "eventDate": "2024-01-01T00:00:00.000Z",
            "status": "approved",
            "background": "url_hinh_anh",
            "location": {
                "venueName": "Tên địa điểm",
                "address": "Địa chỉ"
            },
            "totalRevenue": 1000000,
            "totalSold": 50,
            "totalOrders": 25,
            "totalTickets": 100,
            "soldPercentage": 50.0,
            "averageTicketPrice": 20000,
            "ticketTypes": 3,
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    ],
    "period": "all"
}
```

## Cách sử dụng

### 1. Truy cập tính năng

-   Đăng nhập với tài khoản organizer
-   Vào trang `/organizer/event`
-   Nhấn nút "So sánh sự kiện" ở góc trên bên phải

### 2. Lọc dữ liệu

-   Chọn khoảng thời gian từ dropdown "Thời gian"
-   Chọn tiêu chí sắp xếp từ dropdown "Sắp xếp theo"

### 3. Xem thống kê

-   Xem tổng quan ở 4 card đầu tiên
-   Xem biểu đồ doanh thu và vé bán
-   Xem bảng so sánh chi tiết ở cuối trang

### 4. Quay lại

-   Nhấn nút "← Quay lại" để trở về trang quản lý sự kiện

## Cài đặt và triển khai

### Backend (Event Service)

1. Thêm route mới trong `services/event-service/src/routes/eventRoute.js`:

```javascript
Router.route('/organizer/comparison').get(
    authMiddleware.isValidPermission(['organizer', 'admin']),
    eventController.getEventComparison,
);
```

2. Thêm function `getEventComparison` trong `services/event-service/src/controllers/eventController.js`

3. Export function trong export statement

### Frontend

1. Thêm API function trong `front-end/src/util/api.js`:

```javascript
const getEventComparison = (period = 'all') => {
    const URL_API = `${API_URL}/events/organizer/comparison?period=${period}`;
    return axios.get(URL_API);
};
```

2. Tạo component `EventComparison.jsx` trong `front-end/src/client/pages/event/`

3. Thêm route trong `front-end/src/router/routes.jsx`:

```javascript
<Route path="comparison" element={<EventComparison />} />
```

4. Thêm nút navigation trong `EventManagement.jsx`

## Logic xử lý

### 1. Lấy dữ liệu sự kiện

-   Query tất cả sự kiện của organizer với status `approved` hoặc `event_over`
-   Sắp xếp theo ngày tạo giảm dần

### 2. Tính toán thống kê

-   Lấy đơn hàng từ order-service cho từng sự kiện
-   Lọc đơn hàng theo period và status `PAID`
-   Tính tổng doanh thu, số vé bán, số đơn hàng
-   Tính giá vé trung bình và tỷ lệ bán

### 3. Sắp xếp và trả về

-   Sắp xếp theo doanh thu giảm dần
-   Trả về dữ liệu đã được format

## Bảo mật

-   Chỉ organizers và admins có thể truy cập
-   Mỗi organizer chỉ thấy dữ liệu của mình
-   Sử dụng JWT authentication
-   Validate input parameters

## Hiệu suất

-   Sử dụng Promise.all để gọi API song song
-   Cache dữ liệu với Redis (nếu cần)
-   Pagination cho dữ liệu lớn (có thể mở rộng)

## Mở rộng tương lai

-   Export dữ liệu ra Excel/PDF
-   So sánh với các organizers khác (anonymized)
-   Thêm các metrics khác (ROI, conversion rate)
-   Real-time updates
-   Email reports định kỳ
