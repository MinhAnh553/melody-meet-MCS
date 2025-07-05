import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { BsHouseDoor, BsClock, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import styles from './OrganizerInfo.module.css';

const UpgradeStatus = () => {
    const [upgradeRequest, setUpgradeRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUpgradeRequest();
    }, []);

    const fetchUpgradeRequest = async () => {
        try {
            setLoading(true);
            const res = await api.getUserUpgradeRequest();
            if (res && res.success) {
                setUpgradeRequest(res.upgradeRequest);
            }
        } catch (error) {
            console.error('Error fetching upgrade request:', error);
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Có lỗi xảy ra khi tải thông tin yêu cầu nâng cấp',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/';
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    badge: (
                        <Badge bg="warning" className="fs-6">
                            Chờ xử lý
                        </Badge>
                    ),
                    icon: <BsClock className="text-warning" size={24} />,
                    title: 'Yêu cầu đang được xem xét',
                    description:
                        'Yêu cầu nâng cấp của bạn đã được gửi thành công và đang chờ admin xem xét. Vui lòng kiên nhẫn chờ đợi.',
                };
            case 'approved':
                return {
                    badge: (
                        <Badge bg="success" className="fs-6">
                            Đã duyệt
                        </Badge>
                    ),
                    icon: <BsCheckCircle className="text-success" size={24} />,
                    title: 'Chúc mừng! Yêu cầu đã được duyệt',
                    description:
                        'Tài khoản của bạn đã được nâng cấp thành người tổ chức sự kiện. Bây giờ bạn có thể tạo và quản lý sự kiện.',
                };
            case 'rejected':
                return {
                    badge: (
                        <Badge bg="danger" className="fs-6">
                            Đã từ chối
                        </Badge>
                    ),
                    icon: <BsXCircle className="text-danger" size={24} />,
                    title: 'Yêu cầu bị từ chối',
                    description:
                        'Yêu cầu nâng cấp của bạn đã bị từ chối. Vui lòng xem lý do bên dưới và thử lại.',
                };
            default:
                return {
                    badge: (
                        <Badge bg="secondary" className="fs-6">
                            Không xác định
                        </Badge>
                    ),
                    icon: <BsClock className="text-secondary" size={24} />,
                    title: 'Trạng thái không xác định',
                    description:
                        'Không thể xác định trạng thái yêu cầu nâng cấp.',
                };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div
                className={styles.organizerContainer}
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div className="text-center">
                    <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2 text-white">
                        Đang tải thông tin yêu cầu nâng cấp...
                    </p>
                </div>
            </div>
        );
    }

    if (!upgradeRequest) {
        return (
            <div
                className={styles.organizerContainer}
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Card
                    className={styles.organizerCard}
                    style={{
                        maxWidth: 500,
                        width: '100%',
                        margin: '0 auto',
                        background: 'rgba(49,53,62,0.98)',
                    }}
                >
                    <div className="text-center">
                        <h3 className="mb-3" style={{ color: '#ffd700' }}>
                            Không tìm thấy yêu cầu nâng cấp
                        </h3>
                        <p className="text-white mb-4">
                            Bạn chưa có yêu cầu nâng cấp nào hoặc yêu cầu đã bị
                            xóa.
                        </p>
                        <div className="d-flex justify-content-center gap-3">
                            <Button
                                variant="outline-warning"
                                style={{
                                    borderRadius: '2rem',
                                    fontWeight: 600,
                                    border: '2px solid #ffd700',
                                    padding: '0.6rem 1.5rem',
                                    fontSize: '1.05rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                                onClick={() => navigate('/user/upgrade')}
                            >
                                <BsHouseDoor
                                    style={{
                                        fontSize: '1.2rem',
                                        marginRight: 6,
                                    }}
                                />
                                Nâng cấp ngay
                            </Button>
                            <Button
                                variant="outline-light"
                                style={{
                                    borderRadius: '2rem',
                                    fontWeight: 600,
                                    border: '2px solid #fff',
                                    padding: '0.6rem 1.5rem',
                                    fontSize: '1.05rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                                onClick={() => navigate('/')}
                            >
                                Về trang chủ
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const statusInfo = getStatusInfo(upgradeRequest.status);

    return (
        <div
            className={styles.organizerContainer}
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 0',
            }}
        >
            <Card
                className={styles.organizerCard}
                style={{
                    maxWidth: 600,
                    width: '100%',
                    margin: '0 auto',
                    background: 'rgba(49,53,62,0.98)',
                }}
            >
                <div className="text-center mb-4">
                    {statusInfo.icon}
                    <h2
                        className="mt-3 mb-2"
                        style={{ color: '#ffd700', fontWeight: 600 }}
                    >
                        {statusInfo.title}
                    </h2>
                    {statusInfo.badge}
                </div>

                <div className="mb-4">
                    <p
                        className="text-white text-center"
                        style={{ fontSize: '1.1rem' }}
                    >
                        {statusInfo.description}
                    </p>
                    {upgradeRequest.status === 'approved' && (
                        <div
                            className="alert alert-warning mt-3"
                            style={{
                                background: 'rgba(255, 193, 7, 0.2)',
                                border: '1px solid #ffc107',
                                borderRadius: '0.75rem',
                            }}
                        >
                            <div className="d-flex align-items-center">
                                <i
                                    className="fas fa-exclamation-triangle me-2"
                                    style={{ color: '#ffc107' }}
                                ></i>
                                <span className="text-white">
                                    <strong>Lưu ý:</strong> Vui lòng đăng xuất
                                    và đăng nhập lại để được áp dụng.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <h5 style={{ color: '#ffd700', marginBottom: '1rem' }}>
                        Thông tin yêu cầu:
                    </h5>
                    <div
                        style={{
                            background: 'rgba(60, 63, 72, 0.85)',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                        }}
                    >
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <strong style={{ color: '#ffd700' }}>
                                    Tên ban tổ chức:
                                </strong>
                                <p className="text-white mb-0">
                                    {upgradeRequest.organizer.name}
                                </p>
                            </div>
                            <div className="col-md-6 mb-3">
                                <strong style={{ color: '#ffd700' }}>
                                    Email:
                                </strong>
                                <p className="text-white mb-0">
                                    {upgradeRequest.organizer.email}
                                </p>
                            </div>
                            <div className="col-md-6 mb-3">
                                <strong style={{ color: '#ffd700' }}>
                                    Số điện thoại:
                                </strong>
                                <p className="text-white mb-0">
                                    {upgradeRequest.organizer.phone}
                                </p>
                            </div>
                            <div className="col-md-6 mb-3">
                                <strong style={{ color: '#ffd700' }}>
                                    Ngày gửi yêu cầu:
                                </strong>
                                <p className="text-white mb-0">
                                    {formatDate(upgradeRequest.createdAt)}
                                </p>
                            </div>
                            {upgradeRequest.organizer.info && (
                                <div className="col-12 mb-3">
                                    <strong style={{ color: '#ffd700' }}>
                                        Mô tả:
                                    </strong>
                                    <p className="text-white mb-0">
                                        {upgradeRequest.organizer.info}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {upgradeRequest.adminNote && (
                    <div className="mb-4">
                        <h5 style={{ color: '#ffd700', marginBottom: '1rem' }}>
                            {upgradeRequest.status === 'approved'
                                ? 'Ghi chú của admin:'
                                : 'Lý do từ chối:'}
                        </h5>
                        <div
                            style={{
                                background:
                                    upgradeRequest.status === 'approved'
                                        ? 'rgba(40, 167, 69, 0.2)'
                                        : 'rgba(220, 53, 69, 0.2)',
                                border: `1px solid ${
                                    upgradeRequest.status === 'approved'
                                        ? '#28a745'
                                        : '#dc3545'
                                }`,
                                borderRadius: '0.75rem',
                                padding: '1.5rem',
                            }}
                        >
                            <p className="text-white mb-0">
                                {upgradeRequest.adminNote}
                            </p>
                        </div>
                    </div>
                )}

                <div className="d-flex justify-content-center gap-3">
                    {upgradeRequest.status === 'rejected' && (
                        <Button
                            variant="outline-warning"
                            style={{
                                borderRadius: '2rem',
                                fontWeight: 600,
                                border: '2px solid #ffd700',
                                padding: '0.6rem 1.5rem',
                                fontSize: '1.05rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                            onClick={() => navigate('/user/upgrade')}
                        >
                            Gửi lại yêu cầu
                        </Button>
                    )}
                    {upgradeRequest.status === 'approved' && (
                        <>
                            <Button
                                variant="outline-warning"
                                style={{
                                    borderRadius: '2rem',
                                    fontWeight: 600,
                                    border: '2px solid #ffc107',
                                    padding: '0.6rem 1.5rem',
                                    fontSize: '1.05rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                                onClick={handleLogout}
                            >
                                <i className="fas fa-sign-out-alt me-1"></i>
                                Đăng xuất
                            </Button>
                        </>
                    )}
                    <Button
                        variant="outline-light"
                        style={{
                            borderRadius: '2rem',
                            fontWeight: 600,
                            border: '2px solid #fff',
                            padding: '0.6rem 1.5rem',
                            fontSize: '1.05rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                        onClick={() => navigate('/')}
                    >
                        Về trang chủ
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default UpgradeStatus;
