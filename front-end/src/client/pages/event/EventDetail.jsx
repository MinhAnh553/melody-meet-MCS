import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../util/api';
import TimeText from '../../components/providers/TimeText';
import DOMPurify from 'dompurify';
import TicketModal from '../payment/TicketModal';
import swalCustomize from '../../../util/swalCustomize';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';

const EventDetail = () => {
    const { isAuthenticated } = useAuth();
    const [loadingLocal, setLoadingLocal] = useState(true);

    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoadingLocal(true);
                const res = await api.getEventById(eventId);
                if (res.success) {
                    setEvent(res.event);
                } else {
                    navigate('/');
                    return swalCustomize.Toast.fire({
                        icon: 'error',
                        title: res.message,
                    });
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu sự kiện:', error);
            } finally {
                setLoadingLocal(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (!event)
        return (
            <div
                className="container-fluid py-4"
                style={{
                    // backgroundColor: '#121212',
                    margin: '80px 0 0',
                    borderRadius: '20px',
                }}
            >
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-2">Đang tải...</p>
                </div>
            </div>
        );

    // Sắp xếp vé từ thấp đến cao
    const sortedTickets = [...event.ticketTypes].sort(
        (a, b) => a.price - b.price,
    );

    // Định dạng giá
    const formatPrice = (price) =>
        price === 0
            ? 'Miễn phí'
            : 'Giá từ ' + price.toLocaleString('vi-VN') + ' đ';

    const lowestPrice = sortedTickets.length
        ? formatPrice(sortedTickets[0].price)
        : 'Miễn phí';

    const sanitizedDescription = DOMPurify.sanitize(event.description);

    // Hàm mở modal mua vé
    const handleBuyNow = () => {
        setShowModal(true);
    };
    return (
        <>
            {/* Phần banner (đã có sẵn) */}
            <div
                className="container-fluid py-4"
                style={{
                    backgroundColor: '#121212',
                    margin: '80px 0 0',
                    borderRadius: '20px',
                }}
            >
                <div className="container">
                    <div className="row g-4 align-items-center">
                        {/* Cột trái */}
                        <div className="col-md-5 text-white">
                            <h1
                                className="fw-bold mb-3"
                                style={{ color: '#bdbdbd', fontSize: '1.5rem' }}
                            >
                                {event.name}
                            </h1>

                            <p
                                className="mb-2"
                                style={{ color: '#bdbdbd', fontSize: '1rem' }}
                            >
                                <i className="bi bi-clock"></i>
                                {'  '}
                                <span style={{ color: 'rgb(45, 194, 117)' }}>
                                    <TimeText event={event} />
                                </span>
                            </p>

                            <p
                                className="mb-5"
                                style={{ color: '#bdbdbd', fontSize: '1rem' }}
                            >
                                <i className="bi bi-geo-alt-fill"></i>
                                {'   '}
                                <span style={{ color: 'rgb(45, 194, 117)' }}>
                                    {event.location.venueName}
                                </span>
                                <br />
                                <span style={{ marginLeft: '22px' }}>
                                    {event.location.address},{' '}
                                    {event.location.ward},{' '}
                                    {event.location.district},{' '}
                                    {event.location.province}
                                </span>
                            </p>
                            <hr
                                style={{ background: 'white', height: '1.5px' }}
                            />
                            <p
                                className="fw-bold"
                                style={{
                                    color: 'rgb(45, 194, 117)',
                                    fontSize: '1.3rem',
                                }}
                            >
                                {lowestPrice}
                            </p>

                            <div
                                style={{
                                    display: 'inline-block',
                                    cursor:
                                        event.status === 'event_over' ||
                                        !isAuthenticated
                                            ? 'not-allowed'
                                            : 'pointer',
                                }}
                            >
                                <button
                                    className="btn btn-success btn-lg mt-2"
                                    onClick={handleBuyNow}
                                    disabled={
                                        event.status === 'event_over' ||
                                        !isAuthenticated
                                    }
                                    style={{
                                        backgroundColor:
                                            event.status === 'event_over' ||
                                            !isAuthenticated
                                                ? '#ccc'
                                                : '',
                                    }}
                                >
                                    {event.status === 'event_over'
                                        ? 'Sự kiện đã kết thúc'
                                        : !isAuthenticated
                                        ? 'Đăng nhập để mua vé'
                                        : 'Mua vé ngay'}
                                </button>
                            </div>
                        </div>

                        {/* Cột phải */}
                        <div className="col-md-7 text-center">
                            <img
                                src={event.background}
                                alt="Concert Banner"
                                className="img-fluid rounded shadow"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Phần giới thiệu (nằm dưới banner) */}
            <div className="container my-5">
                <h2 className="text-white mb-3">Giới thiệu</h2>
                <div
                    className="card p-4 border-0"
                    style={{ backgroundColor: '#1e1e1e' }}
                >
                    {/* Nếu có ảnh mô tả giới thiệu riêng, hiển thị: */}
                    {event.descriptionImage && (
                        <img
                            src={event.descriptionImage}
                            alt="Giới thiệu"
                            className="img-fluid rounded mb-3"
                        />
                    )}

                    {/* Nội dung mô tả sự kiện */}
                    <p
                        className="event-description"
                        dangerouslySetInnerHTML={{
                            __html: sanitizedDescription,
                        }}
                        style={{ color: '#fff', whiteSpace: 'pre-line' }}
                    ></p>
                </div>
            </div>
            {/* Thông tin ban tổ chức */}
            <div className="container my-5">
                <h2 className="text-white mb-3">Ban Tổ Chức</h2>
                <div
                    className="card p-4 border-0"
                    style={{ backgroundColor: '#1e1e1e' }}
                >
                    <div className="d-flex align-items-center">
                        <img
                            src={event.organizer?.logo}
                            alt="Organizer Logo"
                            style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                            }}
                            className="rounded me-3"
                        />
                        <div>
                            <h5 className="text-white mb-1">
                                {event.organizer?.name}
                            </h5>
                            <p style={{ color: '#fff' }}>
                                {event.organizer?.info}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal mua vé */}
            <TicketModal
                show={showModal}
                onHide={() => setShowModal(false)}
                event={event}
            />
            <div className="fixed-ticket-bar d-block d-md-none">
                <div className="container d-flex justify-content-between align-items-center h-100">
                    <span className="text-white fw-bold">
                        <span style={{ fontWeight: 'bold' }}>
                            {lowestPrice}
                        </span>
                    </span>
                    <button
                        className="btn btn-success fw-bold"
                        onClick={handleBuyNow}
                        disabled={
                            event.status === 'event_over' || !isAuthenticated
                        }
                        style={{
                            backgroundColor:
                                event.status === 'event_over' ||
                                !isAuthenticated
                                    ? '#ccc'
                                    : '',
                        }}
                    >
                        {event.status === 'event_over'
                            ? 'Sự kiện đã kết thúc'
                            : !isAuthenticated
                            ? 'Đăng nhập để mua vé'
                            : 'Mua vé ngay'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default EventDetail;
