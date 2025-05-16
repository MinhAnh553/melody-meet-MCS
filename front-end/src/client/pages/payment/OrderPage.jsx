// src/pages/OrderPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sweetalert2 from 'sweetalert2';

import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import { useLoading } from '../../context/LoadingContext';

function OrderPage() {
    const { showLoading, hideLoading } = useLoading();
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0); // Thời gian còn lại (ms)

    // Lấy đơn hàng từ server
    useEffect(() => {
        const fetchData = async () => {
            showLoading();
            await fetchOrder();
            hideLoading();
        };

        fetchData();

        const interval = setInterval(() => {
            fetchOrder();
        }, 5000);

        return () => {
            clearInterval(interval); // ✅ Được gọi khi component unmount
        };
    }, []);

    const fetchOrder = async () => {
        try {
            const res = await api.getOrder(orderId);
            if (res.success) {
                setOrder(res.order);
                // Tính thời gian còn lại = expiredAt - now
                const diff =
                    new Date(res.order.expiredAt).getTime() - Date.now();
                setTimeLeft(diff > 0 ? diff : 0);
            } else if (res.reason === 'expired') {
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: 'Đơn hàng đã hết hạn!',
                });
                navigate(`/event/${res.eventId || ''}`);
            } else if (res.payment === true) {
                swalCustomize.Toast.fire({
                    icon: 'success',
                    title: 'Thanh toán thành công!',
                });
                navigate(`/my-tickets`);
            } else {
                navigate('/');
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: 'Không tìm thấy đơn hàng!',
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Lấy danh sách vé từ server
    useEffect(() => {
        const fetchTickets = async () => {
            showLoading();
            try {
                const res = await api.getOrderTickets(orderId);
                if (res.success) {
                    setTickets(res.tickets);
                }
            } catch (err) {
                console.error(err);
            } finally {
                hideLoading();
            }
        };

        fetchTickets();
    }, [orderId]);

    // Đồng hồ đếm ngược
    useEffect(() => {
        if (!order) return;
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const newVal = prev - 1000;
                if (newVal <= 0) {
                    clearInterval(timer);
                    swalCustomize.Toast.fire({
                        icon: 'error',
                        title: 'Đơn hàng đã hết hạn!',
                    });
                    navigate(`/event/${order?.eventId || ''}`);
                    return 0;
                }
                return newVal;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [order, timeLeft, navigate]);

    // Format thời gian mm:ss
    function formatCountdown(ms) {
        if (ms <= 0) return '00:00';
        const totalSec = Math.floor(ms / 1000);
        const mm = Math.floor(totalSec / 60);
        const ss = totalSec % 60;
        const mmStr = mm < 10 ? `0${mm}` : mm;
        const ssStr = ss < 10 ? `0${ss}` : ss;
        return `${mmStr}:${ssStr}`;
    }

    const handleBack = () => {
        sweetalert2
            .fire({
                title: 'Hủy đơn hàng?',
                text: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Có, hủy đơn',
                cancelButtonText: 'Không',
            })
            .then(async (result) => {
                if (result.isConfirmed) {
                    showLoading();
                    await api.cancelOrder({
                        orderId,
                    });
                    hideLoading();

                    navigate(`/event/${order?.eventId || ''}`);
                }
            });
    };

    const handleChoosePayOS = async () => {
        showLoading();
        try {
            const res = await api.selectPayment(orderId, 'payos');
            if (res.success) {
                // Redirect sang payUrl
                window.location.href = res.payUrl;
            } else if (res.reason === 'expired') {
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: 'Đơn hàng đã hết hạn!',
                });
                navigate(`/event/${order?.eventId || ''}`);
            } else {
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message || 'Chọn thanh toán thất bại!',
                });
                navigate(`/event/${order?.eventId || ''}`);
            }
        } catch (err) {
            console.error(err);
            swalCustomize.Toast.fire({
                icon: 'error',
                title: err.message || 'Server Error!',
            });
        } finally {
            hideLoading();
        }
    };

    // Tính chi tiết vé
    const renderTicketTable = () => {
        if (tickets.length === 0) {
            return <p>Không có vé nào</p>;
        }

        return (
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th className="text-start">Loại vé</th>
                        <th className="text-center">Số lượng</th>
                        <th className="text-end">Đơn giá</th>
                        <th className="text-end">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((item, i) => {
                        const subTotal = item.price * item.quantity;
                        return (
                            <tr key={i}>
                                <td className="text-start">{item.name}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-end">
                                    {item.price === 0
                                        ? 'Miễn phí'
                                        : item.price.toLocaleString('vi-VN') +
                                          'đ'}
                                </td>
                                <td className="text-end">
                                    {item.price === 0
                                        ? 'Miễn phí'
                                        : subTotal.toLocaleString('vi-VN') +
                                          'đ'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return order ? (
        <div
            className="min-vh-100 d-flex flex-column"
            style={{ color: '#fff' }}
        >
            <div className="container py-5 flex-grow-1">
                {/* Nút Quay Lại */}
                <button
                    className="btn btn-outline-light mb-3"
                    onClick={handleBack}
                >
                    <i className="bi bi-arrow-left"></i> Quay lại
                </button>

                <div
                    className="card mx-auto"
                    style={{
                        maxWidth: '700px',
                        border: 'none',
                    }}
                >
                    <div className="card-body">
                        <h2 className="card-title text-center mb-4">
                            Đơn Hàng #{order.orderId}
                        </h2>

                        <div className="mb-3">
                            <strong>Trạng thái:</strong>{' '}
                            {order.status === 'PENDING'
                                ? 'Chờ thanh toán'
                                : 'Không xác định'}
                        </div>
                        <div className="mb-3">
                            <strong>Tổng tiền:</strong>{' '}
                            {order.totalPrice.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="mb-3">
                            <strong>Hết hạn lúc:</strong>{' '}
                            {new Date(order.expiredAt).toLocaleString('vi-VN', {
                                hour12: false,
                            })}
                        </div>
                        <div className="mb-4">
                            <strong>Thời gian còn lại:</strong>{' '}
                            <span className="text-success fw-bold fs-5">
                                {formatCountdown(timeLeft)}
                            </span>
                        </div>

                        {/* Thông tin người mua */}
                        <hr />
                        <h4 className="mb-3">Thông tin người mua</h4>
                        <div className="mb-3">
                            <strong>Họ và tên:</strong>{' '}
                            {order.buyerInfo?.name || 'Chưa cập nhật'}
                        </div>
                        <div className="mb-3">
                            <strong>Số điện thoại:</strong>{' '}
                            {order.buyerInfo?.phone || 'Chưa cập nhật'}
                        </div>
                        <div className="mb-3">
                            <strong>Email:</strong>{' '}
                            {order.buyerInfo?.email || 'Chưa cập nhật'}
                        </div>

                        <hr />
                        <h4 className="mb-3">Danh sách vé</h4>
                        {renderTicketTable()}

                        <hr />
                        <h4 className="mb-3">Chọn phương thức thanh toán</h4>
                        <button
                            className="btn btn-success w-100"
                            onClick={handleChoosePayOS}
                        >
                            Thanh toán qua mã QR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;
}

export default OrderPage;
