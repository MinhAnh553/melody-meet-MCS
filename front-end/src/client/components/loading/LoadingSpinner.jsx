import React from 'react';

const LoadingSpinner = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                // color: '#6c757d',
            }}
        >
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải dữ liệu...</span>
            </div>
            <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
    );
};

export default LoadingSpinner;
