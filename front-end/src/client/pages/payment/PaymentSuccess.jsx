import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../../../util/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLoading } from '../../context/LoadingContext';

function PaymentSuccess() {
    const { showLoading, hideLoading } = useLoading();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderCode = searchParams.get('orderCode'); // ?orderCode=xxx
    const [order, setOrder] = useState(null);
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        const fetchOrder = async () => {
            showLoading();
            try {
                if (!orderCode) return;
                // 1. Gọi API checkOrder => xác nhận
                await api.checkOrder({ orderCode });

                // 2. Lấy chi tiết đơn hàng
                const res = await api.getOrderByOrderId(orderCode);
                if (res.success) {
                    setOrder(res.order);
                }
            } catch (err) {
                console.error(err);
            } finally {
                hideLoading();
            }
        };
        fetchOrder();
    }, [orderCode]);

    // Lấy danh sách vé từ server
    useEffect(() => {
        const fetchTickets = async () => {
            showLoading();
            try {
                const res = await api.getOrderTickets(order._id);
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
    }, [order]);

    if (!order) {
        return showLoading();
    }

    // Tính tổng hiển thị
    const total = order.totalPrice.toLocaleString('vi-VN') + 'đ';

    // Tạo table hiển thị chi tiết vé
    const renderTickets = () => {
        if (tickets.length === 0) {
            return <p>Không có vé nào</p>;
        }
        return (
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th className="text-start">Mã vé</th>
                        <th className="text-start">Loại vé</th>
                        <th className="text-center">Số lượng</th>
                        <th className="text-end">Thành tiền</th>
                        <th className="text-center">Mã QR</th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((item, i) => {
                        const sub = item.price * item.quantity;
                        return (
                            <tr key={i} style={{ verticalAlign: 'middle' }}>
                                <td className="text-center">{item.ticketId}</td>
                                <td className="text-start">{item.name}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-end">
                                    {item.price === 0
                                        ? 'Miễn phí'
                                        : sub.toLocaleString('vi-VN') + 'đ'}
                                </td>
                                <td className="text-center">
                                    <QRCode
                                        value={item.ticketId + ''}
                                        size={100}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div className="bg-dark text-white min-vh-100 d-flex flex-column">
            <div className="container py-5 flex-grow-1 d-flex flex-column justify-content-center">
                <div className="card mx-auto" style={{ maxWidth: '700px' }}>
                    <div className="card-body text-center">
                        {/* Biểu tượng check */}
                        <i className="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
                        <h2 className="mb-4">Thanh toán thành công!</h2>

                        <p>
                            Mã đơn hàng:{' '}
                            <span className="fw-bold">{order.orderId}</span>
                        </p>
                        <p>
                            Trạng thái:{' '}
                            <span className="fw-bold">
                                {order.status == 'PAID'
                                    ? 'Đã thanh toán'
                                    : 'Chưa thanh toán'}
                            </span>
                        </p>
                        <p>
                            Tổng tiền: <span className="fw-bold">{total}</span>
                        </p>
                        <hr />

                        <h5 className="mb-3">Chi tiết vé:</h5>
                        {renderTickets()}

                        <hr />

                        <button
                            className="btn btn-light mt-3"
                            onClick={() => navigate('/')}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;
