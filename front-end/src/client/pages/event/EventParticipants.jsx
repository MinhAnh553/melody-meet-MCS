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
    message,
    Tooltip,
} from 'antd';
import {
    SearchOutlined,
    MailOutlined,
    PhoneOutlined,
    FileExcelOutlined,
    EyeOutlined,
    UserOutlined,
    NumberOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import api from '../../../util/api';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;

const EventParticipants = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]); // Đã gom nhóm theo email
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTicketType, setFilterTicketType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch event & participants
    useEffect(() => {
        fetchEventDetails();
        fetchParticipants();
        // eslint-disable-next-line
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const res = await api.getEventById(eventId);
            if (res.success) setEvent(res.event);
        } catch (error) {
            message.error('Không thể tải thông tin sự kiện');
        }
    };

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const res = await api.getEventParticipants(eventId);
            if (res.success) {
                // Gom nhóm theo email
                const ordersPaid = res.orders.filter(
                    (order) => order.status === 'PAID',
                );
                const groupedByEmail = {};
                ordersPaid.forEach((order) => {
                    const email = order.buyerInfo.email;
                    if (!groupedByEmail[email]) {
                        groupedByEmail[email] = {
                            _id: order._id,
                            fullName: order.buyerInfo.name,
                            email: order.buyerInfo.email,
                            phone: order.buyerInfo.phone,
                            orders: [],
                            totalPrice: 0,
                            totalTickets: 0,
                            ticketTypes: new Set(),
                            firstPurchaseDate: order.createdAt,
                        };
                    }
                    groupedByEmail[email].orders.push(order);
                    groupedByEmail[email].totalPrice += order.totalPrice;
                    groupedByEmail[email].totalTickets += order.tickets.length;
                    order.tickets.forEach((ticket) =>
                        groupedByEmail[email].ticketTypes.add(ticket.name),
                    );
                    if (
                        new Date(order.createdAt) <
                        new Date(groupedByEmail[email].firstPurchaseDate)
                    ) {
                        groupedByEmail[email].firstPurchaseDate =
                            order.createdAt;
                    }
                });
                const participantsData = Object.values(groupedByEmail).map(
                    (group) => ({
                        _id: group._id,
                        fullName: group.fullName,
                        email: group.email,
                        phone: group.phone,
                        ticketType: Array.from(group.ticketTypes),
                        purchasedAt: group.firstPurchaseDate,
                        orderIds: group.orders.map((order) => order._id),
                        totalPrice: group.totalPrice,
                        totalTickets: group.totalTickets,
                        tickets: group.orders.flatMap((order) => order.tickets),
                    }),
                );
                setParticipants(participantsData);
            }
        } catch (error) {
            message.error('Không thể tải danh sách người tham gia');
        } finally {
            setLoading(false);
        }
    };

    // Lấy tất cả loại vé duy nhất
    const allTicketTypes = useMemo(() => {
        const set = new Set();
        participants.forEach((p) => p.ticketType.forEach((t) => set.add(t)));
        return Array.from(set);
    }, [participants]);

    // Lọc và tìm kiếm client-side
    const filteredParticipants = useMemo(() => {
        let data = participants;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(
                (p) =>
                    p.fullName.toLowerCase().includes(lower) ||
                    p.email.toLowerCase().includes(lower) ||
                    (p.phone && p.phone.includes(lower)),
            );
        }
        if (filterTicketType !== 'all') {
            data = data.filter((p) => p.ticketType.includes(filterTicketType));
        }
        return data;
    }, [participants, searchTerm, filterTicketType]);

    // Phân trang client-side
    const pagedParticipants = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredParticipants.slice(start, start + pageSize);
    }, [filteredParticipants, currentPage, pageSize]);

    // Thống kê
    const totalTickets = filteredParticipants.reduce(
        (sum, p) => sum + p.totalTickets,
        0,
    );
    const totalRevenue = filteredParticipants.reduce(
        (sum, p) => sum + p.totalPrice,
        0,
    );

    // Xuất CSV
    const handleExportCSV = () => {
        const headers = [
            'STT',
            'Họ và tên',
            'Email',
            'Số điện thoại',
            'Loại vé (số lượng)',
            'Tổng số vé',
            'Tổng tiền',
            'Số đơn hàng',
            'Ngày mua đầu tiên',
        ];
        const rows = filteredParticipants.map((p, idx) => {
            // Đếm số lượng từng loại vé
            const ticketCount = {};
            p.tickets.forEach((ticket) => {
                ticketCount[ticket.name] = (ticketCount[ticket.name] || 0) + 1;
            });
            // Bọc chuỗi loại vé trong dấu ngoặc kép
            const ticketTypeString =
                '"' +
                Object.entries(ticketCount)
                    .map(([name, count]) => `${name} (${count})`)
                    .join(', ') +
                '"';
            return [
                idx + 1,
                `"${p.fullName}"`,
                `"${p.email}"`,
                "'" + p.phone,
                ticketTypeString,
                p.totalTickets,
                p.totalPrice.toLocaleString('vi-VN'),
                p.orderIds.length,
                "'" + new Date(p.purchasedAt).toLocaleDateString('vi-VN'),
            ];
        });
        const csv = [
            '\uFEFF' + headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute(
            'download',
            `participants_${event?.name || 'event'}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            title: 'Thông tin người tham gia',
            dataIndex: 'fullName',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>
                        <UserOutlined /> {record.fullName}
                    </div>
                    <div style={{ color: '#888', fontSize: 13 }}>
                        <MailOutlined /> {record.email}
                    </div>
                    <div style={{ color: '#888', fontSize: 13 }}>
                        <PhoneOutlined /> {record.phone}
                    </div>
                </div>
            ),
        },
        {
            title: 'Loại vé',
            dataIndex: 'ticketType',
            render: (types) =>
                types.map((type) => (
                    <Tag color="blue" key={type}>
                        {type}
                    </Tag>
                )),
        },
        {
            title: 'Số lượng vé',
            dataIndex: 'totalTickets',
            align: 'center',
            render: (val) => (
                <Tag color="geekblue">
                    <NumberOutlined /> {val}
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
            title: 'Ngày mua',
            dataIndex: 'purchasedAt',
            align: 'center',
            render: (val) => new Date(val).toLocaleDateString('vi-VN'),
        },
        // {
        //     title: 'Thao tác',
        //     dataIndex: 'action',
        //     align: 'center',
        //     render: (_, record) => (
        //         <div
        //             style={{
        //                 display: 'flex',
        //                 gap: 8,
        //                 justifyContent: 'center',
        //             }}
        //         >
        //             <Tooltip title="Xem chi tiết đơn hàng đầu tiên">
        //                 <Button
        //                     type="primary"
        //                     icon={<EyeOutlined />}
        //                     size="small"
        //                     onClick={() =>
        //                         navigate(
        //                             `/organizer/orders/${record.orderIds[0]}`,
        //                         )
        //                     }
        //                 >
        //                     Xem chi tiết
        //                 </Button>
        //             </Tooltip>
        //             {record.orderIds.length > 1 && (
        //                 <Tag color="default">+{record.orderIds.length - 1}</Tag>
        //             )}
        //         </div>
        //     ),
        // },
    ];

    return (
        <div style={{ padding: 24, background: '#23242a', minHeight: '100vh' }}>
            <Spin spinning={loading} tip="Đang tải...">
                <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card bordered={false} style={{ borderRadius: 14 }}>
                            <Statistic
                                title="Tổng người tham gia"
                                value={filteredParticipants.length}
                                prefix={<UserOutlined />}
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
                            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
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
                            value={filterTicketType}
                            onChange={(val) => {
                                setFilterTicketType(val);
                                setCurrentPage(1);
                            }}
                            size="large"
                            style={{ minWidth: 200, borderRadius: 12 }}
                        >
                            <Option value="all">Tất cả loại vé</Option>
                            {allTicketTypes.map((type) => (
                                <Option value={type} key={type}>
                                    {type}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
                <Card bordered={false} style={{ borderRadius: 14 }}>
                    <Table
                        columns={columns}
                        dataSource={pagedParticipants}
                        rowKey={(record) => record.email}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: filteredParticipants.length,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '20', '50'],
                            onChange: (page, size) => {
                                setCurrentPage(page);
                                setPageSize(size);
                            },
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} trên ${total} người tham gia`,
                        }}
                        scroll={{ x: 900 }}
                        bordered={false}
                        size="middle"
                        locale={{ emptyText: 'Không có người tham gia nào' }}
                    />
                </Card>
            </Spin>
        </div>
    );
};

export default EventParticipants;
