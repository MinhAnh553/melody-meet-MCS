import React from 'react';
import '../../styles/LoadingButton.css';

const LoadingButton = ({ loading, children, ...props }) => {
    return (
        <button {...props} disabled={loading}>
            {loading ? (
                <span className="loading-text">
                    {children}
                    <span className="ellipsis">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </span>
            ) : (
                children
            )}
        </button>
    );
};

export default LoadingButton;
