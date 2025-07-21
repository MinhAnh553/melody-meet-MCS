import React, { useEffect, useState } from 'react';
import EventList from '../../components/EventList';
import { Link } from 'react-router-dom';
import api from '../../../util/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import styles from './HomePage.module.css';
import HeroCarouselSkeleton from '../../components/loading/HeroCarouselSkeleton';

const HomePage = () => {
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
            <section className={`${styles.heroCarouselSection} py-4 pb-0`}>
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
                        {loading
                            ? Array.from({ length: 2 }).map((_, idx) => (
                                  <SwiperSlide key={idx}>
                                      <HeroCarouselSkeleton />
                                  </SwiperSlide>
                              ))
                            : trendingEvent.map((event) => (
                                  <SwiperSlide key={event._id}>
                                      <Link to={`/event/${event._id}`}>
                                          <div className={styles.eventSlide}>
                                              {/* Desktop Layout */}
                                              <div
                                                  className={
                                                      styles.desktopLayout
                                                  }
                                              >
                                                  {/* Trending fire tag */}
                                                  <div className={styles.eventInfo}>
                                                      <div className={styles.trendingTag}>
                                                          <span role="img" aria-label="fire">🔥</span> Trending
                                                      </div>
                                                      {/* Bên trái: Thông tin sự kiện */}
                                                      <h2
                                                          className={`${styles.eventTitle} fw-bold mb-3`}
                                                      >
                                                          {event.name}
                                                      </h2>
                                                      <div
                                                          className={`${styles.eventDate} mb-2`}
                                                      >
                                                          <i className="bi bi-calendar3" />{' '}
                                                          {new Date(
                                                              event.startTime,
                                                          ).toLocaleDateString(
                                                              'vi-VN',
                                                              {
                                                                  day: '2-digit',
                                                                  month: 'long',
                                                                  year: 'numeric',
                                                              },
                                                          )}
                                                      </div>
                                                      <div
                                                          className={`${styles.eventLocation} mb-4`}
                                                      >
                                                          <i className="bi bi-geo-alt"></i>{' '}
                                                          {
                                                              event.location
                                                                  .venueName
                                                          }
                                                      </div>
                                                  </div>
                                                  {/* Bên phải: Ảnh sự kiện */}
                                                  <div
                                                      className={
                                                          styles.eventImage
                                                      }
                                                  >
                                                      <img
                                                          src={event.background}
                                                          alt={event.name}
                                                          className={
                                                              styles.slideImage
                                                          }
                                                      />
                                                  </div>
                                              </div>

                                              {/* Mobile Layout */}
                                              <div
                                                  className={
                                                      styles.mobileLayout
                                                  }
                                              >
                                                  {/* Ảnh nền với overlay */}
                                                  <div
                                                      className={
                                                          styles.mobileBgContainer
                                                      }
                                                  >
                                                      <img
                                                          src={event.background}
                                                          alt={event.name}
                                                          className={
                                                              styles.mobileBgImage
                                                          }
                                                      />
                                                      <div
                                                          className={
                                                              styles.mobileOverlay
                                                          }
                                                      ></div>
                                                  </div>

                                                  {/* Nội dung overlay */}
                                                  <div
                                                      className={
                                                          styles.mobileContent
                                                      }
                                                  >
                                                      <h2
                                                          className={`${styles.mobileEventTitle} fw-bold mb-3`}
                                                      >
                                                          {event.name}
                                                      </h2>
                                                      <div
                                                          className={
                                                              styles.mobileEventDetails
                                                          }
                                                      >
                                                          <div
                                                              className={`${styles.mobileEventDate} mb-2`}
                                                          >
                                                              <i className="bi bi-calendar3" />{' '}
                                                              {new Date(
                                                                  event.startTime,
                                                              ).toLocaleDateString(
                                                                  'vi-VN',
                                                                  {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                  },
                                                              )}
                                                          </div>
                                                          <div
                                                              className={
                                                                  styles.mobileEventLocation
                                                              }
                                                          >
                                                              <i className="bi bi-geo-alt"></i>{' '}
                                                              {
                                                                  event.location
                                                                      .venueName
                                                              }
                                                          </div>
                                                      </div>
                                                  </div>
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
                            📅 Sự kiện sắp tới
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
