import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Pagination } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { BsStarFill, BsStarHalf, BsStar, BsChevronRight } from 'react-icons/bs';
import api from '../../util/api';
import TimeText from '../components/providers/TimeText';
import swalCustomize from '../../util/swalCustomize';
import styles from './OrganizerReviews.module.css';
import LoadingSpinner from '../components/loading/LoadingSpinner';

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
            stars.push(<BsStarFill key={i} className={styles.starFilled} />);
        }

        // Thêm sao nửa (nếu có)
        if (hasHalfStar) {
            stars.push(<BsStarHalf key="half" className={styles.starFilled} />);
        }

        // Thêm sao rỗng
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <BsStar key={`empty-${i}`} className={styles.starEmpty} />,
            );
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

    if (loading && organizerLoading) {
        return (
            <div className={styles.container}>
                <Container>
                    <div className={styles.loadingContainer}>
                        <LoadingSpinner />
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Container>
                {/* Breadcrumb */}
                <div className={styles.breadcrumbSection}>
                    <nav aria-label="breadcrumb">
                        <ol className={styles.breadcrumb}>
                            <li className={styles.breadcrumbItem}>
                                <Link to="/" className={styles.breadcrumbLink}>
                                    <i className="bi bi-house-door"></i>
                                    Trang chủ
                                </Link>
                            </li>
                            <li className={styles.breadcrumbSeparator}>
                                <BsChevronRight />
                            </li>
                            <li className={styles.breadcrumbActive}>
                                Thông tin ban tổ chức
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* Hero Section - Organizer Info */}
                <div className={styles.heroSection}>
                    <Row className="g-4">
                        <Col lg={8}>
                            {organizerLoading ? (
                                <div className={styles.organizerCardSkeleton}>
                                    <div
                                        className={styles.skeletonAvatar}
                                    ></div>
                                    <div className={styles.skeletonContent}>
                                        <div
                                            className={styles.skeletonTitle}
                                        ></div>
                                        <div
                                            className={styles.skeletonText}
                                        ></div>
                                        <div
                                            className={styles.skeletonText}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <Card className={styles.organizerCard}>
                                    <Card.Body className="p-4">
                                        <div className={styles.organizerHeader}>
                                            <div
                                                className={
                                                    styles.organizerAvatarContainer
                                                }
                                            >
                                                <img
                                                    src={
                                                        organizerInfo?.logo ||
                                                        '/src/assets/images/avatar.png'
                                                    }
                                                    alt="Organizer Logo"
                                                    className={
                                                        styles.organizerAvatar
                                                    }
                                                />
                                            </div>
                                            <div
                                                className={styles.organizerInfo}
                                            >
                                                <h1
                                                    className={
                                                        styles.organizerName
                                                    }
                                                >
                                                    {organizerInfo?.name ||
                                                        'Ban Tổ Chức'}
                                                </h1>
                                                <div
                                                    className={
                                                        styles.organizerContacts
                                                    }
                                                >
                                                    {organizerInfo?.email && (
                                                        <a
                                                            href={`mailto:${organizerInfo.email}`}
                                                            className={
                                                                styles.contactLink
                                                            }
                                                        >
                                                            <i className="bi bi-envelope"></i>
                                                            {
                                                                organizerInfo.email
                                                            }
                                                        </a>
                                                    )}
                                                    {organizerInfo?.phone && (
                                                        <a
                                                            href={`tel:${organizerInfo.phone}`}
                                                            className={
                                                                styles.contactLink
                                                            }
                                                        >
                                                            <i className="bi bi-telephone"></i>
                                                            {
                                                                organizerInfo.phone
                                                            }
                                                        </a>
                                                    )}
                                                    {organizerInfo?.website && (
                                                        <a
                                                            href={
                                                                organizerInfo.website
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={
                                                                styles.contactLink
                                                            }
                                                        >
                                                            <i className="bi bi-globe"></i>
                                                            Website
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {organizerInfo?.info && (
                                            <div
                                                className={
                                                    styles.organizerDescription
                                                }
                                            >
                                                <p>{organizerInfo.info}</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        {/* Rating Summary Card */}
                        {totalReviews > 0 && (
                            <Col lg={4}>
                                <Card className={styles.ratingCard}>
                                    <Card.Body className="text-center p-4">
                                        <div className={styles.ratingDisplay}>
                                            <div
                                                className={styles.ratingNumber}
                                            >
                                                {averageRating.toFixed(1)}
                                            </div>
                                            <div className={styles.ratingStars}>
                                                {renderStars(averageRating)}
                                            </div>
                                            <div className={styles.ratingCount}>
                                                {totalReviews} đánh giá
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>
                </div>

                {/* Reviews Section */}
                <div className={styles.reviewsSection}>
                    {/* Section Header */}
                    {reviews.length > 0 && (
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <i className="bi bi-star-fill"></i>
                                Đánh giá từ người tham gia
                            </h2>
                            <span className={styles.reviewTotal}>
                                {totalReviews} đánh giá
                            </span>
                        </div>
                    )}

                    {/* Reviews List */}
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <LoadingSpinner />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Card className={styles.emptyCard}>
                                <Card.Body className="text-center p-5">
                                    <div className={styles.emptyIcon}>
                                        <i className="bi bi-star"></i>
                                    </div>
                                    <h3 className={styles.emptyTitle}>
                                        Chưa có đánh giá nào
                                    </h3>
                                    <p className={styles.emptyText}>
                                        Ban tổ chức này chưa có đánh giá nào từ
                                        người tham gia.
                                    </p>
                                </Card.Body>
                            </Card>
                        </div>
                    ) : (
                        <div className={styles.reviewsList}>
                            {reviews.map((review) => (
                                <Card
                                    key={review._id}
                                    className={styles.reviewCard}
                                >
                                    <Card.Body className="p-4">
                                        {/* Review Header */}
                                        <div className={styles.reviewHeader}>
                                            <div className={styles.reviewMeta}>
                                                <div
                                                    className={
                                                        styles.reviewRating
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.reviewStars
                                                        }
                                                    >
                                                        {renderStars(
                                                            review.rating,
                                                        )}
                                                    </div>
                                                    <span
                                                        className={
                                                            styles.reviewRatingText
                                                        }
                                                    >
                                                        {review.rating}/5
                                                    </span>
                                                </div>
                                                {review.eventInfo &&
                                                    review.eventInfo.length >
                                                        0 && (
                                                        <Badge
                                                            className={
                                                                styles.eventBadge
                                                            }
                                                            title={
                                                                review
                                                                    .eventInfo[0]
                                                                    .name
                                                            } // Tooltip
                                                        >
                                                            <i className="bi bi-calendar-event"></i>
                                                            <span
                                                                className={
                                                                    styles.eventName
                                                                }
                                                            >
                                                                {
                                                                    review
                                                                        .eventInfo[0]
                                                                        .name
                                                                }
                                                            </span>
                                                        </Badge>
                                                    )}
                                            </div>
                                            <div className={styles.reviewDate}>
                                                <TimeText
                                                    event={review.eventInfo[0]}
                                                />
                                            </div>
                                        </div>

                                        {/* Review Content */}
                                        {review.comment && (
                                            <div
                                                className={styles.reviewContent}
                                            >
                                                <p>"{review.comment}"</p>
                                            </div>
                                        )}

                                        {/* Review Footer */}
                                        <div className={styles.reviewFooter}>
                                            <div className={styles.reviewUser}>
                                                <div
                                                    className={
                                                        styles.userAvatar
                                                    }
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
                                                <div
                                                    className={styles.userInfo}
                                                >
                                                    <div
                                                        className={
                                                            styles.userName
                                                        }
                                                    >
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
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.reviewTimestamp
                                                        }
                                                    >
                                                        {formatDate(
                                                            review.createdAt,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className={styles.paginationSection}>
                        <nav aria-label="Reviews pagination">
                            <Pagination className={styles.pagination}>
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

                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    const isActive = pageNumber === currentPage;

                                    return (
                                        <Pagination.Item
                                            key={pageNumber}
                                            active={isActive}
                                            onClick={() =>
                                                handlePageChange(pageNumber)
                                            }
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
                                />
                                <Pagination.Last
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </nav>
                        <div className={styles.paginationInfo}>
                            Trang {currentPage} của {totalPages} ({totalReviews}{' '}
                            đánh giá)
                        </div>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default OrganizerReviews;
