import { useAuth } from '../../client/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

import swalCustomize from '../../util/swalCustomize';

const ProtectedAdminRoute = () => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return;

    if (!isAuthenticated || user?.role !== 'admin') {
        swalCustomize.Toast.fire({
            icon: 'error',
            title: 'Không đủ quyền hạn!',
        });
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedAdminRoute;
