import React from 'react';

const LoadingSpinner = ({ content = 'Đang tải dữ liệu' }) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
            }}
        >
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{content}...</span>
            </div>
            <p className="mt-2">{content}...</p>
        </div>
    );
};

export default LoadingSpinner;
