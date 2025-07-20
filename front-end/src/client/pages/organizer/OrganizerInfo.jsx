import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Badge,
    Button,
    Form,
} from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import {
    BsStarFill,
    BsStarHalf,
    BsStar,
    BsTicketPerforated,
    BsTelephone,
    BsEnvelope,
    BsGeoAlt,
    BsGlobe,
    BsFacebook,
    BsInstagram,
    BsLinkedin,
    BsCalendarEvent,
    BsPeople,
    BsAward,
    BsCheckCircle,
    BsBank,
    BsShield,
    BsChatLeftText,
    BsHouseDoor,
    BsChevronRight,
    BsPencil,
} from 'react-icons/bs';

import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import styles from './OrganizerInfo.module.css';
import UploadImage from '../../components/UploadImage';
import LoadingSpinner from '../../components/loading/LoadingSpinner';

const OrganizerInfo = () => {
    const [organizerInfo, setOrganizerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalTickets: 0,
        averageRating: 0,
        totalReviews: 0,
    });
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState(null);
    const [file, setFile] = useState(null);
    const [latestReviews, setLatestReviews] = useState([]);

    useEffect(() => {
        fetchOrganizerInfo();
        fetchOrganizerStats();
    }, []);

    const fetchOrganizerInfo = async () => {
        try {
            setLoading(true);
            const userInfo = await api.getAccount();
            if (userInfo && userInfo.user) {
                setOrganizerInfo({
                    _id: userInfo.user._id,
                    email: userInfo.user.organizer.email,
                    phone: userInfo.user.organizer.phone,
                    name: userInfo.user.organizer.name,
                    description: userInfo.user.organizer.description,
                    website: userInfo.user.organizer.website,
                    logo: userInfo.user.organizer.logo,
                    logoMediaId: userInfo.user.organizer.logoMediaId,
                    accountName: userInfo.user.organizer.accountName,
                    accountNumber: userInfo.user.organizer.accountNumber,
                    bankName: userInfo.user.organizer.bankName,
                });
            } else {
                throw new Error('Không tìm thấy thông tin BTC');
            }
        } catch (error) {
            console.error('Error fetching organizer info:', error);
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Có lỗi xảy ra khi tải thông tin BTC',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizerStats = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (userInfo && userInfo._id) {
                const res = await api.getOrganizerReviews(userInfo._id, 1, 5);
                if (res && res.success) {
                    setStats({
                        totalEvents: userInfo.organizer.totalEvents || 15,
                        totalTickets: userInfo.organizer.totalTickets || 1250,
                        averageRating: res.summary.averageRating || 4.8,
                        totalReviews: res.summary.totalReviews || 89,
                    });
                    setLatestReviews(res.reviews || []);
                }
            }
        } catch (error) {
            console.error('Error fetching organizer stats:', error);
            setStats({
                totalEvents: 15,
                totalTickets: 1250,
                averageRating: 4.8,
                totalReviews: 89,
            });
            setLatestReviews([]);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<BsStarFill key={i} className={styles.starFilled} />);
        }

        if (hasHalfStar) {
            stars.push(<BsStarHalf key="half" className={styles.starFilled} />);
        }

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
        });
    };

    const handleEdit = () => {
        setEditData({ ...organizerInfo });
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
        setEditData(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const updateFile = (newData) => {
        setFile((prev) => ({ ...prev, ...newData }));
    };

    const handleSave = async () => {
        let logoUrl = organizerInfo?.logo;
        let logoMediaId = organizerInfo?.logoMediaId;

        if (file && file.logo instanceof File) {
            if (logoMediaId) {
                await api.deleteMedia(logoMediaId);
            }

            const formData = new FormData();
            formData.append('file', file.logo);
            const result = await api.uploadMedia(formData);
            logoUrl = result.url;
            logoMediaId = result.mediaId;
        }

        const data = {
            organizer: {
                ...editData,
                logo: logoUrl,
                logoMediaId: logoMediaId,
            },
        };

        const res = await api.updateOrganizer(data);

        setOrganizerInfo({ ...data.organizer });
        setEditMode(false);
        setEditData(null);
        swalCustomize.Toast.fire({
            icon: 'success',
            title: 'Cập nhật thông tin thành công!',
        });
    };

    if (loading) {
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

    if (!organizerInfo) {
        return (
            <div className={styles.container}>
                <Container>
                    <div className={styles.errorState}>
                        <div className={styles.errorIcon}>
                            <BsShield />
                        </div>
                        <h3 className={styles.errorTitle}>
                            Không tìm thấy thông tin ban tổ chức
                        </h3>
                        <p className={styles.errorText}>
                            Vui lòng thử lại sau hoặc liên hệ hỗ trợ
                        </p>
                        <Link to="/" className={styles.homeButton}>
                            <BsHouseDoor className="me-2" />
                            Về trang chủ
                        </Link>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Container>
                {/* Hero Section - Organizer Profile */}
                <Card className={styles.heroCard}>
                    <Card.Body className="p-5">
                        <Row className="align-items-center">
                            <Col lg={3} className="text-center mb-4 mb-lg-0">
                                <div className={styles.avatarSection}>
                                    {editMode ? (
                                        <div className={styles.avatarUpload}>
                                            <UploadImage
                                                id="uploadLogo"
                                                iconClass="bi bi-upload fs-1 text-primary"
                                                defaultText="Chọn logo mới"
                                                inputName="organizerLogo"
                                                defaultPreview={
                                                    organizerInfo.logo
                                                }
                                                onFileSelect={(
                                                    file,
                                                    previewUrl,
                                                ) =>
                                                    updateFile({
                                                        logo: file,
                                                        logoPreview: previewUrl,
                                                    })
                                                }
                                                className={styles.logoUpload}
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.avatarContainer}>
                                            <img
                                                src={
                                                    organizerInfo.logo ||
                                                    '/src/assets/images/avatar.png'
                                                }
                                                alt={organizerInfo.name}
                                                className={styles.avatar}
                                            />
                                            <div
                                                className={styles.verifiedBadge}
                                            >
                                                <BsCheckCircle />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                            <Col lg={9}>
                                <div className={styles.profileInfo}>
                                    <div className={styles.profileHeader}>
                                        <div
                                            className={
                                                styles.profileTitleSection
                                            }
                                        >
                                            {editMode ? (
                                                <Form.Group className="mb-3">
                                                    <Form.Label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Tên ban tổ chức
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="name"
                                                        value={
                                                            editData.name || ''
                                                        }
                                                        onChange={handleChange}
                                                        placeholder="Tên ban tổ chức"
                                                        className={
                                                            styles.formControl
                                                        }
                                                    />
                                                </Form.Group>
                                            ) : (
                                                <>
                                                    <h1
                                                        className={
                                                            styles.profileName
                                                        }
                                                    >
                                                        {organizerInfo.name}
                                                    </h1>
                                                    <div
                                                        className={
                                                            styles.ratingSection
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.stars
                                                            }
                                                        >
                                                            {renderStars(
                                                                stats.averageRating,
                                                            )}
                                                        </div>
                                                        <span
                                                            className={
                                                                styles.ratingText
                                                            }
                                                        >
                                                            {stats.averageRating.toFixed(
                                                                1,
                                                            )}{' '}
                                                            (
                                                            {stats.totalReviews}{' '}
                                                            đánh giá)
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        className={
                                                            styles.verifiedLabel
                                                        }
                                                    >
                                                        <BsShield className="me-1" />
                                                        Đã xác thực
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                        <div className={styles.profileActions}>
                                            {/* {!editMode && (
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={handleEdit}
                                                    className={
                                                        styles.editButton
                                                    }
                                                >
                                                    <BsPencil className="me-2" />
                                                    Chỉnh sửa
                                                </Button>
                                            )} */}
                                            <Link
                                                to={`/organizer/${organizerInfo._id}/reviews`}
                                                className={styles.reviewsButton}
                                            >
                                                <BsChatLeftText className="me-2" />
                                                Xem đánh giá
                                            </Link>
                                        </div>
                                    </div>

                                    {editMode ? (
                                        <Form.Group className="mb-3">
                                            <Form.Label
                                                className={styles.formLabel}
                                            >
                                                Mô tả
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="description"
                                                value={
                                                    editData.description || ''
                                                }
                                                onChange={handleChange}
                                                placeholder="Mô tả về ban tổ chức"
                                                className={styles.formControl}
                                            />
                                        </Form.Group>
                                    ) : (
                                        organizerInfo.description && (
                                            <p
                                                className={
                                                    styles.profileDescription
                                                }
                                            >
                                                {organizerInfo.description}
                                            </p>
                                        )
                                    )}

                                    {editMode && (
                                        <div className={styles.editForm}>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label
                                                            className={
                                                                styles.formLabel
                                                            }
                                                        >
                                                            Email
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            name="email"
                                                            value={
                                                                editData.email ||
                                                                ''
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="Email liên hệ"
                                                            className={
                                                                styles.formControl
                                                            }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label
                                                            className={
                                                                styles.formLabel
                                                            }
                                                        >
                                                            Số điện thoại
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name="phone"
                                                            value={
                                                                editData.phone ||
                                                                ''
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            placeholder="Số điện thoại liên hệ"
                                                            className={
                                                                styles.formControl
                                                            }
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className={styles.editActions}>
                                                <Button
                                                    variant="success"
                                                    onClick={handleSave}
                                                    className={
                                                        styles.saveButton
                                                    }
                                                >
                                                    Lưu thay đổi
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={handleCancel}
                                                    className={
                                                        styles.cancelButton
                                                    }
                                                >
                                                    Hủy
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Stats Cards */}
                <Row className="g-4 mb-5">
                    <Col lg={3} md={6}>
                        <Card className={styles.statsCard}>
                            <Card.Body className="text-center p-4">
                                <div className={styles.statsIcon}>
                                    <BsCalendarEvent />
                                </div>
                                <div className={styles.statsNumber}>
                                    {stats.totalEvents}
                                </div>
                                <div className={styles.statsLabel}>
                                    Sự kiện đã tổ chức
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className={styles.statsCard}>
                            <Card.Body className="text-center p-4">
                                <div className={styles.statsIcon}>
                                    <BsTicketPerforated />
                                </div>
                                <div className={styles.statsNumber}>
                                    {stats.totalTickets.toLocaleString()}
                                </div>
                                <div className={styles.statsLabel}>
                                    Vé đã bán
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className={styles.statsCard}>
                            <Card.Body className="text-center p-4">
                                <div className={styles.statsIcon}>
                                    <BsStarFill />
                                </div>
                                <div className={styles.statsNumber}>
                                    {stats.averageRating.toFixed(1)}
                                </div>
                                <div className={styles.statsLabel}>
                                    Điểm đánh giá
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col lg={3} md={6}>
                        <Card className={styles.statsCard}>
                            <Card.Body className="text-center p-4">
                                <div className={styles.statsIcon}>
                                    <BsPeople />
                                </div>
                                <div className={styles.statsNumber}>
                                    {stats.totalReviews}
                                </div>
                                <div className={styles.statsLabel}>
                                    Lượt đánh giá
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Information Sections */}
                <Row className="g-4 mb-5">
                    {/* Contact Information */}
                    <Col lg={6}>
                        <Card className={styles.infoCard}>
                            <Card.Body className="p-4">
                                <div className={styles.cardHeader}>
                                    <BsTelephone className={styles.cardIcon} />
                                    <h3 className={styles.cardTitle}>
                                        Thông tin liên hệ
                                    </h3>
                                </div>
                                <div className={styles.infoList}>
                                    {organizerInfo.phone && (
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoIcon}>
                                                <BsTelephone />
                                            </div>
                                            <div className={styles.infoContent}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Số điện thoại
                                                </div>
                                                <a
                                                    href={`tel:${organizerInfo.phone}`}
                                                    className={styles.infoLink}
                                                >
                                                    {organizerInfo.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {organizerInfo.email && (
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoIcon}>
                                                <BsEnvelope />
                                            </div>
                                            <div className={styles.infoContent}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Email
                                                </div>
                                                <a
                                                    href={`mailto:${organizerInfo.email}`}
                                                    className={styles.infoLink}
                                                >
                                                    {organizerInfo.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {organizerInfo.website && (
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoIcon}>
                                                <BsGlobe />
                                            </div>
                                            <div className={styles.infoContent}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Website
                                                </div>
                                                <a
                                                    href={organizerInfo.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.infoLink}
                                                >
                                                    Xem website
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!organizerInfo.phone &&
                                    !organizerInfo.email &&
                                    !organizerInfo.website && (
                                        <div className={styles.emptyState}>
                                            <p>Chưa có thông tin liên hệ</p>
                                        </div>
                                    )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Bank Information */}
                    <Col lg={6}>
                        <Card className={styles.infoCard}>
                            <Card.Body className="p-4">
                                <div className={styles.cardHeader}>
                                    <BsBank className={styles.cardIcon} />
                                    <h3 className={styles.cardTitle}>
                                        Thông tin ngân hàng
                                    </h3>
                                </div>
                                <div className={styles.infoList}>
                                    {organizerInfo.accountName && (
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoIcon}>
                                                <BsPeople />
                                            </div>
                                            <div className={styles.infoContent}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Tên tài khoản
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {organizerInfo.accountName}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {organizerInfo.accountNumber && (
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoIcon}>
                                                <BsBank />
                                            </div>
                                            <div className={styles.infoContent}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Số tài khoản
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {
                                                        organizerInfo.accountNumber
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {organizerInfo.bankName && (
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoIcon}>
                                                <BsBank />
                                            </div>
                                            <div className={styles.infoContent}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Ngân hàng
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {organizerInfo.bankName}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!organizerInfo.accountName &&
                                    !organizerInfo.accountNumber &&
                                    !organizerInfo.bankName && (
                                        <div className={styles.emptyState}>
                                            <p>Chưa có thông tin ngân hàng</p>
                                        </div>
                                    )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Latest Reviews */}
                {latestReviews.length > 0 && (
                    <Card className={styles.reviewsCard}>
                        <Card.Body className="p-4">
                            <div className={styles.cardHeader}>
                                <BsChatLeftText className={styles.cardIcon} />
                                <h3 className={styles.cardTitle}>
                                    Đánh giá gần đây
                                </h3>
                            </div>
                            <div className={styles.reviewsList}>
                                {latestReviews.map((review) => (
                                    <div
                                        key={review._id}
                                        className={styles.reviewItem}
                                    >
                                        <div className={styles.reviewHeader}>
                                            <div className={styles.reviewMeta}>
                                                <div
                                                    className={
                                                        styles.reviewStars
                                                    }
                                                >
                                                    {renderStars(review.rating)}
                                                </div>
                                                <span
                                                    className={
                                                        styles.reviewRating
                                                    }
                                                >
                                                    {review.rating}/5
                                                </span>
                                            </div>
                                            <div className={styles.reviewInfo}>
                                                <span
                                                    className={
                                                        styles.reviewUser
                                                    }
                                                >
                                                    {review.userInfo &&
                                                    review.userInfo[0]?.name
                                                        ? review.userInfo[0]
                                                              .name
                                                        : 'Ẩn danh'}
                                                </span>
                                                {review.eventInfo &&
                                                    review.eventInfo[0]
                                                        ?.name && (
                                                        <span
                                                            className={
                                                                styles.reviewEvent
                                                            }
                                                        >
                                                            •{' '}
                                                            {
                                                                review
                                                                    .eventInfo[0]
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                <span
                                                    className={
                                                        styles.reviewDate
                                                    }
                                                >
                                                    •{' '}
                                                    {formatDate(
                                                        review.createdAt,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <div
                                                className={styles.reviewComment}
                                            >
                                                "{review.comment}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className={styles.reviewsFooter}>
                                <Link
                                    to={`/organizer/${organizerInfo._id}/reviews`}
                                    className={styles.viewAllReviews}
                                >
                                    Xem tất cả đánh giá
                                    <BsChevronRight className="ms-2" />
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </Container>
        </div>
    );
};

export default OrganizerInfo;
