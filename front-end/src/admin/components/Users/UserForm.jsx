import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import styles from './Users.module.css';
import PhoneInput from 'react-phone-input-2';
import { isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-input-2/lib/style.css';
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaLock,
    FaUserTag,
    FaToggleOn,
} from 'react-icons/fa';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'client',
        status: 'active',
        phone: '',
        password: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                status: user.status || 'active',
                role: user.role || 'client',
                phone: user.phone || '',
                password: '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error when user types
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null,
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = 'Tên người dùng là bắt buộc';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Tên người dùng phải có ít nhất 2 ký tự';
        } else if (formData.name.length > 50) {
            newErrors.name = 'Tên người dùng không được vượt quá 50 ký tự';
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        // Validate phone using libphonenumber-js
        if (formData.phone) {
            try {
                if (!isValidPhoneNumber(formData.phone, 'VN')) {
                    newErrors.phone = 'Số điện thoại không hợp lệ';
                }
            } catch (error) {
                newErrors.phone = 'Số điện thoại không hợp lệ';
            }
        }

        // Validate password for new user
        if (!user && !formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        // Validate role
        if (!formData.role) {
            newErrors.role = 'Vai trò là bắt buộc';
        }

        // Validate status
        if (!formData.status) {
            newErrors.status = 'Trạng thái là bắt buộc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneChange = (phone) => {
        setFormData({ ...formData, phone });
        // Clear phone error when user types
        if (errors.phone) {
            setErrors({
                ...errors,
                phone: null,
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Prepare the data (omit confirmPassword)
        const { confirmPassword, ...userData } = formData;

        // If editing and password is empty, don't send password
        if (user && !userData.password) {
            delete userData.password;
        }

        onSubmit(user._id, userData);
    };

    return (
        <div className={styles.userDetailsCard}>
            <Form onSubmit={handleSubmit}>
                {/* Thông tin cơ bản */}
                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <FaUser className={styles.sectionIcon} />
                        <h4 className={styles.sectionTitle}>
                            Thông tin cơ bản
                        </h4>
                    </div>
                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <FaUser className={styles.inputIcon} />
                            Tên người dùng
                        </Form.Label>
                        <Form.Control
                            className={`${styles.formControl} ${
                                errors.name ? styles.isInvalid : ''
                            }`}
                            autoComplete="off"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên người dùng"
                            isInvalid={!!errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.name}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <FaEnvelope className={styles.inputIcon} />
                            Email
                        </Form.Label>
                        <Form.Control
                            className={`${styles.formControl} ${
                                errors.email ? styles.isInvalid : ''
                            }`}
                            autoComplete="off"
                            disabled
                            style={{
                                cursor: 'not-allowed',
                            }}
                            type="email"
                            name="email"
                            readOnly
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Nhập email"
                            isInvalid={!!errors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.email}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <FaPhone className={styles.inputIcon} />
                            Số điện thoại
                        </Form.Label>
                        <PhoneInput
                            country={'vn'}
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            inputClass={`${styles.formControl} ${
                                errors.phone ? styles.isInvalid : ''
                            }`}
                            inputStyle={{
                                width: '100%',
                                height: '45px',
                                padding: '0 60px',
                                paddingTop: '3px',
                            }}
                            containerStyle={{ width: '100%' }}
                            enableSearch={true}
                            preferredCountries={['vn']}
                            countryCodeEditable={false}
                            inputProps={{
                                name: 'phone',
                                required: false,
                                autoComplete: 'tel',
                            }}
                            isValid={(value) => {
                                if (!value) return true;
                                try {
                                    return isValidPhoneNumber(value, 'VN');
                                } catch (error) {
                                    return false;
                                }
                            }}
                        />
                        {errors.phone && (
                            <div className="invalid-feedback d-block">
                                {errors.phone}
                            </div>
                        )}
                    </Form.Group>
                </div>

                {/* Thông tin tài khoản */}
                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <FaUserTag className={styles.sectionIcon} />
                        <h4 className={styles.sectionTitle}>
                            Thông tin tài khoản
                        </h4>
                    </div>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <FaUserTag className={styles.inputIcon} />
                            Vai trò
                        </Form.Label>
                        <Form.Select
                            className={`${styles.formControl} ${
                                errors.role ? styles.isInvalid : ''
                            }`}
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="client">Khách hàng</option>
                            <option value="organizer">Tổ chức sự kiện</option>
                            <option value="admin">Quản trị viên</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.role}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <FaToggleOn className={styles.inputIcon} />
                            Trạng thái
                        </Form.Label>
                        <Form.Select
                            className={`${styles.formControl} ${
                                errors.status ? styles.isInvalid : ''
                            }`}
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.status}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            <FaLock className={styles.inputIcon} />
                            {user
                                ? 'Mật khẩu mới (để trống nếu không đổi)'
                                : 'Mật khẩu'}
                        </Form.Label>
                        <Form.Control
                            className={`${styles.formControl} ${
                                errors.password ? styles.isInvalid : ''
                            }`}
                            autoComplete="off"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={
                                user ? 'Nhập mật khẩu mới' : 'Nhập mật khẩu'
                            }
                            isInvalid={!!errors.password}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password}
                        </Form.Control.Feedback>
                    </Form.Group>
                </div>
            </Form>
        </div>
    );
};

export default UserForm;
