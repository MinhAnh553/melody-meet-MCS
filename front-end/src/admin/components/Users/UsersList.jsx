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
import styles from './Users.module.css';

import { formatDateTime } from '../../utils/formatters';

import UserForm from './UserForm';
import api from '../../../util/api';
import { BsPerson } from 'react-icons/bs';
import swalCustomize from '../../../util/swalCustomize';

const UsersList = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);

    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortUser, setSortUser] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [showUserForm, setShowUserForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm, statusFilter, sortBy, sortUser]);

    const fetchUsers = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.getAllUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                sortBy,
                sortUser,
            });
            if (res.success) {
                setUsers(res.users);
                setTotalPages(res.totalPages);
                setTotalUsers(res.totalUsers);
            }
        } catch (error) {
            console.log('Lỗi khi gọi API getAllUsers:', error);
        } finally {
            setLoadingLocal(false);
        }
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortUser(sortUser === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortUser('asc');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePaid}`}
                    >
                        Hoạt động
                    </Badge>
                );
            case 'inactive':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCanceled}`}
                    >
                        Không hoạt động
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    const handleViewUserForm = (user) => {
        setSelectedUser(user);
        setShowUserForm(true);
    };

    const handleUpdateUser = async (userId, userData) => {
        await api.updateUser(userId, userData);

        swalCustomize.Toast.fire({
            icon: 'success',
            title: 'Cập nhật người dùng thành công!',
        });
        setShowUserForm(false);
        fetchUsers(); // Refresh danh sách người dùng
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return <FaSort className={styles.sortIcon} />;
        return sortUser === 'asc' ? (
            <FaSortUp className={styles.sortIcon} />
        ) : (
            <FaSortDown className={styles.sortIcon} />
        );
    };

    return (
        <div className={styles.usersContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h2 className={styles.pageTitle}>
                                Quản lý người dùng
                            </h2>
                            <p className={styles.pageSubtitle}>
                                Tổng số người dùng: {totalUsers}
                            </p>
                        </Col>
                        <Col md={6}>
                            <div className={styles.searchFilter}>
                                <InputGroup className={styles.searchInput}>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Tìm kiếm người dùng..."
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
                                            : statusFilter === 'active'
                                            ? 'Hoạt động'
                                            : 'Không hoạt động'}
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
                                                setStatusFilter('active');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Hoạt động
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            onClick={() => {
                                                setStatusFilter('inactive');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Không hoạt động
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Users Table */}
            <Card className={styles.tableCard}>
                <Card.Body>
                    {loadingLocal ? (
                        <div className={styles.loadingContainer}>
                            <div
                                className="spinner-buser text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Đang tải...
                                </span>
                            </div>
                            <p className="mt-3">Đang tải dữ liệu...</p>
                        </div>
                    ) : users.length > 0 ? (
                        <div className={styles.tableWrapper}>
                            <Table
                                responsive
                                hover
                                className={styles.userTable}
                            >
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th
                                            className={styles.sortableColumn}
                                            onClick={() =>
                                                handleSortChange('email')
                                            }
                                        >
                                            Email {getSortIcon('email')}
                                        </th>
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
                                    {users.map((user, index) => (
                                        <tr key={user._id}>
                                            <td>
                                                {(currentPage - 1) *
                                                    itemsPerPage +
                                                    index +
                                                    1}
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                {getStatusBadge(user.status)}
                                            </td>
                                            <td>
                                                {formatDateTime(user.createdAt)}
                                            </td>
                                            <td>
                                                <div
                                                    className={
                                                        styles.tableActions
                                                    }
                                                >
                                                    <Button
                                                        variant="link"
                                                        className={`${styles.actionButton} ${styles.viewButton}`}
                                                        title="Xem chi tiết"
                                                        onClick={() =>
                                                            handleViewUserForm(
                                                                user,
                                                            )
                                                        }
                                                    >
                                                        <FaEye />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <div className={styles.noData}>
                            <p>Không có dữ liệu người dùng</p>
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

            {/* User Form Modal */}
            <Modal
                show={showUserForm}
                onHide={() => setShowUserForm(false)}
                size="lg"
                centered
                className={styles.userModal}
                contentClassName={styles.modalContent}
            >
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>
                        {selectedUser
                            ? 'Cập nhật người dùng'
                            : 'Thêm người dùng mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    <UserForm
                        user={selectedUser}
                        onSubmit={handleUpdateUser}
                        onCancel={() => setShowUserForm(false)}
                    />
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button
                        variant="outline-light"
                        onClick={() => setShowUserForm(false)}
                        className={styles.modalButton}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="success"
                        className={styles.modalButton}
                        onClick={() => {
                            const form = document.querySelector('form');
                            if (form) {
                                form.dispatchEvent(
                                    new Event('submit', {
                                        cancelable: true,
                                        bubbles: true,
                                    }),
                                );
                            }
                        }}
                    >
                        {selectedUser ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default UsersList;
