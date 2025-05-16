import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Container, Dropdown } from 'react-bootstrap';
import {
    FaHome,
    FaMusic,
    FaShoppingCart,
    FaTicketAlt,
    FaUsers,
    FaBars,
    FaTimes,
    FaUserCircle,
    FaSignOutAlt,
    FaCog,
    FaChevronRight,
} from 'react-icons/fa';
import avatar from '../../../assets/images/avatar.png';
import { useAuth } from '../../../client/context/AuthContext';
import swalCustomize from '../../../util/swalCustomize';
import styles from './Layout.module.css';

const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    const navItems = [
        { path: '/admin/dashboard', icon: <FaHome />, text: 'Tổng quan' },
        { path: '/admin/events', icon: <FaMusic />, text: 'Quản lý sự kiện' },
        {
            path: '/admin/orders',
            icon: <FaShoppingCart />,
            text: 'Quản lý đơn hàng',
        },
        // { path: '/admin/tickets', icon: <FaTicketAlt />, text: 'Quản lý vé' },
        { path: '/admin/users', icon: <FaUsers />, text: 'Quản lý người dùng' },
    ];

    return (
        <div className={styles.layoutContainer}>
            {/* Sidebar */}
            <div
                className={`${styles.sidebar} ${
                    collapsed ? styles.sidebarCollapsed : ''
                }`}
            >
                <div className={styles.logo}>
                    <Link to="/">
                        <div
                            className={`${styles.logoText} ${
                                collapsed ? styles.logoTextHidden : ''
                            }`}
                        >
                            Melody Meet
                        </div>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className={styles.toggleButton}
                    >
                        {collapsed ? <FaBars /> : <FaTimes />}
                    </button>
                </div>

                <nav>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${styles.navItem} ${
                                location.pathname === item.path
                                    ? styles.active
                                    : ''
                            }`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span
                                className={`${styles.navText} ${
                                    collapsed ? styles.navTextHidden : ''
                                }`}
                            >
                                {item.text}
                            </span>
                            {location.pathname === item.path && !collapsed && (
                                <FaChevronRight
                                    size={12}
                                    style={{ marginLeft: 'auto' }}
                                />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div
                className={`${styles.content} ${
                    collapsed ? styles.contentExpanded : ''
                }`}
            >
                <header className={styles.header}>
                    <h3>
                        {navItems.find(
                            (item) => item.path === location.pathname,
                        )?.text || ''}
                    </h3>

                    <div
                        className="nav-item dropdown position-relative"
                        style={{ marginLeft: 'auto' }}
                    >
                        <div
                            className="nav-link dropdown-toggle d-flex align-items-center rounded"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{
                                cursor: 'pointer',
                                transition: 'background 0.3s',
                                padding: 0,
                            }}
                        >
                            <img
                                className="rounded-circle border border-2"
                                src={avatar}
                                alt="User Avatar"
                                width={36}
                                height={36}
                            />
                            <span className="ms-2 fw-semibold">Tài khoản</span>
                        </div>
                        <ul className="infoAccountEvent dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-1">
                            <li>
                                <Link
                                    className="dropdown-item py-2 d-flex align-items-center"
                                    to="/"
                                >
                                    <i className="bi bi-house-door me-2 text-primary fs-5" />
                                    <span>Trang chủ</span>
                                </Link>
                            </li>

                            <li>
                                <a
                                    className="dropdown-item py-2 d-flex align-items-center text-danger action-logout"
                                    href="#"
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                        swalCustomize.Toast.fire({
                                            icon: 'success',
                                            title: 'Đăng xuất thành công!',
                                        });
                                    }}
                                >
                                    <i className="bi bi-box-arrow-right me-2 fs-5" />
                                    <span>Đăng xuất</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </header>

                <Container fluid className="py-2">
                    <Outlet />
                </Container>
            </div>
        </div>
    );
};

export default Layout;
