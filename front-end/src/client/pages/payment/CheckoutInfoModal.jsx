import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import 'react-phone-input-2/lib/bootstrap.css';
import swalCustomize from '../../../util/swalCustomize';
import api from '../../../util/api';
import { useLoading } from '../../context/LoadingContext';

const CheckoutInfoModal = ({ show, onHide, onConfirm }) => {
    // const { showLoading, hideLoading } = useLoading();
    const { user } = useAuth();
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

        if (!isValidPhoneNumber('+' + phone)) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Số điện thoại không hợp lệ!',
            });
        }

        // showLoading();
        const buyerInfo = {
            name,
            phone,
            email,
        };
        // Gọi API update user
        const res = await api.updateUserAddress(buyerInfo);

        // Thành công => gọi onConfirm => tiếp tục PayOS
        onConfirm(buyerInfo);
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
                    <PhoneInput
                        country={'vn'}
                        value={phone}
                        onChange={(phone) => setPhone(phone)}
                        inputClass="form-control text-dark"
                        inputStyle={{
                            width: '100%',
                            height: '48px',
                            padding: '0 60px',
                            paddingTop: '3px',
                        }}
                        containerStyle={{ width: '100%' }}
                        enableSearch={true}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control text-dark"
                        placeholder="Nhập email"
                        value={email}
                        disabled
                        style={{
                            cursor: 'not-allowed',
                        }}
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
