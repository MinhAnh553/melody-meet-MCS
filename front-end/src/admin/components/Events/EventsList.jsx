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
} from 'react-icons/fa';
import styles from './Events.module.css';

import {
    formatDate,
    formatCurrency,
    truncateText,
} from '../../utils/formatters';
import EventDetails from './EventDetails';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import { BsCalendarX } from 'react-icons/bs';

const EventsList = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);

    const [events, setEvents] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedEventId, setSelectedEventId] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchEvents();
    }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

    const fetchEvents = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.getAllEvents({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                sortBy,
                sortOrder,
            });
            if (res.success) {
                setEvents(res.events);
                setTotalPages(res.totalPages);
                setTotalEvents(res.totalEvents);
            }
        } catch (error) {
            console.log('Lỗi khi gọi API getAllEvents:', error);
        } finally {
            setLoadingLocal(false);
        }
    };

    const currentEvents = events;

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeApproved}`}
                    >
                        Đã duyệt
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePending}`}
                    >
                        Đang chờ duyệt
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
            case 'event_over':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCompleted}`}
                    >
                        Đã diễn ra
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    const handleViewEventDetails = (event) => {
        setSelectedEvent(event);
        setShowEventDetails(true);
    };

    const handleApproveEvent = async (eventId) => {
        try {
            // tạo form data
            const formData = new FormData();
            formData.append('status', 'approved');
            const res = await api.updateStatusEvent(eventId, formData);
            if (res.success) {
                fetchEvents();
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Duyệt sự kiện thành công!',
                });
                setShowEventDetails(false);
            } else {
                console.log(res.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRejectEvent = async (eventId) => {
        if (!rejectReason.trim()) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập lý do từ chối!',
            });
            return;
        }

        try {
            // tạo form data
            const formData = new FormData();
            formData.append('status', 'rejected');
            formData.append('rejectReason', rejectReason);
            const res = await api.updateStatusEvent(eventId, formData);
            if (res.success) {
                fetchEvents();
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Đã từ chối sự kiện!',
                });
                setShowEventDetails(false);
                setShowRejectModal(false);
                setRejectReason('');
            } else {
                console.log(res.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openRejectModal = (eventId) => {
        setSelectedEventId(eventId);
        setShowRejectModal(true);
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return <FaSort className={styles.sortIcon} />;
        return sortOrder === 'asc' ? (
            <FaSortUp className={styles.sortIcon} />
        ) : (
            <FaSortDown className={styles.sortIcon} />
        );
    };

    return (
        <div className={styles.eventsContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h2 className={styles.pageTitle}>
                                Quản lý sự kiện
                            </h2>
                            <p className={styles.pageSubtitle}>
                                Tổng số sự kiện: {totalEvents}
                            </p>
                        </Col>
                        <Col md={6}>
                            <div className={styles.searchFilter}>
                                <InputGroup className={styles.searchInput}>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Tìm kiếm sự kiện..."
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
                                            : statusFilter === 'approved'
                                            ? 'Đã duyệt'
                                            : statusFilter === 'pending'
                                            ? 'Đang chờ duyệt'
                                            : statusFilter === 'rejected'
                                            ? 'Đã từ chối'
                                            : 'Đã diễn ra'}
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
                                                setStatusFilter('approved');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã duyệt
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('pending');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đang chờ duyệt
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('rejected');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã từ chối
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('event_over');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Đã diễn ra
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Events Table */}
            <Card className={styles.tableCard}>
                <Card.Body>
                    {loadingLocal ? (
                        <div className={styles.loadingContainer}>
                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Đang tải...
                                </span>
                            </div>
                            <p className="mt-3">Đang tải dữ liệu...</p>
                        </div>
                    ) : currentEvents.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <Table
                                responsive
                                hover
                                className={styles.eventTable}
                            >
                                <thead>
                                    <tr>
                                        <th className={styles.imageColumn}>
                                            Ảnh
                                        </th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('name')
                                            }
                                        >
                                            Tên sự kiện {getSortIcon('name')}
                                        </th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('date')
                                            }
                                        >
                                            Ngày tổ chức {getSortIcon('date')}
                                        </th>
                                        <th>Người đăng</th>
                                        <th>Trạng thái</th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('revenue')
                                            }
                                        >
                                            Doanh thu {getSortIcon('revenue')}
                                        </th>
                                        <th className={styles.actionColumn}>
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentEvents.map((event) => (
                                        <tr key={event._id}>
                                            <td>
                                                <div
                                                    className={
                                                        styles.imageWrapper
                                                    }
                                                >
                                                    <img
                                                        src={event.background}
                                                        alt={event.name}
                                                        className={
                                                            styles.eventImage
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className={styles.eventName}
                                                >
                                                    {truncateText(
                                                        event.name,
                                                        30,
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {formatDate(event.startTime)}
                                            </td>
                                            <td>
                                                {truncateText(
                                                    event.organizerInfo[0]
                                                        .email || '',
                                                    30,
                                                )}
                                            </td>
                                            <td>
                                                {getStatusBadge(event.status)}
                                            </td>
                                            <td>
                                                <span
                                                    className={styles.revenue}
                                                >
                                                    {formatCurrency(
                                                        event.totalRevenue || 0,
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="link"
                                                    className={`${styles.actionButton} ${styles.viewButton}`}
                                                    title="Xem chi tiết"
                                                    onClick={() =>
                                                        handleViewEventDetails(
                                                            event,
                                                        )
                                                    }
                                                >
                                                    <FaEye />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <BsCalendarX size={60} className="mb-3" />
                            <h4>Không có sự kiện</h4>
                            <p>
                                Không tìm thấy sự kiện nào phù hợp với bộ lọc
                                hiện tại
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

            {/* Modal Chi tiết Sự kiện */}
            <Modal
                show={showEventDetails}
                onHide={() => setShowEventDetails(false)}
                size="lg"
                centered
                className={styles.eventModal}
                contentClassName={styles.modalContent}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        Chi tiết sự kiện
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {selectedEvent && <EventDetails event={selectedEvent} />}
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="outline-light"
                        onClick={() => setShowEventDetails(false)}
                        className={styles.modalButton}
                    >
                        Đóng
                    </Button>
                    {selectedEvent?.status !== 'event_over' && (
                        <>
                            {selectedEvent?.status !== 'approved' && (
                                <Button
                                    variant="success"
                                    onClick={() =>
                                        handleApproveEvent(selectedEvent._id)
                                    }
                                    className={styles.modalButton}
                                >
                                    Duyệt
                                </Button>
                            )}

                            {selectedEvent?.status !== 'rejected' && (
                                <Button
                                    variant="danger"
                                    onClick={() =>
                                        openRejectModal(selectedEvent._id)
                                    }
                                    className={styles.modalButton}
                                >
                                    Từ chối
                                </Button>
                            )}
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Modal Nhập lý do từ chối */}
            <Modal
                show={showRejectModal}
                onHide={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                }}
                centered
                className={styles.eventModal}
                contentClassName={styles.modalContent}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        Lý do từ chối sự kiện
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                Vui lòng nhập lý do từ chối:
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                placeholder="Nhập lý do từ chối sự kiện..."
                                className={styles.rejectReasonInput}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="outline-light"
                        onClick={() => {
                            setShowRejectModal(false);
                            setRejectReason('');
                        }}
                        className={styles.modalButton}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleRejectEvent(selectedEventId)}
                        className={styles.modalButton}
                    >
                        Xác nhận từ chối
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EventsList;
