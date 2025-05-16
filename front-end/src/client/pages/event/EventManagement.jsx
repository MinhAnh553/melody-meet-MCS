import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import {
    BsSearch,
    BsCalendarX,
    BsBagCheckFill,
    BsPencilSquare,
    BsPieChartFill,
} from 'react-icons/bs';
import api from '../../../util/api';
import TimeText from '../../components/providers/TimeText';

const EventManagement = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);

    // Phân trang
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Quản lý tab active
    const [activeTab, setActiveTab] = useState('approved');

    // Tìm kiếm
    const [searchKey, setSearchKey] = useState('');

    useEffect(() => {
        fetchEvents('approved');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleUpcoming = () => {
        setActiveTab('approved');
        setPage(1);
        fetchEvents('approved');
    };

    const handlePast = () => {
        setActiveTab('past');
        setPage(1);
        fetchEvents('event_over');
    };

    const handlePending = () => {
        setActiveTab('pending');
        setPage(1);
        fetchEvents('pending');
    };

    const handleRejected = () => {
        setActiveTab('rejected');
        setPage(1);
        fetchEvents('rejected');
    };

    const handleSearch = (value) => {
        setSearchKey(value);
    };

    useEffect(() => {
        fetchEvents(activeTab);
    }, [searchKey]);

    const fetchEvents = async (status) => {
        setLoadingLocal(true);
        try {
            const res = await api.getMyEvents(page, limit, status, searchKey);
            if (res.success) {
                setEvents(res.events);
                setTotal(res.totalEvents);
                setTotalPages(res.totalPages);

                // setPage(res.currentPage);
                setLimit(res.limit);
            } else {
                setEvents([]);
                setTotal(0);
                setTotalPages(1);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.log('MinhAnh553: fetchEvents -> error', error);
        } finally {
            setLoadingLocal(false);
        }
    };

    return (
        <Container
            fluid
            style={{
                minHeight: '100vh',
                color: '#fff',
                paddingTop: '20px',
                paddingBottom: '20px',
            }}
        >
            {/* Thanh Tìm kiếm */}
            <Row className="mx-3 mb-3">
                <Col xs={12} md={6} className="mb-2 mb-md-0">
                    <form className="d-flex search-form">
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="bi bi-search" />
                            </span>
                            <input
                                className="form-control text-dark"
                                type="search"
                                placeholder="Tìm kiếm"
                                aria-label="Search"
                                value={searchKey}
                                onChange={(e) => {
                                    handleSearch(e.target.value);
                                }}
                            />
                        </div>
                    </form>
                </Col>
                <Col
                    xs={12}
                    md="auto"
                    className="d-flex align-items-center mb-2 mb-md-0"
                >
                    <Button
                        variant={activeTab === 'approved' ? 'success' : 'dark'}
                        onClick={handleUpcoming}
                        className="me-2"
                        style={{ border: '1px solid #444' }}
                    >
                        Sắp tới
                    </Button>
                    <Button
                        variant={activeTab === 'past' ? 'success' : 'dark'}
                        onClick={handlePast}
                        className="me-2"
                        style={{ border: '1px solid #444' }}
                    >
                        Đã qua
                    </Button>
                    <Button
                        variant={activeTab === 'pending' ? 'success' : 'dark'}
                        onClick={handlePending}
                        className="me-2"
                        style={{ border: '1px solid #444' }}
                    >
                        Chờ duyệt
                    </Button>
                    <Button
                        variant={activeTab === 'rejected' ? 'success' : 'dark'}
                        onClick={handleRejected}
                        style={{ border: '1px solid #444' }}
                    >
                        Bị từ chối
                    </Button>
                </Col>
            </Row>

            {/* {activeTab === 'pending' && (
                <Row className="mx-3">
                    <Alert
                        variant="warning"
                        className="fw-bold text-dark"
                        style={{ backgroundColor: '#FFEB3B', border: 'none' }}
                    >
                        Lưu ý: Sự kiện đang chờ duyệt. Để đảm bảo tính bảo mật
                        cho sự kiện của bạn, quyền truy cập vào trang chi tiết
                        chỉ dành cho chủ sở hữu và quản trị viên được ủy quyền
                    </Alert>
                </Row>
            )} */}

            {loadingLocal ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            ) : (
                <>
                    {/* Danh sách sự kiện */}
                    <Row className="mx-3">
                        {events.length === 0 ? (
                            <div className="text-center my-5">
                                <BsCalendarX
                                    size={50}
                                    className="text-white mb-3"
                                />
                                <p className="fs-5 text-white">
                                    Không có sự kiện
                                </p>
                            </div>
                        ) : (
                            events.map((event) => (
                                <Card
                                    key={event._id}
                                    className="mb-3"
                                    style={{
                                        backgroundColor: '#31353e',
                                        border: '1px solid #444',
                                        borderRadius: '20px',
                                    }}
                                >
                                    <Card.Body className="p-3">
                                        <Row>
                                            {/* Ảnh sự kiện */}
                                            <Col
                                                xs="auto"
                                                className="d-flex align-items-center"
                                            >
                                                <div
                                                    style={{
                                                        maxWidth: '300px',
                                                        maxHeight: '300px',
                                                    }}
                                                >
                                                    <img
                                                        className="img-fluid rounded shadow"
                                                        src={event.background}
                                                        alt={event.name}
                                                        style={{
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                </div>
                                            </Col>

                                            {/* Thông tin sự kiện */}
                                            <Col>
                                                <div className="mb-2">
                                                    <h5
                                                        className="fw-bold mb-3"
                                                        style={{
                                                            color: '#fff',
                                                            fontSize: '1rem',
                                                        }}
                                                    >
                                                        {event.name}
                                                    </h5>
                                                    <p
                                                        className="mb-2"
                                                        style={{
                                                            color: '#fff',
                                                            fontSize: '1rem',
                                                        }}
                                                    >
                                                        <i className="bi bi-clock"></i>
                                                        {'  '}
                                                        <span
                                                            style={{
                                                                color: 'rgb(45, 194, 117)',
                                                            }}
                                                        >
                                                            <TimeText
                                                                event={event}
                                                            />
                                                        </span>
                                                    </p>

                                                    <p
                                                        className="mb-5"
                                                        style={{
                                                            color: '#fff',
                                                            fontSize: '1rem',
                                                        }}
                                                    >
                                                        <i className="bi bi-geo-alt-fill"></i>
                                                        {'   '}
                                                        <span
                                                            style={{
                                                                color: 'rgb(45, 194, 117)',
                                                            }}
                                                        >
                                                            {
                                                                event.location
                                                                    .venueName
                                                            }
                                                        </span>
                                                        <br />
                                                        <span
                                                            style={{
                                                                marginLeft:
                                                                    '22px',
                                                            }}
                                                        >
                                                            {
                                                                event.location
                                                                    .address
                                                            }
                                                            ,{' '}
                                                            {
                                                                event.location
                                                                    .ward
                                                            }
                                                            ,{' '}
                                                            {
                                                                event.location
                                                                    .district
                                                            }
                                                            ,{' '}
                                                            {
                                                                event.location
                                                                    .province
                                                            }
                                                        </span>
                                                    </p>
                                                </div>
                                            </Col>
                                        </Row>

                                        <hr className="my-3 border-top border-light" />

                                        <Row className="mt-3">
                                            <Col>
                                                <div
                                                    className="d-flex align-items-center justify-content-center"
                                                    style={{ gap: '12px' }}
                                                >
                                                    <Button
                                                        variant="dark"
                                                        className="d-flex align-items-center gap-2"
                                                        style={{
                                                            border: '1px solid #555',
                                                            borderRadius: '8px',
                                                        }}
                                                        onClick={() => {
                                                            navigate(
                                                                `/event/${event._id}/summary`,
                                                            );
                                                        }}
                                                    >
                                                        <BsPieChartFill />
                                                        Tổng quan
                                                    </Button>
                                                    <Button
                                                        variant="dark"
                                                        className="d-flex align-items-center gap-2"
                                                        style={{
                                                            border: '1px solid #555',
                                                            borderRadius: '8px',
                                                        }}
                                                        onClick={() => {
                                                            navigate(
                                                                `/event/${event._id}/orders`,
                                                            );
                                                        }}
                                                    >
                                                        <BsBagCheckFill />
                                                        Đơn hàng
                                                    </Button>
                                                    {event.status !==
                                                        'event_over' && (
                                                        <Button
                                                            variant="dark"
                                                            className="d-flex align-items-center gap-2"
                                                            style={{
                                                                border: '1px solid #555',
                                                                borderRadius:
                                                                    '8px',
                                                            }}
                                                            onClick={() => {
                                                                navigate(
                                                                    `/event/${event._id}/edit`,
                                                                );
                                                            }}
                                                        >
                                                            <BsPencilSquare />
                                                            Chỉnh sửa
                                                        </Button>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </Row>

                    {/* Phân trang */}
                    {events.length > 0 && (
                        <div className="d-flex justify-content-center align-items-center">
                            <Button
                                variant="secondary"
                                className="me-2"
                                disabled={page <= 1}
                                onClick={() => setPage((prev) => prev - 1)}
                            >
                                Trang trước
                            </Button>
                            <span>
                                Trang {page} / {totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                className="ms-2"
                                disabled={page >= totalPages}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Trang sau
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default EventManagement;
