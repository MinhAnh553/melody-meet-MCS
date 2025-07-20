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
import styles from './EventDetail.module.css';

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
    const [reviews, setReviews] = useState([]);

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

    // Fetch danh sách đánh giá
    useEffect(() => {
        const fetchReviews = async () => {
            if (!event) return;

            try {
                const res = await api.getEventReviews(eventId);
                if (res.success) {
                    setReviews(res.reviews || []);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        };

        fetchReviews();
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
            <div className={styles.loadingContainer}>
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

    const lowestPrice = formatCurrency(sortedTickets[0].price);
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

                // Refresh lại danh sách đánh giá
                const reviewsRes = await api.getEventReviews(eventId);
                if (reviewsRes.success) {
                    setReviews(reviewsRes.reviews || []);
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
                <i
                    key={i}
                    className="bi bi-star-fill"
                    style={{ color: '#FFD700' }}
                ></i>,
            );
        }

        // Thêm sao nửa (nếu có)
        if (hasHalfStar) {
            stars.push(
                <i
                    key="half"
                    className="bi bi-star-half"
                    style={{ color: '#FFD700' }}
                ></i>,
            );
        }

        // Thêm sao rỗng
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <i
                    key={`empty-${i}`}
                    className="bi bi-star"
                    style={{ color: '#FFD700' }}
                ></i>,
            );
        }

        return stars;
    };

    // Format thời gian đánh giá
    const formatReviewDate = (date) => {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const isEventOver = event.status === 'event_over';
    const hasAvailableTickets = sortedTickets.some(
        (ticket) => ticket.totalQuantity - ticket.quantitySold > 0,
    );

    return (
        <div className={styles.eventDetailContainer}>
            {/* Hero Section */}
            <div className="container">
                <div className={styles.heroSection}>
                    <div className="row g-5 align-items-center">
                        {/* Event Info - Giữ nguyên thiết kế gốc */}
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

                            <div className="d-flex align-items-center gap-4 mb-4">
                                <p
                                    className="fw-bold mb-0"
                                    style={{
                                        color: 'rgb(45, 194, 117)',
                                        fontSize: '1.3rem',
                                    }}
                                >
                                    Giá từ {lowestPrice}
                                </p>

                                {reviewStats.totalReviews > 0 && (
                                    <div className={styles.ratingBadge}>
                                        <div className={styles.ratingStars}>
                                            {renderStars(
                                                reviewStats.averageRating,
                                            )}
                                        </div>
                                        <span className={styles.ratingText}>
                                            {reviewStats.averageRating.toFixed(
                                                1,
                                            )}
                                        </span>
                                        <span className={styles.ratingCount}>
                                            ({reviewStats.totalReviews})
                                        </span>
                                    </div>
                                )}
                            </div>

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
                                        style={{ backgroundColor: '#ccc' }}
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

                        {/* Event Image */}
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

            <div className="container py-5">
                <div className="row g-5">
                    {/* Main Content */}
                    <div className="col-lg-8">
                        {/* Event Description */}
                        <div className={styles.contentCard}>
                            <h3 className={styles.sectionTitle}>
                                <i className="bi bi-info-circle-fill"></i>
                                Giới thiệu sự kiện
                            </h3>

                            <div
                                className={`${styles.eventDescription} ${
                                    descExpanded ? styles.expanded : ''
                                }`}
                                dangerouslySetInnerHTML={{
                                    __html: sanitizedDescription,
                                }}
                            />

                            {event.description &&
                                event.description.length > 120 && (
                                    <div
                                        className={styles.expandButtonContainer}
                                    >
                                        <button
                                            className={styles.expandButton}
                                            onClick={() =>
                                                setDescExpanded(!descExpanded)
                                            }
                                        >
                                            {descExpanded ? (
                                                <>
                                                    <BsChevronUp />
                                                    Thu gọn
                                                </>
                                            ) : (
                                                <>
                                                    <BsChevronDown />
                                                    Xem thêm
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                        </div>

                        {/* Reviews Section */}
                        <div className={styles.contentCard}>
                            <div className={styles.reviewHeader}>
                                <h3 className={styles.sectionTitle}>
                                    <i className="bi bi-star-fill"></i>
                                    Đánh giá sự kiện
                                </h3>
                                {reviewStats.totalReviews > 0 && (
                                    <div className={styles.reviewSummary}>
                                        <div className={styles.ratingStars}>
                                            {renderStars(
                                                reviewStats.averageRating,
                                            )}
                                        </div>
                                        <span className={styles.ratingNumber}>
                                            {reviewStats.averageRating.toFixed(
                                                1,
                                            )}
                                        </span>
                                        <span className={styles.reviewCount}>
                                            ({reviewStats.totalReviews} đánh
                                            giá)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {reviewStats.totalReviews === 0 ? (
                                <div className={styles.noReviews}>
                                    <i className="bi bi-star"></i>
                                    <p>Chưa có đánh giá nào cho sự kiện này</p>
                                </div>
                            ) : (
                                <div className={styles.reviewsList}>
                                    {reviews.map((review) => (
                                        <div
                                            key={review._id}
                                            className={styles.reviewItem}
                                        >
                                            <div
                                                className={
                                                    styles.reviewItemHeader
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.reviewerInfo
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.reviewerAvatar
                                                        }
                                                    >
                                                        <i className="bi bi-person-fill"></i>
                                                    </div>
                                                    <div>
                                                        <div
                                                            className={
                                                                styles.reviewerName
                                                            }
                                                        >
                                                            {review.userInfo[0]
                                                                ?.name ||
                                                                'Người dùng ẩn danh'}
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.reviewDate
                                                            }
                                                        >
                                                            {formatReviewDate(
                                                                review.createdAt,
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles.reviewRating
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.ratingStars
                                                        }
                                                    >
                                                        {renderStars(
                                                            review.rating,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <div
                                                    className={
                                                        styles.reviewComment
                                                    }
                                                >
                                                    {review.comment}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="col-lg-4">
                        {/* Organizer Info */}
                        <div
                            className={`${styles.contentCard} ${styles.stickyCard}`}
                        >
                            <h4 className={styles.sectionTitle}>
                                <i className="bi bi-people-fill"></i>
                                Ban Tổ Chức
                            </h4>

                            <div className={styles.organizerInfo}>
                                <img
                                    src={event.organizer?.logo}
                                    alt="Logo ban tổ chức"
                                    className={styles.organizerLogo}
                                />
                                <div className={styles.organizerDetails}>
                                    <h5 className={styles.organizerName}>
                                        {event.organizer?.name}
                                    </h5>
                                    <p className={styles.organizerDescription}>
                                        {event.organizer?.description}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.organizerContact}>
                                {event.organizer?.email && (
                                    <div className={styles.contactItem}>
                                        <i className="bi bi-envelope"></i>
                                        <a
                                            href={`mailto:${event.organizer.email}`}
                                        >
                                            {event.organizer.email}
                                        </a>
                                    </div>
                                )}

                                {event.organizer?.phone && (
                                    <div className={styles.contactItem}>
                                        <i className="bi bi-telephone"></i>
                                        <a
                                            href={`tel:${event.organizer.phone}`}
                                        >
                                            {event.organizer.phone}
                                        </a>
                                    </div>
                                )}

                                <Link
                                    to={`/organizer/${event.createdBy}/reviews`}
                                    className={styles.detailsButton}
                                >
                                    <i className="bi bi-info-circle"></i>
                                    Xem thông tin chi tiết
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

            {/* Mobile Fixed Bottom Bar */}
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
        </div>
    );
};

export default EventDetail;
