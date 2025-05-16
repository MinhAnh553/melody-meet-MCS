import React, { useState } from 'react';

const PasswordStrengthIndicator = ({
    password,
    setPassword,
    strength,
    setStrength,
}) => {
    // Hàm kiểm tra độ mạnh mật khẩu
    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++; // Ít nhất 8 ký tự
        if (/[a-z]/.test(password)) strength++; // Chứa chữ thường
        if (/[A-Z]/.test(password)) strength++; // Chứa chữ in hoa
        if (/\d/.test(password)) strength++; // Chứa số
        if (/[@$!%*?&]/.test(password)) strength++; // Chứa ký tự đặc biệt
        return strength;
    };

    // Xử lý khi người dùng nhập mật khẩu
    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setStrength(checkPasswordStrength(newPassword));
    };

    // Tính toán thông số hiển thị cho thanh đo
    const updateStrengthIndicator = (strength) => {
        let percentage = strength * 20;
        let color = '';
        let text = '';

        switch (strength) {
            case 0:
            case 1:
                color = 'bg-danger'; // Rất yếu
                text = 'Rất yếu';
                break;
            case 2:
                color = 'bg-warning'; // Yếu
                text = 'Yếu';
                break;
            case 3:
                color = 'bg-info'; // Trung bình
                text = 'Trung bình (Hợp lệ ✅)';
                break;
            case 4:
                color = 'bg-primary'; // Mạnh
                text = 'Mạnh (Hợp lệ ✅)';
                break;
            case 5:
                color = 'bg-success'; // Rất mạnh
                text = 'Rất mạnh (Hợp lệ ✅)';
                break;
            default:
                color = 'bg-danger';
                text = 'Rất yếu';
        }

        return { percentage, color, text };
    };

    const { percentage, color, text } = updateStrengthIndicator(strength);

    return (
        <div>
            <div className="form-floating mb-3">
                <input
                    type="password"
                    className="form-control custom-input"
                    placeholder="Mật khẩu"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                />
                <label>Mật khẩu</label>
            </div>
            <div className="password-strength">
                <div className="progress">
                    <div
                        className={`progress-bar ${color}`}
                        role="progressbar"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <small style={{ color: strength < 3 ? 'red' : 'green' }}>
                    {password === '' ? '' : text}
                </small>
            </div>
        </div>
    );
};

export default PasswordStrengthIndicator;
