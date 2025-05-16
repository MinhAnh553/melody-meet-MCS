import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SidebarEvent = () => {
    // Quản lý tab active
    const [activeTab, setActiveTab] = useState('event');
    const navigate = useNavigate();

    const handleNavigation = (tab, path) => {
        setActiveTab(tab);
        navigate(path);
    };

    return (
        <div className="sidebar p-3 bg-dark text-light">
            <h4
                className="text-success mb-4 d-flex align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                    navigate('/');
                }}
            >
                <i className="bi bi-gear-fill me-2"></i>Quản Lý Sự Kiện
            </h4>

            <ul className="nav flex-column">
                {/* Sự kiện của tôi */}
                <li className="nav-item mb-2">
                    <a
                        href="#"
                        className={`nav-link text-light d-flex align-items-center ${
                            activeTab === 'event' ? 'active' : ''
                        }`}
                        onClick={(e) => {
                            e.preventDefault(); // Ngăn reload trang
                            handleNavigation('event', '/event');
                        }}
                    >
                        <i className="bi bi-calendar-event me-2"></i>
                        <span>Sự kiện của tôi</span>
                    </a>
                </li>

                {/* Quản lý báo cáo */}
                {/* <li className="nav-item mb-2">
                    <a
                        href="#"
                        className={`nav-link text-light d-flex align-items-center ${
                            activeTab === 'report' ? 'active' : ''
                        }`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigation('report', '/report');
                        }}
                    >
                        <i className="bi bi-bar-chart-line me-2"></i>
                        <span>Quản lý báo cáo</span>
                    </a>
                </li> */}

                {/* Điều khoản cho Ban tổ chức */}
                {/* <li className="nav-item mb-2">
                    <a
                        href="#"
                        className={`nav-link text-light d-flex align-items-center ${
                            activeTab === 'terms' ? 'active' : ''
                        }`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigation('terms', '/terms');
                        }}
                    >
                        <i className="bi bi-file-earmark-text me-2"></i>
                        <span>Điều khoản cho Ban tổ chức</span>
                    </a>
                </li> */}
            </ul>
        </div>
    );
};

export default SidebarEvent;
