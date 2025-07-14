import React, { useEffect, useState } from 'react';
import {
    Row,
    Col,
    Card,
    Button,
    Typography,
    InputNumber,
    Tag,
    message,
} from 'antd';
import {
    ArrowLeftOutlined,
    MinusOutlined,
    PlusOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone,
    CalendarOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';

const { Text, Title } = Typography;

// Add custom CSS to override Ant Design styles
const customStyles = `
    .ant-input-number-input {
        color: #ffffff !important;
        text-align: center !important;
    }
    .ant-input-number {
        background: #27272a !important;
        border: 1px solid rgb(45, 194, 117) !important;
        border-radius: 8px !important;
    }
`;

const SelectTicket = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const getUser = async () => {
        const res = await api.getAccount();
        return res.user;
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getUser();
                if (user) {
                    setName(user.name || '');
                    setPhone(user.phone || '');
                    setEmail(user.email || '');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const res = await api.getEventById(eventId);
                if (res.success) {
                    setEvent(res.data);
                    setQuantities(res.data.ticketTypes.map(() => 0));
                } else {
                    message.error(res.message || 'Không tìm thấy sự kiện');
                }
            } catch (error) {
                message.error('Lỗi khi tải sự kiện');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (loading) return <div style={{ minHeight: 300 }} />;
    if (!event) return null;

    const handleQuantityChange = (index, newValue) => {
        const ticket = event.ticketTypes[index];
        const { maxPerUser, totalQuantity } = ticket;
        const validValue = Math.max(
            0,
            Math.min(newValue, maxPerUser, totalQuantity - ticket.quantitySold),
        );
        setQuantities((prev) => {
            const newArr = [...prev];
            newArr[index] = validValue;
            return newArr;
        });
    };

    const totalPrice = event.ticketTypes.reduce(
        (acc, ticket, i) => acc + ticket.price * quantities[i],
        0,
    );
    const totalQuantity = quantities.reduce((acc, q) => acc + q, 0);
    const isCheckoutDisabled = totalQuantity === 0;
    const displayPrice = totalPrice.toLocaleString('vi-VN') + ' đ';

    const handleCheckout = () => {
        // Lấy thông tin user hiện tại hoặc để trống để OrderPage xử lý
        const buyerInfo = {
            name,
            phone,
            email,
        };
        handleInfoConfirmed(buyerInfo);
    };

    const handleInfoConfirmed = async (buyerInfo) => {
        try {
            const items = event.ticketTypes
                .map((ticket, i) => ({
                    ticketId: ticket._id,
                    name: ticket.name,
                    quantity: quantities[i],
                    price: ticket.price,
                }))
                .filter((item) => item.quantity >= 1);
            const formData = new FormData();
            formData.append('items', JSON.stringify(items));
            formData.append('totalPrice', totalPrice);
            formData.append('buyerInfo', JSON.stringify(buyerInfo));
            const res = await api.createOrder(event._id, formData);
            if (res.success) {
                navigate(
                    `/event/${eventId}/bookings/${res.orderId}/payment-info`,
                );
            } else {
                return swalCustomize.Toast.fire({
                    icon: 'error',
                    title: res.message || 'Tạo đơn hàng thất bại!',
                });
            }
        } catch (error) {
            return swalCustomize.Toast.fire({
                icon: 'error',
                title: error.message || 'Server Error!',
            });
        }
    };

    // Format date/time
    const formatDateTime = (iso) => {
        const d = new Date(iso);
        return (
            d.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            }) +
            ', ' +
            d.toLocaleDateString('vi-VN')
        );
    };

    // Responsive: card info sticky on desktop, block on mobile
    return (
        <>
            <style>{customStyles}</style>
            <div
                style={{
                    minHeight: '100vh',
                    background: '#27272a',
                    color: '#d4d4d8',
                    marginTop: '85px',
                }}
            >
                <Row
                    gutter={[32, 32]}
                    justify="center"
                    style={{
                        maxWidth: 1400,
                        margin: '0 auto',
                        padding: '32px 0',
                    }}
                >
                    {/* LEFT: Vé */}
                    <Col xs={24} md={15} lg={15} style={{ minHeight: 600 }}>
                        <div style={{ maxWidth: 700, margin: '0 auto' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: 32,
                                }}
                            >
                                <Button
                                    type="link"
                                    icon={
                                        <ArrowLeftOutlined
                                            style={{
                                                fontSize: 22,
                                                color: 'rgb(45, 194, 117)',
                                            }}
                                        />
                                    }
                                    style={{
                                        color: 'rgb(45, 194, 117)',
                                        fontWeight: 600,
                                        fontSize: 18,
                                        paddingLeft: 0,
                                    }}
                                    onClick={() =>
                                        navigate(`/event/${eventId}`)
                                    }
                                >
                                    Trở về
                                </Button>
                                <div
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        marginRight: 60,
                                    }}
                                >
                                    <Title
                                        level={2}
                                        style={{
                                            color: 'rgb(45, 194, 117)',
                                            margin: 0,
                                            fontWeight: 700,
                                            fontSize: 28,
                                        }}
                                    >
                                        Chọn vé
                                    </Title>
                                </div>
                            </div>
                            <Row
                                style={{
                                    fontWeight: 600,
                                    fontSize: 20,
                                    color: '#d4d4d8',
                                    marginBottom: 16,
                                }}
                            >
                                <Col span={12}>Loại vé</Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    Số lượng
                                </Col>
                            </Row>
                            <div
                                style={{
                                    borderRadius: 12,
                                    // background: '#18181b',
                                    padding: 0,
                                }}
                            >
                                {event.ticketTypes.map((ticket, idx) => {
                                    const quantity = quantities[idx];
                                    const max = Math.min(
                                        ticket.maxPerUser,
                                        ticket.totalQuantity -
                                            ticket.quantitySold,
                                    );
                                    const soldOut =
                                        ticket.totalQuantity -
                                            ticket.quantitySold <=
                                        0;
                                    return (
                                        <Row
                                            key={ticket._id}
                                            align="middle"
                                            style={{
                                                borderBottom:
                                                    '1px dashed #3f3f46',
                                                padding: '24px 0',
                                                minHeight: 80,
                                            }}
                                        >
                                            <Col
                                                xs={16}
                                                style={{
                                                    color: soldOut
                                                        ? '#71717a'
                                                        : 'rgb(45, 194, 117)',
                                                    fontWeight: 700,
                                                    fontSize: 20,
                                                }}
                                            >
                                                {ticket.name}
                                                {ticket.description && (
                                                    <div
                                                        style={{
                                                            color: '#d4d4d8',
                                                            fontSize: 14,
                                                            fontWeight: 400,
                                                            marginTop: 2,
                                                            marginLeft: 2,
                                                        }}
                                                    >
                                                        {ticket.description}
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        color: '#d4d4d8',
                                                        fontWeight: 400,
                                                        fontSize: 16,
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {ticket.price.toLocaleString(
                                                        'vi-VN',
                                                    )}{' '}
                                                    đ
                                                </div>
                                            </Col>
                                            <Col
                                                xs={8}
                                                style={{ textAlign: 'right' }}
                                            >
                                                {soldOut ? (
                                                    <Tag
                                                        color="#f4cccc"
                                                        style={{
                                                            color: '#d32f2f',
                                                            background:
                                                                '#f4cccc',
                                                            fontWeight: 600,
                                                            fontSize: 18,
                                                            borderRadius: 8,
                                                            padding: '4px 16px',
                                                        }}
                                                    >
                                                        Hết vé
                                                    </Tag>
                                                ) : (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                            justifyContent:
                                                                'flex-end',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <Button
                                                            icon={
                                                                <MinusOutlined />
                                                            }
                                                            size="small"
                                                            style={{
                                                                border: '1px solid rgb(45, 194, 117)',
                                                                color: 'rgb(45, 194, 117)',
                                                                background:
                                                                    'transparent',
                                                            }}
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    idx,
                                                                    quantity -
                                                                        1,
                                                                )
                                                            }
                                                            disabled={
                                                                quantity <= 0
                                                            }
                                                        />
                                                        <InputNumber
                                                            min={0}
                                                            max={max}
                                                            value={quantity}
                                                            onChange={(val) =>
                                                                handleQuantityChange(
                                                                    idx,
                                                                    val,
                                                                )
                                                            }
                                                            style={{
                                                                width: 56,
                                                                background:
                                                                    '#27272a',
                                                                color: '#ffffff',
                                                                border: '1px solid rgb(45, 194, 117)',
                                                                borderRadius: 8,
                                                            }}
                                                            controls={false}
                                                        />
                                                        <Button
                                                            icon={
                                                                <PlusOutlined />
                                                            }
                                                            size="small"
                                                            style={{
                                                                border: '1px solid rgb(45, 194, 117)',
                                                                color: 'rgb(45, 194, 117)',
                                                                background:
                                                                    'transparent',
                                                            }}
                                                            onClick={() =>
                                                                handleQuantityChange(
                                                                    idx,
                                                                    quantity +
                                                                        1,
                                                                )
                                                            }
                                                            disabled={
                                                                quantity >= max
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                    {/* RIGHT: Thông tin sự kiện */}
                    <Col xs={24} md={9} lg={7} style={{ minWidth: 320 }}>
                        <div
                            style={{
                                position: 'sticky',
                                top: 80,
                                zIndex: 2,
                                background: '#18181b',
                                borderRadius: 16,
                                boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                                padding: 28,
                                color: '#d4d4d8',
                            }}
                        >
                            <Title
                                level={4}
                                style={{
                                    color: '#d4d4d8',
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    fontSize: 22,
                                    lineHeight: 1.3,
                                }}
                            >
                                {event.name}
                            </Title>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 8,
                                }}
                            >
                                <CalendarOutlined
                                    style={{
                                        color: 'rgb(45, 194, 117)',
                                        fontSize: 18,
                                    }}
                                />
                                <span style={{ fontWeight: 500, fontSize: 16 }}>
                                    {formatDateTime(event.startTime)}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 18,
                                }}
                            >
                                <EnvironmentOutlined
                                    style={{
                                        color: 'rgb(45, 194, 117)',
                                        fontSize: 18,
                                    }}
                                />
                                <span style={{ fontWeight: 500, fontSize: 16 }}>
                                    {event.location.venueName}
                                </span>
                            </div>
                            <div
                                style={{
                                    borderTop: '1px solid #3f3f46',
                                    margin: '16px 0 12px',
                                }}
                            />
                            <div
                                style={{
                                    fontWeight: 600,
                                    color: '#d4d4d8',
                                    marginBottom: 8,
                                    fontSize: 17,
                                }}
                            >
                                Vé đã chọn
                            </div>
                            <div style={{ marginBottom: 18 }}>
                                {event.ticketTypes.filter(
                                    (_, idx) => quantities[idx] > 0,
                                ).length === 0 ? (
                                    <div
                                        style={{
                                            color: '#71717a',
                                            fontSize: 15,
                                            fontWeight: 400,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Chưa chọn vé nào
                                    </div>
                                ) : (
                                    event.ticketTypes.map((ticket, idx) => {
                                        const quantity = quantities[idx];
                                        if (quantity <= 0) return null;
                                        return (
                                            <div
                                                key={ticket._id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
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
                                                            color: '#d4d4d8',
                                                            fontWeight: 500,
                                                            fontSize: 15,
                                                        }}
                                                    >
                                                        x{quantity}
                                                    </span>
                                                </span>
                                                <span>
                                                    {(
                                                        ticket.price * quantity
                                                    ).toLocaleString(
                                                        'vi-VN',
                                                    )}{' '}
                                                    đ
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div
                                style={{
                                    borderTop: '1px solid #3f3f46',
                                    margin: '16px 0 12px',
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
                                <span style={{ fontWeight: 600, fontSize: 18 }}>
                                    Tổng tiền
                                </span>
                                <span
                                    style={{
                                        color: 'rgb(45, 194, 117)',
                                        fontWeight: 700,
                                        fontSize: 22,
                                    }}
                                >
                                    {displayPrice}
                                </span>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                icon={
                                    <CheckCircleTwoTone twoToneColor="rgb(45, 194, 117),#27272a" />
                                }
                                disabled={isCheckoutDisabled}
                                onClick={handleCheckout}
                                style={{
                                    width: '100%',
                                    background: isCheckoutDisabled
                                        ? '#3f3f46'
                                        : 'rgb(45, 194, 117)',
                                    color: isCheckoutDisabled
                                        ? '#d4d4d8'
                                        : '#18181b',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    border: 'none',
                                    borderRadius: 8,
                                    boxShadow: 'none',
                                    marginTop: 8,
                                    opacity: isCheckoutDisabled ? 0.7 : 1,
                                    transition: 'background 0.2s',
                                }}
                            >
                                {isCheckoutDisabled
                                    ? 'Vui lòng chọn vé'
                                    : 'Tiếp tục đặt vé'}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default SelectTicket;
