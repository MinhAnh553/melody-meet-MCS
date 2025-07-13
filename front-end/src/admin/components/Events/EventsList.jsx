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
import { Table, Space, Tag, Image, Tooltip, Empty } from 'antd';
import {
    EyeOutlined,
    CalendarOutlined,
    UserOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    PictureOutlined,
    UnorderedListOutlined,
    SettingOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
} from '@ant-design/icons';
import {
    FaSearch,
    FaFilter,
    FaTimesCircle,
    FaCheck,
    FaTimes,
    FaExclamationTriangle,
    FaListUl,
    FaChartBar,
    FaCog,
    FaAngleLeft,
    FaAngleRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
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
import LoadingSpinner from '../../../client/components/loading/LoadingSpinner';

const EventsList = () => {
    const [loading, setLoading] = useState(true);

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
        setLoading(true);
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
            setLoading(false);
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

    const getStatusTag = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đã duyệt
                    </Tag>
                );
            case 'pending':
                return (
                    <Tag color="processing" icon={<ClockCircleOutlined />}>
                        Đang chờ duyệt
                    </Tag>
                );
            case 'rejected':
                return (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                        Đã từ chối
                    </Tag>
                );
            case 'event_over':
                return (
                    <Tag color="default" icon={<ExclamationCircleOutlined />}>
                        Đã diễn ra
                    </Tag>
                );
            default:
                return <Tag>{status}</Tag>;
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

    const handleEventNameClick = (eventId) => {
        window.open(`/event/${eventId}`, '_blank');
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

    // Ant Design Table columns configuration
    const columns = [
        {
            title: (
                <Space>
                    <PictureOutlined />
                    Ảnh
                </Space>
            ),
            dataIndex: 'background',
            key: 'image',
            width: 100,
            render: (background, record) => (
                <Image
                    src={background}
                    alt={record.name}
                    width={100}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                />
            ),
        },
        {
            title: (
                <Space>
                    <UnorderedListOutlined />
                    Tên sự kiện
                    <span onClick={() => handleSortChange('name')}>
                        {getSortIcon('name')}
                    </span>
                </Space>
            ),
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <span
                    onClick={() => handleEventNameClick(record._id)}
                    style={{
                        color: '#1890ff',
                        cursor: 'pointer',
                        fontWeight: '500',
                    }}
                    title={name}
                >
                    {truncateText(name, 30)}
                </span>
            ),
        },
        {
            title: (
                <Space>
                    <CalendarOutlined />
                    Ngày tổ chức
                    <span onClick={() => handleSortChange('date')}>
                        {getSortIcon('date')}
                    </span>
                </Space>
            ),
            dataIndex: 'startTime',
            key: 'date',
            render: (startTime) => (
                <Space>
                    <CalendarOutlined />
                    {formatDate(startTime)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <UserOutlined />
                    Người đăng
                </Space>
            ),
            dataIndex: 'organizerInfo',
            key: 'organizer',
            render: (organizerInfo) => (
                <Space>
                    <UserOutlined />
                    {truncateText(organizerInfo[0]?.email || '', 30)}
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
                    <DollarOutlined />
                    Doanh thu
                    {/* <span onClick={() => handleSortChange('revenue')}>
                        {getSortIcon('revenue')}
                    </span> */}
                </Space>
            ),
            dataIndex: 'totalRevenue',
            key: 'revenue',
            render: (totalRevenue) => (
                <Space>
                    <DollarOutlined />
                    <span style={{ fontWeight: 'bold' }}>
                        {formatCurrency(totalRevenue || 0)}
                    </span>
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <SettingOutlined />
                    Thao tác
                </Space>
            ),
            key: 'action',
            width: 100,
            render: (_, record) => (
                <Tooltip title="Xem chi tiết">
                    <span
                        onClick={() => handleViewEventDetails(record)}
                        style={{ color: '#1890ff', cursor: 'pointer' }}
                    >
                        <EyeOutlined />
                    </span>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className={styles.eventsContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className={styles.titleSection}>
                                <div className={styles.titleIcon}>
                                    <FaListUl />
                                </div>
                                <div>
                                    <h2 className={styles.pageTitle}>
                                        <FaCog
                                            className={styles.titleIconSmall}
                                        />
                                        Quản lý sự kiện
                                    </h2>
                                    <p className={styles.pageSubtitle}>
                                        <FaChartBar
                                            className={styles.subtitleIcon}
                                        />
                                        Tổng số sự kiện: {totalEvents}
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
                    <div className={styles.tableWrapper}>
                        <Table
                            columns={columns}
                            dataSource={loading ? [] : currentEvents}
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
                                        image={<BsCalendarX size={60} />}
                                        description={
                                            <div>
                                                <h4>Không có sự kiện</h4>
                                                <p>
                                                    Không tìm thấy sự kiện nào
                                                    phù hợp với bộ lọc hiện tại
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
                        <FaTimes className="me-2" />
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
                                    <FaCheck className="me-2" />
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
                                    <FaTimesCircle className="me-2" />
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
                        <FaTimes className="me-2" />
                        Hủy
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleRejectEvent(selectedEventId)}
                        className={styles.modalButton}
                    >
                        <FaExclamationTriangle className="me-2" />
                        Xác nhận từ chối
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EventsList;
