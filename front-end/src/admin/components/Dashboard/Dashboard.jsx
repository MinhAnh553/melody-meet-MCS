import React, { useState, useEffect } from 'react';
import { Card, Button, ButtonGroup } from 'react-bootstrap';
import {
    FaMoneyBillWave,
    FaUsers,
    FaMusic,
    FaShoppingCart,
    FaCalendarCheck,
    FaCreditCard,
    FaExclamationTriangle,
    FaTicketAlt,
    FaChartLine,
    FaArrowUp,
    FaArrowDown,
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
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
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
);

import LoadingSpinner from '../../../client/components/loading/LoadingSpinner';
import TopOrganizersRanking from './TopOrganizersRanking';
import styles from './Dashboard.module.css';
import { formatCurrency } from '../../utils/formatters';
import api from '../../../util/api';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [topOrganizersData, setTopOrganizersData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    const periods = [
        { key: 'day', label: 'Hôm nay', icon: '📅' },
        { key: 'week', label: 'Tuần này', icon: '📊' },
        { key: 'month', label: 'Tháng này', icon: '📈' },
        { key: 'year', label: 'Năm nay', icon: '📊' },
    ];

    useEffect(() => {
        fetchData(selectedPeriod);
    }, [selectedPeriod]);

    const fetchData = async (period) => {
        setLoading(true);
        try {
            const [dashboardRes, topOrganizersRes] = await Promise.all([
                api.getDashboard(period),
                api.getTopOrganizers(period),
            ]);

            if (dashboardRes.success) {
                setDashboardData(dashboardRes.data);
            }

            if (topOrganizersRes.success) {
                setTopOrganizersData(topOrganizersRes.data);
            }
        } catch (err) {
            console.log(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !dashboardData) {
        return <LoadingSpinner />;
    }

    const {
        period,
        totalRevenue,
        totalUsers,
        totalEvents,
        totalOrders,
        periodRevenue,
        periodOrders,
        revenueGrowth,
        ordersGrowth,
        revenueByPeriod,
        dateRange,
        // New period-specific data
        periodUsers,
        usersGrowth,
        usersByPeriod,
        periodEvents,
        eventsGrowth,
        eventsByPeriod,
    } = dashboardData;

    // Format chart labels based on period
    const formatChartLabels = (data) => {
        return data.map((item) => {
            const date = item.date;
            switch (period) {
                case 'day':
                    // Format: "YYYY-MM-DD HH:00" -> "HH:00"
                    const hourMatch = date.match(/(\d{2}):00$/);
                    return hourMatch ? hourMatch[1] + ':00' : date;
                case 'week':
                case 'month':
                    // Format: "YYYY-MM-DD" -> "DD/MM"
                    const dateParts = date.split('-');
                    if (dateParts.length >= 3) {
                        return `${dateParts[2]}/${dateParts[1]}`;
                    }
                    return date;
                case 'year':
                    // Format: "YYYY-MM" -> "MM/YYYY"
                    const yearParts = date.split('-');
                    if (yearParts.length >= 2) {
                        return `${yearParts[1]}/${yearParts[0]}`;
                    }
                    return date;
                default:
                    return date;
            }
        });
    };

    // Revenue chart data
    const revenueChartData = {
        labels: formatChartLabels(revenueByPeriod),
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: revenueByPeriod.map((item) => item.revenue),
                fill: false,
                backgroundColor: 'rgba(142, 68, 173, 0.2)',
                borderColor: 'rgba(142, 68, 173, 1)',
                tension: 0.4,
            },
        ],
    };

    // Orders chart data
    const ordersChartData = {
        labels: formatChartLabels(revenueByPeriod),
        datasets: [
            {
                label: 'Số đơn hàng',
                data: revenueByPeriod.map((item) => item.orders),
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Users chart data
    const usersChartData = {
        labels: formatChartLabels(usersByPeriod || []),
        datasets: [
            {
                label: 'Số người dùng',
                data: (usersByPeriod || []).map((item) => item.users),
                backgroundColor: 'rgba(46, 204, 113, 0.6)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Events chart data
    const eventsChartData = {
        labels: formatChartLabels(eventsByPeriod || []),
        datasets: [
            {
                label: 'Số sự kiện',
                data: (eventsByPeriod || []).map((item) => item.events),
                backgroundColor: 'rgba(155, 89, 182, 0.6)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Chart options
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
                ticks: {
                    color: '#adb5bd',
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

    // Growth indicator component
    const GrowthIndicator = ({ value, label }) => (
        <div className={styles.growthIndicator}>
            <span
                className={`${styles.growthValue} ${
                    value < 0 ? styles.negative : ''
                }`}
            >
                {value > 0 ? '+' : ''}
                {Math.round(value * 100) / 100}%
            </span>
            <span className={styles.growthIcon}>
                {value >= 0 ? (
                    <FaArrowUp className={styles.growthUp} />
                ) : (
                    <FaArrowDown className={styles.growthDown} />
                )}
            </span>
            <span className={styles.growthLabel}>{label}</span>
        </div>
    );

    // Get period title
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

    return (
        <div className={styles.dashboardContainer}>
            {/* Period Selector */}
            <div className={styles.periodSelector}>
                <h2 className={styles.pageTitle}>
                    Dashboard - {getPeriodTitle()}
                </h2>
                <ButtonGroup className={styles.periodButtons}>
                    {periods.map((periodOption) => (
                        <Button
                            key={periodOption.key}
                            variant={
                                selectedPeriod === periodOption.key
                                    ? 'primary'
                                    : 'outline-primary'
                            }
                            onClick={() => setSelectedPeriod(periodOption.key)}
                            className={styles.periodButton}
                        >
                            <span className={styles.periodIcon}>
                                {periodOption.icon}
                            </span>
                            {periodOption.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </div>

            {/* Top Organizers Ranking */}
            <TopOrganizersRanking
                topOrganizers={topOrganizersData?.topOrganizers || []}
                period={selectedPeriod}
            />

            {/* Statistics Cards */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <FaMoneyBillWave
                            className={`${styles.statIcon} ${styles.revenueIcon}`}
                        />
                        <GrowthIndicator
                            value={revenueGrowth}
                            label="so với kỳ trước"
                        />
                    </div>
                    <div className={styles.statValue}>
                        {formatCurrency(periodRevenue)}
                    </div>
                    <div className={styles.statLabel}>
                        Doanh thu {getPeriodTitle().toLowerCase()}
                    </div>
                    {/* <div className={styles.statSubtext}>
                        Tổng: {formatCurrency(totalRevenue)}
                    </div> */}
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <FaShoppingCart
                            className={`${styles.statIcon} ${styles.orderIcon}`}
                        />
                        <GrowthIndicator
                            value={ordersGrowth}
                            label="so với kỳ trước"
                        />
                    </div>
                    <div className={styles.statValue}>{periodOrders}</div>
                    <div className={styles.statLabel}>
                        Đơn hàng {getPeriodTitle().toLowerCase()}
                    </div>
                    {/* <div className={styles.statSubtext}>
                        Tổng: {totalOrders}
                    </div> */}
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <FaUsers
                            className={`${styles.statIcon} ${styles.userIcon}`}
                        />
                        <GrowthIndicator
                            value={usersGrowth}
                            label="so với kỳ trước"
                        />
                    </div>
                    <div className={styles.statValue}>{periodUsers}</div>
                    <div className={styles.statLabel}>
                        Người dùng {getPeriodTitle().toLowerCase()}
                    </div>
                    {/* <div className={styles.statSubtext}>Tổng: {totalUsers}</div> */}
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <FaMusic
                            className={`${styles.statIcon} ${styles.eventIcon}`}
                        />
                        <GrowthIndicator
                            value={eventsGrowth}
                            label="so với kỳ trước"
                        />
                    </div>
                    <div className={styles.statValue}>{periodEvents}</div>
                    <div className={styles.statLabel}>
                        Sự kiện {getPeriodTitle().toLowerCase()}
                    </div>
                    {/* <div className={styles.statSubtext}>
                        Tổng: {totalEvents}
                    </div> */}
                </Card>
            </div>

            {/* Charts */}
            <div className={styles.chartsContainer}>
                <div className={styles.chartRow}>
                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>
                            <FaChartLine className={styles.chartIcon} />
                            Doanh thu {getPeriodTitle().toLowerCase()}
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Line
                                data={revenueChartData}
                                options={chartOptions}
                            />
                        </div>
                    </div>

                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>
                            <FaShoppingCart className={styles.chartIcon} />
                            Đơn hàng {getPeriodTitle().toLowerCase()}
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Bar
                                data={ordersChartData}
                                options={chartOptions}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.chartRow}>
                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>
                            <FaUsers className={styles.chartIcon} />
                            Người dùng {getPeriodTitle().toLowerCase()}
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Bar data={usersChartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className={styles.chartCard}>
                        <h3 className={styles.chartTitle}>
                            <FaMusic className={styles.chartIcon} />
                            Sự kiện {getPeriodTitle().toLowerCase()}
                        </h3>
                        <div style={{ height: '300px' }}>
                            <Bar
                                data={eventsChartData}
                                options={chartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryContainer}>
                <div className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>Tổng quan</h4>
                    <div className={styles.summaryStats}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>
                                Doanh thu trung bình/đơn:
                            </span>
                            <span className={styles.summaryValue}>
                                {periodOrders > 0
                                    ? formatCurrency(
                                          periodRevenue / periodOrders,
                                      )
                                    : '0 VNĐ'}
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>
                                Tỷ lệ tăng trưởng doanh thu:
                            </span>
                            <span
                                className={`${styles.summaryValue} ${
                                    revenueGrowth >= 0
                                        ? styles.positive
                                        : styles.negative
                                }`}
                            >
                                {revenueGrowth > 0 ? '+' : ''}
                                {Math.round(revenueGrowth * 100) / 100}%
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>
                                Tỷ lệ tăng trưởng đơn hàng:
                            </span>
                            <span
                                className={`${styles.summaryValue} ${
                                    ordersGrowth >= 0
                                        ? styles.positive
                                        : styles.negative
                                }`}
                            >
                                {ordersGrowth > 0 ? '+' : ''}
                                {Math.round(ordersGrowth * 100) / 100}%
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>
                                Tỷ lệ tăng trưởng người dùng:
                            </span>
                            <span
                                className={`${styles.summaryValue} ${
                                    usersGrowth >= 0
                                        ? styles.positive
                                        : styles.negative
                                }`}
                            >
                                {usersGrowth > 0 ? '+' : ''}
                                {Math.round(usersGrowth * 100) / 100}%
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>
                                Tỷ lệ tăng trưởng sự kiện:
                            </span>
                            <span
                                className={`${styles.summaryValue} ${
                                    eventsGrowth >= 0
                                        ? styles.positive
                                        : styles.negative
                                }`}
                            >
                                {eventsGrowth > 0 ? '+' : ''}
                                {Math.round(eventsGrowth * 100) / 100}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
