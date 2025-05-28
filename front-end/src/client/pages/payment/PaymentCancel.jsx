import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import { useLoading } from '../../context/LoadingContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from '../../../util/api';

function PaymentCancel() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderCode = searchParams.get('orderCode');
    const { showLoading, hideLoading } = useLoading();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!orderCode) return;

            showLoading();
            try {
                // Lấy thông tin đơn hàng
                const orderRes = await api.getOrderByOrderCode(orderCode);
                if (orderRes.success) {
                    setOrder(orderRes.order);
                    await api.cancelOrder({ orderId: orderRes.order._id });
                } else {
                    navigate('/');
                }
            } catch (err) {
                console.error(err);
            } finally {
                hideLoading();
            }
        };

        fetchData();
    }, [orderCode]);

    if (!order) {
        return showLoading();
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6 text-center">
                    <div className="card shadow">
                        <div className="card-body p-5">
                            <FaTimesCircle
                                className="text-danger mb-4"
                                style={{ fontSize: '5rem' }}
                            />
                            <h2 className="mb-4">Thanh toán bị hủy</h2>
                            <p className="text-muted mb-4">
                                Đơn hàng của bạn đã bị hủy. Vui lòng thử lại
                                sau.
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <button
                                    className="btn btn-primary"
                                    onClick={() =>
                                        navigate(`/event/${order.eventId}`)
                                    }
                                >
                                    Quay lại
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/')}
                                >
                                    Về trang chủ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentCancel;
