import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Form,
    InputGroup,
    Badge,
    Pagination,
    Modal,
    Card,
    Row,
    Col,
    Dropdown,
} from 'react-bootstrap';
import {
    FaSearch,
    FaEye,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaFilter,
    FaCheck,
    FaTimes,
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
import { useLoading } from '../../../client/context/LoadingContext';

const OrdersList = () => {
    const { showLoading, hideLoading } = useLoading();
    const [loadingLocal, setLoadingLocal] = useState(true);

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
        setLoadingLocal(true);
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
            setLoadingLocal(false);
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePaid}`}
                    >
                        Đã thanh toán
                    </Badge>
                );
            case 'CANCELED':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCanceled}`}
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

    const getSortIcon = (field) => {
        if (sortBy !== field) return <FaSort className={styles.sortIcon} />;
        return sortOrder === 'asc' ? (
            <FaSortUp className={styles.sortIcon} />
        ) : (
            <FaSortDown className={styles.sortIcon} />
        );
    };

    return (
        <div className={styles.ordersContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h2 className={styles.pageTitle}>
                                Quản lý đơn hàng
                            </h2>
                            <p className={styles.pageSubtitle}>
                                Tổng số đơn hàng: {totalOrders}
                            </p>
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
                    {loadingLocal ? (
                        <div className={styles.loadingContainer}>
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Đang tải...
                                </span>
                            </div>
                            <p className="mt-3">Đang tải dữ liệu...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <Table
                                responsive
                                hover
                                className={styles.orderTable}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('orderCode')
                                            }
                                        >
                                            Mã ĐH {getSortIcon('orderCode')}
                                        </th>
                                        <th>Người dùng</th>
                                        <th>Sự kiện</th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('totalPrice')
                                            }
                                        >
                                            Tổng tiền{' '}
                                            {getSortIcon('totalPrice')}
                                        </th>
                                        <th>Trạng thái</th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('createdAt')
                                            }
                                        >
                                            Ngày đặt {getSortIcon('createdAt')}
                                        </th>
                                        <th className={styles.actionColumn}>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order._id}>
                                            <td>{order.orderCode}</td>
                                            <td>{order.buyerInfo.email}</td>
                                            <td>
                                                {truncateText(
                                                    order.eventName,
                                                    30,
                                                )}
                                            </td>
                                            <td>
                                                {formatCurrency(
                                                    order.totalPrice,
                                                )}
                                            </td>
                                            <td>
                                                {getStatusBadge(order.status)}
                                            </td>
                                            <td>
                                                {formatDateTime(
                                                    order.createdAt,
                                                )}
                                            </td>
                                            <td>
                                                <div
                                                    className={
                                                        styles.tableActions
                                                    }
                                                >
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
                                                    {order.status ===
                                                        'PENDING' && (
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
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <BsCartX size={60} className="mb-3" />
                            <h4>Không có đơn hàng</h4>
                            <p>
                                Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                                hiện tại
                            </p>
                        </div>
                    )}

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
                </Card.Body>
            </Card>

            {/* Order Details Modal */}
            <Modal
                show={showOrderDetails}
                onHide={() => setShowOrderDetails(false)}
                size="lg"
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
                    {selectedOrder && <OrderDetails order={selectedOrder} />}
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="outline-light"
                        onClick={() => setShowOrderDetails(false)}
                        className={styles.modalButton}
                    >
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OrdersList;
