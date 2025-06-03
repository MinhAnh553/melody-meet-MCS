import React, {
    createContext,
    useReducer,
    useEffect,
    useContext,
    useCallback,
    useState,
} from 'react';
import swalCustomize from '../../util/swalCustomize';
import api from '../../util/api';
import { useLoading } from './LoadingContext'; // Import LoadingContext

const AuthContext = createContext();

// Action types
const LOGIN = 'LOGIN';
const LOGOUT = 'LOGOUT';
const UPDATE_USER = 'UPDATE_USER';

// Reducer để quản lý trạng thái auth
const authReducer = (state, action) => {
    switch (action.type) {
        case LOGIN:
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
            };
        case LOGOUT:
            return {
                ...state,
                isAuthenticated: false,
                user: null,
            };
        case UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload },
            };
        default:
            return state;
    }
};

// Trạng thái mặc định
const initialState = {
    isAuthenticated: false,
    user: null,
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const { showLoading, hideLoading } = useLoading();
    const [loading, setLoading] = useState(true);

    // Fetch user khi tải lại trang
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    dispatch({ type: LOGOUT });
                    setLoading(false);
                    return;
                }

                const res = await api.getAccount();
                if (res.success) {
                    dispatch({
                        type: LOGIN,
                        payload: {
                            id: res.user._id,
                            name: res.user.name,
                            phone: res.user.phone,
                            email: res.user.email,
                            role: res.user.role,
                            address: res.user.address,
                        },
                    });
                } else {
                    dispatch({ type: LOGOUT });
                }
            } catch (error) {
                console.error(error);
                dispatch({ type: LOGOUT });
            } finally {
                setTimeout(() => {
                    setLoading(false);
                }, 300);
                // setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Hàm login tối ưu với useCallback
    const login = useCallback(async (email, password) => {
        showLoading();
        try {
            const res = await api.login(email, password);
            if (res.success) {
                localStorage.setItem('access_token', res.accessToken);
                dispatch({
                    type: LOGIN,
                    payload: {
                        id: res.user.id,
                        name: res.user.name,
                        phone: res.user.phone,
                        email: res.user.email,
                        address: res.user.address,
                        role: res.user.role,
                    },
                });

                // Đóng modal đăng nhập nếu có
                document
                    .querySelector(
                        '.btn-close.form-login[data-bs-dismiss="modal"]',
                    )
                    ?.click();
            } else {
                setTimeout(() => {
                    swalCustomize.Toast.fire({
                        icon: 'error',
                        title: res.message || 'Đăng nhập không thành công',
                    });
                }, 100);
            }
        } catch (error) {
            swalCustomize.Toast.fire({
                icon: 'error',
                title: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
            });
        } finally {
            document.querySelector('.modal-backdrop')?.remove();
            document.body.classList.remove('modal-open');
            document.body.style = '';
            hideLoading();
        }
    }, []);

    // Hàm logout tối ưu với useCallback
    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        dispatch({ type: LOGOUT });
        setTimeout(() => {
            swalCustomize.Toast.fire({
                icon: 'success',
                title: 'Đăng xuất thành công',
            });
        }, 100);
    }, []);

    const updateUser = (updatedUserData) => {
        dispatch({
            type: UPDATE_USER,
            payload: updatedUserData,
        });
    };

    return (
        <AuthContext.Provider
            value={{ ...state, login, logout, updateUser, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
