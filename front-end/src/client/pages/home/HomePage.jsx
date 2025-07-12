import React, { useEffect, useState } from 'react';
import carousel from '../../../assets/images/carousel.jpg';
import EventList from '../../components/EventList';
import { Link } from 'react-router-dom';
import api from '../../../util/api';
import { usePermission } from '../../../hooks/usePermission';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../../config/rbacConfig';

const HomePage = () => {
    const { user } = useAuth();
    const { hasPermission } = usePermission(user?.role);

    const [loading, setLoading] = useState(true);
    const [trendingEvent, setTrendingEvent] = useState([]);
    const [specialEvents, setSpecialEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const trending = await fetchEvents('trending');
                const special = await fetchEvents('special');
                const upcoming = await fetchEvents('upcoming');

                setTrendingEvent(trending || []);
                setSpecialEvents(special || []);
                setUpcomingEvents(upcoming || []);
            } catch (error) {
                console.error('Error fetching events:', error);
                // Set empty arrays if API fails
                setTrendingEvent([]);
                setSpecialEvents([]);
                setUpcomingEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fetchEvents = async (type) => {
        try {
            const res = await api.getEvents(type);
            return res.success ? res.events : [];
        } catch (error) {
            console.error(`Error fetching ${type} events:`, error);
            return [];
        }
    };

    return (
        <>
            {/* Modern Hero Section */}
            <section className="hero-section py-5 border border-2">
                {/* Animated Background Elements */}
                <div className="position-absolute w-100 h-100 animated-bg"></div>

                <div className="container px-5">
                    <div className="row align-items-center">
                        <div className="col-lg-6 col-md-12 text-white mb-4 mb-lg-0 text-content">
                            <h1
                                className="display-4 fw-bold mb-4 fade-in-up"
                                style={{
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                }}
                            >
                                Khám Phá Những Sự Kiện Âm Nhạc Tuyệt Vời
                            </h1>
                            <p
                                className="lead mb-4 fade-in-up-delay-1"
                                style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                }}
                            >
                                Đặt vé cho những sự kiện tuyệt vời nhất và tạo
                                ra những kỷ niệm đáng nhớ
                            </p>
                            <div className="d-flex gap-3 fade-in-up-delay-2">
                                <Link
                                    to="/search"
                                    className="btn btn-light btn-lg px-4 py-3 fw-bold"
                                >
                                    <i className="bi bi-search me-2"></i>
                                    Tìm Sự Kiện
                                </Link>
                                {hasPermission(
                                    permissions.VIEW_CREATE_EVENT,
                                ) && (
                                    <Link
                                        to="/event/create"
                                        className="btn btn-outline-light btn-lg px-4 py-3 fw-bold"
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Tạo Sự Kiện
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-12">
                            <div className="row g-3 fade-in-right feature-cards-container">
                                {/* Feature Cards */}
                                <div className="col-6 col-md-6 col-sm-6">
                                    <div className="card h-100 border-0 shadow-lg feature-card">
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i
                                                    className="bi bi-music-note-beamed text-primary"
                                                    style={{
                                                        fontSize: '2.5rem',
                                                    }}
                                                ></i>
                                            </div>
                                            <h5 className="card-title fw-bold">
                                                Sự Kiện Âm Nhạc
                                            </h5>
                                            <p className="card-text text-muted small">
                                                Khám phá các buổi hòa nhạc,
                                                festival và biểu diễn đặc sắc
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-6 col-sm-6">
                                    <div className="card h-100 border-0 shadow-lg feature-card">
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i
                                                    className="bi bi-calendar-event text-success"
                                                    style={{
                                                        fontSize: '2.5rem',
                                                    }}
                                                ></i>
                                            </div>
                                            <h5 className="card-title fw-bold">
                                                Đặt Vé Dễ Dàng
                                            </h5>
                                            <p className="card-text text-muted small">
                                                Quy trình đặt vé đơn giản, thanh
                                                toán an toàn và nhanh chóng
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-6 col-sm-6">
                                    <div className="card h-100 border-0 shadow-lg feature-card">
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i
                                                    className="bi bi-star-fill text-warning"
                                                    style={{
                                                        fontSize: '2.5rem',
                                                    }}
                                                ></i>
                                            </div>
                                            <h5 className="card-title fw-bold">
                                                Đánh Giá Chất Lượng
                                            </h5>
                                            <p className="card-text text-muted small">
                                                Hệ thống đánh giá và review từ
                                                cộng đồng người tham gia
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-6 col-sm-6">
                                    <div className="card h-100 border-0 shadow-lg feature-card">
                                        <div className="card-body text-center p-4">
                                            <div className="mb-3">
                                                <i
                                                    className="bi bi-shield-check text-success"
                                                    style={{
                                                        fontSize: '2.5rem',
                                                    }}
                                                ></i>
                                            </div>
                                            <h5 className="card-title fw-bold">
                                                Thanh Toán An Toàn
                                            </h5>
                                            <p className="card-text text-muted small">
                                                Hệ thống thanh toán bảo mật, đa
                                                dạng phương thức
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sự kiện xu hướng */}
            <section className="events py-4" id="trendingEvents">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="section-title text-white">
                            🔥Sự kiện xu hướng
                        </h2>
                        <Link
                            to={'/search?type=trending'}
                            className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center"
                            style={{ color: 'rgb(166, 166, 176)' }}
                        >
                            Xem thêm{' '}
                            <i className="bi bi-chevron-right ml-1"></i>
                        </Link>
                    </div>
                    <EventList
                        events={trendingEvent}
                        type={'trending'}
                        loading={loading}
                        skeletonCount={4}
                    />
                </div>
            </section>

            {/* Sự kiện sắp diễn ra */}
            <section className="events py-4" id="upcomingEvents">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="section-title text-white">
                            📅 Sự kiện sắp diễn ra
                        </h2>
                        <Link
                            to={'/search?type=upcoming'}
                            className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center"
                            style={{ color: 'rgb(166, 166, 176)' }}
                        >
                            Xem thêm{' '}
                            <i className="bi bi-chevron-right ml-1"></i>
                        </Link>
                    </div>
                    <EventList
                        events={upcomingEvents}
                        loading={loading}
                        skeletonCount={6}
                    />
                </div>
            </section>

            {/* Sự kiện đặc sắc */}
            <section className="events pb-5" id="specialEvents">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="section-title text-white">
                            🌟 Sự kiện đặc sắc
                        </h2>
                        <Link
                            to={'/search'}
                            className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center"
                            style={{ color: 'rgb(166, 166, 176)' }}
                        >
                            Xem thêm{' '}
                            <i className="bi bi-chevron-right ml-1"></i>
                        </Link>
                    </div>
                    <EventList
                        events={specialEvents}
                        loading={loading}
                        skeletonCount={8}
                    />
                </div>
            </section>
        </>
    );
};

export default HomePage;
