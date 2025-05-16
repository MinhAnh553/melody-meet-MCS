import React, { useState } from 'react';
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
} from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrash, FaEye, FaTh, FaList } from 'react-icons/fa';
import styles from './Tickets.module.css';
import { formatCurrency, formatTicketStatus } from '../../utils/formatters';
import TicketForm from './TicketForm';

const TicketsList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [eventFilter, setEventFilter] = useState('all');
    const [sortBy, setSortBy] = useState('price');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    const itemsPerPage = 5;

    // Filter tickets
    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch =
            ticket.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEvent =
            eventFilter === 'all' || ticket.eventId.toString() === eventFilter;
        return matchesSearch && matchesEvent;
    });

    // Sort tickets
    const sortedTickets = [...filteredTickets].sort((a, b) => {
        switch (sortBy) {
            case 'type':
                return sortOrder === 'asc'
                    ? a.type.localeCompare(b.type)
                    : b.type.localeCompare(a.type);
            case 'price':
                return sortOrder === 'asc'
                    ? a.price - b.price
                    : b.price - a.price;
            case 'sold':
                return sortOrder === 'asc' ? a.sold - b.sold : b.sold - a.sold;
            default:
                return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
    const indexOfLastTicket = currentPage * itemsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - itemsPerPage;
    const currentTickets = sortedTickets.slice(
        indexOfFirstTicket,
        indexOfLastTicket,
    );

    // Handle sorting change
    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Handle pagination
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Ticket status badge
    const getStatusBadge = (sold, available, quantity) => {
        const status = formatTicketStatus(sold, available, quantity);
        switch (status) {
            case 'Đã bán hết':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeSold}`}
                    >
                        {status}
                    </Badge>
                );
            case 'Đã bán một phần':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeReserved}`}
                    >
                        {status}
                    </Badge>
                );
            case 'Có sẵn':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeAvailable}`}
                    >
                        {status}
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    // Get event name by event ID
    const getEventName = (eventId) => {
        const event = events.find((e) => e.id === eventId);
        return event ? event.title : 'Unknown Event';
    };

    // Handle add/edit ticket
    const handleAddTicket = () => {
        setEditingTicket(null);
        setShowTicketForm(true);
    };

    const handleEditTicket = (ticket) => {
        setEditingTicket(ticket);
        setShowTicketForm(true);
    };

    const handleFormSubmit = (ticketData) => {
        // In a real app, this would save to a backend API
        console.log('Save ticket:', ticketData);
        setShowTicketForm(false);
    };

    // Handle delete ticket
    const handleDeleteClick = (ticket) => {
        setTicketToDelete(ticket);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = () => {
        // In a real app, this would delete from a backend API
        console.log('Delete ticket:', ticketToDelete);
        setShowDeleteModal(false);
    };

    // Toggle view mode
    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    return (
        <div className={styles.ticketsContainer}>
            <h1 className={styles.pageTitle}>Quản lý vé</h1>

            {/* Table Header */}
            <div className={styles.tableHeader}>
                <div>
                    <Button
                        variant="primary"
                        onClick={handleAddTicket}
                        className="me-2"
                    >
                        Thêm loại vé mới
                    </Button>
                    <Button
                        variant={
                            viewMode === 'list'
                                ? 'secondary'
                                : 'outline-secondary'
                        }
                        onClick={() => toggleViewMode('list')}
                        className="me-1"
                    >
                        <FaList />
                    </Button>
                    <Button
                        variant={
                            viewMode === 'grid'
                                ? 'secondary'
                                : 'outline-secondary'
                        }
                        onClick={() => toggleViewMode('grid')}
                    >
                        <FaTh />
                    </Button>
                </div>

                <div className={styles.searchFilter}>
                    <InputGroup className={styles.searchInput}>
                        <InputGroup.Text id="search-addon">
                            <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Tìm kiếm vé..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Form.Select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                    >
                        <option value="all">Tất cả sự kiện</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id.toString()}>
                                {event.title}
                            </option>
                        ))}
                    </Form.Select>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className={styles.ticketGrid}>
                    {currentTickets.map((ticket) => (
                        <Card key={ticket.id} className={styles.ticketCard}>
                            <Card.Img
                                variant="top"
                                src={ticket.image}
                                className={styles.ticketCardImage}
                            />
                            <Card.Body className={styles.ticketCardContent}>
                                <Card.Title className={styles.ticketCardTitle}>
                                    {ticket.type}
                                </Card.Title>
                                <Card.Text className={styles.ticketCardInfo}>
                                    {getEventName(ticket.eventId)}
                                </Card.Text>
                                <Card.Text>
                                    {getStatusBadge(
                                        ticket.sold,
                                        ticket.available,
                                        ticket.quantity,
                                    )}
                                </Card.Text>
                                <div className={styles.ticketCardDetails}>
                                    <div className={styles.ticketCardPrice}>
                                        {formatCurrency(ticket.price)}
                                    </div>
                                    <div className={styles.ticketCardActions}>
                                        <Button
                                            variant="link"
                                            className={`${styles.actionButton} ${styles.viewButton}`}
                                            title="Xem chi tiết"
                                        >
                                            <FaEye />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className={`${styles.actionButton} ${styles.editButton}`}
                                            title="Chỉnh sửa"
                                            onClick={() =>
                                                handleEditTicket(ticket)
                                            }
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            title="Xóa"
                                            onClick={() =>
                                                handleDeleteClick(ticket)
                                            }
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className={styles.tableWrapper}>
                    <Table responsive hover className={styles.ticketTable}>
                        <thead>
                            <tr>
                                <th>Hình ảnh</th>
                                <th
                                    onClick={() => handleSortChange('type')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Loại vé{' '}
                                    {sortBy === 'type' &&
                                        (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Sự kiện</th>
                                <th
                                    onClick={() => handleSortChange('price')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Giá{' '}
                                    {sortBy === 'price' &&
                                        (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSortChange('sold')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Đã bán{' '}
                                    {sortBy === 'sold' &&
                                        (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Còn lại</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTickets.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td>
                                        <img
                                            src={ticket.image}
                                            alt={ticket.type}
                                            className={styles.eventImage}
                                        />
                                    </td>
                                    <td>{ticket.type}</td>
                                    <td>{getEventName(ticket.eventId)}</td>
                                    <td>{formatCurrency(ticket.price)}</td>
                                    <td>{ticket.sold}</td>
                                    <td>{ticket.available}</td>
                                    <td>
                                        {getStatusBadge(
                                            ticket.sold,
                                            ticket.available,
                                            ticket.quantity,
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.tableActions}>
                                            <Button
                                                variant="link"
                                                className={`${styles.actionButton} ${styles.viewButton}`}
                                                title="Xem chi tiết"
                                            >
                                                <FaEye />
                                            </Button>
                                            <Button
                                                variant="link"
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                title="Chỉnh sửa"
                                                onClick={() =>
                                                    handleEditTicket(ticket)
                                                }
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="link"
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                title="Xóa"
                                                onClick={() =>
                                                    handleDeleteClick(ticket)
                                                }
                                            >
                                                <FaTrash />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
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
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        />

                        {[...Array(totalPages)].map((_, index) => (
                            <Pagination.Item
                                key={index + 1}
                                active={index + 1 === currentPage}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </Pagination.Item>
                        ))}

                        <Pagination.Next
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        />
                        <Pagination.Last
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        />
                    </Pagination>
                </div>
            )}

            {/* Ticket Form Modal */}
            <Modal
                show={showTicketForm}
                onHide={() => setShowTicketForm(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className={styles.modalTitle}>
                        {editingTicket ? 'Chỉnh sửa vé' : 'Thêm loại vé mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <TicketForm
                        ticket={editingTicket}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setShowTicketForm(false)}
                    />
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className={styles.modalTitle}>
                        Xác nhận xóa
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc chắn muốn xóa loại vé "{ticketToDelete?.type}"
                    của sự kiện "{getEventName(ticketToDelete?.eventId)}"? Hành
                    động này không thể hoàn tác.
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default TicketsList;
