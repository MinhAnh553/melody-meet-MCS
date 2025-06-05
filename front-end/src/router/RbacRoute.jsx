import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { roles } from '../config/rbacConfig';

function RbacRoute({ requiredPermission, redirectTo = '/access-denied' }) {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const userRole = user?.role || roles.CLIENT;
    const { hasPermission } = usePermission(userRole);

    if (!hasPermission(requiredPermission)) {
        return <Navigate to={redirectTo} replace={true} />;
    }

    return <Outlet />;
}

export default RbacRoute;
