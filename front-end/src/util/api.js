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

const createEvent = (data) => {
    const URL_API = `${API_URL}/events/create`;
    return axios.post(URL_API, data);
};

const getMyEvents = (page = 1, limit = 10, status = 'approved', searchKey) => {
    const URL_API = `${API_URL}/events/my?query=${searchKey}&page=${page}&limit=${limit}&status=${status}`;
    return axios.get(URL_API);
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

const createOrder = (data) => {
    const URL_API = `${API_URL}/orders/create`;
    return axios.post(URL_API, data);
};

const updateStatusEvent = (eventId, data) => {
    const URL_API = `${API_URL}/event/update/${eventId}/status`;
    return axios.patch(URL_API, { status: data });
};

const getAllEvents = () => {
    const URL_API = `${API_URL}/event/all-events`;
    return axios.get(URL_API);
};

const updateUser = (userId, data) => {
    const URL_API = `${API_URL}/user/update/${userId}`;
    return axios.patch(URL_API, data);
};

const cancelOrder = (id) => {
    const URL_API = `${API_URL}/order/cancel`;
    return axios.post(URL_API, id);
};

const getOrder = (id) => {
    const URL_API = `${API_URL}/order/${id}`;
    return axios.get(URL_API);
};

const updateStatusOrder = (orderId, data) => {
    const URL_API = `${API_URL}/order/update/${orderId}/status`;
    return axios.patch(URL_API, { status: data });
};

const selectPayment = (id, method) => {
    const URL_API = `${API_URL}/order/${id}/select-payment?method=${method}`;
    return axios.post(URL_API);
};

const checkOrder = (data) => {
    const URL_API = `${API_URL}/order/check-order`;
    return axios.post(URL_API, data);
};

const getOrderByOrderId = (orderId) => {
    const URL_API = `${API_URL}/order/success/${orderId}`;
    return axios.get(URL_API);
};

const getMyOrders = () => {
    const URL_API = `${API_URL}/order/my`;
    return axios.get(URL_API);
};

const getOrderTickets = (id) => {
    const URL_API = `${API_URL}/order/ticket/${id}`;
    return axios.get(URL_API);
};

const getAllOrders = () => {
    const URL_API = `${API_URL}/order/all-orders`;
    return axios.get(URL_API);
};

const getOrdersByEventId = (id) => {
    const URL_API = `${API_URL}/event/${id}/orders`;
    return axios.get(URL_API);
};

const getEventSummary = (id) => {
    const URL_API = `${API_URL}/event/${id}/summary`;
    return axios.get(URL_API);
};

const search = (searchQuery) => {
    const URL_API = `${API_URL}/event/search?query=${searchQuery}`;
    return axios.get(URL_API);
};

const getAllUsers = () => {
    const URL_API = `${API_URL}/user/all-users`;
    return axios.get(URL_API);
};

const getDashboard = () => {
    const URL_API = `${API_URL}/admin/dashboard`;
    return axios.get(URL_API);
};

const refreshToken = (refreshToken) => {
    const URL_API = `${API_URL}/auth/refresh-token`;
    return axios.post(URL_API, { refreshToken });
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
    checkOrder,
    updateStatusOrder,
    getOrderByOrderId,
    getMyOrders,
    getOrderTickets,
    getMyEvents,
    getOrdersByEventId,
    getEventSummary,
    getAllOrders,
    getAllUsers,
    getDashboard,
    search,
    refreshToken,
};
