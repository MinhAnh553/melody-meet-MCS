import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css'; // CSS Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'; // Icons Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // JS Bootstrap
import './assets/css/global.css';

import { AuthProvider } from './client/context/AuthContext.jsx';
import { LoadingProvider } from './client/context/LoadingContext.jsx';
import AnimatedRoutes from './router/routes.jsx';
import LoadingSpinner from './client/components/loading/LoadingSpinner.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <LoadingProvider>
        <AuthProvider>
            <Router>
                <AnimatedRoutes />
                <LoadingSpinner />
            </Router>
        </AuthProvider>
    </LoadingProvider>,
);
