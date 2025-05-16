import React, { useEffect, useState } from 'react';
import {
    Table,
    Button,
    Form,
    InputGroup,
    Pagination,
    Modal,
} from 'react-bootstrap';
import { FaSearch, FaEdit } from 'react-icons/fa';
import styles from './Users.module.css';
import UserForm from './UserForm';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import { BsPersonX } from 'react-icons/bs';
import { useLoading } from '../../../client/context/LoadingContext';

const UsersList = () => {
    const { showLoading, hideLoading } = useLoading();
    const [loadingLocal, setLoadingLocal] = useState(true);

    const [users, setUsers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.getAllUsers();
            if (res.success) {
                setUsers(res.users);
            }
        } catch (error) {
            console.log('Lỗi khi gọi API getAllUsers:', error);
        } finally {
            setLoadingLocal(false);
        }
    };

    // Filter users
    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Sort users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        switch (sortBy) {
            case 'email':
                return sortOrder === 'asc'
                    ? a.email.localeCompare(b.email)
                    : b.email.localeCompare(a.email);
            case 'createdAt':
                return sortOrder === 'asc'
                    ? new Date(a.createdAt) - new Date(b.createdAt)
                    : new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const indexOfLastUser = currentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

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

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowUserForm(true);
    };

    const handleFormSubmit = async (userId, userData) => {
        showLoading();
        try {
            const res = await api.updateUser(userId, userData);
            if (res.success) {
                fetchUsers();
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Cập nhật thành công!',
                });
                setShowUserForm(false);
            } else {
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message,
                });
            }
        } catch (error) {
            console.log('Lỗi khi gọi API:', error);
        } finally {
            hideLoading();
        }
    };

    return (
        <div className={styles.usersContainer}>
            {/* Table Header */}
            <div className={styles.tableHeader}>
                {/* <Button variant="primary" onClick={handleAddUser}>
                    Thêm người dùng mới
                </Button> */}

                <div className={styles.searchFilter}>
                    <InputGroup className={styles.searchInput}>
                        <InputGroup.Text id="search-addon">
                            <FaSearch />
                        </InputGroup.Text>
                        <Form.Control
                            className="text-dark"
                            placeholder="Tìm kiếm người dùng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    {/* <Form.Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Tất cả vai trò</option>
                        <option value="admin">Quản trị viên</option>
                        <option value="organizer">Nhà tổ chức</option>
                        <option value="user">Người dùng</option>
                    </Form.Select> */}
                </div>
            </div>

            {/* Users Table */}
            {loadingLocal ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            ) : currentUsers.length > 0 ? (
                <>
                    <div className={styles.tableWrapper}>
                        <Table responsive hover className={styles.userTable}>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th
                                        onClick={() =>
                                            handleSortChange('email')
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Email{' '}
                                        {sortBy === 'email' &&
                                            (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Trạng thái</th>
                                    <th
                                        onClick={() =>
                                            handleSortChange('createdAt')
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Ngày tạo{' '}
                                        {sortBy === 'createdAt' &&
                                            (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user, index) => (
                                    <tr key={user._id}>
                                        <td>{index + 1}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            {user.status === 'active'
                                                ? 'Hoạt động'
                                                : 'Không hoạt động'}
                                        </td>
                                        <td>
                                            {new Date(
                                                user.createdAt,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div
                                                className={styles.tableActions}
                                            >
                                                <Button
                                                    variant="link"
                                                    className={`${styles.actionButton} ${styles.editButton}`}
                                                    title="Chỉnh sửa"
                                                    onClick={() =>
                                                        handleEditUser(user)
                                                    }
                                                >
                                                    <FaEdit />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

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
                </>
            ) : (
                <div className="d-flex flex-column align-items-center justify-content-center my-5">
                    <BsPersonX size={60} className="mb-3" />
                    <p className="fs-5">Không có người dùng</p>
                </div>
            )}

            {/* User Form Modal */}
            <Modal
                show={showUserForm}
                onHide={() => setShowUserForm(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className={styles.modalTitle}>
                        {editingUser
                            ? 'Chỉnh sửa người dùng'
                            : 'Thêm người dùng mới'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UserForm
                        user={editingUser}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setShowUserForm(false)}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UsersList;
