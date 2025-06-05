import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import swalCustomize from '../../util/swalCustomize';
import api from '../../util/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                const res = await api.getAccount();
                setUser(res.user);
                localStorage.setItem('userInfo', JSON.stringify(res.user));
            }
        };

        fetchUserData();
    }, []);

    const login = async (res) => {
        setUser(res.user);

        document
            .querySelector('.btn-close.form-login[data-bs-dismiss="modal"]')
            ?.click();

        document.querySelector('.modal-backdrop')?.remove();
        document.body.classList.remove('modal-open');
        document.body.style = '';

        localStorage.setItem('accessToken', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(res.user));

        swalCustomize.Toast.fire({
            icon: 'success',
            title: res?.message,
        });
    };

    const logout = async () => {
        // Xóa thông tin user trước
        setUser(null);

        // Sau đó xóa các token và thông tin khác
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');

        // Hiển thị thông báo
        swalCustomize.Toast.fire({
            icon: 'success',
            title: 'Đăng xuất thành công!',
        });

        // Cuối cùng mới navigate
        navigate('/', { replace: true });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
