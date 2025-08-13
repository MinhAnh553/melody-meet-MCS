import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaTrophy, FaMedal, FaCrown } from 'react-icons/fa';
import styles from './Dashboard.module.css';
import { formatCurrency } from '../../utils/formatters';

const TopOrganizersRanking = ({ topOrganizers, period }) => {
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <FaCrown className={styles.goldIcon} />;
            case 2:
                return <FaMedal className={styles.silverIcon} />;
            case 3:
                return <FaMedal className={styles.bronzeIcon} />;
            default:
                return <FaTrophy className={styles.trophyIcon} />;
        }
    };

    const getRankClass = (rank) => {
        switch (rank) {
            case 1:
                return styles.firstRank;
            case 2:
                return styles.secondRank;
            case 3:
                return styles.thirdRank;
            default:
                return styles.otherRank;
        }
    };

    const getPeriodTitle = () => {
        switch (period) {
            case 'day':
                return 'Hôm nay';
            case 'week':
                return 'Tuần này';
            case 'month':
                return 'Tháng này';
            case 'year':
                return 'Năm nay';
            default:
                return 'Tháng này';
        }
    };

    if (!topOrganizers || topOrganizers.length === 0) {
        return (
            <Card className={styles.rankingCard}>
                <Card.Header className={styles.rankingHeader}>
                    <h4 className={styles.rankingTitle}>
                        <FaTrophy className={styles.rankingIcon} />
                        BXH Top 10 Ban Tổ Chức - {getPeriodTitle()}
                    </h4>
                </Card.Header>
                <Card.Body className={styles.rankingBody}>
                    <div className={styles.noDataMessage}>
                        Chưa có dữ liệu doanh thu trong khoảng thời gian này
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className={styles.rankingCard}>
            <Card.Header className={styles.rankingHeader}>
                <h4 className={styles.rankingTitle}>
                    <FaTrophy className={styles.rankingIcon} />
                    BXH Top 10 Ban Tổ Chức - {getPeriodTitle()}
                </h4>
            </Card.Header>
            <Card.Body className={styles.rankingBody}>
                <div className={styles.rankingList}>
                    {topOrganizers.map((organizer, index) => (
                        <div
                            key={organizer._id}
                            className={`${styles.rankingItem} ${getRankClass(
                                index + 1,
                            )}`}
                        >
                            <div className={styles.rankInfo}>
                                <div className={styles.rankNumber}>
                                    {getRankIcon(index + 1)}
                                    <span className={styles.rankText}>
                                        #{index + 1}
                                    </span>
                                </div>
                                <div className={styles.organizerInfo}>
                                    <div className={styles.organizerAvatar}>
                                        {organizer.organizerLogo ? (
                                            <img
                                                src={organizer.organizerLogo}
                                                alt={organizer.organizerName}
                                                className={styles.avatarImage}
                                            />
                                        ) : (
                                            <div
                                                className={
                                                    styles.avatarPlaceholder
                                                }
                                            >
                                                {organizer.organizerName
                                                    ? organizer.organizerName
                                                          .charAt(0)
                                                          .toUpperCase()
                                                    : 'O'}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.organizerDetails}>
                                        <h6 className={styles.organizerName}>
                                            {organizer.organizerName ||
                                                'Chưa có tên'}
                                        </h6>
                                        <small
                                            className={styles.organizerEmail}
                                        >
                                            {organizer.organizerEmail}
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.organizerStats}>
                                <div className={styles.revenueInfo}>
                                    <div className={styles.revenueAmount}>
                                        {formatCurrency(organizer.totalRevenue)}
                                    </div>
                                    <Badge
                                        bg="success"
                                        className={styles.revenueBadge}
                                    >
                                        Doanh thu
                                    </Badge>
                                </div>
                                <div className={styles.statsDetails}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>
                                            Đơn hàng:
                                        </span>
                                        <span className={styles.statValue}>
                                            {organizer.totalOrders}
                                        </span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>
                                            Sự kiện:
                                        </span>
                                        <span className={styles.statValue}>
                                            {organizer.eventCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
};

export default TopOrganizersRanking;
