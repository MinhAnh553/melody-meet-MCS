import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Button, Nav, Pagination } from 'react-bootstrap';
import { BsTicket, BsCalendar, BsChevronRight } from 'react-icons/bs';
import QRCode from 'react-qr-code';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import noTicket from '../../assets/images/no-ticket.png';
import api from '../../util/api';
import TimeText from '../components/providers/TimeText';
import { usePermission } from '../../hooks/usePermission';
import { permissions } from '../../config/rbacConfig';
import ReviewForm from '../components/ReviewForm';
import styles from './PurchasedTickets.module.css';
import LoadingSpinner from '../components/loading/LoadingSpinner';
import html2canvas from 'html2canvas';

function PurchasedTickets() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { hasPermission } = usePermission(user?.role);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // Các state cho tìm kiếm, lọc, sắp xếp, phân trang
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    // Quản lý tab active
    const [activeTab, setActiveTab] = useState('tickets');
    // Quản lý mở/đóng chi tiết cho từng đơn
    const [expandedOrders, setExpandedOrders] = useState({});

    // State cho review
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [eventReviews, setEventReviews] = useState({}); // Lưu mapping giữa eventId và review

    const itemsPerPage = 10;

    // Ref cho từng ticket-item
    const ticketRefs = useRef({});
    // Ref cho từng order (block lớn)
    const orderRefs = useRef({});
    // Ref cho từng ticket card
    const ticketCardRefs = useRef({});

    // Hàm tải vé thành ảnh (chỉ chụp ticket card)
    const handleDownloadTicketCard = (orderId, ticketIdx) => {
        const ref = ticketCardRefs.current[`${orderId}_${ticketIdx}`];
        if (ref) {
            const btn = ref.querySelector('.hide-when-download');
            if (btn) btn.classList.add('hide-for-capture');
            setTimeout(() => {
                html2canvas(ref, { backgroundColor: null }).then((canvas) => {
                    const link = document.createElement('a');
                    link.download = `ticket_${orderId}_${ticketIdx}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    if (btn) btn.classList.remove('hide-for-capture');
                });
            }, 100);
        }
    };

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

    // Kiểm tra đánh giá cho các sự kiện có thể đánh giá
    useEffect(() => {
        const checkReviewsForEvents = async () => {
            const reviewPromises = [];

            orders.forEach((order) => {
                if (canReviewEvent(order)) {
                    const reviewId = generateReviewId(order.eventId, user.id);
                    reviewPromises.push(
                        checkEventReview(order.eventId).then((review) => {
                            if (review) {
                                setEventReviews((prev) => ({
                                    ...prev,
                                    [reviewId]: review,
                                }));
                            }
                        }),
                    );
                }
            });

            await Promise.all(reviewPromises);
        };

        if (orders.length > 0 && user) {
            checkReviewsForEvents();
        }
    }, [orders, user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await api.getMyOrders();
            if (res.success) {
                setOrders(res.orders);
            }
        } catch (error) {
            console.error('fetchOrders -> error', error);
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra sự kiện đã được đánh giá chưa
    const checkEventReview = async (eventId) => {
        try {
            const res = await api.checkEventReview(eventId);
            if (res.success) {
                const reviewId = generateReviewId(eventId, user.id);
                setEventReviews((prev) => ({
                    ...prev,
                    [reviewId]: res.review,
                }));
                return res.review;
            }
        } catch (error) {
            console.error('checkEventReview error:', error);
        }
        return null;
    };

    // Mở form đánh giá
    const handleOpenReviewForm = async (eventId) => {
        // Kiểm tra sự kiện đã đánh giá chưa
        const existingReview = await checkEventReview(eventId);

        setSelectedEvent({ eventId });
        setSelectedReview(existingReview);
        setShowReviewForm(true);
    };

    // Xử lý sau khi đánh giá thành công
    const handleReviewSuccess = () => {
        // Cập nhật lại danh sách đánh giá
        if (selectedEvent) {
            const reviewId = generateReviewId(selectedEvent.eventId, user.id);
            checkEventReview(selectedEvent.eventId).then((review) => {
                if (review) {
                    setEventReviews((prev) => ({
                        ...prev,
                        [reviewId]: review,
                    }));
                }
            });
        }
        // Refresh lại danh sách orders để cập nhật trạng thái
        fetchOrders();
    };

    // Kiểm tra sự kiện có thể đánh giá không
    const canReviewEvent = (order) => {
        return new Date(order.endTime) < new Date() && order.status === 'PAID';
    };

    // Tạo reviewId từ eventId và userId
    const generateReviewId = (eventId, userId) => {
        return `${eventId}_${userId}`;
    };

    // Lọc theo status
    const filteredOrders = orders.filter((order) => {
        if (statusFilter === 'all') return true; // Lấy tất cả đơn hàng

        const now = new Date();
        const eventEndTime = new Date(order.endTime);

        if (statusFilter === 'upcoming') {
            // Chưa diễn ra: thời gian kết thúc sự kiện > thời gian hiện tại
            return eventEndTime > now;
        }

        if (statusFilter === 'event_over') {
            // Đã diễn ra: thời gian kết thúc sự kiện <= thời gian hiện tại
            return eventEndTime <= now;
        }

        return true;
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
        if (loading) {
            return <LoadingSpinner />;
        }
        if (currentOrders.length === 0) {
            let emptyMessage = 'Không có vé phù hợp';
            let emptyDescription = 'Bạn chưa mua vé nào.';

            if (statusFilter === 'upcoming') {
                emptyMessage = 'Không có vé sắp diễn ra';
                emptyDescription =
                    'Bạn chưa có vé nào cho các sự kiện sắp diễn ra.';
            } else if (statusFilter === 'event_over') {
                emptyMessage = 'Không có vé đã diễn ra';
                emptyDescription =
                    'Bạn chưa có vé nào cho các sự kiện đã kết thúc.';
            } else if (orders.length === 0) {
                emptyMessage = 'Chưa có vé nào';
                emptyDescription =
                    'Bạn chưa mua vé nào. Hãy khám phá các sự kiện thú vị!';
            } else {
                emptyMessage = 'Không tìm thấy vé phù hợp';
                emptyDescription = `Không có vé nào ${
                    statusFilter === 'upcoming' ? 'sắp diễn ra' : 'đã diễn ra'
                } trong bộ lọc hiện tại.`;
            }

            return (
                <div className="text-center mt-5">
                    <img
                        src={noTicket}
                        alt="No tickets"
                        className="mb-3 rounded"
                        style={{ width: '200px', opacity: '0.7' }}
                    />
                    <h4 className="text-white mb-2">{emptyMessage}</h4>
                    <p className="text-white mb-4">{emptyDescription}</p>

                    {orders.length === 0 && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/')}
                            className="px-4 py-2"
                        >
                            <i className="bi bi-search me-2"></i>
                            Khám phá sự kiện
                        </Button>
                    )}

                    {orders.length > 0 && statusFilter !== 'all' && (
                        <Button
                            variant="outline-primary"
                            onClick={() => setStatusFilter('all')}
                            className="px-4 py-2"
                        >
                            <i className="bi bi-collection me-2"></i>
                            Xem tất cả vé
                        </Button>
                    )}
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
                            style={{
                                transition: 'transform 0.2s',
                                position: 'relative',
                            }}
                        >
                            {/* Block sẽ được chụp */}
                            <div
                                ref={(el) => {
                                    orderRefs.current[order._id] = el;
                                }}
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
                                        <div className="d-flex align-items-center gap-2">
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

                                            {/* Event Status Badge */}
                                            {(() => {
                                                const now = new Date();
                                                const eventStartTime = new Date(
                                                    order.startTime,
                                                );
                                                const eventEndTime = new Date(
                                                    order.endTime,
                                                );

                                                if (eventEndTime <= now) {
                                                    return (
                                                        <span className="badge bg-secondary">
                                                            <i className="bi bi-calendar-check me-1"></i>
                                                            Đã kết thúc
                                                        </span>
                                                    );
                                                } else if (
                                                    eventStartTime <= now &&
                                                    eventEndTime > now
                                                ) {
                                                    return (
                                                        <span className="badge bg-warning text-dark">
                                                            <i className="bi bi-play-circle me-1"></i>
                                                            Đang diễn ra
                                                        </span>
                                                    );
                                                } else {
                                                    return (
                                                        <span className="badge bg-success">
                                                            <i className="bi bi-calendar-event me-1"></i>
                                                            Sắp diễn ra
                                                        </span>
                                                    );
                                                }
                                            })()}
                                        </div>

                                        {/* Hiển thị trên mobile/tablet: Đơn hàng #123: */}
                                        <div className="d-block d-md-none">
                                            <h5 className="fw-bold mb-1">
                                                Đơn hàng #{order.orderCode}
                                            </h5>
                                            <div className="d-flex align-items-center gap-2">
                                                <small className="text-muted">
                                                    {order.eventName}
                                                </small>
                                                {(() => {
                                                    const now = new Date();
                                                    const eventStartTime =
                                                        new Date(
                                                            order.startTime,
                                                        );
                                                    const eventEndTime =
                                                        new Date(order.endTime);

                                                    if (eventEndTime <= now) {
                                                        return (
                                                            <span
                                                                className="badge bg-secondary"
                                                                style={{
                                                                    fontSize:
                                                                        '0.7rem',
                                                                }}
                                                            >
                                                                Đã kết thúc
                                                            </span>
                                                        );
                                                    } else if (
                                                        eventStartTime <= now &&
                                                        eventEndTime > now
                                                    ) {
                                                        return (
                                                            <span
                                                                className="badge bg-warning text-dark"
                                                                style={{
                                                                    fontSize:
                                                                        '0.7rem',
                                                                }}
                                                            >
                                                                Đang diễn ra
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span
                                                                className="badge bg-success"
                                                                style={{
                                                                    fontSize:
                                                                        '0.7rem',
                                                                }}
                                                            >
                                                                Sắp diễn ra
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>
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
                                        maxHeight: isExpanded
                                            ? '10000px'
                                            : '0px',
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
                                                                marginLeft:
                                                                    '22px',
                                                            }}
                                                        >
                                                            {
                                                                order.location
                                                                    .address
                                                            }
                                                            ,{' '}
                                                            {
                                                                order.location
                                                                    .ward
                                                            }
                                                            ,{' '}
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
                                                style={{
                                                    position: 'relative',
                                                    marginBottom: 24,
                                                }}
                                            >
                                                {/* Ticket card sẽ được chụp */}
                                                <div
                                                    ref={(el) => {
                                                        ticketCardRefs.current[
                                                            `${order._id}_${idx}`
                                                        ] = el;
                                                    }}
                                                >
                                                    <div
                                                        className={
                                                            styles[
                                                                'ticket-card'
                                                            ]
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles[
                                                                    'ticket-header'
                                                                ]
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'ticket-title'
                                                                    ]
                                                                }
                                                            >
                                                                <h5 className="mb-0">
                                                                    {
                                                                        ticket.name
                                                                    }
                                                                </h5>
                                                                <small className="text-white">
                                                                    Số lượng:{' '}
                                                                    {
                                                                        ticket.quantity
                                                                    }{' '}
                                                                    vé
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles[
                                                                    'ticket-body'
                                                                ]
                                                            }
                                                        >
                                                            {Array.from({
                                                                length: ticket.quantity,
                                                            }).map(
                                                                (
                                                                    _,
                                                                    ticketIndex,
                                                                ) => {
                                                                    const ticketKey = `${
                                                                        idx + 1
                                                                    }_${
                                                                        ticketIndex +
                                                                        1
                                                                    }`;
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                ticketIndex
                                                                            }
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
                                                                                    Mã
                                                                                    vé:{' '}
                                                                                    {
                                                                                        order.orderCode
                                                                                    }
                                                                                    {idx +
                                                                                        1}
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
                                                                            {/* QR + Nút tải vé */}
                                                                            <div
                                                                                style={{
                                                                                    display:
                                                                                        'flex',
                                                                                    alignItems:
                                                                                        'center',
                                                                                    gap: 12,
                                                                                }}
                                                                            >
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
                                                                                        }${
                                                                                            idx +
                                                                                            1
                                                                                        }${
                                                                                            ticketIndex +
                                                                                            1
                                                                                        }`}
                                                                                        size={
                                                                                            90
                                                                                        }
                                                                                        bgColor="#ffffff"
                                                                                        fgColor="#000000"
                                                                                        level="H"
                                                                                    />
                                                                                </div>
                                                                                <div
                                                                                    className={
                                                                                        styles[
                                                                                            'hide-when-download'
                                                                                        ]
                                                                                    }
                                                                                >
                                                                                    <Button
                                                                                        variant="outline-primary"
                                                                                        size="sm"
                                                                                        onClick={() =>
                                                                                            handleDownloadTicketCard(
                                                                                                order._id,
                                                                                                idx,
                                                                                            )
                                                                                        }
                                                                                        className="text-dark"
                                                                                    >
                                                                                        <i className="bi bi-download me-1"></i>{' '}
                                                                                        Tải
                                                                                        vé
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'ticket-total'
                                                                    ]
                                                                }
                                                            >
                                                                <span>
                                                                    Tổng tiền:
                                                                </span>
                                                                <span>
                                                                    {subTotal.toLocaleString(
                                                                        'vi-VN',
                                                                    )}{' '}
                                                                    đ
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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

                        {hasPermission(permissions.VIEW_ORGANIZERS) && (
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

                    {/* Filter Section */}
                    <div className="mb-4">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            <Button
                                variant={
                                    statusFilter === 'all'
                                        ? 'primary'
                                        : 'primary'
                                }
                                className={`shadow-sm ${styles.filterButton} ${
                                    statusFilter === 'all'
                                        ? styles.filterButtonActive
                                        : ''
                                }`}
                                onClick={() => {
                                    setStatusFilter('all');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="bi bi-collection me-1"></i>
                                Tất cả
                                <span className="badge bg-light text-dark ms-2">
                                    {orders.length}
                                </span>
                            </Button>
                            <Button
                                variant={
                                    statusFilter === 'upcoming'
                                        ? 'success'
                                        : 'success'
                                }
                                className={`shadow-sm ${styles.filterButton} ${
                                    statusFilter === 'upcoming'
                                        ? styles.filterButtonActive
                                        : ''
                                }`}
                                onClick={() => {
                                    setStatusFilter('upcoming');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="bi bi-calendar-event me-1"></i>
                                Chưa diễn ra
                                <span className="badge bg-light text-dark ms-2">
                                    {
                                        orders.filter(
                                            (order) =>
                                                new Date(order.endTime) >
                                                new Date(),
                                        ).length
                                    }
                                </span>
                            </Button>
                            <Button
                                variant={
                                    statusFilter === 'event_over'
                                        ? 'secondary'
                                        : 'secondary'
                                }
                                className={`shadow-sm ${styles.filterButton} ${
                                    statusFilter === 'event_over'
                                        ? styles.filterButtonActive
                                        : ''
                                }`}
                                onClick={() => {
                                    setStatusFilter('event_over');
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="bi bi-calendar-check me-1"></i>
                                Đã diễn ra
                                <span className="badge bg-light text-dark ms-2">
                                    {
                                        orders.filter(
                                            (order) =>
                                                new Date(order.endTime) <=
                                                new Date(),
                                        ).length
                                    }
                                </span>
                            </Button>
                        </div>

                        {/* Filter Summary */}
                        {statusFilter !== 'all' && (
                            <div
                                className={`alert alert-info py-2 px-3 ${styles.filterSummary}`}
                            >
                                <i className="bi bi-info-circle me-2"></i>
                                Hiển thị {filteredOrders.length} vé{' '}
                                {statusFilter === 'upcoming'
                                    ? 'chưa diễn ra '
                                    : 'đã diễn ra '}
                                trong tổng số {orders.length} vé
                            </div>
                        )}
                    </div>

                    {renderOrders()}
                </Col>
            </Row>

            {/* Review Form Modal */}
            <ReviewForm
                show={showReviewForm}
                onHide={() => {
                    setShowReviewForm(false);
                    setSelectedEvent(null);
                    setSelectedReview(null);
                }}
                eventId={selectedEvent?.eventId}
                review={selectedReview}
                onSuccess={handleReviewSuccess}
            />
        </Container>
    );
}

export default PurchasedTickets;
