// Format currency to Vietnamese Dong (VND)
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format date to Vietnamese format (DD/MM/YYYY)
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
};

// Format date and time
export const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength
        ? text.substring(0, maxLength) + '...'
        : text;
};

// Format event status for display
export const formatEventStatus = (status) => {
    switch (status) {
        case 'approved':
            return 'Đã duyệt';
        case 'pending':
            return 'Đang chờ duyệt';
        case 'rejected':
            return 'Đã từ chối';
        default:
            return status;
    }
};

// Format order status for display
export const formatOrderStatus = (status) => {
    switch (status) {
        case 'completed':
            return 'Hoàn thành';
        case 'pending':
            return 'Đang xử lý';
        case 'cancelled':
            return 'Đã hủy';
        default:
            return status;
    }
};

// Format payment status for display
export const formatPaymentStatus = (status) => {
    switch (status) {
        case 'completed':
            return 'Đã thanh toán';
        case 'pending':
            return 'Chờ thanh toán';
        case 'failed':
            return 'Thanh toán thất bại';
        default:
            return status;
    }
};

// Format user role for display
export const formatUserRole = (role) => {
    switch (role) {
        case 'admin':
            return 'Quản trị viên';
        case 'organizer':
            return 'Nhà tổ chức';
        case 'user':
            return 'Người dùng';
        default:
            return role;
    }
};

// Format ticket status for display
export const formatTicketStatus = (sold, available, quantity) => {
    if (available === 0 && sold === quantity) {
        return 'Đã bán hết';
    } else if (sold > 0) {
        return 'Đã bán một phần';
    } else {
        return 'Có sẵn';
    }
};

// Generate avatar initials from name
export const getInitials = (name) => {
    if (!name) return '';
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// Format percentage
export const formatPercentage = (value, total) => {
    if (!total) return '0%';
    return Math.round((value / total) * 100) + '%';
};
