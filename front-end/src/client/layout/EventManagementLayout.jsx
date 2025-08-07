import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';

import SidebarEvent from '../components/SidebarEvent';
import HeaderEvent from '../components/HeaderEvent';

const EventManagement = () => {
    const { eventId } = useParams();
    const location = useLocation();
    const [nameEvent, setNameEvent] = useState('');

    // useEffect(() => {
    //     const fetchEvent = async () => {
    //         try {
    //             const res = await api.getEventById(eventId);
    //             if (res.success) {
    //                 setNameEvent(res.event.name);
    //             }
    //         } catch (error) {
    //             console.error('Lỗi khi lấy dữ liệu doanh thu:', error);
    //         }
    //     };
    //     if (eventId) fetchEvent();
    // }, [eventId]);

    return (
        <div
            className="d-flex flex-column flex-md-row min-vh-100"
            style={{ background: '#27272a' }}
        >
            <div
                className="flex-shrink-0 bg-dark text-white d-none d-md-block"
                style={{ width: '250px' }}
            >
                <SidebarEvent />
            </div>

            <div className="flex-grow-1">
                <main style={{ maxWidth: '100%', background: '#27272a' }}>
                    {/* HeaderEvent hiển thị nếu không phải trang tạo/sửa */}
                    {location.pathname !== '/organizer/event/create' &&
                        location.pathname !==
                            `/organizer/event/${eventId}/edit` && (
                            <HeaderEvent name={nameEvent} />
                        )}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default EventManagement;
