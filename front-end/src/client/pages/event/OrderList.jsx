import React, { useEffect, useState, useMemo } from 'react';
import {
    Row,
    Col,
    Card,
    Statistic,
    Input,
    Select,
    Table,
    Tag,
    Button,
    Spin,
    Modal,
    Tooltip,
    message,
} from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    NumberOutlined,
    DollarOutlined,
    FileExcelOutlined,
    UserOutlined,
    MailOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import api from '../../../util/api';
import OrderDetails from '../../../admin/components/Orders/OrderDetails';

const { Option } = Select;

const OrderList = () => {
    const [loading, setLoading] = useState(true);
    const { eventId } = useParams();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line
    }, [eventId]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.getOrdersByEventId(eventId);
            if (res.success) {
                setOrders(res.orders);
            }
        } catch (error) {
            message.error('Lỗi lấy danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    // Filtered & searched orders
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                order.orderCode
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                order.buyerInfo.email
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    // Pagination
    const pagedOrders = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredOrders.slice(start, start + pageSize);
    }, [filteredOrders, currentPage, pageSize]);

    // Statistics
    const totalOrders = filteredOrders.length;
    const totalTickets = filteredOrders.reduce(
        (sum, order) => sum + order.tickets.reduce((s, t) => s + t.quantity, 0),
        0,
    );
    const totalRevenue = filteredOrders.reduce(
        (sum, order) => sum + order.totalPrice,
        0,
    );

    // CSV Export
    const handleExportCSV = () => {
        const headers = [
            'STT',
            'Mã ĐH',
            'Email người mua',
            'Số vé',
            'Tổng tiền',
            'Trạng thái',
            'Ngày đặt',
        ];
        const rows = filteredOrders.map((order, idx) => [
            idx + 1,
            order.orderCode,
            order.buyerInfo.email,
            order.tickets.reduce((sum, t) => sum + t.quantity, 0),
            order.totalPrice.toLocaleString('vi-VN'),
            order.status,
            new Date(order.createdAt).toLocaleDateString('vi-VN'),
        ]);
        const csv = [
            '\uFEFF' + headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `orders_${eventId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Status Tag
    const getStatusTag = (status) => {
        switch (status) {
            case 'PAID':
                return <Tag color="green">Đã thanh toán</Tag>;
            case 'CANCELED':
                return <Tag color="red">Đã hủy</Tag>;
            case 'PENDING':
                return <Tag color="orange">Đang chờ</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    // Table columns
    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            width: 60,
            align: 'center',
            render: (_, __, idx) => (currentPage - 1) * pageSize + idx + 1,
        },
        {
            title: 'Mã ĐH',
            dataIndex: 'orderCode',
            render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>,
        },
        {
            title: 'Người mua',
            dataIndex: 'buyerInfo',
            render: (buyerInfo) => (
                <div>
                    <div style={{ fontWeight: 500 }}>
                        <UserOutlined /> {buyerInfo.email}
                    </div>
                </div>
            ),
        },
        {
            title: 'Số vé',
            dataIndex: 'tickets',
            align: 'center',
            render: (tickets) => (
                <Tag color="geekblue">
                    <NumberOutlined />{' '}
                    {tickets.reduce((sum, t) => sum + t.quantity, 0)}
                </Tag>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            align: 'right',
            render: (val) => (
                <span style={{ fontWeight: 600, color: '#1976d2' }}>
                    <DollarOutlined /> {val.toLocaleString('vi-VN')}đ
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            align: 'center',
            render: (status) => getStatusTag(status),
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            align: 'center',
            render: (val) => new Date(val).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            dataIndex: 'action',
            align: 'center',
            render: (_, record) => (
                <Tooltip title="Xem chi tiết">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => {
                            setSelectedOrder(record);
                            setShowOrderDetails(true);
                        }}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div style={{ padding: 24, background: '#23242a', minHeight: '100vh' }}>
            <Spin spinning={loading} tip="Đang tải...">
                <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 14 }}>
                            <Statistic
                                title="Tổng đơn hàng"
                                value={totalOrders}
                                prefix={<FileExcelOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 14 }}>
                            <Statistic
                                title="Tổng số vé"
                                value={totalTickets}
                                prefix={<NumberOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 14 }}>
                            <Statistic
                                title="Tổng doanh thu"
                                value={totalRevenue}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: '#1976d2' }}
                                suffix="đ"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 14 }}>
                            <Button
                                type="primary"
                                icon={<FileExcelOutlined />}
                                block
                                onClick={handleExportCSV}
                            >
                                Xuất CSV
                            </Button>
                        </Card>
                    </Col>
                </Row>
                <Row
                    gutter={[16, 16]}
                    align="middle"
                    style={{ marginBottom: 24 }}
                >
                    <Col xs={24} md={16}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm theo mã đơn hàng, email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            size="large"
                            style={{ borderRadius: 12 }}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Select
                            value={statusFilter}
                            onChange={(val) => {
                                setStatusFilter(val);
                                setCurrentPage(1);
                            }}
                            size="large"
                            style={{ minWidth: 200, borderRadius: 12 }}
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="PAID">Đã thanh toán</Option>
                            <Option value="CANCELED">Đã hủy</Option>
                            <Option value="PENDING">Đang chờ</Option>
                        </Select>
                    </Col>
                </Row>
                <Card bordered={false} style={{ borderRadius: 14 }}>
                    <Table
                        columns={columns}
                        dataSource={pagedOrders}
                        rowKey={(record) => record._id}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: filteredOrders.length,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '20', '50'],
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            },
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} trên ${total} đơn hàng`,
                        }}
                        scroll={{ x: 900 }}
                        bordered={false}
                        size="middle"
                        locale={{ emptyText: 'Không có đơn hàng nào' }}
                    />
                </Card>
                <Modal
                    visible={showOrderDetails}
                    onCancel={() => setShowOrderDetails(false)}
                    footer={null}
                    width={800}
                    centered
                    title={
                        <span style={{ fontWeight: 600 }}>
                            Chi tiết đơn hàng
                        </span>
                    }
                >
                    {selectedOrder && (
                        <OrderDetails
                            order={selectedOrder}
                            onClose={() => setShowOrderDetails(false)}
                        />
                    )}
                </Modal>
            </Spin>
        </div>
    );
};

export default OrderList;
