import React, { useContext } from 'react';
import avatar from '../../assets/images/avatar.png';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import swalCustomize from '../../util/swalCustomize';

const HeaderEvent = ({ loading, currentStep, onStepClick, name }) => {
    const { eventId } = useParams();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const steps = ['Thông tin sự kiện', 'Thời gian & Loại vé'];

    const allowStepNavigation = currentStep > 1;

    return (
        <div className="header">
            <div className="w-100 step-container gap-2 flex-wrap">
                {(location.pathname === '/event/create' ||
                    location.pathname === `/event/${eventId}/edit`) && (
                    <>
                        {steps.map((label, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = stepNumber < currentStep;
                            const isClickable =
                                allowStepNavigation ||
                                stepNumber <= currentStep;

                            return (
                                <div
                                    key={stepNumber}
                                    className={`step ${
                                        currentStep === stepNumber
                                            ? 'active'
                                            : ''
                                    } ${
                                        isClickable ? 'clickable' : 'disabled'
                                    }`}
                                    onClick={
                                        isClickable
                                            ? () => onStepClick(stepNumber)
                                            : undefined
                                    }
                                >
                                    <span
                                        style={{
                                            display: 'flex',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            backgroundColor: isCompleted
                                                ? '#28a745'
                                                : '#ccc',
                                            color: isCompleted
                                                ? '#fff'
                                                : '#000',
                                            textAlign: 'center',
                                            marginRight: '8px',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {isCompleted ? (
                                            <i
                                                className="bi bi-check"
                                                style={{ fontSize: '12px' }}
                                            ></i>
                                        ) : (
                                            stepNumber
                                        )}
                                    </span>
                                    {label}
                                </div>
                            );
                        })}
                        <button
                            className="btn"
                            type="submit"
                            form="eventForm"
                            style={{
                                backgroundColor: 'rgb(45 194 117)',
                                color: '#fff',
                            }}
                            id="submitEvent"
                            disabled={loading}
                        >
                            {loading
                                ? 'Đang tải...'
                                : currentStep === steps.length
                                ? 'Hoàn thành'
                                : 'Tiếp tục'}
                        </button>
                    </>
                )}

                {location.pathname === '/event' && (
                    <div className="text-light d-flex align-items-center">
                        <h3 className="mb-0">Sự kiện của tôi</h3>
                    </div>
                )}

                {name != '' && (
                    <div className="text-light d-flex align-items-center">
                        <h3
                            className="mb-0 text-truncate d-inline-block"
                            style={{ maxWidth: '700px' }}
                        >
                            {name}
                        </h3>
                    </div>
                )}

                <ul className="navbar-nav mb-md-2 mb-lg-0 ms-md-auto gap-2 flex-row align-items-center justify-content-end">
                    {location.pathname !== '/event/create' && (
                        <li className="nav-item">
                            <Link
                                className="nav-link create-event"
                                to="/event/create"
                            >
                                Tạo sự kiện
                            </Link>
                        </li>
                    )}
                    {/* <li className="nav-item dropdown position-relative">
                        <div
                            className="nav-link dropdown-toggle d-flex align-items-center p-2 rounded"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{
                                cursor: 'pointer',
                                transition: 'background 0.3s',
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
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3">
                            <li>
                                <a
                                    className="dropdown-item py-2 d-flex align-items-center"
                                    href="#"
                                >
                                    <i className="bi bi-ticket-perforated me-2 text-primary fs-5" />
                                    <span>Vé Đã Mua</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    className="dropdown-item py-2 d-flex align-items-center"
                                    href="#"
                                >
                                    <i className="bi bi-calendar-event me-2 text-success fs-5" />
                                    <span>Sự Kiện Của Tôi</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    className="dropdown-item py-2 d-flex align-items-center"
                                    href="#"
                                >
                                    <i className="bi bi-person me-2 text-warning fs-5" />
                                    <span>Trang Cá Nhân</span>
                                </a>
                            </li>
                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li>
                                <a
                                    className="dropdown-item py-2 d-flex align-items-center text-danger action-logout"
                                    href="#"
                                >
                                    <i className="bi bi-box-arrow-right me-2 fs-5" />
                                    <span>Đăng xuất</span>
                                </a>
                            </li>
                        </ul>
                    </li> */}
                    <li>
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
                                <span className="ms-2 fw-semibold">
                                    Tài khoản
                                </span>
                            </div>
                            <ul className="infoAccountEvent dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-1">
                                {user?.role === 'admin' && (
                                    <li>
                                        <Link
                                            className="dropdown-item py-2 d-flex align-items-center"
                                            to="/admin"
                                        >
                                            <i className="bi bi-shield-lock me-2 text-danger fs-5" />
                                            <span>Trang Quản Trị</span>
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
                                {/* <li>
                                    <a
                                        className="dropdown-item py-2 d-flex align-items-center"
                                        href="#"
                                    >
                                        <i className="bi bi-person me-2 text-warning fs-5" />
                                        <span>Trang Cá Nhân</span>
                                    </a>
                                </li> */}
                                <li>
                                    <hr className="dropdown-divider" />
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
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default HeaderEvent;
