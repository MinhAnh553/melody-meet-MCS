import React from 'react';

const TimeText = ({ event }) => {
    function formatTime(date) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function formatDate(date) {
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    function formatDateTime(date) {
        return `${formatTime(date)}, ${formatDate(date)}`;
    }

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    const isSameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    let timeText = '';
    if (isSameDay) {
        timeText = `${formatTime(start)} - ${formatTime(end)}, ${formatDate(
            start,
        )}`;
    } else {
        timeText = `${formatDateTime(start)} - ${formatDateTime(end)}`;
    }
    return <>{timeText}</>;
};

export default TimeText;
