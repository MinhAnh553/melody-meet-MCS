import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoutes = () => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (!user) {
        return <Navigate to="/" replace={true} />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;
