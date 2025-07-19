import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    // Button,
    // Modal,
    // Form,
    InputGroup,
} from 'react-bootstrap';
import {
    FaSearch,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaFilter,
    FaMoneyBillWave,
} from 'react-icons/fa';
import { Button, Modal, Input, Form, Slider } from 'antd';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../util/api';
import styles from './Search.module.css';
// import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import {
    addDays,
    startOfToday,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from 'date-fns';
import EventList from '../components/EventList';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { DatePicker as AntdDatePicker } from 'antd';
import dayjs from 'dayjs';
import LoadingSpinner from '../components/loading/LoadingSpinner';

const MIN_PRICE = 0;
const MAX_PRICE = 5000000;

const quickRanges = [
    { label: 'Tất cả các ngày', value: null },
    { label: 'Hôm nay', value: startOfToday() },
    { label: 'Ngày mai', value: addDays(startOfToday(), 1) },
    {
        label: 'Cuối tuần này',
        value: endOfWeek(startOfToday(), { weekStartsOn: 1 }),
    },
    {
        label: 'Tháng này',
        value: {
            start: startOfMonth(startOfToday()),
            end: endOfMonth(startOfToday()),
        },
    },
];

const Search = () => {
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('query') || '';
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]); // [dayjs|null, dayjs|null]
    const [location, setLocation] = useState('');
    const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef();

    const handleSearch = async () => {
        setLoading(true);
        try {
            const filters = {
                searchTerm,
                location,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
            };
            if (
                Array.isArray(selectedDate) &&
                selectedDate[0] &&
                selectedDate[1]
            ) {
                filters.startDate = selectedDate[0].format('YYYY-MM-DD');
                filters.endDate = selectedDate[1].format('YYYY-MM-DD');
            } else if (selectedDate && selectedDate.format) {
                filters.date = selectedDate.format('YYYY-MM-DD');
            }
            const response = await api.searchEvents(filters);
            if (response && response.success) {
                setEvents(response.events);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Error searching events:', error);
            setEvents([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        setSearchTerm(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line
    }, [searchTerm]);

    // Hiển thị text cho nút ngày
    let dateButtonText = 'Tất cả các ngày';
    if (selectedDate) {
        if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
            dateButtonText = `${selectedDate[0]
                .toDate()
                .toLocaleDateString('vi-VN')} - ${selectedDate[1]
                .toDate()
                .toLocaleDateString('vi-VN')}`;
        } else if (selectedDate && selectedDate.toDate) {
            dateButtonText = selectedDate.toDate().toLocaleDateString('vi-VN');
        }
    }

    // Xử lý chọn nhanh
    const handleQuickRange = (range) => {
        if (!range) {
            setSelectedDate(null);
            setDateRange([null, null]);
        } else if (range instanceof Date) {
            setSelectedDate(dayjs(range));
            setDateRange([dayjs(range), dayjs(range)]);
        } else if (range.start && range.end) {
            setSelectedDate([dayjs(range.start), dayjs(range.end)]);
            setDateRange([dayjs(range.start), dayjs(range.end)]);
        }
    };

    // Xử lý khi chọn ngày trên lịch
    const handleDateChange = (dates) => {
        const [start, end] = dates;
        setDateRange([start, end]);
        if (end) {
            setSelectedDate([start, end]);
        } else {
            setSelectedDate(start);
        }
    };

    // Nút áp dụng ngày
    const handleApplyDate = () => {
        if (dateRange[0] && dateRange[1]) {
            setSelectedDate([dateRange[0], dateRange[1]]);
            setShowDatePicker(false);
            setTimeout(() => handleSearch(), 0);
        } else if (dateRange[0]) {
            setSelectedDate(dateRange[0]);
            setShowDatePicker(false);
            setTimeout(() => handleSearch(), 0);
        } else {
            setSelectedDate(null);
            setShowDatePicker(false);
            setTimeout(() => handleSearch(), 0);
        }
    };

    // Nút thiết lập lại
    const handleResetDate = () => {
        setSelectedDate(null);
        setDateRange([null, null]);
        setShowDatePicker(false);
    };

    if (loading) {
        return (
            <div style={{ marginTop: '85px' }}>
                <LoadingSpinner content="Đang tìm" />;
            </div>
        );
    }

    return (
        <Container className={styles.searchContainer}>
            {/* Thanh tìm kiếm cho mobile */}
            <div className="d-block d-sm-none">
                <SearchBar />
            </div>
            <Row className="align-items-center mb-4">
                <Col xs="auto" className="d-none d-sm-block">
                    <span
                        style={{
                            color: '#22c55e',
                            fontWeight: 500,
                            fontSize: 18,
                        }}
                    >
                        Kết quả tìm kiếm:
                    </span>
                </Col>

                {/* Thanh tìm kiếm cho desktop */}
                <Col xs="auto" className="ms-auto d-flex gap-2">
                    <Button
                        variant="success"
                        className={styles.filterBtn}
                        onClick={() => setShowDatePicker(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <FaCalendarAlt style={{ fontSize: 18 }} />
                        <span style={{ fontWeight: 500 }}>
                            {dateButtonText}
                        </span>
                    </Button>
                    <Button
                        // variant="dark"
                        className={styles.filterBtn}
                        onClick={() => setShowFilter(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <FaFilter style={{ fontSize: 18 }} />
                        <span style={{ fontWeight: 500 }}>Bộ lọc</span>
                        <span style={{ fontSize: 12 }}>▼</span>
                    </Button>
                </Col>
            </Row>

            {/* Popup chọn ngày */}
            <Modal
                open={showDatePicker}
                onCancel={() => setShowDatePicker(false)}
                footer={null}
                centered
                width={window.innerWidth < 768 ? 350 : 500}
                className={styles.datePickerModal}
            >
                <div
                    style={{
                        padding: 24,
                        background: '#f9fafb',
                        borderRadius: 12,
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <h3
                            style={{
                                margin: 0,
                                fontWeight: 700,
                                color: '#2c44a7',
                            }}
                        >
                            Chọn ngày sự kiện
                        </h3>
                        <div
                            style={{
                                color: '#888',
                                fontSize: 14,
                                marginTop: 4,
                            }}
                        >
                            Bạn có thể chọn nhanh hoặc chọn khoảng ngày cụ thể
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 16,
                        }}
                    >
                        {quickRanges.map((item, idx) => {
                            let isActive = false;
                            if (item.value === null && selectedDate === null) {
                                isActive = true;
                            } else if (
                                item.value instanceof Date &&
                                selectedDate instanceof Date
                            ) {
                                isActive =
                                    item.value.getTime() ===
                                    selectedDate.toDate().getTime();
                            } else if (
                                item.value &&
                                item.value.start &&
                                item.value.end &&
                                Array.isArray(selectedDate)
                            ) {
                                isActive =
                                    selectedDate[0] &&
                                    selectedDate[1] &&
                                    item.value.start.getTime() ===
                                        selectedDate[0].valueOf() &&
                                    item.value.end.getTime() ===
                                        selectedDate[1].valueOf();
                            }
                            return (
                                <Button
                                    key={item.label}
                                    type={isActive ? 'primary' : 'default'}
                                    style={{
                                        borderRadius: 20,
                                        boxShadow: isActive
                                            ? '0 2px 8px #2c44a733'
                                            : 'none',
                                        fontWeight: 500,
                                        minWidth: 120,
                                        marginBottom: 8,
                                        borderColor: isActive
                                            ? '#2c44a7'
                                            : undefined,
                                        color: isActive ? '#fff' : '#2c44a7',
                                        background: isActive
                                            ? '#2c44a7'
                                            : '#fff',
                                        transition: 'all 0.2s',
                                    }}
                                    onClick={() => handleQuickRange(item.value)}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}
                    </div>
                    <div
                        style={{
                            borderTop: '1px solid #eee',
                            margin: '16px 0 16px 0',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AntdDatePicker.RangePicker
                            value={dateRange}
                            onChange={(dates) => {
                                handleDateChange(
                                    dates ? [dates[0], dates[1]] : [null, null],
                                );
                            }}
                            format="DD/MM/YYYY"
                            style={{
                                width: '100%',
                                background: '#fff',
                                borderRadius: 8,
                                boxShadow: '0 2px 8px #2c44a722',
                                padding: 8,
                                border: '1px solid #e5e7eb',
                            }}
                            allowEmpty={[true, true]}
                            placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                            suffixIcon={
                                <span
                                    style={{
                                        color: '#2c44a7',
                                        fontSize: 18,
                                        marginRight: 4,
                                    }}
                                >
                                    <i className="anticon anticon-calendar" />
                                </span>
                            }
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 12,
                            marginTop: 24,
                        }}
                    >
                        <Button
                            onClick={() => setShowDatePicker(false)}
                            style={{ borderRadius: 20, fontWeight: 500 }}
                        >
                            Đóng
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleApplyDate}
                            style={{
                                borderRadius: 20,
                                fontWeight: 500,
                                minWidth: 100,
                            }}
                        >
                            Áp dụng
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal bộ lọc nâng cao */}
            <Modal
                open={showFilter}
                onCancel={() => setShowFilter(false)}
                centered
                title="Bộ lọc nâng cao"
                footer={null}
            >
                <Form layout="vertical">
                    <Form.Item
                        label={
                            <span>
                                <FaMapMarkerAlt className="me-2" />
                                Vị trí
                            </span>
                        }
                    >
                        <Input
                            placeholder="Nhập vị trí..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <span>
                                <FaMoneyBillWave className="me-2" />
                                Khoảng giá (VNĐ)
                            </span>
                        }
                    >
                        <Slider
                            range
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            step={10000}
                            value={priceRange}
                            onChange={setPriceRange}
                            trackStyle={[{ backgroundColor: '#2c44a7' }]}
                            handleStyle={[
                                {
                                    borderColor: '#2c44a7',
                                    backgroundColor: '#fff',
                                },
                                {
                                    borderColor: '#2c44a7',
                                    backgroundColor: '#fff',
                                },
                            ]}
                            railStyle={{ backgroundColor: '#eee' }}
                        />
                        <div className="d-flex justify-content-between mt-2">
                            <span>{priceRange[0].toLocaleString()} đ</span>
                            <span>{priceRange[1].toLocaleString()} đ</span>
                        </div>
                    </Form.Item>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 8,
                        }}
                    >
                        <Button onClick={() => setShowFilter(false)}>
                            Đóng
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                setShowFilter(false);
                                handleSearch();
                            }}
                        >
                            Áp dụng
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* <Row className="mt-4">
                {events.map((event) => (
                    <Col key={event._id} md={4} className="mb-4">
                        <Card className={styles.eventCard}>
                            <Card.Img
                                variant="top"
                                src={event.image}
                                className={styles.eventImage}
                            />
                            <Card.Body>
                                <Card.Title>{event.name}</Card.Title>
                                <Card.Text>
                                    <small className="text-muted">
                                        <FaCalendarAlt className="me-2" />
                                        {new Date(
                                            event.startDate,
                                        ).toLocaleDateString()}
                                    </small>
                                    <br />
                                    <small className="text-muted">
                                        <FaMapMarkerAlt className="me-2" />
                                        {event.location}
                                    </small>
                                </Card.Text>
                                <Button
                                    variant="outline-primary"
                                    className="w-100"
                                    href={`/event/${event._id}`}
                                >
                                    Xem chi tiết
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row> */}
            {events.length === 0 ? (
                <div className="w-100 text-center py-5">
                    <h4 style={{ color: '#22c55e', fontWeight: 600 }}>
                        Rất tiếc! Không tìm thấy kết quả nào
                    </h4>
                    <div style={{ color: '#888', fontSize: 16, marginTop: 8 }}>
                        Bạn hãy thử điều chỉnh lại bộ lọc, sử dụng các từ khóa
                        phổ biến hơn
                    </div>
                </div>
            ) : (
                <EventList events={events} />
            )}
        </Container>
    );
};

export default Search;
