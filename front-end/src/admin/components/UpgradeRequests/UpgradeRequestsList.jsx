import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Form,
    InputGroup,
    Badge,
    Pagination,
    Modal,
    Card,
    Row,
    Col,
    Dropdown,
} from 'react-bootstrap';
import {
    FaSearch,
    FaEye,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaFilter,
    FaCheck,
    FaTimes,
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePending}`}
                    >
                        Chờ xử lý
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeApproved}`}
                    >
                        Đã duyệt
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeRejected}`}
                    >
                        Đã từ chối
                    </Badge>
                );
            default:
                return (
                    <Badge className={styles.statusBadge}>Không xác định</Badge>
                );
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
        if (sortBy !== field) return <FaSort className={styles.sortIcon} />;
        return sortOrder === 'asc' ? (
            <FaSortUp className={styles.sortIcon} />
        ) : (
            <FaSortDown className={styles.sortIcon} />
        );
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength
            ? `${text.substring(0, maxLength)}...`
            : text;
    };

    return (
        <div className={styles.upgradeRequestsContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h2 className={styles.pageTitle}>
                                Quản lý yêu cầu nâng cấp
                            </h2>
                            <p className={styles.pageSubtitle}>
                                Tổng số yêu cầu: {totalRequests}
                            </p>
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
                    {loading ? (
                        <LoadingSpinner />
                    ) : upgradeRequests.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <Table
                                responsive
                                hover
                                className={`${styles.upgradeRequestsTable} table-striped`}
                            >
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Tên ban tổ chức</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Trạng thái</th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('createdAt')
                                            }
                                        >
                                            Ngày tạo {getSortIcon('createdAt')}
                                        </th>
                                        <th className={styles.actionColumn}>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upgradeRequests.map((request) => (
                                        <tr key={request._id}>
                                            <td>
                                                <div>
                                                    <strong>
                                                        {request.userId?.email}
                                                    </strong>
                                                    {request.userId?.name && (
                                                        <>
                                                            <br />
                                                            <small className="text-muted">
                                                                {
                                                                    request
                                                                        .userId
                                                                        .name
                                                                }
                                                            </small>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <strong>
                                                        {request.organizer.name}
                                                    </strong>
                                                    {request.organizer.info && (
                                                        <>
                                                            <br />
                                                            <small className="text-muted">
                                                                {truncateText(
                                                                    request
                                                                        .organizer
                                                                        .info,
                                                                    50,
                                                                )}
                                                            </small>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{request.organizer.email}</td>
                                            <td>{request.organizer.phone}</td>
                                            <td>
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td>
                                                {formatDate(request.createdAt)}
                                            </td>
                                            <td>
                                                <div
                                                    className={
                                                        styles.tableActions
                                                    }
                                                >
                                                    {request.status ===
                                                        'pending' && (
                                                        <>
                                                            <Button
                                                                variant="link"
                                                                className={`${styles.actionButton} ${styles.approveButton}`}
                                                                title="Duyệt yêu cầu"
                                                                onClick={() =>
                                                                    handleAction(
                                                                        request,
                                                                        'approve',
                                                                    )
                                                                }
                                                            >
                                                                <BsCheckCircle />
                                                            </Button>
                                                            <Button
                                                                variant="link"
                                                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                                                title="Từ chối yêu cầu"
                                                                onClick={() =>
                                                                    handleAction(
                                                                        request,
                                                                        'reject',
                                                                    )
                                                                }
                                                            >
                                                                <BsXCircle />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {request.status !==
                                                        'pending' && (
                                                        <small className="text-muted">
                                                            {request.adminId
                                                                ?.name ||
                                                                'Admin'}{' '}
                                                            -{' '}
                                                            {formatDate(
                                                                request.updatedAt,
                                                            )}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <BsXCircle size={48} className="text-muted mb-3" />
                            <h4>Không có yêu cầu nâng cấp nào</h4>
                            <p>
                                Hiện tại chưa có yêu cầu nâng cấp nào được gửi.
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.paginationContainer}>
                            <Pagination>
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
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1,
                                ).map((page) => (
                                    <Pagination.Item
                                        key={page}
                                        active={page === currentPage}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Pagination.Item>
                                ))}
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
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modal for approve/reject */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                className={styles.actionModal}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        {action === 'approve'
                            ? 'Duyệt yêu cầu nâng cấp'
                            : 'Từ chối yêu cầu nâng cấp'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {selectedRequest && (
                        <div className={styles.requestInfo}>
                            <h6>Thông tin yêu cầu:</h6>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>
                                    Người dùng:
                                </span>
                                <span className={styles.infoValue}>
                                    {selectedRequest.userId?.email}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>
                                    Tên BTC:
                                </span>
                                <span className={styles.infoValue}>
                                    {selectedRequest.organizer.name}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Email:</span>
                                <span className={styles.infoValue}>
                                    {selectedRequest.organizer.email}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>
                                    Số điện thoại:
                                </span>
                                <span className={styles.infoValue}>
                                    {selectedRequest.organizer.phone}
                                </span>
                            </div>
                        </div>
                    )}
                    <Form.Group className="mt-3">
                        <Form.Label>
                            {action === 'approve'
                                ? 'Ghi chú (tùy chọn):'
                                : 'Lý do từ chối:'}
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder={
                                action === 'approve'
                                    ? 'Nhập ghi chú nếu cần...'
                                    : 'Nhập lý do từ chối...'
                            }
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant={action === 'approve' ? 'success' : 'danger'}
                        onClick={handleConfirmAction}
                        disabled={processing}
                        className={styles.modalButton}
                    >
                        {processing
                            ? 'Đang xử lý...'
                            : action === 'approve'
                            ? 'Duyệt'
                            : 'Từ chối'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UpgradeRequestsList;
