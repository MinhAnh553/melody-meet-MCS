import React, { useEffect, useState } from 'react';
import { Badge } from 'react-bootstrap';
import styles from './Orders.module.css';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import api from '../../../util/api';

const OrderDetails = ({ order }) => {
    const [eventInfo, setEventInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEventInfo = async () => {
            try {
                const res = await api.getEventById(order.eventId);
                if (res.success) {
                    setEventInfo(res.data);
                }
            } catch (error) {
                console.error('Lỗi khi lấy thông tin sự kiện:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventInfo();
    }, [order.eventId]);

    if (!order) return null;

    // Trả về Badge tùy theo trạng thái "PAID", "CANCELED", "PENDING"...
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCompleted}`}
                    >
                        Đã thanh toán
                    </Badge>
                );
            case 'CANCELED':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCancelled}`}
                    >
                        Đã hủy
                    </Badge>
                );
            case 'PENDING':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePending}`}
                    >
                        Đang chờ
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="text-center my-3">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2">Đang tải thông tin...</p>
            </div>
        );
    }

    return (
        <div className={styles.orderDetailsCard}>
            {/* Header */}
            <div className={styles.orderDetailsHeader}>
                <div className={styles.orderInfo}>
                    <div className={styles.orderIDLabel}>Mã đơn hàng</div>
                    <div className={styles.orderID}>{order.orderCode}</div>

                    <div className={styles.orderDate}>
                        Ngày đặt: {formatDateTime(order.createdAt)}
                    </div>
                </div>

                <div className={styles.orderStatusContainer}>
                    <div className={styles.orderTotalLabel}>Tổng tiền</div>
                    <div className={styles.orderTotal}>
                        {formatCurrency(order.totalPrice)}
                    </div>
                    {getStatusBadge(order.status)}
                </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>
                    Thông tin khách hàng
                </h4>
                <div className={styles.orderUserInfo}>
                    <div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Họ tên</span>
                            <span className={styles.infoValue}>
                                {order.buyerInfo?.name}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Email</span>
                            <span className={styles.infoValue}>
                                {order.buyerInfo?.email}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                                Số điện thoại
                            </span>
                            <span className={styles.infoValue}>
                                {`+${order.buyerInfo?.phone}`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thông tin sự kiện */}
            {eventInfo && (
                <div className={styles.orderDetailsSection}>
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Thông tin sự kiện
                    </h4>
                    <div className={styles.orderUserInfo}>
                        <div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    Tên sự kiện
                                </span>
                                <span className={styles.infoValue}>
                                    {eventInfo.name}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    Địa điểm
                                </span>
                                <span className={styles.infoValue}>
                                    {eventInfo.location.venueName}
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    Thời gian
                                </span>
                                <span className={styles.infoValue}>
                                    {formatDateTime(eventInfo.startTime)} -{' '}
                                    {formatDateTime(eventInfo.endTime)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vé đã mua */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>
                    Thông tin vé
                </h4>
                {order.tickets && order.tickets.length > 0 ? (
                    order.tickets.map((ticket, index) => (
                        <div key={index} className={styles.ticketItem}>
                            <div className={styles.ticketInfo}>
                                <div className={styles.ticketTitle}>
                                    {ticket.name}
                                </div>
                                <div className={styles.ticketDetails}>
                                    {ticket.quantity} x{' '}
                                    {formatCurrency(ticket.price)}
                                </div>
                            </div>
                            <div className={styles.ticketPrice}>
                                {formatCurrency(ticket.price * ticket.quantity)}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Chưa có vé nào.</p>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;
