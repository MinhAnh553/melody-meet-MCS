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
        label: 'VietQR',
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

function getPaymentDescription(value) {
    const descriptions = {
        payos: 'Thanh toán bằng VietQR - Quét mã QR để thanh toán nhanh chóng',
        vnpay: 'Cổng thanh toán hàng đầu Việt Nam - An toàn và tiện lợi',
        zalopay: 'Ví điện tử ZaloPay - Thanh toán nhanh, nhiều ưu đãi',
    };
    return descriptions[value] || 'Phương thức thanh toán tiện lợi';
}

function getPaymentFeatures(value) {
    const features = {
        payos: ['VietQR', 'Tức thì', 'Miễn phí'],
        vnpay: ['ATM/Visa', 'Bảo mật cao', 'Phổ biến'],
        zalopay: ['Ví điện tử', 'Cashback', 'Ưu đãi'],
    };
    return features[value] || ['Tiện lợi', 'An toàn'];
}

function getPaymentInstructions(value) {
    const instructions = {
        payos: 'Quét mã VietQR bằng ứng dụng ngân hàng để thanh toán tức thì và miễn phí.',
        vnpay: 'Thanh toán qua thẻ ATM, Visa/MasterCard hoặc ví điện tử với bảo mật cao.',
        zalopay:
            'Sử dụng ứng dụng ZaloPay để thanh toán và nhận nhiều ưu đãi hấp dẫn.',
    };
    return (
        instructions[value] ||
        'Hướng dẫn thanh toán sẽ hiển thị ở bước tiếp theo.'
    );
}

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
                background: '#ffffff',
                color: '#262626',
                marginTop: isMobile ? '70px' : '85px',
                padding: isMobile ? '0 0 20px 0' : '0',
            }}
        >
            <Row
                justify="center"
                style={{
                    maxWidth: 1400,
                    margin: '0 auto',
                    padding: isMobile ? '16px 16px 0 16px' : '32px 0',
                }}
                gutter={isMobile ? [0, 16] : [32, 32]}
            >
                {/* LEFT COLUMN */}
                <Col xs={24} md={15} lg={15}>
                    <div
                        style={{
                            maxWidth: 700,
                            margin: '0 auto',
                            padding: isMobile ? '0' : '0',
                        }}
                    >
                        {/* Event Info */}
                        {event && (
                            <div
                                style={{
                                    marginBottom: isMobile ? 20 : 32,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: isMobile ? 12 : 24,
                                    flexDirection: isMobile ? 'column' : 'row',
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <Title
                                        level={isMobile ? 4 : 3}
                                        style={{
                                            color: '#1890ff',
                                            fontWeight: 700,
                                            marginBottom: 0,
                                            fontSize: isMobile ? 20 : 26,
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {event.name}
                                    </Title>
                                    <div
                                        style={{
                                            color: '#434343',
                                            fontWeight: 500,
                                            fontSize: isMobile ? 14 : 16,
                                            margin: '8px 0 0 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isMobile ? 8 : 16,
                                        }}
                                    >
                                        <EnvironmentOutlined
                                            style={{
                                                color: '#fa541c',
                                                marginRight: 8,
                                                fontSize: isMobile ? 14 : 16,
                                            }}
                                        />
                                        {event.venueName ||
                                            event.location?.venueName ||
                                            event.address}
                                    </div>
                                    <div
                                        style={{
                                            color: '#434343',
                                            fontWeight: 500,
                                            fontSize: isMobile ? 14 : 16,
                                            margin: '2px 0 0 0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: isMobile ? 8 : 16,
                                        }}
                                    >
                                        <CalendarOutlined
                                            style={{
                                                color: '#722ed1',
                                                marginRight: 8,
                                                fontSize: isMobile ? 14 : 16,
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
                                        minWidth: isMobile ? '100%' : 170,
                                        minHeight: isMobile ? 60 : 80,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: isMobile
                                            ? 'center'
                                            : 'center',
                                    }}
                                >
                                    <div
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: isMobile ? 16 : 20,
                                            boxShadow:
                                                '0 4px 20px rgba(0,0,0,0.08)',
                                            border: '1px solid #f0f0f0',
                                            padding: isMobile
                                                ? '12px 20px'
                                                : '14px',
                                            display: 'flex',
                                            flexDirection: isMobile
                                                ? 'row'
                                                : 'column',
                                            alignItems: 'center',
                                            gap: isMobile ? 12 : 0,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: '#8c8c8c',
                                                fontSize: isMobile ? 12 : 14,
                                                marginBottom: isMobile ? 0 : 4,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Hoàn tất trong
                                        </div>
                                        <div
                                            style={{
                                                color: '#52c41a',
                                                fontSize: isMobile ? 24 : 32,
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

                        {/* Thông tin khách hàng */}
                        <Card
                            style={{
                                background: '#ffffff',
                                borderRadius: isMobile ? 12 : 16,
                                marginBottom: isMobile ? 16 : 18,
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                            bodyStyle={{ padding: isMobile ? 16 : 24 }}
                        >
                            <div
                                style={{
                                    color: '#1890ff',
                                    fontWeight: 700,
                                    fontSize: isMobile ? 16 : 18,
                                    marginBottom: 8,
                                }}
                            >
                                Thông tin khách hàng
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        style={{
                                            fontWeight: 600,
                                            color: '#595959',
                                            marginBottom: 4,
                                            display: 'block',
                                            fontSize: isMobile ? 14 : 16,
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
                                            padding: isMobile ? 12 : 10,
                                            borderRadius: 8,
                                            border: '1px solid #d9d9d9',
                                            background: editingInfo
                                                ? '#ffffff'
                                                : '#fafafa',
                                            color: editingInfo
                                                ? '#262626'
                                                : '#8c8c8c',
                                            fontWeight: 500,
                                            fontSize: isMobile ? 16 : 14,
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        style={{
                                            fontWeight: 600,
                                            color: '#595959',
                                            marginBottom: 4,
                                            display: 'block',
                                            fontSize: isMobile ? 14 : 16,
                                        }}
                                    >
                                        Số điện thoại
                                    </label>
                                    <PhoneInput
                                        country={'vn'}
                                        value={phone}
                                        disabled={!editingInfo}
                                        onChange={(val) => setPhone(val)}
                                        inputStyle={{
                                            width: '100%',
                                            height: isMobile ? 52 : 48,
                                            borderRadius: 8,
                                            background: editingInfo
                                                ? '#ffffff'
                                                : '#fafafa',
                                            color: editingInfo
                                                ? '#262626'
                                                : '#8c8c8c',
                                            border: '1px solid #d9d9d9',
                                            fontWeight: 500,
                                            fontSize: isMobile ? 16 : 14,
                                        }}
                                        containerStyle={{ width: '100%' }}
                                        enableSearch={true}
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label
                                        style={{
                                            fontWeight: 600,
                                            color: '#595959',
                                            marginBottom: 4,
                                            display: 'block',
                                            fontSize: isMobile ? 14 : 16,
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
                                            padding: isMobile ? 12 : 10,
                                            borderRadius: 8,
                                            border: '1px solid #d9d9d9',
                                            background: '#f5f5f5',
                                            color: '#8c8c8c',
                                            fontWeight: 500,
                                            cursor: 'not-allowed',
                                            fontSize: isMobile ? 16 : 14,
                                        }}
                                    />
                                </div>
                                {editingInfo ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 12,
                                            flexDirection: isMobile
                                                ? 'column'
                                                : 'row',
                                        }}
                                    >
                                        <Button
                                            type="primary"
                                            onClick={handleSaveBuyerInfo}
                                            style={{
                                                fontWeight: 600,
                                                background: '#1890ff',
                                                borderColor: '#1890ff',
                                                height: isMobile ? 44 : 32,
                                                fontSize: isMobile ? 16 : 14,
                                            }}
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
                                            style={{
                                                borderColor: '#d9d9d9',
                                                color: '#595959',
                                                height: isMobile ? 44 : 32,
                                                fontSize: isMobile ? 16 : 14,
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => setEditingInfo(true)}
                                        style={{
                                            fontWeight: 600,
                                            borderColor: '#1890ff',
                                            color: '#1890ff',
                                            height: isMobile ? 44 : 32,
                                            fontSize: isMobile ? 16 : 14,
                                        }}
                                    >
                                        Chỉnh sửa
                                    </Button>
                                )}
                            </div>
                        </Card>

                        {/* Phương thức thanh toán */}
                        <Card
                            style={{
                                background: '#ffffff',
                                borderRadius: isMobile ? 12 : 20,
                                marginBottom: isMobile ? 16 : 24,
                                border: 'none',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                            }}
                            bodyStyle={{ padding: isMobile ? 16 : 32 }}
                        >
                            <div
                                style={{
                                    color: '#1890ff',
                                    fontWeight: 700,
                                    fontSize: isMobile ? 16 : 18,
                                    marginBottom: 8,
                                }}
                            >
                                Phương thức thanh toán
                            </div>

                            {isMobile ? (
                                // Mobile: Simple radio buttons
                                <Radio.Group
                                    value={selectedPayment}
                                    onChange={(e) =>
                                        setSelectedPayment(e.target.value)
                                    }
                                    style={{ width: '100%' }}
                                >
                                    {paymentMethods.map((method) => (
                                        <div
                                            key={method.value}
                                            style={{
                                                marginBottom: 12,
                                            }}
                                        >
                                            <Radio
                                                value={method.value}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    borderRadius: 8,
                                                    border:
                                                        selectedPayment ===
                                                        method.value
                                                            ? '2px solid #1890ff'
                                                            : '1px solid #e8e8e8',
                                                    background:
                                                        selectedPayment ===
                                                        method.value
                                                            ? '#f0f9ff'
                                                            : '#ffffff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                        marginLeft: 8,
                                                    }}
                                                >
                                                    {React.cloneElement(
                                                        method.icon,
                                                        {
                                                            style: {
                                                                height: 24,
                                                                width: 'auto',
                                                            },
                                                        },
                                                    )}
                                                    <span
                                                        style={{
                                                            color:
                                                                selectedPayment ===
                                                                method.value
                                                                    ? '#1890ff'
                                                                    : '#262626',
                                                        }}
                                                    >
                                                        {method.label}
                                                    </span>
                                                </div>
                                            </Radio>
                                        </div>
                                    ))}
                                </Radio.Group>
                            ) : (
                                // Desktop: Rich cards
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 16,
                                        marginBottom: 16,
                                    }}
                                >
                                    {paymentMethods.map((method) => (
                                        <div
                                            key={method.value}
                                            onClick={() =>
                                                setSelectedPayment(method.value)
                                            }
                                            style={{
                                                padding: '20px 24px',
                                                borderRadius: 16,
                                                border:
                                                    selectedPayment ===
                                                    method.value
                                                        ? '2px solid #1890ff'
                                                        : '2px solid #e8e8e8',
                                                background:
                                                    selectedPayment ===
                                                    method.value
                                                        ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)'
                                                        : '#ffffff',
                                                cursor: 'pointer',
                                                transition:
                                                    'all 0.25s ease-out',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                boxShadow:
                                                    selectedPayment ===
                                                    method.value
                                                        ? '0 6px 20px rgba(24, 144, 255, 0.12)'
                                                        : '0 2px 8px rgba(0,0,0,0.04)',
                                                willChange:
                                                    'transform, box-shadow, border-color, background',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (
                                                    selectedPayment !==
                                                    method.value
                                                ) {
                                                    e.currentTarget.style.boxShadow =
                                                        '0 4px 16px rgba(0,0,0,0.08)';
                                                    e.currentTarget.style.borderColor =
                                                        '#d1d5db';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (
                                                    selectedPayment !==
                                                    method.value
                                                ) {
                                                    e.currentTarget.style.boxShadow =
                                                        '0 2px 8px rgba(0,0,0,0.04)';
                                                    e.currentTarget.style.borderColor =
                                                        '#e8e8e8';
                                                }
                                            }}
                                        >
                                            {/* Background pattern for selected */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    width: 80,
                                                    height: 80,
                                                    background:
                                                        'linear-gradient(135deg, #1890ff15, transparent)',
                                                    borderRadius:
                                                        '0 16px 0 100%',
                                                    opacity:
                                                        selectedPayment ===
                                                        method.value
                                                            ? 1
                                                            : 0,
                                                    transition:
                                                        'opacity 0.25s ease-out',
                                                }}
                                            />

                                            {/* Check icon */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 16,
                                                    right: 16,
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    background: '#1890ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: 16,
                                                    fontWeight: 'bold',
                                                    boxShadow:
                                                        '0 2px 8px rgba(24, 144, 255, 0.3)',
                                                    transform:
                                                        selectedPayment ===
                                                        method.value
                                                            ? 'scale(1)'
                                                            : 'scale(0)',
                                                    opacity:
                                                        selectedPayment ===
                                                        method.value
                                                            ? 1
                                                            : 0,
                                                    transition:
                                                        'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                }}
                                            >
                                                ✓
                                            </div>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 20,
                                                }}
                                            >
                                                {/* Payment logo */}
                                                <div
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: 16,
                                                        background:
                                                            selectedPayment ===
                                                            method.value
                                                                ? '#ffffff'
                                                                : '#f8f9fa',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'center',
                                                        border:
                                                            selectedPayment ===
                                                            method.value
                                                                ? '2px solid #1890ff20'
                                                                : '1px solid #e8e8e8',
                                                        transition:
                                                            'all 0.25s ease-out',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {React.cloneElement(
                                                        method.icon,
                                                        {
                                                            style: {
                                                                height: 40,
                                                                maxWidth: 60,
                                                                objectFit:
                                                                    'contain',
                                                                transition:
                                                                    'all 0.25s ease-out',
                                                            },
                                                        },
                                                    )}
                                                </div>

                                                {/* Payment info */}
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            fontSize: 18,
                                                            fontWeight: 700,
                                                            color:
                                                                selectedPayment ===
                                                                method.value
                                                                    ? '#1890ff'
                                                                    : '#1a1a1a',
                                                            marginBottom: 6,
                                                            transition:
                                                                'color 0.25s ease-out',
                                                        }}
                                                    >
                                                        {method.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 14,
                                                            color: '#666666',
                                                            lineHeight: 1.4,
                                                            marginBottom: 12,
                                                        }}
                                                    >
                                                        {getPaymentDescription(
                                                            method.value,
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow indicator */}
                                                <div
                                                    style={{
                                                        fontSize: 20,
                                                        color:
                                                            selectedPayment ===
                                                            method.value
                                                                ? '#1890ff'
                                                                : '#d9d9d9',
                                                        transition:
                                                            'all 0.25s ease-out',
                                                        transform:
                                                            selectedPayment ===
                                                            method.value
                                                                ? 'translateX(4px)'
                                                                : 'translateX(0)',
                                                    }}
                                                >
                                                    →
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Selected payment info */}
                            {selectedPayment && (
                                <div
                                    style={{
                                        marginTop: isMobile ? 16 : 24,
                                        padding: isMobile ? 16 : 20,
                                        borderRadius: 12,
                                        background: '#f8fafe',
                                        border: '1px solid #e6f7ff',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: '#52c41a',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: 12,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            ✓
                                        </div>
                                        <span
                                            style={{
                                                fontSize: isMobile ? 14 : 16,
                                                fontWeight: 600,
                                                color: '#1a1a1a',
                                            }}
                                        >
                                            Đã chọn:{' '}
                                            {
                                                paymentMethods.find(
                                                    (m) =>
                                                        m.value ===
                                                        selectedPayment,
                                                )?.label
                                            }
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: isMobile ? 13 : 14,
                                            color: '#666666',
                                            marginLeft: 32,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {getPaymentInstructions(
                                            selectedPayment,
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </Col>

                {/* RIGHT COLUMN */}
                <Col
                    xs={24}
                    md={9}
                    lg={7}
                    style={{ minWidth: isMobile ? 'auto' : 320 }}
                >
                    <div
                        style={{
                            position: isMobile ? 'static' : 'sticky',
                            top: isMobile ? 'auto' : 80,
                            zIndex: 2,
                        }}
                    >
                        {/* Thông tin đặt vé */}
                        <Card
                            style={{
                                background: '#ffffff',
                                borderRadius: isMobile ? 12 : 16,
                                marginBottom: isMobile ? 16 : 18,
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            }}
                            bodyStyle={{ padding: isMobile ? 16 : 24 }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? 16 : 18,
                                    color: '#262626',
                                    marginBottom: 8,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile
                                        ? 'flex-start'
                                        : 'center',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: isMobile ? 8 : 0,
                                }}
                            >
                                <span>Thông tin đặt vé</span>
                                <Button
                                    type="link"
                                    style={{
                                        color: '#1890ff',
                                        fontWeight: 600,
                                        padding: 0,
                                        fontSize: isMobile ? 14 : 16,
                                        height: 'auto',
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
                                        color: '#8c8c8c',
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
                                                fontSize: isMobile ? 14 : 16,
                                                fontWeight: 700,
                                                color: '#1890ff',
                                                marginBottom: 8,
                                                gap: 8,
                                            }}
                                        >
                                            <span style={{ flex: 1 }}>
                                                {ticket.name}{' '}
                                                <span
                                                    style={{
                                                        color: '#8c8c8c',
                                                        fontWeight: 500,
                                                        fontSize: isMobile
                                                            ? 13
                                                            : 15,
                                                    }}
                                                >
                                                    x{ticket.quantity}
                                                </span>
                                            </span>
                                            <span
                                                style={{
                                                    color: '#52c41a',
                                                    fontWeight: 700,
                                                    fontSize: isMobile
                                                        ? 14
                                                        : 16,
                                                    whiteSpace: 'nowrap',
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
                                background: '#ffffff',
                                borderRadius: isMobile ? 12 : 16,
                                border: '1px solid #f0f0f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            }}
                            bodyStyle={{ padding: isMobile ? 16 : 24 }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? 16 : 18,
                                    color: '#262626',
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
                                    fontSize: isMobile ? 14 : 16,
                                }}
                            >
                                <span style={{ color: '#595959' }}>
                                    Tạm tính
                                </span>
                                <span style={{ color: '#262626' }}>
                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                            <div
                                style={{
                                    borderTop: '1px dashed #d9d9d9',
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
                                        fontSize: isMobile ? 18 : 20,
                                        color: '#262626',
                                    }}
                                >
                                    Tổng tiền
                                </span>
                                <span
                                    style={{
                                        color: '#52c41a',
                                        fontWeight: 700,
                                        fontSize: isMobile ? 20 : 24,
                                    }}
                                >
                                    {order.totalPrice.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                style={{
                                    width: '100%',
                                    background: '#1890ff',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: isMobile ? 16 : 18,
                                    border: 'none',
                                    borderRadius: 8,
                                    boxShadow:
                                        '0 2px 8px rgba(24, 144, 255, 0.3)',
                                    marginTop: 8,
                                    height: isMobile ? 48 : 40,
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
                bodyStyle={{ textAlign: 'center', padding: isMobile ? 24 : 32 }}
                width={isMobile ? '90%' : 'auto'}
            >
                <div
                    style={{
                        fontWeight: 700,
                        fontSize: isMobile ? 18 : 20,
                        marginBottom: 12,
                        color: '#262626',
                    }}
                >
                    Hết thời gian giữ vé!
                </div>
                <div
                    style={{
                        fontSize: isMobile ? 32 : 38,
                        margin: '12px 0',
                        color: '#1890ff',
                    }}
                >
                    <span role="img" aria-label="bell">
                        🔔
                    </span>
                </div>
                <div
                    style={{
                        color: '#595959',
                        fontSize: isMobile ? 14 : 16,
                        marginBottom: 24,
                        lineHeight: 1.4,
                    }}
                >
                    Đã hết thời gian giữ vé. Vui lòng đặt lại vé mới.
                </div>
                <Button
                    type="primary"
                    size="large"
                    style={{
                        background: '#1890ff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: isMobile ? 16 : 18,
                        width: '100%',
                        borderRadius: 8,
                        height: isMobile ? 48 : 40,
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
                bodyStyle={{
                    borderRadius: 16,
                    padding: 0,
                    overflow: 'hidden',
                    minWidth: isMobile ? 0 : 700,
                    minHeight: isMobile ? 0 : 500,
                }}
                style={{
                    paddingTop: '5px',
                    minWidth: isMobile ? 0 : 750,
                }}
                zIndex={9000}
            >
                <div
                    style={{
                        background: '#ffffff',
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
                                style={{ height: isMobile ? 24 : 28 }}
                            />
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontSize: isMobile ? 16 : 22,
                                    marginLeft: 8,
                                    color: '#262626',
                                }}
                            >
                                Thanh toán bằng VietQR
                            </span>
                        </div>
                        <Button
                            type="link"
                            style={{
                                color: '#1890ff',
                                fontWeight: 600,
                                margin: isMobile ? '8px auto 0' : 0,
                                fontSize: isMobile ? 14 : 16,
                                padding: 0,
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
                            alignItems: 'center',
                        }}
                        items={[
                            {
                                key: 'qr',
                                label: (
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: isMobile ? 14 : 17,
                                            color:
                                                payosTab === 'qr'
                                                    ? '#1890ff'
                                                    : '#595959',
                                        }}
                                    >
                                        Thanh toán VietQR
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
                                            gap: 24,
                                            alignItems: isMobile
                                                ? 'center'
                                                : 'flex-start',
                                        }}
                                    >
                                        {/* Left Column - QR Code */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flex: isMobile ? 'none' : 1,
                                                minWidth: isMobile
                                                    ? 'auto'
                                                    : 300,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    background: '#fafafa',
                                                    borderRadius: 16,
                                                    marginBottom: 12,
                                                    border: '1px solid #f0f0f0',
                                                    padding: 8,
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
                                                            ? 200
                                                            : 268,
                                                        height: isMobile
                                                            ? 200
                                                            : 268,
                                                        background: '#ffffff',
                                                        borderRadius: 8,
                                                    }}
                                                />
                                            </div>
                                            <div
                                                style={{
                                                    color: '#8c8c8c',
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
                                                        ? 18
                                                        : 20,
                                                    color: '#52c41a',
                                                }}
                                            >
                                                {payosData?.amount?.toLocaleString(
                                                    'vi-VN',
                                                )}{' '}
                                                đ
                                            </div>
                                        </div>

                                        {/* Right Column - Instructions */}
                                        <div
                                            style={{
                                                flex: isMobile ? 'none' : 1,
                                                padding: isMobile
                                                    ? '0 8px'
                                                    : '0 0 0 24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isMobile
                                                    ? 'center'
                                                    : 'flex-start',
                                                minWidth: isMobile
                                                    ? 'auto'
                                                    : 300,
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
                                                    color: '#262626',
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
                                                    color: '#595959',
                                                    textAlign: 'left',
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
                                                    background: '#f0f2f5',
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    fontSize: isMobile
                                                        ? 14
                                                        : 16,
                                                    color: '#595959',
                                                }}
                                            >
                                                Giao dịch sẽ kết thúc sau
                                                <span
                                                    style={{
                                                        color: '#52c41a',
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
                                            fontSize: isMobile ? 14 : 17,
                                            color:
                                                payosTab === 'bank'
                                                    ? '#1890ff'
                                                    : '#595959',
                                        }}
                                    >
                                        Chuyển khoản
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
                                            gap: 24,
                                            alignItems: isMobile
                                                ? 'stretch'
                                                : 'flex-start',
                                        }}
                                    >
                                        {/* Left Column - Bank Info */}
                                        <div
                                            style={{
                                                background: '#fafafa',
                                                borderRadius: 16,
                                                border: '1px solid #f0f0f0',
                                                padding: isMobile ? 16 : 20,
                                                marginBottom: isMobile ? 16 : 0,
                                                flex: isMobile ? 'none' : 1,
                                                minWidth: isMobile
                                                    ? 'auto'
                                                    : 300,
                                            }}
                                        >
                                            {/* Bank info fields với responsive design */}
                                            {[
                                                {
                                                    label: 'Tên ngân hàng',
                                                    value:
                                                        bankMap[
                                                            payosData?.bin
                                                        ] ||
                                                        payosData?.bin ||
                                                        '---',
                                                },
                                                {
                                                    label: 'Tên tài khoản',
                                                    value:
                                                        payosData?.accountName ||
                                                        '---',
                                                },
                                                {
                                                    label: 'Số tài khoản',
                                                    value:
                                                        payosData?.accountNumber ||
                                                        '---',
                                                },
                                                {
                                                    label: 'Số tiền',
                                                    value: `${
                                                        payosData?.amount?.toLocaleString(
                                                            'vi-VN',
                                                        ) || '---'
                                                    } đ`,
                                                    isAmount: true,
                                                },
                                                {
                                                    label: 'Nội dung',
                                                    value:
                                                        payosData?.description ||
                                                        '---',
                                                },
                                            ].map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: 500,
                                                            color: '#8c8c8c',
                                                            marginBottom: 4,
                                                            fontSize: isMobile
                                                                ? 12
                                                                : 14,
                                                        }}
                                                    >
                                                        {item.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            gap: 8,
                                                            flexWrap: 'wrap',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontWeight: 700,
                                                                color: item.isAmount
                                                                    ? '#52c41a'
                                                                    : '#262626',
                                                                fontSize:
                                                                    isMobile
                                                                        ? 14
                                                                        : 16,
                                                                flex: 1,
                                                                wordBreak:
                                                                    'break-all',
                                                            }}
                                                        >
                                                            {item.value}
                                                        </span>
                                                        <Button
                                                            size="small"
                                                            style={{
                                                                borderColor:
                                                                    '#1890ff',
                                                                color: '#1890ff',
                                                                fontSize:
                                                                    isMobile
                                                                        ? 12
                                                                        : 14,
                                                                height: isMobile
                                                                    ? 28
                                                                    : 24,
                                                                padding:
                                                                    isMobile
                                                                        ? '0 8px'
                                                                        : '0 6px',
                                                            }}
                                                            onClick={() =>
                                                                handleCopy(
                                                                    item.value.replace(
                                                                        ' đ',
                                                                        '',
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            Copy
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Right Column - Instructions */}
                                        {!isMobile && (
                                            <div
                                                style={{
                                                    padding: '0 0 0 24px',
                                                    flex: isMobile ? 'none' : 1,
                                                    minWidth: isMobile
                                                        ? 'auto'
                                                        : 300,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: 20,
                                                        marginBottom: 12,
                                                        color: '#262626',
                                                    }}
                                                >
                                                    Chuyển khoản ngân hàng
                                                </div>
                                                <ol
                                                    style={{
                                                        paddingLeft: 20,
                                                        marginBottom: 16,
                                                        color: '#595959',
                                                    }}
                                                >
                                                    <li>
                                                        Mở ứng dụng Ngân hàng
                                                        trên điện thoại
                                                    </li>
                                                    <li>
                                                        Chọn tính năng chuyển
                                                        tiền, chọn ngân hàng và
                                                        sao chép "Số tài khoản"
                                                    </li>
                                                    <li>
                                                        Nhập chính xác "Số tiền"
                                                        và sao chép "Nội dung
                                                        chuyển khoản"
                                                    </li>
                                                    <li>
                                                        Thực hiện thanh toán và
                                                        xem kết quả giao dịch
                                                        tại trang này (không tắt
                                                        popup)
                                                    </li>
                                                </ol>
                                                <div
                                                    style={{
                                                        color: '#ff4d4f',
                                                        fontWeight: 600,
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Lưu ý: Nhập chính xác "Số
                                                    tiền" thanh toán
                                                </div>
                                                <div
                                                    style={{
                                                        background: '#f0f2f5',
                                                        borderRadius: 8,
                                                        padding: 12,
                                                        textAlign: 'center',
                                                        color: '#595959',
                                                        fontSize: isMobile
                                                            ? 14
                                                            : 16,
                                                        margin: isMobile
                                                            ? '16px 8px 0'
                                                            : '0',
                                                    }}
                                                >
                                                    Giao dịch sẽ kết thúc sau
                                                    <span
                                                        style={{
                                                            color: '#52c41a',
                                                            fontWeight: 700,
                                                            fontSize: isMobile
                                                                ? 16
                                                                : 18,
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        {formatCountdown(
                                                            timeLeft,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {isMobile && (
                                            <div
                                                style={{
                                                    background: '#f0f2f5',
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    textAlign: 'center',
                                                    color: '#595959',
                                                    fontSize: isMobile
                                                        ? 14
                                                        : 16,
                                                    margin: isMobile
                                                        ? '16px 8px 0'
                                                        : '0',
                                                }}
                                            >
                                                Giao dịch sẽ kết thúc sau
                                                <span
                                                    style={{
                                                        color: '#52c41a',
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
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            </Modal>

            {/* Fixed bottom payment button for mobile */}
            {isMobile && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        borderTop: '1px solid #f0f0f0',
                        padding: '12px 16px',
                        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 14,
                                color: '#595959',
                            }}
                        >
                            Tổng tiền
                        </span>
                        <span
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#52c41a',
                            }}
                        >
                            {order.totalPrice.toLocaleString('vi-VN')} đ
                        </span>
                    </div>
                    <Button
                        type="primary"
                        size="large"
                        block
                        style={{
                            background: '#1890ff',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: 16,
                            border: 'none',
                            borderRadius: 8,
                            height: 48,
                            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                        }}
                        onClick={handlePayment}
                        disabled={!name.trim() || !phone.trim()}
                    >
                        {!name.trim() || !phone.trim()
                            ? 'Vui lòng nhập thông tin khách hàng'
                            : 'Thanh toán ngay'}
                    </Button>
                </div>
            )}

            {/* Add padding to prevent content being hidden behind fixed button */}
            {isMobile && <div style={{ height: 100 }} />}
        </div>
    );
}

export default OrderPage;
