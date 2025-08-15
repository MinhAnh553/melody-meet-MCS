import React, { useEffect, useState } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    Form,
    InputGroup,
    Pagination,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
import {
    BsBarChartFill,
    BsGraphUp,
    BsPieChartFill,
    BsCalendarEvent,
    BsGeoAlt,
    BsTicketPerforated,
    BsCashCoin,
    BsPeople,
    BsSearch,
    BsFilter,
    BsX,
} from 'react-icons/bs';
import api from '../../../util/api';
import swalCustomize from '../../../util/swalCustomize';
import LoadingSpinner from '../../components/loading/LoadingSpinner';
import TimeText from '../../components/providers/TimeText';

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

const EventComparison = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [sortBy, setSortBy] = useState('revenue'); // revenue, sold, orders, date

    // New state for filtering, searching, and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Load data on component mount
    useEffect(() => {
        fetchComparisonData();
    }, []);

    // Reload data when period changes
    useEffect(() => {
        if (comparisonData.length > 0) {
            fetchComparisonData();
        }
    }, [selectedPeriod]);

    const fetchComparisonData = async () => {
        setLoading(true);
        try {
            const res = await api.getEventComparison(selectedPeriod);
            if (res.success) {
                console.log('Comparison data:', res.data);
                setComparisonData(res.data);
            } else {
                swalCustomize.Toast('error', res.message);
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu so sánh:', error);
            swalCustomize.Toast('error', 'Lỗi kết nối máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    const getPeriodTitle = (period) => {
        switch (period) {
            case 'month':
                return 'Tháng này';
            case 'quarter':
                return 'Quý này';
            case 'year':
                return 'Năm nay';
            default:
                return 'Tất cả thời gian';
        }
    };

    const getSortTitle = (sort) => {
        switch (sort) {
            case 'revenue':
                return 'Doanh thu';
            case 'sold':
                return 'Vé bán';
            case 'orders':
                return 'Đơn hàng';
            case 'date':
                return 'Ngày tạo';
            default:
                return 'Doanh thu';
        }
    };

    const sortData = (data, sortBy) => {
        const sortedData = [...data];
        switch (sortBy) {
            case 'revenue':
                return sortedData.sort(
                    (a, b) => b.totalRevenue - a.totalRevenue,
                );
            case 'sold':
                return sortedData.sort((a, b) => b.totalSold - a.totalSold);
            case 'orders':
                return sortedData.sort((a, b) => b.totalOrders - a.totalOrders);
            case 'date':
                return sortedData.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
                );
            default:
                return sortedData;
        }
    };

    // Filter and search data
    const filteredData = comparisonData.filter((event) => {
        const matchesSearch =
            event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.venueName
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'all' || event.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const sortedData = sortData(filteredData, sortBy);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sortBy, selectedPeriod]);

    // Cấu hình biểu đồ doanh thu
    const revenueChartData = {
        labels: sortedData.map(
            (event) =>
                event.eventName.substring(0, 20) +
                (event.eventName.length > 20 ? '...' : ''),
        ),
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: sortedData.map((event) => event.totalRevenue),
                backgroundColor: 'rgba(142, 68, 173, 0.7)',
                borderColor: 'rgba(142, 68, 173, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Cấu hình biểu đồ vé bán
    const soldChartData = {
        labels: sortedData.map(
            (event) =>
                event.eventName.substring(0, 20) +
                (event.eventName.length > 20 ? '...' : ''),
        ),
        datasets: [
            {
                label: 'Vé đã bán',
                data: sortedData.map((event) => event.totalSold),
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Cấu hình biểu đồ tỷ lệ bán
    const soldPercentageData = {
        labels: sortedData.map(
            (event) =>
                event.eventName.substring(0, 15) +
                (event.eventName.length > 15 ? '...' : ''),
        ),
        datasets: [
            {
                label: 'Tỷ lệ bán (%)',
                data: sortedData.map((event) => event.soldPercentage),
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <Badge bg="success">Đã duyệt</Badge>;
            case 'event_over':
                return <Badge bg="secondary">Đã kết thúc</Badge>;
            default:
                return <Badge bg="warning">{status}</Badge>;
        }
    };

    // Remove full page loading spinner

    return (
        <Container
            fluid
            style={{
                minHeight: '100vh',
                color: '#fff',
                padding: '20px',
                background: '#27272a',
            }}
        >
            {/* Header */}
            <Card
                className="mx-3 mb-4 p-4 shadow-sm text-white"
                style={{
                    backgroundColor: '#31353e',
                    border: '1px solid #444',
                    borderRadius: '20px',
                }}
            >
                <Row className="align-items-center">
                    <Col md={6}>
                        <div className="d-flex align-items-center mb-2">
                            <Button
                                variant="outline-light"
                                size="sm"
                                className="me-3"
                                onClick={() => navigate('/organizer/event')}
                            >
                                ← Quay lại
                            </Button>
                            <h2 className="fw-bold mb-0">
                                <BsBarChartFill className="me-2" />
                                Phân tích sự kiện
                            </h2>
                        </div>
                        <p className="mb-0 ">
                            Phân tích doanh thu và hiệu suất bán vé của các sự
                            kiện
                        </p>
                    </Col>
                    <Col md={6}>
                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="text-white">
                                        Thời gian:
                                    </Form.Label>
                                    <Form.Select
                                        value={selectedPeriod}
                                        onChange={(e) =>
                                            setSelectedPeriod(e.target.value)
                                        }
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color: '#fff',
                                        }}
                                    >
                                        <option value="all">
                                            Tất cả thời gian
                                        </option>
                                        <option value="month">Tháng này</option>
                                        <option value="quarter">Quý này</option>
                                        <option value="year">Năm nay</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="text-white">
                                        <BsFilter className="me-2" />
                                        Trạng thái:
                                    </Form.Label>
                                    <Form.Select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value)
                                        }
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color: '#fff',
                                        }}
                                    >
                                        <option value="all">
                                            Tất cả trạng thái
                                        </option>
                                        <option value="approved">
                                            Đã duyệt
                                        </option>
                                        <option value="event_over">
                                            Đã kết thúc
                                        </option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="text-white">
                                        Sắp xếp theo:
                                    </Form.Label>
                                    <Form.Select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(e.target.value)
                                        }
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color: '#fff',
                                        }}
                                    >
                                        <option value="revenue">
                                            Doanh thu
                                        </option>
                                        <option value="sold">Vé bán</option>
                                        <option value="orders">Đơn hàng</option>
                                        <option value="date">Ngày tạo</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>

            {comparisonData.length === 0 ? (
                <Card
                    className="mx-3 p-4 shadow-sm text-white text-center"
                    style={{
                        backgroundColor: '#31353e',
                        border: '1px solid #444',
                        borderRadius: '20px',
                    }}
                >
                    <BsBarChartFill size={50} className="mb-3 " />
                    <h4>Chưa có dữ liệu sự kiện</h4>
                    <p className="">
                        Bạn chưa có sự kiện nào để so sánh trong khoảng thời
                        gian {getPeriodTitle(selectedPeriod)}
                    </p>
                </Card>
            ) : (
                <>
                    {/* Tổng quan */}
                    <Row className="mx-3 mb-4">
                        <Col md={3} className="mb-3">
                            <Card
                                className="p-3 shadow-sm text-white text-center"
                                style={{
                                    backgroundColor: '#31353e',
                                    border: '1px solid #444',
                                    borderRadius: '15px',
                                }}
                            >
                                {loading ? (
                                    <div
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ height: '80px' }}
                                    >
                                        <div
                                            className="spinner-border spinner-border-sm text-success"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <BsCashCoin
                                            size={30}
                                            className="mb-2 text-success"
                                        />
                                        <h4 className="mb-1">
                                            {formatCurrency(
                                                comparisonData.reduce(
                                                    (sum, event) =>
                                                        sum +
                                                        event.totalRevenue,
                                                    0,
                                                ),
                                            )}
                                        </h4>
                                        <p className="mb-0 ">Tổng doanh thu</p>
                                    </>
                                )}
                            </Card>
                        </Col>
                        <Col md={3} className="mb-3">
                            <Card
                                className="p-3 shadow-sm text-white text-center"
                                style={{
                                    backgroundColor: '#31353e',
                                    border: '1px solid #444',
                                    borderRadius: '15px',
                                }}
                            >
                                {loading ? (
                                    <div
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ height: '80px' }}
                                    >
                                        <div
                                            className="spinner-border spinner-border-sm text-info"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <BsTicketPerforated
                                            size={30}
                                            className="mb-2 text-info"
                                        />
                                        <h4 className="mb-1">
                                            {comparisonData.reduce(
                                                (sum, event) =>
                                                    sum + event.totalSold,
                                                0,
                                            )}
                                        </h4>
                                        <p className="mb-0 ">Tổng vé bán</p>
                                    </>
                                )}
                            </Card>
                        </Col>
                        <Col md={3} className="mb-3">
                            <Card
                                className="p-3 shadow-sm text-white text-center"
                                style={{
                                    backgroundColor: '#31353e',
                                    border: '1px solid #444',
                                    borderRadius: '15px',
                                }}
                            >
                                {loading ? (
                                    <div
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ height: '80px' }}
                                    >
                                        <div
                                            className="spinner-border spinner-border-sm text-warning"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <BsPeople
                                            size={30}
                                            className="mb-2 text-warning"
                                        />
                                        <h4 className="mb-1">
                                            {comparisonData.reduce(
                                                (sum, event) =>
                                                    sum + event.totalOrders,
                                                0,
                                            )}
                                        </h4>
                                        <p className="mb-0 ">Tổng đơn hàng</p>
                                    </>
                                )}
                            </Card>
                        </Col>
                        <Col md={3} className="mb-3">
                            <Card
                                className="p-3 shadow-sm text-white text-center"
                                style={{
                                    backgroundColor: '#31353e',
                                    border: '1px solid #444',
                                    borderRadius: '15px',
                                }}
                            >
                                {loading ? (
                                    <div
                                        className="d-flex justify-content-center align-items-center"
                                        style={{ height: '80px' }}
                                    >
                                        <div
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading...
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <BsCalendarEvent
                                            size={30}
                                            className="mb-2 text-primary"
                                        />
                                        <h4 className="mb-1">
                                            {comparisonData.length}
                                        </h4>
                                        <p className="mb-0 ">Sự kiện</p>
                                    </>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Biểu đồ */}
                    <Row className="mx-3 mb-4">
                        <Col md={6} className="mb-4">
                            <Card
                                className="p-4 shadow-sm text-white"
                                style={{
                                    backgroundColor: '#31353e',
                                    border: '1px solid #444',
                                    borderRadius: '20px',
                                }}
                            >
                                <h4 className="mb-3">
                                    <BsGraphUp className="me-2" />
                                    Doanh thu theo sự kiện
                                </h4>
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <div
                                                className="spinner-border text-light"
                                                role="status"
                                            >
                                                <span className="visually-hidden">
                                                    Loading...
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Bar
                                            data={revenueChartData}
                                            options={chartOptions}
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                        <Col md={6} className="mb-4">
                            <Card
                                className="p-4 shadow-sm text-white"
                                style={{
                                    backgroundColor: '#31353e',
                                    border: '1px solid #444',
                                    borderRadius: '20px',
                                }}
                            >
                                <h4 className="mb-3">
                                    <BsPieChartFill className="me-2" />
                                    Vé bán theo sự kiện
                                </h4>
                                <div style={{ height: '300px' }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <div
                                                className="spinner-border text-light"
                                                role="status"
                                            >
                                                <span className="visually-hidden">
                                                    Loading...
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Bar
                                            data={soldChartData}
                                            options={chartOptions}
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Bảng so sánh chi tiết */}
                    <Card
                        className="mx-3 mb-4 p-4 shadow-sm text-white"
                        style={{
                            backgroundColor: '#31353e',
                            border: '1px solid #444',
                            borderRadius: '20px',
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="mb-0">
                                <BsBarChartFill className="me-2" />
                                Bảng so sánh chi tiết
                            </h4>
                            <div className="d-flex align-items-center">
                                <span className=" me-3">
                                    Hiển thị {startIndex + 1}-
                                    {Math.min(endIndex, sortedData.length)}{' '}
                                    trong tổng số {sortedData.length} sự kiện
                                </span>
                            </div>
                        </div>

                        {/* Filter and Search Controls */}
                        <Row className="mb-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="text-white">
                                        <BsSearch className="me-2" />
                                        Tìm kiếm:
                                    </Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            value={searchTerm}
                                            placeholder="Tìm theo tên sự kiện hoặc địa điểm..."
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            style={{
                                                backgroundColor: '#2a2a2a',
                                                border: '1px solid #555',
                                                color: '#fff !important',
                                            }}
                                        />
                                        <style>
                                            {`
                                                .form-control {
                                                    color: #fff !important;
                                                }
                                                .form-control::placeholder {
                                                    color: #fff !important;
                                                    opacity: 0.7;
                                                }
                                                .form-control::-webkit-input-placeholder {
                                                    color: #fff !important;
                                                    opacity: 0.7;
                                                }
                                                .form-control::-moz-placeholder {
                                                    color: #fff !important;
                                                    opacity: 0.7;
                                                }
                                                .form-control:-ms-input-placeholder {
                                                    color: #fff !important;
                                                    opacity: 0.7;
                                                }
                                            `}
                                        </style>
                                        {searchTerm && (
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() =>
                                                    setSearchTerm('')
                                                }
                                                style={{
                                                    backgroundColor: '#2a2a2a',
                                                    border: '1px solid #555',
                                                    color: '#fff',
                                                }}
                                            >
                                                <BsX />
                                            </Button>
                                        )}
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="text-white">
                                        Hiển thị:
                                    </Form.Label>
                                    <Form.Select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(
                                                Number(e.target.value),
                                            );
                                            setCurrentPage(1);
                                        }}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color: '#fff',
                                        }}
                                    >
                                        <option value={5}>5 sự kiện</option>
                                        <option value={10}>10 sự kiện</option>
                                        <option value={20}>20 sự kiện</option>
                                        <option value={50}>50 sự kiện</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* <Col md={3} className="d-flex align-items-end">
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #555',
                                        color: '#fff',
                                    }}
                                >
                                    <BsX className="me-1" />
                                    Xóa bộ lọc
                                </Button>
                            </Col> */}
                        </Row>

                        <div className="table-responsive">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div
                                        className="spinner-border text-light mb-3"
                                        role="status"
                                    >
                                        <span className="visually-hidden">
                                            Loading...
                                        </span>
                                    </div>
                                    <h5 className="">Đang tải dữ liệu...</h5>
                                </div>
                            ) : paginatedData.length === 0 ? (
                                <div className="text-center py-5">
                                    <BsSearch size={50} className="mb-3 " />
                                    <h5 className="">
                                        Không tìm thấy sự kiện nào
                                    </h5>
                                    <p className="">
                                        Thử thay đổi từ khóa tìm kiếm hoặc bộ
                                        lọc
                                    </p>
                                    <Button
                                        variant="outline-light"
                                        size="sm"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStatusFilter('all');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <BsX className="me-1" />
                                        Xóa bộ lọc
                                    </Button>
                                </div>
                            ) : (
                                <table className="table table-dark table-hover">
                                    <thead>
                                        <tr>
                                            <th>Sự kiện</th>
                                            <th>Ngày diễn ra</th>
                                            <th>Trạng thái</th>
                                            <th>Doanh thu</th>
                                            <th>Vé bán</th>
                                            <th>Đơn hàng</th>
                                            <th>Tỷ lệ bán</th>
                                            {/* <th>Giá vé TB</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((event, index) => (
                                            <tr key={event.eventId}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={
                                                                event.background
                                                            }
                                                            alt={
                                                                event.eventName
                                                            }
                                                            style={{
                                                                width: '50px',
                                                                height: '30px',
                                                                objectFit:
                                                                    'cover',
                                                                borderRadius:
                                                                    '5px',
                                                                marginRight:
                                                                    '10px',
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold">
                                                                {
                                                                    event.eventName
                                                                }
                                                            </div>
                                                            <small className="">
                                                                <BsGeoAlt className="me-1" />
                                                                {
                                                                    event
                                                                        .location
                                                                        .venueName
                                                                }
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {event.startTime &&
                                                    event.endTime ? (
                                                        <TimeText
                                                            event={event}
                                                        />
                                                    ) : (
                                                        <span className="text-muted">
                                                            Chưa có thông tin
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {getStatusBadge(
                                                        event.status,
                                                    )}
                                                </td>
                                                <td className="fw-bold text-success">
                                                    {formatCurrency(
                                                        event.totalRevenue,
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="fw-bold">
                                                        {event.totalSold}
                                                    </span>
                                                    <small className="">
                                                        /{event.totalTickets}
                                                    </small>
                                                </td>
                                                <td>{event.totalOrders}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="progress me-2"
                                                            style={{
                                                                width: '60px',
                                                                height: '8px',
                                                            }}
                                                        >
                                                            <div
                                                                className="progress-bar bg-warning"
                                                                style={{
                                                                    width: `${event.soldPercentage}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="fw-bold">
                                                            {event.soldPercentage.toFixed(
                                                                1,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                </td>
                                                {/* <td>
                                                    {formatCurrency(
                                                        Math.round(
                                                            event.averageTicketPrice,
                                                        ),
                                                    )}
                                                </td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div
                                className="d-flex justify-content-between align-items-center mt-4"
                                style={{
                                    borderTop: '1px solid #444',
                                    paddingTop: '20px',
                                }}
                            >
                                <div className="">
                                    Trang {currentPage} trong tổng số{' '}
                                    {totalPages} trang
                                </div>
                                <Pagination
                                    className="mb-0"
                                    style={{ gap: '5px' }}
                                >
                                    <Pagination.First
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color:
                                                currentPage === 1
                                                    ? '#666'
                                                    : '#fff',
                                            cursor:
                                                currentPage === 1
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    />
                                    <Pagination.Prev
                                        onClick={() =>
                                            setCurrentPage(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color:
                                                currentPage === 1
                                                    ? '#666'
                                                    : '#fff',
                                            cursor:
                                                currentPage === 1
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    />

                                    {Array.from(
                                        { length: Math.min(5, totalPages) },
                                        (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (
                                                currentPage >=
                                                totalPages - 2
                                            ) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Pagination.Item
                                                    key={pageNum}
                                                    active={
                                                        pageNum === currentPage
                                                    }
                                                    onClick={() =>
                                                        setCurrentPage(pageNum)
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            pageNum ===
                                                            currentPage
                                                                ? '#007bff'
                                                                : '#2a2a2a',
                                                        border: '1px solid #555',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        transition:
                                                            'all 0.2s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (
                                                            pageNum !==
                                                            currentPage
                                                        ) {
                                                            e.target.style.backgroundColor =
                                                                '#3a3a3a';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (
                                                            pageNum !==
                                                            currentPage
                                                        ) {
                                                            e.target.style.backgroundColor =
                                                                '#2a2a2a';
                                                        }
                                                    }}
                                                >
                                                    {pageNum}
                                                </Pagination.Item>
                                            );
                                        },
                                    )}

                                    <Pagination.Next
                                        onClick={() =>
                                            setCurrentPage(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color:
                                                currentPage === totalPages
                                                    ? '#666'
                                                    : '#fff',
                                            cursor:
                                                currentPage === totalPages
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    />
                                    <Pagination.Last
                                        onClick={() =>
                                            setCurrentPage(totalPages)
                                        }
                                        disabled={currentPage === totalPages}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            color:
                                                currentPage === totalPages
                                                    ? '#666'
                                                    : '#fff',
                                            cursor:
                                                currentPage === totalPages
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                        }}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </Container>
    );
};

export default EventComparison;
