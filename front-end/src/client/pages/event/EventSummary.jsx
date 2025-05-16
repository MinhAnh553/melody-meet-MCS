import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';

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

const EventSummary = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);
    const { eventId } = useParams();
    const [eventData, setEventData] = useState(null);

    useEffect(() => {
        const fetchEventSummary = async () => {
            setLoadingLocal(true);
            try {
                const res = await api.getEventSummary(eventId);
                if (res.success) {
                    const sorted = res.revenueByDate.sort(
                        (a, b) => new Date(a.date) - new Date(b.date),
                    );

                    setEventData(res);
                } else {
                    swalCustomize.Toast('error', res.message);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu doanh thu:', error);
                swalCustomize.Toast('error', 'Lỗi kết nối máy chủ.');
            } finally {
                setLoadingLocal(false);
            }
        };

        fetchEventSummary();
    }, [eventId]);

    const {
        totalRevenue = 0,
        totalSold = 0,
        ticketDetails = [],
        revenueByDate = [],
    } = eventData || {};

    // ✅ Cấu hình biểu đồ doanh thu
    const revenueChartData = {
        labels: revenueByDate.map((item) => {
            const [month, day, year] = item.date.split('/');
            return `${day}/${month}`; // Định dạng DD/MM
        }),
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: revenueByDate.map((item) => item.revenue),
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

    const totalTickets = useMemo(() => {
        return ticketDetails.reduce(
            (sum, ticket) => sum + ticket.quantity + ticket.totalQuantity,
            0,
        );
    }, [ticketDetails]);

    // ✅ Cấu hình biểu đồ vé bán theo loại
    const ticketChartData = {
        labels: ['Đã bán', 'Còn lại'],
        datasets: [
            {
                label: 'Số lượng',
                data: [totalSold, totalTickets - totalSold],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                ],
                borderColor: ['rgba(46, 204, 113, 1)', 'rgba(52, 152, 219, 1)'],
                borderWidth: 1,
            },
        ],
    };

    if (!eventData || loadingLocal)
        return (
            <div className="mt-5">
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            </div>
        );

    return (
        <Container
            fluid
            style={{
                minHeight: '100vh',
                color: '#fff',
                paddingTop: '20px',
            }}
        >
            <Card
                className="mx-3 p-4 shadow-sm text-white"
                style={{
                    backgroundColor: '#31353e',
                    border: '1px solid #444',
                    borderRadius: '20px',
                }}
            >
                <h2 className="fw-bold">
                    Tổng doanh thu: {totalRevenue.toLocaleString()} VND
                </h2>
                <p className="fs-5">
                    Số vé đã bán: <span className="fw-bold">{totalSold}</span>{' '}
                    vé
                </p>
            </Card>

            <Row className="mx-3 mt-4">
                <Col md={4} className="mb-4" style={{ paddingLeft: '0px' }}>
                    <Card
                        className="p-4 shadow-sm text-white"
                        style={{
                            backgroundColor: '#31353e',
                            border: '1px solid #444',
                            borderRadius: '20px',
                        }}
                    >
                        <h3 className="fs-5 fw-bold mb-3">Tỷ lệ vé đã bán</h3>
                        {totalTickets > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Doughnut data={ticketChartData} />
                            </div>
                        ) : (
                            <p className="text-center">Không có dữ liệu vé.</p>
                        )}
                    </Card>
                </Col>

                <Col md={8} className="mb-4" style={{ paddingRight: '0px' }}>
                    <Card
                        className="p-4 shadow-sm text-white"
                        style={{
                            backgroundColor: '#31353e',
                            border: '1px solid #444',
                            borderRadius: '20px',
                        }}
                    >
                        <h3 className="fs-5 fw-bold mb-3">
                            Doanh thu theo ngày
                        </h3>
                        {revenueByDate.length > 0 ? (
                            <div style={{ height: '300px' }}>
                                <Line
                                    data={revenueChartData}
                                    options={chartOptions}
                                />
                            </div>
                        ) : (
                            <p className="text-center">
                                Chưa có dữ liệu doanh thu theo ngày.
                            </p>
                        )}
                    </Card>
                </Col>
            </Row>

            <Card
                className="mx-3 mb-4 p-4 shadow-sm text-white"
                style={{
                    backgroundColor: '#31353e',
                    border: '1px solid #444',
                    borderRadius: '20px',
                }}
            >
                <h3 className="text-lg font-medium mb-4">Chi tiết vé đã bán</h3>

                {ticketDetails.length > 0 ? (
                    <div
                        className="overflow-hidden rounded-lg"
                        style={{
                            backgroundColor: '#3A3A3A',
                            border: '1px solid #444',
                            borderRadius: '20px',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="row py-3 px-4 fw-bold"
                            style={{
                                backgroundColor: '#2A2A2A',
                                borderBottom: '1px solid #555',
                                color: '#FFF',
                            }}
                        >
                            <div className="col-3">Loại Vé</div>
                            <div className="col-3 text-end">Giá bán</div>
                            <div className="col-3 text-center">Đã bán</div>
                            <div className="col-3 text-end">Tỉ lệ bán</div>
                        </div>

                        {/* Body */}
                        {ticketDetails.map((ticket, index) => (
                            <div
                                key={index}
                                className="row py-3 px-4 align-items-center"
                                style={{
                                    backgroundColor: '#3A3A3A',
                                    borderBottom: '1px solid #555',
                                    color: '#FFF',
                                }}
                            >
                                <div className="col-3">{ticket.name}</div>
                                <div className="col-3 text-end">
                                    {ticket.price.toLocaleString()} VND
                                </div>
                                <div className="col-3 text-center">
                                    {ticket.quantity} /{' '}
                                    {ticket.totalQuantity + ticket.quantity}
                                </div>
                                <div className="col-3 text-end d-flex align-items-center gap-2">
                                    <ProgressBar
                                        now={
                                            (ticket.quantity /
                                                (ticket.totalQuantity +
                                                    ticket.quantity)) *
                                            100
                                        }
                                        variant="warning" // Màu vàng/cam
                                        className="w-75"
                                        style={{ height: '8px' }} // Tùy chỉnh độ cao thanh
                                    />
                                    <span className="fw-bold">
                                        {(
                                            (ticket.quantity /
                                                (ticket.totalQuantity +
                                                    ticket.quantity)) *
                                            100
                                        ).toFixed(2)}
                                        %
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Không có chi tiết vé.</p>
                )}
            </Card>
        </Container>
    );
};

export default EventSummary;
