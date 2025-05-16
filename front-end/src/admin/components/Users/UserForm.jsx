import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import styles from './Users.module.css';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
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
                role: user.role || 'user',
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

        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
        <Form onSubmit={handleSubmit}>
            <div className={styles.userFormGrid}>
                {/* Left Column */}
                <div>
                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Tên người dùng
                        </Form.Label>
                        <Form.Control
                            className={`text-dark ${styles.formControl}`}
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
                            Email
                        </Form.Label>
                        <Form.Control
                            className={`text-dark ${styles.formControl}`}
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
                            Số điện thoại
                        </Form.Label>
                        <Form.Control
                            className={`text-dark ${styles.formControl}`}
                            type="text"
                            name="phone"
                            maxLength={10}
                            value={formData.phone}
                            onInput={(e) =>
                                (e.target.value = e.target.value.replace(
                                    /\D/g,
                                    '',
                                ))
                            }
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại"
                        />
                    </Form.Group>
                </div>

                {/* Right Column */}
                <div>
                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Trạng thái
                        </Form.Label>
                        <Form.Select
                            className={styles.formControl} // Thêm class để đồng bộ style
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            Vai trò
                        </Form.Label>
                        <Form.Select
                            className={styles.formControl} // Đồng bộ style với input
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>
                            {user
                                ? 'Mật khẩu mới (để trống nếu không đổi)'
                                : 'Mật khẩu'}
                        </Form.Label>
                        <Form.Control
                            className={`text-dark ${styles.formControl}`}
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
            </div>

            <div className={styles.formActions}>
                <Button variant="secondary" onClick={onCancel}>
                    Hủy
                </Button>
                <Button variant="primary" type="submit">
                    {user ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </div>
        </Form>
    );
};

export default UserForm;
