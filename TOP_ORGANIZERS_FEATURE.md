# Chức năng BXH Top 10 Ban Tổ Chức

## Mô tả

Chức năng này hiển thị bảng xếp hạng top 10 ban tổ chức có doanh thu cao nhất trong khoảng thời gian được chọn (ngày, tuần, tháng, năm).

## Logic hoạt động

1. Lấy danh sách đơn hàng đã PAID trong khoảng thời gian đã chọn
2. Nhóm theo sự kiện và tính tổng doanh thu cho từng ban tổ chức
3. Sắp xếp theo doanh thu giảm dần và lấy top 10

## API Endpoint

### GET /v1/orders/top-organizers

Lấy danh sách top 10 ban tổ chức có doanh thu cao nhất.

**Parameters:**

-   `period` (optional): Khoảng thời gian ('day', 'week', 'month', 'year'). Mặc định là 'month'

**Headers:**

-   `Authorization`: Bearer token (Admin role required)

**Response:**

```json
{
    "success": true,
    "data": {
        "period": "month",
        "topOrganizers": [
            {
                "_id": "organizer_id",
                "organizerName": "Tên ban tổ chức",
                "organizerEmail": "email@example.com",
                "organizerLogo": "logo_url",
                "totalRevenue": 10000000,
                "totalOrders": 50,
                "eventCount": 5
            }
        ],
        "dateRange": {
            "start": "2024-01-01T00:00:00.000Z",
            "end": "2024-02-01T00:00:00.000Z"
        }
    }
}
```

## Frontend Component

### TopOrganizersRanking

Component hiển thị bảng xếp hạng với các tính năng:

-   Hiển thị top 10 ban tổ chức
-   Icons đặc biệt cho 3 vị trí đầu (vàng, bạc, đồng)
-   Thông tin chi tiết: tên, email, logo, doanh thu, số đơn hàng, số sự kiện
-   Responsive design
-   Hỗ trợ các khoảng thời gian khác nhau

### Vị trí trong Dashboard

Component được tích hợp vào trang Dashboard của Admin, hiển thị giữa phần Charts và Summary Cards.

## Cài đặt và Sử dụng

### Backend

1. API endpoint đã được thêm vào `order-service`
2. Route đã được cấu hình trong `orderRoute.js`
3. Controller function `getTopOrganizers` đã được implement

### Frontend

1. Component `TopOrganizersRanking` đã được tạo
2. CSS styles đã được thêm vào `Dashboard.module.css`
3. API function `getTopOrganizers` đã được thêm vào `api.js`
4. Component đã được tích hợp vào Dashboard

## Tính năng

-   ✅ Hiển thị top 10 ban tổ chức theo doanh thu
-   ✅ Hỗ trợ lọc theo thời gian (ngày/tuần/tháng/năm)
-   ✅ Hiển thị thông tin chi tiết của từng ban tổ chức
-   ✅ Icons đặc biệt cho 3 vị trí đầu
-   ✅ Responsive design
-   ✅ Loading state và error handling
-   ✅ Tích hợp với period selector của Dashboard

## Database Query

Sử dụng MongoDB Aggregation Pipeline:

1. Match orders với status 'PAID' và trong khoảng thời gian
2. Lookup với collection events để lấy thông tin ban tổ chức
3. Group theo createdBy (ban tổ chức)
4. Lookup với collection users để lấy thông tin chi tiết
5. Sort theo totalRevenue giảm dần
6. Limit 10 kết quả

## Security

-   Chỉ Admin role mới có thể truy cập
-   Sử dụng JWT authentication
-   Rate limiting được áp dụng thông qua API Gateway
