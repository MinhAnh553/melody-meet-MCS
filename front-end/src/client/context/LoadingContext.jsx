import React, { createContext, useContext, useState } from 'react';

// Tạo context
const LoadingContext = createContext();

// Provider để quản lý trạng thái loading
export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    const showLoading = () => setLoading(true);
    const hideLoading = () => setLoading(false);

    return (
        <LoadingContext.Provider value={{ loading, showLoading, hideLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

// Hook để sử dụng LoadingContext
export const useLoading = () => useContext(LoadingContext);
