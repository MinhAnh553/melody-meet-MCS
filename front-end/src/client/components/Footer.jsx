import React from 'react';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';

const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }
};

const Footer = () => {
    return (
        <footer className="footer py-5">
            <div className="container">
                {/* Main Footer Content */}
                <div className="row gy-4 mb-4">
                    {/* Company Info */}
                    <div className="col-lg-4 col-md-6">
                        <div className="footer-brand mb-4">
                            <Link
                                to="/"
                                className="d-flex align-items-center text-decoration-none"
                            >
                                <img
                                    src={logo}
                                    alt="MelodyMeet Logo"
                                    height={40}
                                    className="me-2"
                                />
                                <h4 className="text-white mb-0 fw-bold">
                                    MelodyMeet
                                </h4>
                            </Link>
                        </div>
                        <p className="text-white mb-4">
                            Nền tảng đáng tin cậy của bạn để khám phá và đặt chỗ
                            cho những sự kiện âm nhạc tuyệt vời. Kết nối với
                            cộng đồng âm nhạc và tạo ra những kỷ niệm đáng nhớ.
                        </p>
                        <div className="social-links">
                            <a
                                href="#"
                                className="social-link me-3"
                                title="Facebook"
                            >
                                <i className="bi bi-facebook text-white fs-5"></i>
                            </a>
                            <a
                                href="#"
                                className="social-link me-3"
                                title="Instagram"
                            >
                                <i className="bi bi-instagram text-white fs-5"></i>
                            </a>
                            <a
                                href="#"
                                className="social-link me-3"
                                title="Twitter"
                            >
                                <i className="bi bi-twitter text-white fs-5"></i>
                            </a>
                            <a
                                href="#"
                                className="social-link me-3"
                                title="YouTube"
                            >
                                <i className="bi bi-youtube text-white fs-5"></i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-lg-2 col-md-6 d-none d-md-block">
                        <h5 className="text-white mb-3 fw-bold">Khám Phá</h5>
                        <ul className="list-unstyled footer-links">
                            <li className="mb-2">
                                <Link
                                    to="/search"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    <i className="bi bi-search me-2"></i>
                                    Tìm Sự Kiện
                                </Link>
                            </li>
                            <li className="mb-2">
                                <Link
                                    to="/event/create"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Tạo Sự Kiện
                                </Link>
                            </li>
                            <li className="mb-2">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('trendingEvents');
                                    }}
                                    className="text-white text-decoration-none hover-white"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className="bi bi-fire me-2"></i>
                                    Sự Kiện Xu Hướng
                                </a>
                            </li>
                            <li className="mb-2">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        scrollToSection('upcomingEvents');
                                    }}
                                    className="text-white text-decoration-none hover-white"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Sắp Diễn Ra
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Info */}
                    <div className="col-lg-3 col-md-6 d-none d-md-block">
                        <h5 className="text-white mb-3 fw-bold">
                            Về Chúng Tôi
                        </h5>
                        <ul className="list-unstyled footer-links">
                            <li className="mb-2">
                                <a
                                    href="#"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    <i className="bi bi-file-text me-2"></i>
                                    Quy Chế Hoạt Động
                                </a>
                            </li>
                            <li className="mb-2">
                                <a
                                    href="#"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    <i className="bi bi-shield-check me-2"></i>
                                    Chính Sách Bảo Mật
                                </a>
                            </li>
                            <li className="mb-2">
                                <a
                                    href="#"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    <i className="bi bi-headset me-2"></i>
                                    Hỗ Trợ Khách Hàng
                                </a>
                            </li>
                            <li className="mb-2">
                                <a
                                    href="#"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    <i className="bi bi-credit-card me-2"></i>
                                    Chính Sách Thanh Toán
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="col-lg-3 col-md-6">
                        <h5 className="text-white mb-3 fw-bold">
                            Hỗ Trợ Khách Hàng
                        </h5>
                        <p className="text-white mb-3">
                            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Liên hệ
                            ngay để được tư vấn và giải đáp thắc mắc.
                        </p>
                        <div className="contact-info">
                            <p className="text-white mb-2">
                                <i className="bi bi-envelope me-2"></i>
                                support@melodymeet.com
                            </p>
                            <p className="text-white mb-2">
                                <i className="bi bi-telephone me-2"></i>
                                +84 123 456 789
                            </p>
                            <p className="text-white mb-2">
                                <i className="bi bi-clock me-2"></i>
                                Hỗ trợ: 8:00 - 22:00
                            </p>
                            <p className="text-white mb-0">
                                <i className="bi bi-chat-dots me-2"></i>
                                Live Chat: Có sẵn
                            </p>
                        </div>
                        {/* <div className="support-buttons mt-3">
                            <a
                                href="#"
                                className="btn btn-outline-light btn-sm me-2 mb-2"
                            >
                                <i className="bi bi-question-circle me-1"></i>
                                FAQ
                            </a>
                            <a
                                href="#"
                                className="btn btn-outline-light btn-sm me-2 mb-2"
                            >
                                <i className="bi bi-headset me-1"></i>
                                Hỗ Trợ
                            </a>
                            <a
                                href="#"
                                className="btn btn-outline-light btn-sm mb-2"
                            >
                                <i className="bi bi-chat me-1"></i>
                                Chat
                            </a>
                        </div> */}
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom pt-4 border-top border-secondary">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <p className="text-white mb-0">
                                © 2025 MelodyMeet. Tất cả quyền được bảo lưu.
                            </p>
                        </div>
                        <div className="col-md-6 text-md-end">
                            <div className="footer-bottom-links">
                                <a
                                    href="#"
                                    className="text-white text-decoration-none me-3 hover-white"
                                >
                                    Điều Khoản Sử Dụng
                                </a>
                                <a
                                    href="#"
                                    className="text-white text-decoration-none me-3 hover-white"
                                >
                                    Chính Sách Riêng Tư
                                </a>
                                <a
                                    href="#"
                                    className="text-white text-decoration-none hover-white"
                                >
                                    Cookie Policy
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
