export const roles = {
    CLIENT: 'client',
    ORGANIZER: 'organizer',
    ADMIN: 'admin',
};

export const permissions = {
    VIEW_ORGANIZERS: 'view_organizers',
    VIEW_ADMIN: 'view_admin',
    // VIEW_CREATE_EVENT: 'view_create_event',
    // VIEW_ANALYTICS: 'view_analytics',
    // CREATE_EVENT: 'create_event',
    // READ_EVENT: 'read_event',
    // UPDATE_EVENT: 'update_event',
    // DELETE_EVENT: 'delete_event',
    // CREATE_USER: 'create_user',
    // READ_USER: 'read_user',
    // UPDATE_USER: 'update_user',
    // DELETE_USER: 'delete_user',
    // CREATE_ORGANIZER: 'create_organizer',
    // READ_ORGANIZER: 'read_organizer',
    // UPDATE_ORGANIZER: 'update_organizer',
    // DELETE_ORGANIZER: 'delete_organizer',
    // CREATE_ADMIN: 'create_admin',
    // READ_ADMIN: 'read_admin',
    // UPDATE_ADMIN: 'update_admin',
    // DELETE_ADMIN: 'delete_admin',
};

export const rolesPermissions = {
    [roles.CLIENT]: [],
    [roles.ORGANIZER]: [permissions.VIEW_ORGANIZERS],
    [roles.ADMIN]: Object.values(permissions), // Admin has all permissions
};
