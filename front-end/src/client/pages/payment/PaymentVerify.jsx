import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../util/api';
import LoadingSpinner from '../../../client/components/loading/LoadingSpinner';

import 'bootstrap/dist/css/bootstrap.min.css';

function PaymentVerify() {
    const { orderId, eventId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const verifyAndRedirect = async () => {
            if (!orderId) return;

            const query = Object.fromEntries(
                new URLSearchParams(location.search),
            );

            try {
                const res = await api.verifyReturnUrl(orderId, query);
                if (res.success && res.status === 'PAID') {
                    navigate(
                        `/event/${eventId}/bookings/${orderId}/payment-success`,
                    );
                } else {
                    navigate(
                        `/event/${eventId}/bookings/${orderId}/payment-info`,
                    );
                }
            } catch (err) {
                console.error('[PaymentVerify] Error verifying payment:', err);
                navigate('/');
            }
        };

        verifyAndRedirect();
    }, [orderId, location.search]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <LoadingSpinner content="Đang xử lý" />
        </div>
    );
}

export default PaymentVerify;
