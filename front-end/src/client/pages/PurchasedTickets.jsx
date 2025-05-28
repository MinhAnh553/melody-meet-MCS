import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Nav, Pagination } from 'react-bootstrap';
import { BsTicket, BsCalendar, BsChevronRight } from 'react-icons/bs';
import QRCode from 'react-qr-code';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import noTicket from '../../assets/images/no-ticket.png';
import api from '../../util/api';
import TimeText from '../components/providers/TimeText';
import styles from './PurchasedTickets.module.css';

function PurchasedTickets() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loadingLocal, setLoadingLocal] = useState(true);
    // Các state cho tìm kiếm, lọc, sắp xếp, phân trang
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    // Quản lý tab active
    const [activeTab, setActiveTab] = useState('tickets');
    // Quản lý mở/đóng chi tiết cho từng đơn
    const [expandedOrders, setExpandedOrders] = useState({});

    const itemsPerPage = 10;

    const handleNavigation = (tab, path) => {
        setActiveTab(tab);
        navigate(path);
    };

    // Toggle mở/đóng cho 1 order
    const handleToggleOrder = (orderId) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoadingLocal(true);
            const res = await api.getMyOrders();
            if (res.success) {
                setOrders(res.orders);
            }
        } catch (error) {
            console.error('fetchOrders -> error', error);
        } finally {
            setLoadingLocal(false);
        }
    };

    // Lọc theo status
    const filteredOrders = orders.filter((order) => {
        if (statusFilter === 'all') return true; // Lấy tất cả đơn hàng
        if (statusFilter === 'upcoming')
            return order.eventStatus !== 'event_over';
        if (statusFilter === 'event_over')
            return order.eventStatus === 'event_over';
        return false;
    });

    // Phân trang
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastOrder = currentPage * itemsPerPage;
    const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
    const currentOrders = filteredOrders.slice(
        indexOfFirstOrder,
        indexOfLastOrder,
    );

    // Chuyển trang
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderOrders = () => {
        if (loadingLocal) {
            return (
                <div className="mt-5">
                    <div className="text-center my-5">
                        <div
                            className="spinner-border text-primary"
                            role="status"
                        >
                            <span className="visually-hidden">Đang tải...</span>
                        </div>
                        <p className="mt-2">Đang tải...</p>
                    </div>
                </div>
            );
        }
        if (currentOrders.length === 0) {
            return (
                <div className="text-center mt-5">
                    <img
                        src={noTicket}
                        alt="No tickets"
                        className="mb-3 rounded"
                        style={{ width: '200px' }}
                    />
                    <p className="fs-5">Không có vé phù hợp</p>
                </div>
            );
        }

        return (
            <>
                {currentOrders.map((order) => {
                    const isExpanded = !!expandedOrders[order._id];
                    return (
                        <div
                            key={order._id}
                            className="mb-4 p-3 bg-light text-dark rounded shadow-sm"
                            style={{ transition: 'transform 0.2s' }}
                        >
                            {/* Header đơn hàng */}
                            <div
                                className="d-flex justify-content-between align-items-center"
                                onClick={() => handleToggleOrder(order._id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    className="text-truncate"
                                    style={{ maxWidth: '95%' }}
                                >
                                    {/* Hiển thị trên máy tính: Đơn hàng #123 | Tên sự kiện */}
                                    <h5
                                        className="fw-bold mb-1 text-truncate d-none d-md-block"
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        Đơn hàng #{order.orderCode} |{' '}
                                        {order.eventName}
                                    </h5>

                                    {/* Hiển thị trên mobile/tablet: Đơn hàng #123: */}
                                    <h5 className="fw-bold mb-1 d-block d-md-none">
                                        Đơn hàng #{order.orderCode}
                                    </h5>
                                </div>
                                <i
                                    className={`bi ${
                                        isExpanded
                                            ? 'bi-chevron-up'
                                            : 'bi-chevron-down'
                                    } fs-4 text-secondary`}
                                />
                            </div>

                            {/* Nội dung chi tiết (items) */}
                            <div
                                className="transition-panel"
                                style={{
                                    maxHeight: isExpanded ? '10000px' : '0px',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease',
                                }}
                            >
                                <hr />
                                {/* Thông tin sự kiện */}
                                <div className={styles['event-info']}>
                                    <div className="row align-items-center mb-4">
                                        <div className="col-md-3 text-center mb-3 mb-md-0">
                                            <img
                                                src={order.background}
                                                alt={order.eventName}
                                                className="img-fluid rounded"
                                                style={{
                                                    maxHeight: '150px',
                                                    objectFit: 'cover',
                                                    width: '100%',
                                                }}
                                            />
                                        </div>
                                        <div className="col-md-9">
                                            <h4
                                                className={
                                                    styles['event-title']
                                                }
                                            >
                                                {order.eventName}
                                            </h4>
                                            <div
                                                className={
                                                    styles['event-details']
                                                }
                                            >
                                                <div className="mb-2">
                                                    <i className="bi bi-geo-alt-fill"></i>
                                                    {'   '}
                                                    <span className="fw-bold text-success">
                                                        {
                                                            order.location
                                                                .venueName
                                                        }
                                                    </span>
                                                    <br />
                                                    <span
                                                        style={{
                                                            marginLeft: '22px',
                                                        }}
                                                    >
                                                        {order.location.address}
                                                        , {order.location.ward},{' '}
                                                        {
                                                            order.location
                                                                .district
                                                        }
                                                        ,{' '}
                                                        {
                                                            order.location
                                                                .province
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <i className="bi bi-clock"></i>
                                                    {'   '}
                                                    <span className="fw-bold text-success">
                                                        <TimeText
                                                            event={order}
                                                        />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {order.tickets?.map((ticket, idx) => {
                                    const subTotal =
                                        ticket.price * ticket.quantity;
                                    return (
                                        <div
                                            key={ticket._id || idx}
                                            className={styles['ticket-card']}
                                        >
                                            <div
                                                className={
                                                    styles['ticket-header']
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles['ticket-title']
                                                    }
                                                >
                                                    <h5 className="mb-0">
                                                        {ticket.name}
                                                    </h5>
                                                    <small className="text-muted">
                                                        Số lượng:{' '}
                                                        {ticket.quantity} vé
                                                    </small>
                                                </div>
                                            </div>
                                            <div
                                                className={
                                                    styles['ticket-body']
                                                }
                                            >
                                                {Array.from({
                                                    length: ticket.quantity,
                                                }).map((_, ticketIndex) => (
                                                    <div
                                                        key={ticketIndex}
                                                        className={
                                                            styles[
                                                                'ticket-item'
                                                            ]
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles[
                                                                    'ticket-info'
                                                                ]
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'ticket-code'
                                                                    ]
                                                                }
                                                            >
                                                                Mã vé:{' '}
                                                                {
                                                                    order.orderCode
                                                                }
                                                                {idx + 1}
                                                                {ticketIndex +
                                                                    1}
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'ticket-price'
                                                                    ]
                                                                }
                                                            >
                                                                {ticket.price.toLocaleString(
                                                                    'vi-VN',
                                                                )}{' '}
                                                                đ
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles[
                                                                    'ticket-qr'
                                                                ]
                                                            }
                                                        >
                                                            <QRCode
                                                                value={`${
                                                                    order.orderCode
                                                                }${idx + 1}${
                                                                    ticketIndex +
                                                                    1
                                                                }`}
                                                                size={80}
                                                                bgColor="#ffffff"
                                                                fgColor="#000000"
                                                                level="H"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div
                                                    className={
                                                        styles['ticket-total']
                                                    }
                                                >
                                                    <span>Tổng tiền:</span>
                                                    <span>
                                                        {subTotal.toLocaleString(
                                                            'vi-VN',
                                                        )}{' '}
                                                        đ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center">
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
                                    onClick={() => handlePageChange(index + 1)}
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
        );
    };

    return (
        <Container
            fluid
            className="text-white min-vh-100 p-4"
            style={{
                margin: '80px 0',
            }}
        >
            <Row className="pt-4">
                <Col md={9} className="px-4">
                    <div>
                        <Link
                            to="/"
                            className="text-decoration-none"
                            style={{ color: 'rgb(166, 166, 176)' }}
                        >
                            Trang chủ
                        </Link>
                        <BsChevronRight className="mx-2" />
                        <span className="text-white">Vé đã mua</span>
                    </div>
                </Col>
            </Row>

            <Row className="pt-4">
                <Col md={3} className="px-4 border-end">
                    <Nav className="flex-column">
                        {/* <Nav.Link
                            className={`d-flex align-items-center mb-3 p-2 rounded hover-bg ${
                                activeTab === 'account'
                                    ? 'nav-ticket-active'
                                    : ''
                            }`}
                            onClick={() =>
                                handleNavigation('account', '/account-settings')
                            }
                        >
                            <BsPerson className="me-2" /> Cài đặt tài khoản
                        </Nav.Link> */}
                        <Nav.Link
                            className={`d-flex align-items-center mb-3 p-2 rounded hover-bg ${
                                activeTab === 'tickets'
                                    ? 'nav-ticket-active'
                                    : ''
                            }`}
                            onClick={() =>
                                handleNavigation('tickets', '/my-tickets')
                            }
                        >
                            <BsTicket className="me-2 text-success" /> Vé đã mua
                        </Nav.Link>

                        {(user?.role === 'organizer' ||
                            user?.role === 'admin') && (
                            <Nav.Link
                                className={`d-flex align-items-center p-2 rounded hover-bg ${
                                    activeTab === 'events'
                                        ? 'nav-ticket-active'
                                        : ''
                                }`}
                                onClick={() =>
                                    handleNavigation(
                                        'events',
                                        '/organizer/event',
                                    )
                                }
                            >
                                <BsCalendar className="me-2" /> Sự kiện của tôi
                            </Nav.Link>
                        )}
                    </Nav>
                </Col>

                <Col md={9} className="px-4">
                    <h2 className="mb-4 fw-bold">Vé đã mua</h2>
                    <div className="d-flex mb-4">
                        <Button
                            variant={
                                statusFilter === 'all' ? 'success' : 'secondary'
                            }
                            className="me-2 shadow-sm"
                            style={{ padding: '5px' }}
                            onClick={() => {
                                setStatusFilter('all');
                                handlePageChange(1);
                            }}
                        >
                            Tất cả
                        </Button>
                        <Button
                            variant={
                                statusFilter === 'upcoming'
                                    ? 'success'
                                    : 'secondary'
                            }
                            style={{ padding: '5px' }}
                            className="me-2 shadow-sm"
                            onClick={() => {
                                setStatusFilter('upcoming');
                                handlePageChange(1);
                            }}
                        >
                            Chưa diễn ra
                        </Button>
                        <Button
                            variant={
                                statusFilter === 'event_over'
                                    ? 'success'
                                    : 'secondary'
                            }
                            style={{ padding: '5px' }}
                            className="shadow-sm"
                            onClick={() => {
                                setStatusFilter('event_over');
                                handlePageChange(1);
                            }}
                        >
                            Đã diễn ra
                        </Button>
                    </div>

                    {renderOrders()}
                </Col>
            </Row>
        </Container>
    );
}

export default PurchasedTickets;
