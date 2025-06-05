import React, { useEffect, useState } from 'react';
import carousel from '../../../assets/images/carousel.jpg';
import EventList from '../../components/EventList';
import { Link } from 'react-router-dom';
import api from '../../../util/api';

const HomePage = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);
    const [trendingEvent, setTrendingEvent] = useState([]);
    const [specialEvents, setSpecialEvents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingLocal(true);

            const trending = await fetchEvents('trending');
            const special = await fetchEvents('special');
            setTrendingEvent(trending || []);
            setSpecialEvents(special || []);

            setLoadingLocal(false);
        };
        fetchData();
    }, []);

    const fetchEvents = async (type) => {
        const res = await api.getEvents(type);
        return res.success ? res.events : [];
    };

    return (
        <>
            <div
                className="carousel slide"
                id="heroCarousel"
                data-bs-ride="carousel"
            >
                <div className="carousel-inner">
                    <div className="carousel-item active">
                        <img
                            className="d-block w-100"
                            src={carousel}
                            alt="Carousel"
                        />
                        <div className="carousel-caption">
                            <h1>Khám Phá Những Sự Kiện Âm Nhạc Tuyệt Vời</h1>
                            <p>Đặt vé cho những sự kiện tuyệt vời nhất</p>
                            <a
                                className="btn btn-primary btn-lg"
                                href="#specialEvents"
                            >
                                Khám Phá Ngay
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            {loadingLocal ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            ) : (
                <>
                    <section className="events py-4" id="trendingEvents">
                        <div className="container">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="section-title text-white">
                                    🔥Sự kiện xu hướng
                                </h2>
                            </div>
                            <EventList
                                events={trendingEvent}
                                type={'trending'}
                            />
                        </div>
                    </section>

                    <section className="events pb-5" id="specialEvents">
                        <div className="container">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="section-title text-white">
                                    Sự kiện đặc sắc
                                </h2>
                                <Link
                                    to={'/all-events'}
                                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center"
                                    style={{ color: 'rgb(166, 166, 176)' }}
                                >
                                    Xem thêm{' '}
                                    <i className="bi bi-chevron-right ml-1"></i>
                                </Link>
                            </div>
                            <EventList events={specialEvents} />
                        </div>
                    </section>
                </>
            )}
        </>
    );
};

export default HomePage;
