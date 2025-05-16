import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Register from '../components/Register';
import Login from '../components/Login';

function ClientLayout() {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <Register />
            <Login />
            <Footer />
        </>
    );
}

export default ClientLayout;
