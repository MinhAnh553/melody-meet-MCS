import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css'; // CSS Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'; // Icons Bootstrap
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // JS Bootstrap
import './assets/css/global.css';

import { AuthProvider } from './client/context/AuthContext.jsx';
import AnimatedRoutes from './router/routes.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <Router>
        <AuthProvider>
            <AnimatedRoutes />
        </AuthProvider>
    </Router>,
);
