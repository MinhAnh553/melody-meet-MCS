import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

import swalCustomize from '../../util/swalCustomize';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return;
    if (!isAuthenticated) {
        swalCustomize.Toast.fire({
            icon: 'error',
            title: 'Vui lòng đăng nhập!',
        });

        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
