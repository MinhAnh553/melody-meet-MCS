import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import swalCustomize from '../../util/swalCustomize';

const ProtectedRoute = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) return;

    // Kiểm tra đăng nhập trước
    if (!isAuthenticated) {
        swalCustomize.Toast.fire({
            icon: 'error',
            title: 'Vui lòng đăng nhập!',
        });
        return <Navigate to="/" replace />;
    }

    // Sau đó mới kiểm tra role cho route /organizer
    if (location.pathname.startsWith('/organizer')) {
        if (user?.role !== 'organizer') {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: 'Bạn không có quyền truy cập vào trang này!',
            });
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
