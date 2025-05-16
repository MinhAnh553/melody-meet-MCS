// EventFormContext.js
import React, { createContext, useState } from 'react';

export const EventFormContext = createContext();

export const EventFormProvider = ({ children }) => {
    const [eventName, setEventName] = useState('');
    const [eventLogo, setEventLogo] = useState(null);
    const [eventBackground, setEventBackground] = useState(null);
    const [addressData, setAddressData] = useState({
        venueName: '',
        province: '',
        district: '',
        ward: '',
        address: '',
    });
    const [description, setDescription] = useState('');
    const [organizerLogo, setOrganizerLogo] = useState(null);
    const [organizerName, setOrganizerName] = useState('');
    const [organizerInfo, setOrganizerInfo] = useState('');

    const contextValue = {
        eventName,
        setEventName,
        eventLogo,
        setEventLogo,
        eventBackground,
        setEventBackground,
        addressData,
        setAddressData,
        description,
        setDescription,
        organizerLogo,
        setOrganizerLogo,
        organizerName,
        setOrganizerName,
        organizerInfo,
        setOrganizerInfo,
    };

    return (
        <EventFormContext.Provider value={contextValue}>
            {children}
        </EventFormContext.Provider>
    );
};
