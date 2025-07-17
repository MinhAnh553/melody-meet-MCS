import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Register from '../components/Register';
import Login from '../components/Login';

function ClientLayout() {
    const location = useLocation();

    // Ẩn footer khi đường dẫn chứa /bookings/
    const shouldHideFooter =
        location.pathname.includes('/bookings/') ||
        location.pathname.includes('/user/upgrade');
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <Register />
            <Login />
            {!shouldHideFooter && <Footer />}
        </>
    );
}

export default ClientLayout;
