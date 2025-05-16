import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
    FaMoneyBillWave,
    FaUsers,
    FaMusic,
    FaShoppingCart,
    FaCalendarCheck,
    FaCreditCard,
    FaExclamationTriangle,
    FaTicketAlt,
} from 'react-icons/fa';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

// Đăng ký các thành phần của ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
);

import styles from './Dashboard.module.css';
import { formatCurrency, formatDate } from '../../utils/formatters';
import api from '../../../util/api';

const Dashboard = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);
    // ✅ State để lưu dữ liệu từ API
    const [dashboardData, setDashboardData] = useState(null);

    // ✅ Gọi API để lấy dữ liệu
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.getDashboard();
            if (res.success) {
                setDashboardData(res.data);
            }
        } catch (err) {
            console.log(err.message);
        } finally {
            setLoadingLocal(false);
        }
    };

    if (!dashboardData) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2">Đang tải...</p>
            </div>
        );
    }

    // ✅ Trích xuất dữ liệu từ API
    const {
        totalRevenue,
        totalUsers,
        totalEvents,
        totalOrders,
        revenueByDay,
        // ticketsSoldByCategory,
        // recentActivities,
        // upcomingEvents,
    } = dashboardData;

    // ✅ Cấu hình biểu đồ doanh thu
    const revenueChartData = {
        labels: revenueByDay.map((item) => {
            const [year, month, day] = item.date.split('-');
            return `${day}/${month}`; // Định dạng DD/MM
        }),
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: revenueByDay.map((item) => item.revenue), // Convert to millions
                fill: false,
                backgroundColor: 'rgba(142, 68, 173, 0.2)',
                borderColor: 'rgba(142, 68, 173, 1)',
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#f8f9fa',
                },
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
            },
            x: {
                ticks: {
                    color: '#adb5bd',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
            },
        },
    };

    // ✅ Cấu hình biểu đồ vé bán theo loại
    // const ticketChartData = {
    //     labels: ticketsSoldByCategory.map((item) => item.category),
    //     datasets: [
    //         {
    //             label: 'Vé đã bán',
    //             data: ticketsSoldByCategory.map((item) => item.count),
    //             backgroundColor: [
    //                 'rgba(142, 68, 173, 0.7)',
    //                 'rgba(52, 152, 219, 0.7)',
    //                 'rgba(46, 204, 113, 0.7)',
    //                 'rgba(241, 196, 15, 0.7)',
    //                 'rgba(231, 76, 60, 0.7)',
    //             ],
    //             borderColor: [
    //                 'rgba(142, 68, 173, 1)',
    //                 'rgba(52, 152, 219, 1)',
    //                 'rgba(46, 204, 113, 1)',
    //                 'rgba(241, 196, 15, 1)',
    //                 'rgba(231, 76, 60, 1)',
    //             ],
    //             borderWidth: 1,
    //         },
    //     ],
    // };

    // ✅ Hàm lấy icon dựa theo hoạt động
    const getActivityIcon = (type) => {
        switch (type) {
            case 'new_order':
                return (
                    <FaShoppingCart
                        className={`${styles.activityIcon} ${styles.activityIconInfo}`}
                    />
                );
            case 'event_approved':
                return (
                    <FaCalendarCheck
                        className={`${styles.activityIcon} ${styles.activityIconSuccess}`}
                    />
                );
            case 'payment_received':
                return (
                    <FaCreditCard
                        className={`${styles.activityIcon} ${styles.activityIconSuccess}`}
                    />
                );
            case 'new_event':
                return (
                    <FaMusic
                        className={`${styles.activityIcon} ${styles.activityIconInfo}`}
                    />
                );
            case 'order_cancelled':
                return (
                    <FaExclamationTriangle
                        className={`${styles.activityIcon} ${styles.activityIconDanger}`}
                    />
                );
            default:
                return (
                    <FaTicketAlt
                        className={`${styles.activityIcon} ${styles.activityIconWarning}`}
                    />
                );
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* Cards thống kê */}

            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <FaMoneyBillWave
                        className={`${styles.statIcon} ${styles.revenueIcon}`}
                    />
                    <div className={styles.statValue}>
                        {formatCurrency(totalRevenue)}
                    </div>
                    <div className={styles.statLabel}>Tổng doanh thu</div>
                </Card>

                <Card className={styles.statCard}>
                    <FaUsers
                        className={`${styles.statIcon} ${styles.userIcon}`}
                    />
                    <div className={styles.statValue}>{totalUsers}</div>
                    <div className={styles.statLabel}>Tổng số người dùng</div>
                </Card>

                <Card className={styles.statCard}>
                    <FaMusic
                        className={`${styles.statIcon} ${styles.eventIcon}`}
                    />
                    <div className={styles.statValue}>{totalEvents}</div>
                    <div className={styles.statLabel}>Tổng số sự kiện</div>
                </Card>

                <Card className={styles.statCard}>
                    <FaShoppingCart
                        className={`${styles.statIcon} ${styles.orderIcon}`}
                    />
                    <div className={styles.statValue}>{totalOrders}</div>
                    <div className={styles.statLabel}>Tổng số đơn hàng</div>
                </Card>
            </div>

            {/* Biểu đồ */}
            <div className={styles.chartsContainer}>
                <div className={styles.chartCard}>
                    <h3 className={styles.chartTitle}>
                        Doanh thu 30 ngày gần nhất
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Line data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                {/* <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>Vé bán theo thể loại</h3>
                        <div style={{ height: '300px' }}>
                            <Doughnut data={ticketChartData} />
                        </div>
                    </div> */}
            </div>
            {/* Hoạt động gần đây */}
            {/* <Row>
                <Col md={6}>
                    <div className={styles.recentActivitiesCard}>
                        <h3 className={styles.chartTitle}>Hoạt động gần đây</h3>
                        {recentActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className={styles.activityItem}
                            >
                                {getActivityIcon(activity.type)}
                                <div className={styles.activityContent}>
                                    <div className={styles.activityTitle}>
                                        {activity.message}
                                    </div>
                                    <div className={styles.activityTime}>
                                        {activity.user} • {activity.timestamp}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Col>
            </Row> */}
        </div>
    );
};

export default Dashboard;
