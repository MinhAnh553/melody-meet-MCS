import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    Button,
    Typography,
    Radio,
    Modal,
    Tabs,
    Input,
    message,
} from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import PhoneInput from 'react-phone-input-2';
import { isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-input-2/lib/material.css';

import { useAuth } from '../../context/AuthContext';
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

// Mapping BIN sang tên ngân hàng phổ biến
const bankMap = {
    970422: 'Vietcombank',
    970405: 'BIDV',
    970418: 'Techcombank',
    970436: 'VietinBank',
    970407: 'MB Bank',
    970423: 'ACB',
    970430: 'Sacombank',
    970441: 'TPBank',
    970406: 'Agribank',
    970448: 'OCB',
};

function getVietQRUrl({
    bin,
    accountNumber,
    amount,
    description,
    accountName,
}) {
    return `https://img.vietqr.io/image/${bin}-${accountNumber}-mm.jpg?amount=${amount}&addInfo=${encodeURIComponent(
        description,
    )}&accountName=${encodeURIComponent(accountName)}`;
}

function OrderPage() {
    const { user } = useAuth();
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
    const [payosModal, setPayosModal] = useState(false);
    const [payosTab, setPayosTab] = useState('qr');
    const [payosData, setPayosData] = useState(null);
    // Thêm state responsive
    const [isMobile, setIsMobile] = useState(false);

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
                        navigate(
                            `/event/${res.order.eventId}/bookings/${res.order._id}/payment-success`,
                        );
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
                    navigate(
                        `/event/${order.eventId}/bookings/${order._id}/payment-success`,
                    );
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

    function formatPayosCountdown(sec) {
        const mm = Math.floor(sec / 60);
        const ss = sec % 60;
        return `${mm < 10 ? '0' : ''}${mm} : ${ss < 10 ? '0' : ''}${ss}`;
    }

    function handleCopy(text) {
        navigator.clipboard.writeText(text);
        message.success('Đã sao chép!');
    }

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
                if (
                    selectedPayment === 'payos' &&
                    res.paymentPayosLinkResponse
                ) {
                    setPayosData(res.paymentPayosLinkResponse);

                    setPayosTab('qr');
                    setPayosModal(true);
                } else if (res.payUrl) {
                    window.location.href = res.payUrl;
                }
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
        const res = await api.updateUser(user._id, buyerInfo);
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

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            <style>
                {`
                .ant-tabs-nav-wrap {
                    justify-content: center !important;
                }
                .ant-radio-group-solid .ant-radio-button-wrapper:not(:first-child)::before,
                .ant-radio-button-wrapper:not(:first-child)::before {
                    display: none !important;
                }
                .ant-radio-button-wrapper {
                    border-left: none !important;
                }
                `}
            </style>
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
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    gap: 32,
                                    justifyContent: 'center',
                                    margin: '32px 0',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {paymentMethods.map((m) => (
                                    <Radio.Button
                                        key={m.value}
                                        value={m.value}
                                        style={{
                                            padding: '28px 40px',
                                            borderRadius: 18,
                                            fontSize: 22,
                                            fontWeight: 700,
                                            background:
                                                selectedPayment === m.value
                                                    ? '#e0ffe0'
                                                    : '#fff',
                                            boxShadow:
                                                selectedPayment === m.value
                                                    ? '0 4px 24px #a3e63544'
                                                    : 'none',
                                            border:
                                                '2px solid ' +
                                                (selectedPayment === m.value
                                                    ? '#22c55e'
                                                    : 'transparent'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 18,
                                            transition:
                                                'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                                            minWidth: 240,
                                            justifyContent: 'center',
                                            color:
                                                selectedPayment === m.value
                                                    ? '#16a34a'
                                                    : '#232323',
                                            marginBottom: 16,
                                        }}
                                    >
                                        {React.cloneElement(m.icon, {
                                            style: {
                                                height: 40,
                                                marginRight: 16,
                                            },
                                        })}
                                        {m.label}
                                    </Radio.Button>
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
            {/* Popup PayOS custom */}
            <Modal
                open={payosModal}
                onCancel={() => setPayosModal(false)}
                footer={null}
                closable={false}
                centered
                width={isMobile ? '98vw' : 800}
                bodyStyle={{
                    borderRadius: 16,
                    padding: 0,
                    overflow: 'hidden',
                    minWidth: isMobile ? 0 : 420,
                }}
            >
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 16,
                        minHeight: isMobile ? 0 : 420,
                        padding: isMobile ? 8 : 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            padding: isMobile
                                ? '16px 12px 0 12px'
                                : '24px 32px 0 32px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <img
                                src="https://salt.tkbcdn.com/ts/ds/0c/ae/fb/6bdb675e0df2f9f13a47726f432934e6.png"
                                alt="VietQR"
                                style={{ height: 28 }}
                            />
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? 18 : 22,
                                    marginLeft: 8,
                                }}
                            >
                                Thanh toán bằng VietQR
                            </span>
                        </div>
                        <Button
                            type="link"
                            style={{
                                color: '#22c55e',
                                fontWeight: 600,
                                margin: isMobile ? '0 auto' : 0,
                                fontSize: isMobile ? 15 : 16,
                            }}
                            onClick={() => setPayosModal(false)}
                        >
                            Đổi phương thức khác
                        </Button>
                    </div>
                    <Tabs
                        activeKey={payosTab}
                        onChange={setPayosTab}
                        style={{
                            margin: isMobile ? '0 8px' : '0 32px',
                            marginTop: 16,
                        }}
                        items={[
                            {
                                key: 'qr',
                                label: (
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: isMobile ? 15 : 17,
                                            color:
                                                payosTab === 'qr'
                                                    ? '#22c55e'
                                                    : '#222',
                                        }}
                                    >
                                        Thanh toán bằng VietQR
                                    </span>
                                ),
                                children: (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: isMobile
                                                ? 'column'
                                                : 'row',
                                            marginTop: 8,
                                            alignItems: isMobile
                                                ? 'center'
                                                : undefined,
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: isMobile ? 16 : 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    background: '#f8f9fa',
                                                    borderRadius: 16,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <img
                                                    src={
                                                        payosData
                                                            ? getVietQRUrl({
                                                                  bin: payosData.bin,
                                                                  accountNumber:
                                                                      payosData.accountNumber,
                                                                  amount: payosData.amount,
                                                                  description:
                                                                      payosData.description,
                                                                  accountName:
                                                                      payosData.accountName,
                                                              })
                                                            : ''
                                                    }
                                                    alt="QR VietQR"
                                                    style={{
                                                        width: isMobile
                                                            ? 180
                                                            : 268,
                                                        height: isMobile
                                                            ? 180
                                                            : 268,
                                                        background: '#fff',
                                                        borderRadius: 8,
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    color: '#888',
                                                    fontWeight: 500,
                                                    fontSize: isMobile
                                                        ? 13
                                                        : 15,
                                                    marginTop: 8,
                                                }}
                                            >
                                                Tổng tiền
                                            </div>
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: isMobile
                                                        ? 16
                                                        : 20,
                                                    color: '#222',
                                                }}
                                            >
                                                {payosData?.amount?.toLocaleString(
                                                    'vi-VN',
                                                )}{' '}
                                                đ
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: isMobile ? 0 : 24,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: isMobile
                                                    ? 'center'
                                                    : 'flex-start',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: isMobile
                                                        ? 16
                                                        : 20,
                                                    marginBottom: 12,
                                                    textAlign: isMobile
                                                        ? 'center'
                                                        : 'left',
                                                }}
                                            >
                                                Quét mã QR để thanh toán
                                            </div>
                                            <ol
                                                style={{
                                                    paddingLeft: 20,
                                                    marginBottom: 16,
                                                    fontSize: isMobile
                                                        ? 13
                                                        : 15,
                                                    textAlign: isMobile
                                                        ? 'left'
                                                        : 'left',
                                                }}
                                            >
                                                <li>
                                                    Mở ứng dụng Ngân hàng trên
                                                    điện thoại
                                                </li>
                                                <li>
                                                    Chọn biểu tượng{' '}
                                                    <b>Quét mã QR</b>
                                                </li>
                                                <li>Quét mã QR ở trang này</li>
                                                <li>
                                                    Thực hiện thanh toán và xem
                                                    kết quả giao dịch tại trang
                                                    này (không tắt popup)
                                                </li>
                                            </ol>
                                            <div
                                                style={{
                                                    background: '#f3f4f6',
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    textAlign: 'center',
                                                    marginTop: 'auto',
                                                    fontSize: isMobile
                                                        ? 14
                                                        : 16,
                                                }}
                                            >
                                                Giao dịch sẽ kết thúc sau
                                                <span
                                                    style={{
                                                        color: '#22c55e',
                                                        fontWeight: 700,
                                                        fontSize: isMobile
                                                            ? 16
                                                            : 18,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    {formatCountdown(timeLeft)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'bank',
                                label: (
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: isMobile ? 15 : 17,
                                            color:
                                                payosTab === 'bank'
                                                    ? '#22c55e'
                                                    : '#222',
                                        }}
                                    >
                                        Chuyển khoản ngân hàng
                                    </span>
                                ),
                                children: (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: isMobile
                                                ? 'column'
                                                : 'row',
                                            marginTop: 8,
                                            alignItems: isMobile
                                                ? 'center'
                                                : undefined,
                                        }}
                                    >
                                        <div
                                            style={{
                                                flex: 1,
                                                background: '#f8f9fa',
                                                borderRadius: 16,
                                                padding: isMobile ? 10 : 20,
                                                marginRight: isMobile ? 0 : 16,
                                                marginBottom: isMobile ? 16 : 0,
                                                width: isMobile
                                                    ? '100%'
                                                    : undefined,
                                            }}
                                        >
                                            <div style={{ marginBottom: 10 }}>
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: '#888',
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    Tên ngân hàng
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {bankMap[
                                                            payosData?.bin
                                                        ] ||
                                                            payosData?.bin ||
                                                            '---'}
                                                    </span>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleCopy(
                                                                bankMap[
                                                                    payosData
                                                                        ?.bin
                                                                ] ||
                                                                    payosData?.bin ||
                                                                    '---',
                                                            )
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: 10 }}>
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: '#888',
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    Tên tài khoản
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {payosData?.accountName ||
                                                            '---'}
                                                    </span>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleCopy(
                                                                payosData?.accountName,
                                                            )
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: 10 }}>
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: '#888',
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    Số tài khoản
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {payosData?.accountNumber ||
                                                            '---'}
                                                    </span>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleCopy(
                                                                payosData?.accountNumber,
                                                            )
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: 10 }}>
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: '#888',
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    Số tiền
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {payosData?.amount?.toLocaleString(
                                                            'vi-VN',
                                                        ) || '---'}{' '}
                                                        đ
                                                    </span>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleCopy(
                                                                payosData?.amount?.toString(),
                                                            )
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: 10 }}>
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        color: '#888',
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    Nội dung
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {payosData?.description ||
                                                            '---'}
                                                    </span>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleCopy(
                                                                payosData?.description,
                                                            )
                                                        }
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: isMobile ? 0 : 24,
                                                display: isMobile
                                                    ? 'none'
                                                    : 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: isMobile
                                                    ? 'center'
                                                    : 'flex-start',
                                                width: isMobile
                                                    ? '100%'
                                                    : undefined,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 20,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                Chuyển khoản ngân hàng
                                            </div>
                                            <ol
                                                style={{
                                                    paddingLeft: 20,
                                                    marginBottom: 16,
                                                }}
                                            >
                                                <li>
                                                    Mở ứng dụng Ngân hàng trên
                                                    điện thoại
                                                </li>
                                                <li>
                                                    Chọn tính năng chuyển tiền,
                                                    chọn ngân hàng và sao chép
                                                    &quot;Số tài khoản&quot;
                                                </li>
                                                <li>
                                                    Nhập chính xác &quot;Số
                                                    tiền&quot; và sao chép
                                                    &quot;Nội dung chuyển
                                                    khoản&quot;
                                                </li>
                                                <li>
                                                    Thực hiện thanh toán và xem
                                                    kết quả giao dịch tại trang
                                                    này (không tắt popup)
                                                </li>
                                            </ol>
                                            <div
                                                style={{
                                                    color: 'red',
                                                    fontWeight: 600,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                Lưu ý: Nhập chính xác &quot;Số
                                                tiền&quot; thanh toán
                                            </div>
                                            <div
                                                style={{
                                                    background: '#f3f4f6',
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    textAlign: 'center',
                                                    marginTop: 'auto',
                                                }}
                                            >
                                                Giao dịch sẽ kết thúc sau
                                                <span
                                                    style={{
                                                        color: '#22c55e',
                                                        fontWeight: 700,
                                                        fontSize: 18,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    {formatCountdown(timeLeft)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default OrderPage;
