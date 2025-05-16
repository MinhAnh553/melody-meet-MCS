import React, { useEffect, useState } from 'react';
import api from '../../../util/api';
import EventList from '../../components/EventList';

const AllEvents = () => {
    const [loadingLocal, setLoadingLocal] = useState(true);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);
    const fetchEvents = async () => {
        setLoadingLocal(true);
        try {
            const res = await api.getEvents('all');
            return res.success ? setEvents(res.events) : [];
        } catch (error) {
            console.log(`fetchEvents() -> error:`, error);
        } finally {
            setLoadingLocal(false);
        }
    };
    return loadingLocal ? (
        <section className="events py-4" style={{ marginTop: '80px' }}>
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2">Đang tải...</p>
            </div>
        </section>
    ) : (
        <section
            className="events py-4 container"
            style={{ marginTop: '80px' }}
        >
            <EventList events={events} />
        </section>
    );
};

export default AllEvents;
