import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { FaCheckCircle } from 'react-icons/fa';
import api from '../../../util/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './PaymentSuccess.module.css';
import TimeText from '../../components/providers/TimeText';

function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderCode = searchParams.get('orderCode'); // ?orderCode=xxx
    const [order, setOrder] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [event, setEvent] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!orderCode) return;

            try {
                // Lấy thông tin đơn hàng
                const orderRes = await api.getOrderByOrderCode(orderCode);
                if (orderRes.success) {
                    if (orderRes.order.status === 'PAID') {
                        setOrder(orderRes.order);
                        setTickets(orderRes.order.tickets);

                        // Lấy thông tin sự kiện sau khi có order
                        const eventRes = await api.getEventById(
                            orderRes.order.eventId,
                        );
                        if (eventRes.success) {
                            setEvent(eventRes.data);
                        }
                    } else {
                        navigate('/');
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [orderCode]);

    if (!order || !event) {
        return null;
    }

    // Tính tổng tiền
    const total = order.totalPrice.toLocaleString('vi-VN') + ' đ';

    // Render danh sách vé
    const renderTickets = () => {
        if (tickets.length === 0) {
            return <p>Không có vé nào</p>;
        }

        return tickets.map((ticket, index) => (
            <div key={index} className={styles['ticket-card']}>
                <div className={styles['ticket-header']}>
                    <div className={styles['ticket-title']}>
                        <h5 className="mb-0">{ticket.name}</h5>
                        <small className="text-muted">
                            Số lượng: {ticket.quantity} vé
                        </small>
                    </div>
                </div>
                <div className={styles['ticket-body']}>
                    {Array.from({ length: ticket.quantity }).map(
                        (_, ticketIndex) => (
                            <div
                                key={ticketIndex}
                                className={styles['ticket-item']}
                            >
                                <div className={styles['ticket-info']}>
                                    <div className={styles['ticket-code']}>
                                        Mã vé: {order.orderCode}
                                        {index + 1}
                                        {ticketIndex + 1}
                                    </div>
                                    <div className={styles['ticket-price']}>
                                        {ticket.price.toLocaleString('vi-VN')} đ
                                    </div>
                                </div>
                                <div className={styles['ticket-qr']}>
                                    <QRCode
                                        value={`${order.orderCode}${index + 1}${
                                            ticketIndex + 1
                                        }`}
                                        size={80}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                </div>
                            </div>
                        ),
                    )}
                    <div className={styles['ticket-total']}>
                        <span>Tổng tiền:</span>
                        <span>
                            {(ticket.price * ticket.quantity).toLocaleString(
                                'vi-VN',
                            )}{' '}
                            đ
                        </span>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div
            className="container py-5"
            style={{
                marginTop: '85px',
            }}
        >
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <FaCheckCircle
                                    className="text-success mb-3"
                                    style={{ fontSize: '5rem' }}
                                />
                                <h2>Thanh toán thành công!</h2>
                                <p className="text-muted">
                                    Cảm ơn bạn đã đặt vé. Dưới đây là thông tin
                                    đơn hàng của bạn.
                                </p>
                            </div>

                            <div className="order-details">
                                <h5 className="mb-3">Thông tin đơn hàng:</h5>
                                <p>
                                    Mã đơn hàng:{' '}
                                    <span className="fw-bold">
                                        {order.orderCode}
                                    </span>
                                </p>
                                <p>
                                    Trạng thái:{' '}
                                    <span className="fw-bold text-success">
                                        Đã thanh toán
                                    </span>
                                </p>
                                <p>
                                    Tổng tiền:{' '}
                                    <span className="fw-bold">{total}</span>
                                </p>
                                <hr />

                                <h5 className="mb-3">Thông tin sự kiện:</h5>
                                <div className={styles['event-info']}>
                                    <h4 className={styles['event-title']}>
                                        {event.name}
                                    </h4>
                                    <div className={styles['event-details']}>
                                        <i className="bi bi-geo-alt-fill"></i>
                                        {''}
                                        <span className="fw-bold text-success">
                                            {event.location.venueName}
                                        </span>
                                        <br />
                                        <span style={{ marginLeft: '22px' }}>
                                            {event.location.address},{' '}
                                            {event.location.ward},{' '}
                                            {event.location.district},{' '}
                                            {event.location.province}
                                        </span>
                                        <br />
                                        <i className="bi bi-clock"></i>
                                        {''}
                                        <span className="fw-bold text-success">
                                            <TimeText event={event} />
                                        </span>
                                    </div>
                                </div>

                                <h5 className="mb-3">Vé của bạn:</h5>
                                {renderTickets()}

                                <div className="d-flex justify-content-center gap-3 mt-4">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate('/my-tickets')}
                                    >
                                        Xem vé của tôi
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
        </div>
    );
}

export default PaymentSuccess;
