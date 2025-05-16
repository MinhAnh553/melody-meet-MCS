import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import swalCustomize from '../../../util/swalCustomize';
import api from '../../../util/api';
import { useLoading } from '../../context/LoadingContext';

const CheckoutInfoModal = ({ show, onHide, onConfirm }) => {
    // const { showLoading, hideLoading } = useLoading();
    const { user, updateUser } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (show && user?.address) {
            setName(user.address.name || '');
            setPhone(user.address.phone || '');
            setEmail(user.address.email || '');
        } else {
            setEmail(user?.email);
        }
    }, [show, user]);

    const handleSubmit = async () => {
        // Kiểm tra bắt buộc 3 trường
        if (!name.trim() || !phone.trim() || !email.trim()) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập đầy đủ thông tin!',
            });
        }

        try {
            // showLoading();
            const buyerInfo = {
                name,
                phone,
                email,
            };
            // Gọi API update user
            const res = await api.updateUserInfo(buyerInfo);
            if (res.success) {
                // Thành công => gọi onConfirm => tiếp tục PayOS
                updateUser({
                    user: {
                        ...user,
                        address: buyerInfo,
                    },
                });

                onConfirm(buyerInfo);
            } else {
                return swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message || 'Cập nhật thông tin thất bại!',
                });
            }
        } catch (error) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Lỗi khi cập nhật thông tin: ' + error.message,
            });
        } finally {
            // hideLoading();
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cập nhật thông tin nhận vé</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <label className="form-label">Tên người nhận</label>
                    <input
                        type="text"
                        className="form-control text-dark"
                        placeholder="Nhập tên người nhận"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                        type="text"
                        className="form-control text-dark"
                        maxLength="10"
                        placeholder="Nhập số điện thoại"
                        value={phone}
                        onInput={(e) =>
                            (e.target.value = e.target.value.replace(/\D/g, ''))
                        }
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control text-dark"
                        placeholder="Nhập email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-secondary" onClick={onHide}>
                    Hủy
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                    Xác nhận
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default CheckoutInfoModal;
