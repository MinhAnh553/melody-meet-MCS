import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Register from '../components/Register';
import Login from '../components/Login';
import { useEffect, useState } from 'react';
import { BsArrowUpCircle } from 'react-icons/bs';

function ClientLayout() {
    const location = useLocation();
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
            {showScrollTop && (
                <button
                    onClick={handleScrollToTop}
                    style={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        zIndex: 9999,
                        background: 'rgba(30,30,30,0.85)',
                        border: 'none',
                        borderRadius: '50%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        padding: 12,
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: 32,
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    title="Đầu trang"
                >
                    <BsArrowUpCircle />
                </button>
            )}
        </>
    );
}

export default ClientLayout;
