import React, { createContext, useContext, useState } from 'react';
import { loadingProxy } from '../../util/loadingProxy';

// Tạo context
const LoadingContext = createContext();

// Provider để quản lý trạng thái loading
export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    loadingProxy.register(setIsLoading);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
