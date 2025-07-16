import React from 'react';
import { Badge } from 'react-bootstrap';
import styles from './Orders.module.css';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const OrderDetails = ({ order, onClose }) => {
    if (!order) return null;
    const {
        orderCode,
        buyerInfo,
        totalPrice,
        status,
        tickets,
        createdAt,
        paymentInfo,
        discount,
        eventName,
        shippingFee,
        promotionCode,
        pointsUsed,
        finalAmount,
    } = order;

    // Badge trạng thái đơn hàng
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID':
                return (
                    <Badge className={styles.statusBadgePaid}>
                        Đã giao hàng
                    </Badge>
                );
            case 'PENDING':
                return (
                    <Badge className={styles.statusBadgePending}>
                        Chờ xử lý
                    </Badge>
                );
            case 'CANCELED':
                return (
                    <Badge className={styles.statusBadgeCanceled}>Đã hủy</Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    return (
        <div className={styles.orderDetailsGridContainer}>
            {/* Header */}
            <div className={styles.orderDetailsGridHeader}>
                <div>
                    <span className={styles.orderDetailsOrderCodeLink}>
                        Đơn hàng: <b>{orderCode}</b>
                    </span>
                    <span className={styles.orderDetailsOrderDate}>
                        {formatDateTime(createdAt)}
                    </span>
                </div>
                <div>{getStatusBadge(status)}</div>
            </div>
            <div className={styles.orderDetailsGridContent}>
                {/* Cột trái */}
                <div className={styles.orderDetailsGridLeft}>
                    {/* Box khách hàng */}
                    <div className={styles.orderDetailsBox}>
                        <div className={styles.orderDetailsBoxTitle}>
                            KHÁCH HÀNG
                        </div>
                        <div className={styles.orderDetailsBoxContent}>
                            <div>{buyerInfo?.name}</div>
                            <div>{buyerInfo?.phone}</div>
                        </div>
                    </div>
                    {/* Table sản phẩm */}
                    <div className={styles.orderDetailsBox}>
                        <div className={styles.orderDetailsBoxTitle}>
                            {eventName}
                        </div>
                        <div className={styles.orderDetailsTableWrapper}>
                            <table className={styles.orderDetailsTable}>
                                <thead>
                                    <tr>
                                        <th>Tên vé</th>
                                        {/* <th>Mã vạch</th> */}
                                        <th>Số lượng</th>
                                        <th>Đơn giá</th>
                                        <th>Tổng tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets && tickets.length > 0 ? (
                                        tickets.map((ticket, idx) => (
                                            <tr key={idx}>
                                                <td>{ticket.name}</td>
                                                {/* <td>{ticket.barcode || '-'}</td> */}
                                                <td>{ticket.quantity}</td>
                                                <td>
                                                    {formatCurrency(
                                                        ticket.price,
                                                    )}
                                                </td>
                                                <td>
                                                    {formatCurrency(
                                                        ticket.price *
                                                            ticket.quantity,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                style={{ textAlign: 'center' }}
                                            >
                                                Không có sản phẩm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* Cột phải */}
                <div className={styles.orderDetailsGridRight}>
                    {/* Box phương thức thanh toán */}
                    <div className={styles.orderDetailsBox}>
                        <div className={styles.orderDetailsBoxTitle}>
                            PHƯƠNG THỨC THANH TOÁN
                        </div>
                        <div className={styles.orderDetailsBoxContent}>
                            {/* Hiển thị phương thức mới nếu có */}
                            {order.payment && order.payment.method ? (
                                <>
                                    <div>
                                        Phương thức:{' '}
                                        <b>{order.payment.method}</b>
                                    </div>
                                    {/* Nếu có attempts, hiển thị trạng thái lần gần nhất */}
                                    {Array.isArray(order.payment.attempts) &&
                                        order.payment.attempts.length > 0 && (
                                            <div>
                                                Trạng thái:{' '}
                                                <b>
                                                    {
                                                        order.payment.attempts[
                                                            order.payment
                                                                .attempts
                                                                .length - 1
                                                        ].status
                                                    }
                                                </b>
                                            </div>
                                        )}
                                </>
                            ) : (
                                <>
                                    <div>
                                        Tiền mặt:{' '}
                                        {formatCurrency(paymentInfo?.cash || 0)}
                                    </div>
                                    <div>
                                        Chuyển khoản:{' '}
                                        {formatCurrency(paymentInfo?.bank || 0)}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Box tổng kết */}
                    <div className={styles.orderDetailsBox}>
                        <div className={styles.orderDetailsBoxTitle}>
                            Tạm tính <span>{formatCurrency(totalPrice)}</span>
                        </div>
                        {discount && (
                            <div className={styles.orderDetailsSummaryRow}>
                                Khuyến mãi{' '}
                                <span className={styles.orderDetailsMinus}>
                                    -{formatCurrency(discount)}
                                </span>
                            </div>
                        )}
                        {shippingFee !== undefined && (
                            <div className={styles.orderDetailsSummaryRow}>
                                Phí vận chuyển{' '}
                                <span
                                    className={
                                        shippingFee === 0
                                            ? styles.orderDetailsFree
                                            : ''
                                    }
                                >
                                    {shippingFee === 0
                                        ? 'Miễn phí'
                                        : formatCurrency(shippingFee)}
                                </span>
                            </div>
                        )}
                        {promotionCode && (
                            <div className={styles.orderDetailsSummaryRow}>
                                Mã giảm giá{' '}
                                <span className={styles.orderDetailsMinus}>
                                    -{formatCurrency(promotionCode.value)}
                                </span>
                            </div>
                        )}
                        {pointsUsed && (
                            <div className={styles.orderDetailsSummaryRow}>
                                Dùng điểm{' '}
                                <span className={styles.orderDetailsMinus}>
                                    -{formatCurrency(pointsUsed)}
                                </span>
                            </div>
                        )}
                        {/* Cần thanh toán tuỳ trạng thái */}
                        {status === 'CANCELED' ? (
                            <div
                                className={styles.orderDetailsSummaryRowTotal}
                                style={{ color: '#888' }}
                            >
                                Đơn đã hủy <span>0 đ</span>
                            </div>
                        ) : status === 'PAID' ? (
                            <div className={styles.orderDetailsSummaryRowTotal}>
                                Đã thanh toán{' '}
                                <span>
                                    {formatCurrency(finalAmount || totalPrice)}
                                </span>
                            </div>
                        ) : (
                            <div className={styles.orderDetailsSummaryRowTotal}>
                                Cần thanh toán{' '}
                                <span>
                                    {formatCurrency(finalAmount || totalPrice)}
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Nút đóng */}
                    <div className={styles.orderDetailsActionRow}>
                        <button
                            className={styles.orderDetailsCloseBtn}
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
