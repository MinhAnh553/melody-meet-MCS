import React, { useEffect, useState } from 'react';
import carousel from '../../../assets/images/carousel.jpg';
import EventList from '../../components/EventList';
import { Link } from 'react-router-dom';
import api from '../../../util/api';
import { usePermission } from '../../../hooks/usePermission';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../../config/rbacConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
            {/* Carousel Hero Section using Swiper */}
            <section className="hero-carousel-section py-4">
                <div className="container">
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        spaceBetween={30}
                        slidesPerView={1}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        loop
                        style={{ overflow: 'hidden' }}
                    >
                        {trendingEvent.map((event) => (
                            <SwiperSlide key={event._id}>
                                <Link to={`/event/${event._id}`}>
                                    <div
                                        className="event-slide"
                                        style={{
                                            display: 'flex',
                                            marginTop: '60px',
                                            overflow: 'hidden',
                                            background:
                                                'linear-gradient(rgb(39, 39, 42) 48.04%, rgb(0, 0, 0) 100%)',
                                            color: 'rgb(255, 255, 255)',
                                        }}
                                    >
                                        {/* Bên trái: Thông tin sự kiện */}
                                        <div
                                            style={{
                                                flex: 1.2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                padding: 40,
                                            }}
                                        >
                                            <h2
                                                className="fw-bold mb-3"
                                                style={{
                                                    fontSize: 32,
                                                    letterSpacing: 1,
                                                }}
                                            >
                                                {event.name}
                                            </h2>
                                            <div
                                                className="mb-2"
                                                style={{ fontSize: 18 }}
                                            >
                                                <i className="bi bi-calendar3" />{' '}
                                                {new Date(
                                                    event.startTime,
                                                ).toLocaleDateString('vi-VN', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                            <div
                                                className="mb-4"
                                                style={{ fontSize: 18 }}
                                            >
                                                <i className="bi bi-geo-alt"></i>{' '}
                                                {event.location.venueName}
                                            </div>
                                        </div>
                                        {/* Bên phải: Ảnh sự kiện */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                            }}
                                        >
                                            <img
                                                src={
                                                    event.background || carousel
                                                }
                                                alt={event.name}
                                                style={{
                                                    // maxWidth: '95%',
                                                    // maxHeight: '95%',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </section>

            {/* Sự kiện xu hướng */}
            {/* <section className="events py-4" id="trendingEvents">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="section-title fw-bold">
                            🔥Sự kiện xu hướng
                        </h2>
                        <Link
                            to={'/search?type=trending'}
                            className="transition-colors duration-300 flex items-center"
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
            </section> */}

            {/* Sự kiện sắp diễn ra */}
            <section className="events py-4" id="upcomingEvents">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="section-title fw-bold">
                            📅 Sự kiện sắp diễn ra
                        </h2>
                        <Link
                            to={'/search?type=upcoming'}
                            className="transition-colors duration-300 flex items-center"
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
                        <h2 className="section-title fw-bold">
                            🌟 Sự kiện đặc sắc
                        </h2>
                        <Link
                            to={'/search'}
                            className="transition-colors duration-300 flex items-center"
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
