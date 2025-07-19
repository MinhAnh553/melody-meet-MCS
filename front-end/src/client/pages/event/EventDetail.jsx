import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../../util/api';
import TimeText from '../../components/providers/TimeText';
import DOMPurify from 'dompurify';
import ReviewForm from '../../components/ReviewForm';
import swalCustomize from '../../../util/swalCustomize';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import { BsChevronDown, BsChevronUp } from 'react-icons/bs';

const EventDetail = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // State cho review
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [userReview, setUserReview] = useState(null);
    const [canReview, setCanReview] = useState(false);
    const [reviewStats, setReviewStats] = useState({
        averageRating: 0,
        totalReviews: 0,
    });

    const navigate = useNavigate();
    const [descExpanded, setDescExpanded] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);
                const res = await api.getEventById(eventId);
                if (res.success) {
                    setEvent(res.data);
                } else {
                    navigate('/');
                    return swalCustomize.Toast.fire({
                        icon: 'error',
                        title: res.message,
                    });
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu sự kiện:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    // Fetch thông tin đánh giá của sự kiện
    useEffect(() => {
        const fetchReviewStats = async () => {
            if (!event) return;

            try {
                const res = await api.getEventReviewStats(eventId);
                if (res.success) {
                    setReviewStats({
                        averageRating: res.stats.averageRating || 0,
                        totalReviews: res.stats.totalReviews || 0,
                    });
                }
            } catch (error) {
                console.error('Error fetching review stats:', error);
            }
        };

        fetchReviewStats();
    }, [event, eventId]);

    // Kiểm tra xem user có thể đánh giá sự kiện này không
    useEffect(() => {
        const checkReviewStatus = async () => {
            if (!user || !event) return;

            try {
                // Kiểm tra xem user đã mua vé và sự kiện đã kết thúc chưa
                const ordersRes = await api.getMyOrders();
                if (ordersRes.success) {
                    const hasPurchasedTicket = ordersRes.orders.some(
                        (order) =>
                            order.eventId === eventId &&
                            order.status === 'PAID',
                    );

                    const eventEnded = new Date(event.endTime) < new Date();
                    const canReviewEvent = hasPurchasedTicket && eventEnded;
                    setCanReview(canReviewEvent);

                    // Nếu có thể đánh giá, kiểm tra xem đã đánh giá chưa
                    if (canReviewEvent) {
                        const reviewRes = await api.checkEventReview(eventId);
                        if (reviewRes.success && reviewRes.review) {
                            setUserReview(reviewRes.review);
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking review status:', error);
            }
        };

        checkReviewStatus();
    }, [user, event, eventId]);

    if (!event)
        return (
            <div
                className="container-fluid py-4"
                style={{
                    // backgroundColor: '#121212',
                    margin: '80px 0 0',
                    borderRadius: '20px',
                }}
            >
                <LoadingSpinner />
            </div>
        );

    // Sắp xếp vé từ thấp đến cao
    const sortedTickets = [...event.ticketTypes].sort(
        (a, b) => a.price - b.price,
    );

    const formatCurrency = (price) => {
        return price.toLocaleString('vi-VN') + 'đ';
    };

    const lowestPrice = `Giá từ ${formatCurrency(sortedTickets[0].price)}`;

    const sanitizedDescription = DOMPurify.sanitize(event.description);

    // Hàm chuyển đến trang chọn vé
    const handleBuyNow = () => {
        navigate(`/event/${eventId}/bookings/select-ticket`);
    };

    // Mở form đánh giá
    const handleOpenReviewForm = () => {
        setSelectedReview(userReview);
        setShowReviewForm(true);
    };

    // Xử lý sau khi đánh giá thành công
    const handleReviewSuccess = () => {
        // Refresh lại thông tin review
        const checkReviewStatus = async () => {
            try {
                const reviewRes = await api.checkEventReview(eventId);
                if (reviewRes.success && reviewRes.review) {
                    setUserReview(reviewRes.review);
                }

                // Refresh lại thống kê đánh giá
                const statsRes = await api.getEventReviewStats(eventId);
                if (statsRes.success) {
                    setReviewStats({
                        averageRating: statsRes.stats.averageRating || 0,
                        totalReviews: statsRes.stats.totalReviews || 0,
                    });
                }
            } catch (error) {
                console.error('Error refreshing review:', error);
            }
        };
        checkReviewStatus();
    };

    // Render sao
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        // Thêm sao đầy
        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <i key={i} className="bi bi-star-fill text-warning"></i>,
            );
        }

        // Thêm sao nửa (nếu có)
        if (hasHalfStar) {
            stars.push(
                <i key="half" className="bi bi-star-half text-warning"></i>,
            );
        }

        // Thêm sao rỗng
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <i key={`empty-${i}`} className="bi bi-star text-warning"></i>,
            );
        }

        return stars;
    };

    return (
        <>
            {/* Phần banner (đã có sẵn) */}
            <div
                className="container-fluid py-4"
                style={{
                    background:
                        'linear-gradient(rgb(39, 39, 42) 48.04%, rgb(0, 0, 0) 100%)',
                    margin: '80px 0 0',
                    borderRadius: '20px',
                }}
            >
                <div className="container">
                    <div className="row g-4 align-items-center">
                        {/* Cột trái */}
                        <div className="col-md-5 text-white">
                            <h1
                                className="fw-bold mb-3"
                                style={{ fontSize: '1.5rem' }}
                            >
                                {event.name}
                            </h1>

                            <p className="mb-2" style={{ fontSize: '1rem' }}>
                                <i className="bi bi-clock"></i>
                                {'  '}
                                <span style={{ color: 'rgb(45, 194, 117)' }}>
                                    <TimeText event={event} />
                                </span>
                            </p>

                            <p className="mb-5" style={{ fontSize: '1rem' }}>
                                <i className="bi bi-geo-alt-fill"></i>
                                {'   '}
                                <span style={{ color: 'rgb(45, 194, 117)' }}>
                                    {event.location.venueName}
                                </span>
                                <br />
                                <span style={{ marginLeft: '22px' }}>
                                    {event.location.address},{' '}
                                    {event.location.ward},{' '}
                                    {event.location.district},{' '}
                                    {event.location.province}
                                </span>
                            </p>
                            <hr
                                style={{ background: 'white', height: '1.5px' }}
                            />
                            <p
                                className="fw-bold"
                                style={{
                                    color: 'rgb(45, 194, 117)',
                                    fontSize: '1.3rem',
                                }}
                            >
                                {lowestPrice}
                            </p>

                            {/* Nếu tất cả hết vé thì hiển thị hết vé */}
                            {sortedTickets.every(
                                (ticket) =>
                                    ticket.totalQuantity -
                                        ticket.quantitySold <=
                                    0,
                            ) && (
                                <div
                                    style={{
                                        display: 'inline-block',
                                        cursor: 'not-allowed',
                                    }}
                                >
                                    <button
                                        className="btn btn-success btn-lg mt-2"
                                        disabled={true}
                                        style={{
                                            backgroundColor: '#ccc',
                                        }}
                                    >
                                        Đã hết vé
                                    </button>
                                </div>
                            )}

                            <div className="d-flex align-items-center gap-3">
                                {/* Nếu còn vé thì hiển thị nút mua vé */}
                                {sortedTickets.some(
                                    (ticket) =>
                                        ticket.totalQuantity -
                                            ticket.quantitySold >
                                        0,
                                ) && (
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            cursor:
                                                event.status === 'event_over' ||
                                                !user
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    >
                                        <button
                                            className="btn btn-success btn-lg mt-2"
                                            onClick={handleBuyNow}
                                            disabled={
                                                event.status === 'event_over' ||
                                                !user
                                            }
                                            style={{
                                                backgroundColor:
                                                    event.status ===
                                                        'event_over' || !user
                                                        ? '#ccc'
                                                        : '',
                                            }}
                                        >
                                            {event.status === 'event_over'
                                                ? 'Sự kiện đã kết thúc'
                                                : !user
                                                ? 'Đăng nhập để mua vé'
                                                : 'Mua vé ngay'}
                                        </button>
                                    </div>
                                )}
                                {/* Nút đánh giá sự kiện */}
                                {canReview && (
                                    <div className="mt-2">
                                        <button
                                            onClick={handleOpenReviewForm}
                                            className={`btn ${
                                                userReview
                                                    ? 'btn-success'
                                                    : 'btn-outline-success'
                                            } btn-lg d-flex align-items-center gap-1 mx-auto`}
                                        >
                                            <i className="bi bi-star-fill"></i>
                                            {userReview
                                                ? 'Đã đánh giá'
                                                : 'Đánh giá sự kiện'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cột phải */}
                        <div className="col-md-7 text-center">
                            <img
                                src={event.background}
                                alt="Concert Banner"
                                className="img-fluid rounded shadow"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hiển thị đánh giá trung bình */}
            {reviewStats.totalReviews > 0 && (
                <div className="container mt-3">
                    <div className="d-flex justify-content-center align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            {renderStars(reviewStats.averageRating)}
                            <span className="text-white fw-bold fs-5">
                                {reviewStats.averageRating.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-white">
                            ({reviewStats.totalReviews} đánh giá)
                        </span>
                    </div>
                </div>
            )}

            {/* Phần giới thiệu (nằm dưới banner) */}
            <div className="container my-5">
                <h4 className="mb-3">Giới thiệu</h4>
                <div
                    className="card p-4 border-0 shadow rounded-4"
                    style={{ backgroundColor: '#fff' }}
                >
                    {/* Nếu có ảnh mô tả giới thiệu riêng, hiển thị: */}
                    {event.descriptionImage && (
                        <img
                            src={event.descriptionImage}
                            alt="Giới thiệu"
                            className="img-fluid rounded mb-3"
                        />
                    )}

                    {/* Nội dung mô tả sự kiện */}
                    <p
                        className="event-description"
                        dangerouslySetInnerHTML={{
                            __html: sanitizedDescription,
                        }}
                        style={{
                            // color: '#fff',
                            whiteSpace: 'pre-line',
                            maxHeight: descExpanded ? 'none' : '6em', // 3 dòng x 1.5em
                            overflow: descExpanded ? 'visible' : 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: descExpanded ? 'unset' : 3,
                            WebkitBoxOrient: 'vertical',
                            transition: 'max-height 0.3s',
                        }}
                    ></p>
                    {event.description && event.description.length > 120 && (
                        <div className="d-flex justify-content-center mt-2">
                            <button
                                className="btn btn-link p-0"
                                style={{
                                    color: 'black',
                                    fontSize: '1.05rem',
                                    textDecoration: 'none', // Bỏ gạch chân
                                }}
                                onClick={() => setDescExpanded((prev) => !prev)}
                            >
                                {descExpanded ? (
                                    <>
                                        <BsChevronUp />
                                    </>
                                ) : (
                                    <>
                                        <BsChevronDown />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Thông tin ban tổ chức */}
            <div className="container my-5">
                <h4 className="mb-4">Ban Tổ Chức</h4>
                <div
                    className="card p-4 border-0 shadow rounded-4"
                    style={{ backgroundColor: '#fff' }}
                >
                    <div className="d-flex align-items-center">
                        <img
                            src={event.organizer?.logo}
                            alt="Organizer Logo"
                            style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                border: '2px solid #fff',
                            }}
                            className="rounded-circle me-4"
                        />
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="fw-semibold mb-0">
                                    {event.organizer?.name}
                                </h5>
                                <Link
                                    to={`/organizer/${event.createdBy}/reviews`}
                                    className="text-decoration-none d-flex align-items-center small"
                                    style={{
                                        color: '#a6a6b0',
                                        transition: 'color 0.3s',
                                    }}
                                    // onMouseEnter={(e) =>
                                    //     (e.currentTarget.style.color =
                                    //         '#ffffff')
                                    // }
                                    // onMouseLeave={(e) =>
                                    //     (e.currentTarget.style.color =
                                    //         '#a6a6b0')
                                    // }
                                >
                                    Thông tin chi tiết
                                    <i className="bi bi-chevron-right ms-1"></i>
                                </Link>
                            </div>

                            <div
                                className="small"
                                style={{ lineHeight: '1.6' }}
                            >
                                <p className="mb-2">
                                    {event.organizer?.description}
                                </p>

                                {event.organizer?.email && (
                                    <p className="mb-1">
                                        <a
                                            href={`mailto:${event.organizer.email}`}
                                            className="text-decoration-none"
                                        >
                                            <i className="bi bi-envelope me-2"></i>
                                            {event.organizer.email}
                                        </a>
                                    </p>
                                )}

                                {event.organizer?.phone && (
                                    <p className="mb-0">
                                        <a
                                            href={`tel:${event.organizer.phone}`}
                                            className="text-decoration-none"
                                        >
                                            <i className="bi bi-telephone me-2"></i>
                                            {event.organizer.phone}
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Phần đánh giá */}
            {canReview && (
                <div className="container my-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="text-white mb-0">Đánh giá</h2>
                        {reviewStats.totalReviews > 0 && (
                            <div className="d-flex align-items-center gap-2">
                                {renderStars(reviewStats.averageRating)}
                                <span className="text-white fw-bold">
                                    {reviewStats.averageRating.toFixed(1)}
                                </span>
                                <span className="text-muted">
                                    ({reviewStats.totalReviews} đánh giá)
                                </span>
                            </div>
                        )}
                    </div>

                    {reviewStats.totalReviews === 0 ? (
                        <div
                            className="card p-4 border-0 shadow rounded-4"
                            style={{ backgroundColor: '#1e1e1e' }}
                        >
                            <p className="text-white mb-0">
                                Chưa có đánh giá nào cho sự kiện này
                            </p>
                        </div>
                    ) : (
                        <div
                            className="card p-4 border-0 shadow rounded-4"
                            style={{ backgroundColor: '#1e1e1e' }}
                        >
                            <div className="text-center">
                                <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        {renderStars(reviewStats.averageRating)}
                                        <span className="text-white fw-bold fs-4">
                                            {reviewStats.averageRating.toFixed(
                                                1,
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-white">/ 5 sao</span>
                                </div>
                                <p className="text-white mb-0">
                                    Dựa trên {reviewStats.totalReviews} đánh giá
                                    từ người tham gia
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Review Form Modal */}
            <ReviewForm
                show={showReviewForm}
                onHide={() => {
                    setShowReviewForm(false);
                    setSelectedReview(null);
                }}
                eventId={eventId}
                review={selectedReview}
                onSuccess={handleReviewSuccess}
            />

            <div className="fixed-ticket-bar d-block d-md-none">
                <div className="container d-flex justify-content-between align-items-center h-100">
                    <span className="text-white fw-bold">
                        <span style={{ fontWeight: 'bold' }}>
                            {lowestPrice}
                        </span>
                    </span>
                    <button
                        className="btn btn-success fw-bold"
                        onClick={handleBuyNow}
                        disabled={event.status === 'event_over' || !user}
                        style={{
                            backgroundColor:
                                event.status === 'event_over' || !user
                                    ? '#ccc'
                                    : '',
                        }}
                    >
                        {event.status === 'event_over'
                            ? 'Sự kiện đã kết thúc'
                            : !user
                            ? 'Đăng nhập để mua vé'
                            : 'Mua vé ngay'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default EventDetail;
