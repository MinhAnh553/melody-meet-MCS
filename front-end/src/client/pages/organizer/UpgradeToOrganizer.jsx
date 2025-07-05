import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import UploadImage from '../../components/UploadImage';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import styles from './OrganizerInfo.module.css';
import { BsHouseDoor } from 'react-icons/bs';

const UpgradeToOrganizer = () => {
    const [form, setForm] = useState({
        name: '',
        info: '',
        email: '',
        phone: '',
    });
    const [file, setFile] = useState(null);
    const [checkingRequest, setCheckingRequest] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkExistingRequest();
    }, []);

    const checkExistingRequest = async () => {
        try {
            const res = await api.getUserUpgradeRequest();
            if (res && res.success && res.upgradeRequest) {
                // Chỉ redirect nếu yêu cầu đang pending hoặc đã approved
                if (
                    res.upgradeRequest.status === 'pending' ||
                    res.upgradeRequest.status === 'approved'
                ) {
                    navigate('/user/upgrade/status');
                    return;
                }
                // Nếu bị rejected thì cho phép truy cập lại form
            }
        } catch (error) {
            console.error('Error checking upgrade request:', error);
        } finally {
            setCheckingRequest(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const updateFile = (newData) => {
        setFile((prev) => ({ ...prev, ...newData }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let logoUrl = '';
            let logoMediaId = '';
            if (file && file.logo instanceof File) {
                const formData = new FormData();
                formData.append('file', file.logo);
                const result = await api.uploadMedia(formData);
                logoUrl = result.url;
                logoMediaId = result.mediaId;
            }
            const data = {
                organizer: {
                    ...form,
                    logo: logoUrl,
                    logoMediaId: logoMediaId,
                },
            };
            const res = await api.createUpgradeRequest(data);
            if (res && res.success) {
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Yêu cầu nâng cấp đã được gửi thành công! Vui lòng chờ admin xem xét.',
                });
                navigate('/user/upgrade/status');
            } else {
                throw new Error(res?.message || 'Lỗi gửi yêu cầu nâng cấp');
            }
        } catch (error) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title:
                    error.message || 'Có lỗi xảy ra khi gửi yêu cầu nâng cấp',
            });
        }
    };

    // Hiển thị loading khi đang kiểm tra yêu cầu hiện có
    if (checkingRequest) {
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
                        <span className="visually-hidden">
                            Đang kiểm tra...
                        </span>
                    </div>
                    <p className="mt-2 text-white">
                        Đang kiểm tra yêu cầu nâng cấp...
                    </p>
                </div>
            </div>
        );
    }

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
                    maxWidth: 500,
                    width: '100%',
                    margin: '0 auto',
                    background: 'rgba(49,53,62,0.98)',
                }}
            >
                <h2
                    className="mb-3 text-center"
                    style={{
                        color: '#ffd700',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                    }}
                >
                    Trở thành người tổ chức sự kiện
                </h2>
                <p
                    className="text-center mb-4"
                    style={{ color: '#b0b3b8', fontSize: '1.08rem' }}
                >
                    Hãy hoàn thiện thông tin để bắt đầu tổ chức sự kiện chuyên
                    nghiệp!
                </p>
                <Form onSubmit={handleSubmit}>
                    <div className="mb-4 d-flex flex-column align-items-center">
                        <div style={{ marginBottom: 8 }}>
                            <UploadImage
                                id="uploadLogo"
                                iconClass="fas fa-upload fa-2x text-warning"
                                defaultText="Tải lên logo ban tổ chức"
                                inputName="organizerLogo"
                                onFileSelect={(file, previewUrl) =>
                                    updateFile({
                                        logo: file,
                                        logoPreview: previewUrl,
                                    })
                                }
                            />
                        </div>
                        <div
                            style={{
                                textAlign: 'center',
                                color: '#ffd700',
                                fontWeight: 600,
                                fontSize: '1.05rem',
                                marginBottom: 8,
                            }}
                        >
                            Logo
                        </div>
                    </div>
                    <Form.Group className="mb-3">
                        <Form.Label
                            className="fw-bold"
                            style={{ color: '#ffd700', fontSize: '1.08rem' }}
                        >
                            Tên ban tổ chức
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Nhập tên ban tổ chức của bạn"
                            className="shadow-sm"
                            style={{
                                background: '#23243a',
                                color: '#fff',
                                border: '1.5px solid #ffd700',
                                borderRadius: '0.7rem',
                            }}
                        />
                        <style>
                            {`
                                input[name="name"]::placeholder {
                                    color: #b0b3b8 !important;
                                    opacity: 0.8;
                                }
                            `}
                        </style>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label
                            className="fw-bold"
                            style={{ color: '#ffd700', fontSize: '1.08rem' }}
                        >
                            Mô tả
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="info"
                            value={form.info}
                            onChange={handleChange}
                            placeholder="Mô tả về ban tổ chức, lĩnh vực hoạt động, kinh nghiệm tổ chức sự kiện..."
                            className="shadow-sm"
                            style={{
                                background: '#23243a',
                                color: '#fff',
                                border: '1.5px solid #ffd700',
                                borderRadius: '0.7rem',
                            }}
                        />
                        <style>
                            {`
                                textarea[name="info"]::placeholder {
                                    color: #b0b3b8 !important;
                                    opacity: 0.8;
                                }
                            `}
                        </style>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label
                            className="fw-bold"
                            style={{ color: '#ffd700', fontSize: '1.08rem' }}
                        >
                            Email
                        </Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="Nhập email liên hệ của ban tổ chức"
                            className="shadow-sm"
                            style={{
                                background: '#23243a',
                                color: '#fff',
                                border: '1.5px solid #ffd700',
                                borderRadius: '0.7rem',
                            }}
                        />
                        <style>
                            {`
                                input[name="email"]::placeholder {
                                    color: #b0b3b8 !important;
                                    opacity: 0.8;
                                }
                            `}
                        </style>
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label
                            className="fw-bold"
                            style={{ color: '#ffd700', fontSize: '1.08rem' }}
                        >
                            Số điện thoại
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            placeholder="Nhập số điện thoại liên hệ của ban tổ chức"
                            className="shadow-sm"
                            style={{
                                background: '#23243a',
                                color: '#fff',
                                border: '1.5px solid #ffd700',
                                borderRadius: '0.7rem',
                            }}
                        />
                        <style>
                            {`
                                input[name="phone"]::placeholder {
                                    color: #b0b3b8 !important;
                                    opacity: 0.8;
                                }
                            `}
                        </style>
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-100 fw-bold"
                        style={{
                            background:
                                'linear-gradient(135deg, #ffd700 60%, #ffb300 100%)',
                            border: 'none',
                            color: '#23243a',
                            borderRadius: '2rem',
                            fontSize: '1.15rem',
                            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.18)',
                            padding: '0.85rem 0',
                            letterSpacing: '0.5px',
                            transition: 'all 0.2s',
                        }}
                    >
                        Nâng cấp ngay
                    </Button>
                </Form>
                <div className="d-flex justify-content-center mt-3">
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
                        onClick={() => navigate('/')}
                    >
                        <BsHouseDoor
                            style={{ fontSize: '1.2rem', marginRight: 6 }}
                        />
                        Quay lại trang chủ
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default UpgradeToOrganizer;
