import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Modal,
    Form,
    InputGroup,
} from 'react-bootstrap';
import {
    FaSearch,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaFilter,
    FaMoneyBillWave,
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../util/api';
import styles from './Search.module.css';
import Slider from 'rc-slider';
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
    const [dateRange, setDateRange] = useState([null, null]);
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
                date: selectedDate,
                location,
                minPrice: priceRange[0] !== 0 ? priceRange[0] : undefined,
                maxPrice: priceRange[1] !== 5000000 ? priceRange[1] : undefined,
            };
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
            dateButtonText = `${selectedDate[0].toLocaleDateString(
                'vi-VN',
            )} - ${selectedDate[1].toLocaleDateString('vi-VN')}`;
        } else if (selectedDate instanceof Date) {
            dateButtonText = selectedDate.toLocaleDateString('vi-VN');
        }
    }

    // Xử lý chọn nhanh
    const handleQuickRange = (range) => {
        if (!range) {
            setSelectedDate(null);
            setDateRange([null, null]);
        } else if (range instanceof Date) {
            setSelectedDate(range);
            setDateRange([range, range]);
        } else if (range.start && range.end) {
            setSelectedDate([range.start, range.end]);
            setDateRange([range.start, range.end]);
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

    return (
        <Container className={styles.searchContainer}>
            <Row className="align-items-center mb-4">
                <Col xs="auto">
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
                        variant="dark"
                        className={styles.filterBtn}
                        onClick={() => setShowFilter(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <FaFilter style={{ fontSize: 18 }} />
                        <span style={{ color: '#22c55e', fontWeight: 500 }}>
                            Bộ lọc
                        </span>
                        <span style={{ fontSize: 12 }}>▼</span>
                    </Button>
                </Col>
            </Row>

            {/* Popup chọn ngày */}
            <Modal
                show={showDatePicker}
                onHide={() => setShowDatePicker(false)}
                centered
                size="lg"
                className={styles.datePickerModal}
            >
                <Modal.Body className={styles.datePickerModalBody}>
                    <div className={styles.datePickerPopup}>
                        <div className={styles.quickRangeBar}>
                            {quickRanges.map((item, idx) => {
                                let isActive = false;
                                if (
                                    item.value === null &&
                                    selectedDate === null
                                ) {
                                    isActive = true;
                                } else if (
                                    item.value instanceof Date &&
                                    selectedDate instanceof Date
                                ) {
                                    isActive =
                                        item.value.getTime() ===
                                        selectedDate.getTime();
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
                                            selectedDate[0].getTime() &&
                                        item.value.end.getTime() ===
                                            selectedDate[1].getTime();
                                }
                                return (
                                    <Button
                                        key={item.label}
                                        variant={
                                            isActive
                                                ? 'success'
                                                : 'outline-secondary'
                                        }
                                        className={`${styles.quickRangeBtn} ${
                                            isActive
                                                ? styles.activeQuickRange
                                                : ''
                                        }`}
                                        onClick={() =>
                                            handleQuickRange(item.value)
                                        }
                                    >
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </div>
                        <div className={styles.datePickerCalendarWrap}>
                            <DatePicker
                                ref={datePickerRef}
                                selected={dateRange[0]}
                                onChange={handleDateChange}
                                startDate={dateRange[0]}
                                endDate={dateRange[1]}
                                selectsRange
                                inline
                                monthsShown={2}
                                calendarStartDay={1}
                                locale="vi"
                                className={styles.customDatePicker}
                            />
                        </div>
                        <div className={styles.datePickerFooter}>
                            {/* <Button
                                variant="outline-success"
                                onClick={handleResetDate}
                                className={styles.footerButton}
                            >
                                Thiết lập lại
                            </Button> */}
                            <Button
                                variant="secondary"
                                onClick={() => setShowDatePicker(false)}
                                className={styles.footerButton}
                            >
                                Đóng
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleApplyDate}
                                className={styles.footerButton}
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Modal bộ lọc nâng cao */}
            <Modal
                show={showFilter}
                onHide={() => setShowFilter(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Bộ lọc nâng cao</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-4">
                        <Form.Label>
                            <FaMapMarkerAlt className="me-2" />
                            Vị trí
                        </Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Nhập vị trí..."
                            className="text-dark"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>
                            <FaMoneyBillWave className="me-2" />
                            Khoảng giá (VNĐ)
                        </Form.Label>
                        <div style={{ padding: '0 10px' }}>
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
                        </div>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilter(false)}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            setShowFilter(false);
                            handleSearch();
                        }}
                    >
                        Áp dụng
                    </Button>
                </Modal.Footer>
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
