import React, { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../util/api';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import swalCustomize from '../../util/swalCustomize';
import OTPInput from './OTPInput';
import { useEffect } from 'react';
import LoadingButton from './loading/LoadingButton';
import { useLoading } from '../context/LoadingContext';

const Register = () => {
    const { showLoading, hideLoading } = useLoading();
    const [currentStep, setCurrentStep] = useState('registration');

    useEffect(() => {
        if (currentStep === 'complete') {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.parentNode.removeChild(backdrop);
            }
            document.body.classList.remove('modal-open');
        }
    }, [currentStep]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [strength, setStrength] = useState(0);

    const [otp, setOtp] = useState(Array(4).fill(''));

    // Loading button
    const [loading, setLoading] = useState(false);

    // Hàm xử lý khi thay đổi input của form đăng ký
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    // Hàm khi submit form đăng ký
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        // Validate dữ liệu
        if (strength < 3) {
            return Swal.fire({
                icon: 'error',
                title: 'Mật khẩu không hợp lệ!',
                text: 'Mật khẩu quá yếu! Vui lòng nhập mật khẩu mạnh hơn.',
                confirmButtonText: 'OK',
            });
        }
        if (formData.password !== formData.confirmPassword) {
            return Swal.fire({
                icon: 'error',
                title: 'Mật khẩu không khớp!',
                text: 'Vui lòng nhập lại mật khẩu.',
                confirmButtonText: 'OK',
            });
        }

        // Xử lý logic
        setLoading(true);
        try {
            // Gửi OTP
            const res = await api.sendOTP({ email: formData.email });
            if (res.success) {
                setCurrentStep('verification');
                setOtp(Array(4).fill(''));
                return swalCustomize.Toast.fire({
                    icon: 'success',
                    title: res.message,
                });
            } else {
                return swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message,
                });
            }
        } catch (error) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            });
        } finally {
            setLoading(false);
        }
    };

    // Hàm khi gửi form xác minh OTP
    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        const valueOTP = otp?.join('') || '';

        if (!valueOTP) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập mã xác minh.',
            });
        }

        showLoading();
        try {
            const res = await api.verifyOTPAndRegister(
                formData.email,
                valueOTP,
                formData.password,
            );
            if (res.success) {
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: res.message,
                });

                setCurrentStep('complete');
                return;
            } else {
                return swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message,
                });
            }
        } catch (error) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            });
        } finally {
            hideLoading();
        }
    };

    if (currentStep === 'complete') {
        const closeBtn = document.querySelector(
            '.btn-close[data-bs-dismiss="modal"]',
        );
        const loginBtn = document.querySelector(
            '[data-bs-target="#loginModal"]',
        );
        if (closeBtn) {
            closeBtn.click();
            setTimeout(() => {
                document.activeElement.blur();
                if (loginBtn) {
                    loginBtn.click();
                }
            }, 300);
        }
        return null;
    }

    return (
        <div
            className="modal fade"
            id="registerModal"
            tabIndex={-1}
            aria-labelledby="registerModalLabel"
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
                            id="registerModalLabel"
                        >
                            Đăng ký tài khoản
                        </h4>
                        <button
                            className="btn-close"
                            style={{
                                filter: 'invert(0)',
                            }}
                            type="button"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        />
                    </div>
                    <div className="modal-body p-4">
                        {currentStep === 'registration' && (
                            <div id="registrationStep">
                                <div className="text-center mb-4">
                                    <div className="registration-icon-wrapper mb-3">
                                        <i className="bi bi-person-circle registration-icon" />
                                    </div>
                                </div>
                                <form
                                    className="custom-form text-dark"
                                    id="registerForm"
                                    onSubmit={handleRegisterSubmit}
                                >
                                    <div className="form-floating mb-3">
                                        <input
                                            className="form-control custom-input"
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required="required"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="email">
                                            <i className="bi bi-envelope me-2" />
                                            Email
                                        </label>
                                    </div>
                                    <PasswordStrengthIndicator
                                        password={formData.password}
                                        setPassword={(newPassword) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: newPassword,
                                            }))
                                        }
                                        strength={strength}
                                        setStrength={setStrength}
                                    />
                                    <div className="form-floating mb-4">
                                        <input
                                            className="form-control custom-input"
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Nhập lại mật khẩu"
                                            required="required"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                        />
                                        <label htmlFor="confirmPassword">
                                            <i className="bi bi-shield-lock me-2" />
                                            Nhập lại mật khẩu
                                        </label>
                                    </div>
                                    {/* <button
                                        className="btn btn-primary btn-lg w-100 mb-3 custom-button"
                                        type="submit"
                                    >
                                        Tiếp Tục
                                    </button> */}
                                    <LoadingButton
                                        loading={loading}
                                        className="btn btn-primary btn-lg w-100 mb-3 custom-button"
                                        type="submit"
                                    >
                                        Tiếp Tục
                                    </LoadingButton>
                                    <div className="text-center">
                                        <span className="text-muted">
                                            Đã có tài khoản?
                                            <a
                                                className="text-primary text-decoration-none ms-2"
                                                href="#"
                                                data-bs-toggle="modal"
                                                data-bs-target="#loginModal"
                                                data-bs-dismiss="modal"
                                            >
                                                Đăng nhập
                                            </a>
                                        </span>
                                    </div>
                                </form>
                            </div>
                        )}
                        {currentStep === 'verification' && (
                            <div id="verificationStep">
                                <div className="text-center mb-4">
                                    <div className="verification-icon-wrapper mb-3">
                                        <i className="bi bi-shield-check verification-icon" />
                                    </div>
                                    <h5 className="mb-3">
                                        Xác Minh Email Của Bạn
                                    </h5>
                                    <p className="text-muted my-email">
                                        Chúng tôi đã gửi mã xác minh đến{' '}
                                        <span className="text-primary">{`"${formData.email}"`}</span>
                                    </p>
                                    <p className="text-muted">
                                        Lưu ý: Vui lòng kiểm tra tất cả các thư
                                        mục của email (Hộp thư đến, Quảng cáo,
                                        Thư rác,...)
                                    </p>
                                </div>
                                <form
                                    id="verificationForm"
                                    onSubmit={handleVerificationSubmit}
                                >
                                    <OTPInput otp={otp} onOtpChange={setOtp} />
                                    <button
                                        className="btn btn-primary btn-lg w-100 mb-3 custom-button"
                                        type="submit"
                                    >
                                        Tiếp Tục
                                    </button>
                                    <button
                                        className="btn btn-link w-100"
                                        id="backToRegister"
                                        type="button"
                                        onClick={() =>
                                            setCurrentStep('registration')
                                        }
                                    >
                                        Quay Lại
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
