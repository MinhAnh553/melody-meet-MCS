import { rolesPermissions } from '../config/rbacConfig';

export const usePermission = (userRole) => {
    const hasPermission = (permission) => {
        const allowedPermissions = rolesPermissions[userRole] || [];
        return allowedPermissions.includes(permission);
    };

    return { hasPermission };
};
