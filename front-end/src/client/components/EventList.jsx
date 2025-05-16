import React from 'react';
import { useNavigate } from 'react-router-dom';

const EventList = ({ events, type = 'special' }) => {
    const navigate = useNavigate();

    const formatCurrency = (price) => {
        return price.toLocaleString('vi-VN') + 'đ';
    };

    return (
        <div className="row g-4">
            {events.length === 0 ? (
                <p className="text-center w-100">Đang cập nhật...</p>
            ) : (
                events.map((event, index) => {
                    // Sắp xếp giá vé từ thấp đến cao
                    const sortedTickets = [...event.ticketTypes].sort(
                        (a, b) => a.price - b.price,
                    );
                    const lowestPrice =
                        sortedTickets.length > 0
                            ? sortedTickets[0].price === 0
                                ? 'Miễn phí'
                                : `Từ ${formatCurrency(sortedTickets[0].price)}`
                            : 'Miễn phí';

                    return (
                        <div
                            className="event-card col-6 col-md-4 col-lg-3"
                            key={event._id}
                            onClick={() => navigate(`/event/${event._id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="position-relative">
                                <img
                                    src={event.background}
                                    alt={event.name}
                                    style={{
                                        width: '100%',
                                        height: '50%',
                                        objectFit: 'contain',
                                    }}
                                />

                                {type === 'trending' && (
                                    <div
                                        className="position-absolute top-0 start-0 bg-warning text-white fw-bold rounded-end px-2 py-1 small"
                                        style={{
                                            fontSize: '35px',
                                            lineHeight: '1',
                                            zIndex: 2,
                                            paddingLeft: '10px',
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                )}

                                {event.status === 'event_over' && (
                                    <div
                                        className="position-absolute top-0 end-0 bg-warning text-white fw-bold rounded-end px-2 py-1 small"
                                        style={{
                                            borderRadius: '0px 12px',
                                            width: 'max-content',
                                            zIndex: 2,
                                            fontSize: '10px',
                                            lineHeight: '15px',
                                        }}
                                    >
                                        Đã diễn ra
                                    </div>
                                )}
                            </div>
                            <div className="event-content bg-dark text-white">
                                <h3>{event.name}</h3>
                                <p className="date text-white">
                                    <i className="bi bi-calendar3" />{' '}
                                    {new Date(
                                        event.startTime,
                                    ).toLocaleDateString('vi-VN', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                                <p
                                    className="location text-white text-truncate"
                                    style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    <i className="bi bi-geo-alt" />{' '}
                                    {event.location.venueName}
                                </p>

                                <p
                                    className="price"
                                    style={{ color: 'rgb(45, 194, 117)' }}
                                >
                                    <i className="bi bi-tag" /> {lowestPrice}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default EventList;
