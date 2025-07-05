import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import avatar from '../../assets/images/avatar.png';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { permissions } from '../../config/rbacConfig';
import styles from '../styles/Header.module.css';

const Header = () => {
    const { user, logout } = useAuth();
    const { hasPermission } = usePermission(user?.role);

    return (
        <header className={`fixed-top ${styles.header}`}>
            <nav className={`navbar navbar-expand-lg ${styles.navbar}`}>
                <div className="container-fluid">
                    <Link
                        className={`navbar-brand ${styles.navbarBrand}`}
                        to="/"
                    >
                        MelodyMeet
                        <img src={logo} alt="Logo" height={30} />
                    </Link>

                    {/* Reponsive */}
                    <div className="d-flex d-lg-none align-items-center">
                        <Link
                            to="/search"
                            className="text-white"
                            style={{
                                width: '2.2rem',
                                height: '2.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderRadius: '50%',
                                border: '1px solid rgba(235, 235, 240, 0.565)',
                            }}
                        >
                            <i
                                className="bi bi-search"
                                style={{
                                    transform: 'scale(1.1)',
                                }}
                            />
                        </Link>
                        {user ? (
                            <>
                                <div
                                    className="dropdown-toggle me-2 ms-3 d-flex align-items-center"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <div
                                        className={`d-flex align-items-center justify-content-center rounded-circle ${styles.avatar}`}
                                    >
                                        {user
                                            ? user.name
                                                ? user.name
                                                      .charAt(0)
                                                      .toUpperCase()
                                                : user.email
                                                ? user.email
                                                      .charAt(0)
                                                      .toUpperCase()
                                                : 'A'
                                            : 'A'}
                                    </div>
                                </div>

                                <ul
                                    className={`dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-1 me-2`}
                                >
                                    {hasPermission(permissions.VIEW_ADMIN) && (
                                        <li>
                                            <Link
                                                className={`dropdown-item py-2 d-flex align-items-center ${styles.dropdownItem}`}
                                                to="/admin"
                                            >
                                                <i className="bi bi-shield-lock me-2 text-danger fs-5" />
                                                <span>Trang Quản Trị</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <Link
                                            className={`dropdown-item py-2 d-flex align-items-center ${styles.dropdownItem}`}
                                            to="/my-tickets"
                                        >
                                            <i className="bi bi-ticket-perforated me-2 text-primary fs-5" />
                                            <span>Vé Đã Mua</span>
                                        </Link>
                                    </li>

                                    {hasPermission(
                                        permissions.VIEW_ORGANIZERS,
                                    ) && (
                                        <li>
                                            <Link
                                                className={`dropdown-item py-2 d-flex align-items-center ${styles.dropdownItem}`}
                                                to="/organizer/event"
                                            >
                                                <i className="bi bi-calendar-event me-2 text-success fs-5" />
                                                <span>Sự Kiện Của Tôi</span>
                                            </Link>
                                        </li>
                                    )}

                                    <li>
                                        <hr className="dropdown-divider" />
                                    </li>
                                    <li>
                                        <button
                                            className={`dropdown-item py-2 d-flex align-items-center text-danger action-logout ${styles.dropdownItem}`}
                                            onClick={() => {
                                                logout();
                                            }}
                                        >
                                            <i className="bi bi-box-arrow-right me-2 fs-5" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </li>
                                </ul>
                            </>
                        ) : (
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#loginModal"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                    {/*  */}
                    <div
                        className="collapse navbar-collapse justify-content-between"
                        id="navbarContent"
                    >
                        <SearchBar />
                        <ul className="navbar-nav mb-2 mb-lg-0 gap-2 align-items-center">
                            {/* {hasPermission(permissions.VIEW_ORGANIZERS) && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${styles.createEvent}`}
                                        to={
                                            user?.role === 'client'
                                                ? '/user/upgrade'
                                                : '/organizer/event/create'
                                        }
                                    >
                                        Tạo sự kiện
                                    </Link>
                                </li>
                            )} */}

                            {hasPermission(permissions.VIEW_CREATE_EVENT) && (
                                <li className="nav-item">
                                    <Link
                                        className={`nav-link ${styles.createEvent}`}
                                        to={
                                            user?.role === 'client'
                                                ? '/user/upgrade'
                                                : '/organizer/event/create'
                                        }
                                    >
                                        Tạo sự kiện
                                    </Link>
                                </li>
                            )}
                            <li className="nav-item">
                                <Link
                                    className={`nav-link ${styles.navLink} d-flex align-items-center`}
                                    to="/my-tickets"
                                >
                                    <i className="bi bi-ticket-perforated me-2" />
                                    Vé đã mua
                                </Link>
                            </li>
                            <li>
                                {user !== null ? (
                                    <div
                                        className={`nav-item dropdown position-relative ${styles.dropdown}`}
                                    >
                                        <div
                                            className={`nav-link dropdown-toggle d-flex align-items-center rounded ${styles.dropdownToggle}`}
                                            role="button"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            {/* <img
                                                className={styles.avatar}
                                                src={avatar}
                                                alt="User Avatar"
                                                width={36}
                                                height={36}
                                            /> */}
                                            <div
                                                className={`d-flex align-items-center justify-content-center rounded-circle ${styles.avatar}`}
                                            >
                                                {user
                                                    ? user.name
                                                        ? user.name
                                                              .charAt(0)
                                                              .toUpperCase()
                                                        : user.email
                                                        ? user.email
                                                              .charAt(0)
                                                              .toUpperCase()
                                                        : 'A'
                                                    : 'A'}
                                            </div>
                                            <span
                                                className={styles.email}
                                                title={user.email}
                                            >
                                                {user.email.length > 27
                                                    ? user.email.slice(0, 25) +
                                                      '...'
                                                    : user.email}
                                            </span>
                                        </div>
                                        <ul
                                            className={`dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 ${styles.dropdownMenu}`}
                                        >
                                            {hasPermission(
                                                permissions.VIEW_ADMIN,
                                            ) && (
                                                <li>
                                                    <Link
                                                        className={`dropdown-item py-2 d-flex align-items-center ${styles.dropdownItem}`}
                                                        to="/admin"
                                                    >
                                                        <i className="bi bi-shield-lock me-2 text-danger fs-5" />
                                                        <span>
                                                            Trang Quản Trị
                                                        </span>
                                                    </Link>
                                                </li>
                                            )}
                                            <li>
                                                <Link
                                                    className={`dropdown-item py-2 d-flex align-items-center ${styles.dropdownItem}`}
                                                    to="/my-tickets"
                                                >
                                                    <i className="bi bi-ticket-perforated me-2 text-primary fs-5" />
                                                    <span>Vé Đã Mua</span>
                                                </Link>
                                            </li>

                                            {hasPermission(
                                                permissions.VIEW_ORGANIZERS,
                                            ) && (
                                                <li>
                                                    <Link
                                                        className={`dropdown-item py-2 d-flex align-items-center ${styles.dropdownItem}`}
                                                        to="/organizer/event"
                                                    >
                                                        <i className="bi bi-calendar-event me-2 text-success fs-5" />
                                                        <span>
                                                            Sự Kiện Của Tôi
                                                        </span>
                                                    </Link>
                                                </li>
                                            )}

                                            <li>
                                                <hr className="dropdown-divider" />
                                            </li>
                                            <li>
                                                <button
                                                    className={`dropdown-item py-2 d-flex align-items-center text-danger action-logout ${styles.dropdownItem}`}
                                                    onClick={() => {
                                                        logout();
                                                    }}
                                                >
                                                    <i className="bi bi-box-arrow-right me-2 fs-5" />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className={styles.authButtons}>
                                        <button
                                            className="btn btn-outline-primary me-2"
                                            data-bs-toggle="modal"
                                            data-bs-target="#loginModal"
                                        >
                                            Đăng nhập
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            data-bs-toggle="modal"
                                            data-bs-target="#registerModal"
                                        >
                                            Đăng ký
                                        </button>
                                    </div>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
