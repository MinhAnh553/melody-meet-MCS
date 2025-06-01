import React from 'react';
import { Badge } from 'react-bootstrap';
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaTicketAlt,
    FaClock,
    FaUser,
    FaMoneyBillWave,
    FaInfoCircle,
} from 'react-icons/fa';

import styles from './Orders.module.css';
import {
    formatCurrency,
    formatDateTime,
    formatDate,
} from '../../utils/formatters';

const OrderDetails = ({ order }) => {
    if (!order) return null;

    // Destructuring dữ liệu
    const {
        orderCode,
        buyerInfo,
        eventName,
        totalPrice,
        status,
        tickets,
        createdAt,
    } = order;

    // Badge trạng thái đơn hàng
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePaid}`}
                    >
                        Đã thanh toán
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
            case 'CANCELED':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCanceled}`}
                    >
                        Đã hủy
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    return (
        <div className={styles.orderDetailsCard}>
            {/* Header Đơn Hàng */}
            <div className={styles.orderDetailsHeader}>
                <div className={styles.orderInfo}>
                    <div className={styles.orderID}>
                        Mã đơn hàng: {orderCode}
                    </div>
                    <div className={styles.orderDate}>
                        <FaClock />
                        {formatDateTime(createdAt)}
                    </div>
                </div>
                <div className={styles.orderStatusContainer}>
                    <div className={styles.orderTotalLabel}>Trạng thái</div>
                    {getStatusBadge(status)}
                </div>
            </div>

            {/* Thông tin người mua */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaUser className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Thông tin người mua
                    </h4>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoRow}>
                        <FaUser className={styles.infoIcon} />
                        <span className={styles.infoValue}>
                            {buyerInfo.name || 'Không có tên'}
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaInfoCircle className={styles.infoIcon} />
                        <span className={styles.infoValue}>
                            {buyerInfo.email}
                        </span>
                    </div>
                    <div className={styles.infoRow}>
                        <FaMapMarkerAlt className={styles.infoIcon} />
                        <span className={styles.infoValue}>
                            {buyerInfo.phone || 'Không có số điện thoại'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Thông tin sự kiện */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaCalendarAlt className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Thông tin sự kiện
                    </h4>
                </div>
                <div className={styles.infoItem}>
                    <div className={styles.infoRow}>
                        <FaTicketAlt className={styles.infoIcon} />
                        <span className={styles.infoValue}>{eventName}</span>
                    </div>
                </div>
            </div>

            {/* Chi tiết vé */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaTicketAlt className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Chi tiết vé
                    </h4>
                </div>
                {tickets && tickets.length > 0 ? (
                    <div className={styles.ticketList}>
                        {tickets.map((ticket, index) => (
                            <div key={index} className={styles.ticketItem}>
                                <div className={styles.ticketInfo}>
                                    <div className={styles.ticketTitle}>
                                        {ticket.name}
                                    </div>
                                    <div className={styles.ticketDetails}>
                                        <div className={styles.ticketDetail}>
                                            <FaMoneyBillWave
                                                className={styles.ticketIcon}
                                            />
                                            <span>
                                                {formatCurrency(
                                                    ticket.price || 0,
                                                )}
                                            </span>
                                        </div>
                                        <div className={styles.ticketDetail}>
                                            <FaTicketAlt
                                                className={styles.ticketIcon}
                                            />
                                            <span>
                                                Số lượng: {ticket.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Chưa có thông tin vé.</p>
                )}
            </div>

            {/* Tổng tiền */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaMoneyBillWave className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Tổng tiền
                    </h4>
                </div>
                <div className={styles.totalPriceContainer}>
                    <div className={styles.totalPriceLabel}>
                        Tổng thanh toán
                    </div>
                    <div className={styles.totalPriceValue}>
                        {formatCurrency(totalPrice)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
