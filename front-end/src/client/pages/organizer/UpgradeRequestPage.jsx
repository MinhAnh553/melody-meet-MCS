import React, { useState, useEffect } from 'react';
import styles from '../../styles/EventManagement.module.css';
import UploadImage from '../../components/UploadImage';
import swalCustomize from '../../../util/swalCustomize';
import { useNavigate } from 'react-router-dom';
import api from '../../../util/api';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import { Alert, Card, Badge, Button } from 'react-bootstrap';
import { BsHouseDoor, BsClock, BsCheckCircle, BsXCircle } from 'react-icons/bs';

const bankList = [
    'Vietcombank',
    'VietinBank',
    'BIDV',
    'Techcombank',
    'MB Bank',
    'ACB',
    'Sacombank',
    'TPBank',
    'VPBank',
    'SHB',
    'HDBank',
    'VIB',
    'OCB',
    'Eximbank',
    'SeABank',
    'MSB',
    'Nam A Bank',
    'ABBANK',
    'PVcomBank',
    'Bac A Bank',
    'Saigonbank',
    'PG Bank',
    'LienVietPostBank',
    'Kienlongbank',
    'VietBank',
    'Other',
];

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
                    'Yêu cầu nâng cấp của bạn đã được gửi thành công và đang chờ xem xét. Vui lòng kiên nhẫn chờ đợi.',
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
                description: 'Không thể xác định trạng thái yêu cầu nâng cấp.',
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

const UpgradeRequestPage = () => {
    const [form, setForm] = useState({
        orgName: '',
        orgTax: '',
        orgWebsite: '',
        orgDescription: '',
        orgPhone: '',
        orgEmail: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        agree: false,
    });
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [licenseFile, setLicenseFile] = useState(null);
    const [licensePreview, setLicensePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [rejectedNote, setRejectedNote] = useState('');
    const [mode, setMode] = useState('form'); // 'form' | 'status'
    const [statusData, setStatusData] = useState(null); // upgradeRequest object
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUpgradeRequest = async () => {
            try {
                const res = await api.getUserUpgradeRequest();
                if (res && res.success && res.upgradeRequest) {
                    if (
                        res.upgradeRequest.status === 'pending' ||
                        res.upgradeRequest.status === 'approved'
                    ) {
                        setMode('status');
                        setStatusData(res.upgradeRequest);
                    } else if (res.upgradeRequest.status === 'rejected') {
                        // Prefill form with rejected data
                        const {
                            organization,
                            representative,
                            bank,
                            adminNote,
                        } = res.upgradeRequest;
                        setForm({
                            orgName: organization?.name || '',
                            orgTax: organization?.tax || '',
                            orgWebsite: organization?.website || '',
                            orgDescription: organization?.description || '',
                            orgEmail: organization?.email || '',
                            orgPhone: organization?.phone || '',
                            accountName: organization?.accountName || '',
                            accountNumber: organization?.accountNumber || '',
                            bankName: organization?.bankName || '',
                            agree: organization?.agree || false,
                        });
                        setLogoPreview(organization?.logo || null);
                        setLicensePreview(organization?.licenseUrl || null);
                        setRejectedNote(
                            adminNote ||
                                'Yêu cầu trước của bạn đã bị từ chối. Vui lòng chỉnh sửa thông tin và gửi lại.',
                        );
                        setMode('form');
                    }
                } else {
                    setMode('form');
                }
            } catch (err) {
                setMode('form');
            } finally {
                setCheckingStatus(false);
            }
        };
        fetchUpgradeRequest();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    const handleLogoSelect = (file, previewUrl) => {
        setLogo(file);
        setLogoPreview(previewUrl);
    };
    const handleLicenseSelect = (file, previewUrl) => {
        setLicenseFile(file);
        setLicensePreview(previewUrl);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate Organization
        if (!form.orgName.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập tên tổ chức',
            });
        if (!logo && !logoPreview)
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng tải lên logo tổ chức',
            });
        if (!form.orgDescription.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập thông tin tổ chức',
            });
        if (!form.orgEmail.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập email tổ chức',
            });
        if (!form.orgPhone.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập số điện thoại tổ chức',
            });

        // Validate Bank
        if (!form.accountName.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập tên tài khoản ngân hàng',
            });
        if (!form.accountNumber.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập số tài khoản ngân hàng',
            });
        if (!form.bankName.trim())
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng chọn ngân hàng',
            });
        // Validate agreement
        if (!form.agree)
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Bạn cần xác nhận cam kết chịu trách nhiệm',
            });
        setSubmitting(true);
        try {
            // Upload logo if changed
            let logoUrl = logoPreview,
                logoMediaId = '';
            if (logo) {
                const formData = new FormData();
                formData.append('file', logo);
                const uploadRes = await api.uploadMedia(formData);
                logoUrl = uploadRes.data?.url || uploadRes.url;
                logoMediaId = uploadRes.data?.mediaId || uploadRes.mediaId;
            }
            // Upload license file if changed
            let licenseUrl = licensePreview,
                licenseMediaId = '';
            if (licenseFile) {
                const formData = new FormData();
                formData.append('file', licenseFile);
                const uploadRes = await api.uploadMedia(formData);
                licenseUrl = uploadRes.data?.url || uploadRes.url;
                licenseMediaId = uploadRes.data?.mediaId || uploadRes.mediaId;
            }
            // Build request body
            const data = {
                organization: {
                    name: form.orgName,
                    tax: form.orgTax,
                    website: form.orgWebsite,
                    description: form.orgDescription,
                    email: form.orgEmail,
                    phone: form.orgPhone,
                    logo: logoUrl,
                    logoMediaId,
                    licenseUrl,
                    licenseMediaId,
                    accountName: form.accountName,
                    accountNumber: form.accountNumber,
                    bankName: form.bankName,
                },
                agree: form.agree,
            };
            const result = await api.createUpgradeRequest(data);
            if (result.success) {
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Yêu cầu nâng cấp đã được gửi thành công! Vui lòng chờ admin xem xét.',
                });
                // Refetch status and switch to status mode
                setCheckingStatus(true);
                const res = await api.getUserUpgradeRequest();
                if (res && res.success && res.upgradeRequest) {
                    setMode('status');
                    setStatusData(res.upgradeRequest);
                }
            } else {
                throw new Error(result?.message || 'Lỗi gửi yêu cầu nâng cấp');
            }
        } catch (error) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title:
                    error.message || 'Có lỗi xảy ra khi gửi yêu cầu nâng cấp',
            });
        } finally {
            setSubmitting(false);
            setCheckingStatus(false);
        }
    };

    if (checkingStatus) {
        return <LoadingSpinner />;
    }

    // STATUS UI
    if (mode === 'status' && statusData) {
        const statusInfo = getStatusInfo(statusData.status);
        return (
            <div
                className={styles.organizerContainer}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '85px',
                    padding: '2rem 0',
                }}
            >
                <Card
                    className={styles.organizerCard}
                    style={{
                        maxWidth: 700,
                        width: '100%',
                        margin: '0 auto',
                        background: '#fff',
                        borderRadius: 24,
                        boxShadow: '0 8px 32px rgba(80,120,255,0.10)',
                        border: '1px solid #e5e7eb',
                        padding: '2.5rem 2rem',
                    }}
                >
                    <div className="text-center mb-4">
                        {statusData.organization?.logo && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <img
                                    src={statusData.organization.logo}
                                    alt="logo"
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        boxShadow:
                                            '0 4px 16px rgba(80,120,255,0.15)',
                                        border: '3px solid #e3f0fd',
                                        background: '#f7fafd',
                                    }}
                                />
                            </div>
                        )}
                        {statusInfo.icon}
                        <h2
                            className="mt-3 mb-2"
                            style={{
                                color: '#1976d2',
                                fontWeight: 700,
                                fontSize: 28,
                            }}
                        >
                            {statusInfo.title}
                        </h2>
                        {statusInfo.badge}
                    </div>
                    <div className="mb-4">
                        <p
                            className="text-center"
                            style={{
                                fontSize: '1.1rem',
                                color: '#222',
                                fontWeight: 500,
                            }}
                        >
                            {statusInfo.description}
                        </p>
                        {statusData.status === 'approved' && (
                            <div
                                className="alert alert-warning mt-3"
                                style={{
                                    background: 'rgba(255, 193, 7, 0.12)',
                                    border: '1px solid #ffc107',
                                    borderRadius: '0.75rem',
                                    color: '#856404',
                                    fontWeight: 500,
                                }}
                            >
                                <div className="d-flex align-items-center">
                                    <i
                                        className="fas fa-exclamation-triangle me-2"
                                        style={{ color: '#ffc107' }}
                                    ></i>
                                    <span>
                                        <strong>Lưu ý:</strong> Vui lòng đăng
                                        xuất và đăng nhập lại để được áp dụng.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Section: Thông tin tổ chức */}
                    <div className="mb-4">
                        <h5
                            style={{
                                color: '#1976d2',
                                marginBottom: 18,
                                fontWeight: 700,
                                fontSize: 20,
                                letterSpacing: 0.2,
                            }}
                        >
                            1. Thông tin tổ chức
                        </h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Tên tổ chức
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.name || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Mã số thuế
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.tax || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Website/Fanpage
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.website || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Mô tả
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.description ||
                                        '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Email
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.email || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    SĐT
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.phone || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Ngày gửi yêu cầu
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {formatDate(statusData.createdAt)}
                                </div>
                            </div>
                            {statusData.organization?.licenseUrl && (
                                <div className="col-md-6">
                                    <div
                                        style={{
                                            color: '#888',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Giấy phép hoạt động
                                    </div>
                                    <a
                                        href={
                                            statusData.organization.licenseUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: '#1976d2',
                                            textDecoration: 'underline',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <i className="fas fa-file-alt me-2"></i>
                                        Xem file
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Section: Người đại diện */}
                    {/* <div className="mb-4">
                        <h5
                            style={{
                                color: '#1976d2',
                                marginBottom: 18,
                                fontWeight: 700,
                                fontSize: 20,
                                letterSpacing: 0.2,
                            }}
                        >
                            2. Người đại diện
                        </h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Họ tên
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.repName || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Chức vụ
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.repPosition ||
                                        '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Số CMND/CCCD
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.repIdNumber ||
                                        '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Email
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.repEmail || '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Số điện thoại
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.repPhone || '-'}
                                </div>
                            </div>
                        </div>
                    </div> */}
                    {/* Section: Tài khoản ngân hàng */}
                    <div className="mb-4">
                        <h5
                            style={{
                                color: '#1976d2',
                                marginBottom: 18,
                                fontWeight: 700,
                                fontSize: 20,
                                letterSpacing: 0.2,
                            }}
                        >
                            2. Tài khoản ngân hàng
                        </h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Tên chủ tài khoản
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.accountName ||
                                        '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Số tài khoản
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.accountNumber ||
                                        '-'}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Ngân hàng
                                </div>
                                <div style={{ color: '#222', fontWeight: 600 }}>
                                    {statusData.organization?.bankName || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Section: Cam kết */}
                    <div className="mb-4">
                        <h5
                            style={{
                                color: '#1976d2',
                                marginBottom: 18,
                                fontWeight: 700,
                                fontSize: 20,
                                letterSpacing: 0.2,
                            }}
                        >
                            3. Cam kết
                        </h5>
                        <div className="row g-3">
                            <div className="col-12">
                                <div style={{ color: '#888', fontWeight: 500 }}>
                                    Đã xác nhận cam kết
                                </div>
                                <div
                                    style={{
                                        color: statusData.agree
                                            ? '#28a745'
                                            : '#dc3545',
                                        fontWeight: 700,
                                        fontSize: 18,
                                    }}
                                >
                                    {statusData.agree
                                        ? '✔️ Đã xác nhận'
                                        : '❌ Chưa xác nhận'}
                                </div>
                            </div>
                        </div>
                    </div>
                    {statusData.adminNote && (
                        <div className="mb-4">
                            <h5
                                style={{
                                    color: '#ffd700',
                                    marginBottom: '1rem',
                                }}
                            >
                                {statusData.status === 'approved'
                                    ? 'Ghi chú của admin:'
                                    : 'Lý do từ chối:'}
                            </h5>
                            <div
                                style={{
                                    background:
                                        statusData.status === 'approved'
                                            ? 'rgba(40, 167, 69, 0.2)'
                                            : 'rgba(220, 53, 69, 0.2)',
                                    border: `1px solid ${
                                        statusData.status === 'approved'
                                            ? '#28a745'
                                            : '#dc3545'
                                    }`,
                                    borderRadius: '0.75rem',
                                    padding: '1.5rem',
                                }}
                            >
                                <p className="text-white mb-0">
                                    {statusData.adminNote}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="d-flex justify-content-center gap-3">
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
    }

    // FORM UI
    return (
        <>
            {rejectedNote && (
                <Alert
                    variant="warning"
                    style={{
                        maxWidth: 600,
                        margin: '85px auto 0 auto',
                        fontSize: '1.08rem',
                        fontWeight: 500,
                        letterSpacing: 0.1,
                    }}
                >
                    <div style={{ color: '#b8860b', marginBottom: 4 }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>Yêu
                        cầu nâng cấp trước đã bị từ chối
                    </div>
                    <div>{rejectedNote}</div>
                </Alert>
            )}
            <form
                className={styles.form}
                onSubmit={handleSubmit}
                encType="multipart/form-data"
            >
                <h2
                    className={`${styles.formTitle} text-center mb-4`}
                    style={{
                        fontWeight: 700,
                        fontSize: '2rem',
                        letterSpacing: 0.5,
                    }}
                >
                    Đăng ký trở thành Ban tổ chức sự kiện
                </h2>
                {/* 1. Thông tin tổ chức */}
                <div className="card-dark mb-4 p-4">
                    <h4
                        className="mb-3"
                        style={{ color: '#2c44a7', fontWeight: 700 }}
                    >
                        1. Thông tin tổ chức{' '}
                        <span
                            style={{
                                color: '#f39c12',
                                fontWeight: 400,
                                fontSize: '1rem',
                            }}
                        >
                            (bắt buộc)
                        </span>
                    </h4>
                    <div className="row">
                        <div className="col-md-3 mt-1 mb-3 mb-md-0 d-flex flex-column align-items-center">
                            <UploadImage
                                id="uploadLogo"
                                iconClass="fas fa-upload fa-2x text-success"
                                defaultText="Tải lên logo tổ chức"
                                inputName="orgLogo"
                                defaultPreview={logoPreview}
                                onFileSelect={handleLogoSelect}
                            />
                            <div
                                style={{
                                    color: '#fff',
                                    fontWeight: 600,
                                    marginTop: 8,
                                }}
                            >
                                Logo tổ chức
                            </div>
                        </div>
                        <div className="col-md-9">
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="orgName"
                                >
                                    Tên tổ chức
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="orgName"
                                    name="orgName"
                                    placeholder="Ví dụ: Công ty TNHH Sự kiện ABC"
                                    maxLength={100}
                                    value={form.orgName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label`}
                                    htmlFor="orgTax"
                                >
                                    Mã số thuế (nếu có)
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="orgTax"
                                    name="orgTax"
                                    placeholder="Nhập mã số thuế doanh nghiệp (nếu có)"
                                    value={form.orgTax}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label`}
                                    htmlFor="orgWebsite"
                                >
                                    Website / fanpage / kênh mạng xã hội
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="orgWebsite"
                                    name="orgWebsite"
                                    placeholder="Nhập website, fanpage hoặc kênh mạng xã hội"
                                    value={form.orgWebsite}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="orgDescription"
                                >
                                    Mô tả
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="orgDescription"
                                    name="orgDescription"
                                    placeholder="Nhập mô tả về tổ chức"
                                    value={form.orgDescription}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="orgEmail"
                                >
                                    Email
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="orgEmail"
                                    name="orgEmail"
                                    placeholder="Nhập email"
                                    value={form.orgEmail}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="orgPhone"
                                >
                                    SĐT
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="orgPhone"
                                    name="orgPhone"
                                    placeholder="Nhập số điện thoại"
                                    value={form.orgPhone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label`}
                                    htmlFor="licenseFile"
                                >
                                    Giấy phép hoạt động / Kinh doanh (nếu có)
                                </label>
                                <UploadImage
                                    id="uploadLicense"
                                    iconClass="fas fa-upload fa-2x text-success"
                                    defaultText="Tải lên giấy phép hoạt động/kinh doanh"
                                    inputName="licenseFile"
                                    defaultPreview={licensePreview}
                                    onFileSelect={handleLicenseSelect}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {/* 2. Thông tin người đại diện */}
                {/* <div className="card-dark mb-4 p-4">
                    <h4
                        className="mb-3"
                        style={{ color: '#2c44a7', fontWeight: 700 }}
                    >
                        2. Thông tin người đại diện{' '}
                        <span
                            style={{
                                color: '#f39c12',
                                fontWeight: 400,
                                fontSize: '1rem',
                            }}
                        >
                            (bắt buộc)
                        </span>
                    </h4>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="repName"
                                >
                                    Họ tên người đại diện
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="repName"
                                    name="repName"
                                    placeholder="Người phụ trách tài khoản"
                                    value={form.repName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="repPosition"
                                >
                                    Chức vụ
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="repPosition"
                                    name="repPosition"
                                    placeholder="Giám đốc / Trưởng bộ phận..."
                                    value={form.repPosition}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="repId"
                                >
                                    Số CMND/CCCD
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="repId"
                                    name="repId"
                                    placeholder="Số CMND/CCCD người đại diện"
                                    value={form.repId}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">
                                <label
                                    className={`${styles.formTitle} form-label form-item-required`}
                                    htmlFor="repPhone"
                                >
                                    Số điện thoại người đại diện
                                </label>
                                <input
                                    className="form-control text-dark"
                                    type="text"
                                    id="repPhone"
                                    name="repPhone"
                                    placeholder="Số điện thoại người đại diện"
                                    value={form.repPhone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="form-check mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="agree"
                            name="agree"
                            checked={form.agree}
                            onChange={handleChange}
                            required
                        />
                        <label className="form-check-label" htmlFor="agree">
                            Tôi cam kết là người đại diện hợp pháp của tổ chức
                            và chịu trách nhiệm về thông tin cung cấp. Tôi đồng
                            ý với{' '}
                            <a
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                điều khoản sử dụng
                            </a>
                            .
                        </label>
                    </div>
                </div> */}
                {/* 3. Tài khoản ngân hàng nhận tiền */}
                <div className="card-dark mb-4 p-4">
                    <h4
                        className="mb-3"
                        style={{ color: '#2c44a7', fontWeight: 700 }}
                    >
                        2. Tài khoản ngân hàng nhận tiền
                    </h4>
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <label
                                className={`${styles.formTitle} form-label form-item-required`}
                                htmlFor="bankAccountName"
                            >
                                Tên tài khoản ngân hàng
                            </label>
                            <input
                                className="form-control text-dark"
                                type="text"
                                id="bankAccountName"
                                name="accountName"
                                placeholder="Tên tài khoản (tổ chức hoặc cá nhân)"
                                value={form.accountName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label
                                className={`${styles.formTitle} form-label form-item-required`}
                                htmlFor="bankAccountNumber"
                            >
                                Số tài khoản
                            </label>
                            <input
                                className="form-control text-dark"
                                type="text"
                                id="bankAccountNumber"
                                name="accountNumber"
                                placeholder="Số tài khoản ngân hàng"
                                value={form.accountNumber}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="col-md-4 mb-3">
                            <label
                                className={`${styles.formTitle} form-label form-item-required`}
                                htmlFor="bankName"
                            >
                                Ngân hàng
                            </label>
                            <select
                                className="form-select"
                                id="bankName"
                                name="bankName"
                                value={form.bankName}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn ngân hàng</option>
                                {bankList.map((bank) => (
                                    <option key={bank} value={bank}>
                                        {bank}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-check mt-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="agree"
                            name="agree"
                            checked={form.agree}
                            onChange={handleChange}
                            required
                        />
                        <label className="form-check-label" htmlFor="agree">
                            Tôi cam kết là người đại diện hợp pháp của tổ chức
                            và chịu trách nhiệm về thông tin cung cấp. Tôi đồng
                            ý với{' '}
                            <a
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                điều khoản sử dụng
                            </a>
                            .
                        </label>
                    </div>
                </div>

                <div className="d-flex justify-content-end">
                    <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 fw-bold"
                        disabled={submitting}
                    >
                        {submitting ? 'Đang gửi...' : 'Gửi'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary ms-3 px-4 py-2 fw-bold"
                        onClick={() => navigate('/')}
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </form>
        </>
    );
};

export default UpgradeRequestPage;
