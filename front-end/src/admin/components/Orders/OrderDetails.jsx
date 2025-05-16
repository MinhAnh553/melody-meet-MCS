import React from 'react';
import { Badge } from 'react-bootstrap';
import styles from './Orders.module.css';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const OrderDetails = ({ order }) => {
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

    return (
        <div className={styles.orderDetailsCard}>
            {/* Header */}
            <div className={styles.orderDetailsHeader}>
                <div className={styles.orderInfo}>
                    <div className={styles.orderIDLabel}>Mã đơn hàng</div>
                    <div className={styles.orderID}>{order.orderId}</div>

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
                                {order.infoUser?.name}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Email</span>
                            <span className={styles.infoValue}>
                                {order.infoUser?.email}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                                Số điện thoại
                            </span>
                            <span className={styles.infoValue}>
                                {order.infoUser?.phone}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Thông tin sự kiện */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>
                    Thông tin sự kiện
                </h4>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tên sự kiện</span>
                    <span className={styles.infoValue}>{order.eventName}</span>
                </div>
            </div>

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
