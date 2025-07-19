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
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('tickets');
    const [expandedOrders, setExpandedOrders] = useState({});

    // State cho review
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [eventReviews, setEventReviews] = useState({});

    const itemsPerPage = 5;

    // Refs cho việc tải xuống
    const ticketRefs = useRef({});
    const orderRefs = useRef({});
    const ticketCardRefs = useRef({});

    // Hàm tải vé thành ảnh với cải tiến
    const handleDownloadTicketCard = async (orderId, ticketIdx) => {
        const ref = ticketCardRefs.current[`${orderId}_${ticketIdx}`];
        if (!ref) {
            console.error('Không tìm thấy element để chụp ảnh');
            return;
        }

        try {
            // Hiển thị loading indicator
            const downloadBtn = ref.querySelector('.download-btn');
            const originalText = downloadBtn?.innerHTML;
            if (downloadBtn) {
                downloadBtn.innerHTML =
                    '<i class="bi bi-arrow-clockwise me-1 spin"></i>Đang tải...';
                downloadBtn.disabled = true;
            }

            // Thêm class capturing để ẩn các element không cần thiết
            ref.classList.add('capturing');

            // Đợi DOM cập nhật
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Cấu hình canvas với chất lượng cao
            const canvas = await html2canvas(ref, {
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                scale: 3, // Tăng độ phân giải
                logging: false,
                letterRendering: true,
                removeContainer: false,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    // Đảm bảo ẩn tất cả nút download trong bản clone
                    const elementsToHide = clonedDoc.querySelectorAll(
                        '.hide-when-download',
                    );
                    elementsToHide.forEach((element) => {
                        element.style.display = 'none';
                        element.style.visibility = 'hidden';
                        element.style.opacity = '0';
                    });

                    // Cải thiện font rendering
                    const allText = clonedDoc.querySelectorAll('*');
                    allText.forEach((element) => {
                        element.style.fontSmooth = 'always';
                        element.style.webkitFontSmoothing = 'antialiased';
                        element.style.mozOsxFontSmoothing = 'grayscale';
                    });
                },
            });

            // Tạo tên file có timestamp
            const timestamp = new Date()
                .toISOString()
                .slice(0, 19)
                .replace(/:/g, '-');
            const filename = `ve_${orderId.slice(-6)}_${
                ticketIdx + 1
            }_${timestamp}.png`;

            // Tải xuống với chất lượng cao
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png', 1.0);

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Hiển thị thông báo thành công
            console.log(`✅ Đã tải vé thành công: ${filename}`);

            // Có thể thêm toast notification ở đây
            // toast.success('Đã tải vé thành công!');
        } catch (error) {
            console.error('❌ Lỗi khi tải vé:', error);
            // toast.error('Có lỗi xảy ra khi tải vé. Vui lòng thử lại!');
        } finally {
            // Khôi phục lại trạng thái ban đầu
            ref.classList.remove('capturing');

            const downloadBtn = ref.querySelector('.download-btn');
            if (downloadBtn) {
                downloadBtn.innerHTML =
                    '<i class="bi bi-download me-1"></i>Tải về';
                downloadBtn.disabled = false;
            }
        }
    };

    const handleNavigation = (tab, path) => {
        setActiveTab(tab);
        navigate(path);
    };

    const handleToggleOrder = (orderId) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

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

    const handleOpenReviewForm = async (eventId) => {
        const existingReview = await checkEventReview(eventId);
        setSelectedEvent({ eventId });
        setSelectedReview(existingReview);
        setShowReviewForm(true);
    };

    const handleReviewSuccess = () => {
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
        fetchOrders();
    };

    const canReviewEvent = (order) => {
        return new Date(order.endTime) < new Date() && order.status === 'PAID';
    };

    const generateReviewId = (eventId, userId) => {
        return `${eventId}_${userId}`;
    };

    // Lọc theo status
    const filteredOrders = orders.filter((order) => {
        if (statusFilter === 'all') return true;

        const now = new Date();
        const eventEndTime = new Date(order.endTime);

        if (statusFilter === 'upcoming') {
            return eventEndTime > now;
        }

        if (statusFilter === 'event_over') {
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

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getEventStatus = (order) => {
        const now = new Date();
        const eventStartTime = new Date(order.startTime);
        const eventEndTime = new Date(order.endTime);

        if (eventEndTime <= now) {
            return {
                className: 'status-completed',
                icon: 'bi-calendar-check',
                text: 'Đã kết thúc',
            };
        } else if (eventStartTime <= now && eventEndTime > now) {
            return {
                className: 'status-ongoing',
                icon: 'bi-play-circle',
                text: 'Đang diễn ra',
            };
        } else {
            return {
                className: 'status-upcoming',
                icon: 'bi-calendar-event',
                text: 'Sắp diễn ra',
            };
        }
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
                <div className={styles['empty-state']}>
                    <img src={noTicket} alt="No tickets" />
                    <h4>{emptyMessage}</h4>
                    <p>{emptyDescription}</p>

                    {orders.length === 0 && (
                        <Button
                            onClick={() => navigate('/')}
                            className={styles['empty-state-btn']}
                        >
                            <i className="bi bi-search me-2"></i>
                            Khám phá sự kiện
                        </Button>
                    )}

                    {orders.length > 0 && statusFilter !== 'all' && (
                        <Button
                            variant="outline-primary"
                            onClick={() => setStatusFilter('all')}
                            className={styles['empty-state-btn']}
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
                    const eventStatus = getEventStatus(order);

                    return (
                        <div key={order._id} className={styles['order-card']}>
                            {/* Order Header */}
                            <div
                                className={styles['order-header']}
                                onClick={() => handleToggleOrder(order._id)}
                            >
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="flex-grow-1">
                                        <h3 className={styles['order-title']}>
                                            Đơn hàng #{order.orderCode}
                                        </h3>
                                        <p className={styles['order-subtitle']}>
                                            {order.eventName}
                                        </p>
                                        <div
                                            className={`${
                                                styles['status-badge']
                                            } ${styles[eventStatus.className]}`}
                                        >
                                            <i
                                                className={`bi ${eventStatus.icon}`}
                                            ></i>
                                            {eventStatus.text}
                                        </div>
                                    </div>
                                    <i
                                        className={`bi ${
                                            isExpanded
                                                ? 'bi-chevron-up'
                                                : 'bi-chevron-down'
                                        } ${styles['expand-icon']}`}
                                    ></i>
                                </div>
                            </div>

                            {/* Order Content */}
                            <div
                                className={styles['transition-panel']}
                                style={{
                                    maxHeight: isExpanded ? '10000px' : '0px',
                                }}
                            >
                                <div className="p-4">
                                    {/* Event Info */}
                                    <div className={styles['event-info']}>
                                        <div className="row align-items-center">
                                            <div className="col-md-3 mb-3 mb-md-0">
                                                <img
                                                    src={order.background}
                                                    alt={order.eventName}
                                                    className={
                                                        styles['event-image']
                                                    }
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
                                                    <div
                                                        className={
                                                            styles[
                                                                'event-location'
                                                            ]
                                                        }
                                                    >
                                                        <i
                                                            className={`bi bi-geo-alt-fill ${styles['event-icon']}`}
                                                        ></i>
                                                        <div>
                                                            <div className="fw-semibold text-dark">
                                                                {
                                                                    order
                                                                        .location
                                                                        .venueName
                                                                }
                                                            </div>
                                                            <div className="text-muted small">
                                                                {
                                                                    order
                                                                        .location
                                                                        .address
                                                                }
                                                                ,{' '}
                                                                {
                                                                    order
                                                                        .location
                                                                        .ward
                                                                }
                                                                ,{' '}
                                                                {
                                                                    order
                                                                        .location
                                                                        .district
                                                                }
                                                                ,{' '}
                                                                {
                                                                    order
                                                                        .location
                                                                        .province
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles['event-time']
                                                        }
                                                    >
                                                        <i
                                                            className={`bi bi-clock ${styles['event-icon']}`}
                                                        ></i>
                                                        <div>
                                                            <div className="fw-semibold text-dark">
                                                                <TimeText
                                                                    event={
                                                                        order
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tickets */}
                                    {order.tickets?.map((ticket, idx) => {
                                        const subTotal =
                                            ticket.price * ticket.quantity;
                                        return (
                                            <div
                                                key={ticket._id || idx}
                                                className={
                                                    styles['ticket-section']
                                                }
                                                ref={(el) => {
                                                    ticketCardRefs.current[
                                                        `${order._id}_${idx}`
                                                    ] = el;
                                                }}
                                            >
                                                {/* Ticket Type Header */}
                                                <div
                                                    className={
                                                        styles[
                                                            'ticket-type-header'
                                                        ]
                                                    }
                                                >
                                                    <h5
                                                        className={
                                                            styles[
                                                                'ticket-type-title'
                                                            ]
                                                        }
                                                    >
                                                        {ticket.name}
                                                    </h5>
                                                    <span
                                                        className={
                                                            styles[
                                                                'ticket-type-quantity'
                                                            ]
                                                        }
                                                    >
                                                        {ticket.quantity} vé
                                                    </span>
                                                </div>

                                                {/* Individual Tickets Grid */}
                                                <div
                                                    className={
                                                        styles[
                                                            'ticket-items-grid'
                                                        ]
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
                                                                        'ticket-item-header'
                                                                    ]
                                                                }
                                                            >
                                                                <div>
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
                                                                        {idx +
                                                                            1}
                                                                        {ticketIndex +
                                                                            1}
                                                                    </div>
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
                                                                        'ticket-item-footer'
                                                                    ]
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles[
                                                                            'qr-container'
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
                                                                            80
                                                                        }
                                                                        bgColor="#ffffff"
                                                                        fgColor="#000000"
                                                                        level="H"
                                                                    />
                                                                </div>

                                                                <div className="hide-when-download">
                                                                    <button
                                                                        className={`${styles['download-btn']} download-btn`}
                                                                        onClick={() =>
                                                                            handleDownloadTicketCard(
                                                                                order._id,
                                                                                idx,
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="bi bi-download me-1"></i>
                                                                        Tải về
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Ticket Total */}
                                                <div
                                                    className={
                                                        styles['ticket-total']
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles[
                                                                'ticket-total-label'
                                                            ]
                                                        }
                                                    >
                                                        Tổng tiền loại vé:
                                                    </span>
                                                    <span
                                                        className={
                                                            styles[
                                                                'ticket-total-amount'
                                                            ]
                                                        }
                                                    >
                                                        {subTotal.toLocaleString(
                                                            'vi-VN',
                                                        )}{' '}
                                                        đ
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Review Button for completed events */}
                                    {canReviewEvent(order) && (
                                        <div className="mt-3 text-center">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() =>
                                                    handleOpenReviewForm(
                                                        order.eventId,
                                                    )
                                                }
                                                className="rounded-pill"
                                            >
                                                <i className="bi bi-star me-1"></i>
                                                {eventReviews[
                                                    generateReviewId(
                                                        order.eventId,
                                                        user?.id,
                                                    )
                                                ]
                                                    ? 'Chỉnh sửa đánh giá'
                                                    : 'Đánh giá sự kiện'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
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
            className="text-dark min-vh-100 p-4 bg-light"
            style={{ margin: '80px 0' }}
        >
            <Row className="pt-4">
                <Col md={12} className="px-4">
                    {/* Breadcrumb */}
                    <div className="mb-4">
                        <Link
                            to="/"
                            className="text-decoration-none text-muted"
                        >
                            Trang chủ
                        </Link>
                        <BsChevronRight className="mx-2 text-muted" />
                        <span className="text-dark fw-semibold">Vé đã mua</span>
                    </div>

                    {/* Main Container */}
                    <div className={styles['main-container']}>
                        {/* Header */}
                        <div className="p-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="mb-2 fw-bold text-primary d-flex align-items-center">
                                        <i className="bi bi-ticket-perforated me-3"></i>
                                        Vé đã mua
                                    </h1>
                                    <p className="text-muted mb-0">
                                        Quản lý và tải xuống vé của bạn
                                    </p>
                                </div>
                                <div className="d-none d-md-block">
                                    <div className="text-end">
                                        <div className="fw-semibold text-primary">
                                            {orders.length} đơn hàng
                                        </div>
                                        <small className="text-muted">
                                            {
                                                orders.filter(
                                                    (order) =>
                                                        new Date(
                                                            order.endTime,
                                                        ) > new Date(),
                                                ).length
                                            }{' '}
                                            sự kiện sắp tới
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="p-4 border-bottom bg-light">
                            <div className="d-flex justify-content-center mb-3">
                                <div className={styles['filter-container']}>
                                    <button
                                        className={`${styles.filterButton} ${
                                            statusFilter === 'all'
                                                ? styles.filterButtonActive
                                                : ''
                                        }`}
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <i className="bi bi-collection me-2"></i>
                                        Tất cả
                                        <span
                                            className={styles['filter-badge']}
                                        >
                                            {orders.length}
                                        </span>
                                    </button>

                                    <button
                                        className={`${styles.filterButton} ${
                                            statusFilter === 'upcoming'
                                                ? styles.filterButtonActive
                                                : ''
                                        }`}
                                        onClick={() => {
                                            setStatusFilter('upcoming');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <i className="bi bi-calendar-event me-2"></i>
                                        Sắp diễn ra
                                        <span
                                            className={styles['filter-badge']}
                                        >
                                            {
                                                orders.filter(
                                                    (order) =>
                                                        new Date(
                                                            order.endTime,
                                                        ) > new Date(),
                                                ).length
                                            }
                                        </span>
                                    </button>

                                    <button
                                        className={`${styles.filterButton} ${
                                            statusFilter === 'event_over'
                                                ? styles.filterButtonActive
                                                : ''
                                        }`}
                                        onClick={() => {
                                            setStatusFilter('event_over');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <i className="bi bi-calendar-check me-2"></i>
                                        Đã diễn ra
                                        <span
                                            className={styles['filter-badge']}
                                        >
                                            {
                                                orders.filter(
                                                    (order) =>
                                                        new Date(
                                                            order.endTime,
                                                        ) <= new Date(),
                                                ).length
                                            }
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Filter Summary */}
                            {statusFilter !== 'all' && (
                                <div
                                    className={`alert py-2 px-3 mb-0 ${styles.filterSummary}`}
                                >
                                    <i className="bi bi-info-circle me-2"></i>
                                    Hiển thị {filteredOrders.length} vé{' '}
                                    {statusFilter === 'upcoming'
                                        ? 'sắp diễn ra'
                                        : 'đã diễn ra'}{' '}
                                    trong tổng số {orders.length} vé
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">{renderOrders()}</div>
                    </div>
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

            {/* Add CSS for spin animation */}
            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </Container>
    );
}

export default PurchasedTickets;
