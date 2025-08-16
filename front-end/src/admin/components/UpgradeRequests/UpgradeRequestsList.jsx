import React, { useState, useEffect } from 'react';
import {
    Button,
    Form,
    InputGroup,
    Pagination,
    Modal,
    Card,
    Row,
    Col,
    Dropdown,
} from 'react-bootstrap';
import { Table, Space, Tag, Tooltip, Empty, Image } from 'antd';
import {
    CheckOutlined,
    CloseOutlined,
    SettingOutlined,
    UserOutlined,
    CalendarOutlined,
    MailOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import {
    FaSearch,
    FaFilter,
    FaTimes,
    FaChartBar,
    FaCog,
    FaUserTie,
    FaAngleLeft,
    FaAngleRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
} from 'react-icons/fa';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

import styles from './UpgradeRequests.module.css';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import LoadingSpinner from '../../../client/components/loading/LoadingSpinner';
import orderStyles from '../Orders/Orders.module.css';

const UpgradeRequestsList = () => {
    const [upgradeRequests, setUpgradeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [action, setAction] = useState(''); // 'approve' or 'reject'
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    // Modal xác nhận duyệt/từ chối (inline trong modal chi tiết)
    const [showInlineConfirm, setShowInlineConfirm] = useState(false);
    const [inlineAction, setInlineAction] = useState(''); // 'approve' or 'reject'

    // Ref cho vùng xác nhận
    const inlineConfirmRef = React.useRef(null);

    React.useEffect(() => {
        if (showInlineConfirm && inlineConfirmRef.current) {
            inlineConfirmRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [showInlineConfirm]);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchUpgradeRequests();
    }, [currentPage, statusFilter, searchTerm, sortBy, sortOrder]);

    const fetchUpgradeRequests = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchTerm || undefined,
                sortBy,
                sortOrder,
            };
            const res = await api.getUpgradeRequests(params);
            if (res && res.success) {
                setUpgradeRequests(res.upgradeRequests);
                setTotalPages(res.totalPages);
                setTotalRequests(res.totalRequests);
            }
        } catch (error) {
            console.error('Error fetching upgrade requests:', error);
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Có lỗi xảy ra khi tải danh sách yêu cầu nâng cấp',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAction = (request, actionType) => {
        setSelectedRequest(request);
        setAction(actionType);
        setAdminNote('');
        setShowModal(true);
        setShowInlineConfirm(false);
        setInlineAction('');
    };

    const handleInlineConfirm = async () => {
        if (!selectedRequest) return;
        if (inlineAction === 'reject' && !adminNote.trim()) {
            swalCustomize.Toast.fire({
                icon: 'warning',
                title: 'Vui lòng nhập lý do từ chối!',
            });
            return;
        }
        setProcessing(true);
        try {
            let res;
            if (inlineAction === 'approve') {
                res = await api.approveUpgradeRequest(selectedRequest._id);
            } else {
                res = await api.rejectUpgradeRequest(
                    selectedRequest._id,
                    adminNote,
                );
            }
            if (res && res.success) {
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title:
                        inlineAction === 'approve'
                            ? 'Đã duyệt yêu cầu nâng cấp'
                            : 'Đã từ chối yêu cầu nâng cấp',
                });
                setShowModal(false);
                setShowInlineConfirm(false);
                setInlineAction('');
                fetchUpgradeRequests();
            } else {
                throw new Error(res?.message || 'Lỗi xử lý yêu cầu');
            }
        } catch (error) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu',
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <Tag color="processing" icon={<ClockCircleOutlined />}>
                        Chờ xử lý
                    </Tag>
                );
            case 'approved':
                return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đã duyệt
                    </Tag>
                );
            case 'rejected':
                return (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                        Đã từ chối
                    </Tag>
                );
            default:
                return <Tag>Không xác định</Tag>;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getSortIcon = (field) => {
        const isActive = sortBy === field;
        const isAsc = sortOrder === 'asc';
        const activeColor = '#1890ff';
        const defaultColor = '#bfbfbf';

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            >
                <CaretUpOutlined
                    style={{
                        color: isActive && isAsc ? activeColor : defaultColor,
                        fontSize: '10px',
                        marginBottom: '-2px',
                    }}
                />
                <CaretDownOutlined
                    style={{
                        color: isActive && !isAsc ? activeColor : defaultColor,
                        fontSize: '10px',
                        marginTop: '-2px',
                    }}
                />
            </div>
        );
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength
            ? `${text.substring(0, maxLength)}...`
            : text;
    };

    // Ant Design Table columns configuration
    const columns = [
        {
            title: (
                <Space>
                    <MailOutlined />
                    Email
                </Space>
            ),
            dataIndex: 'userId',
            key: 'email',
            render: (userId) => (
                <Space>
                    <MailOutlined />
                    {truncateText(userId?.email || '', 25)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <CalendarOutlined />
                    Ngày yêu cầu
                    <span onClick={() => handleSortChange('createdAt')}>
                        {getSortIcon('createdAt')}
                    </span>
                </Space>
            ),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt) => (
                <Space>
                    <CalendarOutlined />
                    {formatDate(createdAt)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <CheckCircleOutlined />
                    Trạng thái
                </Space>
            ),
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
        },
        {
            title: (
                <Space>
                    <SettingOutlined />
                    Thao tác
                </Space>
            ),
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <span
                            onClick={() => {
                                setSelectedRequest(record);
                                setShowModal(true);
                            }}
                            style={{ color: '#1890ff', cursor: 'pointer' }}
                        >
                            <EyeOutlined />
                        </span>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.upgradeRequestsContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className={styles.titleSection}>
                                <div className={styles.titleIcon}>
                                    <FaUserTie />
                                </div>
                                <div>
                                    <h2 className={styles.pageTitle}>
                                        <FaCog
                                            className={styles.titleIconSmall}
                                        />
                                        Quản lý yêu cầu nâng cấp
                                    </h2>
                                    <p className={styles.pageSubtitle}>
                                        <FaChartBar
                                            className={styles.subtitleIcon}
                                        />
                                        Tổng số yêu cầu: {totalRequests}
                                    </p>
                                </div>
                            </div>
                        </Col>
                        <Col md={6}>
                            <div className={styles.searchFilter}>
                                <InputGroup className={styles.searchInput}>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Tìm kiếm yêu cầu..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </InputGroup>

                                <Dropdown>
                                    <Dropdown.Toggle
                                        variant="outline-secondary"
                                        id="status-filter"
                                        className={styles.filterDropdown}
                                    >
                                        <FaFilter className="me-2" />
                                        {statusFilter === 'all'
                                            ? 'Tất cả trạng thái'
                                            : statusFilter === 'pending'
                                            ? 'Chờ xử lý'
                                            : statusFilter === 'approved'
                                            ? 'Đã duyệt'
                                            : 'Đã từ chối'}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('all');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Tất cả trạng thái
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('pending');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Chờ xử lý
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('approved');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã duyệt
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('rejected');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã từ chối
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Upgrade Requests Table */}
            <Card className={styles.tableCard}>
                <Card.Body>
                    <div className={styles.tableWrapper}>
                        <Table
                            columns={columns}
                            dataSource={loading ? [] : upgradeRequests}
                            rowKey="_id"
                            pagination={false}
                            loading={loading}
                            size="middle"
                            className={styles.antTable}
                            rowClassName={(record, index) =>
                                index % 2 === 0 ? styles.evenRow : styles.oddRow
                            }
                            locale={{
                                emptyText: loading ? (
                                    <div style={{ padding: '40px 0' }}>
                                        {/* <LoadingSpinner /> */}
                                    </div>
                                ) : (
                                    <Empty
                                        image={<BsXCircle size={60} />}
                                        description={
                                            <div>
                                                <h4>
                                                    Không có yêu cầu nâng cấp
                                                </h4>
                                                <p>
                                                    Không tìm thấy yêu cầu nâng
                                                    cấp nào phù hợp với bộ lọc
                                                    hiện tại
                                                </p>
                                            </div>
                                        }
                                    />
                                ),
                            }}
                        />
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.paginationContainer}>
                            <Pagination>
                                <Pagination.First
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    <FaAngleDoubleLeft />
                                </Pagination.First>
                                <Pagination.Prev
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                >
                                    <FaAngleLeft />
                                </Pagination.Prev>

                                {[...Array(totalPages)].map((_, index) => (
                                    <Pagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() =>
                                            handlePageChange(index + 1)
                                        }
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    <FaAngleRight />
                                </Pagination.Next>
                                <Pagination.Last
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    <FaAngleDoubleRight />
                                </Pagination.Last>
                            </Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal Xem chi tiết organizer */}
            <Modal
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                }}
                size="xl"
                centered
                className={styles.upgradeRequestModal}
                contentClassName={styles.modalContent}
                dialogClassName="modal-lg"
            >
                {selectedRequest && (
                    <>
                        {/* Header */}
                        <div
                            className={orderStyles.orderDetailsGridHeader}
                            style={{
                                background: '#fff',
                                borderBottom: '1px solid #e5e7eb',
                                borderTopLeftRadius: 16,
                                borderTopRightRadius: 16,
                                padding: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                {getStatusTag(selectedRequest.status)}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {/* <div
                                    className={
                                        orderStyles.orderDetailsOrderCodeLink
                                    }
                                    style={{ fontSize: 17 }}
                                >
                                    Mã yêu cầu: <b>{selectedRequest._id}</b>
                                </div> */}
                                <div
                                    className={
                                        orderStyles.orderDetailsOrderDate
                                    }
                                    style={{ fontSize: 15 }}
                                >
                                    {formatDate(selectedRequest.createdAt)}
                                </div>
                            </div>
                        </div>
                        <Modal.Body
                            className={orderStyles.orderDetailsContenta}
                            style={{
                                background: '#fff',
                                borderBottomLeftRadius: 16,
                                borderBottomRightRadius: 16,
                                padding: 32,
                            }}
                        >
                            {/* Organization Section */}
                            <div
                                className={orderStyles.orderDetailsBox}
                                style={{ marginBottom: 24 }}
                            >
                                <div
                                    className={orderStyles.orderDetailsBoxTitle}
                                    style={{
                                        color: '#1976d2',
                                        fontSize: '1.15rem',
                                    }}
                                >
                                    TỔ CHỨC
                                </div>
                                <div
                                    className={
                                        orderStyles.orderDetailsBoxContent
                                    }
                                >
                                    {selectedRequest.organization?.logo && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                marginBottom: 16,
                                            }}
                                        >
                                            <Image
                                                src={
                                                    selectedRequest.organization
                                                        .logo
                                                }
                                                alt="logo"
                                                width={100}
                                                height={100}
                                                style={{
                                                    objectFit: 'cover',
                                                    borderRadius: '50%',
                                                    background: '#fff',
                                                    boxShadow:
                                                        '0 4px 16px rgba(80,120,255,0.10)',
                                                    border: '1px solid black',
                                                    cursor: 'pointer',
                                                }}
                                                preview={false}
                                                onClick={() =>
                                                    window.open(
                                                        selectedRequest
                                                            .organization.logo,
                                                        '_blank',
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                                    <div
                                        className={
                                            orderStyles.orderDetailsInfoGrid
                                        }
                                        style={{ marginTop: 8 }}
                                    >
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Tên tổ chức:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.name || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Mã số thuế:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.tax || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Website/Fanpage:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.website || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                            style={{ alignItems: 'flex-start' }}
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{
                                                    fontSize: '1.05rem',
                                                    marginTop: 4,
                                                }}
                                            >
                                                Mô tả:
                                            </span>
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 400,
                                                    marginLeft: 8,
                                                    background: '#f8f9fa',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: 8,
                                                    padding: '8px 12px',
                                                    maxHeight: 120,
                                                    overflowY: 'auto',
                                                    display: 'block',
                                                    minWidth: 200,
                                                    whiteSpace: 'pre-line',
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.description || '-'}
                                            </span>
                                        </div>
                                        {/* {selectedRequest.organization
                                            ?.licenseUrl && (
                                            <div
                                                className={
                                                    orderStyles.orderDetailsInfoItem
                                                }
                                                style={{ gridColumn: '1/-1' }}
                                            >
                                                <span
                                                    className={
                                                        orderStyles.orderDetailsInfoLabel
                                                    }
                                                    style={{
                                                        fontSize: '1.05rem',
                                                    }}
                                                >
                                                    Giấy phép hoạt động:
                                                </span>{' '}
                                                {selectedRequest.organization.licenseUrl.match(
                                                    /\.(jpg|jpeg|png|webp)$/i,
                                                ) ? (
                                                    <Image
                                                        src={
                                                            selectedRequest
                                                                .organization
                                                                .licenseUrl
                                                        }
                                                        alt="license"
                                                        width={100}
                                                        height={100}
                                                        style={{
                                                            objectFit: 'cover',
                                                            borderRadius: 12,
                                                            background: '#fff',
                                                            boxShadow:
                                                                '0 4px 16px rgba(80,120,255,0.10)',
                                                            border: '1px solid black',
                                                            cursor: 'pointer',
                                                        }}
                                                        preview={false}
                                                        onClick={() =>
                                                            window.open(
                                                                selectedRequest
                                                                    .organization
                                                                    .licenseUrl,
                                                                '_blank',
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <a
                                                        href={
                                                            selectedRequest
                                                                .organization
                                                                .licenseUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#1976d2',
                                                            textDecoration:
                                                                'underline',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        <i className="fas fa-file-alt me-2"></i>
                                                        Xem file
                                                    </a>
                                                )}
                                            </div>
                                        )} */}
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Email:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.email || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Số điện thoại:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.phone || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Bank Section */}
                            <div
                                className={orderStyles.orderDetailsBox}
                                style={{ marginBottom: 24 }}
                            >
                                <div
                                    className={orderStyles.orderDetailsBoxTitle}
                                    style={{
                                        color: '#1976d2',
                                        fontSize: '1.15rem',
                                    }}
                                >
                                    TÀI KHOẢN NGÂN HÀNG
                                </div>
                                <div
                                    className={
                                        orderStyles.orderDetailsBoxContent
                                    }
                                >
                                    <div
                                        className={
                                            orderStyles.orderDetailsInfoGrid
                                        }
                                    >
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Tên chủ tài khoản:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.accountName || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Số tài khoản:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.accountNumber || '-'}
                                            </span>
                                        </div>
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Ngân hàng:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.organization
                                                    ?.bankName || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Commitment Section */}
                            {/* <div
                                className={orderStyles.orderDetailsBox}
                                style={{ marginBottom: 24 }}
                            >
                                <div
                                    className={orderStyles.orderDetailsBoxTitle}
                                    style={{
                                        color: '#1976d2',
                                        fontSize: '1.15rem',
                                    }}
                                >
                                    CAM KẾT
                                </div>
                                <div
                                    className={
                                        orderStyles.orderDetailsBoxContent
                                    }
                                >
                                    <div
                                        className={
                                            orderStyles.orderDetailsInfoGrid
                                        }
                                    >
                                        <div
                                            className={
                                                orderStyles.orderDetailsInfoItem
                                            }
                                        >
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoLabel
                                                }
                                                style={{ fontSize: '1.05rem' }}
                                            >
                                                Đã xác nhận cam kết:
                                            </span>{' '}
                                            <span
                                                className={
                                                    orderStyles.orderDetailsInfoValue
                                                }
                                                style={{
                                                    fontSize: '1.08rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {selectedRequest.agree
                                                    ? '✔️ Đã xác nhận'
                                                    : '❌ Chưa xác nhận'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                            {/* Admin Note Section */}
                            {selectedRequest.adminNote && (
                                <div
                                    className={orderStyles.orderDetailsBox}
                                    style={{
                                        background:
                                            selectedRequest.status ===
                                            'approved'
                                                ? 'rgba(255, 243, 205, 0.7)'
                                                : 'rgba(255, 205, 205, 0.7)',
                                        border: `1.5px solid ${
                                            selectedRequest.status ===
                                            'approved'
                                                ? '#ffe066'
                                                : '#ff6f6f'
                                        }`,
                                    }}
                                >
                                    <div
                                        className={
                                            orderStyles.orderDetailsBoxTitle
                                        }
                                        style={{
                                            color:
                                                selectedRequest.status ===
                                                'approved'
                                                    ? '#b8860b'
                                                    : '#c0392b',
                                            fontSize: '1.15rem',
                                        }}
                                    >
                                        {selectedRequest.status === 'approved'
                                            ? 'Ghi chú của admin'
                                            : 'Lý do từ chối'}
                                    </div>
                                    <div
                                        className={
                                            orderStyles.orderDetailsBoxContent
                                        }
                                    >
                                        {selectedRequest.adminNote}
                                    </div>
                                </div>
                            )}
                        </Modal.Body>
                    </>
                )}
                <Modal.Footer className={styles.modalFooter}>
                    {selectedRequest &&
                        selectedRequest.status === 'pending' &&
                        !showInlineConfirm && (
                            <>
                                <Button
                                    variant="outline-success"
                                    onClick={() => {
                                        setInlineAction('approve');
                                        setShowInlineConfirm(true);
                                        setAdminNote('');
                                    }}
                                    className={styles.modalButton}
                                >
                                    <BsCheckCircle className="me-2" /> Duyệt
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    onClick={() => {
                                        setInlineAction('reject');
                                        setShowInlineConfirm(true);
                                        setAdminNote('');
                                    }}
                                    className={styles.modalButton}
                                >
                                    <BsXCircle className="me-2" /> Từ chối
                                </Button>
                            </>
                        )}
                    {showInlineConfirm && (
                        <div ref={inlineConfirmRef} style={{ width: '100%' }}>
                            <Form>
                                {inlineAction === 'reject' && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Lý do từ chối:</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={adminNote}
                                            onChange={(e) =>
                                                setAdminNote(e.target.value)
                                            }
                                            placeholder="Nhập lý do từ chối..."
                                            className={styles.adminNoteInput}
                                            required
                                        />
                                    </Form.Group>
                                )}
                            </Form>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 12,
                                }}
                            >
                                <Button
                                    // variant="outline-light"
                                    onClick={() => {
                                        setShowInlineConfirm(false);
                                        setInlineAction('');
                                        setAdminNote('');
                                    }}
                                    className={styles.modalButton}
                                    disabled={processing}
                                >
                                    <FaTimes className="me-2" /> Hủy
                                </Button>
                                <Button
                                    variant={
                                        inlineAction === 'approve'
                                            ? 'success'
                                            : 'danger'
                                    }
                                    onClick={handleInlineConfirm}
                                    className={styles.modalButton}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                    ) : inlineAction === 'approve' ? (
                                        <>
                                            <BsCheckCircle className="me-2" />{' '}
                                            Xác nhận duyệt
                                        </>
                                    ) : (
                                        <>
                                            <BsXCircle className="me-2" /> Xác
                                            nhận từ chối
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UpgradeRequestsList;
