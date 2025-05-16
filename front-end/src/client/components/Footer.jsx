import React from 'react';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer py-5">
            <div className="container">
                <div className="row gy-4">
                    <div className="col-lg-4">
                        <h4 className="text-white">
                            <Link to="/">
                                MelodyMeet
                                <img src={logo} alt="Logo" height={30} />
                            </Link>
                        </h4>
                        <p>
                            Nền tảng đáng tin cậy của bạn để khám phá và đặt chỗ
                            cho những sự kiện âm nhạc tuyệt vời.
                        </p>
                    </div>
                    <div className="col-lg-4">
                        <h4 className="text-white">Về công ty chúng tôi</h4>
                        <ul className="list-unstyled">
                            <li>
                                <a href="#">Quy chế hoạt động</a>
                            </li>
                            <li>
                                <a href="#">Chính sách bảo mật thông tin</a>
                            </li>
                            <li>
                                <a href="#">
                                    Cơ chế giải quyết tranh chấp/ khiếu nại
                                </a>
                            </li>
                            <li>
                                <a href="#">Chính sách bảo mật thanh toán</a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-lg-4">
                        <h4 className="text-white">Đăng ký nhận thông tin</h4>
                        <form className="newsletter-form">
                            <div className="input-group">
                                <input
                                    className="form-control"
                                    type="email"
                                    placeholder="Email của bạn"
                                />
                                <button className="btn btn-primary">
                                    Đăng ký
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
