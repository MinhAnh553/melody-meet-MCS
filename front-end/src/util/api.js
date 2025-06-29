import axios from './axiosCustomize';

const API_URL = '/v1';

const sendOTP = (data) => {
    const URL_API = `${API_URL}/auth/register/send-code`;

    return axios.post(URL_API, data);
};

const verifyOTPAndRegister = (email, otp, password) => {
    const URL_API = `${API_URL}/auth/register/verify`;
    const data = {
        email,
        code: otp,
        password,
    };

    return axios.post(URL_API, data);
};

const login = (email, password) => {
    const URL_API = `${API_URL}/auth/login`;
    const data = {
        email,
        password,
    };

    return axios.post(URL_API, data);
};

const getAccount = () => {
    const URL_API = `${API_URL}/auth/account`;

    return axios.get(URL_API);
};

const refreshToken = async (refreshToken) => {
    const URL_API = `${API_URL}/auth/refresh_token`;
    return await axios.put(URL_API, { refreshToken });
};

const getEventById = (id) => {
    const URL_API = `${API_URL}/events/${id}`;
    return axios.get(URL_API);
};

const getEventByIdToEdit = (id) => {
    const URL_API = `${API_URL}/events/${id}/edit`;
    return axios.get(URL_API);
};

const updateEvent = (eventId, data) => {
    const URL_API = `${API_URL}/events/update/${eventId}`;
    return axios.patch(URL_API, data);
};

const getEvents = (type, status = 'approved') => {
    const URL_API = `${API_URL}/events?type=${type}&status=${status}`;
    return axios.get(URL_API);
};

const updateUserAddress = (data) => {
    const URL_API = `${API_URL}/auth/user/update-address`;
    return axios.patch(URL_API, data);
};

const createOrder = (eventId, data) => {
    const URL_API = `${API_URL}/events/order/${eventId}`;
    return axios.post(URL_API, data);
};

const search = (searchQuery) => {
    const URL_API = `${API_URL}/events/search?query=${searchQuery}`;
    return axios.get(URL_API);
};

const getOrder = (id) => {
    const URL_API = `${API_URL}/orders/${id}`;
    return axios.get(URL_API);
};

const cancelOrder = (id) => {
    const URL_API = `${API_URL}/orders/cancel`;
    return axios.post(URL_API, id);
};

const selectPayment = (id, method) => {
    const URL_API = `${API_URL}/orders/${id}/select-payment?method=${method}`;
    return axios.get(URL_API);
};

const getOrderByOrderCode = (orderCode) => {
    const URL_API = `${API_URL}/orders/order-code/${orderCode}`;
    return axios.get(URL_API);
};

const checkStatusOrder = (id) => {
    const URL_API = `${API_URL}/orders/${id}/check-status`;
    return axios.get(URL_API);
};

const getMyOrders = () => {
    const URL_API = `${API_URL}/orders/my`;
    return axios.get(URL_API);
};

// organizer
const createEvent = (data) => {
    const URL_API = `${API_URL}/events/organizer/create`;
    return axios.post(URL_API, data);
};

const getMyEvents = (page = 1, limit = 10, status = 'approved', searchKey) => {
    const URL_API = `${API_URL}/events/organizer/my?query=${searchKey}&page=${page}&limit=${limit}&status=${status}`;
    return axios.get(URL_API);
};

const getEventSummary = (id) => {
    const URL_API = `${API_URL}/events/organizer/${id}/summary`;
    return axios.get(URL_API);
};

const getOrdersByEventId = (id) => {
    const URL_API = `${API_URL}/orders/event/${id}`;
    return axios.get(URL_API);
};

// admin
const getDashboard = () => {
    const URL_API = `${API_URL}/orders/dashboard`;
    return axios.get(URL_API);
};

const getAllEvents = (params) => {
    const URL_API = `${API_URL}/events/admin/all-events`;
    return axios.get(URL_API, { params });
};

const updateStatusEvent = (eventId, data) => {
    const URL_API = `${API_URL}/events/admin/update/${eventId}/status`;
    return axios.put(URL_API, data);
};

const getAllOrders = (params) => {
    const URL_API = `${API_URL}/orders/admin/all-orders`;
    return axios.get(URL_API, { params });
};

const updateStatusOrder = (orderId, data) => {
    const URL_API = `${API_URL}/orders/admin/update/${orderId}/status`;
    return axios.patch(URL_API, { status: data });
};

const getAllUsers = (params) => {
    const URL_API = `${API_URL}/auth/users/admin/all-users`;
    return axios.get(URL_API, { params });
};

const updateUser = (userId, data) => {
    const URL_API = `${API_URL}/auth/users/update/${userId}`;
    return axios.patch(URL_API, data);
};

// Search events nâng cao
const searchEvents = (filters) => {
    const params = {};
    if (filters.searchTerm) params.query = filters.searchTerm;
    if (filters.date) {
        if (Array.isArray(filters.date) && filters.date[0] && filters.date[1]) {
            params.startDate = filters.date[0].toISOString().slice(0, 10);
            params.endDate = filters.date[1].toISOString().slice(0, 10);
        } else if (filters.date instanceof Date) {
            params.date = filters.date.toISOString().slice(0, 10);
        }
    }
    if (filters.location) params.location = filters.location;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    const URL_API = `${API_URL}/events/search`;
    return axios.get(URL_API, { params });
};

// Review APIs
const createReview = (data) => {
    const URL_API = `${API_URL}/events/reviews/create`;
    return axios.post(URL_API, data);
};

const getEventReviews = (eventId, page = 1, limit = 10) => {
    const URL_API = `${API_URL}/events/reviews/event/${eventId}?page=${page}&limit=${limit}`;
    return axios.get(URL_API);
};

const getEventReviewStats = (eventId) => {
    const URL_API = `${API_URL}/events/reviews/event/${eventId}/stats`;
    return axios.get(URL_API);
};

const getMyReviews = (page = 1, limit = 10) => {
    const URL_API = `${API_URL}/events/reviews/my-reviews?page=${page}&limit=${limit}`;
    return axios.get(URL_API);
};

const updateReview = (reviewId, data) => {
    const URL_API = `${API_URL}/events/reviews/${reviewId}`;
    return axios.put(URL_API, data);
};

const deleteReview = (reviewId) => {
    const URL_API = `${API_URL}/events/reviews/${reviewId}`;
    return axios.delete(URL_API);
};

const checkEventReview = (eventId) => {
    const URL_API = `${API_URL}/events/reviews/check-event/${eventId}`;
    return axios.get(URL_API);
};

export default {
    sendOTP,
    verifyOTPAndRegister,
    login,
    getAccount,
    createEvent,
    updateStatusEvent,
    updateEvent,
    getEventById,
    getEventByIdToEdit,
    getEvents,
    getAllEvents,
    updateUserAddress,
    updateUser,
    createOrder,
    cancelOrder,
    getOrder,
    selectPayment,
    checkStatusOrder,
    updateStatusOrder,
    getOrderByOrderCode,
    getMyOrders,
    getMyEvents,
    getOrdersByEventId,
    getEventSummary,
    getAllOrders,
    getAllUsers,
    getDashboard,
    search,
    searchEvents,
    refreshToken,
    // Review APIs
    createReview,
    getEventReviews,
    getEventReviewStats,
    getMyReviews,
    updateReview,
    deleteReview,
    checkEventReview,
};
