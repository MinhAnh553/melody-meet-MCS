import React, { useState, useEffect } from 'react';
import styles from './UpgradeRequestPage.module.css';
import UploadImage from '../../components/UploadImage';
import swalCustomize from '../../../util/swalCustomize';
import { useNavigate } from 'react-router-dom';
import api from '../../../util/api';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import {
    Alert,
    Card,
    Badge,
    Button,
    Container,
    Row,
    Col,
} from 'react-bootstrap';
import {
    BsHouseDoor,
    BsClock,
    BsCheckCircle,
    BsXCircle,
    BsBuilding,
    BsBank,
    BsShield,
    BsChevronRight,
} from 'react-icons/bs';

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
                    <Badge bg="warning" className={styles.statusBadge}>
                        <BsClock className="me-1" />
                        Chờ xử lý
                    </Badge>
                ),
                icon: <BsClock className={styles.statusIconPending} />,
                title: 'Yêu cầu đang được xem xét',
                description:
                    'Yêu cầu nâng cấp của bạn đã được gửi thành công và đang chờ xem xét. Vui lòng kiên nhẫn chờ đợi.',
                color: '#ffc107',
            };
        case 'approved':
            return {
                badge: (
                    <Badge bg="success" className={styles.statusBadge}>
                        <BsCheckCircle className="me-1" />
                        Đã duyệt
                    </Badge>
                ),
                icon: <BsCheckCircle className={styles.statusIconSuccess} />,
                title: 'Chúc mừng! Yêu cầu đã được duyệt',
                description:
                    'Tài khoản của bạn đã được nâng cấp thành người tổ chức sự kiện. Bây giờ bạn có thể tạo và quản lý sự kiện.',
                color: '#28a745',
            };
        case 'rejected':
            return {
                badge: (
                    <Badge bg="danger" className={styles.statusBadge}>
                        <BsXCircle className="me-1" />
                        Đã từ chối
                    </Badge>
                ),
                icon: <BsXCircle className={styles.statusIconDanger} />,
                title: 'Yêu cầu bị từ chối',
                description:
                    'Yêu cầu nâng cấp của bạn đã bị từ chối. Vui lòng xem lý do bên dưới và thử lại.',
                color: '#dc3545',
            };
        default:
            return {
                badge: (
                    <Badge bg="secondary" className={styles.statusBadge}>
                        Không xác định
                    </Badge>
                ),
                icon: <BsClock className={styles.statusIconSecondary} />,
                title: 'Trạng thái không xác định',
                description: 'Không thể xác định trạng thái yêu cầu nâng cấp.',
                color: '#6c757d',
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

    // STATUS UI
    if (mode === 'status' && statusData) {
        const statusInfo = getStatusInfo(statusData.status);
        return (
            <div className={styles.container}>
                <Container>
                    {/* Breadcrumb */}
                    <div className={styles.breadcrumbSection}>
                        <nav aria-label="breadcrumb">
                            <ol className={styles.breadcrumb}>
                                <li className={styles.breadcrumbItem}>
                                    <a
                                        href="/"
                                        className={styles.breadcrumbLink}
                                    >
                                        <BsHouseDoor className="me-1" />
                                        Trang chủ
                                    </a>
                                </li>
                                <li className={styles.breadcrumbSeparator}>
                                    <BsChevronRight />
                                </li>
                                <li className={styles.breadcrumbActive}>
                                    Yêu cầu nâng cấp
                                </li>
                            </ol>
                        </nav>
                    </div>

                    {/* Status Card */}
                    <div className={styles.statusContainer}>
                        <Card className={styles.statusCard}>
                            <Card.Body className="p-5">
                                {/* Status Header */}
                                <div className={styles.statusHeader}>
                                    {statusData.organization?.logo && (
                                        <div className={styles.logoContainer}>
                                            <img
                                                src={
                                                    statusData.organization.logo
                                                }
                                                alt="Organization Logo"
                                                className={
                                                    styles.organizationLogo
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className={styles.statusIcon}>
                                        {statusInfo.icon}
                                    </div>
                                    <h1 className={styles.statusTitle}>
                                        {statusInfo.title}
                                    </h1>
                                    <div
                                        className={styles.statusBadgeContainer}
                                    >
                                        {statusInfo.badge}
                                    </div>
                                    <p className={styles.statusDescription}>
                                        {statusInfo.description}
                                    </p>

                                    {statusData.status === 'approved' && (
                                        <Alert
                                            variant="info"
                                            className={styles.loginAlert}
                                        >
                                            <Alert.Heading className="h6 mb-2">
                                                <BsShield className="me-2" />
                                                Lưu ý quan trọng
                                            </Alert.Heading>
                                            Vui lòng đăng xuất và đăng nhập lại
                                            để cập nhật quyền tài khoản mới.
                                        </Alert>
                                    )}
                                </div>

                                {/* Organization Info */}
                                <div className={styles.infoSection}>
                                    <div className={styles.sectionHeader}>
                                        <BsBuilding
                                            className={styles.sectionIcon}
                                        />
                                        <h3 className={styles.sectionTitle}>
                                            Thông tin tổ chức
                                        </h3>
                                    </div>
                                    <Row className="g-4">
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Tên tổ chức
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.name || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Mã số thuế
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.tax || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Website/Fanpage
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.website ? (
                                                        <a
                                                            href={
                                                                statusData
                                                                    .organization
                                                                    .website
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={
                                                                styles.infoLink
                                                            }
                                                        >
                                                            {
                                                                statusData
                                                                    .organization
                                                                    .website
                                                            }
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Email
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.email || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Số điện thoại
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.phone || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Ngày gửi yêu cầu
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {formatDate(
                                                        statusData.createdAt,
                                                    )}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={12}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Mô tả tổ chức
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.description || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        {statusData.organization
                                            ?.licenseUrl && (
                                            <Col md={12}>
                                                <div
                                                    className={styles.infoItem}
                                                >
                                                    <div
                                                        className={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Giấy phép hoạt động
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        <a
                                                            href={
                                                                statusData
                                                                    .organization
                                                                    .licenseUrl
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={
                                                                styles.fileLink
                                                            }
                                                        >
                                                            <i className="bi bi-file-earmark-text me-2"></i>
                                                            Xem tài liệu
                                                        </a>
                                                    </div>
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                </div>

                                {/* Bank Info */}
                                <div className={styles.infoSection}>
                                    <div className={styles.sectionHeader}>
                                        <BsBank
                                            className={styles.sectionIcon}
                                        />
                                        <h3 className={styles.sectionTitle}>
                                            Thông tin ngân hàng
                                        </h3>
                                    </div>
                                    <Row className="g-4">
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Tên chủ tài khoản
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.accountName || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Số tài khoản
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.accountNumber || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className={styles.infoItem}>
                                                <div
                                                    className={styles.infoLabel}
                                                >
                                                    Ngân hàng
                                                </div>
                                                <div
                                                    className={styles.infoValue}
                                                >
                                                    {statusData.organization
                                                        ?.bankName || '-'}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Admin Note */}
                                {statusData.adminNote && (
                                    <div className={styles.infoSection}>
                                        <div className={styles.sectionHeader}>
                                            <i
                                                className="bi bi-chat-left-text"
                                                style={{
                                                    color: statusInfo.color,
                                                }}
                                            ></i>
                                            <h3 className={styles.sectionTitle}>
                                                {statusData.status ===
                                                'approved'
                                                    ? 'Ghi chú từ admin'
                                                    : 'Lý do từ chối'}
                                            </h3>
                                        </div>
                                        <Alert
                                            variant={
                                                statusData.status === 'approved'
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                            className={styles.adminNote}
                                        >
                                            <div
                                                className={
                                                    styles.adminNoteContent
                                                }
                                            >
                                                {statusData.adminNote}
                                            </div>
                                        </Alert>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className={styles.statusActions}>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={() => navigate('/')}
                                        className={styles.homeButton}
                                    >
                                        <BsHouseDoor className="me-2" />
                                        Về trang chủ
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </Container>
            </div>
        );
    }

    // FORM UI
    return (
        <div className={styles.container}>
            <Container>
                {/* Breadcrumb */}
                <div className={styles.breadcrumbSection}>
                    <nav aria-label="breadcrumb">
                        <ol className={styles.breadcrumb}>
                            <li className={styles.breadcrumbItem}>
                                <a href="/" className={styles.breadcrumbLink}>
                                    <BsHouseDoor className="me-1" />
                                    Trang chủ
                                </a>
                            </li>
                            <li className={styles.breadcrumbSeparator}>
                                <BsChevronRight />
                            </li>
                            <li className={styles.breadcrumbActive}>
                                Đăng ký ban tổ chức
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* Rejected Alert */}
                {rejectedNote && (
                    <Alert variant="warning" className={styles.rejectedAlert}>
                        <Alert.Heading className="h6 mb-2">
                            <BsXCircle className="me-2" />
                            Yêu cầu trước đã bị từ chối
                        </Alert.Heading>
                        {rejectedNote}
                    </Alert>
                )}

                {/* Main Form */}
                <Card className={styles.formCard}>
                    <Card.Body className="p-5">
                        {/* Form Header */}
                        <div className={styles.formHeader}>
                            <h1 className={styles.formTitle}>
                                Đăng ký trở thành Ban tổ chức sự kiện
                            </h1>
                            <p className={styles.formSubtitle}>
                                Vui lòng điền đầy đủ thông tin bên dưới để đăng
                                ký trở thành ban tổ chức sự kiện
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Organization Info Section */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionHeader}>
                                    <BsBuilding
                                        className={styles.sectionIcon}
                                    />
                                    <h3 className={styles.sectionTitle}>
                                        1. Thông tin tổ chức
                                        <span className={styles.required}>
                                            *
                                        </span>
                                    </h3>
                                </div>

                                <Row className="g-4">
                                    <Col lg={3} className="text-center">
                                        <div
                                            className={styles.logoUploadSection}
                                        >
                                            <UploadImage
                                                id="uploadLogo"
                                                iconClass="bi bi-upload fs-1 text-primary"
                                                defaultText="Tải lên logo tổ chức"
                                                inputName="orgLogo"
                                                defaultPreview={logoPreview}
                                                onFileSelect={handleLogoSelect}
                                                className={styles.logoUpload}
                                            />
                                            <div className={styles.logoLabel}>
                                                Logo tổ chức{' '}
                                                <span
                                                    className={styles.required}
                                                >
                                                    *
                                                </span>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col lg={9}>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Tên tổ chức{' '}
                                                        <span
                                                            className={
                                                                styles.required
                                                            }
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={
                                                            styles.formControl
                                                        }
                                                        name="orgName"
                                                        placeholder="Ví dụ: Công ty TNHH Sự kiện ABC"
                                                        value={form.orgName}
                                                        onChange={handleChange}
                                                        maxLength={100}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Mã số thuế
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={
                                                            styles.formControl
                                                        }
                                                        name="orgTax"
                                                        placeholder="Nhập mã số thuế (nếu có)"
                                                        value={form.orgTax}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Email tổ chức{' '}
                                                        <span
                                                            className={
                                                                styles.required
                                                            }
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className={
                                                            styles.formControl
                                                        }
                                                        name="orgEmail"
                                                        placeholder="contact@company.com"
                                                        value={form.orgEmail}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Số điện thoại{' '}
                                                        <span
                                                            className={
                                                                styles.required
                                                            }
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className={
                                                            styles.formControl
                                                        }
                                                        name="orgPhone"
                                                        placeholder="0123 456 789"
                                                        value={form.orgPhone}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Website / Fanpage / Mạng
                                                        xã hội
                                                    </label>
                                                    <input
                                                        type="url"
                                                        className={
                                                            styles.formControl
                                                        }
                                                        name="orgWebsite"
                                                        placeholder="https://www.company.com"
                                                        value={form.orgWebsite}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Mô tả tổ chức{' '}
                                                        <span
                                                            className={
                                                                styles.required
                                                            }
                                                        >
                                                            *
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        className={
                                                            styles.formControl
                                                        }
                                                        name="orgDescription"
                                                        rows="4"
                                                        placeholder="Mô tả chi tiết về tổ chức, lĩnh vực hoạt động..."
                                                        value={
                                                            form.orgDescription
                                                        }
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={12}>
                                                <div
                                                    className={styles.formGroup}
                                                >
                                                    <label
                                                        className={
                                                            styles.formLabel
                                                        }
                                                    >
                                                        Giấy phép hoạt động /
                                                        Kinh doanh
                                                    </label>
                                                    <UploadImage
                                                        id="uploadLicense"
                                                        iconClass="bi bi-file-earmark-arrow-up fs-3 text-primary"
                                                        defaultText="Tải lên giấy phép hoạt động (nếu có)"
                                                        inputName="licenseFile"
                                                        defaultPreview={
                                                            licensePreview
                                                        }
                                                        onFileSelect={
                                                            handleLicenseSelect
                                                        }
                                                        className={
                                                            styles.fileUpload
                                                        }
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </div>

                            {/* Bank Info Section */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionHeader}>
                                    <BsBank className={styles.sectionIcon} />
                                    <h3 className={styles.sectionTitle}>
                                        2. Thông tin ngân hàng
                                        <span className={styles.required}>
                                            *
                                        </span>
                                    </h3>
                                </div>

                                <Row className="g-3">
                                    <Col md={4}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>
                                                Tên chủ tài khoản{' '}
                                                <span
                                                    className={styles.required}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className={styles.formControl}
                                                name="accountName"
                                                placeholder="Tên chủ tài khoản ngân hàng"
                                                value={form.accountName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>
                                                Số tài khoản{' '}
                                                <span
                                                    className={styles.required}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                className={styles.formControl}
                                                name="accountNumber"
                                                placeholder="Số tài khoản ngân hàng"
                                                value={form.accountNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>
                                                Ngân hàng{' '}
                                                <span
                                                    className={styles.required}
                                                >
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                className={styles.formControl}
                                                name="bankName"
                                                value={form.bankName}
                                                onChange={handleChange}
                                            >
                                                <option value="">
                                                    Chọn ngân hàng
                                                </option>
                                                {bankList.map((bank) => (
                                                    <option
                                                        key={bank}
                                                        value={bank}
                                                    >
                                                        {bank}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            {/* Agreement Section */}
                            <div className={styles.formSection}>
                                <div className={styles.sectionHeader}>
                                    <BsShield className={styles.sectionIcon} />
                                    <h3 className={styles.sectionTitle}>
                                        3. Cam kết
                                    </h3>
                                </div>

                                <div className={styles.agreementSection}>
                                    <div className={styles.agreementBox}>
                                        <div
                                            className={styles.agreementContent}
                                        >
                                            <h5
                                                className={
                                                    styles.agreementTitle
                                                }
                                            >
                                                Điều khoản và cam kết
                                            </h5>
                                            <ul
                                                className={styles.agreementList}
                                            >
                                                <li>
                                                    Tôi cam kết là người đại
                                                    diện hợp pháp của tổ chức
                                                </li>
                                                <li>
                                                    Tôi chịu trách nhiệm về tính
                                                    chính xác của thông tin cung
                                                    cấp
                                                </li>
                                                <li>
                                                    Tôi đồng ý tuân thủ các quy
                                                    định và chính sách của nền
                                                    tảng
                                                </li>
                                                <li>
                                                    Tôi hiểu rằng việc cung cấp
                                                    thông tin sai lệch có thể
                                                    dẫn đến việc từ chối yêu cầu
                                                </li>
                                            </ul>
                                        </div>
                                        <div className={styles.checkboxGroup}>
                                            <input
                                                type="checkbox"
                                                id="agree"
                                                name="agree"
                                                checked={form.agree}
                                                onChange={handleChange}
                                                className={styles.checkbox}
                                            />
                                            <label
                                                htmlFor="agree"
                                                className={styles.checkboxLabel}
                                            >
                                                Tôi đã đọc và đồng ý với{' '}
                                                <a
                                                    href="/terms"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.termsLink}
                                                >
                                                    điều khoản sử dụng
                                                </a>{' '}
                                                và các cam kết trên{' '}
                                                <span
                                                    className={styles.required}
                                                >
                                                    *
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className={styles.formActions}>
                                <Button
                                    variant="outline-secondary"
                                    size="lg"
                                    onClick={() => navigate('/')}
                                    className={styles.cancelButton}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={submitting}
                                    className={styles.submitButton}
                                >
                                    {submitting ? (
                                        <>
                                            <div
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></div>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            Gửi yêu cầu
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default UpgradeRequestPage;
