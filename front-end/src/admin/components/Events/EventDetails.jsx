import React from 'react';
import { Badge } from 'react-bootstrap';
import DOMPurify from 'dompurify';

import styles from './Events.module.css'; // Đổi sang Events.module.css nếu muốn
import { formatDate } from '../../utils/formatters';
import TimeText from '../../../client/components/providers/TimeText';
// Nếu có formatCurrency, formatDate,... thì import chúng tương tự

const EventDetails = ({ event }) => {
    if (!event) return null;

    // Destructuring dữ liệu
    const {
        name,
        background,
        description,
        startTime,
        endTime,
        location,
        organizer,
        ticketTypes,
        status,
    } = event;

    // Badge trạng thái sự kiện
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCompleted}`}
                    >
                        Đã duyệt
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgePending}`}
                    >
                        Đang chờ duyệt
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCancelled}`}
                    >
                        Đã từ chối
                    </Badge>
                );
            case 'event_over':
                return (
                    <Badge
                        className={`${styles.statusBadge} ${styles.statusBadgeCompleted}`}
                    >
                        Đã diễn ra
                    </Badge>
                );
            default:
                return <Badge className={styles.statusBadge}>{status}</Badge>;
        }
    };

    return (
        <div className={styles.orderDetailsCard}>
            {/* Header Sự Kiện */}
            <div className={styles.orderDetailsHeader}>
                <div className={styles.orderInfo}>
                    <div className={styles.orderID}>{name}</div>
                    <div className={styles.orderDate}>
                        {/* <strong>Bắt đầu:</strong>{' '}
                        {startTime ? formatDate(startTime) : '...'}
                        <br />
                        <strong>Kết thúc:</strong>{' '}
                        {endTime ? formatDate(endTime) : '...'} */}
                        <i className="bi bi-clock"></i>
                        {'  '}
                        <span style={{ color: 'rgb(45, 194, 117)' }}>
                            <TimeText event={event} />
                        </span>
                    </div>
                </div>
                <div className={styles.orderStatusContainer}>
                    <div className={styles.orderTotalLabel}>Trạng thái</div>
                    {getStatusBadge(status)}
                </div>
            </div>

            {/* Ảnh nền */}
            {background && (
                <div className={styles.orderDetailsSection}>
                    <img
                        src={background}
                        alt={name}
                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                    />
                </div>
            )}

            {/* Thông tin địa điểm */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>Địa điểm</h4>
                {location ? (
                    <div className={styles.infoItem}>
                        <span className={styles.infoValue}>
                            {location.address
                                ? `${location.venueName}, ${location.address}, ${location.ward}, ${location.district}, ${location.province}`
                                : 'Đang cập nhật'}
                        </span>
                    </div>
                ) : (
                    <p>Chưa có thông tin địa điểm.</p>
                )}
            </div>

            {/* Thông tin nhà tổ chức */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>Nhà tổ chức</h4>
                {organizer ? (
                    <div className={styles.infoItem}>
                        {/* Logo */}
                        {organizer.logo && (
                            <div style={{ marginBottom: '1rem' }}>
                                <img
                                    src={organizer.logo}
                                    alt={organizer.name}
                                    style={{
                                        width: '60px',
                                        borderRadius: '50%',
                                    }}
                                />
                            </div>
                        )}
                        <span className={styles.infoLabel}>Tên đơn vị:</span>
                        <span className={styles.infoValue}>
                            {organizer.name}
                        </span>
                        <br />
                        <span className={styles.infoLabel}>Giới thiệu:</span>
                        <span className={styles.infoValue}>
                            {organizer.info}
                        </span>
                    </div>
                ) : (
                    <p>Chưa có thông tin nhà tổ chức.</p>
                )}
            </div>

            {/* Mô tả sự kiện (có chứa HTML) */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>
                    Giới thiệu sự kiện
                </h4>
                <div
                    className={styles.richTextContent}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(description),
                    }}
                    style={{ lineHeight: '1.6' }}
                />
            </div>

            {/* Loại vé */}
            <div className={styles.orderDetailsSection}>
                <h4 className={styles.orderDetailsSectionTitle}>
                    Thông tin vé
                </h4>
                {ticketTypes && ticketTypes.length > 0 ? (
                    <div>
                        {ticketTypes.map((ticket) => (
                            <div key={ticket._id} className={styles.ticketItem}>
                                <div className={styles.ticketInfo}>
                                    <div className={styles.ticketTitle}>
                                        {ticket.name}
                                    </div>
                                    <div className={styles.ticketDetails}>
                                        Giá:{' '}
                                        {ticket.price?.toLocaleString() || 0}₫
                                        {' | '}Số lượng: {ticket.totalQuantity}
                                        {' | '}Giới Hạn Mỗi người:{' '}
                                        {ticket.maxPerUser}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Chưa có thông tin vé.</p>
                )}
            </div>
        </div>
    );
};

export default EventDetails;
