import React, { useState, useEffect } from 'react';
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
    FaUserPlus,
} from 'react-icons/fa';
import avatar from '../../../assets/images/avatar.png';
import swalCustomize from '../../../util/swalCustomize';
import styles from './Layout.module.css';
import { useAuth } from '../../../client/context/AuthContext';

const Layout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const location = useLocation();

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setShowSidebar(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setShowSidebar(!showSidebar);
        } else {
            setCollapsed(!collapsed);
        }
    };

    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            setShowSidebar(false);
        }
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
        {
            path: '/admin/upgrade-requests',
            icon: <FaUserPlus />,
            text: 'Quản lý yêu cầu nâng cấp',
        },
    ];

    return (
        <div className={styles.layoutContainer}>
            {/* Mobile Overlay */}
            {showSidebar && (
                <div
                    className={`${styles.sidebarOverlay} ${
                        showSidebar ? styles.show : ''
                    }`}
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div
                className={`${styles.sidebar} ${
                    collapsed ? styles.sidebarCollapsed : ''
                } ${showSidebar ? styles.show : ''}`}
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
                        className={`${styles.toggleButton} d-md-none`}
                    >
                        {showSidebar ? <FaTimes /> : <FaBars />}
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
                            onClick={closeSidebar}
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
                <header
                    className={`${styles.header} d-flex align-items-center`}
                >
                    <button
                        className={`${styles.toggleButton} d-md-none me-3`}
                        onClick={toggleSidebar}
                    >
                        <FaBars />
                    </button>
                    <h3 className="mb-0">
                        {navItems.find(
                            (item) => item.path === location.pathname,
                        )?.text || ''}
                    </h3>

                    <div className="nav-item dropdown ms-auto">
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
                            <span className="ms-2 d-none d-md-inline fw-semibold">
                                Tài khoản
                            </span>
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
                                    onClick={(e) => {
                                        logout();
                                    }}
                                >
                                    <i className="bi bi-box-arrow-right me-2 fs-5" />
                                    <span>Đăng xuất</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </header>

                <Container fluid className="py-3">
                    <Outlet />
                </Container>
            </div>
        </div>
    );
};

export default Layout;
