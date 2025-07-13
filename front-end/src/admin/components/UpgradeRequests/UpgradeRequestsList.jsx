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
import { Table, Space, Tag, Tooltip, Empty } from 'antd';
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

    // Modal xác nhận duyệt/từ chối
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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
    };

    const handleConfirmAction = async () => {
        if (!selectedRequest) return;

        setProcessing(true);
        try {
            let res;
            if (action === 'approve') {
                res = await api.approveUpgradeRequest(
                    selectedRequest._id,
                    adminNote,
                );
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
                        action === 'approve'
                            ? 'Đã duyệt yêu cầu nâng cấp'
                            : 'Đã từ chối yêu cầu nâng cấp',
                });
                setShowModal(false);
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
                centered
                className={styles.upgradeRequestModal}
                contentClassName={styles.modalContent}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        Thông tin tổ chức đăng ký nâng cấp
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {selectedRequest && selectedRequest.organizer && (
                        <div className={styles.organizerCard}>
                            <div className={styles.organizerCardHeader}>
                                <img
                                    src={selectedRequest.organizer.logo}
                                    alt="logo"
                                    className={styles.organizerLogo}
                                />
                                <div className={styles.organizerName}>
                                    {selectedRequest.organizer.name}
                                </div>
                            </div>
                            <div className={styles.organizerInfoRow}>
                                <b>Giới thiệu:</b>{' '}
                                {selectedRequest.organizer.info}
                            </div>
                            <div className={styles.organizerInfoRow}>
                                <b>Email:</b> {selectedRequest.organizer.email}
                            </div>
                            <div className={styles.organizerInfoRow}>
                                <b>Điện thoại:</b>{' '}
                                {selectedRequest.organizer.phone}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    {selectedRequest &&
                        selectedRequest.status === 'pending' && (
                            <>
                                <Button
                                    variant="outline-success"
                                    onClick={() => {
                                        setAction('approve');
                                        setShowModal(false);
                                        setTimeout(
                                            () => setShowConfirmModal(true),
                                            200,
                                        );
                                    }}
                                    className={styles.modalButton}
                                >
                                    <BsCheckCircle className="me-2" /> Duyệt
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    onClick={() => {
                                        setAction('reject');
                                        setShowModal(false);
                                        setTimeout(
                                            () => setShowConfirmModal(true),
                                            200,
                                        );
                                    }}
                                    className={styles.modalButton}
                                >
                                    <BsXCircle className="me-2" /> Từ chối
                                </Button>
                            </>
                        )}
                </Modal.Footer>
            </Modal>

            {/* Modal xác nhận duyệt/từ chối */}
            <Modal
                show={showConfirmModal}
                onHide={() => {
                    setShowConfirmModal(false);
                    setAdminNote('');
                }}
                centered
                className={styles.upgradeRequestModal}
                contentClassName={styles.modalContent}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        {action === 'approve'
                            ? 'Xác nhận duyệt yêu cầu'
                            : 'Xác nhận từ chối yêu cầu'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                {action === 'approve'
                                    ? 'Ghi chú khi duyệt (tùy chọn):'
                                    : 'Lý do từ chối:'}
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder={
                                    action === 'approve'
                                        ? 'Nhập ghi chú khi duyệt...'
                                        : 'Nhập lý do từ chối...'
                                }
                                className={styles.adminNoteInput}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="outline-light"
                        onClick={() => {
                            setShowConfirmModal(false);
                            setAdminNote('');
                        }}
                        className={styles.modalButton}
                        disabled={processing}
                    >
                        <FaTimes className="me-2" />
                        Hủy
                    </Button>
                    <Button
                        variant={action === 'approve' ? 'success' : 'danger'}
                        onClick={handleConfirmAction}
                        className={styles.modalButton}
                        disabled={processing}
                    >
                        {processing ? (
                            <LoadingSpinner />
                        ) : action === 'approve' ? (
                            <>
                                <BsCheckCircle className="me-2" />
                                Duyệt
                            </>
                        ) : (
                            <>
                                <BsXCircle className="me-2" />
                                Từ chối
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UpgradeRequestsList;
