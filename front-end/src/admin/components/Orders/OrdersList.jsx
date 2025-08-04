import React, { useState, useEffect } from 'react';
import {
    Button,
    Form,
    InputGroup,
    Pagination,
    Modal,
    Card,
    Row,
    Col,
    Dropdown,
} from 'react-bootstrap';
import { Table, Space, Tag, Tooltip, Empty } from 'antd';
import {
    EyeOutlined,
    CheckOutlined,
    CloseOutlined,
    SettingOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    CalendarOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
} from '@ant-design/icons';
import {
    FaSearch,
    FaFilter,
    FaTimes,
    FaChartBar,
    FaCog,
    FaShoppingCart,
    FaAngleLeft,
    FaAngleRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
} from 'react-icons/fa';

import styles from './Orders.module.css';
import {
    formatCurrency,
    formatDateTime,
    truncateText,
} from '../../utils/formatters';
import OrderDetails from './OrderDetails';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import { BsCartX } from 'react-icons/bs';
import LoadingSpinner from '../../../client/components/loading/LoadingSpinner';

const OrdersList = () => {
    const [loading, setLoading] = useState(true);

    const [orders, setOrders] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchOrders();
    }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.getAllOrders({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                sortBy,
                sortOrder,
            });
            if (res.success) {
                setOrders(res.orders);
                setTotalPages(res.totalPages);
                setTotalOrders(res.totalOrders);
            }
        } catch (error) {
            console.log('Lỗi khi gọi API getAllOrders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đã thanh toán
                    </Tag>
                );
            case 'CANCELED':
                return (
                    <Tag color="error" icon={<CloseOutlined />}>
                        Đã hủy
                    </Tag>
                );
            case 'PENDING':
                return (
                    <Tag color="processing" icon={<ClockCircleOutlined />}>
                        Đang chờ
                    </Tag>
                );
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    const handleCancelClick = async (orderId) => {
        try {
            const res = await api.updateStatusOrder(orderId, 'CANCELED');
            if (res.success) {
                fetchOrders();
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Đổi trạng thái thành công!',
                });
            } else {
                console.log(res.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCompleteClick = async (orderId) => {
        try {
            const res = await api.updateStatusOrder(orderId, 'PAID');
            if (res.success) {
                fetchOrders();
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Đổi trạng thái thành công!',
                });
            } else {
                console.log(res.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getSortIcon = (field) => {
        const isActive = sortBy === field;
        const isAsc = sortOrder === 'asc';
        const activeColor = '#1890ff';
        const defaultColor = '#bfbfbf';

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            >
                <CaretUpOutlined
                    style={{
                        color: isActive && isAsc ? activeColor : defaultColor,
                        fontSize: '10px',
                        marginBottom: '-2px',
                    }}
                />
                <CaretDownOutlined
                    style={{
                        color: isActive && !isAsc ? activeColor : defaultColor,
                        fontSize: '10px',
                        marginTop: '-2px',
                    }}
                />
            </div>
        );
    };

    // Ant Design Table columns configuration
    const columns = [
        {
            title: (
                <Space>
                    <ShoppingCartOutlined />
                    Mã đơn hàng
                    <span onClick={() => handleSortChange('orderCode')}>
                        {getSortIcon('orderCode')}
                    </span>
                </Space>
            ),
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (orderCode) => (
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                    {orderCode}
                </span>
            ),
        },
        {
            title: (
                <Space>
                    <UserOutlined />
                    Khách hàng
                </Space>
            ),
            dataIndex: 'buyerInfo',
            key: 'customer',
            render: (buyerInfo) => (
                <Space>
                    <UserOutlined />
                    {truncateText(buyerInfo?.email || '', 30)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <CalendarOutlined />
                    Ngày đặt
                    <span onClick={() => handleSortChange('createdAt')}>
                        {getSortIcon('createdAt')}
                    </span>
                </Space>
            ),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => (
                <Space>
                    <CalendarOutlined />
                    {formatDateTime(createdAt)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <DollarOutlined />
                    Tổng tiền
                    <span onClick={() => handleSortChange('totalPrice')}>
                        {getSortIcon('totalPrice')}
                    </span>
                </Space>
            ),
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (totalPrice) => (
                <Space>
                    <DollarOutlined />
                    <span style={{ fontWeight: 'bold' }}>
                        {formatCurrency(totalPrice)}
                    </span>
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <CheckCircleOutlined />
                    Trạng thái
                </Space>
            ),
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
        },
        {
            title: (
                <Space>
                    <SettingOutlined />
                    Thao tác
                </Space>
            ),
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <span
                            onClick={() => handleViewOrderDetails(record)}
                            style={{
                                color: '#1890ff',
                                cursor: 'pointer',
                            }}
                        >
                            <EyeOutlined />
                        </span>
                    </Tooltip>
                    {record.status === 'PENDING' && (
                        <>
                            <Tooltip title="Hoàn thành">
                                <span
                                    // className={styles.iconButton}
                                    onClick={() =>
                                        handleCompleteClick(record._id)
                                    }
                                    style={{
                                        color: '#52c41a',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <CheckCircleFilled />
                                </span>
                            </Tooltip>
                            <Tooltip title="Hủy đơn">
                                <span
                                    // className={`${styles.iconButton} ${styles.iconButtonCancel}`}
                                    onClick={() =>
                                        handleCancelClick(record._id)
                                    }
                                    style={{
                                        color: '#dc2626',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <CloseCircleFilled />
                                </span>
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.ordersContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className={styles.titleSection}>
                                <div className={styles.titleIcon}>
                                    <FaShoppingCart />
                                </div>
                                <div>
                                    <h2 className={styles.pageTitle}>
                                        <FaCog
                                            className={styles.titleIconSmall}
                                        />
                                        Quản lý đơn hàng
                                    </h2>
                                    <p className={styles.pageSubtitle}>
                                        <FaChartBar
                                            className={styles.subtitleIcon}
                                        />
                                        Tổng số đơn hàng: {totalOrders}
                                    </p>
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className={styles.searchFilter}>
                                <InputGroup className={styles.searchInput}>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Tìm kiếm đơn hàng..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </InputGroup>

                                <Dropdown>
                                    <Dropdown.Toggle
                                        variant="outline-secondary"
                                        id="status-filter"
                                        className={styles.filterDropdown}
                                    >
                                        <FaFilter className="me-2" />
                                        {statusFilter === 'all'
                                            ? 'Tất cả trạng thái'
                                            : statusFilter === 'PAID'
                                            ? 'Đã thanh toán'
                                            : statusFilter === 'PENDING'
                                            ? 'Đang chờ'
                                            : 'Đã hủy'}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('all');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Tất cả trạng thái
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('PAID');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã thanh toán
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('PENDING');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đang chờ
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('CANCELED');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã hủy
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Orders Table */}
            <Card className={styles.tableCard}>
                <Card.Body>
                    <div className={styles.tableWrapper}>
                        <Table
                            columns={columns}
                            dataSource={loading ? [] : orders}
                            rowKey="_id"
                            pagination={false}
                            loading={loading}
                            size="middle"
                            className={styles.antTable}
                            rowClassName={(record, index) =>
                                index % 2 === 0 ? styles.evenRow : styles.oddRow
                            }
                            locale={{
                                emptyText: loading ? (
                                    <div style={{ padding: '40px 0' }}>
                                        {/* <LoadingSpinner /> */}
                                    </div>
                                ) : (
                                    <Empty
                                        image={<BsCartX size={60} />}
                                        description={
                                            <div>
                                                <h4>Không có đơn hàng</h4>
                                                <p>
                                                    Không tìm thấy đơn hàng nào
                                                    phù hợp với bộ lọc hiện tại
                                                </p>
                                            </div>
                                        }
                                    />
                                ),
                            }}
                        />
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.paginationContainer}>
                            <Pagination>
                                <Pagination.First
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    <FaAngleDoubleLeft />
                                </Pagination.First>
                                <Pagination.Prev
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <FaAngleLeft />
                                </Pagination.Prev>

                                {[...Array(totalPages)].map((_, index) => (
                                    <Pagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() =>
                                            handlePageChange(index + 1)
                                        }
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    <FaAngleRight />
                                </Pagination.Next>
                                <Pagination.Last
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <FaAngleDoubleRight />
                                </Pagination.Last>
                            </Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Chi tiết Đơn hàng */}
            <Modal
                show={showOrderDetails}
                onHide={() => setShowOrderDetails(false)}
                size="xl"
                centered
                className={styles.orderModal}
                contentClassName={styles.modalContent}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        Chi tiết đơn hàng
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {selectedOrder && (
                        <OrderDetails
                            order={selectedOrder}
                            onClose={() => setShowOrderDetails(false)}
                        />
                    )}
                </Modal.Body>
                {/* <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="outline-light"
                        onClick={() => setShowOrderDetails(false)}
                        className={styles.modalButton}
                    >
                        <FaTimes className="me-2" />
                        Đóng
                    </Button>
                </Modal.Footer> */}
            </Modal>
        </div>
    );
};

export default OrdersList;
