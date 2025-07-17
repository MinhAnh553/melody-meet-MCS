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
                // Lấy 3 bình luận mới nhất
                const res = await api.getOrganizerReviews(userInfo._id, 1, 10);
                if (res && res.success) {
                    setStats({
                        totalEvents: userInfo.organizer.totalEvents, // Giữ nguyên dữ liệu mẫu cho events
                        totalTickets: userInfo.organizer.totalTickets, // Giữ nguyên dữ liệu mẫu cho tickets
                        averageRating: res.summary.averageRating || 0,
                        totalReviews: res.summary.totalReviews || 0,
                    });
                    setLatestReviews(res.reviews || []);
                }
            }
        } catch (error) {
            console.error('Error fetching organizer stats:', error);
            // Fallback với dữ liệu mẫu nếu API chưa sẵn sàng
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
        });
    };

    const getSocialIcon = (platform) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return <BsFacebook />;
            case 'instagram':
                return <BsInstagram />;
            case 'linkedin':
                return <BsLinkedin />;
            default:
                return <BsGlobe />;
        }
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

        // Có thay đổi logo
        if (file && file.logo instanceof File) {
            // Xóa logo cũ
            await api.deleteMedia(logoMediaId);

            // Lưu logo mới
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

        // Gọi api update organizer
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
            <Container fluid className={`${styles.container} min-vh-100 p-4`}>
                <LoadingSpinner />
            </Container>
        );
    }

    if (!organizerInfo) {
        return (
            <Container fluid className={`${styles.container} min-vh-100 p-4`}>
                <div className="text-center my-5">
                    <h3 className="text-white">Không tìm thấy thông tin BTC</h3>
                    <Link to="/" className="btn btn-light mt-3">
                        Về trang chủ
                    </Link>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className={styles.organizerContainer}>
            {/* Organizer Info Card */}
            <Row className="pt-4">
                <Col md={12} className="px-4">
                    <div className={styles.organizerCard}>
                        <Row>
                            <Col md={3} className="text-center mb-3">
                                {editMode ? (
                                    <div className="mb-3 d-flex flex-column align-items-center">
                                        <UploadImage
                                            id="uploadLogo"
                                            iconClass="fas fa-upload fa-2x text-warning"
                                            defaultText="Chọn hoặc kéo thả logo mới"
                                            inputName="organizerLogo"
                                            defaultPreview={organizerInfo.logo}
                                            onFileSelect={(file, previewUrl) =>
                                                updateFile({
                                                    logo: file,
                                                    logoPreview: previewUrl,
                                                })
                                            }
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={
                                            organizerInfo.logo ||
                                            '/src/assets/images/avatar.png'
                                        }
                                        alt={organizerInfo.name}
                                        className={`${styles.organizerAvatar} rounded-circle`}
                                    />
                                )}
                            </Col>
                            <Col md={9}>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        {editMode ? (
                                            <Form.Group className="mb-2">
                                                <Form.Label className="fw-bold">
                                                    Tên BTC
                                                </Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="name"
                                                    value={editData.name || ''}
                                                    onChange={handleChange}
                                                    placeholder="Tên ban tổ chức"
                                                    className="text-dark"
                                                />
                                            </Form.Group>
                                        ) : (
                                            <h2 className="mb-2 text-white">
                                                {organizerInfo.name}
                                            </h2>
                                        )}
                                        <div className="d-flex align-items-center mb-2">
                                            <div
                                                className={
                                                    styles.organizerRatingStars
                                                }
                                            >
                                                {renderStars(
                                                    stats.averageRating,
                                                )}
                                            </div>
                                            <span
                                                className={
                                                    styles.organizerRatingText
                                                }
                                            >
                                                {stats.averageRating.toFixed(1)}{' '}
                                                ({stats.totalReviews} đánh giá)
                                            </span>
                                        </div>
                                        {true && (
                                            <span
                                                className={
                                                    styles.organizerBadge
                                                }
                                            >
                                                <BsCheckCircle className="me-1" />
                                                Đã xác thực
                                            </span>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        {/* {!editMode && (
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={handleEdit}
                                            >
                                                Chỉnh sửa
                                            </Button>
                                        )} */}
                                        <Link
                                            to={`/organizer/${organizerInfo._id}/reviews`}
                                            className={
                                                styles.organizerContactButton
                                            }
                                        >
                                            <BsPeople />
                                            Xem đánh giá
                                        </Link>
                                    </div>
                                </div>
                                {editMode ? (
                                    <Form.Group className="mb-2">
                                        <Form.Label className="fw-bold">
                                            Mô tả
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="info"
                                            value={editData.info || ''}
                                            onChange={handleChange}
                                            placeholder="Mô tả về ban tổ chức"
                                            className="text-dark"
                                        />
                                    </Form.Group>
                                ) : (
                                    organizerInfo.description && (
                                        <p className="mb-0 text-white">
                                            {organizerInfo.description}
                                        </p>
                                    )
                                )}
                            </Col>
                        </Row>
                        {editMode && (
                            <Row className="mt-3">
                                <Col md={6}>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="fw-bold">
                                            Email
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editData.email || ''}
                                            onChange={handleChange}
                                            placeholder="Email liên hệ"
                                            className="text-dark"
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label className="fw-bold">
                                            Số điện thoại
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="phone"
                                            value={editData.phone || ''}
                                            onChange={handleChange}
                                            placeholder="Số điện thoại liên hệ"
                                            className="text-dark"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={12} className="text-end mt-3">
                                    <Button
                                        variant="success"
                                        className="me-2"
                                        onClick={handleSave}
                                    >
                                        Lưu
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={handleCancel}
                                    >
                                        Hủy
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Stats Cards */}
            <Row className={styles.organizerStatsRow + ' mb-4'}>
                <Col md={3} className="px-4 mb-3">
                    <div className={styles.organizerStatsCard}>
                        <BsCalendarEvent
                            className="text-primary mb-2"
                            size={24}
                        />
                        <div className={styles.organizerStatNumber}>
                            {stats.totalEvents}
                        </div>
                        <div className={styles.organizerStatLabel}>
                            Sự kiện đã tổ chức
                        </div>
                    </div>
                </Col>
                <Col md={3} className="px-4 mb-3">
                    <div className={styles.organizerStatsCard}>
                        <BsTicketPerforated
                            className="text-success mb-2"
                            size={24}
                        />

                        <div className={styles.organizerStatNumber}>
                            {stats.totalTickets}
                        </div>
                        <div className={styles.organizerStatLabel}>
                            Vé đã bán
                        </div>
                    </div>
                </Col>
                <Col md={3} className="px-4 mb-3">
                    <div className={styles.organizerStatsCard}>
                        <BsStarFill className="text-warning mb-2" size={24} />
                        <div className={styles.organizerStatNumber}>
                            {stats.averageRating.toFixed(1)}
                        </div>
                        <div className={styles.organizerStatLabel}>
                            Điểm đánh giá
                        </div>
                    </div>
                </Col>
                <Col md={3} className="px-4 mb-3">
                    <div className={styles.organizerStatsCard}>
                        <BsAward className="text-info mb-2" size={24} />
                        <div className={styles.organizerStatNumber}>
                            {stats.totalReviews}
                        </div>
                        <div className={styles.organizerStatLabel}>
                            Đánh giá
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Contact Information */}
            <Row className="mb-4">
                <Col md={6} className="px-4 mb-3">
                    <div className={styles.organizerInfoSection}>
                        <h4 className={styles.organizerSectionTitle}>
                            <BsTelephone className="me-2" />
                            Thông tin liên hệ
                        </h4>
                        {organizerInfo.phone && (
                            <div className={styles.organizerInfoItem}>
                                <div className={styles.organizerInfoIcon}>
                                    <BsTelephone />
                                </div>
                                <div className={styles.organizerInfoValue}>
                                    <div className={styles.organizerInfoLabel}>
                                        Số điện thoại
                                    </div>
                                    <div>
                                        <a
                                            href={`tel:${organizerInfo.phone}`}
                                            className="text-decoration-none"
                                        >
                                            {organizerInfo.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                        {organizerInfo.email && (
                            <div className={styles.organizerInfoItem}>
                                <div className={styles.organizerInfoIcon}>
                                    <BsEnvelope />
                                </div>
                                <div className={styles.organizerInfoValue}>
                                    <div className={styles.organizerInfoLabel}>
                                        Email
                                    </div>
                                    <div>
                                        <a
                                            href={`mailto:${organizerInfo.email}`}
                                            className="text-decoration-none"
                                        >
                                            {organizerInfo.email}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
                <Col md={6} className="px-4 mb-3">
                    <div className={styles.organizerInfoSection}>
                        <h4 className={styles.organizerSectionTitle}>
                            <BsGlobe className="me-2" />
                            Thông tin khác
                        </h4>
                        {organizerInfo.createdAt && (
                            <div className={styles.organizerInfoItem}>
                                <div className={styles.organizerInfoIcon}>
                                    <BsCalendarEvent />
                                </div>
                                <div className={styles.organizerInfoValue}>
                                    <div className={styles.organizerInfoLabel}>
                                        Ngày tham gia
                                    </div>
                                    <div>
                                        {formatDate(organizerInfo.createdAt)}
                                    </div>
                                </div>
                            </div>
                        )}
                        {organizerInfo.role && (
                            <div className={styles.organizerInfoItem}>
                                <div className={styles.organizerInfoIcon}>
                                    <BsAward />
                                </div>
                                <div className={styles.organizerInfoValue}>
                                    <div className={styles.organizerInfoLabel}>
                                        Vai trò
                                    </div>
                                    <div>
                                        {organizerInfo.role === 'organizer'
                                            ? 'Ban tổ chức'
                                            : organizerInfo.role}
                                    </div>
                                </div>
                            </div>
                        )}
                        {organizerInfo.status && (
                            <div className={styles.organizerInfoItem}>
                                <div className={styles.organizerInfoIcon}>
                                    <BsCheckCircle />
                                </div>
                                <div className={styles.organizerInfoValue}>
                                    <div className={styles.organizerInfoLabel}>
                                        Trạng thái
                                    </div>
                                    <div>
                                        {organizerInfo.status === 'active'
                                            ? 'Hoạt động'
                                            : organizerInfo.status}
                                    </div>
                                </div>
                            </div>
                        )}
                        {organizerInfo.website ? (
                            <div className="d-flex flex-column align-items-center gap-2 mt-2">
                                <a
                                    href={organizerInfo.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-info fw-bold"
                                >
                                    <BsGlobe className="me-1" /> Website/Fanpage
                                </a>
                            </div>
                        ) : (
                            <p className="text-white text-center py-3">
                                Chưa có thông tin mạng xã hội
                            </p>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Bank Account Information */}
            <Row className="mb-4">
                <Col md={12} className="px-4">
                    <div className={styles.organizerInfoSection}>
                        <h4 className={styles.organizerSectionTitle}>
                            <BsTicketPerforated className="me-2" />
                            Thông tin tài khoản ngân hàng
                        </h4>
                        {organizerInfo.accountName ||
                        organizerInfo.accountNumber ||
                        organizerInfo.bankName ? (
                            <>
                                {organizerInfo.accountName && (
                                    <div className={styles.organizerInfoItem}>
                                        <div
                                            className={
                                                styles.organizerInfoLabel
                                            }
                                        >
                                            Tên tài khoản
                                        </div>
                                        <div style={{ marginLeft: '5px' }}>
                                            {organizerInfo.accountName}
                                        </div>
                                    </div>
                                )}
                                {organizerInfo.accountNumber && (
                                    <div className={styles.organizerInfoItem}>
                                        <div
                                            className={
                                                styles.organizerInfoLabel
                                            }
                                        >
                                            Số tài khoản
                                        </div>
                                        <div style={{ marginLeft: '5px' }}>
                                            {organizerInfo.accountNumber}
                                        </div>
                                    </div>
                                )}
                                {organizerInfo.bankName && (
                                    <div className={styles.organizerInfoItem}>
                                        <div
                                            className={
                                                styles.organizerInfoLabel
                                            }
                                        >
                                            Ngân hàng
                                        </div>
                                        <div style={{ marginLeft: '5px' }}>
                                            {organizerInfo.bankName}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-white text-center py-3">
                                Chưa có thông tin tài khoản ngân hàng
                            </p>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Latest Reviews */}
            {latestReviews.length > 0 && (
                <Row className="mb-4">
                    <Col md={12} className="px-4">
                        <div className={styles.organizerReviewCard}>
                            <h5
                                className="mb-4 fw-bold"
                                style={{
                                    color: '#ffd700',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                Bình luận mới nhất
                            </h5>
                            {latestReviews.map((review) => (
                                <div
                                    key={review._id}
                                    className="mb-4 pb-3 border-bottom"
                                    style={{ borderColor: '#393c47' }}
                                >
                                    <div className="d-flex align-items-center mb-2">
                                        <span
                                            className="me-2"
                                            style={{ fontSize: '1.2rem' }}
                                        >
                                            {renderStars(review.rating)}
                                        </span>
                                        <span
                                            className={
                                                styles.organizerReviewUser
                                            }
                                        >
                                            {review.userInfo &&
                                            review.userInfo[0]?.name
                                                ? review.userInfo[0].name
                                                : 'Ẩn danh'}
                                        </span>
                                        <span
                                            className={
                                                styles.organizerReviewEvent
                                            }
                                        >
                                            {review.eventInfo &&
                                            review.eventInfo[0]?.name
                                                ? `- ${review.eventInfo[0].name}`
                                                : ''}
                                        </span>
                                        <span
                                            className={
                                                styles.organizerReviewTime
                                            }
                                        >
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                    <div className="ps-2 d-flex align-items-start">
                                        <span
                                            className={
                                                styles.organizerReviewQuote
                                            }
                                        >
                                            &ldquo;
                                        </span>
                                        <span
                                            className={
                                                styles.organizerReviewComment
                                            }
                                        >
                                            {review.comment}
                                        </span>
                                        <span
                                            className={
                                                styles.organizerReviewQuote
                                            }
                                            style={{
                                                marginLeft: '8px',
                                            }}
                                        >
                                            &rdquo;
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default OrganizerInfo;
