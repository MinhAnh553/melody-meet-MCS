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
import { Table, Space, Tag, Tooltip, Empty, Avatar } from 'antd';
import {
    EyeOutlined,
    CloseOutlined,
    SettingOutlined,
    UserOutlined,
    CalendarOutlined,
    MailOutlined,
    CheckCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    CrownOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import {
    FaSearch,
    FaFilter,
    FaChartBar,
    FaCog,
    FaUsers,
    FaAngleLeft,
    FaAngleRight,
    FaAngleDoubleLeft,
    FaAngleDoubleRight,
} from 'react-icons/fa';

import styles from './Users.module.css';
import { formatDateTime } from '../../utils/formatters';
import UserForm from './UserForm';
import api from '../../../util/api';
import { BsPerson } from 'react-icons/bs';
import swalCustomize from '../../../util/swalCustomize';
import LoadingSpinner from '../../../client/components/loading/LoadingSpinner';

const UsersList = () => {
    const [loading, setLoading] = useState(true);

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
        setLoading(true);
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
            setLoading(false);
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

    const getStatusTag = (status) => {
        switch (status) {
            case 'active':
                return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Hoạt động
                    </Tag>
                );
            case 'inactive':
                return (
                    <Tag color="error" icon={<CloseOutlined />}>
                        Không hoạt động
                    </Tag>
                );
            default:
                return <Tag>{status}</Tag>;
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
        const isActive = sortBy === field;
        const isAsc = sortUser === 'asc';
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

    // Icon cho role
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <CrownOutlined style={{ color: '#d32f2f' }} />;
            case 'organizer':
                return <TeamOutlined style={{ color: '#1976d2' }} />;
            default:
                return <UserOutlined style={{ color: '#888' }} />;
        }
    };

    // Ant Design Table columns configuration
    const columns = [
        {
            title: (
                <Space>
                    <UserOutlined />
                    Người dùng
                </Space>
            ),
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    <Avatar
                        src={record.avatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>
                            {name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {record.email}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <MailOutlined />
                    Email
                </Space>
            ),
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <Space>
                    <MailOutlined />
                    {truncateText(email, 25)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <SettingOutlined />
                    Vai trò
                </Space>
            ),
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Space>
                    {getRoleIcon(role)}
                    {truncateText(role, 25)}
                </Space>
            ),
        },
        {
            title: (
                <Space>
                    <CalendarOutlined />
                    Ngày tạo
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
                    {formatDateTime(createdAt)}
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
            width: 100,
            render: (_, record) => (
                <Tooltip title="Chỉnh sửa người dùng">
                    <span
                        onClick={() => handleViewUserForm(record)}
                        style={{ color: '#1890ff', cursor: 'pointer' }}
                    >
                        <EyeOutlined />
                    </span>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className={styles.usersContainer}>
            {/* Header Section */}
            <Card className={styles.headerCard}>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className={styles.titleSection}>
                                <div className={styles.titleIcon}>
                                    <FaUsers />
                                </div>
                                <div>
                                    <h2 className={styles.pageTitle}>
                                        <FaCog
                                            className={styles.titleIconSmall}
                                        />
                                        Quản lý người dùng
                                    </h2>
                                    <p className={styles.pageSubtitle}>
                                        <FaChartBar
                                            className={styles.subtitleIcon}
                                        />
                                        Tổng số người dùng: {totalUsers}
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
                    <div className={styles.tableWrapper}>
                        <Table
                            columns={columns}
                            dataSource={loading ? [] : users}
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
                                        image={<BsPerson size={60} />}
                                        description={
                                            <div>
                                                <h4>Không có người dùng</h4>
                                                <p>
                                                    Không tìm thấy người dùng
                                                    nào phù hợp với bộ lọc hiện
                                                    tại
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

            {/* Modal Chỉnh sửa người dùng */}
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
                        Chỉnh sửa người dùng
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {selectedUser && (
                        <UserForm
                            user={selectedUser}
                            onSubmit={handleUpdateUser}
                            onCancel={() => setShowUserForm(false)}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UsersList;
