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
        text-align: center !important;
    }
    .ant-input-number {
        border: none !important;
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
                    marginTop: '85px',
                    background: '#ffffff',
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
                                                color: '#1890ff',
                                            }}
                                        />
                                    }
                                    style={{
                                        color: '#1890ff',
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
                                            color: '#1890ff',
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
                                    color: '#595959',
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
                                    background: '#ffffff',
                                    border: '1px solid #f0f0f0',
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
                                                    '1px dashed #e8e8e8',
                                                padding: '24px 20px',
                                                minHeight: 80,
                                                background:
                                                    idx % 2 === 0
                                                        ? '#fafafa'
                                                        : '#ffffff',
                                            }}
                                        >
                                            <Col
                                                xs={16}
                                                style={{
                                                    color: soldOut
                                                        ? '#bfbfbf'
                                                        : '#1890ff',
                                                    fontWeight: 700,
                                                    fontSize: 20,
                                                }}
                                            >
                                                {ticket.name}
                                                {ticket.description && (
                                                    <div
                                                        style={{
                                                            color: '#595959',
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
                                                        color: '#52c41a',
                                                        fontWeight: 600,
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
                                                        color="#ffebee"
                                                        style={{
                                                            color: '#f5222d',
                                                            background:
                                                                '#ffebee',
                                                            fontWeight: 600,
                                                            fontSize: 18,
                                                            borderRadius: 8,
                                                            padding: '4px 16px',
                                                            border: '1px solid #ffcdd2',
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
                                                                border: '1px solid #1890ff',
                                                                color: '#1890ff',
                                                                background:
                                                                    '#ffffff',
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
                                                                    '#ffffff',
                                                                color: '#262626',
                                                                border: '1px solid #1890ff',
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
                                                                border: '1px solid #1890ff',
                                                                color: '#1890ff',
                                                                background:
                                                                    '#ffffff',
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
                                background: '#ffffff',
                                borderRadius: 16,
                                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                                border: '1px solid #f0f0f0',
                                padding: 28,
                                color: '#262626',
                            }}
                        >
                            <Title
                                level={4}
                                style={{
                                    color: '#1890ff',
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
                                        color: '#722ed1',
                                        fontSize: 18,
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 500,
                                        fontSize: 16,
                                        color: '#434343',
                                    }}
                                >
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
                                        color: '#fa541c',
                                        fontSize: 18,
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 500,
                                        fontSize: 16,
                                        color: '#434343',
                                    }}
                                >
                                    {event.location.venueName}
                                </span>
                            </div>
                            <div
                                style={{
                                    borderTop: '1px solid #e8e8e8',
                                    margin: '16px 0 12px',
                                }}
                            />
                            <div
                                style={{
                                    fontWeight: 600,
                                    color: '#262626',
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
                                            color: '#8c8c8c',
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
                                                    color: '#1890ff',
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <span>
                                                    {ticket.name}{' '}
                                                    <span
                                                        style={{
                                                            color: '#595959',
                                                            fontWeight: 500,
                                                            fontSize: 15,
                                                        }}
                                                    >
                                                        x{quantity}
                                                    </span>
                                                </span>
                                                <span
                                                    style={{ color: '#52c41a' }}
                                                >
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
                                    borderTop: '1px solid #e8e8e8',
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
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: 18,
                                        color: '#262626',
                                    }}
                                >
                                    Tổng tiền
                                </span>
                                <span
                                    style={{
                                        color: '#52c41a',
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
                                    <CheckCircleTwoTone twoToneColor="#52c41a,#ffffff" />
                                }
                                disabled={isCheckoutDisabled}
                                onClick={handleCheckout}
                                style={{
                                    width: '100%',
                                    background: isCheckoutDisabled
                                        ? '#d9d9d9'
                                        : '#1890ff',
                                    color: isCheckoutDisabled
                                        ? '#8c8c8c'
                                        : '#ffffff',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    border: 'none',
                                    borderRadius: 8,
                                    boxShadow: isCheckoutDisabled
                                        ? 'none'
                                        : '0 2px 8px rgba(24, 144, 255, 0.3)',
                                    marginTop: 8,
                                    opacity: isCheckoutDisabled ? 0.7 : 1,
                                    transition: 'all 0.3s',
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
