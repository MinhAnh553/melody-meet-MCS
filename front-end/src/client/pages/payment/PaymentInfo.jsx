import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Radio, Modal } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import PhoneInput from 'react-phone-input-2';
import { isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-input-2/lib/material.css';

import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';

const { Title } = Typography;

const paymentMethods = [
    {
        label: 'PayOS',
        value: 'payos',
        icon: (
            <img
                src="https://salt.tkbcdn.com/ts/ds/0c/ae/fb/6bdb675e0df2f9f13a47726f432934e6.png"
                alt="PayOS"
                style={{ height: 24, marginRight: 8, verticalAlign: 'middle' }}
            />
        ),
    },
    {
        label: 'VNPAY',
        value: 'vnpay',
        icon: (
            <img
                src="https://salt.tkbcdn.com/ts/ds/e5/6d/9a/a5262401410b7057b04114ad15b93d85.png"
                alt="VNPAY"
                style={{ height: 24, marginRight: 8, verticalAlign: 'middle' }}
            />
        ),
    },
    {
        label: 'ZaloPay',
        value: 'zalopay',
        icon: (
            <img
                src="https://salt.tkbcdn.com/ts/ds/ac/2c/68/ee062970f97385ed9e28757b0270e249.png"
                alt="ZaloPay"
                style={{ height: 24, marginRight: 8, verticalAlign: 'middle' }}
            />
        ),
    },
];

function OrderPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0); // ms
    const [selectedPayment, setSelectedPayment] = useState('payos');
    const [event, setEvent] = useState(null);
    const [eventLoading, setEventLoading] = useState(false);
    const [editingInfo, setEditingInfo] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [expiredModal, setExpiredModal] = useState(false);

    useEffect(() => {
        if (order && order.buyerInfo) {
            setName(order.buyerInfo.name || '');
            setPhone(order.buyerInfo.phone || '');
            setEmail(order.buyerInfo.email || '');
        }
    }, [order]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await api.getOrder(orderId);
                if (res.success) {
                    setOrder(res.order);
                    setTickets(res.order.tickets);
                    const diff =
                        new Date(res.order.expiredAt).getTime() - Date.now();
                    setTimeLeft(diff > 0 ? diff : 0);
                    if (res.order.status === 'CANCELED') {
                        navigate(
                            `/event/${res.order.eventId}/bookings/select-ticket`,
                        );
                        swalCustomize.Toast.fire({
                            icon: 'error',
                            title: 'Đơn hàng đã bị hủy!',
                        });
                    } else if (res.order.status === 'PAID') {
                        navigate(`/my-tickets`);
                        swalCustomize.Toast.fire({
                            icon: 'success',
                            title: 'Đơn hàng đã được thanh toán!',
                        });
                    }
                    // Fetch event info
                    setEventLoading(true);
                    const eventRes = await api.getEventById(res.order.eventId);
                    if (eventRes.success) setEvent(eventRes.data);
                    setEventLoading(false);
                } else {
                    navigate('/');
                    swalCustomize.Toast.fire({
                        icon: 'error',
                        title: 'Không tìm thấy đơn hàng!',
                    });
                }
            } catch (err) {
                setEventLoading(false);
                console.error(err);
            }
        };
        fetchOrder();
        const interval = setInterval(() => checkStatus(), 5000);
        return () => clearInterval(interval);
    }, [orderId]);

    const checkStatus = async () => {
        try {
            const res = await api.checkStatusOrder(orderId);
            if (res.success) {
                if (res.status === 'PAID') {
                    navigate(`/my-tickets`);
                    swalCustomize.Toast.fire({
                        icon: 'success',
                        title: 'Đơn hàng đã được thanh toán!',
                    });
                }
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

    // Countdown
    useEffect(() => {
        if (!order) return;
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const newVal = prev - 1000;
                if (newVal <= 0) {
                    clearInterval(timer);
                    setExpiredModal(true); // Hiện modal khi hết thời gian
                    return 0;
                }
                return newVal;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [order, timeLeft]);

    function formatCountdown(ms) {
        if (ms <= 0) return '00:00';
        const totalSec = Math.floor(ms / 1000);
        const mm = Math.floor(totalSec / 60);
        const ss = totalSec % 60;
        const mmStr = mm < 10 ? `0${mm}` : mm;
        const ssStr = ss < 10 ? `0${ss}` : ss;
        return `${mmStr}:${ssStr}`;
    }

    const handleCancelOrder = () => {
        swalCustomize.Swal.fire({
            title: 'Hủy đơn hàng?',
            text: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Có, hủy đơn',
            cancelButtonText: 'Không',
        }).then(async (result) => {
            if (result.isConfirmed) {
                await api.cancelOrder({ orderId });
                navigate(`/event/${order?.eventId || ''}`);
            }
        });
    };

    const handlePayment = async () => {
        if (!name.trim() || !phone.trim()) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Vui lòng nhập đầy đủ thông tin người mua!',
            });
            setEditingInfo(true);
            return;
        }
        try {
            const res = await api.selectPayment(orderId, selectedPayment);
            if (res.success) {
                window.location.href = res.payUrl;
            } else {
                swalCustomize.Toast.fire({
                    icon: 'error',
                    title:
                        res.message || 'Lỗi khi chọn phương thức thanh toán!',
                });
                navigate(`/event/${order?.eventId || ''}`);
            }
        } catch (err) {
            console.error(err);
            swalCustomize.Toast.fire({
                icon: 'error',
                title: err.message || 'Server Error!',
            });
        }
    };

    const handleSaveBuyerInfo = async () => {
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
        const buyerInfo = { name, phone };
        const res = await api.updateUserAddress(buyerInfo);
        if (res && res.success) {
            swalCustomize.Toast.fire({
                icon: 'success',
                title: 'Cập nhật thành công!',
            });
            setEditingInfo(false);
        } else {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: res?.message || 'Cập nhật thất bại!',
            });
        }
    };

    if (!order) return null;

    return (
        <div
            style={{
                minHeight: '100vh',
                // background: '#18181b',
                color: '#d4d4d8',
                marginTop: '85px',
            }}
        >
            <Row
                justify="center"
                style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 0' }}
                gutter={[32, 32]}
            >
                {/* LEFT COLUMN */}
                <Col xs={24} md={15} lg={15}>
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                        {/* Event Info (optional, can be removed if not needed) */}
                        {event && (
                            <div
                                style={{
                                    marginBottom: 32,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: 24,
                                }}
                            >
                                <div>
                                    <Title
                                        level={3}
                                        style={{
                                            color: '#4ade80',
                                            fontWeight: 700,
                                            marginBottom: 0,
                                            fontSize: 26,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {event.name}
                                    </Title>
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontWeight: 500,
                                            fontSize: 16,
                                            margin: '8px 0 0 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                        }}
                                    >
                                        <EnvironmentOutlined
                                            style={{
                                                color: '#4ade80',
                                                marginRight: 8,
                                            }}
                                        />
                                        {event.venueName ||
                                            event.location?.venueName ||
                                            event.address}
                                    </div>
                                    <div
                                        style={{
                                            color: '#fff',
                                            fontWeight: 500,
                                            fontSize: 16,
                                            margin: '2px 0 0 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                        }}
                                    >
                                        <CalendarOutlined
                                            style={{
                                                color: '#4ade80',
                                                marginRight: 8,
                                            }}
                                        />
                                        {new Date(
                                            event.startTime,
                                        ).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        ,{' '}
                                        {new Date(
                                            event.startTime,
                                        ).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        minWidth: 170,
                                        minHeight: 80,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            background: '#fff',
                                            borderRadius: 20,
                                            boxShadow:
                                                '0 2px 16px rgba(0,0,0,0.10)',
                                            padding: '14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#888',
                                                fontSize: 14,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Hoàn tất đặt vé trong
                                        </div>
                                        <div
                                            style={{
                                                color: '#22c55e',
                                                fontSize: 32,
                                                letterSpacing: 2,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        >
                                            {formatCountdown(timeLeft)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Thông tin nhận vé */}
                        <Card
                            style={{
                                background: '#232323',
                                borderRadius: 16,
                                marginBottom: 18,
                                border: 'none',
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <div
                                style={{
                                    color: '#4ade80',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    marginBottom: 8,
                                }}
                            >
                                Thông tin người mua
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        style={{
                                            fontWeight: 600,
                                            color: '#d4d4d8',
                                            marginBottom: 4,
                                            display: 'block',
                                        }}
                                    >
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        disabled={!editingInfo}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        style={{
                                            width: '100%',
                                            padding: 10,
                                            borderRadius: 8,
                                            border: '1px solid #333',
                                            background: editingInfo
                                                ? '#fff'
                                                : '#232323',
                                            color: editingInfo
                                                ? '#232323'
                                                : '#d4d4d8',
                                            fontWeight: 500,
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        style={{
                                            fontWeight: 600,
                                            color: '#d4d4d8',
                                            marginBottom: 4,
                                            display: 'block',
                                        }}
                                    >
                                        Số điện thoại
                                    </label>
                                    <PhoneInput
                                        country={'vn'}
                                        value={phone}
                                        disabled={!editingInfo}
                                        onChange={(val) => setPhone(val)}
                                        inputClass={
                                            editingInfo ? 'text-dark' : ''
                                        }
                                        inputStyle={{
                                            width: '100%',
                                            height: 48,
                                            borderRadius: 8,
                                            background: editingInfo
                                                ? '#fff'
                                                : '#232323',
                                            color: editingInfo
                                                ? '#232323'
                                                : '#d4d4d8',
                                            border: '1px solid #333',
                                            fontWeight: 500,
                                        }}
                                        containerStyle={{ width: '100%' }}
                                        enableSearch={true}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        style={{
                                            fontWeight: 600,
                                            color: '#d4d4d8',
                                            marginBottom: 4,
                                            display: 'block',
                                        }}
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: 10,
                                            borderRadius: 8,
                                            border: '1px solid #333',
                                            // background: '#f3f3f3',
                                            color: '#888',
                                            fontWeight: 500,
                                            cursor: 'not-allowed',
                                        }}
                                    />
                                </div>
                                {editingInfo ? (
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <Button
                                            type="primary"
                                            onClick={handleSaveBuyerInfo}
                                            style={{ fontWeight: 600 }}
                                        >
                                            Lưu
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setEditingInfo(false);
                                                setName(
                                                    order.buyerInfo.name || '',
                                                );
                                                setPhone(
                                                    order.buyerInfo.phone || '',
                                                );
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => setEditingInfo(true)}
                                        style={{ fontWeight: 600 }}
                                    >
                                        Chỉnh sửa
                                    </Button>
                                )}
                            </div>
                        </Card>
                        {/* Mã khuyến mãi */}
                        {/* <Card
                            style={{
                                background: '#232323',
                                borderRadius: 16,
                                marginBottom: 18,
                                border: 'none',
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <div
                                style={{
                                    color: '#4ade80',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    marginBottom: 8,
                                }}
                            >
                                Mã khuyến mãi
                        </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Button
                                    disabled
                                    style={{
                                        background: '#18181b',
                                        color: '#d4d4d8',
                                        border: 'none',
                                        borderRadius: 8,
                                        fontWeight: 600,
                                        fontSize: 16,
                                        padding: '8px 20px',
                                    }}
                                >
                                    + Thêm khuyến mãi
                                </Button>
                                <span
                                    style={{
                                        color: '#4ade80',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Chọn voucher
                            </span>
                        </div>
                        </Card> */}
                        {/* Phương thức thanh toán */}
                        <Card
                            style={{
                                background: '#232323',
                                borderRadius: 16,
                                marginBottom: 18,
                                border: 'none',
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <div
                                style={{
                                    color: '#4ade80',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    marginBottom: 8,
                                }}
                            >
                                Phương thức thanh toán
                            </div>
                            <Radio.Group
                                value={selectedPayment}
                                onChange={(e) =>
                                    setSelectedPayment(e.target.value)
                                }
                                style={{ width: '100%' }}
                            >
                                {paymentMethods.map((m) => (
                                    <div
                                        key={m.value}
                                        style={{
                                            marginBottom: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        <Radio
                                            value={m.value}
                                            style={{
                                                color: '#d4d4d8',
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {m.icon} {m.label}
                                        </Radio>
                                    </div>
                                ))}
                            </Radio.Group>
                        </Card>
                    </div>
                </Col>
                {/* RIGHT COLUMN */}
                <Col xs={24} md={9} lg={7} style={{ minWidth: 320 }}>
                    <div style={{ position: 'sticky', top: 80, zIndex: 2 }}>
                        {/* Thông tin đặt vé */}
                        <Card
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                marginBottom: 18,
                                border: 'none',
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: '#232323',
                                    marginBottom: 8,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                Thông tin đặt vé
                                <Button
                                    type="link"
                                    style={{
                                        color: '#1677ff',
                                        fontWeight: 600,
                                        padding: 0,
                                    }}
                                    onClick={() =>
                                        navigate(
                                            `/event/${order.eventId}/bookings/select-ticket`,
                                        )
                                    }
                                >
                                    Chọn lại vé
                                </Button>
                            </div>
                            {tickets.filter((ticket) => ticket.quantity > 0)
                                .length === 0 ? (
                                <div
                                    style={{
                                        color: '#71717a',
                                        fontSize: 15,
                                        fontWeight: 400,
                                        marginBottom: 4,
                                    }}
                                >
                                    Chưa có vé nào
                                </div>
                            ) : (
                                tickets
                                    .filter((ticket) => ticket.quantity > 0)
                                    .map((ticket, idx) => (
                                        <div
                                            key={ticket.ticketId || idx}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: 16,
                                                fontWeight: 700,
                                                color: 'rgb(45, 194, 117)',
                                                marginBottom: 8,
                                            }}
                                        >
                                            <span>
                                                {ticket.name}{' '}
                                                <span
                                                    style={{
                                                        color: '#888',
                                                        fontWeight: 500,
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    x{ticket.quantity}
                                                </span>
                                            </span>
                                            <span
                                                style={{
                                                    color: '#232323',
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                }}
                                            >
                                                {(
                                                    ticket.price *
                                                    ticket.quantity
                                                ).toLocaleString('vi-VN')}{' '}
                                                đ
                                            </span>
                                        </div>
                                    ))
                            )}
                        </Card>
                        {/* Thông tin đơn hàng */}
                        <Card
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                border: 'none',
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: '#232323',
                                    marginBottom: 8,
                                }}
                            >
                                Thông tin đơn hàng
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                }}
                            >
                                <span style={{ color: '#232323' }}>
                                    Tạm tính
                                </span>
                                <span style={{ color: '#232323' }}>
                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                            <div
                                style={{
                                    borderTop: '1px dashed #bbb',
                                    margin: '12px 0',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 18,
                                }}
                            >
                                <span
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 20,
                                        color: '#232323',
                                    }}
                                >
                                    Tổng tiền
                                </span>
                                <span
                                    style={{
                                        color: 'rgb(45, 194, 117)',
                                        fontWeight: 700,
                                        fontSize: 24,
                                    }}
                                >
                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                            {/* <div
                                style={{
                                    fontSize: 13,
                                    color: '#888',
                                    marginBottom: 12,
                                }}
                            >
                                Bằng việc tiến hành đặt mua, bạn đã đồng ý với{' '}
                                <a
                                    href="#"
                                    style={{ color: 'rgb(45, 194, 117)' }}
                                >
                                    Điều Kiện Giao Dịch Chung
                                </a>
                            </div> */}
                            <Button
                                type="primary"
                                size="large"
                                style={{
                                    width: '100%',
                                    background: 'rgb(45, 194, 117)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    border: 'none',
                                    borderRadius: 8,
                                    boxShadow: 'none',
                                    marginTop: 8,
                                }}
                                onClick={handlePayment}
                            >
                                Thanh toán
                            </Button>
                        </Card>
                    </div>
                </Col>
            </Row>
            {/* Modal hết thời gian giữ vé */}
            <Modal
                open={expiredModal}
                footer={null}
                closable={false}
                centered
                bodyStyle={{ textAlign: 'center', padding: 32 }}
            >
                <div
                    style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}
                >
                    Hết thời gian giữ vé!
                </div>
                <div
                    style={{ fontSize: 38, margin: '12px 0', color: '#22c55e' }}
                >
                    <span role="img" aria-label="bell">
                        🔔
                    </span>
                </div>
                <div style={{ color: '#444', fontSize: 16, marginBottom: 24 }}>
                    Đã hết thời gian giữ vé. Vui lòng đặt lại vé mới.
                </div>
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: '#22c55e',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 18,
                        width: '100%',
                        borderRadius: 8,
                    }}
                    onClick={() =>
                        navigate(
                            `/event/${order.eventId}/bookings/select-ticket`,
                        )
                    }
                >
                    Đặt vé mới
                </Button>
            </Modal>
        </div>
    );
}

export default OrderPage;
