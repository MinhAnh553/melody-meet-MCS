import React, { useContext, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        emailLogin: '',
        passwordLogin: '',
    });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        await login(formData.emailLogin, formData.passwordLogin);
    };

    return (
        <div
            className="modal fade"
            id="loginModal"
            tabIndex={-1}
            aria-labelledby="loginModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div
                    className="modal-content glass-effect"
                    style={{
                        background: '#fff',
                    }}
                >
                    <div className="modal-header border-0">
                        <h4
                            className="modal-title fw-bold text-dark"
                            id="loginModalLabel"
                        >
                            Đăng nhập
                        </h4>
                        <button
                            className="btn-close form-login"
                            style={{
                                filter: 'invert(0)',
                            }}
                            type="button"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        />
                    </div>
                    <div className="modal-body p-4">
                        <div className="text-center mb-4">
                            <div className="registration-icon-wrapper mb-3">
                                <i className="bi bi-person-circle registration-icon" />
                            </div>
                        </div>
                        <form
                            className="custom-form"
                            id="loginForm"
                            onSubmit={handleLoginSubmit}
                        >
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control custom-input text-dark"
                                    id="emailLogin"
                                    type="email"
                                    placeholder="name@example.com"
                                    required="required"
                                    value={formData.emailLogin}
                                    onChange={handleInputChange}
                                />
                                <label
                                    htmlFor="emailLogin"
                                    className="text-dark"
                                >
                                    <i className="bi bi-envelope me-2" />
                                    Email
                                </label>
                            </div>
                            <div className="form-floating mb-3">
                                <input
                                    className="form-control custom-input text-dark"
                                    id="passwordLogin"
                                    type="password"
                                    placeholder="Mật khẩu"
                                    required="required"
                                    value={formData.passwordLogin}
                                    onChange={handleInputChange}
                                />
                                <label
                                    htmlFor="passwordLogin"
                                    className="text-dark"
                                >
                                    <i className="bi bi-lock me-2" />
                                    Mật khẩu
                                </label>
                            </div>
                            <button
                                className="btn btn-primary btn-lg w-100 mb-3 custom-button"
                                type="submit"
                            >
                                Đăng nhập
                            </button>
                            <div className="text-center">
                                <span className="text-dark">
                                    Quên mật khẩu?
                                </span>
                            </div>
                            <div className="text-center">
                                <span className="text-muted">
                                    Chưa có tài khoản?
                                </span>
                                <a
                                    className="text-primary text-decoration-none ms-2"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#registerModal"
                                    data-bs-dismiss="modal"
                                >
                                    Tạo tài khoản
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
