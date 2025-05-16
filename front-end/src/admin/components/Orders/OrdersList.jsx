import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Form,
    InputGroup,
    Badge,
    Pagination,
    Modal,
} from 'react-bootstrap';
import { FaSearch, FaEye, FaTimes, FaCheck } from 'react-icons/fa';
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
import { useLoading } from '../../../client/context/LoadingContext';

const OrdersList = () => {
    const { showLoading, hideLoading } = useLoading();
    const [loadingLocal, setLoadingLocal] = useState(true);
    const [orders, setOrders] = useState([]);

    // Các state cho tìm kiếm, lọc, sắp xếp, phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt'); // Mặc định sắp xếp theo ngày tạo
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // State cho Modal chi tiết
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const itemsPerPage = 10;

    // Gọi API lấy danh sách orders khi component mount
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.getAllOrders();
            if (res.success) {
                setOrders(res.orders);
            }
        } catch (error) {
            console.log('Lỗi khi gọi API getAllOrders:', error);
        } finally {
            setLoadingLocal(false);
        }
    };

    // Lọc theo searchTerm & status
    const filteredOrders = orders.filter((order) => {
        // 1. Kiểm tra searchTerm (tìm trong orderId, userId, eventId)
        const matchesSearch =
            order.orderId.toString().includes(searchTerm) ||
            order.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.eventId.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Kiểm tra statusFilter
        // (status = 'PAID', 'CANCELED', 'PENDING'...)
        const matchesStatus =
            statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Sắp xếp
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        switch (sortBy) {
            case 'orderId':
                // Sắp xếp theo orderId (mã đơn hàng) - dạng số
                return sortOrder === 'asc'
                    ? a.orderId - b.orderId
                    : b.orderId - a.orderId;
            case 'totalPrice':
                // Sắp xếp theo tổng tiền
                return sortOrder === 'asc'
                    ? a.totalPrice - b.totalPrice
                    : b.totalPrice - a.totalPrice;
            case 'createdAt':
                // Sắp xếp theo ngày tạo
                return sortOrder === 'asc'
                    ? new Date(a.createdAt) - new Date(b.createdAt)
                    : new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });

    // Phân trang
    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
    const indexOfLastOrder = currentPage * itemsPerPage;
    const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
    const currentOrders = sortedOrders.slice(
        indexOfFirstOrder,
        indexOfLastOrder,
    );

    // Xử lý thay đổi cột sắp xếp
    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Chuyển trang
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Badge trạng thái
    // status = 'PAID', 'CANCELED', 'PENDING', ...
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCompleted}`}
                    >
                        Đã thanh toán
                    </Badge>
                );
            case 'CANCELED':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCancelled}`}
                    >
                        Đã hủy
                    </Badge>
                );
            case 'PENDING':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePending}`}
                    >
                        Đang chờ
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    // Xem chi tiết đơn hàng
    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    const handleCancelClick = async (orderId) => {
        showLoading();
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
        } finally {
            hideLoading();
        }
    };

    const handleCompleteClick = async (orderId) => {
        showLoading();
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
        } finally {
            hideLoading();
        }
    };

    return (
        <div className={styles.ordersContainer}>
            {/* Table Header */}
            <div className={styles.tableHeader}>
                <div className={styles.searchFilter}>
                    {/* Ô tìm kiếm */}
                    <InputGroup className={styles.searchInput}>
                        <InputGroup.Text id="search-addon">
                            <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Tìm kiếm đơn hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    {/* Dropdown lọc trạng thái */}
                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handlePageChange(1);
                        }}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="CANCELED">Đã hủy</option>
                        <option value="PENDING">Đang chờ</option>
                    </Form.Select>
                </div>
            </div>

            {/* Orders Table */}
            {loadingLocal ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            ) : currentOrders.length > 0 ? (
                <>
                    <div className={styles.tableWrapper}>
                        <Table responsive hover className={styles.orderTable}>
                            <thead>
                                <tr>
                                    <th
                                        onClick={() =>
                                            handleSortChange('orderId')
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Mã ĐH{' '}
                                        {sortBy === 'orderId' &&
                                            (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Người dùng</th>
                                    <th>Sự kiện</th>
                                    <th
                                        onClick={() =>
                                            handleSortChange('totalPrice')
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Tổng tiền{' '}
                                        {sortBy === 'totalPrice' &&
                                            (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Trạng thái</th>
                                    <th
                                        onClick={() =>
                                            handleSortChange('createdAt')
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Ngày đặt{' '}
                                        {sortBy === 'createdAt' &&
                                            (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrders.map((order) => (
                                    <tr key={order._id}>
                                        <td>{order.orderId}</td>
                                        <td>{order.infoUser.email}</td>
                                        <td>
                                            {truncateText(order.eventName, 30)}
                                            {}
                                        </td>
                                        <td>
                                            {formatCurrency(order.totalPrice)}
                                        </td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td>
                                            {formatDateTime(order.createdAt)}
                                        </td>
                                        <td>
                                            <div
                                                className={styles.tableActions}
                                            >
                                                {/* Xem chi tiết */}
                                                <Button
                                                    variant="link"
                                                    className={`${styles.actionButton} ${styles.viewButton}`}
                                                    title="Xem chi tiết"
                                                    onClick={() =>
                                                        handleViewOrderDetails(
                                                            order,
                                                        )
                                                    }
                                                >
                                                    <FaEye />
                                                </Button>
                                                {/* In đơn hàng */}
                                                {/* <Button
                                            variant="link"
                                            className={`${styles.actionButton} ${styles.viewButton}`}
                                            title="In đơn hàng"
                                            onClick={() =>
                                                console.log(
                                                    'Print order:',
                                                    order.orderId,
                                                )
                                            }
                                        >
                                            <FaPrint />
                                        </Button> */}
                                                {/* Nếu status = PENDING thì mới cho hủy */}
                                                {order.status === 'PENDING' &&
                                                    order.eventStatus !==
                                                        'event_over' && (
                                                        <>
                                                            <Button
                                                                variant="link"
                                                                className={`${styles.actionButton} ${styles.completeButton}`}
                                                                title="Hoàn thành đơn hàng"
                                                                onClick={() =>
                                                                    handleCompleteClick(
                                                                        order._id,
                                                                    )
                                                                }
                                                            >
                                                                <FaCheck />
                                                            </Button>
                                                            <Button
                                                                variant="link"
                                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                                title="Hủy đơn hàng"
                                                                onClick={() =>
                                                                    handleCancelClick(
                                                                        order._id,
                                                                    )
                                                                }
                                                            >
                                                                <FaTimes />
                                                            </Button>
                                                        </>
                                                    )}

                                                {order.status === 'CANCELED' &&
                                                    order.eventStatus !==
                                                        'event_over' && (
                                                        <Button
                                                            variant="link"
                                                            className={`${styles.actionButton} ${styles.completeButton}`}
                                                            title="Hoàn thành đơn hàng"
                                                            onClick={() =>
                                                                handleCompleteClick(
                                                                    order._id,
                                                                )
                                                            }
                                                        >
                                                            <FaCheck />
                                                        </Button>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.paginationContainer}>
                            <Pagination>
                                <Pagination.First
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                />
                                <Pagination.Prev
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                />

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
                                />
                                <Pagination.Last
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center my-5">
                    <BsCartX size={60} className="mb-3" />
                    <p className="fs-5">Không có đơn hàng</p>
                </div>
            )}

            {/* Order Details Modal */}
            <Modal
                show={showOrderDetails}
                onHide={() => setShowOrderDetails(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className={styles.modalTitle}>
                        Chi tiết đơn hàng
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && <OrderDetails order={selectedOrder} />}
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowOrderDetails(false)}
                    >
                        Đóng
                    </Button>
                    {/* <Button
                        variant="primary"
                        onClick={() =>
                            console.log('Print order:', selectedOrder?.orderId)
                        }
                    >
                        In đơn hàng
                    </Button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OrdersList;
