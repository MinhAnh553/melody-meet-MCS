import React from 'react';
import { Badge } from 'react-bootstrap';
import DOMPurify from 'dompurify';
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaBuilding,
    FaInfoCircle,
    FaTicketAlt,
    FaClock,
    FaUser,
    FaMoneyBillWave,
    FaUsers,
    FaExclamationCircle,
} from 'react-icons/fa';

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
        rejectReason,
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
                        <FaClock />
                        <TimeText event={event} />
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
                    <div className={styles.sectionHeader}>
                        <FaCalendarAlt className={styles.sectionIcon} />
                        <h4 className={styles.orderDetailsSectionTitle}>
                            Hình ảnh sự kiện
                        </h4>
                    </div>
                    <img
                        src={background}
                        alt={name}
                        className={styles.eventImage}
                    />
                </div>
            )}

            {/* Thông tin địa điểm */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaMapMarkerAlt className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Địa điểm
                    </h4>
                </div>
                {location ? (
                    <div className={styles.infoItem}>
                        <div className={styles.infoRow}>
                            <FaBuilding className={styles.infoIcon} />
                            <span className={styles.infoValue}>
                                {location.venueName}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <FaMapMarkerAlt className={styles.infoIcon} />
                            <span className={styles.infoValue}>
                                {`${location.address}, ${location.ward}, ${location.district}, ${location.province}`}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p>Chưa có thông tin địa điểm</p>
                )}
            </div>

            {/* Thông tin nhà tổ chức */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaUser className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Nhà tổ chức
                    </h4>
                </div>
                {organizer ? (
                    <div className={styles.infoItem}>
                        {organizer.logo && (
                            <div className={styles.organizerLogo}>
                                <img
                                    src={organizer.logo}
                                    alt={organizer.name}
                                />
                            </div>
                        )}
                        <div className={styles.infoRow}>
                            <FaBuilding className={styles.infoIcon} />
                            <span className={styles.infoValue}>
                                {organizer.name}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <FaInfoCircle className={styles.infoIcon} />
                            <span className={styles.infoValue}>
                                {organizer.info}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p>Chưa có thông tin nhà tổ chức</p>
                )}
            </div>

            {/* Mô tả sự kiện */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaInfoCircle className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Giới thiệu sự kiện
                    </h4>
                </div>
                <div
                    className={styles.richTextContent}
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(description),
                    }}
                />
            </div>

            {/* Loại vé */}
            <div className={styles.orderDetailsSection}>
                <div className={styles.sectionHeader}>
                    <FaTicketAlt className={styles.sectionIcon} />
                    <h4 className={styles.orderDetailsSectionTitle}>
                        Thông tin vé
                    </h4>
                </div>
                {ticketTypes && ticketTypes.length > 0 ? (
                    <div className={styles.ticketList}>
                        {ticketTypes.map((ticket) => (
                            <div key={ticket._id} className={styles.ticketItem}>
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
                                                {ticket.price?.toLocaleString() ||
                                                    0}
                                                ₫
                                            </span>
                                        </div>
                                        <div className={styles.ticketDetail}>
                                            <FaTicketAlt
                                                className={styles.ticketIcon}
                                            />
                                            <span>
                                                Số lượng: {ticket.totalQuantity}
                                            </span>
                                        </div>
                                        <div className={styles.ticketDetail}>
                                            <FaUsers
                                                className={styles.ticketIcon}
                                            />
                                            <span>
                                                Giới hạn: {ticket.maxPerUser}{' '}
                                                vé/người
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Chưa có thông tin vé</p>
                )}
            </div>

            {/* Hiển thị lý do từ chối nếu sự kiện bị từ chối */}
            {status === 'rejected' && rejectReason && (
                <div className={styles.rejectReasonSection}>
                    <div className={styles.sectionHeader}>
                        <FaExclamationCircle className={styles.sectionIcon} />
                        <h3 className={styles.orderDetailsSectionTitle}>
                            Lý do từ chối
                        </h3>
                    </div>
                    <div className={styles.rejectReasonContent}>
                        <p className={styles.infoValue}>{rejectReason}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetails;
