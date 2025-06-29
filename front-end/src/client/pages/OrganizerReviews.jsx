import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Pagination } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { BsStarFill, BsStarHalf, BsStar, BsChevronRight } from 'react-icons/bs';
import api from '../../util/api';
import TimeText from '../components/providers/TimeText';
import swalCustomize from '../../util/swalCustomize';
import styles from './OrganizerReviews.module.css';

const OrganizerReviews = () => {
    const { organizerId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [organizerLoading, setOrganizerLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [organizerInfo, setOrganizerInfo] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchOrganizerInfo();
        fetchOrganizerReviews();
    }, [organizerId, currentPage]);

    const fetchOrganizerInfo = async () => {
        try {
            setOrganizerLoading(true);
            const res = await api.getOrganizerInfo(organizerId);
            if (res.success) {
                setOrganizerInfo(res.organizer);
            }
        } catch (error) {
            console.error('Error fetching organizer info:', error);
        } finally {
            setOrganizerLoading(false);
        }
    };

    const fetchOrganizerReviews = async () => {
        try {
            setLoading(true);
            const res = await api.getOrganizerReviews(
                organizerId,
                currentPage,
                itemsPerPage,
            );
            if (res.success) {
                setReviews(res.reviews);
                setTotalPages(res.pagination.totalPages);
                setTotalReviews(res.pagination.totalReviews);
                setAverageRating(res.summary.averageRating);
            }
        } catch (error) {
            console.error('Error fetching organizer reviews:', error);
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Có lỗi xảy ra khi tải đánh giá',
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        // Thêm sao đầy
        for (let i = 0; i < fullStars; i++) {
            stars.push(<BsStarFill key={i} className="text-warning" />);
        }

        // Thêm sao nửa (nếu có)
        if (hasHalfStar) {
            stars.push(<BsStarHalf key="half" className="text-warning" />);
        }

        // Thêm sao rỗng
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<BsStar key={`empty-${i}`} className="text-warning" />);
        }

        return stars;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <Container fluid className={`${styles.container} min-vh-100 p-4`}>
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải đánh giá...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container
            fluid
            className={`${styles.container} min-vh-100 p-4 rounded-4`}
        >
            {/* Breadcrumb */}
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
                        <span className="text-white">
                            Thông tin ban tổ chức
                        </span>
                    </div>
                </Col>
            </Row>

            {/* Organizer Info Section */}
            <Row className="pt-4">
                <Col md={12} className="px-4">
                    <div className="d-flex justify-content-between align-items-start mb-5">
                        {/* Organizer Info Card */}
                        <div className="flex-grow-1 me-4">
                            {organizerLoading ? (
                                <div
                                    className={`card p-4 border-0 shadow rounded-4 ${styles.organizerCard}`}
                                >
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="rounded-circle me-4"
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                backgroundColor: '#4a5568',
                                            }}
                                        />
                                        <div className="flex-grow-1">
                                            <div
                                                className="mb-2"
                                                style={{
                                                    width: '250px',
                                                    height: '28px',
                                                    backgroundColor: '#4a5568',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <div
                                                className="mb-3"
                                                style={{
                                                    width: '400px',
                                                    height: '18px',
                                                    backgroundColor: '#4a5568',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <div
                                                className="mb-1"
                                                style={{
                                                    width: '200px',
                                                    height: '16px',
                                                    backgroundColor: '#4a5568',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    width: '180px',
                                                    height: '16px',
                                                    backgroundColor: '#4a5568',
                                                    borderRadius: '4px',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`card p-4 border-0 shadow rounded-4 ${styles.organizerCard}`}
                                >
                                    <div className="d-flex align-items-start">
                                        <div className="me-4">
                                            <img
                                                src={
                                                    organizerInfo?.logo ||
                                                    '/src/assets/images/avatar.png'
                                                }
                                                alt="Organizer Logo"
                                                className={`rounded-circle ${styles.organizerAvatar}`}
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h4
                                                        className="text-white fw-bold mb-2"
                                                        style={{
                                                            textShadow:
                                                                '0 1px 2px rgba(0,0,0,0.3)',
                                                        }}
                                                    >
                                                        {organizerInfo?.name ||
                                                            'Ban Tổ Chức'}
                                                    </h4>
                                                    <div className="d-flex align-items-center gap-3 mb-3">
                                                        {organizerInfo?.email && (
                                                            <a
                                                                href={`mailto:${organizerInfo.email}`}
                                                                className={`text-decoration-none d-flex align-items-center ${styles.contactLink}`}
                                                            >
                                                                <i
                                                                    className="bi bi-envelope me-2"
                                                                    style={{
                                                                        fontSize:
                                                                            '1.1rem',
                                                                        color: '#90cdf4',
                                                                    }}
                                                                ></i>
                                                                <span className="small">
                                                                    {
                                                                        organizerInfo.email
                                                                    }
                                                                </span>
                                                            </a>
                                                        )}
                                                        {organizerInfo?.phone && (
                                                            <a
                                                                href={`tel:${organizerInfo.phone}`}
                                                                className={`text-decoration-none d-flex align-items-center ${styles.contactLink}`}
                                                            >
                                                                <i
                                                                    className="bi bi-telephone me-2"
                                                                    style={{
                                                                        fontSize:
                                                                            '1.1rem',
                                                                        color: '#90cdf4',
                                                                    }}
                                                                ></i>
                                                                <span className="small">
                                                                    {
                                                                        organizerInfo.phone
                                                                    }
                                                                </span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {organizerInfo?.info && (
                                                <div
                                                    className={`rounded p-3 ${styles.infoBox}`}
                                                >
                                                    <p
                                                        className="mb-0 text-white small"
                                                        style={{
                                                            lineHeight: '1.6',
                                                            color: '#e2e8f0',
                                                        }}
                                                    >
                                                        {organizerInfo.info}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rating Summary */}
                        {totalReviews > 0 && (
                            <div className="text-center">
                                <div
                                    className={`card p-4 border-0 shadow rounded-4 ${styles.ratingCard}`}
                                >
                                    <div className="d-flex flex-column align-items-center">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            {renderStars(averageRating)}
                                        </div>
                                        <h3
                                            className="fw-bold mb-1"
                                            style={{
                                                color: '#f6ad55',
                                                textShadow:
                                                    '0 1px 2px rgba(0,0,0,0.3)',
                                            }}
                                        >
                                            {averageRating.toFixed(1)}
                                        </h3>
                                        <p
                                            className="mb-0 small"
                                            style={{ color: '#e2e8f0' }}
                                        >
                                            {totalReviews} đánh giá
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Reviews Section Header */}
            {reviews.length > 0 && (
                <Row className="mb-4">
                    <Col md={12} className="px-4">
                        <div
                            className={`d-flex justify-content-between align-items-center ${styles.sectionHeader}`}
                        >
                            <h5 className={styles.sectionTitle}>
                                <i
                                    className="bi bi-star-fill me-2"
                                    style={{ color: '#f6ad55' }}
                                ></i>
                                Đánh giá từ người tham gia
                            </h5>
                            <span className={styles.sectionSubtitle}>
                                {totalReviews} đánh giá
                            </span>
                        </div>
                    </Col>
                </Row>
            )}

            {/* Reviews List */}
            <Row>
                <Col md={12} className="px-4">
                    {loading ? (
                        <div className="text-center my-5">
                            <div
                                className={`spinner-border ${styles.loadingSpinner}`}
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>
                            <p className="text-white mt-3">
                                Đang tải đánh giá...
                            </p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center my-5">
                            <div
                                className={`card p-5 border-0 shadow rounded-4 ${styles.emptyState}`}
                            >
                                <div className="mb-4">
                                    <i
                                        className="bi bi-star"
                                        style={{
                                            fontSize: '3rem',
                                            color: '#718096',
                                        }}
                                    ></i>
                                </div>
                                <h4 className="text-white mb-3">
                                    Chưa có đánh giá nào
                                </h4>
                                <p style={{ color: '#a0aec0' }}>
                                    Ban tổ chức này chưa có đánh giá nào từ
                                    người tham gia.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="reviews-container">
                            {reviews.map((review, index) => (
                                <Card
                                    key={review._id}
                                    className={`mb-4 border-0 shadow rounded-4 ${styles.reviewCard}`}
                                >
                                    <Card.Body className="p-4">
                                        {/* Review Header */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    {renderStars(review.rating)}
                                                    <span
                                                        className="fw-bold fs-6"
                                                        style={{
                                                            color: '#f6ad55',
                                                        }}
                                                    >
                                                        {review.rating}/5
                                                    </span>
                                                </div>
                                                {review.eventInfo &&
                                                    review.eventInfo.length >
                                                        0 && (
                                                        <Badge
                                                            className={`fs-6 px-3 py-2 ${styles.eventBadge}`}
                                                        >
                                                            <i className="bi bi-calendar-event me-1"></i>
                                                            {
                                                                review
                                                                    .eventInfo[0]
                                                                    .name
                                                            }
                                                        </Badge>
                                                    )}
                                            </div>
                                            <div className="text-end">
                                                <small
                                                    style={{ color: '#a0aec0' }}
                                                >
                                                    <TimeText
                                                        event={
                                                            review.eventInfo[0]
                                                        }
                                                    />
                                                </small>
                                            </div>
                                        </div>

                                        {/* Review Content */}
                                        {review.comment && (
                                            <div className="mb-4">
                                                <div
                                                    className={`rounded p-3 ${styles.reviewContent}`}
                                                >
                                                    <p
                                                        className="mb-0"
                                                        style={{
                                                            lineHeight: '1.6',
                                                            color: '#e2e8f0',
                                                        }}
                                                    >
                                                        &ldquo;{review.comment}
                                                        &rdquo;
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Review Footer */}
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3">
                                                <div
                                                    className={`d-flex align-items-center justify-content-center rounded-circle ${styles.userAvatar}`}
                                                    style={{
                                                        width: '45px',
                                                        height: '45px',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '1.1rem',
                                                    }}
                                                >
                                                    {review.userInfo &&
                                                    review.userInfo.length > 0
                                                        ? review.userInfo[0]
                                                              .name
                                                            ? review.userInfo[0].name
                                                                  .charAt(0)
                                                                  .toUpperCase()
                                                            : review.userInfo[0]
                                                                  .email
                                                            ? review.userInfo[0].email
                                                                  .charAt(0)
                                                                  .toUpperCase()
                                                            : 'U'
                                                        : 'U'}
                                                </div>
                                                <div>
                                                    <p className="mb-0 fw-bold text-white">
                                                        {review.userInfo &&
                                                        review.userInfo.length >
                                                            0
                                                            ? review.userInfo[0]
                                                                  .name ||
                                                              review.userInfo[0].email?.split(
                                                                  '@',
                                                              )[0] ||
                                                              'Người dùng'
                                                            : 'Người dùng'}
                                                    </p>
                                                    {review.eventInfo &&
                                                        review.eventInfo
                                                            .length > 0 && (
                                                            <small
                                                                style={{
                                                                    color: '#a0aec0',
                                                                }}
                                                            >
                                                                {formatDate(
                                                                    review.createdAt,
                                                                )}
                                                            </small>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Col>
            </Row>

            {/* Pagination */}
            {totalPages > 1 && (
                <Row className="mt-5">
                    <Col md={12} className="px-4">
                        <div className="d-flex justify-content-center">
                            <nav aria-label="Reviews pagination">
                                <Pagination className="mb-0">
                                    <Pagination.First
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="border-0"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color:
                                                currentPage === 1
                                                    ? '#4a5568'
                                                    : '#a0aec0',
                                        }}
                                    />
                                    <Pagination.Prev
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="border-0"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color:
                                                currentPage === 1
                                                    ? '#4a5568'
                                                    : '#a0aec0',
                                        }}
                                    />

                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        const isActive =
                                            pageNumber === currentPage;

                                        return (
                                            <Pagination.Item
                                                key={pageNumber}
                                                active={isActive}
                                                onClick={() =>
                                                    handlePageChange(pageNumber)
                                                }
                                                className={`border-0 mx-1 ${
                                                    styles.paginationItem
                                                } ${
                                                    isActive
                                                        ? styles.active
                                                        : ''
                                                }`}
                                            >
                                                {pageNumber}
                                            </Pagination.Item>
                                        );
                                    })}

                                    <Pagination.Next
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="border-0"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color:
                                                currentPage === totalPages
                                                    ? '#4a5568'
                                                    : '#a0aec0',
                                        }}
                                    />
                                    <Pagination.Last
                                        onClick={() =>
                                            handlePageChange(totalPages)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="border-0"
                                        style={{
                                            backgroundColor: 'transparent',
                                            color:
                                                currentPage === totalPages
                                                    ? '#4a5568'
                                                    : '#a0aec0',
                                        }}
                                    />
                                </Pagination>
                            </nav>
                        </div>
                        <div className="text-center mt-3">
                            <small
                                style={{
                                    color: '#a0aec0',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                Trang {currentPage} của {totalPages} (
                                {totalReviews} đánh giá)
                            </small>
                        </div>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default OrganizerReviews;
