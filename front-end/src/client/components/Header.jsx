import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import avatar from '../../assets/images/avatar.png';
import { useAuth } from '../context/AuthContext';
import swalCustomize from '../../util/swalCustomize';
import SearchBar from './SearchBar';

const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    return (
        <header className="fixed-top">
            <nav className="navbar navbar-expand-lg">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/">
                        MelodyMeet
                        <img src={logo} alt="Logo" height={30} />
                    </Link>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarContent"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>
                    <div
                        className="collapse navbar-collapse justify-content-between"
                        id="navbarContent"
                    >
                        <SearchBar />
                        <ul className="navbar-nav mb-2 mb-lg-0 gap-2 align-items-center">
                            <li className="nav-item">
                                <Link
                                    className="nav-link create-event"
                                    to="/event/create"
                                >
                                    Tạo sự kiện
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    className="nav-link custom-nav-link d-flex align-items-center"
                                    to="/my-tickets"
                                >
                                    <i className="bi bi-ticket-perforated me-2" />
                                    Vé đã mua
                                </Link>
                            </li>
                            <li>
                                {isAuthenticated ? (
                                    // Hiển thị avatar khi đã xác thực
                                    <div className="nav-item dropdown position-relative">
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
                                            <span
                                                className="ms-2 fw-semibold"
                                                style={{ cursor: 'pointer' }}
                                                title={user.email}
                                            >
                                                {user.email.length > 27
                                                    ? user.email.slice(0, 25) +
                                                      '...'
                                                    : user.email}
                                            </span>
                                        </div>
                                        <ul
                                            className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-1"
                                            style={{ right: 0 }}
                                        >
                                            {user?.role === 'admin' && (
                                                <li>
                                                    <Link
                                                        className="dropdown-item py-2 d-flex align-items-center"
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
                                                    className="dropdown-item py-2 d-flex align-items-center"
                                                    to="/my-tickets"
                                                >
                                                    <i className="bi bi-ticket-perforated me-2 text-primary fs-5" />
                                                    <span>Vé Đã Mua</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    className="dropdown-item py-2 d-flex align-items-center"
                                                    to="/event"
                                                >
                                                    <i className="bi bi-calendar-event me-2 text-success fs-5" />
                                                    <span>Sự Kiện Của Tôi</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <hr className="dropdown-divider" />
                                            </li>
                                            <li>
                                                <button
                                                    className="dropdown-item py-2 d-flex align-items-center text-danger action-logout"
                                                    onClick={() => {
                                                        logout();
                                                        navigate('/');
                                                        swalCustomize.Toast.fire(
                                                            {
                                                                icon: 'success',
                                                                title: 'Đăng xuất thành công!',
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <i className="bi bi-box-arrow-right me-2 fs-5" />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                ) : (
                                    // Nếu chưa đăng nhập, hiển thị nút đăng nhập/đăng ký
                                    <div className="auth-buttons d-flex">
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
